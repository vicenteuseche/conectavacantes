"""
ConectaVacantes - Aplicación completa en Python con Flask
"""

import os
import re
import json
from datetime import datetime
from collections import defaultdict
from functools import wraps

from flask import Flask, request, jsonify, render_template_string
import httpx
from dotenv import load_dotenv
import google.generativeai as genai

# Cargar variables de entorno
load_dotenv()

# Inicializar Flask
app = Flask(__name__)

# Configuración
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB max

# Rate Limiter en memoria
rate_limit_store = defaultdict(lambda: {"count": 0, "reset_time": 0})


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
        
        # Bloquear rangos privados 172.16.0.0 - 172.31.255.255
        if hostname.startswith("172."):
            parts = hostname.split(".")
            if len(parts) >= 2:
                second = int(parts[1])
                if 16 <= second <= 31:
                    return False
        
        return True
    except Exception:
        return False


async def fetch_job_text(url_or_text: str) -> str:
    """Obtiene texto de una URL o devuelve el texto directamente"""
    import asyncio
    
    trimmed = url_or_text.strip()
    
    if not trimmed.startswith("http://") and not trimmed.startswith("https://"):
        return trimmed
    
    if not is_safe_url(trimmed):
        raise ValueError("Acceso denegado: URL viola políticas de seguridad (SSRF Bloqueado).")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                trimmed,
                headers={
                    "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8"
                },
                timeout=30.0
            )
            
            if not response.is_success:
                raise ValueError(f"Failed to fetch webpage. HTTP status: {response.status_code}")
            
            html = response.text
            
            # Limpiar HTML
            clean = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
            clean = re.sub(r"<style[^>]*>.*?</style>", "", clean, flags=re.DOTALL | re.IGNORECASE)
            clean = re.sub(r"<!--.*?-->", "", clean, flags=re.DOTALL)
            clean = re.sub(r"</(div|p|h1|h2|h3|h4|h5|h6|li|tr)>", "\n", clean, flags=re.IGNORECASE)
            clean = re.sub(r"<[^>]+>", " ", clean)
            clean = clean.replace("&nbsp;", " ").replace("&", "&").replace("<", "<").replace(">", ">")
            clean = re.sub(r"\s+", " ", clean).strip()
            
            if len(clean) > 15000:
                clean = clean[:15000] + "... (truncated)"
            
            return clean
    except Exception as e:
        raise ValueError(f"Could not read career page URL: {str(e)}")


def fallback_vacancies(query: str, regions: list, languages: list, contract_types: list) -> list:
    """Vacantes de respaldo cuando Gemini no está disponible"""
    query = (query or "desarrollador").lower()
    regions = regions if regions else ["latam", "na", "es", "caribe"]
    languages = languages if languages else ["es", "en"]
    contracts = contract_types if contract_types else ["contrato", "proyecto"]
    platforms = ["LinkedIn", "Indeed", "Workup"]
    
    return [
        {
            "title": "Senior React Developer" if "react" in query else "Full Stack Developer Remote",
            "company": "NovaTech Labs",
            "location": "Remote · USA" if "na" in regions else "Remote · LATAM",
            "lang": "en" if "en" in languages else "es",
            "matchScore": 88,
            "description": f"Vacante alineada con {query}",
            "requirements": f"React, TypeScript, APIs, {', '.join(contracts)}",
            "platform": platforms[0],
            "sourceApi": "fallback",
            "recruiterEmail": "talent@novatechlabs.com"
        },
        {
            "title": "Python Software Engineer" if "python" in query else "Product Engineer",
            "company": "Remote Atlas",
            "location": "Remote · LATAM",
            "lang": "es",
            "matchScore": 74,
            "description": "Oportunidad remota con enfoque en producto",
            "requirements": f"Cloud, testing, {', '.join(contracts)}",
            "platform": platforms[1],
            "sourceApi": "fallback",
            "recruiterEmail": "jobs@remoteatlas.com"
        },
        {
            "title": "Data Engineer" if "data" in query else "Frontend Engineer",
            "company": "BlueBridge",
            "location": "Remote · Global",
            "lang": "en" if "en" in languages else "es",
            "matchScore": 66,
            "description": "Vacante para perfiles técnicos",
            "requirements": "UI/UX, APIs, CI/CD",
            "platform": platforms[2],
            "sourceApi": "fallback",
            "recruiterEmail": "careers@bluebridge.io"
        }
    ]


