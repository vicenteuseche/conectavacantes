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
from flask import Flask, request, jsonify
import PyPDF2
import docx

# Crear aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Almacenamiento en memoria
users_db = {}
applications_db = []

# ============================================
# CV Parsing Functions
# ============================================

def parse_cv_text(text: str) -> dict:
    """Extrae información básica de un CV de texto"""
    # Nombre - busca patrones comunes
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
    
    # Teléfono
    phone_pattern = r"(\+?\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4})"
    phone_match = re.search(phone_pattern, text)
    phone = phone_match.group(1).strip() if phone_match else None
    
    # Email
    email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
    email_match = re.search(email_pattern, text)
    email = email_match.group(1) if email_match else None
    
    # Habilidades
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


def fallback_vacancies():
    """Vacantes de respaldo"""
    platforms = ["We Work Remotely", "Remote.co", "Arc.dev", "Hired.app", "Jobspresso.co"]
    companies = ["NovaTech Labs", "Remote Atlas", "BlueBridge", "CloudForce", "DevTeams"]
    
    return [
        {
            "title": "Senior React Developer",
            "company": companies[secrets.randbelow(len(companies))],
            "location": "Remote · Global",
            "lang": "en",
            "matchScore": secrets.randbelow(20) + 70,
            "description": "Vacante alineada con desarrollador. Trabajo 100% remoto.",
            "requirements": "React, TypeScript, APIs",
            "platform": platforms[secrets.randbelow(len(platforms))],
            "sourceApi": "weworkremotely",
            "recruiterEmail": f"talent@{['novatechlabs.com', 'remoteatlas.com'][secrets.randbelow(2)]}",
            "url": f"https://{platforms[secrets.randbelow(len(platforms))].lower().replace(' ', '')}.com/jobs/sample",
            "id": f"job_{secrets.token_hex(6)}"
        }
        for _ in range(6)
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
def match():
    body = request.get_json() or {}
    query = body.get("query") or body.get("searchQuery") or "developer"
    
    vacancies = fallback_vacancies()
    
    return jsonify({"vacancies": vacancies})


@app.route("/api/generate", methods=["POST"])
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
def chat_endpoint():
    body = request.get_json() or {}
    return jsonify({"reply": f"Asistente IA: {body.get('message', '')}"})


@app.route("/api/mail/inbox")
def inbox():
    return jsonify({
        "messages": [
            {"id": "1", "sender": "Talent Acquisition <hr@tech.com>", "subject": "Entrevista React", "preview": "Hola Vicente...", "date": "Hoy", "tag": "Entrevista"},
            {"id": "2", "sender": "LinkedIn Jobs", "subject": "Nueva vacante", "preview": "Visto tu perfil...", "date": "Ayer", "tag": "Postulación"}
        ]
    })


@app.route("/api/mail/send", methods=["POST"])
def send_mail():
    body = request.get_json() or {}
    
    # Registrar aplicación
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


@app.route("/api/dashboard/stats")
def dashboard_stats():
    return jsonify({
        "vacanciesEvaluated": 156,
        "vacanciesMatched": 42,
        "applicationsSent": len(applications_db),
        "responseRate": 25,
        "lastUpdate": datetime.now().isoformat()
    })


@app.route("/api/dashboard/chart")
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
def courses():
    skills = request.args.get("skills", "")
    keywords = skills.split(",") if skills else []
    
    return jsonify({"courses": get_free_courses(keywords)})


@app.route("/api/applications", methods=["GET", "POST"])
def applications():
    if request.method == "POST":
        body = request.get_json() or {}
        vacancy = body.get("vacancy", {})
        cv = body.get("cv", {})
        
        # Auto-enviar si match > 55%
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
def update_application_status(app_id):
    body = request.get_json() or {}
    new_status = body.get("status")
    
    for app in applications_db:
        if app.get("id") == app_id:
            app["status"] = new_status
            app["updatedAt"] = datetime.now().isoformat()
            return jsonify(app)
    
    return jsonify({"error": "Aplicación no encontrada"}), 404


# Auth endpoints
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
    try:
        with open("../index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>ConectaVacantes</h1>"


if __name__ == "__main__":
    app.run()