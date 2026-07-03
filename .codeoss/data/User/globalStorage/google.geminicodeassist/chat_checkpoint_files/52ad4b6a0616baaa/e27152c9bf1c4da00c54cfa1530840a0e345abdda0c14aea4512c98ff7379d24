import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Validación básica para evitar que el servidor se caiga si falta la API Key al inicio
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ ADVERTENCIA: GEMINI_API_KEY no encontrada. Las funciones de IA no funcionarán.");
}
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("⚠️ ADVERTENCIA: GOOGLE_CLIENT_ID no encontrada. El login con Gmail fallará.");
}

// Set up JSON payload parser with a limit of 20MB for PDF file transfers
app.use(express.json({ limit: "20mb" }));

// Security Headers Middlewares
app.use((req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Control referrer information sent with requests
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Protect against XSS attacks in older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Custom secure caching for API endpoints
  if (req.url.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Limitador de Tasa para prevenir Abuso de API (DoS Protection)
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
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(ip, record);
      return next();
    }
    
    if (record.count >= maxRequests) {
      const remainingMs = record.resetTime - now;
      res.status(429).json({
        error: `Has superado el límite de peticiones de seguridad para prevenir ataques de denegación de servicio. Por favor, espera ${Math.ceil(remainingMs / 1000)} segundos.`
      });
      return;
    }
    
    record.count++;
    next();
  };
};

