import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON payload parser with a limit of 20MB for PDF file transfers
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

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

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
      const remainingMs = record.resetTime - now;
      res.status(429).json({
        error: `Límite excedido. Espera ${Math.ceil(remainingMs / 1000)} segundos.`
      });
      return;
    }
    
    record.count++;
    next();
  };
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing.");
  return new GoogleGenAI({ apiKey });
};

const formatGeminiError = (err: any): string => {
  const errMsg = err?.message || String(err);
  if (errMsg.includes("RESOURCE_EXHAUSTED")) return "Límite de cuota Gemini excedido.";
  return errMsg;
};

function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    return !["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  } catch { return false; }
}

async function fetchJobText(urlOrText: string): Promise<string> {
  const trimmed = urlOrText.trim();
  if (!trimmed.startsWith("http")) return trimmed;
  if (!isSafeUrl(trimmed)) throw new Error("URL no segura.");
  
  try {
    const response = await fetch(trimmed);
    let cleanText = await response.text();
    return cleanText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 15000);
  } catch { throw new Error("Error al leer la URL."); }
}

app.get("/api/health", (req, res) => res.json({ status: "healthy" }));

app.post("/api/match-vacancies", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, profileKeywords, allowedRegions } = req.body;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: `Generate 3 jobs for: ${profileKeywords}` }],
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (err) { res.status(500).json({ error: formatGeminiError(err) }); }
});

app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, jobInput, format } = req.body;
    const jobText = await fetchJobText(jobInput);
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: `Optimize ${format} for: ${jobText}` }],
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (err) { res.status(500).json({ error: formatGeminiError(err) }); }
});

app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
  try {
    const { message } = req.body;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: message }] }]
    });
    res.json({ reply: response.text });
  } catch (err) { res.status(500).json({ error: formatGeminiError(err) }); }
});

app.get("/api/auth/linkedin/url", (req, res) => {
  res.json({ url: "/oauth/linkedin-provider?redirect_uri=" + encodeURIComponent("/auth/callback") });
});

app.get("/oauth/linkedin-provider", (req, res) => {
  res.send(`<html><body><a href="${req.query.redirect_uri}?code=123&platform=linkedin">Simulate LinkedIn Auth</a></body></html>`);
});

app.get("/auth/callback", (req, res) => {
  const { platform } = req.query;
  const userProfile = { name: "Vicente Useche", platform };
  res.send(`<html><body><script>window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS', platform:'${platform}', profile:${JSON.stringify(userProfile)}}, '*');window.close();</script></body></html>`);
});

async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

main().catch(console.error);