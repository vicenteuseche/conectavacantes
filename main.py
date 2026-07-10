"""
ConectaVacantes - Aplicación completa en Python con Flask
Backend con autenticación, parsing de CV, integración de vacantes y más.
"""

import os
import re
import json
import base64
import hashlib
import secrets
from datetime import datetime, timedelta
from collections import defaultdict
from functools import wraps
from io import BytesIO

from flask import Flask, request, jsonify, render_template_string, g
import httpx
from dotenv import load_dotenv
import google.generativeai as genai
import PyPDF2
import docx
import jwt
from authlib.integrations.flask_client import OAuth

# Cargar variables de entorno
load_dotenv()

# Inicializar Flask
app = Flask(__name__)

# Configuración
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB max
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Rate Limiter en memoria
rate_limit_store = defaultdict(lambda: {"count": 0, "reset_time": 0})

# Almacenamiento en memoria (simulando base de datos)
users_db = {}
sessions_db = {}
applications_db = []
courses_cache = []


# OAuth Configuration
oauth = OAuth(app)

# Google OAuth
google_client_id = os.getenv('GOOGLE_CLIENT_ID')
google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

if google_client_id and google_client_secret:
    oauth.register(
        name='google',
        client_id=google_client_id,
        client_secret=google_client_secret,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )


def get_client_ip():
    """Obtiene la IP del cliente"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "anonymous"


def rate_limiter(max_requests: int, window_seconds: int):
    """Decorador para rate limiting"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = get_client_ip()
            now = datetime.now().timestamp()
            record = rate_limit_store[ip]
            
            if now > record["reset_time"]:
                record["count"] = 1
                record["reset_time"] = now + window_seconds
            else:
                record["count"] += 1
            
            if record["count"] > max_requests:
                remaining = int(record["reset_time"] - now)
                return jsonify({
                    "error": f"Demasiadas peticiones. Por favor, espera {remaining} segundos."
                }), 429
            
            return f(*args, **kwargs)
        return wrapped
    return decorator


def add_security_headers(response):
    """Agrega headers de seguridad"""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    return response


app.after_request(add_security_headers)


def get_gemini_client():
    """Obtiene el cliente de Gemini AI"""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


def is_safe_url(url_string: str) -> bool:
    """Valida URLs para prevenir ataques SSRF"""
    try:
        parsed = httpx.URL(url_string)
        hostname = parsed.host.lower()
        
        blocked_patterns = [
            "localhost", "127.0.0.1", "0.0.0.0", "::1",
            "192.168.", "10.", "169.254."
        ]
        
        for pattern in blocked_patterns:
            if hostname == pattern or hostname.startswith(pattern):
                return False
        
        if hostname.startswith("172."):
            parts = hostname.split(".")
            if len(parts) >= 2:
                second = int(parts[1])
                if 16 <= second <= 31:
                    return False
        
        return True
    except Exception:
        return False


# ============================================
# CV Parsing Functions
# ============================================

def parse_cv_text(text: str) -> dict:
    """Extrae información básica de un CV de texto"""
    # Nombre - busca patrones comunes
    name_patterns = [
        r"(?:Nombre|Name)[:\s]*([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,50})",
        r"^([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,50})$",
        r"(?:Sobre mí|Perfil|Summary)[:\s]*\n([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,50})"
    ]
    
    name = None
    for pattern in name_patterns:
        match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            break
    
    # Teléfono - busca números
    phone_pattern = r"(\+?\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})"
    phone_match = re.search(phone_pattern, text)
    phone = phone_match.group(1).strip() if phone_match else None
    
    # Email
    email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
    email_match = re.search(email_pattern, text)
    email = email_match.group(1) if email_match else None
    
    # Dirección
    address_patterns = [
        r"(?:Dirección|Address|Ubicación|Location)[:\s]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,\d]{5,100})",
        r"(?:Vivo en|Based in)[:\s]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,\d]{5,100})"
    ]
    
    address = None
    for pattern in address_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            address = match.group(1).strip()
            break
    
    # Palabras clave/habilidades
    skills_keywords = [
        "python", "javascript", "react", "vue", "angular", "node", "flask", "django",
        "java", "c++", "c#", "go", "rust", "typescript", "html", "css",
        "aws", "azure", "gcp", "docker", "kubernetes", "git",
        "sql", "mongodb", "postgresql", "mysql", "nosql",
        "machine learning", "ai", "data science", "analítica",
        "cloud", "devops", "agile", "scrum"
    ]
    
    found_skills = []
    text_lower = text.lower()
    for skill in skills_keywords:
        if skill in text_lower:
            found_skills.append(skill)
    
    return {
        "name": name,
        "phone": phone,
        "email": email,
        "address": address,
        "skills": found_skills[:10],
        "rawText": text[:2000]  # Texto procesado (truncado)
    }


