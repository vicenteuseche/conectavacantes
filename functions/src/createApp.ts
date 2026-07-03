import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash";

const fallbackVacancies = (query: string, regions: string[], languages: string[], contractTypes: string[]) => {
  const normalizedQuery = (query || "desarrollador").toLowerCase();
  const regionList = regions?.length ? regions : ["latam", "na", "es", "caribe"];
  const languageList = languages?.length ? languages : ["es", "en"];
  const contractList = contractTypes?.length ? contractTypes : ["contrato", "proyecto"];
  const platformSeed = ["LinkedIn", "Indeed", "Workup", "Adzuna", "Arbeitnow"];

  return [
    {
      title: normalizedQuery.includes("react") ? "Senior React Developer" : normalizedQuery.includes("node") ? "Backend Node.js Engineer" : "Full Stack Developer Remote",
      company: "NovaTech Labs",
      location: regionList.includes("na") ? "Remote · USA" : regionList.includes("es") ? "Remote · Spain" : "Remote · LATAM",
      lang: languageList.includes("en") ? "en" : "es",
      matchScore: 88,
      description: `Vacante alineada con ${query || "tu perfil"} y con experiencia en desarrollo remoto.`,
      requirements: `React, TypeScript, APIs, trabajo remoto, ${contractList.join(", ")}`,
      platform: platformSeed[0],
      sourceApi: "fallback",
      recruiterEmail: "talent@novatechlabs.com"
    },
    {
      title: normalizedQuery.includes("python") ? "Python Software Engineer" : "Product Engineer",
      company: "Remote Atlas",
      location: regionList.includes("latam") ? "Remote · LATAM" : "Remote · Europe",
      lang: languageList.includes("es") ? "es" : "en",
      matchScore: 74,
      description: `Oportunidad de ${query || "desarrollo"} con enfoque en producto y escalabilidad.`,
      requirements: `Cloud, testing, colaboración, ${contractList.join(", ")}`,
      platform: platformSeed[1],
      sourceApi: "fallback",
      recruiterEmail: "jobs@remoteatlas.com"
    },
    {
      title: normalizedQuery.includes("data") ? "Data Engineer" : "Frontend Engineer",
      company: "BlueBridge",
      location: regionList.includes("caribe") ? "Remote · Caribe" : "Remote · Global",
      lang: languageList.includes("en") ? "en" : "es",
      matchScore: 66,
      description: `Vacante híbrida para perfiles con base técnica y experiencia en ${query || "tecnología"}.`,
      requirements: `UI/UX, APIs, CI/CD, ${contractList.join(", ")}`,
      platform: platformSeed[2],
      sourceApi: "fallback",
      recruiterEmail: "careers@bluebridge.io"
    }
  ];
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required.");
  return new GoogleGenAI({ apiKey });
};

