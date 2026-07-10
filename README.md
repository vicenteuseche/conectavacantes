# ConectaVacantes

Aplicación completa en Python con Flask para conectar candidatos con oportunidades laborales remotas.

## 🚀 Características

- **Generador de cartas de presentación** - Optimizadas para ATS (Applicant Tracking System)
- **Búsqueda de vacantes remotas** - Personalizadas según tu perfil y preferencias
- **Asistente de carrera con IA** - Powered by Google Gemini
- **Integración OAuth simulada** - Con LinkedIn, Indeed y Workup para demo

## 📋 Requisitos

- Python 3.11 o superior
- API Key de Google Gemini (obtener en https://ai.google.dev)

## 🔧 Instalación

```bash
# Clonar repositiorio
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
| `/api/match-vacancies` | POST | Buscar vacantes coincidentes con tu perfil |
| `/api/generate` | POST | Generar carta de presentación o email |
| `/api/chat` | POST | Asistente de IA para consultas |
| `/api/mail/inbox` | GET | Bandeja de entrada simulada |
| `/auth/callback` | GET | Callback OAuth simulado |
| `/api/auth/{platform}/url` | GET | URLs de autenticación |
| `/oauth/{platform}-provider` | GET | Páginas OAuth simuladas |

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
├── main.py              # Aplicación Flask (backend + frontend routing)
├── requirements.txt     # Dependencias Python
├── Dockerfile           # Imagen Docker
├── vercel.json          # Configuración Vercel
├── .env.example         # Variables de entorno
├── templates/           # Templates HTML
│   └── index.html
├── static/              # Archivos estáticos
│   └── style.css
├── assets/              # Recursos estáticos
└── docs/                # Documentación
```

## 🔒 Seguridad

- Headers de seguridad HTTP (XSS, MIME sniffing, etc.)
- Rate limiting en endpoints API
- Validación SSRF para URLs externas
- CORS habilitado

## 📝 Licencia

MIT