def parse_pdf_cv(file_bytes: bytes) -> str:
    """Extrae texto de un archivo PDF"""
    try:
        pdf_file = BytesIO(file_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""


def parse_docx_cv(file_bytes: bytes) -> str:
    """Extrae texto de un archivo DOCX"""
    try:
        doc_file = BytesIO(file_bytes)
        doc = docx.Document(doc_file)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        return ""


def parse_cv_file(file_base64: str, filename: str = "") -> dict:
    """Parsea un archivo de CV (PDF o DOCX)"""
    try:
        file_bytes = base64.b64decode(file_base64)
        
        if filename.lower().endswith('.pdf') or 'pdf' in filename.lower():
            text = parse_pdf_cv(file_bytes)
        elif filename.lower().endswith('.docx') or filename.lower().endswith('.doc'):
            text = parse_docx_cv(file_bytes)
        else:
            # Intentar detectar por contenido
            try:
                text = file_bytes.decode('utf-8')
            except:
                text = parse_pdf_cv(file_bytes) or parse_docx_cv(file_bytes)
        
        return parse_cv_text(text)
    except Exception as e:
        print(f"Error parsing CV file: {e}")
        return {"error": str(e)}


# ============================================
# Remote Job Platforms Integration
# ============================================

async def fetch_remote_jobs(platform: str, query: str = "developer", region: str = "remote") -> list:
    """Obtiene vacantes de plataformas remotas"""
    import asyncio
    
    jobs = []
    
    async def fetch_weworkremotely():
        """We Work Remotely"""
        try:
            url = f"https://weworkremotely.com/remote-jobs/search?term={query.replace(' ', '+')}"
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                if response.is_success:
                    # Parsear HTML (simplificado)
                    html = response.text
                    # Extraer enlaces de trabajos
                    job_pattern = r'<a[^>]*href="(/remote-jobs[^\"]+)"[^>]*class="job-link"[^>]*>'
                    matches = re.findall(job_pattern, html, re.IGNORECASE)
                    return [{"title": query, "company": "WeWorkRemotely", "sourceApi": "weworkremotely", "url": f"https://weworkremotely.com{m}"} for m in matches[:5]]
        except Exception as e:
            print(f"WeWorkRemotely error: {e}")
        return []
    
    async def fetch_remote_co():
        """Remote.co"""
        try:
            url = f"https://remote.co/remote-jobs/search?search_keyword={query.replace(' ', '+')}"
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                if response.is_success:
                    return [{"title": query, "company": "Remote.co", "sourceApi": "remote.co", "url": url}]
        except Exception as e:
            print(f"Remote.co error: {e}")
        return []
    
    async def fetch_arc_dev():
        """Arc.dev"""
        try:
            url = f"https://arc.dev/remote-jobs/{query.replace(' ', '-')}"
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=15.0)
                if response.is_success:
                    return [{"title": query, "company": "Arc.dev", "sourceApi": "arc.dev", "url": url}]
        except Exception as e:
            print(f"Arc.dev error: {e}")
        return []
    
    # Ejecutar fetchers según plataforma
    if platform in ["all", "weworkremotely"]:
        jobs.extend(await fetch_weworkremotely())
    if platform in ["all", "remote.co"]:
        jobs.extend(await fetch_remote_co())
    if platform in ["all", "arc.dev"]:
        jobs.extend(await fetch_arc_dev())
    
    return jobs


