# Plan de Seguridad, Cumplimiento de Datos y Arquitectura de Producción 🛡️💼
## ConectaVacantes SaaS Pro — Documento Técnico Oficial

Este documento recoge de manera íntegra y exhaustiva la arquitectura en la nube de producción, las medidas de cumplimiento de protección de datos (GDPR / LGPD), las configuraciones de automatización CI/CD, las pruebas de estrés y la estrategia de optimización financiera para **ConectaVacantes SaaS Pro**.

---

## 1. Plan de Seguridad y Cumplimiento de Datos (GDPR / LGPD)

El tratamiento de Currículums (CVs) e integraciones con perfiles públicos exige cumplir de manera estricta los reglamentos europeos (**GDPR**) y brasileños (**LGPD**).

### A. Ciclo de Vida del Dato y Medidas Técnicas
```
[Ingreso: Consentimiento] ➔ [Carga: Cifrado TLS 1.3] ➔ [Reposo: AES-256 + Anonimización] ➔ [Purga: Borrado Seguro]
```

1.  **Consentimiento Explícito (Opt-In):** Antes de cargar cualquier archivo PDF o iniciar la vinculación vía OAuth, el usuario debe marcar activamente un checkbox obligatorio (no pre-marcado) de aceptación de términos. La base de datos almacena el ID del usuario, fecha, hora UTC y la versión exacta de la política aprobada.
2.  **Cifrado en Tránsito y Reposo:**
    *   **Tránsito:** Todas las transferencias de datos se realizan obligatoriamente bajo HTTPS empleando TLS 1.3.
    *   **Reposo:** Los archivos PDF en Google Cloud Storage (GCS) y los registros de la base de datos se almacenan cifrados con el algoritmo AES-256. Las llaves criptográficas son administradas y rotadas de manera automatizada cada 90 días mediante Google Cloud KMS.
3.  **Anonimización Proactiva para Procesamiento de IA:** Antes de despachar el currículum o datos laborales al motor de Inteligencia Artificial (Gemini API), un pipeline en el backend remueve cualquier dato sensible identificable (nombres propios, correos electrónicos directos, teléfonos, direcciones precisas o enlaces personales), reemplazándolos con identificadores pseudo-anonimizados (ej. `[CANDIDATO_ID_402]`).

### B. Derechos de los Titulares (ARCO / Derechos GDPR)
Para garantizar el ejercicio libre de los derechos de Acceso, Rectificación, Cancelación y Oposición, el sistema implementa:
*   **Derecho de Acceso y Portabilidad:** Desde el menú de edición de perfil, un botón permite descargar un archivo estructurado en formato JSON con todo el historial del CRM de postulación, metadatos extraídos y el currículum en texto plano.
*   **Derecho al Olvido (Eliminación Definitiva):** La opción "Eliminar cuenta de forma permanente" ejecuta un borrado físico inmediato en cascada: purga el archivo original del Storage, destruye el índice de embeddings en la IA y remueve físicamente el perfil en el CRM de la base de datos (evitando un simple *soft-delete* lógico).

---

## 2. Arquitectura Cloud Real para APIs Oficiales de OAuth

Para realizar la migración definitiva desde flujos simulados a la integración formal con **LinkedIn Sign-In** e **Indeed Apply API**, se implementa una arquitectura distribuida que resguarda el *Client Secret* de forma segura e inaccesible para clientes XSS.

### A. Diagrama de Flujo del Proceso OAuth
```
[Cliente / Frontend] ➔ (1. Solicita Login) ➔ [API Gateway / Backend Functions]
        ▲                                               │
        │ (4. Entrega JWT de Sesión)                    ▼ (2. Intercambia Code por Token)
        └───────────────────────────────────────── [LinkedIn / Indeed Identity Provider]
                                                        │
                                                        ▼ (3. Valida y retorna Profile Data)
```

