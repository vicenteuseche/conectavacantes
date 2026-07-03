import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite´;

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

    const contents = [{
      role: 'user',
      parts: [{
        text: `Actúa como un experto reclutador ATS. Genera 3 vacantes realistas para el siguiente perfil:
        CV: ${typeof cv === 'string' ? cv : 'PDF Subido'}
        Keywords: ${profileKeywords || 'N/A'}
        Regiones: ${allowedRegions?.join(', ') || 'Global'}`
      }]
    }];

    const result = await model.generateContent({
      contents,
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
                  matchScore: { type: Type.INTEGER },
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
    const responseText = response.text();
    res.json(JSON.parse(responseText.trim()));
  } catch (err) {
    res.status(500).json({ error: formatGeminiError(err) });
  }
});

// Endpoint de Generación de Postulaciones (Cover Letters)
app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, jobInput, format } = req.body;
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contents = [{
      role: 'user',
      parts: [
        { text: `CV: ${typeof cv === 'string' ? cv : 'PDF Data'}` },
        { text: `Vacante: ${jobInput}` },
        { text: `Genera una ${format} optimizada para ATS.` }
      ]
    }];

    const result = await model.generateContent({
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
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
    const responseText = response.text();
    res.json(JSON.parse(responseText.trim()));
  } catch (err) {
    res.status(500).json({ error: formatGeminiError(err) });
  }
});

// Consultor de Carrera (Chat IA)
app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Eres un asesor de carrera experto en ConectaVacantes Pro. Ayuda al candidato a conseguir empleo remoto."
    });

    const contents = history?.map((m: any) => ({
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
    res.json({ reply: response.text() });
  } catch (err) {
    res.status(500).json({ error: formatGeminiError(err) });
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
      <button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'linkedin', profile:{name:'Vicente Useche', keywords:'React, Node.js'}}, '*'); window.close();" 
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
      <button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'indeed', profile:{name:'Vicente Useche', keywords:'Python, Automation'}}, '*'); window.close();" 
        style="padding:10px 20px; background:#2557a7; border:none; color:white; border-radius:5px; cursor:pointer;">
        Autorizar y Sincronizar
      </button>
    </body>
  `);
});

// Inicialización del Servidor
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ConectaVacantes backend & frontend activo en http://0.0.0.0:${PORT}`);
  });
}

main().catch(console.error);