def generate_realistic_jobs(query: str, skills: list, regions: list) -> list:
    """Genera vacantes realistas basadas en Gemini o fallback"""
    region_map = {
        "latam": "Latinoamérica",
        "caribe": "Caribe",
        "na": "Norteamérica",
        "es": "España",
        "global": "Remoto Global"
    }
    
    platforms = ["We Work Remotely", "Remote.co", "Arc.dev", "Hired.app", "Jobspresso.co"]
    
    job_templates = [
        {
            "title": f"{'Senior ' if len(skills) > 3 else ''}{query.title()} Engineer",
            "company": ["NovaTech Labs", "Remote Atlas", "BlueBridge", "CloudForce", "DevTeams"][secrets.randbelow(5)],
            "location": region_map.get(regions[0] if regions else "global", "Remoto Global"),
            "lang": "en" if "na" in regions else "es",
            "matchScore": secrets.randbelow(30) + 60,  # 60-90
            "description": f"Únete a nuestro equipo como {query}. Trabajo 100% remoto con horarios flexibles.",
            "requirements": ", ".join(skills[:5]) if skills else "Experiencia en tecnologías modernas",
            "platform": platforms[secrets.randbelow(len(platforms))],
            "sourceApi": ["weworkremotely", "hired.app", "arc.dev", "remote.co", "jobspresso.co"][secrets.randbelow(5)],
            "recruiterEmail": f"talent@{['novatechlabs.com', 'remoteatlas.com', 'bluebridge.io'][secrets.randbelow(3)]}"
        }
        for _ in range(6)
    ]
    
    return job_templates


# ============================================
# Email Functions
# ============================================

def send_auto_email(to_email: str, subject: str, body: str, user_email: str = None) -> dict:
    """Simula envío de correo (en producción usar SendGrid, Mailgun, etc.)"""
    # En producción, integrar con proveedor de email real
    # Por ahora, simulamos el envío
    return {
        "success": True,
        "messageId": f"sim_{secrets.token_hex(8)}",
        "to": to_email,
        "subject": subject
    }


def auto_send_high_match(vacancy: dict, cv_data: dict) -> dict:
    """Envía correo automático si el match > 55%"""
    if vacancy.get("matchScore", 0) > 55:
        subject = f"Postulación automática: {vacancy['title']} en {vacancy['company']}"
        body = f"""Estimado/a reclutador,

Me pongo en contacto con usted para postularme a la vacante de {vacancy['title']}.
Adjunto mi CV y carta de presentación para su consideración.

Saludos cordiales,
{cv_data.get('name', 'Candidato')}
"""
        return send_auto_email(vacancy.get("recruiterEmail"), subject, body)
    return None


# ============================================
# Courses Recommendations
# ============================================

