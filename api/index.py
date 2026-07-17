"""
ConectaVacantes - API Serverless completa para Vercel
Con autenticación real usando Flask-SQLAlchemy
"""

import os
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import secrets
import json

load_dotenv()

app = Flask(__name__, template_folder='../templates')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///conectavacantes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelo de Base de Datos
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(80))


# ============================================
# Rutas de Autenticación
# ============================================

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        name = request.form.get('name', '')
        
        # Verificar si el usuario ya existe
        usuario_existente = Usuario.query.filter_by(email=email).first()
        if usuario_existente:
            flash('El usuario ya existe')
            return redirect(url_for('registro'))
        
        # Encriptar contraseña y guardar en base de datos
        hashed_password = generate_password_hash(password)
        nuevo_usuario = Usuario(email=email, password_hash=hashed_password, name=name)
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        flash('¡Registro exitoso! Inicia sesión.')
        return redirect(url_for('login'))
        
    return render_template('registro.html')


@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        usuario = Usuario.query.filter_by(email=email).first()
        
        # Validar contraseña y usuario
        if usuario and check_password_hash(usuario.password_hash, password):
            session['usuario_id'] = usuario.id
            session['usuario_email'] = usuario.email
            flash('Inicio de sesión exitoso')
            return redirect(url_for('dashboard'))
        else:
            flash('Usuario o contraseña incorrectos')
            
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada')
    return redirect(url_for('login'))


@app.route('/dashboard')
def dashboard():
    if 'usuario_id' not in session:
        flash('Inicia sesión primero')
        return redirect(url_for('login'))
    return f"<h1>Dashboard</h1><p>Bienvenido {session.get('usuario_email')}</p><a href='/logout'>Salir</a>"


# ============================================
# API Endpoints
# ============================================

@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        name = body.get("name", "")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        usuario_existente = Usuario.query.filter_by(email=email).first()
        if usuario_existente:
            return jsonify({"error": "El usuario ya existe"}), 400
        
        hashed_password = generate_password_hash(password)
        nuevo_usuario = Usuario(email=email, password_hash=hashed_password, name=name)
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({"success": True, "user": {"email": email, "name": name}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    try:
        body = request.get_json() or {}
        email = body.get("email")
        password = body.get("password")
        
        if not all([email, password]):
            return jsonify({"error": "Faltan credenciales"}), 400
        
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario and check_password_hash(usuario.password_hash, password):
            # Generar token JWT simple
            token = secrets.token_urlsafe(32)
            return jsonify({"success": True, "token": token, "user": {"email": email, "name": usuario.name}})
        else:
            return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Para pruebas locales
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)