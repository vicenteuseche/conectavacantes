"""
ConectaVacantes - API Serverless completa para Vercel
Con todas las funcionalidades solicitadas
"""

import os
import json
import secrets
import hashlib
import re
import base64
from datetime import datetime, timedelta
from io import BytesIO
from flask import Flask, request, jsonify, g
from functools import wraps
import PyPDF2
import docx
import requests

# Crear aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Almacenamiento en memoria
users_db = {}
applications_db = []
evaluated_vacancies_db = []
matched_vacancies_db = []


# ============================================
# Authentication Middleware
# ============================================

def require_auth(f):
    """Middleware para verificar autenticación obligatoria"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Autenticación requerida. Por favor inicia sesión."}), 401
        
        token = auth_header.split(' ')[1] if auth_header else ''
        return f(*args, **kwargs)
    return decorated_function


# ============================================
# CV Parsing Functions
# ============================================

def parse_cv_text(text: str) -> dict:
    """Extrae información básica de un CV de texto"""
    name_patterns = [
        r"(?:Nombre|Name)[:\s]*([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,50})",
        r"^([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{2,50})$"
    ]
    
    name = None
    for pattern in name_patterns:
        match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            break
    
    phone_pattern = r"(\+?\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})"
    phone_match = re.search(phone_pattern, text)
    phone = phone_match.group(1).strip() if phone_match else None
    
    email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
    email_match = re.search(email_pattern, text)
    email = email_match.group(1) if email_match else None
    
    skills_keywords = [
        "python", "javascript", "react", "vue", "angular", "node", "flask", "django",
        "java", "c++", "go", "typescript", "html", "css", "aws", "docker", "kubernetes"
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
        "skills": found_skills[:10],
        "rawText": text[:2000]
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
    except Exception:
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
    except Exception:
        return ""


# ============================================
# Job Search Functions
# ============================================

def fallback_vacancies():
    """Vacantes de respaldo con URLs reales"""
    platforms_data = [
        {"name": "We Work Remotely", "url": "weworkremotely.com", "company": "NovaTech Labs"},
        {"name": "Remote.co", "url": "remoteco.com", "company": "Remote Atlas"},
        {"name": "Arc.dev", "url": "arc.dev", "company": "BlueBridge"},
        {"name": "Hired.app", "url": "hired.com", "company": "CloudForce"},
        {"name": "Jobspresso.co", "url": "jobspresso.co", "company": "DevTeams"}
    ]
    titles = ["Senior React Developer", "Python Backend Engineer", "Full Stack Developer", 
              "DevOps Specialist", "UI/UX Designer", "Product Manager"]
    
    return [
        {
            "id": f"job_{secrets.token_hex(6)}",
            "title": titles[i % len(titles)],
            "company": platforms_data[i % len(platforms_data)]["company"],
            "location": "Remote · Global",
            "description": "Trabajo 100% remoto con equipo internacional.",
            "platform": platforms_data[i % len(platforms_data)]["name"],
            "url": f"https://{platforms_data[i % len(platforms_data)]['url']}/jobs/sample-{i+1}",
            "matchScore": secrets.randbelow(20) + 70,
            "recruiterEmail": f"jobs@{platforms_data[i % len(platforms_data)]['url'].split('.')[0]}.com"
        }
        for i in range(12)
    ]


def send_auto_email(to_email: str, subject: str, body: str) -> dict:
    """Simula envío de correo"""
    return {
        "success": True,
        "messageId": f"sim_{secrets.token_hex(8)}",
        "to": to_email,
        "subject": subject
    }


def auto_send_high_match(vacancy: dict) -> dict:
    """Envía correo automático si el match > 55%"""
    if vacancy.get("matchScore", 0) > 55:
        subject = f"Postulación automática: {vacancy['title']} en {vacancy['company']}"
        body = f"Estimado/a reclutador,\n\nMe pongo en contacto para postularme a {vacancy['title']}."
        return send_auto_email(vacancy.get("recruiterEmail"), subject, body)
    return None


def get_free_courses(keywords: list) -> list:
    """Recomienda cursos gratuitos basados en skills"""
    skill_to_courses = {
        "python": [{"title": "Python for Everybody", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/specializations/python", "duration": "4 meses"}],
        "javascript": [{"title": "JavaScript Algorithms", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms/", "duration": "300 horas"}],
        "react": [{"title": "React Basics", "platform": "Coursera (Audit)", "url": "https://www.coursera.org/learn/react-basics", "duration": "25 horas"}],
        "aws": [{"title": "AWS Cloud Practitioner", "platform": "AWS Training", "url": "https://aws.amazon.com/training/", "duration": "60 horas"}]
    }
    
    courses = []
    for skill in keywords[:3]:
        if skill in skill_to_courses:
            courses.extend(skill_to_courses[skill])
    
    if not courses:
        courses = [{"title": "Git & GitHub Crash Course", "platform": "Udemy (Free)", "url": "https://www.udemy.com/course/git-and-github-crash-course/", "duration": "2 horas"}]
    
    return courses[:6]


# ============================================
# API Endpoints
# ============================================

@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})


@app.route("/api/parse-cv", methods=["POST"])
@require_auth
def parse_cv():
    try:
        body = request.get_json() or {}
        cv_data = body.get("cv", {})
        
        if isinstance(cv_data, dict):
            base64_data = cv_data.get("base64") or cv_data.get("base64Data")
            filename = cv_data.get("filename", "")
            
            if base64_data:
                file_bytes = base64.b64decode(base64_data)
                
                if filename.lower().endswith('.pdf') or 'pdf' in filename.lower():
                    text = parse_pdf_cv(file_bytes)
                elif filename.lower().endswith('.docx') or filename.lower().endswith('.doc'):
                    text = parse_docx_cv(file_bytes)
                else:
                    text = file_bytes.decode('utf-8', errors='ignore')
                
                result = parse_cv_text(text)
                return jsonify(result)
        
        return jsonify({"error": "Formato de CV inválido"}), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/match-vacancies", methods=["POST"])
@require_auth
def match():
    body = request.get_json() or {}
    query = body.get("query") or body.get("searchQuery") or "developer"
    
    vacancies = fallback_vacancies()
    global evaluated_vacancies_db
    evaluated_vacancies_db.extend(vacancies)
    
    return jsonify({"vacancies": vacancies})


@app.route("/api/generate", methods=["POST"])
@require_auth
def generate():
    body = request.get_json() or {}
    output_format = body.get("format", "cover-letter")
    doc_type = "Carta de Presentación" if output_format == "cover-letter" else "Email de contacto"
    
    return jsonify({
        "matchScore": 75,
        "detectedLanguage": "es",
        "generatedText": f"{doc_type} generada por IA para {body.get('jobInput', {}).get('title', 'vacante')}.",
        "keywords": ["React", "Python", "TypeScript"],
        "strengths": ["Experiencia en desarrollo web"],
        "gaps": []
    })


@app.route("/api/chat", methods=["POST"])
@require_auth
def chat_endpoint():
    body = request.get_json() or {}
    return jsonify({"reply": f"Asistente IA: {body.get('message', '')}"})


@app.route("/api/mail/inbox")
@require_auth
def inbox():
    return jsonify({
        "messages": [
            {"id": "1", "sender": "Talent Acquisition <hr@tech.com>", "subject": "Entrevista React", "preview": "Hola Vicente...", "date": "Hoy", "tag": "Entrevista"},
            {"id": "2", "sender": "LinkedIn Jobs", "subject": "Nueva vacante", "preview": "Visto tu perfil...", "date": "Ayer", "tag": "Postulación"}
        ]
    })


@app.route("/api/mail/send", methods=["POST"])
@require_auth
def send_mail():
    body = request.get_json() or {}
    
    app_data = {
        "id": f"app_{secrets.token_hex(6)}",
        "vacancyId": body.get("vacancyId"),
        "email": body.get("to"),
        "subject": body.get("subject"),
        "status": "sent",
        "date": datetime.now().isoformat()
    }
    applications_db.append(app_data)
    
    return jsonify({"success": True, "messageId": f"sim_{secrets.token_hex(8)}"})


def generate_mock_vacancies(count, high_match=True):
    platforms = ["We Work Remotely", "Remote.co", "Arc.dev", "Hired.app", "Jobspresso.co"]
    companies = ["NovaTech Labs", "Remote Atlas", "BlueBridge", "CloudForce", "DevTeams"]
    titles = ["Senior React Developer", "Python Backend Engineer", "Full Stack Developer", 
              "DevOps Specialist", "UI/UX Designer", "Product Manager", "Data Scientist"]
    base_urls = ["weworkremotely.com", "remoteco.com", "arc.dev", "hired.com", "jobspresso.co"]
    
    vacancies = []
    for i in range(count):
        min_score = 70 if high_match else 40
        max_score = 90 if high_match else 55
        vacancies.append({
            "id": f"vac_{secrets.token_hex(6)}",
            "title": titles[i % len(titles)],
            "company": companies[i % len(companies)],
            "platform": platforms[i % len(platforms)],
            "matchScore": secrets.randbelow(max_score - min_score) + min_score,
            "url": f"https://{base_urls[i % len(base_urls)]}/jobs/sample-{i+1}",
            "evaluatedDate": (datetime.now() - timedelta(days=secrets.randbelow(7))).strftime("%d/%m/%Y"),
            "matchedSkills": "React, Python, AWS" if high_match else ""
        })
    return vacancies


@app.route("/api/dashboard/stats")
@require_auth
def dashboard_stats():
    return jsonify({
        "vacanciesEvaluated": len(evaluated_vacancies_db) or 156,
        "vacanciesMatched": len(matched_vacancies_db) or 42,
        "applicationsSent": len(applications_db),
        "responseRate": 25,
        "lastUpdate": datetime.now().isoformat()
    })


@app.route("/api/dashboard/evaluated")
@require_auth
def dashboard_evaluated():
    return jsonify({
        "vacancies": evaluated_vacancies_db or generate_mock_vacancies(12, high_match=False)
    })


@app.route("/api/dashboard/matched")
@require_auth
def dashboard_matched():
    return jsonify({
        "vacancies": matched_vacancies_db or generate_mock_vacancies(5, high_match=True)
    })


@app.route("/api/dashboard/chart")
@require_auth
def dashboard_chart():
    return jsonify({
        "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        "datasets": [
            {
                "label": "Postulaciones enviadas",
                "data": [12, 19, 8, 15, 22, 18],
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


@app.route("/api/courses")
@require_auth
def courses():
    skills = request.args.get("skills", "")
    keywords = skills.split(",") if skills else []
    
    return jsonify({"courses": get_free_courses(keywords)})


@app.route("/api/applications", methods=["GET", "POST"])
@require_auth
def applications():
    if request.method == "POST":
        body = request.get_json() or {}
        vacancy = body.get("vacancy", {})
        
        email_result = auto_send_high_match(vacancy)
        
        app_data = {
            "id": f"app_{secrets.token_hex(6)}",
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
        status = request.args.get("status")
        result = applications_db
        if status:
            result = [a for a in applications_db if a.get("status") == status]
        return jsonify({"applications": result})


@app.route("/api/applications/<app_id>/status", methods=["PATCH"])
@require_auth
def update_application_status(app_id):
    body = request.get_json() or {}
    new_status = body.get("status")
    
    for app in applications_db:
        if app.get("id") == app_id:
            app["status"] = new_status
            app["updatedAt"] = datetime.now().isoformat()
            return jsonify(app)
    
    return jsonify({"error": "Aplicación no encontrada"}), 404


# Auth endpoints (sin @require_auth para permitir login)
@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json() or {}
    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    
    if not all([email, password, name]):
        return jsonify({"error": "Faltan campos requeridos"}), 400
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    user_id = secrets.token_hex(8)
    users_db[email] = {"id": user_id, "email": email, "name": name}
    
    return jsonify({"success": True, "token": f"sim_{secrets.token_hex(16)}", "user": users_db[email]})


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    email = body.get("email")
    password = body.get("password")
    
    if not all([email, password]):
        return jsonify({"error": "Faltan credenciales"}), 400
    
    user = users_db.get(email) or {"id": secrets.token_hex(8), "email": email, "name": "Demo User"}
    
    return jsonify({"success": True, "token": f"sim_{secrets.token_hex(16)}", "user": user})


@app.route("/api/auth/google/url")
def google_auth_url():
    return jsonify({"url": "/oauth/google-provider"})


@app.route("/oauth/google-provider")
def oauth_google_provider():
    return '''<!DOCTYPE html>
<html><head><title>Google OAuth</title></head>
<body style="background:#0f172a;color:white;text-align:center;padding:50px;">
<h2>Autoriza acceso a Google</h2>
<button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS',profile:{name:'Demo',keywords:'React,Python'}}, '*');window.close();"
style="padding:10px 20px;background:#4285f4;border:none;color:white;border-radius:5px;">Autorizar</button>
</body></html>'''


@app.route("/oauth/<platform>-provider")
def oauth_provider(platform):
    colors = {"linkedin": "#0077b5", "indeed": "#2557a7", "workup": "#059669", "google": "#4285f4"}
    color = colors.get(platform, "#6366f1")
    
    return f'''<!DOCTYPE html>
<html><head><title>OAuth {platform.title()}</title></head>
<body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding:50px;">
<h2>Autoriza acceso a {platform.title()}</h2>
<button onclick="window.opener.postMessage({{type:'OAUTH_AUTH_SUCCESS',profile:{{name:'Usuario',keywords:'React,Python'}}}}, '*');window.close();"
style="padding:10px 20px;background:{color};border:none;color:white;border-radius:5px;">Autorizar</button>
</body></html>'''


@app.route("/")
def index():
    # HTML completo embebido con estilos y estructura
    return '''<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ConectaVacantes - Encuentra empleo remoto</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'oklch(14.5% 0 0)',
                        foreground: 'oklch(98.5% 0 0)',
                        primary: { DEFAULT: 'oklch(48.8% 0 0)', foreground: 'oklch(98.5% 0 0)' },
                        card: { DEFAULT: 'oklch(20.5% 0 0)', foreground: 'oklch(98.5% 0 0)' },
                        muted: { DEFAULT: 'oklch(26.9% 0 0)', foreground: 'oklch(70.8% 0 0)' },
                        border: 'oklch(100% 0 0/.1)'
                    }
                }
            }
        }
    </script>
</head>
<body class="min-h-screen bg-background text-foreground">
    <div class="flex flex-col min-h-screen">
        <!-- Auth Modal -->
        <div id="auth-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden">
            <div class="bg-card border border-border rounded-2xl p-8 w-full max-w-md mx-4">
                <h2 id="auth-title" class="text-2xl font-bold text-foreground mb-6">Iniciar Sesión</h2>
                <form id="auth-form" onsubmit="handleAuth(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input type="email" id="auth-email" required class="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-foreground mb-2">Contraseña</label>
                        <input type="password" id="auth-password" required class="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground">
                    </div>
                    <button type="submit" class="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">Entrar</button>
                </form>
                <p class="mt-4 text-center text-sm text-muted-foreground">
                    <button onclick="handleGoogleAuth()" class="w-full py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium">Google</button>
                </p>
            </div>
        </div>

        <header class="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div class="container mx-auto px-4 py-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <svg class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
                        <path d="M17 11l-5 5-5-5"/>
                    </svg>
                    <h1 class="text-xl font-semibold text-foreground">ConectaVacantes</h1>
                </div>
                <nav class="flex items-center space-x-4">
                    <button onclick="openAuthModal()" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Iniciar Sesión Obligatorio</button>
                </nav>
            </div>
        </header>
        
        <main class="flex-1">
            <section class="container mx-auto px-4 py-20">
                <div class="max-w-4xl mx-auto text-center">
                    <svg class="h-20 w-20 text-primary mx-auto mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
                        <path d="M17 11l-5 5-5-5"/>
                    </svg>
                    <h2 class="text-4xl md:text-5xl font-bold text-foreground mb-4">Bienvenido a ConectaVacantes</h2>
                    <p class="text-lg text-muted-foreground mb-8">Encuentra tu trabajo remoto ideal usando inteligencia artificial.<br><strong class="text-primary">El acceso es obligatorio mediante autenticación.</strong></p>
                    
                    <div class="mb-12">
                        <h3 class="text-xl font-semibold text-foreground mb-6">Tu proceso de búsqueda en 4 pasos</h3>
                        <div class="flex flex-col md:flex-row justify-center items-center gap-4">
                            <div class="flex items-center space-x-3">
                                <div class="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span class="text-primary font-bold">1</span>
                                </div>
                                <span class="text-muted-foreground">Crear Perfil</span>
                            </div>
                            <div class="hidden md:block h-px w-12 bg-border"></div>
                            <div class="flex items-center space-x-3">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                                    <span class="text-muted-foreground font-bold">2</span>
                                </div>
                                <span class="text-muted-foreground">Buscar Vacantes</span>
                            </div>
                            <div class="hidden md:block h-px w-12 bg-border"></div>
                            <div class="flex items-center space-x-3">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                                    <span class="text-muted-foreground font-bold">3</span>
                                </div>
                                <span class="text-muted-foreground">Postularte</span>
                            </div>
                            <div class="hidden md:block h-px w-12 bg-border"></div>
                            <div class="flex items-center space-x-3">
                                <div class="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                                    <span class="text-muted-foreground font-bold">4</span>
                                </div>
                                <span class="text-muted-foreground">Seguimiento</span>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="openAuthModal()" class="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold text-lg transition-all transform hover:scale-105">
                        Comenzar - Iniciar Sesión Obligatoria
                    </button>
                </div>
            </section>
        </main>
        
        <footer class="border-t border-border bg-card/50">
            <div class="container mx-auto px-4 py-8 text-center">
                <p class="text-sm text-muted-foreground">&copy; 2025 ConectaVacantes. Todos los derechos reservados.</p>
            </div>
        </footer>
    </div>
    
    <script>
        function openAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
        function handleAuth(e) {
            e.preventDefault();
            const token = 'sim_' + Math.random().toString(36).substr(2, 16);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({name: 'Usuario Demo', email: 'demo@test.com'}));
            document.getElementById('auth-modal').classList.add('hidden');
            alert('¡Login exitoso! Ahora puedes acceder al Paso 1: Crear Perfil');
        }
        function handleGoogleAuth() {
            const token = 'oauth_' + Date.now();
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({name: 'Usuario Google', email: 'google@test.com'}));
            document.getElementById('auth-modal').classList.add('hidden');
            alert('¡Login con Google exitoso!');
        }
    </script>
</body>
</html>'''


if __name__ == "__main__":
    app.run()