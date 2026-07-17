"""
ConectaVacantes - API Serverless para Vercel
Sirve el frontend completo y endpoints de API con autenticación real
"""

import os
from flask import Flask, request, jsonify, send_from_directory, Response
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import secrets
import json

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Configuración de base de datos - usar /tmp para serverless (Vercel filesystem is read-only except /tmp)
database_url = os.environ.get('DATABASE_URL')
if database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # SQLite en /tmp para Vercel serverless
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/conectavacantes.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# In-memory storage como fallback
users_db = {}
sessions = {}

# Initialize SQLAlchemy
try:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy(app)
    
    # Modelo de Usuario
    class Usuario(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        email = db.Column(db.String(120), unique=True, nullable=False)
        password_hash = db.Column(db.String(200), nullable=False)
        name = db.Column(db.String(80))
    
    # Initialize database
    with app.app_context():
        db.create_all()
    DATABASE_AVAILABLE = True
except Exception as e:
    DATABASE_AVAILABLE = False

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

# ============================================
# API Endpoints
# ============================================

@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "database": "configured" if os.environ.get('DATABASE_URL') else "using_sqlite_tmp",
        "database_available": DATABASE_AVAILABLE
    })

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    """Register endpoint"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        name = body.get("name", "")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        # Use database if available
        if DATABASE_AVAILABLE:
            usuario_existente = Usuario.query.filter_by(email=email).first()
            if usuario_existente:
                return jsonify({"error": "El usuario ya existe"}), 400
            
            hashed_password = generate_password_hash(password)
            nuevo_usuario = Usuario(email=email, password_hash=hashed_password, name=name)
            db.session.add(nuevo_usuario)
            db.session.commit()
            
            # Generate token after registration
            token = secrets.token_urlsafe(32)
            return jsonify({
                "success": True, 
                "token": token,
                "user": {"email": email, "name": name}
            })
        else:
            # In-memory fallback
            users_db[email] = {"email": email, "name": name, "password_hash": generate_password_hash(password)}
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
    """Login endpoint"""
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        # Use database if available
        if DATABASE_AVAILABLE:
            usuario = Usuario.query.filter_by(email=email).first()
            
            if usuario and check_password_hash(usuario.password_hash, password):
                token = secrets.token_urlsafe(32)
                return jsonify({
                    "success": True, 
                    "token": token, 
                    "user": {"email": email, "name": usuario.name}
                })
            else:
                return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
        else:
            # In-memory fallback
            user = users_db.get(email)
            if user and check_password_hash(user["password_hash"], password):
                token = f"token_{secrets.token_hex(16)}"
                return jsonify({
                    "success": True, 
                    "token": token, 
                    "user": {"email": email, "name": user.get("name", "Usuario")}
                })
            else:
                return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
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

# Para pruebas locales
if __name__ == "__main__":
    app.run(debug=True)