### B. Componentes Tecnológicos
1.  **Frontend (Next.js / Vite en Firebase/Vercel):** Hospeda la interfaz de usuario. No manipula claves secretas ni tokens de larga duración.
2.  **Gestor de Secretos (Google Cloud Secret Manager):** Almacena las variables `LINKEDIN_CLIENT_SECRET` e `INDEED_APPLY_SECRET` con cifrado en reposo y políticas estrictas de IAM.
3.  **Backend / Serverless (Cloud Functions Gen 2):** Resuelven de manera segura la petición del servidor al proveedor de identidad de LinkedIn o Indeed.
4.  **Base de Datos (Firestore o Supabase PostgreSQL):** Guarda las llaves de acceso cifradas temporalmente para realizar actualizaciones asíncronas de datos en segundo plano.

---

## 3. Código de Backend para el Callback de OAuth (Google Cloud Functions)

Este fragmento en Node.js, listo para ejecutarse en Cloud Functions de 2ª generación o APIs serverless en Next.js, recupera el secreto de manera hermética y genera el script de cierre del popup:

```javascript
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

const secretClient = new SecretManagerServiceClient();

exports.linkedinCallback = async (req, res) => {
  // 1. Configurar cabeceras de seguridad CORS y Content-Type
  res.set('Access-Control-Allow-Origin', 'https://conectavacantes-2026.web.app');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Falta el código de autorización (code).' });
  }

  try {
    // 2. Recuperar el Client Secret de forma segura desde Google Secret Manager
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/YOUR_GCP_PROJECT_ID/secrets/LINKEDIN_CLIENT_SECRET/versions/latest',
    });
    const clientSecret = version.payload.data.toString('utf8');

    const clientId = 'TU_LINKEDIN_CLIENT_ID'; // Puede ser variable de entorno pública
    const redirectUri = 'https://TU_REGION-TU_PROYECTO.cloudfunctions.net/linkedinCallback';

    // 3. Intercambio de Code por Token (Server-to-Server)
    const tokenResponse = await axios.post('https://linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    // 4. Consumir la API oficial de LinkedIn para obtener el perfil del Candidato
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = {
      nombre: `${profileResponse.data.given_name} ${profileResponse.data.family_name}`,
      email: profileResponse.data.email,
      foto: profileResponse.data.picture,
      linkedinId: profileResponse.data.sub
    };

    // 5. GUARDAR O ACTUALIZAR EN TU BASE DE DATOS (Ej. Firestore o Supabase)
    // await db.collection('usuarios').doc(userData.email).set(userData, { merge: true });

    // 6. Inyección de Cookie Segura de Sesión (HttpOnly) y redirección final exitosa
    res.cookie('auth_session', userData.email, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600000 * 24 // 24 horas
    });

    // Envía un script para cerrar el popup de forma limpia y recargar el dashboard
    return res.send(`
      <script>
        window.opener.postMessage({ type: 'AUTH_SUCCESS', user: ${JSON.stringify(userData)} }, 'https://conectavacantes-2026.web.app');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('Error crítico en el flujo de OAuth:', error.response?.data || error.message);
    return res.status(500).send('Error interno durante la autenticación con LinkedIn.');
  }
};
```

---

## 4. Regla de Ciclo de Vida en Google Cloud Storage (GCS)

Para cumplir estrictamente con los principios de GDPR/LGPD de *"limitación del plazo de conservación"*, configuramos una regla que elimina automáticamente y de forma irreversible los currículums que superen los 90 días de antigüedad dentro de GCS.

### Configuración con Archivo `gcs-lifecycle.json`
```json
{
  "rule": [
    {
      "action": {
        "type": "Delete"
      },
      "condition": {
        "age": 90,
        "isLive": true
      }
    }
  ]
}
```

Aplica esta política de forma remota ejecutando:
```bash
gcloud storage buckets update gs://TU_BUCKET_CONECTAVACANTES --lifecycle-file=gcs-lifecycle.json
```

---

## 5. Configuración de OAuth en la Consola de Desarrolladores de LinkedIn

1.  **Habilitar Producto:** Ve al portal de desarrolladores de LinkedIn, ingresa a tu aplicación, pestaña *Products* y solicita acceso para **"Sign In with LinkedIn using OpenID Connect"**.
2.  **Configurar URLs de Redirección:** En la pestaña *Auth*, bajo *OAuth 2.0 settings*, configura los dominios autorizados de retorno:
    *   **Redirect URL:** `https://TU_REGION-TU_PROYECTO.cloudfunctions.net/linkedinCallback`
    *   **JavaScript Origins (CORS):** `https://conectavacantes-2026.web.app`