# ============================================
# Routes/API Endpoints
# ============================================

@app.route("/api/health")
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})


@app.route("/api/match-vacancies", methods=["POST"])
@rate_limiter(10, 60)  # 10 requests per 60 seconds
def match_vacancies():
    """Endpoint para encontrar vacantes coincidentes"""
    try:
        body = request.get_json() or {}
        cv = body.get("cv", "")
        keywords = body.get("profileKeywords", "")
        regions = body.get("allowedRegions", [])
        languages = body.get("languages", [])
        contracts = body.get("contractTypes", [])
        query = body.get("query") or body.get("searchQuery", "")
        
        # Preparar CV
        cv_text = ""
        if cv:
            if isinstance(cv, dict) and (cv.get("base64") or cv.get("base64Data")):
                cv_text = "[PDF Resume uploaded]"
            elif isinstance(cv, str):
                cv_text = cv
        
        # Regiones
        region_map = {
            "latam": "Latinoamérica",
            "caribe": "Caribe",
            "na": "Norte America",
            "es": "España"
        }
        
        selected = [region_map.get(r, r) for r in (regions or []) if r in region_map]
        region_prompt = f"Regiones: {', '.join(selected)}" if selected else "Global"
        
        # Lenguaje
        lang_filter = body.get("languageFilter")
        lang_prompt = {"es": "español", "en": "inglés"}.get(lang_filter, "español o inglés")
        
        # Gemini
        model = get_gemini_client()
        
        prompt = f"""Eres un reclutador ATS. Genera 6 vacantes realistas para:
CV: {cv_text or 'No proporcionado'}
Keywords: {keywords or 'N/A'}
Regiones: {region_prompt}
Idioma: {lang_prompt}
Query: {query or 'N/A'}

Formato JSON con: title, company, location, lang, matchScore, description, requirements, platform, sourceApi, recruiterEmail"""
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text.strip())
        except json.JSONDecodeError:
            result = {"vacancies": fallback_vacancies(query, regions, languages, contracts)}
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"vacancies": fallback_vacancies("desarrollador", [], None, None)})


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
        
        # Preparar CV
        cv_text = cv if isinstance(cv, str) else cv.get("textData", "")
        
        # Job text
        job_text = job  # Simplificado, puedes agregar fetch_job_text si necesario
        
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
        
        # Contexto
        context = ""
        if cv or job:
            context = f"\nContexto: CV: {cv[:500] if cv else 'N/A'}. Trabajo: {job[:500] if job else 'N/A'}"
        
        # Historial
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


@app.route("/auth/callback")
def auth_callback():
    """Callback OAuth simulado"""
    platform = request.args.get("platform", "linkedin")
    profile = json.dumps({"name": "Vicente Useche", "keywords": "React, Python"})
    
    return f"""
    <script>
    window.opener.postMessage({{type: 'OAUTH_AUTH_SUCCESS', platform: '{platform}', profile: {profile}}}, '*');
    window.close();
    </script>
    """


@app.route("/api/auth/<platform>/url")
def auth_url(platform):
    """URLs de autenticación simuladas"""
    return jsonify({"url": f"/oauth/{platform}-provider"})


@app.route("/oauth/<platform>-provider")
def oauth_provider(platform):
    """Páginas OAuth simuladas"""
    colors = {"linkedin": "#0077b5", "indeed": "#2557a7", "workup": "#059669"}
    color = colors.get(platform, "#6366f1")
    
    return f"""
    <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
        <h2>OAuth {platform.title()}</h2>
        <button onclick="window.opener.postMessage({{type:'OAUTH_AUTH_SUCCESS', platform:'{platform}', profile:{{name:'Usuario'}}}}, '*'); window.close();"
            style="padding:10px 20px; background:{color}; border:none; color:white; border-radius:5px; cursor:pointer;">
            Autorizar
        </button>
    </body>
    """


@app.route("/")
def index():
    """Página principal"""
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return """
        <html>
        <head><title>ConectaVacantes</title></head>
        <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
            <h1>ConectaVacantes</h1>
            <p>Aplicación en Python/Flask - Lista para usar</p>
        </body>
        </html>
        """


# Para Vercel serverless
if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)