// Initialize the Gemini client securely
// Always check if the key is present and handle gracefully
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your Secrets / Env variables.");
  }
  return new GoogleGenAI({ 
    apiKey: apiKey.trim(), // Limpiar espacios accidentales
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Manejo de Errores Amigable para el Usuario (Quota & Demand)
const formatGeminiError = (err: any): string => {
  const errMsg = err?.message || String(err);
  const errStatus = err?.status || err?.code || "";

  // Check if error is related to rate limiting (RESOURCE_EXHAUSTED / 429)
  if (
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("Quota exceeded") ||
    errMsg.includes("429") ||
    errStatus === 429 ||
    errStatus === "RESOURCE_EXHAUSTED"
  ) {
    return "Has excedido el límite de cuota de la API de Gemini (máximo 5 peticiones por minuto en la cuota gratuita). Por favor, espera unos 25 segundos antes de volver a intentarlo. Si requieres mayor velocidad y libre de límites de peticiones por minuto, puedes activar un plan de pago o configurar una clave de API de pago en la sección de secretos (Secrets) de AI Studio.";
  }

  // Check if error is related to service unavailable / high demand (503)
  if (
    errMsg.includes("experiencing high demand") ||
    errMsg.includes("UNAVAILABLE") ||
    errMsg.includes("503") ||
    errStatus === 503 ||
    errStatus === "UNAVAILABLE"
  ) {
    return "El servidor de Gemini está experimentando una alta demanda temporal en estos momentos (código 503). Esto suele durar solo unos pocos segundos. Por favor, reintenta tu acción en un momento.";
  }

  // Check if error is API Key missing or invalid
  if (errMsg.includes("API key not valid") || errMsg.includes("invalid api key") || errMsg.includes("API_KEY_INVALID")) {
    return "La clave de la API de Gemini no es válida o ha caducado. Por favor, verifica la configuración de tus secretos (Secrets) en el panel de secretos de AI Studio.";
  }

  return errMsg;
};

// Validación de URLs Seguras para prevenir ataques SSRF
function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block typical loopback, link-local and private IP addresses
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("169.254.")
    ) {
      return false;
    }
    
    // Block private IP ranges 172.16.0.0 - 172.31.255.255
    if (hostname.startsWith("172.")) {
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        const secondPart = parseInt(parts[1], 10);
        if (secondPart >= 16 && secondPart <= 31) {
          return false;
        }
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

// Extractor de Texto de Vacantes desde URLs
async function fetchJobText(urlOrText: string): Promise<string> {
  const trimmed = urlOrText.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  if (!isSafeUrl(trimmed)) {
    throw new Error("Acceso denegado: La URL especificada viola las políticas de seguridad (SSRF Bloqueado).");
  }
  
  try {
    const response = await fetch(trimmed, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage. HTTP status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Clean up HTML content to extract core text
    let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    cleanText = cleanText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    cleanText = cleanText.replace(/<!--[\s\S]*?-->/g, "");
    cleanText = cleanText.replace(/<\/(div|p|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n");
    cleanText = cleanText.replace(/<[^>]+>/g, " ");
    
    // Unescape basic HTML entities
    cleanText = cleanText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Normalize spaces
    cleanText = cleanText.replace(/\s+/g, " ").trim();
    
    if (cleanText.length > 15000) {
      cleanText = cleanText.substring(0, 15000) + "... (truncated)";
    }
    
    return cleanText;
  } catch (err: any) {
    throw new Error(`Could not read the career page URL: ${err.message || err}. Please paste the raw text description instead.`);
  }
}

// Verificación de Estado del Sistema
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Almacenamiento temporal de tokens (En producción usar una base de datos)
const googleTokens = new Map<string, string>();

// Endpoint para obtener la URL de OAuth de Google
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUri = encodeURIComponent(`${protocol}://${host}/auth/callback`);
  
  const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=google`;
  
  res.json({ url });
});

// Endpoint para obtener correos reales de Gmail
app.get("/api/mail/inbox", apiRateLimiter(15, 60000), async (req, res) => {
  const userEmail = req.query.email as string;
  const token = googleTokens.get(userEmail);

  if (!token) {
    return res.status(401).json({ error: "No conectado a Google" });
  }

  try {
    // 1. Obtener lista de mensajes filtrados por palabras clave de reclutamiento
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=subject:(postulación OR entrevista OR vacante OR "gracias por postularte")`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();

    if (!listData.messages) return res.json({ messages: [] });

    // 2. Obtener detalles de cada mensaje
    const messages = await Promise.all(listData.messages.map(async (m: any) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detail = await detailRes.json();
      
      const headers = detail.payload.headers;
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "(Sin asunto)";
      const from = headers.find((h: any) => h.name === "From")?.value || "Desconocido";
      const date = headers.find((h: any) => h.name === "Date")?.value || "";

      return {
        id: detail.id,
        sender: from,
        subject: subject,
        preview: detail.snippet,
        date: new Date(date).toLocaleDateString(),
        isRead: !detail.labelIds.includes("UNREAD"),
        tag: subject.toLowerCase().includes("entrevista") ? "Entrevista" : "Postulación",
        fullBody: detail.snippet
      };
    }));

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Error al sincronizar con Gmail API" });
  }
});

// Endpoint para almacenar el token de Google tras el callback
app.post("/api/auth/google/store-token", (req, res) => {
  const { email, token } = req.body;
  if (email && token) {
    googleTokens.set(email, token);
    res.json({ success: true });
  } else {
    res.status(400).send();
  }
});

// Endpoint de Matching Inteligente de Vacantes
app.post("/api/match-vacancies", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, profileKeywords, allowedRegions, searchQuery } = req.body;

    const regionNames: Record<string, string> = {
      latam: "Latinoamérica (e.g. Colombia, México, Argentina)",
      caribe: "El Caribe (e.g. República Dominicana, Jamaica)",
      na: "América del Norte (e.g. EE.UU., Canadá)",
      es: "Europa / Solo España"
    };

    const selectedRegionDescriptions = (allowedRegions || [])
      .map((r: string) => regionNames[r])
      .filter(Boolean);

    const regionPrompt = selectedRegionDescriptions.length > 0
      ? `The vacancies MUST strictly be 100% remote positions situated within or hiring from these selected regions: ${selectedRegionDescriptions.join(", ")}. 
Each vacancy location attribute must reflect this, e.g. "Remoto (Colombia)", "Remoto (EE.UU.)", "Remoto (España)", "Remoto (Caribe)", "Remoto (Latinoamérica)".`
      : "The vacancies should be 100% remote global positions.";

    const ai = getGeminiClient();
    const parts: any[] = [];

    // Adjuntar CV (PDF o Texto) de forma correcta para la IA
    if (cv && typeof cv === "object" && cv.base64) {
      parts.push({ inlineData: { data: cv.base64, mimeType: cv.mimeType } });
    } else {
      parts.push({ text: `Resume Content: ${typeof cv === "string" ? cv : cv?.textData || "N/A"}` });
    }

    parts.push({
      text: `You are an expert ATS recruiter. 
      STRICT REQUIREMENT: If the Search Query below is EMPTY, analyze the Resume thoroughly and propose the 3 most suitable job roles based on skills.
      If a Search Query is provided, prioritize finding roles related to it that fit the resume.

      Search Query: ${searchQuery || "EMPTY (Analyze Resume to suggest best roles)"}
      Profile Keywords: ${profileKeywords || "N/A"}
${regionPrompt}
      Generate exactly 3 vacancies with title, company, location, lang, matchScore, description, requirements, platform, sourceApi, recruiterEmail in JSON.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vacancies: {
              type: Type.ARRAY,
              description: "The list of 3 matching vacancies or freelance projects",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Job title of the vacancy or project." },
                  company: { type: Type.STRING, description: "Hiring company name." },
                  location: { type: Type.STRING, description: "Job location or Remote status." },
                  lang: { type: Type.STRING, description: "The language of the job posting ('es' or 'en')." },
                  matchScore: { type: Type.INTEGER, description: "Calculated ATS compatibility score from 0 to 100." },
                  description: { type: Type.STRING, description: "A summary overview of the role." },
                  requirements: { type: Type.STRING, description: "Detailed job description and requirements text to match against." },
                  platform: { type: Type.STRING, description: "The platform of this vacancy. Must be exactly 'LinkedIn' or 'Upwork'." },
                  sourceApi: { type: Type.STRING, description: "The open source job API used to feed this vacancy." },
                  recruiterEmail: { type: Type.STRING, description: "Realistic email contact for the vacancy recruiter." }
                },
                required: ["title", "company", "location", "lang", "matchScore", "description", "requirements", "platform", "sourceApi", "recruiterEmail"]
              }
            }
          },
          required: ["vacancies"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from the vacancy matching model.");
    }

    res.json(JSON.parse(responseText.trim()));
  } catch (err: any) {
    console.error("Match Vacancies Error:", err);
    res.status(500).json({
      error: "Ocurrió un error al buscar vacantes alineadas: " + formatGeminiError(err)
    });
  }
});

// Endpoint de Generación ATS (Cover Letters & Cold Emails)
app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, jobInput, format, linkedinProfile, companySearch } = req.body;

    if (!cv) {
      res.status(400).json({ error: "No CV details provided. Please upload a CV file." });
      return;
    }
    if (!jobInput) {
      res.status(400).json({ error: "No job description or career page URL provided." });
      return;
    }
    if (!format || (format !== "cover-letter" && format !== "cold-email")) {
      res.status(400).json({ error: "Invalid format requested. Select 'cover-letter' or 'cold-email'." });
      return;
    }

    // Initialize Gemini Client (lazy load, fails fast if API Key is missing)
    const ai = getGeminiClient();

    // Parse job vacancy input (fetches webpage if URL, otherwise keeps text)
    let jobText = "";
    try {
      jobText = await fetchJobText(jobInput);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }

    if (!jobText || jobText.trim().length < 20) {
      res.status(400).json({ error: "Provided job description/link details are too short or empty. Please supply a valid link or detailed text." });
      return;
    }

    // Build the contents payload for Gemini
    const contents: any[] = [];

    // Add CV information
    if (typeof cv === "string") {
      // Plain text CV
      contents.push({
        text: `Candidate's Resume/CV Text content:\n\n${cv}`
      });
    } else if (cv.base64 && cv.mimeType) {
      // Binary PDF CV
      contents.push({
        inlineData: {
          data: cv.base64,
          mimeType: cv.mimeType
        }
      });
    } else {
      res.status(400).json({ error: "Invalid CV format. Must be a plain text string or an object with base64 data and mimeType." });
      return;
    }

    // Add Job requirements
    contents.push({
      text: `Job Description & Company Requirements:\n\n${jobText}`
    });

    // Add LinkedIn details if present
    if (linkedinProfile && linkedinProfile.trim()) {
      contents.push({
        text: `Candidate's LinkedIn Profile URL to include/reference inside outreach or signature:\n${linkedinProfile.trim()}`
      });
    }

    // Add Target Company details if present
    if (companySearch && companySearch.trim()) {
      contents.push({
        text: `Target Company to address specifically:\n${companySearch.trim()}`
      });
    }

    // Add prompt instructions
    const documentTypeName = format === "cover-letter" ? "Tailored Cover Letter" : "Cold Outreach Email for Recruiters";
    contents.push({
      text: `You are an expert career consultant, professional writer, and ATS (Applicant Tracking System) optimizer.
Your task is to analyze the Candidate's Resume/CV and cross-reference it with the Job Description & Company Requirements.
Produce a fully tailored, highly professional ${documentTypeName} matching the candidate's profile to this specific role.

System Instructions for writing the ${documentTypeName}:
1. Determine the language of the provided Job Description ("es" for Spanish, "en" for English).
2. If the Job Description is in English, write the entire document and all list/object text in English.
3. If the Job Description is in Spanish, write the entire document and all list/object text in Spanish.
4. Use an elegant, confident, professional, and convincing tone.
5. Carefully detect and extract the company name, role name, and hiring manager's name if present in the Job Description. Use them naturally (e.g. "Dear Hiring Team at [Company Name]" or "Estimado/a Responsable de Selección de [Company Name]"). If a target company was explicitly provided (${companySearch || ""}), prioritize tailoring the draft to them.
6. DO NOT use generic filler sentences. Integrate specific skills and requirements from the vacancy into the document naturally to assure maximum ATS (Applicant Tracking System) keyword optimization.
7. If format is "cover-letter", write a 3 to 4 paragraph polished cover letter.
8. If format is "cold-email", write a highly engaging, concise email to a recruiter with a clear and professional subject line.
9. If the candidate's LinkedIn Profile URL was provided (${linkedinProfile || ""}), make sure to elegantly link it or include it in the signature block.

ATS Keywords and Scores:
1. Extract 6 to 10 critical keywords/skills from the Job Description in the detected language.
2. For each extracted keyword, evaluate if the candidate has a strong match in their CV (true) or if it is missing/weak in their CV (false).
3. Compute an overall ATS Match Score (from 0 to 100) reflecting the profile compatibility.
4. List key strengths matched in the detected language.
5. List key gaps/areas of improvements and actionable tips in the detected language.

Generate the response in JSON format according to the requested schema. Make sure to specify the detectedLanguage ("es" or "en") correctly.`
    });

    // Call Gemini API (gemini-3.5-flash is ideal for high quality text and fast speed)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { 
              type: Type.INTEGER, 
              description: "ATS compatibility percentage score from 0 to 100 based on keyword matches and requirement alignment." 
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "The language detected in the Job Description. Must be either 'es' or 'en'."
            },
            generatedText: { 
              type: Type.STRING, 
              description: "The complete tailored Cover Letter or Cold Outreach Email text." 
            },
            keywords: {
              type: Type.ARRAY,
              description: "Critical keywords detected in the job requirements.",
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING, description: "The skill or keyword extracted." },
                  matched: { type: Type.BOOLEAN, description: "Whether the candidate's CV contains or suggests this skill." }
                },
                required: ["keyword", "matched"]
              }
            },
            strengths: {
              type: Type.ARRAY,
              description: "Top 2-3 overlapping strengths where candidate matches the vacancy requirements perfectly.",
              items: { type: Type.STRING }
            },
            gaps: {
              type: Type.ARRAY,
              description: "Key gaps or missing criteria with constructive advice on how to address them.",
              items: { type: Type.STRING }
            }
          },
          required: ["matchScore", "detectedLanguage", "generatedText", "keywords", "strengths", "gaps"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from the AI model.");
    }

    const resultData = JSON.parse(responseText.trim());
    res.json(resultData);

  } catch (err: any) {
    console.error("Generation Error:", err);
    res.status(500).json({ 
      error: "Ocurrió un error al generar la postulación: " + formatGeminiError(err) 
    });
  }
});