---

## 6. Componente Frontend en React (Seguro para Popups)

Este componente controla la apertura y el canal de mensajería seguro entre la ventana emergente y el dashboard principal:

```tsx
import React, { useEffect, useState } from 'react';

interface UserData {
  nombre: string;
  email: string;
  foto: string;
  linkedinId: string;
}

export default function LinkedInLoginButton() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // VALIDACIÓN CRÍTICA: Verificar procedencia del servidor confiable de Cloud Functions
      const expectedOrigin = 'https://us-central1-TU_PROYECTO.cloudfunctions.net';
      if (event.origin !== expectedOrigin) return;

      if (event.data && event.data.type === 'AUTH_SUCCESS') {
        setUser(event.data.user);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleLinkedInConnect = () => {
    setIsLoading(true);

    const clientId = 'TU_LINKEDIN_CLIENT_ID';
    const redirectUri = encodeURIComponent('https://us-central1-TU_PROYECTO.cloudfunctions.net/linkedinCallback');
    const scope = encodeURIComponent('openid profile email');
    const state = Math.random().toString(36).substring(7);

    const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      oauthUrl,
      'LinkedIn Auth',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes`
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl">
      {user ? (
        <div className="flex items-center gap-4">
          <img src={user.foto} alt={user.nombre} className="w-12 h-12 rounded-full border-2 border-blue-500" />
          <div>
            <h3 className="text-white font-medium font-mono">{user.nombre}</h3>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleLinkedInConnect}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-mono rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? 'Conectando...' : 'Sincronizar con LinkedIn'}
        </button>
      )}
    </div>
  );
}
```

---

## 7. Configuración de Cuentas de Servicio y Permisos IAM

Utiliza el principio de menor privilegio en Google Cloud Platform configurando cuentas de servicio dedicadas:

```bash
# A. Crear la Cuenta de Servicio dedicada
gcloud iam service-accounts create conectavacantes-oauth-sa \
    --description="Cuenta de servicio para ejecutar las funciones de callback de OAuth" \
    --display-name="ConectaVacantes OAuth SA"

# B. Asignar el rol exclusivo de lectura de secretos
gcloud secrets add-iam-policy-binding LINKEDIN_CLIENT_SECRET \
    --member="serviceAccount:conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# C. Desplegar la función vinculada a la cuenta de servicio creada
gcloud functions deploy linkedinCallback \
    --gen2 \
    --runtime=nodejs20 \
    --region=us-central1 \
    --trigger-http \
    --service-account="conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --allow-unauthenticated
```

---

## 8. Configuración para la API de Indeed Apply

Indeed procesa las postulaciones a través del widget de postulación directa. Para vincular los datos estructurados y transferir el PDF al backend de ConectaVacantes, se crea el archivo `indeed-apply-config.json` en el repositorio:

```json
{
  "clientId": "TU_INDEED_CLIENT_ID",
  "jobId": "VACANTE_ID_DINAMICO",
  "postUrl": "https://us-central1-TU_PROYECTO.cloudfunctions.net/indeedApplyCallback",
  "questionsUrl": "https://us-central1-TU_PROYECTO.cloudfunctions.net/indeedQuestions",
  "phoneRequired": "optional",
  "resumeRequired": "required",
  "coverLetter": "optional",
  "sandbox": true,
  "dataPassed": {
    "platformName": "ConectaVacantes",
    "version": "2026.1"
  },
  "requestedFields": [
    "applicantName",
    "applicantEmail",
    "applicantPhoneNumber",
    "applicantResumePdf",
    "applicantWorkExperience",
    "applicantEducation"
  ]
}
```

Para vincular las llaves, se almacena el token en Google Secret Manager bajo el nombre de `INDEED_APPLY_SECRET` y se otorgan permisos de acceso a la cuenta de servicio:
```bash
gcloud secrets add-iam-policy-binding INDEED_APPLY_SECRET \
    --member="serviceAccount:conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## 9. Código Node.js para Procesar el Webhook de Indeed Apply

