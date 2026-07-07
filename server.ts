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

// Self-contained Lightweight In-Memory Rate Limiter
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your Secrets / Env variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// SSRF and Safe URL Validation
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

// Helper to fetch content from URL or return raw text
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
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"')
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

// Fallback vacancies for when Gemini is unavailable
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

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Match Vacancies API Endpoint
app.post("/api/match-vacancies", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, profileKeywords, allowedRegions, languageFilter, query } = req.body;

    let cvText = "";
    if (cv) {
      if (typeof cv === "object" && cv.base64) {
        cvText = "[Candidate uploaded a PDF Resume]";
      } else if (typeof cv === "string") {
        cvText = cv;
      }
    }

    // Map region IDs to descriptive names
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

    let langPrompt = "";
    if (languageFilter === "es") {
      langPrompt = "All generated vacancies MUST strictly be written in Spanish, with the 'lang' property set to 'es'. The title, description, and requirements must be entirely in Spanish.";
    } else if (languageFilter === "en") {
      langPrompt = "All generated vacancies MUST strictly be written in English, with the 'lang' property set to 'en'. The title, description, and requirements must be entirely in English.";
    } else {
      langPrompt = "The vacancies can be written in either Spanish ('es') or English ('en'). Set the 'lang' property to 'es' if the description and requirements are in Spanish, or 'en' if in English. Mix them realistically based on the candidate's background and regions.";
    }

    let searchIntentPrompt = "";
    if (query && query.trim()) {
      searchIntentPrompt = `\n- Actively Searching Role/Keywords: "${query.trim()}"\nYou MUST prioritize generating vacancies or freelance contracts that are directly related and relevant to this specific search role/keyword!`;
    }

    const ai = getGeminiClient();

    const contents: any[] = [];
    contents.push({
      text: `You are an expert ATS (Applicant Tracking System) recruiter, professional freelancer advisor, and matching algorithm.
Based on the candidate's background details, you need to generate 3 highly realistic, relevant, and compelling job vacancy or contract project opportunities. Include a mix of both LinkedIn corporate remote jobs and Upwork freelance projects.

Candidate details:
- Uploaded Resume Details/Text: ${cvText || "None provided"}
- Profile Keywords / Top Skills: ${profileKeywords || "None provided"}${searchIntentPrompt}`
    });

    contents.push({
      text: `Please generate exactly 3 custom job vacancies or freelance projects.
${regionPrompt}
${langPrompt}

Each vacancy must have:
1. "title": The job title or project contract name (e.g. "Bilingual Freelance Content Creator", "Desarrollador Python / Automatizador Remoto").
2. "company": A plausible modern company name or Upwork client profile name.
3. "location": A realistic 100% remote location (e.g., "Remoto (España)", "Remoto (México)", "Remoto (América del Norte)").
4. "lang": Either "es" (if vacancy description/requirements is written in Spanish) or "en" (if in English). Matches the selected language preference.
5. "matchScore": A calculated affinity percentage (0 to 100) reflecting how well the candidate matches the job's requirements based on their skills/CV. Set it realistically between 60 and 98.
6. "description": A concise, engaging 1-2 sentence overview of the role.
7. "requirements": A complete, structured list of requirements or vacancy description (about 3-4 sentences/bullet points worth of text) that can be loaded into an ATS optimizer. It should detail technical skills, experience levels, and primary responsibilities.
8. "platform": The target job platform. Must be exactly 'LinkedIn', 'Upwork' or 'Indeed'. Mix them to show variety!

Generate the output in raw JSON format matching the schema requested.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
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
                  company: { type: Type.STRING, description: "Hiring company name or Upwork client pseudonym." },
                  location: { type: Type.STRING, description: "Job location or Remote status." },
                  lang: { type: Type.STRING, description: "The language of the job posting ('es' or 'en')." },
                  matchScore: { type: Type.INTEGER, description: "Calculated ATS compatibility score from 0 to 100." },
                  description: { type: Type.STRING, description: "A summary overview of the role." },
                  requirements: { type: Type.STRING, description: "Detailed job description and requirements text to match against." },
                  platform: { type: Type.STRING, description: "The platform of this vacancy. Must be exactly 'LinkedIn', 'Upwork' or 'Indeed'." }
                },
                required: ["title", "company", "location", "lang", "matchScore", "description", "requirements", "platform"]
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
    // Use fallback for API key errors or other issues
    if (err.message?.includes("API key") || err.message?.includes("API_KEY_INVALID")) {
      console.warn("Gemini no disponible, usando fallback");
      res.json({ vacancies: fallbackVacancies(req.body?.query || "desarrollador", req.body?.allowedRegions, req.body?.languageFilter ? [req.body.languageFilter] : [], req.body?.contractTypes) });
      return;
    }
    res.status(500).json({
      error: "An error occurred while finding matching vacancies. " + (err.message || err)
    });
  }
});

// Main Generation API Endpoint
app.post("/api/generate", apiRateLimiter(10, 60000), async (req, res) => {
  try {
    const { cv, jobInput, format, linkedinProfile, companySearch, languageFilter } = req.body;

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
    
    let langInstructions = "";
    if (languageFilter === "es") {
      langInstructions = `1. All generated texts, cover letters, emails, strengths, gaps, and keywords MUST strictly be written in Spanish.
2. Even if the Job Description is written in English, you MUST translate the role context and draft everything in Spanish.
3. Set detectedLanguage to "es".`;
    } else if (languageFilter === "en") {
      langInstructions = `1. All generated texts, cover letters, emails, strengths, gaps, and keywords MUST strictly be written in English.
2. Even if the Job Description is written in Spanish, you MUST translate the role context and draft everything in English.
3. Set detectedLanguage to "en".`;
    } else {
      langInstructions = `1. Determine the language of the provided Job Description ("es" for Spanish, "en" for English).
2. If the Job Description is in English, write the entire document, cover letter/email, keywords, strengths, and gaps in English. Set detectedLanguage to "en".
3. If the Job Description is in Spanish, write the entire document, cover letter/email, keywords, strengths, and gaps in Spanish. Set detectedLanguage to "es".`;
    }

    contents.push({
      text: `You are an expert career consultant, professional writer, and ATS (Applicant Tracking System) optimizer.
Your task is to analyze the Candidate's Resume/CV and cross-reference it with the Job Description & Company Requirements.
Produce a fully tailored, highly professional ${documentTypeName} matching the candidate's profile to this specific role.

System Instructions for writing the ${documentTypeName}:
${langInstructions}
4. Use an elegant, confident, professional, and convincing tone.
5. Carefully detect and extract the company name, role name, and hiring manager's name if present in the Job Description. Use them naturally (e.g. "Dear Hiring Team at [Company Name]" or "Estimado/a Responsable de Selección de [Company Name]"). If a target company was explicitly provided (${companySearch || ""}), prioritize tailoring the draft to them.
6. DO NOT use generic filler sentences. Integrate specific skills and requirements from the vacancy into the document naturally to assure maximum ATS (Applicant Tracking System) keyword optimization.
7. If format is "cover-letter", write a 3 to 4 paragraph polished cover letter.
8. If format is "cold-email", write a highly engaging, concise email to a recruiter with a clear and professional subject line.
9. If the candidate's LinkedIn Profile URL was provided (${linkedinProfile || ""}), make sure to elegantly link it or include it in the signature block.

ATS Keywords and Scores:
1. Extract 6 to 10 critical keywords/skills from the Job Description in the language requested.
2. For each extracted keyword, evaluate if the candidate has a strong match in their CV (true) or if it is missing/weak in their CV (false).
3. Compute an overall ATS Match Score (from 0 to 100) reflecting the profile compatibility.
4. List key strengths matched in the language requested.
5. List key gaps/areas of improvements and actionable tips in the language requested.

Generate the response in JSON format according to the requested schema. Make sure to specify the detectedLanguage ("es" or "en") correctly.`
    });

    // Call Gemini API (gemini-3.5-flash is ideal for high quality text and fast speed)
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
      error: "An error occurred during application generation. " + (err.message || err) 
    });
  }
});

// Chat API Endpoint
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
    let systemInstruction = `Eres un consultor de carrera experto e inteligente y asesor de IA integrado en AutoJob Assistant Pro (Global Remote Hub).
Tu objetivo es ayudar a los candidatos a conseguir empleos remotos de nivel mundial, refinar sus textos de postulación, simular preguntas de entrevista técnica y de comportamiento, aconsejar sobre salarios en dólares y euros, y optimizar su posicionamiento profesional.
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
      model: "gemini-3.5-flash",
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
      error: "Ocurrió un error al procesar tu consulta con Gemini: " + (err.message || err)
    });
  }
});

// Setup dev server or static builds
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
    console.log(`AutoJob Assistant backend listening at http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
});

// Export the Express app for Vercel serverless
export default app;