# 1. Descomprimir tu proyecto adentro de la computadora de Google
unzip *.zip
# 2. Entrar a la carpeta raíz e instalar las dependencias reales de Node
npm install
# 3. Encender el servidor backend y el frontend sobre el puerto 3000
npm run dev
fuser -k 3000/tcp; pkill -f tsx; pkill -f node
npm run dev
printf '{\n  "hosting": {\n    "public": "dist",\n    "ignore": [\n      "firebase.json",\n      "**/.*",\n      "**/node_modules/**"\n    ],\n    "rewrites": [\n      {\n        "source": "**",\n        "destination": "/index.html"\n      }\n    ]\n  }\n}' > firebase.json
npm run build && firebase deploy --only hosting
npm run dev
rm -f bootstrap.min.css dist/bootstrap.min.css public/bootstrap.min.css 2>/dev/null || true
npm run build
firebase deploy --only hosting
# 1. Descomprimir tu proyecto adentro de la computadora de Google
unzip *.zip
# 2. Entrar a la carpeta raíz e instalar las dependencias reales de Node
npm install
# 3. Encender el servidor backend y el frontend sobre el puerto 3000
npm run dev
fuser -k 3000/tcp; pkill -f tsx; pkill -f node
npm run dev
npm run build && firebase deploy --only hosting
npm run dev
npm run build && firebase deploy --only hosting
npm run dev
# 1. Descomprimir tu proyecto adentro de la computadora de Google
unzip *.zip
# 2. Entrar a la carpeta raíz e instalar las dependencias reales de Node
npm install
# 3. Encender el servidor backend y el frontend sobre el puerto 3000
npm run dev
printf '{\n  "hosting": {\n    "public": "dist",\n    "ignore": [\n      "firebase.json",\n      "**/.*",\n      "**/node_modules/**"\n    ],\n    "rewrites": [\n      {\n        "source": "**",\n        "destination": "/index.html"\n      }\n    ]\n  }\n}' > firebase.json
npm run build && firebase deploy --only hosting
npm run dev
# 3. Encender el servidor backend y el frontend sobre el puerto 3000
npm run dev
npm run build && firebase deploy --only hosting
npm run dev
# 1. Asegúrate de tener todas las librerías instaladas
npm install
# 2. Ejecuta el servidor usando 'tsx' (que permite correr archivos .ts directamente)
npx tsx viWW.ts
{   "scripts": {;     "dev": "tsx watch viWW.ts",;     "start": "tsx viWW.ts",;     "build": "vite build";   }
}
npm install -D postcss
npm run dev
# 1. Instalar las dependencias limpias por si acaso
npm install
# 2. Encender el servidor web responsivo en el puerto 3000
npm run dev
npm run start
sudo apt-get update && sudo apt-get install unrar-free -y
7z x ConectaVacantes.rar
sudo apt-get update && sudo apt-get install unrar
sudo apt-get update && sudo apt-get install unrar -y
unrar x ConectaVacantes.rar
# Entra a la carpeta si se creó una nueva, o quédate en la raíz si se extrajo ahí
npm install
npm run start
cd ConectaVacantes
ls
npm install
npm start
npm run dev
chmod +x node_modules/.bin/tsx
chmod -R +x node_modules/.bin
rm -rf node_modules
npm install
npm run dev
rm -rf node_modules
npm install
npm run dev
npm run dev
cd ConectaVacantes
cd ConectaVacantes
npm run dev
npm run dev
cd ConectaVacantes
# 1. Asegúrate de que el frontend esté compilado
npm run build
# 2. Despliega a Firebase (requiere que estés logueado)
npx firebase deploy --only hosting,functions --project conectavacantes-2026
# 1. Instalar dependencias si no lo has hecho
npm install
# 2. Compilar el frontend
npm run build
# 3. Configurar el secreto en Firebase (esto soluciona el error en producción)
# Reemplaza TU_CLAVE por la clave real si el comando falla al leer el .env
grep GEMINI_API_KEY .env | cut -d '=' -f2 | tr -d '"' | npx firebase-tools functions:secrets:set GEMINI_API_KEY --project conectavacantes-2026
# 4. Desplegar todo
npx firebase-tools deploy --only hosting,functions --project conectavacantes-2026
gcloud builds submit --config cloudbuild.yaml
npm run dev
npm install express dotenv @google/genai vite nodemailer
npm install --save-dev @types/express @types/node tsx