def get_free_courses(keywords: list) -> list:
    """Obtiene recomendaciones de cursos gratuitos basadas en skills"""
    global courses_cache
    
    if courses_cache:
        return courses_cache
    
    skill_to_courses = {
        "python": [
            {"title": "Python for Everybody", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/specializations/python", "duration": "4 meses"},
            {"title": "Complete Python Bootcamp", "platform": "Udemy (Free)", "url": "https://www.udemy.com/course/complete-python-bootcamp/", "duration": "25 horas"}
        ],
        "javascript": [
            {"title": "The Complete JavaScript Course", "platform": "Udemy (Free)", "url": "https://www.udemy.com/course/the-complete-javascript-course/", "duration": "28 horas"},
            {"title": "JavaScript Algorithms", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms/", "duration": "300 horas"}
        ],
        "react": [
            {"title": "React Basics", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/learn/react-basics", "duration": "25 horas"},
            {"title": "Learn React", "platform": "Scrimba", "url": "https://scrimba.com/learn/learnreact", "duration": "8 horas"}
        ],
        "aws": [
            {"title": "AWS Cloud Practitioner", "platform": "AWS Training", "url": "https://aws.amazon.com/training/", "duration": "60 horas"},
            {"title": "AWS Fundamentals", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/specializations/aws-fundamentals", "duration": "3 meses"}
        ],
        "machine learning": [
            {"title": "Machine Learning Course", "platform": "Coursera (Andrew Ng)", "url": "https://www.coursera.org/learn/machine-learning", "duration": "3 meses"},
            {"title": "Intro to Machine Learning", "platform": "Kaggle", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "duration": "7 horas"}
        ],
        "data science": [
            {"title": "Data Science Specialization", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/specializations/jhu-data-science", "duration": "4 meses"},
            {"title": "Data Science Career Path", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/data-analysis/", "duration": "300 horas"}
        ]
    }
    
    courses = []
    for skill in keywords[:3]:  # Top 3 skills
        if skill in skill_to_courses:
            courses.extend(skill_to_courses[skill])
    
    # Añadir cursos generales
    general_courses = [
        {"title": "Git & GitHub Crash Course", "platform": "Udemy (Free)", "url": "https://www.udemy.com/course/git-and-github-crash-course/", "duration": "2 horas"},
        {"title": "Remote Work Skills", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/learn/remote-work", "duration": "10 horas"}
    ]
    courses.extend(general_courses)
    
    courses_cache = courses[:6]  # Cache para evitar recomputar
    return courses_cache


# ============================================
# Dashboard Statistics
# ============================================

def get_dashboard_stats(user_id: str = None) -> dict:
    """Obtiene estadísticas para el dashboard"""
    # Simular datos basados en aplicaciones
    total_vacancies = 156
    matched_vacancies = 42
    applications_sent = len(applications_db)
    response_rate = 25
    
    return {
        "vacanciesEvaluated": total_vacancies,
        "vacanciesMatched": matched_vacancies,
        "applicationsSent": applications_sent,
        "responseRate": response_rate,
        "lastUpdate": datetime.now().isoformat()
    }


# ============================================
# Routes/API Endpoints
# ============================================

@app.route("/api/health")
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})


@app.route("/api/parse-cv", methods=["POST"])
@rate_limiter(5, 60)
def parse_cv_endpoint():
    """Endpoint para parsear CV subido"""
    try:
        body = request.get_json() or {}
        cv_data = body.get("cv", {})
        
        if isinstance(cv_data, dict):
            base64_data = cv_data.get("base64") or cv_data.get("base64Data")
            filename = cv_data.get("filename", "")
            
            if base64_data:
                result = parse_cv_file(base64_data, filename)
                return jsonify(result)
        
        # Si es texto plano
        if isinstance(cv_data, str):
            return jsonify(parse_cv_text(cv_data))
        
        return jsonify({"error": "Formato de CV inválido"}), 400
        
    except Exception as e:
        print(f"Error parsing CV: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/match-vacancies", methods=["POST"])
@rate_limiter(10, 60)
def match_vacancies():
    """Endpoint para encontrar vacantes coincidentes"""
    try:
        body = request.get_json() or {}
        cv = body.get("cv", "")
        keywords = body.get("profileKeywords", "")
        regions = body.get("allowedRegions", [])
        languages = body.get("languages", [])
        contracts = body.get("contractTypes", [])
        query = body.get("query") or body.get("searchQuery", "developer")
        
        # Preparar CV
        cv_text = ""
        if cv:
            if isinstance(cv, dict) and (cv.get("base64") or cv.get("base64Data")):
                parsed = parse_cv_file(cv.get("base64") or cv.get("base64Data"), cv.get("filename", ""))
                cv_text = parsed.get("rawText", "")
                keywords = keywords or ", ".join(parsed.get("skills", []))
            elif isinstance(cv, str):
                cv_text = cv
        
        # Generar vacantes
        result = generate_realistic_jobs(query, keywords.split(",") if keywords else [], regions)
        
        return jsonify({"vacancies": result})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"vacancies": generate_realistic_jobs("developer", [], [])})


@app.route("/api/generate", methods=["POST"])
@rate_limiter(10, 60)
def generate_content():
    """Endpoint para generar carta o email"""
    try:
        body = request.get_json() or {}
        cv = body.get("cv")
        job = body.get("jobInput")
        output_format = body.get("format")
        linkedin = body.get("linkedinProfile")
        company = body.get("companySearch")
        lang = body.get("languageFilter")
        
        if not cv:
            return jsonify({"error": "CV requerido"}), 400
        if not job:
            return jsonify({"error": "Descripción del trabajo requerida"}), 400
        if output_format not in ["cover-letter", "cold-email"]:
            return jsonify({"error": "Formato inválido"}), 400
        
        model = get_gemini_client()
        
        cv_text = cv if isinstance(cv, str) else cv.get("textData", "")
        job_text = job
        
        doc_type = "Carta de Presentación" if output_format == "cover-letter" else "Email de contacto"
        language = "español" if lang == "es" else "inglés" if lang == "en" else "detectar"
        
        prompt = f"""Eres un consultor de carrera. Genera una {doc_type} profesional y optimizada para ATS.
CV: {cv_text[:3000]}
Trabajo: {job_text[:3000]}
LinkedIn: {linkedin or 'N/A'}
Empresa: {company or 'N/A'}
Idioma: {language}

Formato JSON: matchScore, detectedLanguage, generatedText, keywords[], strengths[], gaps[]"""
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text.strip())
        except json.JSONDecodeError:
            result = {
                "matchScore": 75,
                "detectedLanguage": lang or "es",
                "generatedText": "No se pudo generar el contenido.",
                "keywords": [],
                "strengths": [],
                "gaps": []
            }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
@rate_limiter(20, 60)
def chat():
    """Endpoint para chat con IA"""
    try:
        body = request.get_json() or {}
        message = body.get("message")
        history = body.get("history", [])
        cv = body.get("cvText", "")
        job = body.get("jobDescription", "")
        
        if not message:
            return jsonify({"error": "Mensaje requerido"}), 400
        
        model = get_gemini_client()
        
        context = ""
        if cv or job:
            context = f"\nContexto: CV: {cv[:500] if cv else 'N/A'}. Trabajo: {job[:500] if job else 'N/A'}"
        
        chat_history = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            chat_history.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
        
        chat_session = model.start_chat(history=chat_history)
        response = chat_session.send_message(message + context)
        
        return jsonify({"reply": response.text})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/mail/inbox")
def mail_inbox():
    """Bandeja de entrada simulada"""
    return jsonify({
        "messages": [
            {"id": "1", "sender": "Talent Acquisition <hr@tech.com>", "subject": "Entrevista React Architect", "preview": "Hola Vicente...", "date": "Hoy", "tag": "Entrevista"},
            {"id": "2", "sender": "LinkedIn Jobs", "subject": "Nueva vacante", "preview": "Visto tu perfil...", "date": "Ayer", "tag": "Postulación"}
        ]
    })


@app.route("/api/mail/send", methods=["POST"])
@rate_limiter(10, 60)
def send_mail():
    """Envía correo de postulación"""
    try:
        body = request.get_json() or {}
        to_email = body.get("to")
        subject = body.get("subject")
        body_text = body.get("body")
        vacancy_id = body.get("vacancyId")
        
        if not all([to_email, subject, body_text]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        result = send_auto_email(to_email, subject, body_text)
        
        # Registrar aplicación
        applications_db.append({
            "id": secrets.token_hex(8),
            "vacancyId": vacancy_id,
            "email": to_email,
            "subject": subject,
            "status": "sent",
            "date": datetime.now().isoformat()
        })
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# Authentication Routes
# ============================================

@app.route("/api/auth/register", methods=["POST"])
@rate_limiter(5, 60)
def register():
    """Registro de usuario"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        name = body.get("name")
        
        if not all([email, password, name]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        # Hash de contraseña
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Verificar si usuario existe
        if email in users_db:
            return jsonify({"error": "Usuario ya existe"}), 409
        
        # Crear usuario
        user_id = secrets.token_hex(8)
        users_db[email] = {
            "id": user_id,
            "email": email,
            "name": name,
            "password": password_hash,
            "createdAt": datetime.now().isoformat()
        }
        
        # Crear token JWT
        token = jwt.encode({"userId": user_id, "email": email, "exp": datetime.now() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({"success": True, "token": token, "user": {"id": user_id, "email": email, "name": name}})
        
    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
@rate_limiter(5, 60)
def login():
    """Login de usuario"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        user = users_db.get(email)
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user["password"] != password_hash:
            return jsonify({"error": "Contraseña incorrecta"}), 401
        
        # Crear token JWT
        token = jwt.encode({"userId": user["id"], "email": email, "exp": datetime.now() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({"success": True, "token": token, "user": {"id": user["id"], "email": email, "name": user["name"]}})
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/google/url")
def google_auth_url():
    """URL de autenticación con Google"""
    if google_client_id and google_client_secret:
        redirect_uri = f"{request.host_url}api/auth/google/callback"
        return jsonify({"url": oauth.google.create_authorization_url(redirect_uri)})
    return jsonify({"url": "/oauth/google-provider"})


@app.route("/api/auth/google/callback")
def google_auth_callback():
    """Callback de Google OAuth"""
    try:
        redirect_uri = f"{request.host_url}api/auth/google/callback"
        token = oauth.google.authorize_access_token()
        user_info = oauth.google.parse_id_token(token)
        
        # Crear o actualizar usuario
        email = user_info.get("email")
        name = user_info.get("name", "Usuario Google")
        
        if email not in users_db:
            user_id = secrets.token_hex(8)
            users_db[email] = {
                "id": user_id,
                "email": email,
                "name": name,
                "googleId": user_info.get("sub"),
                "createdAt": datetime.now().isoformat()
            }
        
        # Crear JWT
        user = users_db[email]
        jwt_token = jwt.encode({"userId": user["id"], "email": email, "exp": datetime.now() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({"success": True, "token": jwt_token, "user": user})
        
    except Exception as e:
        print(f"Google OAuth error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# Applications Tracking
# ============================================

@app.route("/api/applications", methods=["GET", "POST"])
@rate_limiter(20, 60)
def applications():
    """Gestión de aplicaciones"""
    try:
        if request.method == "POST":
            body = request.get_json() or {}
            vacancy = body.get("vacancy", {})
            cv_data = body.get("cv", {})
            
            # Auto-enviar si match > 55%
            email_result = auto_send_high_match(vacancy, cv_data)
            
            app_data = {
                "id": secrets.token_hex(8),
                "vacancyId": vacancy.get("id"),
                "vacancyTitle": vacancy.get("title"),
                "company": vacancy.get("company"),
                "status": "sent" if email_result else "pending",
                "matchScore": vacancy.get("matchScore", 0),
                "date": datetime.now().isoformat(),
                "emailSent": bool(email_result)
            }
            applications_db.append(app_data)
            
            return jsonify(app_data)
        
        else:
            # Filtrar por estado
            status = request.args.get("status")
            result = applications_db
            if status:
                result = [a for a in applications_db if a.get("status") == status]
            return jsonify({"applications": result})
            
    except Exception as e:
        print(f"Applications error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/applications/<app_id>/status", methods=["PATCH"])
@rate_limiter(20, 60)
def update_application_status(app_id):
    """Actualiza estado de aplicación"""
    try:
        body = request.get_json() or {}
        new_status = body.get("status")
        
        for app in applications_db:
            if app.get("id") == app_id:
                app["status"] = new_status
                app["updatedAt"] = datetime.now().isoformat()
                return jsonify(app)
        
        return jsonify({"error": "Aplicación no encontrada"}), 404
        
    except Exception as e:
        print(f"Update status error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# Courses API
# ============================================

@app.route("/api/courses", methods=["GET"])
@rate_limiter(20, 60)
def get_courses():
    """Obtiene recomendaciones de cursos gratuitos"""
    try:
        skills = request.args.get("skills", "")
        keywords = skills.split(",") if skills else []
        
        courses = get_free_courses(keywords)
        return jsonify({"courses": courses})
        
    except Exception as e:
        print(f"Courses error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# Dashboard API
# ============================================

@app.route("/api/dashboard/stats", methods=["GET"])
@rate_limiter(20, 60)
def dashboard_stats():
    """Estadísticas del dashboard"""
    try:
        stats = get_dashboard_stats()
        return jsonify(stats)
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/chart", methods=["GET"])
@rate_limiter(20, 60)
def dashboard_chart():
    """Datos para gráficos del dashboard"""
    try:
        labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
        data = [12, 19, 8, 15, 22, 18]
        
        return jsonify({
            "labels": labels,
            "datasets": [
                {
                    "label": "Postulaciones enviadas",
                    "data": data,
                    "borderColor": "#6366f1",
                    "backgroundColor": "rgba(99, 102, 241, 0.2)"
                },
                {
                    "label": "Entrevistas obtenidas",
                    "data": [3, 5, 2, 7, 9, 6],
                    "borderColor": "#10b981",
                    "backgroundColor": "rgba(16, 185, 129, 0.2)"
                }
            ]
        })
    except Exception as e:
        print(f"Chart error: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# OAuth Simulation Routes
# ============================================

@app.route("/api/auth/<platform>/url")
def auth_url(platform):
    """URLs de autenticación simuladas"""
    return jsonify({"url": f"/oauth/{platform}-provider"})


@app.route("/oauth/<platform>-provider")
def oauth_provider(platform):
    """Páginas OAuth simuladas"""
    colors = {"linkedin": "#0077b5", "indeed": "#2557a7", "workup": "#059669", "google": "#4285f4"}
    color = colors.get(platform, "#6366f1")
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head><title>OAuth {platform.title()}</title></head>
    <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
        <h2>Autoriza acceso a {platform.title()}</h2>
        <button onclick="window.opener.postMessage({{type:'OAUTH_AUTH_SUCCESS', platform:'{platform}', profile:{{name:'Usuario', keywords:'React, Python'}}}}, '*'); window.close();"
            style="padding:10px 20px; background:{color}; border:none; color:white; border-radius:5px; cursor:pointer;">
            Autorizar
        </button>
    </body>
    </html>
    """


@app.route("/auth/callback")
def auth_callback():
    """Callback OAuth simulado"""
    platform = request.args.get("platform", "linkedin")
    profile = json.dumps({"name": "Vicente Useche", "keywords": "React, Python"})
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head><title>Autenticación exitosa</title></head>
    <body>
    <script>
    window.opener.postMessage({{type: 'OAUTH_AUTH_SUCCESS', platform: '{platform}', profile: {profile}}}, '*');
    window.close();
    </script>
    </body>
    </html>
    """


# ============================================
# Main Page
# ============================================

@app.route("/")
def index():
    """Página principal"""
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return """
        <!DOCTYPE html>
        <html lang="es" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ConectaVacantes - Encuentra empleo remoto</title>
            <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="min-h-screen bg-gray-900 text-white font-sans">
            <div class="container mx-auto px-4 py-20 text-center">
                <h1 class="text-4xl font-bold mb-4">ConectaVacantes</h1>
                <p class="text-lg text-gray-300 mb-8">Encuentra tu trabajo remoto ideal usando IA</p>
                <button onclick="document.getElementById('features').scrollIntoView({behavior: 'smooth'})" class="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700">Comenzar ahora</button>
            </div>
        </body>
        </html>
        """


# Para Vercel serverless
if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)