"""
ConectaVacantes - API Serverless para Vercel
Sirve el frontend completo y endpoints de API
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import secrets
import json

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Configuración de base de datos - usar /tmp para serverless
database_url = os.environ.get('DATABASE_URL')
if database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/conectavacantes.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# In-memory session storage
sessions = {}

# ============================================
# Serve Frontend
# ============================================

@app.route('/')
def index():
    """Serve the main index.html"""
    try:
        static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
        index_path = os.path.join(os.path.dirname(__file__), '..', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return f.read()
        return "<h1>ConectaVacantes</h1>", 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/<path:path>.html')
def html_files(path):
    """Serve HTML files from root"""
    try:
        index_path = os.path.join(os.path.dirname(__file__), '..', f'{path}.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return f.read()
        return jsonify({"error": "Not found"}), 404
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
        if os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        return jsonify({"error": "Static file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/style.css')
def serve_style():
    """Serve style.css from root"""
    try:
        css_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'style.css')
        if os.path.exists(css_path):
            return send_from_directory(os.path.dirname(css_path), 'style.css')
        return jsonify({"error": "CSS not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# API Endpoints
# ============================================

@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "database": "configured" if os.environ.get('DATABASE_URL') else "using_sqlite_tmp"
    })

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    """Register endpoint - demo mode without database"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        name = body.get("name", "")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        # Demo: Create token without actual database
        token = f"token_{secrets.token_hex(16)}"
        return jsonify({
            "success": True, 
            "token": token, 
            "user": {"email": email, "name": name}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """Login endpoint - demo mode without database"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        # Demo: Create token without actual database
        token = f"token_{secrets.token_hex(16)}"
        return jsonify({
            "success": True, 
            "token": token, 
            "user": {"email": email, "name": "Demo User"}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/parse-cv", methods=["POST"])
def parse_cv():
    """Parse CV endpoint"""
    try:
        return jsonify({
            "name": "Demo Name",
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
                {"id": "2", "title": "Python Backend Engineer", "company": "DataCorp", "matchScore": 78, "platform": "Indeed", "url": "#"}
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

# Para pruebas locales
if __name__ == "__main__":
    app.run(debug=True)