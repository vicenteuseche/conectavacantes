"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const genai_1 = require("@google/genai");
const GEMINI_MODEL = "gemini-2.0-flash";
const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error("GEMINI_API_KEY is required.");
    return new genai_1.GoogleGenAI({ apiKey });
};
const formatGeminiError = (err) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("429") || errMsg.includes("Quota exceeded")) {
        return "Cuota excedida en Gemini API. Por favor, reintenta en unos segundos.";
    }
    return errMsg;
};
const rateLimitStore = new Map();
const apiRateLimiter = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
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
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "20mb" }));
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
            const parts = [];
            if (cv && typeof cv === "object" && cv.base64) {
                parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
            }
            else if (cv?.textData) {
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
                        type: genai_1.Type.OBJECT,
                        properties: {
                            vacancies: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        title: { type: genai_1.Type.STRING },
                                        company: { type: genai_1.Type.STRING },
                                        location: { type: genai_1.Type.STRING },
                                        lang: { type: genai_1.Type.STRING },
                                        matchScore: { type: genai_1.Type.NUMBER },
                                        description: { type: genai_1.Type.STRING },
                                        requirements: { type: genai_1.Type.STRING },
                                        platform: { type: genai_1.Type.STRING },
                                        sourceApi: { type: genai_1.Type.STRING },
                                        recruiterEmail: { type: genai_1.Type.STRING }
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
            return res.status(200).json(JSON.parse(rawText));
        }
        catch (err) {
            console.error("Match Error:", err);
            return res.status(500).json({ error: "Error en la IA: " + formatGeminiError(err) });
        }
    });
    app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
        try {
            const { cv, jobInput, format, linkedinProfile } = req.body;
            const ai = getGeminiClient();
            const parts = [];
            if (cv && typeof cv === "object" && cv.base64) {
                parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
            }
            else {
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
                        type: genai_1.Type.OBJECT,
                        properties: {
                            matchScore: { type: genai_1.Type.NUMBER },
                            detectedLanguage: { type: genai_1.Type.STRING },
                            generatedText: { type: genai_1.Type.STRING },
                            keywords: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        keyword: { type: genai_1.Type.STRING },
                                        matched: { type: genai_1.Type.BOOLEAN }
                                    }
                                }
                            },
                            strengths: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                            gaps: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } }
                        },
                        required: ["matchScore", "detectedLanguage", "generatedText", "keywords", "strengths", "gaps"]
                    }
                }
            });
            const rawText = response.text?.trim() || "{}";
            return res.status(200).json(JSON.parse(rawText));
        }
        catch (err) {
            return res.status(500).json({ error: formatGeminiError(err) });
        }
    });
    app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
        try {
            const { message, history } = req.body;
            const ai = getGeminiClient();
            const contents = history?.map((m) => ({
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
        }
        catch (err) {
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
    const oauthPage = (title, platform, color, keywords) => `
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
//# sourceMappingURL=createApp.js.map