"""
ConectaVacantes - API Serverless para Vercel
Sirve el frontend completo y endpoints de API con autenticación demo
"""

import os
from flask import Flask, request, jsonify, send_from_directory, Response
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import secrets
import re

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# In-memory user storage (works for demo mode)
users_db = {}

def parse_cv_text(text):
    """Helper function to parse CV text - robust version"""
    skills = []
    skill_keywords = ["python", "javascript", "react", "vue", "angular", "node", "flask", "django",
                     "java", "c++", "aws", "docker", "kubernetes", "sql", "mongodb", "typescript", "go", "rust"]
    
    if not text:
        return {
            "name": "Demo Name",
            "phone": None,
            "email": None,
            "address": None,
            "skills": skill_keywords[:3],
            "rawText": "Sample CV text"
        }
    
    text_lower = text.lower()
    for skill in skill_keywords:
        if skill in text_lower:
            skills.append(skill)
    
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    phone_match = re.search(r'(\+?\d{7,15})', text)
    
    name = None
    name_label_match = re.search(r'(?:Nombre|Name)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.]+)', text, re.IGNORECASE)
    if name_label_match:
        name = name_label_match.group(1).strip()
    
    if not name:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if 2 < len(line) < 60:
                if '@' not in line and not line.startswith('http'):
                    words = line.split()
                    cap_count = sum(1 for w in words if w and w[0].isupper())
                    if cap_count >= 2 and cap_count == len([w for w in words if w]):
                        name = line
                        break
    
    if not name and lines:
        name = lines[0].strip() if len(lines[0].strip()) < 50 else "Demo Name"
    
    address_match = re.search(r'(?:Dirección|Address|Ubicación|Location)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s,\d\.]+)', text, re.IGNORECASE)
    
    return {
        "name": name or "Demo Name",
        "phone": phone_match.group(1).strip() if phone_match else None,
        "email": email_match.group(1) if email_match else None,
        "address": address_match.group(1).strip() if address_match else None,
        "skills": skills[:10] if skills else ["python", "javascript", "react"],
        "rawText": text[:2000]
    }


@app.route('/')
def index():
    try:
        index_path = os.path.join(os.path.dirname(__file__), '..', 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response(content, mimetype='text/html')
        return "<h1>ConectaVacantes</h1>", 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/static/<path:path>')
def serve_static(path):
    try:
        static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
        file_path = os.path.join(static_dir, path)
        if os.path.exists(file_path):
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
    try:
        app_js_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'app.js')
        if os.path.exists(app_js_path):
            with open(app_js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return Response(content, mimetype='application/javascript')
        return jsonify({"error": "app.js not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "message": "ConectaVacantes API funcionando"})


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    try:
        body = request.get_json() or {}
        email = body.get("email", "").strip()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        
        if not all([email, password]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        if email in users_db:
            return jsonify({"error": "El usuario ya existe"}), 400
        
        users_db[email] = {"email": email, "name": name or "Usuario", "password_hash": generate_password_hash(password)}
        token = f"demo_{secrets.token_urlsafe(24)}"
        
        return jsonify({"success": True, "token": token, "user": {"email": email, "name": name or "Usuario"}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    try:
        body = request.get_json() or {}
        email = body.get("email", "").strip()
        password = body.get("password", "")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        token = f"demo_{secrets.token_urlsafe(24)}"
        name = email.split('@')[0] if '@' in email else email
        
        if email not in users_db:
            users_db[email] = {"email": email, "name": name, "password_hash": generate_password_hash(password)}
        
        return jsonify({"success": True, "token": token, "user": {"email": email, "name": users_db[email].get("name", name)}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/parse-cv", methods=["POST"])
def parse_cv():
    try:
        import base64
        import PyPDF2
        from io import BytesIO
        
        body = request.get_json() or {}
        cv = body.get("cv", {})
        
        base64_data = cv.get("base64") or cv.get("base64Data")
        filename = cv.get("filename", "")
        text_data = cv.get("textData", "")
        
        if text_data:
            return jsonify(parse_cv_text(text_data))
        
        if base64_data:
            try:
                file_bytes = base64.b64decode(base64_data)
                
                if filename.lower().endswith('.pdf') or 'pdf' in filename.lower():
                    try:
                        pdf_file = BytesIO(file_bytes)
                        reader = PyPDF2.PdfReader(pdf_file)
                        text = ""
                        for page in reader.pages:
                            text += page.extract_text() or ""
                        if text:
                            return jsonify(parse_cv_text(text))
                    except:
                        pass
                
                try:
                    text = file_bytes.decode('utf-8')
                    return jsonify(parse_cv_text(text))
                except:
                    pass
            except:
                pass
        
        return jsonify({"name": "Demo Name", "phone": None, "email": None, "skills": ["python", "javascript", "react"], "rawText": "Sample CV text"})
    except Exception as e:
        return jsonify({"name": "Demo Name", "skills": ["python", "javascript", "react"], "rawText": "Sample CV text"})


@app.route("/api/match-vacancies", methods=["POST"])
def match_vacancies():
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
    return jsonify({"vacanciesEvaluated": 156, "vacanciesMatched": 42, "applicationsSent": 12})


@app.route("/api/applications", methods=["GET", "POST"])
def applications():
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
    html = '''<!DOCTYPE html>
<html>
<head>
    <script>
        window.onload = function() {
            window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                profile: { email: 'user@example.com', name: 'Demo User' }
            }, '*');
            window.close();
        };
    </script>
</head>
<body><p>Autenticando...</p></body>
</html>'''
    return Response(html, mimetype='text/html')


if __name__ == "__main__":
    app.run(debug=True)