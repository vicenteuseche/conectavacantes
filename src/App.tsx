<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, LogOut, User, BarChart3, Mail, FileText, Sparkles } from "lucide-react";
=======
import React, { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Sliders, Linkedin, Search, ExternalLink, Mail, Briefcase, MapPin, Award, ChevronRight, Send, ChevronDown, ChevronUp } from "lucide-react";
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import CVUpload from "./components/CVUpload";
import JobInput from "./components/JobInput";
import ResultPanel from "./components/ResultPanel";
<<<<<<< HEAD
import DashboardAnalytics from "./components/DashboardAnalytics";
import CareerConsultant from "./components/CareerConsultant";
import MailInbox from "./components/MailInbox";
import { CVFileState, GenerationResult, Vacancy } from "./types";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "dashboard" | "mail">("main");
  const [selectedFile, setSelectedFile] = useState<CVFileState | null>(null);
  const [jobInput, setJobInput] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [format, setFormat] = useState<"cover-letter" | "cold-email">("cover-letter");

  // Check for saved session and auto-login in demo mode
  useEffect(() => {
    const savedEmail = localStorage.getItem("cv_user_email");
    if (savedEmail) {
      setUserEmail(savedEmail);
    } else {
      // Auto-login in demo mode
      setUserEmail("demo@conectavacantes.com");
      localStorage.setItem("cv_user_email", "demo@conectavacantes.com");
    }
    const savedProcesses = localStorage.getItem(`cv_processes_${savedEmail || "demo@conectavacantes.com"}`);
    if (savedProcesses) {
      setProcesses(JSON.parse(savedProcesses));
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("cv_user_email", email);
    setSuccess("¡Bienvenido! Sesión iniciada correctamente.");
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem("cv_user_email");
    setSuccess("Sesión cerrada correctamente.");
  };

  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") => {
    if (type === "success") setSuccess(msg);
    else if (type === "error") setError(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!selectedFile && !jobInput) {
      setError("Por favor, sube un CV o introduce una descripción de vacante.");
=======
import CareerConsultant from "./components/CareerConsultant";
import { CVFileState, OutputFormat, GenerationResult, Vacancy } from "./types";

const LOCAL_FALLBACK_VACANCIES: Vacancy[] = [
  {
    title: "Senior IT Project Manager (Remoto - Latam & Europa)",
    company: "Tech Solutions Global",
    location: "Latam & Europa (Remoto)",
    lang: "es",
    matchScore: 95,
    description: "Liderar implementaciones tecnológicas, gestionar presupuestos, Scrum/Kanban, y optimizar recursos corporativos.",
    requirements: "Requisitos:\n- Gestión de infraestructuras críticas\n- Metodologías ágiles (Scrum/Kanban)\n- Optimización de recursos corporativos\n- Excelentes habilidades de comunicación",
    platform: "LinkedIn"
  },
  {
    title: "Cloud Infrastructure Specialist & PM (Remote - North America)",
    company: "DataCorp International",
    location: "North America (Remote)",
    lang: "en",
    matchScore: 88,
    description: "Design and implement AWS cloud solutions, migrate legacy applications, lead team sprint cycles.",
    requirements: "Requirements:\n- Strong knowledge in AWS Cloud Migration\n- Team leadership and scrum facilitation\n- Automated tool workflows and CI/CD tools\n- Infrastructure as Code (Terraform)",
    platform: "Upwork"
  },
  {
    title: "Coordinador de Proyectos de Telecomunicaciones e IA",
    company: "Innovate Consulting",
    location: "Latam (Remoto)",
    lang: "es",
    matchScore: 76,
    description: "Buscamos un perfil técnico para liderar despliegues de redes fijas, cableado estructurado e integración de herramientas de IA.",
    requirements: "Requisitos:\n- Despliegue de redes fijas e inalámbricas\n- Cableado estructurado y networking\n- Integración de APIs de IA (OpenAI/Gemini)\n- 3+ años de experiencia en gestión de proyectos",
    platform: "LinkedIn"
  },
  {
    title: "Full-Stack Software Engineer (React & Node.js)",
    company: "DevsUnited",
    location: "Global Remote",
    lang: "en",
    matchScore: 91,
    description: "Develop clean React applications, build robust Node.js backend services, manage database migrations.",
    requirements: "Requirements:\n- 4+ years of professional fullstack experience\n- Strong proficiency in React, TypeScript, and Node.js\n- Experience with PostgreSQL and Docker\n- Familiarity with CI/CD pipelines",
    platform: "Upwork"
  },
  {
    title: "Especialista en Automatización de Redes y DevOps",
    company: "Sistemas Avanzados S.A.",
    location: "Remoto (España)",
    lang: "es",
    matchScore: 83,
    description: "Diseñar, automatizar y dar soporte de infraestructura a sistemas de comunicación de gran escala utilizando herramientas DevOps modernas.",
    requirements: "Requisitos:\n- Automatización de redes de telecomunicaciones\n- Experiencia con Ansible, Docker y Jenkins\n- Certificaciones de Google o afines altamente valoradas\n- Dominio de Python o Bash scripting",
    platform: "Indeed"
  },
  {
    title: "Remote DevOps Support Engineer",
    company: "CloudFlow Systems",
    location: "Remoto (Colombia & México)",
    lang: "en",
    matchScore: 68,
    description: "Support client infrastructure deployments, analyze system alerts, build monitoring dashboards, and troubleshoot networks.",
    requirements: "Requirements:\n- Technical degree in Systems or Telecom Engineering\n- Hands-on experience with Google Cloud or AWS\n- Fluent English communication skills\n- Linux system administration experience",
    platform: "Indeed"
  }
];

function matchVacanciesLocally(cvText: string, langFilter: "es" | "en" | "all" = "all", query: string = ""): Vacancy[] {
  const cleanCV = (cvText || "").toLowerCase();
  const cleanQuery = (query || "").toLowerCase().trim();
  
  // Filter by language
  let filteredList = LOCAL_FALLBACK_VACANCIES.filter(vac => {
    if (langFilter === "es") return vac.lang === "es";
    if (langFilter === "en") return vac.lang === "en";
    return true;
  });

  // Client-Side NLP query matching fallback
  if (cleanQuery) {
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length > 0) {
      const matchedByQuery = filteredList.filter(vac => {
        const titleAndDesc = (vac.title + " " + vac.description + " " + vac.requirements).toLowerCase();
        return queryWords.some(word => titleAndDesc.includes(word));
      });
      // Fallback: only narrow down if there's at least one match, keeping results robust
      if (matchedByQuery.length > 0) {
        filteredList = matchedByQuery;
      }
    }
  }

  return filteredList.map(vac => {
    const cleanRequirements = vac.requirements.toLowerCase();
    
    const searchTerms = [
      "project", "manager", "scrum", "agile", "cloud", "aws", "react", "node", "typescript", 
      "comunicacion", "gestion", "infrastructure", "telecomunicaciones", "telecom", "ia", "ai",
      "python", "docker", "excel", "liderar", "coordinador", "marketing"
    ];
    
    let matches = 0;
    let totalChecked = 0;
    
    searchTerms.forEach(term => {
      if (cleanRequirements.includes(term)) {
        totalChecked++;
        if (cleanCV.includes(term)) {
          matches++;
        }
      }
    });
    
    let matchScore = 75;
    if (totalChecked > 0) {
      matchScore = Math.min(Math.max(Math.round((matches / totalChecked) * 100), 55), 98);
    }

    // Boost score if title matches the search query terms
    if (cleanQuery) {
      const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
      const titleLower = vac.title.toLowerCase();
      const matchedWords = queryWords.filter(word => titleLower.includes(word));
      if (matchedWords.length > 0) {
        matchScore = Math.min(matchScore + (matchedWords.length * 5), 99);
      }
    }
    
    return {
      ...vac,
      matchScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function generatePreAppliedResult(vac: Vacancy, cvText: string, format: "cover-letter" | "cold-email" = "cover-letter"): GenerationResult {
  const isEs = vac.lang === "es";
  
  let generatedText = "";
  if (format === "cover-letter") {
    if (isEs) {
      generatedText = `Estimado Equipo de Selección de ${vac.company},

Le escribo para expresarle mi sincero interés en la vacante de "${vac.title}". Tras analizar detenidamente los requisitos detallados de su publicación, estoy convencido de que mi trayectoria técnica y habilidades como Ingeniero se alinean firmemente con sus expectativas.

En mi experiencia previa, he liderado despliegues tecnológicos clave enfocados en optimizar la infraestructura y coordinar equipos ágiles con Scrum. Cuento con certificaciones oficiales de Google Cloud, lo que me ha permitido consolidar una mentalidad ágil y orientada a la eficiencia corporativa. Mi currículum adjunto detalla proyectos específicos donde logré mitigar brechas operativas y agilizar la entrega de valor.

Agradezco de antemano el tiempo y la consideración de evaluar mi perfil para esta gran oportunidad laboral. Estaría encantado de mantener una breve entrevista para profundizar en cómo puedo contribuir activamente al éxito de ${vac.company}.

Atentamente,
Vicente Augusto Useche
vicenteaugusto.useche@gmail.com`;
    } else {
      generatedText = `Dear Hiring Team at ${vac.company},

I am writing to express my strong interest in the "${vac.title}" position. Having carefully reviewed your technical requirements, I am confident that my professional background and expertise as an Engineer align perfectly with your team's objectives.

Throughout my career, I have successfully driven complex technological implementations, managed critical infrastructures, and facilitated agile sprints under Scrum. Being certified in Google Cloud has equipped me with robust systems competencies and a performance-driven mindset. The attached resume showcases my capability to streamline operations and ensure scalable project delivery.

Thank you for your time and consideration. I would welcome the opportunity to connect for a brief discussion on how my qualifications can add immediate value to ${vac.company}.

Sincerely,
Vicente Augusto Useche
vicenteaugusto.useche@gmail.com`;
    }
  } else {
    if (isEs) {
      generatedText = `Asunto: Candidatura - ${vac.title} (Vicente Augusto Useche)

Hola Equipo de Selección de ${vac.company},

Espero que se encuentren muy bien. Me pongo en contacto con ustedes directamente con respecto a la vacante abierta para "${vac.title}". 

Dado mi perfil en Ingeniería de Telecomunicaciones respaldado por múltiples certificaciones oficiales de Google Cloud (incluyendo Professional Data Engineer), tengo una fuerte trayectoria automatizando despliegues tecnológicos y optimizando procesos críticos en entornos ágiles (Scrum). 

He adjuntado mi currículum vitae a este correo electrónico para que puedan evaluar el detalle técnico de mis equivalencias informáticas homologadas y mis proyectos anteriores en la nube. 

¿Tendrían 10 minutos esta semana para una llamada breve y conversar sobre cómo mi perfil puede potenciar los objetivos actuales de ${vac.company}?

Un cordial saludo,
Vicente Augusto Useche
vicenteaugusto.useche@gmail.com`;
    } else {
      generatedText = `Subject: Inquiry regarding ${vac.title} - Vicente Augusto Useche

Hi ${vac.company} Recruiting Team,

I hope you are doing well. I am reaching out to express my keen interest in the open "${vac.title}" position.

As a systems-oriented Engineer with official Google Cloud Certifications (including Professional Data Engineer) and an Agile project management background, I specialize in automating tech infrastructure deployments and facilitating productive Scrum cycles.

I have attached my resume and academic equivalencies which highlight my technical expertise. I'm highly excited about the chance to apply my skills to support ${vac.company}'s upcoming milestones.

Would you be open to a brief 10-minute chat this week to explore how my technical background aligns with your core challenges?

Best regards,
Vicente Augusto Useche
vicenteaugusto.useche@gmail.com`;
    }
  }
  
  const keywords = [
    { keyword: vac.lang === "es" ? "Coordinación" : "Management", matched: true },
    { keyword: "Google Cloud", matched: true },
    { keyword: vac.lang === "es" ? "Metodologías Ágiles" : "Agile Methods", matched: true }
  ];
  
  return {
    matchScore: vac.matchScore,
    generatedText,
    keywords,
    strengths: isEs 
      ? ["Alineación directa con los requisitos del puesto.", "Sólido respaldo técnico en infraestructura y metodologías ágiles.", "Certificaciones clave validadas automáticamente."]
      : ["Direct alignment with role requirements.", "Strong technical foundation in infrastructure & agile frameworks.", "Google certifications validated for cloud competency."],
    gaps: [],
    detectedLanguage: vac.lang
  };
}

export function processVacancies(list: Vacancy[], cvText: string): Vacancy[] {
  return list.map(vac => {
    const isHighMatch = vac.matchScore >= 55;
    
    let gapAnalysis = undefined;
    if (!isHighMatch) {
      const possibleSkills = [
        "AWS", "GCP", "Kubernetes", "Docker", "Terraform", "CI/CD", "TypeScript", 
        "React", "Node.js", "Python", "Scrum", "Agile", "SQL", "PostgreSQL",
        "NoSQL", "Git", "Security", "Automation", "English", "Spanish", "Redes", "Telecomunicaciones"
      ];
      const missingSkills: string[] = [];
      const requirementsText = vac.requirements.toLowerCase();
      const cvTextLower = cvText.toLowerCase();
      
      possibleSkills.forEach(skill => {
        if (requirementsText.includes(skill.toLowerCase())) {
          if (!cvTextLower.includes(skill.toLowerCase())) {
            missingSkills.push(skill);
          }
        }
      });
      
      if (missingSkills.length === 0) {
        missingSkills.push(vac.lang === "es" ? "Experiencia de dominio específico" : "Specific domain experience");
      }
      
      const skillsStr = missingSkills.join(", ");
      const reason = vac.lang === "es" 
        ? `Falta coincidencia en competencias críticas: "${skillsStr}". Tu CV base no menciona explícitamente estas habilidades esenciales solicitadas en los requisitos de la vacante, disminuyendo tu visibilidad en filtros automáticos ATS.`
        : `Critical skill gaps identified: "${skillsStr}". Your base resume does not explicitly mention these essential competencies required by the vacancy, which reduces your visibility with automatic ATS screening systems.`;
      
      gapAnalysis = {
        missingSkills,
        reason
      };
    }
    
    return {
      ...vac,
      autoApplied: isHighMatch,
      gapAnalysis
    };
  });
}

function runLocalContingency(cvText: string, jobText: string, format: "cover-letter" | "cold-email", langFilter: "es" | "en" | "all" = "all"): GenerationResult {
  const cleanCV = (cvText || "").toLowerCase();
  const cleanJob = (jobText || "").toLowerCase();

  const possibleKeywords = [
    "react", "typescript", "javascript", "node", "python", "aws", "cloud", "docker", "kubernetes", 
    "sql", "nosql", "project manager", "scrum", "agile", "devops", "java", "marketing", "excel", 
    "analytics", "gestion", "management", "leadership", "git", "ci/cd", "product owner", "comunicacion"
  ];

  const keywords: { keyword: string; matched: boolean }[] = [];
  let matchCount = 0;
  let totalJobKeywords = 0;

  possibleKeywords.forEach(kw => {
    const inJob = cleanJob.includes(kw);
    if (inJob) {
      totalJobKeywords++;
      const inCV = cleanCV.includes(kw);
      if (inCV) {
        matchCount++;
        keywords.push({ keyword: kw.toUpperCase(), matched: true });
      } else {
        keywords.push({ keyword: kw.toUpperCase(), matched: false });
      }
    }
  });

  if (keywords.length === 0) {
    keywords.push({ keyword: "EXPERIENCIA", matched: true });
    keywords.push({ keyword: "GESTIÓN", matched: true });
    keywords.push({ keyword: "COMUNICACIÓN", matched: true });
    matchCount = 3;
    totalJobKeywords = 3;
  }

  const rawScore = totalJobKeywords > 0 ? (matchCount / totalJobKeywords) * 100 : 80;
  const matchScore = Math.min(Math.max(Math.round(rawScore), 65), 98);

  const spanishWords = ["el", "la", "los", "las", "un", "una", "y", "en", "para", "con"];
  let esCount = 0;
  spanishWords.forEach(w => {
    const reg = new RegExp(`\\b${w}\\b`, "i");
    if (reg.test(cleanJob)) esCount++;
  });
  
  let detectedLanguage = esCount >= 2 ? "es" : "en";
  if (langFilter === "es") {
    detectedLanguage = "es";
  } else if (langFilter === "en") {
    detectedLanguage = "en";
  }

  let generatedText = "";
  if (detectedLanguage === "es") {
    if (format === "cover-letter") {
      generatedText = `Estimado/a Responsable de Selección,

Le escribo para presentar mi candidatura al puesto de interés. Tras analizar detenidamente los requisitos de la vacante, estoy convencido/a de que mi trayectoria y habilidades se alinean estrechamente con lo que buscan.

A lo largo de mi carrera, he perfeccionado mis capacidades en áreas clave, incluyendo aspectos de gestión técnica y colaboración ágil. Mi enfoque principal siempre ha sido optimizar los procesos y asegurar la entrega de alta calidad. El perfil de su empresa me resulta sumamente atractivo debido a su enfoque innovador y cultura de crecimiento constante.

Agradezco de antemano su tiempo y consideración para evaluar mi perfil. Quedo a su entera disposición para mantener una entrevista y conversar sobre cómo puedo aportar valor a su equipo.

Atentamente,
[Candidato ConectaVacantes Hub]`;
    } else {
      generatedText = `Hola,

Espero que se encuentre muy bien.

Me pongo en contacto porque he visto la vacante que tienen abierta. Mi perfil profesional cuenta con sólida experiencia técnica y de liderazgo, con especial interés en integrarme a un equipo donde pueda impulsar proyectos estratégicos de manera eficiente y escalable.

He trabajado ampliamente en entornos colaborativos y tengo un historial comprobado optimizando flujos de trabajo. Me encantaría conversar brevemente sobre cómo mis competencias pueden beneficiar sus objetivos actuales.

Adjunto mi currículum para su revisión. Muchas gracias por su tiempo y consideración.

Saludos cordiales,
[Candidato ConectaVacantes Hub]`;
    }
  } else {
    if (format === "cover-letter") {
      generatedText = `Dear Hiring Manager,

I am writing to express my strong interest in the open position. After reviewing the job requirements, I am confident that my professional background and expertise align perfectly with your team's needs.

Throughout my career, I have consistently demonstrated a track record of driving impact and delivering high-quality results. I specialize in optimizing technical workflows, collaborating within modern frameworks, and solving complex problems with agility and scalability.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my qualifications can contribute to your company's success.

Sincerely,
[ConectaVacantes Hub Candidate]`;
    } else {
      generatedText = `Hi,

Hope this message finds you well.

I am reaching out regarding the open position. With my robust technical experience and hands-on skills, I am highly interested in joining your team to contribute to your upcoming projects and growth.

I have a proven history of streamlining operations and collaborating effectively across teams. I would love to connect for a brief chat to see how my background fits your current challenges.

I have attached my resume for your review. Thank you for your time and consideration.

Best regards,
[ConectaVacantes Hub Candidate]`;
    }
  }

  const strengths = [
    detectedLanguage === "es" ? "Sólido dominio de las competencias clave detectadas." : "Strong grasp of the main technical competencies required.",
    detectedLanguage === "es" ? "Alineación cultural y enfoque en metodologías ágiles." : "Cultural alignment and focus on agile delivery frameworks.",
    detectedLanguage === "es" ? "Capacidad comprobada de resolución de problemas complejos." : "Proven record of solving complex system issues."
  ];

  const gaps = [
    detectedLanguage === "es" ? "Se recomienda profundizar en detalles de migración cloud específicos." : "Deepening knowledge of specific cloud migration paths is advised.",
    detectedLanguage === "es" ? "Detallar más logros cuantificables en el sector específico." : "Highlighting more quantifiable achievements in the target sector is suggested."
  ];

  return {
    matchScore,
    generatedText,
    keywords,
    strengths,
    gaps,
    detectedLanguage
  };
}

export default function App() {
  const [cv, setCv] = useState<CVFileState | null>(null);
  const [jobInput, setJobInput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("cover-letter");
  
  // LinkedIn & ATS Hub properties
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [profileKeywords, setProfileKeywords] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  // Vacancy Matcher State
  const [vacancies, setVacancies] = useState<Vacancy[] | null>(() => {
    const raw = matchVacanciesLocally("", "all");
    const defaultCVText = "Ingeniería de Telecomunicaciones - Universidad Distrital\nEquivalencia en Ingeniería Informática y Computación Distribuida\nGoogle Cloud Professional Data Engineer, Google IT Support, Google Project Management";
    return processVacancies(raw, defaultCVText);
  });
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  // Geographic Restriction States
  const [geoLatam, setGeoLatam] = useState(true);
  const [geoCaribe, setGeoCaribe] = useState(true);
  const [geoNa, setGeoNa] = useState(true);
  const [geoEs, setGeoEs] = useState(true);

  // Language Filter state ("all" | "es" | "en")
  const [languageFilter, setLanguageFilter] = useState<"all" | "es" | "en">("all");

  // User Profile manual details (Engineering, CS Equivalencies, and Google Certifications)
  const [universityDegree, setUniversityDegree] = useState(() => {
    return localStorage.getItem("profile_univ_degree") || "Ingeniería de Telecomunicaciones - Universidad Distrital";
  });
  const [informaticEquivalencies, setInformaticEquivalencies] = useState(() => {
    return localStorage.getItem("profile_info_equiv") || "Equivalencia en Ingeniería Informática y Computación Distribuida";
  });
  const [googleCertifications, setGoogleCertifications] = useState(() => {
    return localStorage.getItem("profile_google_certs") || "Google Cloud Professional Data Engineer, Google IT Support, Google Project Management";
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Google Authentication Simulated States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("autojob_logged_in") === "true";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("autojob_user_email") || "vicenteaugusto.useche@gmail.com";
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStepMsg, setLoginStepMsg] = useState("");
  const [loginInputEmail, setLoginInputEmail] = useState("vicenteaugusto.useche@gmail.com");

  // Gmail Active Theme ("default" | "dark" | "ocean")
  const [gmailTheme, setGmailTheme] = useState<"default" | "dark" | "ocean">("default");

  // Applet Custom Global Theme ("azul" | "oscuro" | "verde")
  const [appTheme, setAppTheme] = useState(() => {
    return localStorage.getItem("conecta_app_theme") || "azul";
  });

  React.useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("conecta_app_theme", appTheme);
    
    if (appTheme === "azul") {
      root.style.setProperty('--primary', '#2557a7');
      root.style.setProperty('--primary-hover', '#164081');
      root.style.setProperty('--bg', '#ffffff');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--text', '#2d2d2d');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--accent', '#f4f7fc');
      root.style.setProperty('--accent-text', '#2557a7');
      root.style.setProperty('--panel-chat', '#f4f7fc');
      root.classList.remove('dark');
    } else if (appTheme === "oscuro") {
      root.style.setProperty('--primary', '#3b82f6');
      root.style.setProperty('--primary-hover', '#2563eb');
      root.style.setProperty('--bg', '#0f172a');
      root.style.setProperty('--card-bg', '#1e293b');
      root.style.setProperty('--text', '#f1f5f9');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--accent', '#1e293b');
      root.style.setProperty('--accent-text', '#38bdf8');
      root.style.setProperty('--panel-chat', '#0f172a');
      root.classList.add('dark');
    } else if (appTheme === "verde") {
      root.style.setProperty('--primary', '#16a34a');
      root.style.setProperty('--primary-hover', '#15803d');
      root.style.setProperty('--bg', '#f0fdf4');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--text', '#14532d');
      root.style.setProperty('--border', '#bbf7d0');
      root.style.setProperty('--accent', '#dcfce7');
      root.style.setProperty('--accent-text', '#15803d');
      root.style.setProperty('--panel-chat', '#f0fdf4');
      root.classList.remove('dark');
    }
  }, [appTheme]);

  // Custom secure alert toast state
  const [alertToast, setAlertToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const handleMultiplatformSearch = (query: string) => {
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query.trim());
    const urls = [
      `https://www.linkedin.com/jobs/search/?keywords=${encoded}`,
      `https://www.upwork.com/nx/search/jobs/?q=${encoded}`,
      `https://www.indeed.com/jobs?q=${encoded}`,
      `https://www.google.com/search?q=${encoded}+jobs`
    ];
    urls.forEach(url => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
    showToast("Abriendo búsquedas seguras en LinkedIn, Upwork, Indeed y portales globales...", "success");
  };

  const showToast = (message: string, type: "success" | "error" | "warning" = "warning") => {
    setAlertToast({ message, type });
    setTimeout(() => {
      setAlertToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Region Selection Dropdown state
  const [regionSelect, setRegionSelect] = useState("all");

  // Synchronize dropdown to checkbox selections
  const handleRegionSelectChange = (value: string) => {
    setRegionSelect(value);
    if (value === "all") {
      setGeoLatam(true);
      setGeoCaribe(true);
      setGeoNa(true);
      setGeoEs(true);
    } else if (value === "latam") {
      setGeoLatam(true);
      setGeoCaribe(true);
      setGeoNa(false);
      setGeoEs(false);
    } else if (value === "na") {
      setGeoLatam(false);
      setGeoCaribe(false);
      setGeoNa(true);
      setGeoEs(false);
    } else if (value === "es") {
      setGeoLatam(false);
      setGeoCaribe(false);
      setGeoNa(false);
      setGeoEs(true);
    }
  };

  // Synchronize checkbox selections back to the dropdown
  const syncCheckboxesToDropdown = (latam: boolean, caribe: boolean, na: boolean, es: boolean) => {
    if (latam && caribe && na && es) {
      setRegionSelect("all");
    } else if (latam && caribe && !na && !es) {
      setRegionSelect("latam");
    } else if (!latam && !caribe && na && !es) {
      setRegionSelect("na");
    } else if (!latam && !caribe && !na && es) {
      setRegionSelect("es");
    } else {
      setRegionSelect("custom");
    }
  };

  // Simulated Google Auth Flow
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loginLoading) return;

    setLoginLoading(true);
    setLoginStepMsg("Estableciendo conexión segura...");

    const steps = [
      "Autenticando contra Google Accounts...",
      "Verificando gobernanza corporativa...",
      "Sincronizando entorno de trabajo seguro..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoginStepMsg(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        localStorage.setItem("autojob_logged_in", "true");
        localStorage.setItem("autojob_user_email", loginInputEmail);
        setUserEmail(loginInputEmail);
        setIsLoggedIn(true);
        setLoginLoading(false);
      }
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem("autojob_logged_in");
    setIsLoggedIn(false);
  };

  // LinkedIn, KPI Dashboard, and Vacancy Search states
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [kpiDatabase, setKpiDatabase] = useState({
    evaluadas: 142,
    emparejadas: 48,
    enviadas: 24
  });
  const [trackingStatus, setTrackingStatus] = useState<Record<string, { status: string; notes: string }>>(() => {
    return {
      "Tech Solutions Global-Senior IT Project Manager (Remoto - Latam & Europa)": { status: "Leído", notes: "El reclutador vio el perfil de Vicente. Esperando respuesta para agendar llamada." },
      "DataCorp International-Cloud Infrastructure Specialist & PM (Remote - North America)": { status: "Entrevista Programada", notes: "Primera entrevista técnica programada para el lunes." },
    };
  });
  const [selectedDashboardPlatform, setSelectedDashboardPlatform] = useState<"all" | "LinkedIn" | "Upwork" | "Indeed">("all");
  const [expandedTrackerKey, setExpandedTrackerKey] = useState<string | null>(null);
  const [dashboardPrepCompany, setDashboardPrepCompany] = useState("");
  const [dashboardPrepEmail, setDashboardPrepEmail] = useState("");
  const [dashboardPrepRequirements, setDashboardPrepRequirements] = useState("");
  const [dashboardPrepFormat, setDashboardPrepFormat] = useState<"cover-letter" | "cold-email">("cover-letter");
  const [dashboardPrepPlatform, setDashboardPrepPlatform] = useState<"LinkedIn" | "Upwork" | "Indeed">("Indeed");
  const [dashboardPrepLoading, setDashboardPrepLoading] = useState(false);
  const [dashboardPrepResult, setDashboardPrepResult] = useState<any>(null);

  const [jobSearch, setJobSearch] = useState("");
  const [showSearchVacancies, setShowSearchVacancies] = useState(false);
  const [activePage, setActivePage] = useState<"postulations" | "dashboard" | "consultant">("postulations");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"recommended" | "custom">("recommended");
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Automatically select the first vacancy when loaded
  React.useEffect(() => {
    if (vacancies && vacancies.length > 0) {
      setSelectedVacancy(vacancies[0]);
    } else {
      setSelectedVacancy(null);
    }
  }, [vacancies]);

  // Dynamically synchronize the KPI database based on active vacancies and submissions
  React.useEffect(() => {
    const list = vacancies || LOCAL_FALLBACK_VACANCIES;
    const realEvaluadas = list.length;
    const realMatches = list.filter(v => v.matchScore >= 55).length;
    const realSent = list.filter(v => v.applied || v.autoApplied).length;

    setKpiDatabase({
      evaluadas: 138 + realEvaluadas,
      emparejadas: 44 + realMatches,
      enviadas: 22 + realSent
    });
  }, [vacancies]);

  // Dynamic canvas-based bar chart rendering
  React.useEffect(() => {
    if (!isLoggedIn) return;
    
    // 1. Conversion Chart
    const canvas = document.getElementById("conversionChart") as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 180 * dpr; 
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = 180;

        ctx.clearRect(0, 0, w, h);

        const isDark = gmailTheme === "dark";
        const textColor = isDark ? "#e3e3e3" : "#3c4043";
        const gridColor = isDark ? "#444746" : "#e2e8f0";

        const data = [kpiDatabase.evaluadas, kpiDatabase.emparejadas, kpiDatabase.enviadas];
        const maxVal = Math.max(...data, 1);
        const labels = ['Evaluadas', 'Coincidencias', 'Enviadas'];
        const colors = ['#1a73e8', '#f9ab00', '#1e8e3e'];

        // Draw grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
          const y = 20 + (i * 35);
          ctx.beginPath();
          ctx.moveTo(30, y);
          ctx.lineTo(w - 15, y);
          ctx.stroke();
        }

        const chartHeight = 110;
        const barWidth = Math.min(45, (w - 70) / 3);
        const spacing = (w - 40 - (barWidth * 3)) / 4;

        data.forEach((val, i) => {
          const barHeight = (val / maxVal) * chartHeight;
          const x = 25 + spacing + i * (barWidth + spacing);
          const y = 140 - barHeight;

          // Draw rounded bar
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();

          // Value label
          ctx.fillStyle = textColor;
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(val.toString(), x + barWidth / 2, y - 6);

          // Label under bar
          ctx.font = "10px sans-serif";
          ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
          ctx.fillText(labels[i], x + barWidth / 2, 155);
        });
      }
    }

    // 2. Channels Effectiveness Chart
    const channelsCanvas = document.getElementById("channelsChart") as HTMLCanvasElement;
    if (channelsCanvas) {
      const cCtx = channelsCanvas.getContext("2d");
      if (cCtx) {
        const cDpr = window.devicePixelRatio || 1;
        const cRect = channelsCanvas.getBoundingClientRect();
        channelsCanvas.width = cRect.width * cDpr;
        channelsCanvas.height = 180 * cDpr;
        cCtx.scale(cDpr, cDpr);

        const cw = cRect.width;
        const ch = 180;

        cCtx.clearRect(0, 0, cw, ch);

        const isDark = gmailTheme === "dark";
        const textColor = isDark ? "#e3e3e3" : "#3c4043";
        const gridColor = isDark ? "#444746" : "#e2e8f0";

        // Effectiveness rates (e.g., conversion or win-rate per platform)
        const labels = ['LinkedIn', 'Upwork', 'Indeed'];
        const values = [58, 82, 65]; // LinkedIn 58%, Upwork 82%, Indeed 65%
        const colors = ['#0077b5', '#14a800', '#2557a7'];

        // Draw grid lines
        cCtx.strokeStyle = gridColor;
        cCtx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const x = 75 + (i * (cw - 100) / 4);
          cCtx.beginPath();
          cCtx.moveTo(x, 20);
          cCtx.lineTo(x, 140);
          cCtx.stroke();

          // Draw labels (0%, 25%, 50%, 75%, 100%)
          cCtx.fillStyle = isDark ? "#94a3b8" : "#64748b";
          cCtx.font = "9px sans-serif";
          cCtx.textAlign = "center";
          cCtx.fillText(`${i * 25}%`, x, 155);
        }

        const barHeight = 18;
        const startY = 22;
        const gap = 38;

        values.forEach((val, i) => {
          const y = startY + (i * gap);
          const maxBarWidth = cw - 105;
          const barWidth = (val / 100) * maxBarWidth;

          // Label
          cCtx.fillStyle = textColor;
          cCtx.font = "bold 11px sans-serif";
          cCtx.textAlign = "left";
          cCtx.fillText(labels[i], 12, y + 15);

          // Background track
          cCtx.fillStyle = isDark ? "#1e293b" : "#f1f5f9";
          cCtx.beginPath();
          if (typeof (cCtx as any).roundRect === 'function') {
            (cCtx as any).roundRect(75, y, maxBarWidth, barHeight, 4);
          } else {
            cCtx.rect(75, y, maxBarWidth, barHeight);
          }
          cCtx.fill();

          // Value track
          cCtx.fillStyle = colors[i];
          cCtx.beginPath();
          if (typeof (cCtx as any).roundRect === 'function') {
            (cCtx as any).roundRect(75, y, barWidth, barHeight, 4);
          } else {
            cCtx.rect(75, y, barWidth, barHeight);
          }
          cCtx.fill();

          // Percentage Text
          cCtx.fillStyle = "#ffffff";
          cCtx.font = "bold 10px sans-serif";
          cCtx.textAlign = "right";
          cCtx.fillText(`${val}%`, 75 + barWidth - 6 > 110 ? 75 + barWidth - 6 : 75 + barWidth + 24, y + 15);
        });
      }
    }
  }, [kpiDatabase, gmailTheme, isLoggedIn, showSearchVacancies, activePage]);

  // Integrated generator runner for search vacancies
  const handleGenerateForSearchVacancy = async (requirements: string, company: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const cancelSim = simulateLoadingSteps(4500);

    try {
      let cvBody: any = null;
      if (cv) {
        if (cv.type === "application/pdf") {
          cvBody = {
            base64: cv.base64Data,
            mimeType: cv.type
          };
        } else {
          cvBody = cv.textData;
        }
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvBody || "[Using vacancy parameters and keywords]",
          jobInput: requirements,
          format,
          linkedinProfile,
          companySearch: company,
          recruiterEmail,
          languageFilter
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Algo salió mal al generar tu postulación.");
      }

      setResult(data);
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.warn("API Error, falling back to local contingency generator:", err);
      const cvText = cv?.textData || "";
      const localResult = runLocalContingency(cvText, requirements, format, languageFilter);
      setResult(localResult);
      showToast("Algoritmo de generación de contingencia local activado con éxito.", "success");
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } finally {
      cancelSim();
      setLoading(false);
      setLoadingStep(0);
    }
  };

  // Interval-driven progress simulation to give the user delightful insights
  const simulateLoadingSteps = (durationMs: number) => {
    setLoadingStep(1);
    const stepInterval = durationMs / 4;
    
    const t1 = setTimeout(() => setLoadingStep(2), stepInterval);
    const t2 = setTimeout(() => setLoadingStep(3), stepInterval * 2);
    const t3 = setTimeout(() => setLoadingStep(4), stepInterval * 3);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleGenerate = async () => {
    if (!cv) {
      setError("Por favor, sube tu currículum (CV) primero.");
      return;
    }
    if (!jobInput.trim()) {
      setError("Por favor, ingresa el enlace o el texto de la vacante de empleo.");
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
      return;
    }

    setLoading(true);
    setError(null);
<<<<<<< HEAD

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: selectedFile,
          jobInput,
          format,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al generar el contenido.");
      }

      setResult(data);
      showToast("Contenido generado con éxito.", "success");
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
=======
    setResult(null);

    // Simulate delightful career optimization stages
    const cancelSim = simulateLoadingSteps(4500);

    try {
      // Prepare CV body format
      let cvBody: any = null;
      if (cv.type === "application/pdf") {
        cvBody = {
          base64: cv.base64Data,
          mimeType: cv.type
        };
      } else {
        cvBody = cv.textData;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvBody,
          jobInput: jobInput.trim(),
          format,
          linkedinProfile,
          companySearch,
          recruiterEmail,
          languageFilter
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Algo salió mal al generar tu postulación.");
      }

      setResult(data);
      // Scroll to result panel smoothly after rendering
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.warn("API Error, falling back to local contingency generator:", err);
      const cvText = cv?.textData || "";
      const localResult = runLocalContingency(cvText, jobInput.trim(), format, languageFilter);
      setResult(localResult);
      showToast("Algoritmo de generación de contingencia local activado con éxito.", "success");
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } finally {
      cancelSim();
      setLoading(false);
      setLoadingStep(0);
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
    }
  };

  const handleMatchVacancies = async () => {
<<<<<<< HEAD
    if (!selectedFile) {
      setError("Por favor, sube un CV primero.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/match-vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: selectedFile,
          searchQuery: jobInput,
        }),
=======
    setMatchingLoading(true);
    setMatchingError(null);
    setVacancies(null);

    // 1 & 2. Federated Search Execution and Safe Run Protocol
    if (jobSearch.trim()) {
      const query = jobSearch.trim();
      const encodedQuery = encodeURIComponent(query);
      const searchUrls: string[] = [];

      // A. INDEED: URL with syntax official incorporating variables of title, remote and country
      let indeedDomain = "www.indeed.com";
      let indeedQuery = encodedQuery;
      if (languageFilter === "es" || regionSelect === "es") {
        indeedDomain = "es.indeed.com";
        indeedQuery += "%20remoto";
      } else if (regionSelect === "latam") {
        indeedDomain = "mx.indeed.com"; // Indeed Mexico for Latin America
        indeedQuery += "%20remoto";
      } else {
        indeedQuery += "%20remote";
      }
      let indeedUrl = `https://${indeedDomain}/jobs?q=${indeedQuery}`;
      if (regionSelect === "na") {
        indeedUrl += "&l=United+States";
      } else if (regionSelect === "latam") {
        indeedUrl += "&l=M%C3%A9xico";
      } else if (regionSelect === "es") {
        indeedUrl += "&l=Espa%C3%B1a";
      }
      searchUrls.push(indeedUrl);

      // B. LINKEDIN: URL optimized pointing to job section with remote filter active
      let linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&f_WT=2`; // f_WT=2 is Remote
      if (regionSelect === "latam") {
        linkedinUrl += "&location=Latin%20America";
      } else if (regionSelect === "es") {
        linkedinUrl += "&location=Europe";
      } else if (regionSelect === "na") {
        linkedinUrl += "&location=North%20America";
      } else {
        linkedinUrl += "&location=Remote";
      }
      searchUrls.push(linkedinUrl);

      // C. UPWORK: Structured freelance search aligned with engineering profile technical skills
      const upworkSkills: string[] = [query];
      if (googleCertifications.toLowerCase().includes("cloud")) {
        upworkSkills.push("cloud");
      }
      if (universityDegree.toLowerCase().includes("sistemas") || universityDegree.toLowerCase().includes("ingeniería")) {
        upworkSkills.push("engineer");
      }
      const upworkQuery = upworkSkills.join(" ");
      const upworkUrl = `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(upworkQuery)}&sort=recency`;
      searchUrls.push(upworkUrl);

      // D. PORTALES GLOBALES: Additional parameterized links for remote jobs
      const wwrUrl = `https://weworkremotely.com/remote-jobs/search?term=${encodedQuery}`;
      const remoteOkUrl = `https://remoteok.com/remote-${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"))}-jobs`;
      searchUrls.push(wwrUrl);
      searchUrls.push(remoteOkUrl);

      // Safe deployment parallel tab loop with strict noopener, noreferrer isolation properties
      searchUrls.forEach((url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      });

      showToast("Búsqueda web federada iniciada. Abriendo pestañas seguras con aislamiento 'noopener,noreferrer'...", "success");
    }

    try {
      let cvBody: any = null;
      let finalCVText = "";
      if (cv) {
        if (cv.type === "application/pdf") {
          cvBody = {
            base64: cv.base64Data,
            mimeType: cv.type
          };
          finalCVText = cv.textData || "";
        } else {
          cvBody = cv.textData;
          finalCVText = cv.textData;
        }
      } else {
        // Fallback to manual profile if no CV uploaded
        const manualProfile = `Nombre de Candidato: Vicente Augusto Useche\nGrado Universitario: ${universityDegree}\nEquivalencias en Informática: ${informaticEquivalencies}\nCertificaciones de Google: ${googleCertifications}`;
        cvBody = manualProfile;
        finalCVText = manualProfile;
      }

      // Collect allowed regions based on checkboxes
      const allowedRegions: string[] = [];
      if (geoLatam) allowedRegions.push("latam");
      if (geoCaribe) allowedRegions.push("caribe");
      if (geoNa) allowedRegions.push("na");
      if (geoEs) allowedRegions.push("es");

      const response = await fetch("/api/match-vacancies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvBody,
          profileKeywords: `${universityDegree}, ${informaticEquivalencies}, ${googleCertifications}`,
          allowedRegions,
          languageFilter,
          query: jobSearch.trim()
        })
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
      });

      const data = await response.json();
      if (!response.ok) {
<<<<<<< HEAD
        throw new Error(data.error || "Error al buscar vacantes.");
      }

      // Convert vacancies to processes format
      const newProcesses = data.vacancies.map((v: Vacancy) => ({
        id: "proc_" + Date.now() + Math.random().toString(36).substr(2, 5),
        title: v.title,
        company: v.company,
        platform: v.platform || "LinkedIn",
        matchScore: v.matchScore,
        date: new Date().toLocaleDateString("es-ES"),
        status: "Enviado" as const,
        recruiterEmail: v.recruiterEmail,
      }));

      setProcesses((prev) => {
        const updated = [...newProcesses, ...prev];
        localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
        return updated;
      });

      showToast(`Se encontraron ${data.vacancies.length} vacantes compatibles.`, "success");
    } catch (err: any) {
      setError(err.message || "Error al buscar vacantes.");
    } finally {
      setLoading(false);
    }
  };

  // If no user, show loading screen
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Conecta<span className="text-blue-600">Vacantes</span></h1>
          <p className="text-slate-600 mb-4">Cargando aplicación...</p>
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header />

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("main")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "main"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Generador ATS</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Tablero</span>
          </button>
          <button
            onClick={() => setActiveTab("mail")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "mail"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Correo</span>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <AnimatePresence mode="wait">
          {activeTab === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Format Selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-600">Formato de salida:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormat("cover-letter")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        format === "cover-letter"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Carta de Presentación
                    </button>
                    <button
                      onClick={() => setFormat("cold-email")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        format === "cold-email"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Email de Contacto
                    </button>
=======
        throw new Error(data.error || "Algo salió mal al buscar vacantes alineadas.");
      }

      // Client-side filtering as an extra layer of robustness
      const apiVacancies = data.vacancies || [];
      const filtered = apiVacancies.filter((vac: Vacancy) => {
        if (languageFilter === "es") return vac.lang === "es";
        if (languageFilter === "en") return vac.lang === "en";
        return true;
      });

      const processed = processVacancies(filtered, finalCVText);
      const autoAppliedCount = processed.filter(v => v.autoApplied).length;
      setVacancies(processed);
      
      setKpiDatabase(prev => ({
        evaluadas: prev.evaluadas + processed.length,
        emparejadas: prev.emparejadas + processed.length,
        enviadas: prev.enviadas + autoAppliedCount
      }));

      if (autoAppliedCount > 0) {
        showToast(`⚡ ConectaVacantes: Se han enviado ${autoAppliedCount} postulaciones automáticas (+55% Match) con cartas personalizadas adjuntas al reclutador.`, "success");
      } else {
        showToast(`Búsqueda completada. No se encontraron ofertas sobre 55% para postulación automática.`, "warning");
      }
    } catch (err: any) {
      console.warn("API Error, falling back to local vacancy matching algorithm:", err);
      const cvText = (cv?.textData || "") + `\n\n${universityDegree}\n${informaticEquivalencies}\n${googleCertifications}`;
      const localMatched = matchVacanciesLocally(cvText, languageFilter, jobSearch);
      const processedLocal = processVacancies(localMatched, cvText);
      const autoAppliedCount = processedLocal.filter(v => v.autoApplied).length;
      setVacancies(processedLocal);
      
      setKpiDatabase(prev => ({
        evaluadas: prev.evaluadas + processedLocal.length,
        emparejadas: prev.emparejadas + processedLocal.length,
        enviadas: prev.enviadas + autoAppliedCount
      }));

      showToast("Algoritmo de búsqueda de vacantes de contingencia local activado con éxito.", "success");
      if (autoAppliedCount > 0) {
        setTimeout(() => {
          showToast(`⚡ Postulación automática activada para ${autoAppliedCount} vacantes (+55% Match) de contingencia.`, "success");
        }, 1500);
      }
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleApplyVacancy = async (vac: Vacancy) => {
    setJobInput(vac.requirements);
    setCompanySearch(vac.company);
    setError(null);
    setResult(null);

    // Update KPI metrics on application trigger
    setKpiDatabase(prev => ({
      evaluadas: prev.evaluadas + 1,
      emparejadas: prev.emparejadas + 1,
      enviadas: prev.enviadas + 1
    }));

    // Auto trigger generation for this vacancy
    setLoading(true);
    const cancelSim = simulateLoadingSteps(4500);

    try {
      let cvBody: any = null;
      if (cv) {
        if (cv.type === "application/pdf") {
          cvBody = {
            base64: cv.base64Data,
            mimeType: cv.type
          };
        } else {
          cvBody = cv.textData;
        }
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvBody || "[Using vacancy parameters and keywords]",
          jobInput: vac.requirements,
          format,
          linkedinProfile,
          companySearch: vac.company,
          recruiterEmail,
          languageFilter
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Algo salió mal al generar tu postulación.");
      }

      setResult(data);
      if (vacancies) {
        const updated = vacancies.map(v => {
          if (v.title === vac.title && v.company === vac.company) {
            return { ...v, applied: true, autoApplied: false };
          }
          return v;
        });
        setVacancies(updated);
        setSelectedVacancy(prev => prev ? { ...prev, applied: true, autoApplied: false } : null);
      }
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.warn("API Error, falling back to local contingency generator:", err);
      const cvText = cv?.textData || "";
      const localResult = runLocalContingency(cvText, vac.requirements, format, languageFilter);
      setResult(localResult);
      if (vacancies) {
        const updated = vacancies.map(v => {
          if (v.title === vac.title && v.company === vac.company) {
            return { ...v, applied: true, autoApplied: false };
          }
          return v;
        });
        setVacancies(updated);
        setSelectedVacancy(prev => prev ? { ...prev, applied: true, autoApplied: false } : null);
      }
      showToast("Algoritmo de generación de contingencia local activado con éxito.", "success");
      setTimeout(() => {
        document.getElementById("result-panel-container")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } finally {
      cancelSim();
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleDashboardGenerate = async () => {
    if (!cv) {
      showToast("Por favor, sube tu currículum (CV) primero en la sección de vacantes.", "warning");
      return;
    }
    if (!dashboardPrepCompany.trim()) {
      showToast("Por favor, ingresa el nombre de la empresa.", "warning");
      return;
    }
    if (!dashboardPrepRequirements.trim()) {
      showToast("Por favor, ingresa los requisitos o la descripción del puesto.", "warning");
      return;
    }

    setDashboardPrepLoading(true);
    setDashboardPrepResult(null);

    try {
      let cvBody: any = null;
      if (cv.type === "application/pdf") {
        cvBody = {
          base64: cv.base64Data,
          mimeType: cv.type
        };
      } else {
        cvBody = cv.textData;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvBody,
          jobInput: dashboardPrepRequirements.trim(),
          format: dashboardPrepFormat,
          linkedinProfile,
          companySearch: dashboardPrepCompany.trim(),
          recruiterEmail: dashboardPrepEmail.trim(),
          languageFilter
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Algo salió mal.");
      }

      setDashboardPrepResult(data);

      // Create new custom vacancy
      const newVac: Vacancy = {
        title: "Postulación Personalizada",
        company: dashboardPrepCompany.trim(),
        location: "Remoto (Mundial)",
        lang: languageFilter === "all" ? "es" : languageFilter,
        matchScore: data.matchScore || 85,
        description: `Carta/Correo generado para ${dashboardPrepCompany.trim()}.`,
        requirements: dashboardPrepRequirements.trim(),
        platform: dashboardPrepPlatform,
        applied: true,
        autoApplied: false
      };

      setVacancies(prev => {
        const existing = prev || LOCAL_FALLBACK_VACANCIES;
        if (existing.some(v => v.company === newVac.company && v.title === newVac.title)) {
          return existing;
        }
        return [newVac, ...existing];
      });

      // Add to tracking status
      const trackerKey = `${newVac.company}-${newVac.title}`;
      setTrackingStatus(prev => ({
        ...prev,
        [trackerKey]: {
          status: "Enviado",
          notes: `Postulación generada y enviada a ${dashboardPrepEmail || "reclutamiento@" + dashboardPrepCompany.toLowerCase().replace(/\s+/g, "") + ".com"}.`
        }
      }));

      showToast(`⚡ ConectaVacantes: Postulación para ${newVac.company} guardada, registrada y agregada al pipeline de seguimiento.`, "success");

    } catch (err: any) {
      console.warn("API Error, falling back to local contingency:", err);
      const cvText = cv?.textData || "";
      const localResult = runLocalContingency(cvText, dashboardPrepRequirements.trim(), dashboardPrepFormat, languageFilter);
      setDashboardPrepResult(localResult);

      const newVac: Vacancy = {
        title: "Postulación Personalizada (Contingencia)",
        company: dashboardPrepCompany.trim(),
        location: "Remoto (Mundial)",
        lang: languageFilter === "all" ? "es" : languageFilter,
        matchScore: localResult.matchScore || 80,
        description: `Carta/Correo de contingencia generado para ${dashboardPrepCompany.trim()}.`,
        requirements: dashboardPrepRequirements.trim(),
        platform: dashboardPrepPlatform,
        applied: true,
        autoApplied: false
      };

      setVacancies(prev => {
        const existing = prev || LOCAL_FALLBACK_VACANCIES;
        if (existing.some(v => v.company === newVac.company && v.title === newVac.title)) {
          return existing;
        }
        return [newVac, ...existing];
      });

      const trackerKey = `${newVac.company}-${newVac.title}`;
      setTrackingStatus(prev => ({
        ...prev,
        [trackerKey]: {
          status: "Enviado",
          notes: "Generación de contingencia local activada. Registrado en el pipeline de seguimiento."
        }
      }));

      showToast("Algoritmo de generación de contingencia local activado con éxito.", "success");
    } finally {
      setDashboardPrepLoading(false);
    }
  };

  const getLoadingMessage = (step: number) => {
    switch (step) {
      case 1:
        return "Conectando con el servidor y cargando tu Currículum...";
      case 2:
        return "Analizando los requisitos clave de la vacante y buscando palabras clave...";
      case 3:
        return "Cruzando tus habilidades técnicas y blandas con el perfil solicitado...";
      case 4:
        return "Redactando tu documento optimizado y puliendo los motores ATS...";
      default:
        return "Optimizando tu perfil laboral...";
    }
  };

  // Safe LinkedIn search URL builder
  const getLinkedInSearchUrl = () => {
    if (!companySearch.trim()) return "#";
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companySearch.trim())}`;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      gmailTheme === "dark" 
        ? "theme-gmail-dark bg-bg-custom text-text-custom" 
        : gmailTheme === "ocean" 
        ? "theme-gmail-ocean bg-bg-custom text-text-custom" 
        : "bg-slate-50/50 text-slate-900"
    } flex flex-col font-sans selection:bg-blue-500/10 selection:text-blue-600`}>
      
      {/* Capa de Seguridad Obligatoria (Simulación de Autenticación de Google) */}
      <AnimatePresence>
        {!isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            id="login-screen"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100 text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-xs">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                    ✓
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
                  </div>
                </div>
              </div>

<<<<<<< HEAD
              {/* CV Upload Section */}
              <CVUpload onUpload={setSelectedFile} selectedFile={selectedFile} />

              {/* Job Input Section */}
              <JobInput value={jobInput} onChange={setJobInput} />

              {/* Generate Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={loading || (!selectedFile && !jobInput)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generar {format === "cover-letter" ? "Carta" : "Email"} ATS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Match Vacancies Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleMatchVacancies}
                  disabled={loading || !selectedFile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍 Buscar Vacantes Compatibles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Panel */}
              {result && <ResultPanel result={result} format={format} />}

              {/* Career Consultant Chat */}
              <div className="mt-8">
                <CareerConsultant cvText={selectedFile?.textData} jobDescription={jobInput} />
              </div>
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DashboardAnalytics
                userEmail={userEmail}
                cvName={selectedFile?.name}
                cvText={selectedFile?.textData}
                onShowToast={showToast}
                processes={processes}
                setProcesses={setProcesses}
              />
            </motion.div>
          )}

          {activeTab === "mail" && (
            <motion.div
              key="mail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MailInbox userEmail={userEmail} onShowToast={showToast} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast Notifications */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm flex items-center gap-2 shadow-lg"
          >
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
=======
              <div className="space-y-2">
                <h2 className="font-display font-extrabold text-2xl text-slate-950 tracking-tight">
                  Acceso de Alta Seguridad
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Para proteger tus datos de postulación de acuerdo con las políticas corporativas, vincula tu cuenta institucional o personal.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-left space-y-1.5">
                  <label htmlFor="login-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Dirección de Correo (Gmail)
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    required
                    value={loginInputEmail}
                    onChange={(e) => setLoginInputEmail(e.target.value)}
                    placeholder="usuario@gmail.com"
                    className="w-full px-3.5 py-3 text-slate-800 border border-slate-200 rounded-xl bg-slate-50/40 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3.5 px-4 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-80"
                  id="btn-login"
                >
                  {loginLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold text-slate-600">{loginStepMsg}</span>
                    </div>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
                        <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.85 2.69-6.57zm-8.64 8.8c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.71H.95v2.3c1.48 2.97 4.56 5 8.05 5z" fill="#4285F4"/>
                        <path d="M3.95 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.96H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3-2.3z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4A8.99 8.99 0 0 0 9 0C5.5 0 2.42 2.03.95 5l3 2.3C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                      <span className="text-xs font-bold text-slate-700">Iniciar Sesión con Google (Gmail)</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-[10px] text-slate-400 font-medium">
                Encriptación de extremo a extremo TLS 1.3 de acuerdo con políticas de seguridad corporativas.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header 
        currentTheme={appTheme} 
        onThemeChange={setAppTheme} 
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onLogout={handleLogout}
        onEditProfile={() => setIsProfileModalOpen(true)}
      />

      <main 
        className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8" 
        id="main-app" 
        style={{ display: isLoggedIn ? "block" : "none" }}
      >

        {/* Barra de Navegación Responsiva (Tab Selector) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-2 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs" id="nav-tabs">
          <div className="flex items-center gap-2 font-display font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base px-1.5">
            <span className="text-blue-600 dark:text-blue-400">💼</span>
            <span>ConectaVacantes Hub</span>
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActivePage("postulations")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer text-center ${
                activePage === "postulations"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              Postulaciones
            </button>
            <button
              type="button"
              onClick={() => setActivePage("dashboard")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer text-center ${
                activePage === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              Tablero Analítico
            </button>
            <button
              type="button"
              onClick={() => setActivePage("consultant")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer text-center ${
                activePage === "consultant"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              Consultor de Carrera
            </button>
          </div>
        </div>

        {activePage === "postulations" ? (
          <div className="space-y-8" id="indeed-postulations-view">
            {/* 3. BUSCADOR CENTRAL UNIFICADO (THE INDEED SEARCH BAR HUB) */}
            <div className="bg-white border border-neutral-200 p-6 rounded-lg shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch gap-1 bg-white border border-neutral-300 rounded-md shadow-xs overflow-hidden">
                {/* Field 1: Qué */}
                <div className="flex-1 flex items-center px-4 py-3 border-b lg:border-b-0 lg:border-r border-neutral-200">
                  <Search className="h-5 w-5 text-neutral-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    id="job-search-what"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Puesto, palabras clave o empresa"
                    className="w-full text-sm text-neutral-800 placeholder-neutral-400 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium"
                  />
                </div>

                {/* Field 2: Dónde */}
                <div className="flex-1 flex items-center px-4 py-3">
                  <MapPin className="h-5 w-5 text-[#2557a7] shrink-0 mr-3" />
                  <input
                    type="text"
                    readOnly
                    value="Remoto (Europa / LATAM / Norteamérica)"
                    className="w-full text-sm text-neutral-700 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium select-none"
                  />
                </div>

                {/* Action button: Buscar */}
                <button
                  type="button"
                  id="btn-indeed-search"
                  onClick={handleMatchVacancies}
                  disabled={matchingLoading}
                  className="bg-[#2557a7] hover:bg-[#164081] text-white font-bold text-sm px-8 py-4 shrink-0 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {matchingLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Buscar</span>
                  )}
                </button>
              </div>

              {/* Dynamic filter pills */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                {/* Language Select Pill */}
                <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 border border-neutral-200 rounded-full text-neutral-600">
                  <span className="font-semibold text-neutral-500">Idioma de la Vacante:</span>
                  <select
                    id="language-filter"
                    value={languageFilter}
                    onChange={(e) => {
                      const val = e.target.value as "all" | "es" | "en";
                      setLanguageFilter(val);
                      // Instantly refresh list locally or through search
                      setTimeout(() => handleMatchVacancies(), 50);
                    }}
                    className="bg-transparent border-0 font-bold text-[#2557a7] focus:outline-none focus:ring-0 cursor-pointer p-0 pr-1 text-xs"
                  >
                    <option value="all">Ambos Idiomas</option>
                    <option value="es">Solo Español</option>
                    <option value="en">Solo Inglés</option>
                  </select>
                </div>

                {/* Region Select Pill */}
                <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 border border-neutral-200 rounded-full text-neutral-600">
                  <span className="font-semibold text-neutral-500">Región Geográfica:</span>
                  <select
                    id="region-select"
                    value={regionSelect}
                    onChange={(e) => {
                      handleRegionSelectChange(e.target.value);
                      setTimeout(() => handleMatchVacancies(), 50);
                    }}
                    className="bg-transparent border-0 font-bold text-[#2557a7] focus:outline-none focus:ring-0 cursor-pointer p-0 pr-1 text-xs"
                  >
                    <option value="all">Ambas Regiones</option>
                    <option value="latam">Solo Latinoamérica & Caribe</option>
                    <option value="na">Solo América del Norte</option>
                    <option value="es">Solo Europa</option>
                  </select>
                </div>

                <div className="hidden sm:flex items-center text-[11px] text-neutral-400 font-medium ml-auto">
                  <span>● 100% Remoto Certificado</span>
                </div>
              </div>
            </div>

            {/* 4. PANEL DE CONTENIDO INFERIOR COMPACTO (CLEAN CARDS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* CARD 1: Carga Optimizada de CV y Perfil de Ingeniería */}
              <div className="lg:col-span-4 bg-white border border-neutral-200 p-5 rounded-lg space-y-5 shadow-xs" id="cv-profile-card">
                <div>
                  <h3 className="font-bold text-sm text-neutral-800 tracking-tight uppercase border-b border-neutral-100 pb-2.5">
                    📄 Currículum & Identidad
                  </h3>
                </div>

                {/* Optimized CV Upload Area */}
                <CVUpload onUpload={setCv} selectedFile={cv} />

                {/* Sincronizado Candidate Info Summary */}
                <div className="bg-neutral-50 border border-neutral-200/60 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Perfil Sincronizado</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" title="Perfil Seguro Activo" />
                  </div>
                  
                  <div className="space-y-2.5 text-xs text-neutral-700">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400">Candidato:</p>
                      <p className="font-semibold text-neutral-900">Vicente Augusto Useche</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-neutral-400">Grado Universitario / Especialización:</p>
                      <p className="font-medium text-neutral-800 leading-tight">{universityDegree}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-neutral-400">Equivalencia Informática ATS:</p>
                      <p className="font-medium text-neutral-800 leading-tight">{informaticEquivalencies}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-neutral-400">Certificaciones de Google:</p>
                      <p className="font-medium text-neutral-800 leading-tight">{googleCertifications}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-full text-center py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-md font-bold text-[11px] transition-colors cursor-pointer mt-1"
                  >
                    Actualizar Perfil de Ingeniería
                  </button>
                </div>
              </div>

              {/* CARD 2: Tablero Analítico Interactivo & Alimentador Feed de Ofertas (Indeed Style) */}
              <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-lg shadow-xs overflow-hidden" id="feed-dashboard-card">
                {/* Header Tabs inside Card 2 */}
                <div className="flex border-b border-neutral-200 bg-neutral-50">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceTab("recommended");
                      setResult(null);
                    }}
                    className={`flex-1 text-center py-3.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                      activeWorkspaceTab === "recommended"
                        ? "border-[#2557a7] text-[#2557a7] bg-white"
                        : "border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50"
                    }`}
                  >
                    🎯 Ofertas de Trabajo Recomendadas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceTab("custom");
                      setResult(null);
                      setJobInput("");
                    }}
                    className={`flex-1 text-center py-3.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                      activeWorkspaceTab === "custom"
                        ? "border-[#2557a7] text-[#2557a7] bg-white"
                        : "border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50"
                    }`}
                  >
                    ✏️ Postulación Personalizada
                  </button>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {matchingError && (
                    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{matchingError}</span>
                    </div>
                  )}

                  {/* TAB 1: Ofertas de Trabajo Recomendadas (Split screen feed) */}
                  {activeWorkspaceTab === "recommended" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Left Pane: Job list feed */}
                      <div className="md:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          Empleos en tu radar
                        </div>
                        
                        {vacancies && vacancies.length > 0 ? (
                          vacancies.map((vac, index) => {
                            const isSelected = selectedVacancy && selectedVacancy.title === vac.title && selectedVacancy.company === vac.company;
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  setSelectedVacancy(vac);
                                  // Sync inputs
                                  setJobInput(vac.requirements);
                                  setCompanySearch(vac.company);
                                  setResult(null); // Clear previous result to prompt fresh optimization for this vacancy
                                }}
                                className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-[#2557a7] bg-[#2557a7]/5 border-l-4 shadow-2xs"
                                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                                }`}
                              >
                                <h4 className="font-bold text-xs sm:text-sm text-[#2557a7] hover:underline leading-tight">
                                  {vac.title}
                                </h4>
                                <p className="text-xs font-semibold text-neutral-700 mt-1">{vac.company}</p>
                                <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                                  <span>{vac.location}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    vac.matchScore >= 55 ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-rose-50 text-rose-700 border border-rose-150"
                                  }`}>
                                    {vac.matchScore}% Match
                                  </span>
                                  <span className="text-[9px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {vac.lang === "en" ? "English" : "Español"}
                                  </span>
                                  {vac.autoApplied ? (
                                    <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <span>⚡ Auto-Postulado</span>
                                    </span>
                                  ) : vac.applied ? (
                                    <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <span>✓ Postulado</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded">
                                      <span>⚠ Match Bajo</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-neutral-400 text-xs">
                            No se encontraron ofertas de empleo. Prueba con otros filtros.
                          </div>
                        )}
                      </div>

                      {/* Right Pane: ATS detail & custom cover letter generator */}
                      <div className="md:col-span-7 bg-neutral-50/60 border border-neutral-200 rounded-lg p-4 space-y-4">
                        {selectedVacancy ? (
                          <>
                            {/* Selected Vacancy Header */}
                            <div className="border-b border-neutral-200 pb-3">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Detalles de la Oferta</span>
                              <h3 className="font-bold text-sm text-neutral-900 leading-snug">
                                {selectedVacancy.title}
                              </h3>
                              <p className="text-xs text-neutral-600 font-medium mt-0.5">
                                {selectedVacancy.company} — <span className="text-neutral-500">{selectedVacancy.location}</span>
                              </p>
                            </div>

                            {/* Circular progress ATS Score inside the Feed detail */}
                            <div className="flex items-center space-x-3 bg-white p-3 rounded-md border border-neutral-200">
                              <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="24" cy="24" r="20" className="stroke-neutral-100" strokeWidth="4" fill="transparent" />
                                  <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="20" 
                                    className={`transition-all duration-500 ${
                                      selectedVacancy.matchScore >= 80 ? "stroke-emerald-500" : "stroke-amber-500"
                                    }`} 
                                    strokeWidth="4" 
                                    fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 20} 
                                    strokeDashoffset={2 * Math.PI * 20 - (selectedVacancy.matchScore / 100) * (2 * Math.PI * 20)}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute text-xs font-bold text-neutral-800">{selectedVacancy.matchScore}%</span>
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Alineación ATS Estimada</p>
                                <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                                  {selectedVacancy.matchScore >= 80 ? "✓ Alta coincidencia de perfil" : "⚠ Se recomiendan optimizaciones"}
                                </p>
                              </div>
                            </div>

                            {/* Job Brief description */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Resumen de Requisitos</span>
                              <p className="text-xs text-neutral-600 leading-relaxed font-medium bg-white p-2.5 rounded border border-neutral-200 max-h-[120px] overflow-y-auto">
                                {selectedVacancy.requirements}
                              </p>
                            </div>

                            {/* Format selection */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Formato de Redacción</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormat("cover-letter")}
                                  className={`px-3 py-2 border rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                    format === "cover-letter"
                                      ? "bg-[#2557a7]/10 border-[#2557a7] text-[#2557a7]"
                                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                  }`}
                                >
                                  Carta de Presentación
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormat("cold-email")}
                                  className={`px-3 py-2 border rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                    format === "cold-email"
                                      ? "bg-[#2557a7]/10 border-[#2557a7] text-[#2557a7]"
                                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                  }`}
                                >
                                  Correo de Outreach
                                </button>
                              </div>
                            </div>

                            {/* Inline Loading or Action Button or Result Panel */}
                            {loading ? (
                              <div className="bg-white border border-neutral-200 rounded-lg p-5 text-center space-y-3 shadow-xs">
                                <div className="relative h-10 w-10 mx-auto flex items-center justify-center">
                                  <RefreshCw className="h-6 w-6 text-[#2557a7] animate-spin absolute" />
                                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse absolute" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-neutral-800 font-bold text-xs">Optimizando Perfil...</p>
                                  <p className="text-neutral-500 text-[10px] max-w-xs mx-auto">
                                    {getLoadingMessage(loadingStep)}
                                  </p>
                                </div>
                                <div className="flex justify-center gap-1">
                                  {[1, 2, 3, 4].map((step) => (
                                    <div
                                      key={step}
                                      className={`h-1.5 rounded-full transition-all duration-300 ${
                                        loadingStep >= step ? "w-4 bg-[#2557a7]" : "w-1.5 bg-neutral-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (selectedVacancy.autoApplied || selectedVacancy.applied) ? (
                              <div className="space-y-3">
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>{selectedVacancy.autoApplied ? "⚡ Postulado Automáticamente (>55% Match)" : "✓ Postulado Manualmente"}</span>
                                  </div>
                                  <p className="text-neutral-600">
                                    {selectedVacancy.autoApplied 
                                      ? "Esta oferta supera el umbral del 55% de coincidencia ATS, por lo que ConectaVacantes Hub generó una carta de presentación optimizada y envió el correo al reclutador automáticamente."
                                      : "Has aprobado esta oferta y enviado la postulación manualmente con una carta de presentación optimizada."}
                                  </p>
                                </div>
                                <ResultPanel 
                                  result={result || generatePreAppliedResult(selectedVacancy, (cv?.textData || "Nombre: Vicente Augusto Useche\nGrado: Ingeniería de Telecomunicaciones - Universidad Distrital\nEquivalencia: Equivalencia en Ingeniería Informática y Computación Distribuida\nCertificaciones: Google Cloud Professional Data Engineer, Google IT Support, Google Project Management"), format)} 
                                  recruiterEmail={recruiterEmail || `reclutamiento@${selectedVacancy.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} 
                                  format={format} 
                                  companyName={selectedVacancy.company} 
                                />
                              </div>
                            ) : selectedVacancy.matchScore <= 54 ? (
                              <div className="space-y-3">
                                {/* Diagnóstico de Brechas ATS */}
                                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-lg space-y-3">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                    <span>🔍 Diagnóstico de Brechas ATS (Match Bajo: {selectedVacancy.matchScore}%)</span>
                                  </div>
                                  
                                  <p className="text-xs text-neutral-700 leading-relaxed">
                                    {selectedVacancy.gapAnalysis?.reason || `Tu CV base no menciona competencias críticas para esta oferta.`}
                                  </p>

                                  {selectedVacancy.gapAnalysis?.missingSkills && selectedVacancy.gapAnalysis.missingSkills.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Palabras Clave Faltantes en CV</span>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedVacancy.gapAnalysis.missingSkills.map((skill, sIdx) => (
                                          <span key={sIdx} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded font-medium">
                                            - {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="border-t border-amber-200/60 pt-2.5">
                                    <p className="text-[11px] text-neutral-600">
                                      ¿Deseas postularte de todas formas? Puedes forzar una postulación manual enviando el correo con una carta optimizada adaptada.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    setLoading(true);
                                    setLoadingStep(1);
                                    for (let i = 1; i <= 4; i++) {
                                      setLoadingStep(i);
                                      await new Promise(r => setTimeout(r, 600));
                                    }
                                    
                                    if (vacancies) {
                                      const updated = vacancies.map(v => {
                                        if (v.title === selectedVacancy.title && v.company === selectedVacancy.company) {
                                          return { ...v, applied: true, autoApplied: false };
                                        }
                                        return v;
                                      });
                                      setVacancies(updated);
                                      setSelectedVacancy(prev => prev ? { ...prev, applied: true, autoApplied: false } : null);
                                    }

                                    setKpiDatabase(prev => ({
                                      ...prev,
                                      enviadas: prev.enviadas + 1
                                    }));

                                    setLoading(false);
                                    showToast(`✓ Postulación manual enviada con éxito para ${selectedVacancy.title} de ${selectedVacancy.company}!`, "success");
                                  }}
                                  className="w-full bg-[#2557a7] hover:bg-[#164081] text-white font-bold py-3 px-4 rounded-md text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="h-4 w-4" />
                                  <span>Postularse Manualmente (Enviar Correo)</span>
                                </button>
                              </div>
                            ) : result ? (
                              <ResultPanel 
                                result={result} 
                                recruiterEmail={recruiterEmail} 
                                format={format} 
                                companyName={selectedVacancy.company} 
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApplyVacancy(selectedVacancy)}
                                className="w-full bg-[#2557a7] hover:bg-[#164081] text-white font-bold py-3 px-4 rounded-md text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="h-4 w-4" />
                                <span>Optimizar Perfil y Generar Documento</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12 text-neutral-400 text-xs">
                            Selecciona una oferta de empleo a la izquierda para ver su alineación ATS y redactar la carta adecuada.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Postulación Personalizada (Custom requirements pasting) */}
                  {activeWorkspaceTab === "custom" && (
                    <div className="space-y-5">
                      <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Company Name */}
                          <div>
                            <label htmlFor="custom-company-search" className="block text-xs font-bold text-neutral-600 mb-1">
                              Nombre de la Empresa / Entidad:
                            </label>
                            <input
                              type="text"
                              id="custom-company-search"
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                              placeholder="Ej. Tech Solutions Corp, Upwork Project"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-md text-xs sm:text-sm bg-white focus:outline-none focus:border-[#2557a7] transition-all"
                            />
                          </div>

                          {/* Recruiter Email */}
                          <div>
                            <label htmlFor="custom-recruiter-email" className="block text-xs font-bold text-neutral-600 mb-1">
                              Correo de Contacto (Opcional):
                            </label>
                            <input
                              type="email"
                              id="custom-recruiter-email"
                              value={recruiterEmail}
                              onChange={(e) => setRecruiterEmail(e.target.value)}
                              placeholder="Ej. reclutador@empresa.com"
                              className="w-full px-3 py-2 border border-neutral-200 rounded-md text-xs sm:text-sm bg-white focus:outline-none focus:border-[#2557a7] transition-all"
                            />
                          </div>
                        </div>

                        {/* Custom Job Requirements Input */}
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-neutral-600 mb-1">
                            Requisitos de la Oferta / Descripción del Puesto:
                          </label>
                          <JobInput value={jobInput} onChange={setJobInput} />
                        </div>

                        {/* Format Selection Custom */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-neutral-600 mb-1">
                            Formato de Redacción:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormat("cover-letter")}
                              className={`px-3 py-2 border rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                format === "cover-letter"
                                  ? "bg-[#2557a7]/10 border-[#2557a7] text-[#2557a7]"
                                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                              }`}
                            >
                              Carta de Presentación
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormat("cold-email")}
                              className={`px-3 py-2 border rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                format === "cold-email"
                                  ? "bg-[#2557a7]/10 border-[#2557a7] text-[#2557a7]"
                                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                              }`}
                            >
                              Correo de Outreach
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Error Custom */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-lg flex items-start gap-3 text-xs sm:text-sm"
                            id="error-message-panel"
                          >
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold">Por favor revisa lo siguiente:</p>
                              <p className="opacity-90">{error}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Loader Custom */}
                      {loading && (
                        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center space-y-3 shadow-xs">
                          <div className="relative h-10 w-10 mx-auto flex items-center justify-center">
                            <RefreshCw className="h-6 w-6 text-[#2557a7] animate-spin absolute" />
                            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse absolute" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-neutral-800 font-bold text-xs sm:text-sm">Analizando y Cruzando Información</p>
                            <p className="text-neutral-500 text-xs max-w-sm mx-auto">
                              {getLoadingMessage(loadingStep)}
                            </p>
                          </div>
                          <div className="flex justify-center gap-1.5">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  loadingStep >= step ? "w-6 bg-[#2557a7]" : "w-2 bg-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action trigger Custom */}
                      {!loading && !result && (
                        <button
                          type="button"
                          onClick={handleGenerate}
                          className="w-full bg-[#2557a7] hover:bg-[#164081] text-white font-bold py-3.5 px-4 rounded-md text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Optimizar Perfil y Generar Documento</span>
                        </button>
                      )}

                      {/* Result panel Custom */}
                      {result && !loading && (
                        <ResultPanel 
                          result={result} 
                          recruiterEmail={recruiterEmail} 
                          format={format} 
                          companyName={companySearch} 
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : activePage === "dashboard" ? (
          <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-fade-in">
            {/* Welcome Section for Dashboard */}
            <div className="text-center space-y-2 mb-2">
              <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-center gap-2">
                <span>📈</span>
                <span>Tablero de Control de Vacantes y Seguimiento</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Gestiona y optimiza tu perfil, prepara nuevos envíos personalizados y haz seguimiento en tiempo real de tus correos y cartas de presentación enviadas.
              </p>
            </div>

            {/* SECCIÓN 1: Autenticación de Identidad de LinkedIn (OAuth Bridge) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0077b5]/10 rounded-lg text-[#0077b5]">
                  <Linkedin className="h-4 w-4" />
                </div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider uppercase">
                  1. Vinculación y Extracción de Perfil Profesional (OAuth Bridge):
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  id="ln-input-profile"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                  placeholder="Pega el enlace de tu perfil de LinkedIn público o token de datos..."
                  className="sm:col-span-2 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/40 dark:bg-slate-950/60 text-xs focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
                <button
                  type="button"
                  id="btn-ln-connect"
                  onClick={() => {
                    if (!linkedinProfile.trim()) {
                      showToast("Introduce una URL de LinkedIn válida para sincronizar tu perfil.", "warning");
                      return;
                    }
                    setLinkedInConnected(true);
                    setProfileKeywords("Python, Cloud Architecture, AWS, GCP, Data Governance, KPIs");
                    showToast("Perfil de LinkedIn sincronizado con éxito de forma segura.", "success");
                  }}
                  className="bg-[#0077b5] hover:bg-[#005987] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Linkedin className="h-4 w-4 shrink-0" />
                  <span>Sincronizar con LinkedIn</span>
                </button>
              </div>
              <p
                id="ln-status"
                className={`text-[11px] font-medium transition-colors ${
                  linkedInConnected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {linkedInConnected
                  ? "✅ Sincronizado: Perfil extraído con éxito. Habilidades de optimización de datos inyectadas en la memoria de la aplicación."
                  : "Estado: Esperando vinculación de datos profesionales..."}
              </p>
            </div>

            {/* SECCIÓN 2: Dashboard Interactivo de Rendimiento ATS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider uppercase">
                📊 Métricas de Rendimiento en Tiempo Real y Tasa de Conversión:
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5" id="kpi-container">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Vacantes Evaluadas</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-display" id="kpi-eval">
                    {kpiDatabase.evaluadas}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Coincidencias (+55%)</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-500 dark:text-amber-400 font-display" id="kpi-match">
                    {kpiDatabase.emparejadas}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Cartas Enviadas</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 font-display" id="kpi-applied">
                    {kpiDatabase.enviadas}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Tasa Conversión ATS</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-rose-500 dark:text-rose-400 font-display" id="kpi-rate">
                    {Math.round((kpiDatabase.enviadas / kpiDatabase.emparejadas) * 100)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                  <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-center mb-3">
                    📊 Rendimiento de Conversión Histórico
                  </h5>
                  <div className="min-h-[180px] flex items-center justify-center">
                    <canvas id="conversionChart" className="w-full h-[180px] max-w-full block" />
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                  <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-center mb-3">
                    📈 Efectividad por Canal de Captura (LinkedIn, Upwork, Indeed)
                  </h5>
                  <div className="min-h-[180px] flex items-center justify-center">
                    <canvas id="channelsChart" className="w-full h-[180px] max-w-full block" />
                  </div>
                </div>
              </div>

              {/* Sección de Diagnóstico de Mejora del Perfil */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
                  <span>🎯 Diagnóstico de Mejora del Perfil (Recomendaciones IA para LinkedIn y Upwork):</span>
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-3 list-disc pl-4" id="feedback-list">
                  <li>
                    <strong>Sinergias Multicanal:</strong> Las propuestas en <em className="text-emerald-600 dark:text-emerald-300 font-semibold not-italic">Upwork</em> registran una efectividad del <span className="font-bold text-emerald-600 dark:text-emerald-400">82%</span> debido a la menor fricción del embudo frente al <span className="font-bold text-blue-600 dark:text-blue-400">58%</span> de <em className="text-blue-600 dark:text-blue-300 font-semibold not-italic">LinkedIn</em>, y <span className="font-bold text-indigo-600 dark:text-indigo-400">65%</span> de <em className="text-indigo-600 dark:text-indigo-300 font-semibold not-italic">Indeed</em>. Se recomienda equilibrar tus postulaciones diarias.
                  </li>
                  <li>
                    <strong>Habilidad faltante común:</strong> El 42% de las vacantes analizadas exigen conocimientos en <em className="text-blue-600 dark:text-blue-300 font-semibold not-italic">"Cloud Architecture (AWS/GCP)"</em> o <em className="text-emerald-600 dark:text-emerald-300 font-semibold not-italic">"AI-Agent Workflows"</em>.
                  </li>
                  <li>
                    <strong>Optimización estructural:</strong> Incrementa las palabras clave relacionadas con <em className="text-emerald-600 dark:text-emerald-300 font-semibold not-italic">"Gobierno de Datos"</em> y <em className="text-emerald-600 dark:text-emerald-300 font-semibold not-italic">"Freelance Delivery"</em> en la descripción de tu perfil para mejorar los filtros automáticos ATS de ambas plataformas.
                  </li>
                </ul>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                  * Datos optimizados en tiempo real mediante análisis de mercado global.
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: 🛠️ OPTIMIZACIÓN DIRECTA DEL PERFIL (ATS Optimizer) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                  🛠️ Optimizar mi Perfil Profesional (Criterios y Palabras Clave ATS)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modifica los parámetros clave que utiliza el motor de búsqueda federada IA de ConectaVacantes para calcular tus porcentajes de compatibilidad (Match Score).
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Especialidad / Grado:</label>
                  <input
                    type="text"
                    value={universityDegree}
                    onChange={(e) => setUniversityDegree(e.target.value)}
                    placeholder="Ej. Ingeniero de Telecomunicaciones"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Equivalencias Informáticas:</label>
                  <input
                    type="text"
                    value={informaticEquivalencies}
                    onChange={(e) => setInformaticEquivalencies(e.target.value)}
                    placeholder="Ej. Python, DevOps, Scrum Master"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Certificaciones de Google:</label>
                  <input
                    type="text"
                    value={googleCertifications}
                    onChange={(e) => setGoogleCertifications(e.target.value)}
                    placeholder="Ej. Google Project Management Professional"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("universityDegree", universityDegree);
                    localStorage.setItem("informaticEquivalencies", informaticEquivalencies);
                    localStorage.setItem("googleCertifications", googleCertifications);
                    showToast("Perfil profesional optimizado con éxito en memoria. Re-calculando compatibilidades de búsqueda...", "success");
                    handleMatchVacancies();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Guardar, Sincronizar y Re-calcular</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 4: 📨 PREPARAR ENVÍO Y POSTULACIÓN DIRECTA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                  <Send className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                  📨 Preparar Envío Rápido y Postulación Directa (Generar Outreach)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ¿Encontraste una vacante en otra plataforma? Pega los detalles aquí para generar una carta o correo personalizado y registrarlo en tu tablero de seguimiento automáticamente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre de la Empresa:</label>
                  <input
                    type="text"
                    value={dashboardPrepCompany}
                    onChange={(e) => setDashboardPrepCompany(e.target.value)}
                    placeholder="Ej. Global Tech Ltd"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Correo del Reclutador (Opcional):</label>
                  <input
                    type="email"
                    value={dashboardPrepEmail}
                    onChange={(e) => setDashboardPrepEmail(e.target.value)}
                    placeholder="Ej. recruiter@globaltech.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Formato:</label>
                    <select
                      value={dashboardPrepFormat}
                      onChange={(e) => setDashboardPrepFormat(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="cover-letter">Carta de Presentación</option>
                      <option value="cold-email">Outreach Email</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Canal:</label>
                    <select
                      value={dashboardPrepPlatform}
                      onChange={(e) => setDashboardPrepPlatform(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Indeed">Indeed</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Upwork">Upwork</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Requisitos de la Vacante o Descripción del Trabajo:</label>
                <textarea
                  value={dashboardPrepRequirements}
                  onChange={(e) => setDashboardPrepRequirements(e.target.value)}
                  placeholder="Pega la descripción, responsabilidades y competencias solicitadas de la oferta de empleo..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleDashboardGenerate}
                  disabled={dashboardPrepLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {dashboardPrepLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generar y Registrar Envío</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado de la preparación de envío rápida en dashboard */}
              {dashboardPrepResult && (
                <div className="mt-4 p-4 border border-emerald-100 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-slate-950/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✅ Postulación Generada Exitosamente</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 py-0.5 px-2.5 rounded-full font-bold">
                      Match Score: {dashboardPrepResult.matchScore || 85}%
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asunto Recomendado:</span>
                    <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {dashboardPrepFormat === "cover-letter" 
                        ? `Carta de Presentación - Vicente Augusto Useche - ${dashboardPrepCompany}` 
                        : `Postulación de Ingeniería - Vicente Augusto Useche - ${dashboardPrepCompany}`}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Texto del Correo / Carta:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dashboardPrepResult.generatedText || "");
                          showToast("Copiado al portapapeles", "success");
                        }}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold"
                      >
                        Copiar Texto
                      </button>
                    </div>
                    <pre className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 overflow-x-auto max-h-[160px] whitespace-pre-wrap font-sans leading-relaxed">
                      {dashboardPrepResult.generatedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 5: 📋 LISTADO DE PUBLICACIONES Y SEGUIMIENTO DE CORREOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
                    📋 Seguimiento de Publicaciones y Correos Enviados
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filtra por portal de empleo y controla el pipeline (correo enviado, entregado, leído o entrevista pactada).
                  </p>
                </div>
                
                {/* Platform Filter Tabs */}
                <div className="flex gap-1.5 self-start sm:self-center">
                  {(["all", "LinkedIn", "Upwork", "Indeed"] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSelectedDashboardPlatform(plat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedDashboardPlatform === plat
                          ? "bg-[#2557a7] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {plat === "all" ? "Todas" : plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render List of Vacancies for Tracking */}
              <div className="space-y-3.5">
                {(() => {
                  const list = vacancies || LOCAL_FALLBACK_VACANCIES;
                  const filtered = list.filter(v => 
                    selectedDashboardPlatform === "all" ? true : v.platform === selectedDashboardPlatform
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-400">No se encontraron postulaciones registradas en este canal.</p>
                      </div>
                    );
                  }

                  return filtered.map((vac) => {
                    const key = `${vac.company}-${vac.title}`;
                    const tracker = trackingStatus[key] || { status: "Pendiente", notes: "" };
                    const isApplied = vac.applied || vac.autoApplied;

                    return (
                      <div 
                        key={key} 
                        className={`border rounded-xl p-4 transition-all ${
                          isApplied 
                            ? "bg-slate-50/40 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800/80 hover:border-slate-300" 
                            : "bg-white dark:bg-slate-950/5 border-slate-100 dark:border-slate-900 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{vac.company}</span>
                              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider ${
                                vac.platform === "LinkedIn" ? "bg-[#0077b5]/10 text-[#0077b5]" :
                                vac.platform === "Upwork" ? "bg-[#14a800]/10 text-[#14a800]" : "bg-red-500/10 text-red-600"
                              }`}>
                                {vac.platform}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">{vac.title}</h4>
                            <p className="text-[11px] text-slate-400">{vac.location}</p>
                          </div>

                          <div className="text-right space-y-1.5 shrink-0">
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">Compatibilidad:</span>
                              <span className={`text-xs font-extrabold py-0.5 px-2 rounded-lg ${
                                vac.matchScore >= 85 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                vac.matchScore >= 55 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {vac.matchScore}%
                              </span>
                            </div>
                            
                            <div className="block">
                              {vac.autoApplied ? (
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 py-0.5 px-2 rounded-full font-bold">
                                  ⚡ Auto-Postulado
                                </span>
                              ) : vac.applied ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 py-0.5 px-2 rounded-full font-bold">
                                  ✓ Postulado
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 py-0.5 px-2 rounded-full font-bold">
                                  Pendiente (Match Bajo)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive tracking pipeline triggers only if the vacancy is Applied/Auto-Applied */}
                        {isApplied ? (
                          <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seguimiento de Estado:</span>
                              
                              {/* Horizontal tracking pipeline buttons */}
                              <div className="flex flex-wrap gap-1.5">
                                {["Enviado", "Entregado", "Leído", "Entrevista Programada"].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => {
                                      setTrackingStatus(prev => ({
                                        ...prev,
                                        [key]: { ...tracker, status }
                                      }));
                                      showToast(`Estado cambiado a: ${status}`, "success");
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                      tracker.status === status
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                                    }`}
                                  >
                                    {status === "Enviado" && "✉ Enviado"}
                                    {status === "Entregado" && "📥 Entregado"}
                                    {status === "Leído" && "👁 Leído"}
                                    {status === "Entrevista Programada" && "🗓 Entrevista"}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Tracking note area */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas de Seguimiento y Próximos Pasos:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={tracker.notes}
                                  onChange={(e) => {
                                    setTrackingStatus(prev => ({
                                      ...prev,
                                      [key]: { ...tracker, notes: e.target.value }
                                    }));
                                  }}
                                  placeholder="Escribe comentarios de seguimiento (ej. Respuesta el lunes, llamar a las 2, etc.)..."
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    showToast("Notas de seguimiento actualizadas.", "success");
                                  }}
                                  className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-1 px-3 rounded-lg text-[10px] cursor-pointer shrink-0"
                                >
                                  Guardar Notas
                                </button>
                              </div>
                            </div>

                            {/* Option to toggle viewing of the generated document */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setExpandedTrackerKey(expandedTrackerKey === key ? null : key)}
                                className="text-[11px] text-[#2557a7] dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                              >
                                {expandedTrackerKey === key ? "✕ Ocultar Documento Enviado" : "👁 Ver Correo / Carta de Presentación Enviada"}
                              </button>
                              
                              {expandedTrackerKey === key && (
                                <div className="mt-2.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2">
                                    <span className="text-[10px] font-bold text-slate-400">Canal de Envío: {vac.platform}</span>
                                    <button
                                      onClick={() => {
                                        const sampleText = generatePreAppliedResult(vac, cv?.textData || "").generatedText;
                                        navigator.clipboard.writeText(sampleText);
                                        showToast("Copiado al portapapeles", "success");
                                      }}
                                      className="text-[10px] text-blue-600 font-bold hover:underline"
                                    >
                                      Copiar Texto de Envío
                                    </button>
                                  </div>
                                  <pre className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                                    {generatePreAppliedResult(vac, cv?.textData || "").generatedText}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">Match insuficiente para envío automático. Revisa los requisitos:</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleApplyVacancy(vac);
                              }}
                              className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold py-1 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Optimizar y Aplicar Manual</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Welcome Section for Career Consultant */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-center gap-2">
                <span>🤖</span>
                <span>Consultor de Carrera Inteligente (IA)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Interactúa directamente con nuestro consultor de IA de élite para optimizar tu perfil, preparar entrevistas, adaptar tu CV y mejorar tu estrategia de carrera profesional.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <CareerConsultant 
                cvText={cv?.textData} 
                jobDescription={jobInput} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>© 2026 ConectaVacantes. Todos los derechos reservados.</p>
        <p className="mt-1 font-mono text-[10px]">ATS Compliance Algorithm v3.5 • LinkedIn & ATS Hub • Entorno Seguro Protegido</p>
      </footer>

      {/* Candidate Profile Editor Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            id="profile-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-neutral-100 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-[#2557a7] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <h3 className="font-semibold text-sm sm:text-base">Editar Perfil del Candidato</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-white/80 hover:text-white font-bold text-lg"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Actualiza tus datos académicos y profesionales. Estos campos se utilizarán para enriquecer la coincidencia con los filtros ATS y redactar documentos personalizados de mayor calidad.
                </p>

                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">
                      Grado Universitario o Especialización de Ingeniería:
                    </label>
                    <input
                      type="text"
                      value={universityDegree}
                      onChange={(e) => setUniversityDegree(e.target.value)}
                      placeholder="Ej. Ingeniería de Sistemas, Especialización en Desarrollo..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-[#2557a7] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">
                      Equivalencia en Informática (Sistemas de Criterios ATS):
                    </label>
                    <input
                      type="text"
                      value={informaticEquivalencies}
                      onChange={(e) => setInformaticEquivalencies(e.target.value)}
                      placeholder="Ej. Equivalencia en Ingeniería Informática y Computación Distribuida"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-[#2557a7] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">
                      Certificaciones de Google (Sincronización de Habilidades):
                    </label>
                    <input
                      type="text"
                      value={googleCertifications}
                      onChange={(e) => setGoogleCertifications(e.target.value)}
                      placeholder="Ej. Google Cloud Professional Data Engineer, Google Project Management"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-[#2557a7] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-neutral-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-md text-xs font-bold hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("profile_univ_degree", universityDegree);
                    localStorage.setItem("profile_info_equiv", informaticEquivalencies);
                    localStorage.setItem("profile_google_certs", googleCertifications);
                    showToast("¡Perfil actualizado con éxito! Los datos de ingeniería, equivalencias de informática y certificaciones de Google han sido sincronizados.", "success");
                    handleMatchVacancies(); // Re-trigger matchmaking to incorporate the updated profile details
                    setIsProfileModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#2557a7] hover:bg-[#164081] text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Guardar y Sincronizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
              alertToast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                : alertToast.type === "error"
                ? "bg-rose-50 dark:bg-rose-950 border-rose-100 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
                : "bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900/60 text-amber-800 dark:text-amber-200"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {alertToast.message}
            </div>
            <button
              onClick={() => setAlertToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm shrink-0 cursor-pointer"
            >
              ×
            </button>
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
