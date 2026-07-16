# ConectaVacantes

Aplicación completa en Python con Flask para conectar candidatos con oportunidades laborales remotas usando IA.

## 🚀 Características

- **Generador de cartas de presentación** - Optimizadas para ATS (Applicant Tracking System)
- **Búsqueda de vacantes remotas** - Personalizadas según tu perfil y preferencias (We Work Remotely, Remote.co, Arc.dev, Hired.app, Jobspresso.co)
- **Asistente de carrera con IA** - Powered by Google Gemini
- **Parsing automático de CV** - Extrae nombre, teléfono, email, dirección y habilidades de PDF/DOCX
- **Autenticación completa** - Login/Register + Google OAuth
- **Dashboard con gráficos** - Estadísticas de postulaciones y vacantes (Chart.js)
- **Seguimiento de aplicaciones** - Estados: Enviado, Leído, Sin respuesta, Rechazado
- **Recomendaciones de cursos** - Cursos gratuitos basados en tus habilidades
- **Envío automático de correos** - Cuando match > 55%, se envía automáticamente al reclutador

## 📋 Requisitos

- Python 3.11 o superior
- API Key de Google Gemini (obtener en https://ai.google.dev)

## 🔧 Instalación

```bash
# Clonar repositorio
git clone https://github.com/vicenteuseche/conectavacantes.git
cd conectavacantes

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY
```

## 🚀 Ejecución

```bash
# Desarrollo local
python main.py

# O con gunicorn (producción)
gunicorn --bind 0.0.0.0:8080 main:app
```

## 📡 Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Verificar estado del servidor |
| `/api/parse-cv` | POST | Parsear CV y extraer datos (nombre, teléfono, email, habilidades) |
| `/api/match-vacancies` | POST | Buscar vacantes coincidentes con tu perfil |
| `/api/generate` | POST | Generar carta de presentación o email |
| `/api/chat` | POST | Asistente de IA para consultas |
| `/api/mail/inbox` | GET | Bandeja de entrada simulada |
| `/api/mail/send` | POST | Enviar correo de postulación |
| `/api/dashboard/stats` | GET | Estadísticas del dashboard |
| `/api/dashboard/chart` | GET | Datos para gráficos |
| `/api/courses` | GET | Recomendaciones de cursos gratuitos |
| `/api/applications` | GET/POST | Gestión de aplicaciones |
| `/api/applications/<id>/status` | PATCH | Actualizar estado de aplicación |
| `/api/auth/register` | POST | Registro de usuario |
| `/api/auth/login` | POST | Login de usuario |
| `/api/auth/google/url` | GET | URL de autenticación Google |
| `/oauth/google-provider` | GET | Página OAuth de Google |

## 🐳 Despliegue

### Docker
```bash
docker build -t conectavacantes .
docker run -p 8080:8080 conectavacantes
```

### Vercel
El proyecto está configurado para desplegarse en Vercel usando Python serverless functions:
```bash
vercel --prod
```

## 📁 Estructura del Proyecto

```
conectavacantes/
├── main.py              # Aplicación Flask completa
├── requirements.txt     # Dependencias Python
├── api/
│   ├── index.py         # API Serverless para Vercel
│   └── requirements.txt # Dependencias del API
├── index.html           # Frontend principal
├── static/app.js        # JavaScript del frontend
├── static/style.css     # Estilos CSS
├── vercel.json          # Configuración Vercel
└── .env.example         # Variables de entorno
```

## 🔒 Seguridad

- Headers de seguridad HTTP (XSS, MIME sniffing, etc.)
- Rate limiting en endpoints API
- Validación SSRF para URLs externas
- CORS habilitado
- Hashing de contraseñas

## 📝 Licencia

MIT