// Consultor de Carrera (Chat IA)
app.post("/api/chat", apiRateLimiter(20, 60000), async (req, res) => {
  try {
    const { message, history, cvText, jobDescription } = req.body;

    if (!message) {
      res.status(400).json({ error: "El mensaje es obligatorio." });
      return;
    }

    const ai = getGeminiClient();

    // Reconstruct the chat history in the Content format expected by Gemini
    const contents: any[] = [];

    // If history is provided, parse and append it
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add the new user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // We can inject context about the current CV or Job description if they are present
    let systemInstruction = `Eres un consultor de carrera experto e inteligente y asesor de IA integrado en ConectaVacantes Pro (Global Remote Hub).
Tu objetivo es ayudar a los candidatos a conseguir empleos remotos de nivel mundial, refinar sus textos de postulación, simular preguntas de entrevista técnica y de comportamiento, aconsejar sobre salarios en dólares y euros, y optimizar su posicionamiento profesional.
CRÍTICO: Cuando recomiendes cursos, certificaciones, herramientas o recursos para mejorar habilidades (skills), estos deben ser estrictamente GRATUITOS y de alta calidad (como freeCodeCamp, cursos gratuitos o de auditoría en Coursera/edX, tutoriales de Kaggle, laboratorios de Google Cloud Skills Boost, etc.). Nunca recomiendes productos de pago.
Responde de forma clara, motivadora, altamente profesional y concisa en español.
`;

    if (cvText || jobDescription) {
      systemInstruction += `\nContexto actual del usuario:`;
      if (cvText) {
        systemInstruction += `\n- Resumen de CV: ${cvText.substring(0, 3000)}`;
      }
      if (jobDescription) {
        systemInstruction += `\n- Descripción del Trabajo / Vacante: ${jobDescription.substring(0, 3000)}`;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "No pude generar una respuesta. Por favor intenta de nuevo.";
    res.json({ reply });
  } catch (err: any) {
    console.error("Chat Error:", err);
    res.status(500).json({
      error: "Ocurrió un error al procesar tu consulta con Gemini: " + formatGeminiError(err)
    });
  }
});

// Puentes de Autenticación OAuth 2.0
app.get("/api/auth/linkedin/url", (req, res) => {
  const host = req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUri = `${protocol}://${host}/auth/callback`;
  const authorizeUrl = `/oauth/linkedin-provider?redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authorizeUrl });
});

// OAuth URL Construction for Indeed
app.get("/api/auth/indeed/url", (req, res) => {
  const host = req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUri = `${protocol}://${host}/auth/callback`;
  const authorizeUrl = `/oauth/indeed-provider?redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authorizeUrl });
});

// OAuth URL Construction for Workup
app.get("/api/auth/workup/url", (req, res) => {
  const host = req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUri = `${protocol}://${host}/auth/callback`;
  const authorizeUrl = `/oauth/workup-provider?redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authorizeUrl });
});

// Proveedor Simulado de LinkedIn (UI de Consentimiento)
app.get("/oauth/linkedin-provider", (req, res) => {
  const redirect_uri = req.query.redirect_uri || "/auth/callback";
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Conectar con LinkedIn • ConectaVacantes</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 font-sans flex items-center justify-center min-h-screen p-4">
      <div class="bg-slate-800 border border-slate-700 max-w-md w-full p-6 rounded-2xl shadow-2xl text-center space-y-6">
        <div class="flex items-center justify-center space-x-2">
          <div class="bg-[#0077b5] text-white p-3 rounded-xl font-bold text-2xl tracking-tight">in</div>
          <span class="text-xl font-extrabold tracking-tight">LinkedIn Authorization</span>
        </div>
        <div class="space-y-2">
          <h2 class="text-base font-bold">ConectaVacantes SaaS Pro solicita acceso</h2>
          <p class="text-xs text-slate-400">Esta aplicación quiere importar tu información básica de perfil profesional para construir tu memoria ATS:</p>
          <div class="bg-slate-950/60 p-3 rounded-lg text-left text-xs space-y-1.5 text-slate-300 font-mono">
            <div>✔ Nombre y Apellidos (Vicente Augusto Useche)</div>
            <div>✔ Correo electrónico verificado</div>
            <div>✔ Lista de habilidades (React, TypeScript, Node.js...)</div>
            <div>✔ Titular profesional actual</div>
          </div>
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <a href="${redirect_uri}?code=linkedin_authorized_code&platform=linkedin" class="bg-[#0077b5] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center">
            Permitir acceso e Importar Perfil
          </a>
          <button onclick="window.close()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition-all">
            Cancelar
          </button>
        </div>
        <p class="text-[10px] text-slate-500">Conexión OAuth Segura protegida por cifrado ConectaVacantes Pro.</p>
      </div>
    </body>
    </html>
  `);
});

// Proveedor Simulado de Indeed (UI de Consentimiento)
app.get("/oauth/indeed-provider", (req, res) => {
  const redirect_uri = req.query.redirect_uri || "/auth/callback";
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Conectar con Indeed • ConectaVacantes</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 font-sans flex items-center justify-center min-h-screen p-4">
      <div class="bg-slate-800 border border-slate-700 max-w-md w-full p-6 rounded-2xl shadow-2xl text-center space-y-6">
        <div class="flex items-center justify-center space-x-2">
          <div class="bg-[#2557a7] text-white p-3 rounded-xl font-black text-2xl tracking-tighter">indeed</div>
        </div>
        <div class="space-y-2">
          <h2 class="text-base font-bold">ConectaVacantes SaaS Pro solicita acceso</h2>
          <p class="text-xs text-slate-400">Esta aplicación quiere importar tu información básica de perfil profesional para construir tu memoria ATS:</p>
          <div class="bg-slate-950/60 p-3 rounded-lg text-left text-xs space-y-1.5 text-slate-300 font-mono">
            <div>✔ Nombre de Perfil de Indeed (Vicente Useche)</div>
            <div>✔ Lista de habilidades (Python, PostgreSQL, Excel...)</div>
            <div>✔ Enlace de perfil y currículum Indeed</div>
          </div>
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <a href="${redirect_uri}?code=indeed_authorized_code&platform=indeed" class="bg-[#2557a7] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center">
            Permitir acceso e Importar Perfil
          </a>
          <button onclick="window.close()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition-all">
            Cancelar
          </button>
        </div>
        <p class="text-[10px] text-slate-500">Conexión OAuth Segura protegida por cifrado ConectaVacantes Pro.</p>
      </div>
    </body>
    </html>
  `);
});

// Proveedor Simulado de Workup (UI de Consentimiento)
app.get("/oauth/workup-provider", (req, res) => {
  const redirect_uri = req.query.redirect_uri || "/auth/callback";
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Conectar con Workup • ConectaVacantes</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 font-sans flex items-center justify-center min-h-screen p-4">
      <div class="bg-slate-800 border border-slate-700 max-w-md w-full p-6 rounded-2xl shadow-2xl text-center space-y-6">
        <div class="flex items-center justify-center space-x-2">
          <div class="bg-emerald-600 text-white p-3 rounded-xl font-bold text-2xl tracking-tight">W</div>
          <span class="text-xl font-extrabold tracking-tight">Workup Freelance Sync</span>
        </div>
        <div class="space-y-2">
          <h2 class="text-base font-bold">ConectaVacantes SaaS Pro solicita acceso</h2>
          <p class="text-xs text-slate-400">Extraeremos tus preferencias de proyectos freelance y portafolio para realizar búsquedas externas:</p>
          <div class="bg-slate-950/60 p-3 rounded-lg text-left text-xs space-y-1.5 text-slate-300 font-mono">
            <div>✔ Portafolio de Proyectos (Vicente Useche)</div>
            <div>✔ Tarifas y Habilidades Técnicas</div>
            <div>✔ Historial de contratos exitosos</div>
          </div>
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <a href="${redirect_uri}?code=workup_authorized_code&platform=workup" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center">
            Sincronizar Perfil Freelance
          </a>
          <button onclick="window.close()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-xl text-xs transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Manejador de Retorno de OAuth (Sincronización de Perfil)
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const { code, platform } = req.query;

  // Generate realistic candidate profile response depending on platform
  let userProfilePayload = {};
  if (platform === "linkedin") {
    userProfilePayload = {
      name: "Vicente Augusto Useche",
      keywords: "React, TypeScript, Node.js, Cloud Architect, AWS, Docker, CI/CD",
      linkedin: "https://linkedin.com/in/vicenteaugusto-useche",
      cvBio: "Desarrollador de Software Senior con más de 8 años de experiencia escalando arquitecturas distribuidas en la nube y optimizando motores de búsqueda e IA."
    };
  } else if (platform === "indeed") {
    userProfilePayload = {
      name: "Vicente Useche",
      keywords: "Python, Django, PostgreSQL, Excel, Automation, REST APIs, Git",
      linkedin: "https://linkedin.com/in/vicente-useche",
      cvBio: "Ingeniero de Software Senior especializado en desarrollo backend con Python, bases de datos SQL robustas y automatizaciones empresariales de alto valor."
    };
  } else {
    userProfilePayload = {
      name: "Vicente (Workup Freelancer)",
      keywords: "Scraping, Data Engineering, Automation Bots, Next.js, Tailwind CSS",
      linkedin: "https://linkedin.com/in/vicente-freelance",
      cvBio: "Especialista en automatización y desarrollo web full-stack enfocado en la entrega de proyectos ágiles y scraping de alta precisión."
    };
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Procesando conexión...</title>
    </head>
    <body style="background: #0f172a; color: #f1f5f9; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
      <div style="padding: 20px;">
        <h2 style="color: #10b981;">✔ ¡Conexión exitosa con ${platform === "linkedin" ? "LinkedIn" : "Indeed"}!</h2>
        <p style="font-size: 14px; color: #94a3b8;">Importando tu información de perfil de forma segura a ConectaVacantes...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              platform: '${platform}',
              profile: ${JSON.stringify(userProfilePayload)}
            }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      </div>
    </body>
    </html>
  `);
});

// Inicialización del Servidor (Vite Dev o Static Prod)
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ConectaVacantes backend listening at http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
});
