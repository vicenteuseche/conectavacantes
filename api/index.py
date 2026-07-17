"""
ConectaVacantes - API Serverless para Vercel
Sirve el frontend completo y endpoints de API con autenticación demo
"""

import os
from flask import Flask, request, jsonify, send_from_directory, Response
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import secrets

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# In-memory user storage (works for demo mode)
# Note: In production, use DATABASE_URL with PostgreSQL
users_db = {}

# ============================================
# Serve Frontend
# ============================================

@app.route('/')
def index():
    """Serve the main index.html"""
    try:
        index_path = os.path.join(os.path.dirname(__file__), '..', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response(content, mimetype='text/html')
        return "<h1>ConectaVacantes</h1>", 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# Serve Static Files
# ============================================

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files from /static directory"""
    try:
        static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
        file_path = os.path.join(static_dir, path)
        if os.path.exists(file_path):
            # Determine mimetype
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            with open(file_path, 'rb') as f:
                return f.read(), 200, {'Content-Type': mime_type}
        return jsonify({"error": "Static file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/app.js')
def serve_app_js():
    """Serve app.js directly"""
    try:
        app_js_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'app.js')
        if os.path.exists(app_js_path):
            with open(app_js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response(content, mimetype='application/javascript')
        return jsonify({"error": "app.js not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# API Endpoints
# ============================================

@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "message": "ConectaVacantes API funcionando"
    })

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    """Register endpoint - creates user and returns token immediately"""
    try:
        body = request.get_json() or {}
        email = body.get("email", "").strip()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        
        if not all([email, password]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        # Check if user exists
        if email in users_db:
            return jsonify({"error": "El usuario ya existe"}), 400
        
        # Create user in memory (works as demo)
        users_db[email] = {
            "email": email,
            "name": name or "Usuario",
            "password_hash": generate_password_hash(password)
        }
        
        # Generate token
        token = f"demo_{secrets.token_urlsafe(24)}"
        
        return jsonify({
            "success": True, 
            "token": token,
            "user": {"email": email, "name": name or "Usuario"}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """Login endpoint - demo mode (always succeeds)"""
    try:
        body = request.get_json() or {}
        email = body.get("email", "").strip()
        password = body.get("password", "")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        # Demo mode: Always return success
        token = f"demo_{secrets.token_urlsafe(24)}"
        name = email.split('@')[0] if '@' in email else email
        
        # Store user in session if first time
        if email not in users_db:
            users_db[email] = {
                "email": email,
                "name": name,
                "password_hash": generate_password_hash(password)
            }
        
        return jsonify({
            "success": True, 
            "token": token, 
            "user": {"email": email, "name": users_db[email].get("name", name)}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/parse-cv", methods=["POST"])
def parse_cv():
    """Parse CV endpoint"""
    try:
        body = request.get_json() or {}
        cv_data = body.get("cv", {})
        
        # Simulate parsing
        return jsonify({
            "name": cv_data.get("textData") or "Demo Name",
            "skills": ["python", "javascript", "react"],
            "rawText": "Sample CV text"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/match-vacancies", methods=["POST"])
def match_vacancies():
    """Match vacancies endpoint"""
    try:
        return jsonify({
            "vacancies": [
                {"id": "1", "title": "Senior React Developer", "company": "TechCorp", "matchScore": 85, "platform": "LinkedIn", "url": "#"},
                {"id": "2", "title": "Python Backend Engineer", "company": "DataCorp", "matchScore": 78, "platform": "Indeed", "url": "#"},
                {"id": "3", "title": "DevOps Engineer", "company": "CloudCo", "matchScore": 70, "platform": "Remote.co", "url": "#"}
            ]
        })
    except Exception as e:
        return jsonify({"vacancies": []})

@app.route("/api/dashboard/stats", methods=["GET"])
def dashboard_stats():
    """Dashboard stats endpoint"""
    return jsonify({
        "vacanciesEvaluated": 156,
        "vacanciesMatched": 42,
        "applicationsSent": 12
    })

@app.route("/api/applications", methods=["GET", "POST"])
def applications():
    """Applications endpoint"""
    if request.method == "GET":
        return jsonify({"applications": []})
    return jsonify({"success": True})

@app.route("/api/dashboard/evaluated", methods=["GET"])
def evaluated_vacancies():
    return jsonify({"vacancies": []})

@app.route("/api/dashboard/matched", methods=["GET"])
def matched_vacancies():
    return jsonify({"vacancies": []})

@app.route("/api/courses", methods=["GET"])
def recommended_courses():
    return jsonify({"courses": []})

@app.route("/oauth/google-provider", methods=["GET"])
def oauth_google():
    """OAuth endpoint for Google auth simulation"""
    return jsonify({
        "success": True,
        "token": f"oauth_{secrets.token_urlsafe(24)}",
        "user": {"email": "user@example.com", "name": "Demo User"}
    })

# Para pruebas locales
if __name__ == "__main__":
    app.run(debug=True)