const formatGeminiError = (err: unknown): string => {
  const errMsg = err instanceof Error ? err.message : String(err);
  if (errMsg.includes("429") || errMsg.includes("Quota exceeded")) {
    return "Cuota excedida en Gemini API. Por favor, reintenta en unos segundos.";
  }
  return errMsg;
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

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

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));

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

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "ConectaVacantes API" });
  });

  app.post("/api/match-vacancies", apiRateLimiter(10, 60000), async (req, res) => {
    try {
      const { cv, profileKeywords, allowedRegions, languages, contractTypes, searchQuery } = req.body;
      const ai = getGeminiClient();
      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

      if (cv && typeof cv === "object" && cv.base64) {
        parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
      } else if (cv?.textData) {
        parts.push({ text: `CV del candidato:\n${cv.textData}` });
      }

      parts.push({
        text: `Actúa como un experto reclutador ATS. Analiza el CV adjunto y genera 6 vacantes realistas y variadas.
Keywords del perfil: ${profileKeywords || "N/A"}
Regiones: ${allowedRegions?.join(", ") || "Global"}
Idiomas: ${languages?.join(", ") || "es, en"}
Tipos de contrato: ${contractTypes?.join(", ") || "contrato, proyecto"}
Búsqueda del usuario: ${searchQuery || "vacantes remotas de tecnología"}

Incluye recruiterEmail válido por vacante y platform entre: LinkedIn, Indeed, Workup, Adzuna, Arbeitnow, Remotive.`
      });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: {
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

      const rawText = response.text?.replace(/```json|```/g, "").trim() || "{}";
      const parsed = JSON.parse(rawText);
      return res.status(200).json(parsed);
    } catch (err) {
      console.warn("Falling back to local search results because Gemini is unavailable:", err);
      const fallback = fallbackVacancies(req.body?.searchQuery || "desarrollador", req.body?.allowedRegions, req.body?.languages, req.body?.contractTypes);
      return res.status(200).json({ vacancies: fallback });
    }
  });

  app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
    try {
      const { cv, jobInput, format, linkedinProfile } = req.body;
      const ai = getGeminiClient();
      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

      if (cv && typeof cv === "object" && cv.base64) {
        parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
      } else {
        parts.push({ text: `CV del Candidato: ${typeof cv === "string" ? cv : cv?.textData || "Sin CV"}` });
      }

      parts.push({ text: `Descripción de la Vacante: ${jobInput}` });
      if (linkedinProfile) {
        parts.push({ text: `Perfil LinkedIn: ${linkedinProfile}` });
      }
      parts.push({
        text: `Genera una ${format === "cover-letter" ? "Carta de Presentación" : "Email de contacto"} optimizada para ATS.`
      });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: {
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

      const rawText = response.text?.trim() || "{}";
      return res.status(200).json(JSON.parse(rawText));
    } catch (err) {
      return res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
    try {
      const { message, history } = req.body;
      const ai = getGeminiClient();

      const contents =
        history?.map((m: { role: string; text: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        })) || [];
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: { temperature: 0.7 }
      });

      return res.status(200).json({ reply: response.text || "" });
    } catch (err) {
      return res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  app.get("/api/mail/inbox", async (_req, res) => {
    res.json({
      messages: [
        { id: "1", sender: "Talent Acquisition <hr@tech.com>", subject: "Entrevista para React Architect", preview: "Hola Vicente, nos gustaría agendar...", date: "Hoy", tag: "Entrevista" },
        { id: "2", sender: "LinkedIn Jobs", subject: "Nueva vacante para Data Scientist", preview: "Visto tu perfil, esta oferta...", date: "Ayer", tag: "Postulación" }
      ]
    });
  });

  app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
    const platform = String(req.query.platform || "linkedin");
    const profile = { name: "Vicente Useche", keywords: "React, Node.js, TypeScript", cvBio: "Ingeniero Senior..." };
    res.send(`
      <script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}', profile: ${JSON.stringify(profile)} }, '*');
        window.close();
      </script>
    `);
  });

  app.get("/api/auth/linkedin/url", (_req, res) => {
    res.json({ url: "/oauth/linkedin-provider" });
  });

  app.get("/api/auth/indeed/url", (_req, res) => {
    res.json({ url: "/oauth/indeed-provider" });
  });

  app.get("/api/auth/workup/url", (_req, res) => {
    res.json({ url: "/oauth/workup-provider" });
  });

  const oauthPage = (title: string, platform: string, color: string, keywords: string) => `
    <body style="background:#0f172a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
      <h2>${title}</h2>
      <button onclick="window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'${platform}', profile:{name:'Vicente Useche', keywords:'${keywords}'}}, '*'); window.close();"
        style="padding:10px 20px; background:${color}; border:none; color:white; border-radius:5px; cursor:pointer;">
        Autorizar y Sincronizar
      </button>
    </body>
  `;

  app.get("/oauth/linkedin-provider", (_req, res) => {
    res.send(oauthPage("Simulador de LinkedIn OAuth", "linkedin", "#0077b5", "React, Node.js"));
  });

  app.get("/oauth/indeed-provider", (_req, res) => {
    res.send(oauthPage("Simulador de Indeed OAuth", "indeed", "#2557a7", "Python, Automation"));
  });

  app.get("/oauth/workup-provider", (_req, res) => {
    res.send(oauthPage("Simulador de Workup OAuth", "workup", "#059669", "Freelance, Remote"));
  });

  return app;
}
