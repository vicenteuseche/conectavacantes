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
    return jsonify({
        "status": "healthy", 
        "message": "ConectaVacantes API funcionando",
        "apis": {
            "apify_configured": bool(os.getenv("APIFY_API_KEY")),
            "loopcv_configured": bool(os.getenv("LOOPCV_API_KEY")),
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
        }
    })


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
        
        # Always return all fields with defaults
        return jsonify({
            "name": "Demo Name",
            "phone": None,
            "email": None,
            "address": None,
            "skills": ["python", "javascript", "react"],
            "rawText": "Sample CV text"
        })
    except Exception as e:
        return jsonify({
            "name": "Demo Name",
            "phone": None,
            "email": None,
            "address": None,
            "skills": ["python", "javascript", "react"],
            "rawText": "Sample CV text"
        })


@app.route("/api/match-vacancies", methods=["POST"])
def match_vacancies():
    """Match vacancies endpoint - fetches real jobs from public APIs"""
    try:
        import httpx
        import secrets as sec
        
        body = request.get_json() or {}
        query = body.get("query", "developer")
        
        vacancies = []
        
        # Try Remotive API (public, no auth needed)
        try:
            url = f"https://remotive.com/api/remote-jobs?search={query.replace(' ', '+')}&limit=20"
            resp = httpx.get(url, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("jobs", [])[:10]:
                    vacancies.append({
                        "id": f"remotive_{item.get('id', sec.token_hex(6))}",
                        "title": item.get("title", query),
                        "company": item.get("company_name", "Company"),
                        "location": item.get("location", "Remote"),
                        "description": item.get("description", "")[:200],
                        "platform": "Remotive",
                        "matchScore": sec.randbelow(30) + 65,
                        "url": item.get("url", "#")
                    })
        except:
            pass
        
# Try We Work Remotely (scrape public site)
        if len(vacancies) < 8:
            try:
                url = f"https://weworkremotely.com/remote-jobs/search?term={query.replace(' ', '+')}"
                resp = httpx.get(url, timeout=10.0)
                if resp.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    job_links = soup.find_all('a', href=True, class_='job-link')[:5]
                    for link in job_links:
                        vacancies.append({
                            "id": f"wework_{sec.token_hex(6)}",
                            "title": link.get_text(strip=True) or query,
                            "company": "We Work Remotely",
                            "location": "Remote",
                            "description": "Trabajo remoto internacional",
                            "platform": "We Work Remotely",
                            "matchScore": sec.randbelow(20) + 60,
                            "url": f"https://weworkremotely.com{link['href']}"
                        })
            except:
                pass
        
        # Try Remote.co (scrape public site)
        if len(vacancies) < 8:
            try:
                url = f"https://remote.co/remote-jobs/?query={query.replace(' ', '+')}"
                resp = httpx.get(url, timeout=10.0)
                if resp.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    job_items = soup.find_all('li', class_='job_listing')[:5]
                    for item in job_items:
                        title_elem = item.find('h3')
                        link_elem = item.find('a', href=True)
                        vacancies.append({
                            "id": f"remoteco_{sec.token_hex(6)}",
                            "title": title_elem.get_text(strip=True) if title_elem else query,
                            "company": "Remote.co",
                            "location": "Remote",
                            "description": "Trabajo remoto internacional",
                            "platform": "Remote.co",
                            "matchScore": sec.randbelow(20) + 55,
                            "url": link_elem['href'] if link_elem else "#"
                        })
            except:
                pass
        
        # Try Arbeitnow API (public, no auth needed)
        if len(vacancies) < 5:
            try:
                url = f"https://www.arbeitnow.com/api/job-board?search={query.replace(' ', '+')}"
                resp = httpx.get(url, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("data", [])[:5]:
                        vacancies.append({
                            "id": f"arbeitnow_{sec.token_hex(6)}",
                            "title": item.get("title", query),
                            "company": item.get("company", "Company"),
                            "location": "Remote",
                            "description": item.get("description", "")[:200],
                            "platform": "Arbeitnow",
                            "matchScore": sec.randbelow(25) + 60,
                            "url": item.get("url", "#")
                        })
            except:
                pass
        
        # Try JSearch API if available
        jsearch_key = os.getenv("JSEARCH_API_KEY")
        if jsearch_key and len(vacancies) < 5:
            try:
                url = "https://jsearch.p.rapidapi.com/search"
                headers = {"X-RapidAPI-Key": jsearch_key}
                params = {"query": f"{query} remote", "page": "1", "num_pages": "1"}
                resp = httpx.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("data", [])[:5]:
                        vacancies.append({
                            "id": f"jsearch_{sec.token_hex(6)}",
                            "title": item.get("title", query),
                            "company": item.get("employer_name", "Company"),
                            "location": f"{item.get('job_city', '')}, {item.get('job_country', 'Remote')}",
                            "description": item.get("description", "")[:200],
                            "platform": "JSearch",
                            "matchScore": sec.randbelow(35) + 55,
                            "url": item.get("job_apply_link", "#")
                        })
            except:
                pass
        
        # Try Apify LinkedIn API (requires APIFY_API_KEY)
        if len(vacancies) < 5:
            apify_key = os.getenv("APIFY_API_KEY")
            if apify_key:
                try:
                    url = "https://api.apify.com/v2/acts/fantastic-jobs~advanced-linkedin-job-search-api/run-sync"
                    headers = {"Authorization": f"Bearer {apify_key}"}
                    payload = {"searchQuery": query, "maxResults": 10}
                    resp = httpx.post(url, json=payload, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("jobs", [])[:10]:
                            vacancies.append({
                                "id": f"apify_{sec.token_hex(6)}",
                                "title": item.get("title", query),
                                "company": item.get("company", "LinkedIn Company"),
                                "location": item.get("location", "Remote"),
                                "description": item.get("description", "")[:200],
                                "platform": "LinkedIn",
                                "matchScore": sec.randbelow(30) + 65,
                                "url": item.get("url", "#")
                            })
                except:
                    pass
        
        # Final fallback to demo data (query-aware)
        if not vacancies:
            demo_companies = ["TechCorp", "DataCorp", "CloudCo", "DevStudio", "RemoteJobs", "StartupX", "Enterprise", "GlobalTech"]
            demo_titles = [
                f"Senior {query} Developer",
                f"Remote {query} Engineer",
                f"{query} Specialist",
                f"Lead {query} Architect",
                f"Full Stack {query}",
                f"{query} Technical Lead",
                f"Senior {query} Analyst",
                f"{query} Consultant"
            ]
            platforms = ["Remotive", "We Work Remotely", "Remote.co", "Arbeitnow", "LinkedIn", "Indeed"]
            for i in range(8):
                vacancies.append({
                    "id": f"demo_{i}_{sec.token_hex(4)}",
                    "title": demo_titles[i] if i < len(demo_titles) else f"{query} Position",
                    "company": demo_companies[i % len(demo_companies)],
                    "matchScore": sec.randbelow(30) + 55,
                    "platform": platforms[i % len(platforms)],
                    "url": "#",
                    "location": "Remote",
                    "description": f"Oportunidad remota como {query} con salario competitivo y beneficios"
                })
        
        return jsonify({"vacancies": vacancies})
    except Exception as e:
        # Return safe fallback on error
        return jsonify({
            "vacancies": [
                {"id": "demo_1", "title": "Senior Developer", "company": "TechCorp", "matchScore": 85, "platform": "Remotive", "url": "#", "location": "Remote", "description": "Oportunidad remota"}
            ]
        })


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