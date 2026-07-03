import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Validación básica de variables de entorno
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ ADVERTENCIA: GEMINI_API_KEY no encontrada. Las funciones de IA no funcionarán.");
}

app.use(express.json({ limit: "20mb" }));

// Security Headers Middlewares
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  if (req.url.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Limitador de Tasa para seguridad
const rateLimitStore = new Map<string, {count: number, resetTime: number}>();
const apiRateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
    const now = Date.now();
    let record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(ip, record);
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: "Demasiadas peticiones. Por favor, espera." });
    }
    record.count++;
    next();
  };
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required.");
  return new GoogleGenAI({ apiKey });
};

const formatGeminiError = (err: any): string => {
  const errMsg = err?.message || String(err);
  if (errMsg.includes("429") || errMsg.includes("Quota exceeded")) {
    return "Cuota excedida en Gemini API. Por favor, reintenta en unos segundos.";
  }
  return errMsg;
};

// Endpoint de Matching Inteligente de Vacantes
app.post("/api/match-vacancies", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, profileKeywords, allowedRegions } = req.body;
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> = [];

    // Si el CV es un PDF (objeto con base64), se envía como inlineData
    if (cv && typeof cv === 'object' && cv.base64) {
      parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
    }

    parts.push({
      text: `Actúa como un experto reclutador ATS. Analiza el CV proporcionado y genera exactamente 3 vacantes que tengan una alta afinidad técnica (Match Score estrictamente > 55%).
      Keywords adicionales: ${profileKeywords || 'N/A'}
      Regiones permitidas: ${allowedRegions?.join(', ') || 'Global'}.
      Cada vacante debe incluir MatchScore realista basado en el CV.`
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vacancies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  location: { type: Type.STRING },
                  lang: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  requirements: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  sourceApi: { type: Type.STRING },
                  recruiterEmail: { type: Type.STRING }
                },
                required: ["title", "company", "location", "lang", "matchScore", "description", "requirements", "platform", "sourceApi", "recruiterEmail"]
              }
            }
          },
          required: ["vacancies"]
        }
      }
    });

    const response = await result.response;
    return res.status(200).json(JSON.parse(response.text().trim()));
  } catch (err: unknown) {
    console.error("Error en match-vacancies:", err);
    return res.status(500).json({ error: formatGeminiError(err) || "Error interno al procesar vacantes" });
  }
});

// Endpoint de Generación de Postulaciones (Cover Letters)
app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, jobInput, format } = req.body;
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> = [];

    // Adjuntar CV (PDF o Texto)
    if (cv && typeof cv === 'object' && cv.base64) {
      parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
    } else {
      parts.push({ text: `CV del Candidato: ${typeof cv === 'string' ? cv : cv?.textData}` });
    }

    parts.push({ text: `Descripción de la Vacante: ${jobInput}` });
    parts.push({ text: `Genera una ${format === 'cover-letter' ? 'Carta de Presentación' : 'Email de contacto'} optimizado para ATS basado en este CV y vacante.` });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            detectedLanguage: { type: Type.STRING },
            generatedText: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  matched: { type: Type.BOOLEAN }
                }
              }
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["matchScore", "detectedLanguage", "generatedText", "keywords", "strengths", "gaps"]
        }
      }
    });

    const response = await result.response;
    return res.status(200).json(JSON.parse(response.text().trim()));
  } catch (err: unknown) {
    return res.status(500).json({ error: formatGeminiError(err) });
  }
});

// Consultor de Carrera (Chat IA)
// --- GMAIL API SIMULATION ---
app.get("/api/mail/inbox", async (_req, res) => {
  const messages = [
    { id: "1", sender: "Talent Acquisition", subject: "Actualización de Vacante", preview: "Gracias por tu interés, hemos revisado tu CV...", date: "Hoy", tag: "Postulación" },
    { id: "2", sender: "Empresa Global", subject: "Invitación a Entrevista", preview: "Tu perfil encaja perfectamente con nosotros...", date: "Ayer", tag: "Entrevista" }
  ];
  res.json({ messages });
});

// OAuth Simulated Providers (LinkedIn / Indeed)
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const { platform } = req.query;
  const profile = { name: "Usuario de " + platform, keywords: "", cvBio: "Perfil sincronizado de forma segura." };
  res.send(`
    <script>
      window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}', profile: ${JSON.stringify(profile)} }, '*');
      window.close();
    </script>
  `);
});

app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contents = history?.map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    })) || [];
    contents.push({ role: "user", parts: [{ text: message }] });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
      }
    });

    const response = await result.response;
    return res.status(200).json({ reply: response.text() });
  } catch (err: unknown) {
    return res.status(500).json({ error: formatGeminiError(err) });
  }
});

// OAuth Simulated Providers
app.get("/api/auth/linkedin/url", (req, res) => {
  res.json({ url: "/oauth/linkedin-provider" });
});

app.get("/api/auth/indeed/url", (req, res) => {
  res.json({ url: "/oauth/indeed-provider" });
});

app.get("/oauth/linkedin-provider", (req, res) => {
  res.send(`
    <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
      <h2>Simulador de LinkedIn OAuth</h2>
      <button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'linkedin', profile:{name:'Usuario LinkedIn', keywords:''}}, '*'); window.close();" 
        style="padding:10px 20px; background:#0077b5; border:none; color:white; border-radius:5px; cursor:pointer;">
        Autorizar y Sincronizar
      </button>
    </body>
  `);
});

app.get("/oauth/indeed-provider", (req, res) => {
  res.send(`
    <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
      <h2>Simulador de Indeed OAuth</h2>
      <button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'indeed', profile:{name:'Usuario Indeed', keywords:''}}, '*'); window.close();" 
        style="padding:10px 20px; background:#2557a7; border:none; color:white; border-radius:5px; cursor:pointer;">
        Autorizar y Sincronizar
      </button>
    </body>
  `);
});

async function startServer() {
  // Integrar Vite como middleware para que renderice el Frontend en el mismo puerto
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  app.use(vite.middlewares);

  // Servir el index.html de Vite para cualquier ruta que no sea de la API
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve('.', 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ConectaVacantes unificado corriendo con éxito en http://localhost:${PORT}`);
  });
}

startServer();