"""
ConectaVacantes - API Serverless para Vercel
Endpoints optimizados
"""

import os
import json
from datetime import datetime
from flask import Flask, request, jsonify

# Crear aplicación Flask
app = Flask(__name__)

# Datos de fallback para vacantes
def fallback_vacancies():
    return [
        {
            "title": "Senior React Developer",
            "company": "NovaTech Labs",
            "location": "Remote · USA",
            "lang": "en",
            "matchScore": 88,
            "description": "Vacante alineada con desarrollador",
            "requirements": "React, TypeScript, APIs",
            "platform": "LinkedIn",
            "sourceApi": "fallback",
            "recruiterEmail": "talent@novatechlabs.com"
        },
        {
            "title": "Python Software Engineer",
            "company": "Remote Atlas",
            "location": "Remote · LATAM",
            "lang": "es",
            "matchScore": 74,
            "description": "Oportunidad remota con enfoque en producto",
            "requirements": "Cloud, testing",
            "platform": "Indeed",
            "sourceApi": "fallback",
            "recruiterEmail": "jobs@remoteatlas.com"
        },
        {
            "title": "Frontend Engineer",
            "company": "BlueBridge",
            "location": "Remote · Global",
            "lang": "en",
            "matchScore": 66,
            "description": "Vacante para perfiles técnicos",
            "requirements": "UI/UX, APIs, CI/CD",
            "platform": "Workup",
            "sourceApi": "fallback",
            "recruiterEmail": "careers@bluebridge.io"
        }
    ]

# Endpoint de health check
def health_check():
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})

# Endpoint para vacantes
def match_vacancies():
    body = request.get_json() or {}
    query = body.get("query", "desarrollador")
    
    return jsonify({
        "vacancies": fallback_vacancies()
    })

# Endpoint para generar contenido
def generate_content():
    body = request.get_json() or {}
    
    return jsonify({
        "matchScore": 75,
        "detectedLanguage": "es",
        "generatedText": "Carta de presentación generada. Por favor configure GEMINI_API_KEY para usar IA real.",
        "keywords": ["React", "Python", "TypeScript"],
        "strengths": ["Experiencia en desarrollo web"],
        "gaps": []
    })

# Endpoint de chat
def chat():
    body = request.get_json() or {}
    message = body.get("message", "")
    
    return jsonify({
        "reply": "Respuesta del asistente. Configure GEMINI_API_KEY para usar IA real."
    })

# Endpoint de bandeja de entrada
def mail_inbox():
    return jsonify({
        "messages": [
            {"id": "1", "sender": "Talent Acquisition <hr@tech.com>", "subject": "Entrevista React", "preview": "Hola...", "date": "Hoy", "tag": "Entrevista"},
            {"id": "2", "sender": "LinkedIn Jobs", "subject": "Nueva vacante", "preview": "Visto tu perfil...", "date": "Ayer", "tag": "Postulación"}
        ]
    })

# Registrar rutas
@app.route("/api/health")
def health():
    return health_check()

@app.route("/api/match-vacancies", methods=["POST"])
def match():
    return match_vacancies()

@app.route("/api/generate", methods=["POST"])
def generate():
    return generate_content()

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    return chat()

@app.route("/api/mail/inbox")
def inbox():
    return mail_inbox()

# Handler para Vercel
def handler(event, context):
    return app(event, context)

if __name__ == "__main__":
    app.run()