Esta Google Cloud Function de segunda generación recibe, valida criptográficamente (HMAC-SHA256) y procesa los datos transmitidos de forma asíncrona por Indeed:

```javascript
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const crypto = require('crypto');

const secretClient = new SecretManagerServiceClient();

exports.indeedApplyCallback = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const indeedSignature = req.headers['x-indeed-signature'];
  if (!indeedSignature) {
    console.warn(JSON.stringify({ severity: 'WARNING', message: 'Intento de acceso sin firma de Indeed.' }));
    return res.status(401).send('Falta la firma de autenticación.');
  }

  try {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/YOUR_GCP_PROJECT_ID/secrets/INDEED_APPLY_SECRET/versions/latest',
    });
    const indeedSecret = version.payload.data.toString('utf8');

    const hmac = crypto.createHmac('sha256', indeedSecret);
    const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');

    if (indeedSignature !== calculatedSignature) {
      console.error(JSON.stringify({ severity: 'CRITICAL', message: 'Firma de Webhook inválida detectada.' }));
      return res.status(403).send('Firma no coincide.');
    }

    const { applicant, job } = req.body;
    
    const candidateData = {
      nombre: applicant.name,
      email: applicant.email,
      telefono: applicant.phone || 'No provisto',
      vacanteId: job.id,
      experiencia: applicant.resume?.workExperience || [],
      educacion: applicant.resume?.education || [],
      cvBase64: applicant.resume?.file?.data || null 
    };

    console.log(JSON.stringify({
      severity: 'INFO',
      message: `Webhook de Indeed procesado con éxito para el candidato.`,
      email: candidateData.email,
      vacanteId: candidateData.vacanteId
    }));

    return res.status(200).json({ status: 'success', message: 'Postulación recibida en ConectaVacantes' });

  } catch (error) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: 'Error procesando el webhook de Indeed Apply',
      error: error.message
    }));
    return res.status(500).send('Error interno del servidor.');
  }
};
```

---

## 10. Pipeline de CI/CD en GitHub Actions

Automatiza el despliegue de las Cloud Functions al confirmar cambios en `main` mediante la conexión segura OIDC (Workload Identity Federation):

```yaml
name: Deploy Cloud Functions to GCP

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
      - name: Checkout del código
        uses: actions/checkout@v4

      - name: Autenticación en Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/TU_NUMERO_PROYECTO/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com'

      - name: Configurar Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Desplegar Callback de LinkedIn
        run: |
          gcloud functions deploy linkedinCallback \
            --gen2 \
            --runtime=nodejs20 \
            --region=us-central1 \
            --trigger-http \
            --entry-point=linkedinCallback \
            --service-account=conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
            --allow-unauthenticated

      - name: Desplegar Webhook de Indeed Apply
        run: |
          gcloud functions deploy indeedApplyCallback \
            --gen2 \
            --runtime=nodejs20 \
            --region=us-central1 \
            --trigger-http \
            --entry-point=indeedApplyCallback \
            --service-account=conectavacantes-oauth-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
            --allow-unauthenticated
```

---

## 11. Estrategia de Logging en Google Cloud Logging

Estructuración de JSON Logs por niveles de gravedad para el disparador automático de incidentes críticos:

*   **Severidad: INFO (Monitoreo Operativo)**
    ```json
    { "severity": "INFO", "component": "OAuth_Engine", "message": "Inicio de sesión exitoso mediante OAuth corporativo.", "provider": "LinkedIn", "userId": "usr_94827" }
    ```
*   **Severidad: WARNING (Comportamiento Anómalo)**
    ```json
    { "severity": "WARNING", "component": "Security_Gate", "message": "Falla de autenticación: El token de estado (state CSRF) no coincide con la sesión.", "ipAddress": "192.168.1.50" }
    ```
*   **Severidad: CRITICAL (Ataques Activos)**
    ```json
    { "severity": "CRITICAL", "component": "Indeed_Webhook", "message": "Intento masivo de peticiones con firmas SHA256 inválidas. Posible ataque de inyección o fuerza bruta.", "origin": "Indeed_Endpoint" }
    ```

---

## 12. Plan de Pruebas de Carga para Cloud Functions (Artillery)

Evaluación del auto-escalado horizontal de las funciones serverless bajo tres fases simultáneas:

### Configuración de `load-test.yml`
```yaml
config:
  target: "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Fase 1: Carga Base (5 postulaciones/seg)"
    - duration: 120
      arrivalRate: 5
      rampTo: 50
      name: "Fase 2: Pico de Tráfico (Escalado rampa hasta 50/seg)"
    - duration: 60
      arrivalRate: 100
      name: "Fase 3: Estrés Máximo (Saturación a 100/seg)"
  defaults:
    headers:
      Content-Type: "application/json"
      x-indeed-signature: "MOCK_SIGNATURE_FOR_TESTING"

scenarios:
  - name: "Envío de Postulaciones Webhook"
    flow:
      - post:
          url: "/indeedApplyCallback"
          json:
            applicant:
              name: "Candidato de Prueba"
              email: "test@conectavacantes.com"
              resume:
                workExperience: [{ "company": "Tech Corp", "title": "Developer" }]
            job:
              id: "job_12345"
```

---

## 13. Dashboards de Monitorización Visual en Cloud Monitoring (MQL)

Para crear visualizaciones directas sobre el rendimiento de las llamadas, se configuran las siguientes consultas MQL:

### Métrica 1: Latencia de Funciones (Percentil 95)
```mql
fetch cloud_run_revision
| metric 'run.googleapis.com/request_latencies'
| filter (resource.service_name == 'indeedApplyCallback' || resource.service_name == 'linkedinCallback')
| group_by 1m, [value_request_latencies_percentile: percentile(value.request_latencies, 95)]
| every 1m
```

### Métrica 2: Tasa de Errores de Red por Clase de Estado HTTP
```mql
fetch cloud_run_revision
| metric 'run.googleapis.com/request_count'
| filter (resource.service_name == 'indeedApplyCallback')
| align rate(1m)
| group_by [metric.response_code_class], max(value.request_count)
```

---

## 14. Optimización de Costos en Google AI Studio (Context Caching)

El volumen de llamadas a la API de Gemini para la evaluación ATS repetida se reduce drásticamente mediante **Context Caching**. Guardamos la descripción de la vacante, las instrucciones de rol y los criterios del sistema para consultas de más de 32,768 tokens:

```javascript
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

async function createJobContextCache(jobDescription, systemInstruction) {
  const auth = new GoogleAuth({
    scopes: 'https://googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).data;

  const ttlSeconds = "7200s"; // Duración de 2 horas en la memoria caché interna

  const cachePayload = {
    model: "models/gemini-1.5-pro",
    ttl: ttlSeconds,
    contents: [
      {
        role: "user",
        parts: [{ text: `Aquí están los requisitos detallados de la vacante: ${jobDescription}` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/cachedContents`,
    cachePayload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.name; // Retorna el ID de la caché: cachedContents/1234567890
}
```

---
¡El sistema ConectaVacantes SaaS Pro queda completamente documentado y optimizado bajo las más altas directrices corporativas! Ready to fly! 🚀
