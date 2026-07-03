import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Linkedin, 
  Search, 
  ExternalLink, 
  Mail, 
  Briefcase, 
  MapPin, 
  Award, 
  ChevronRight, 
  X, 
  User, 
  Settings, 
  Send, 
  FileText, 
  ThumbsUp, 
  AlertTriangle,
  Clipboard,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CVUpload from "./components/CVUpload";
import CareerConsultant from "./components/CareerConsultant";
import LoginScreen from "./components/LoginScreen";
import DashboardAnalytics from "./components/DashboardAnalytics";
import MailInbox from "./components/MailInbox";
import { CVFileState, OutputFormat, GenerationResult, Vacancy } from "./types";

interface Process {
  id: string;
  title: string;
  company: string;
  platform: string;
  matchScore: number;
  date: string;
  status: "Enviado" | "Entrevista" | "Rechazado" | "Ofrecido";
  recruiterEmail?: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("connectavacantes_logged_in") === "true");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("connectavacantes_user_email") || "");
  const [activePage, setActivePage] = useState<"postulations" | "dashboard" | "consultor" | "mail">("postulations");
  const [cv, setCv] = useState<CVFileState | null>(null);
  const [candidateName, setCandidateName] = useState("Vicente Useche");
  const [profileKeywords, setProfileKeywords] = useState("React, Node.js, TypeScript, Cloud Architecture");
  const [linkedinProfile, setLinkedinProfile] = useState("https://linkedin.com/in/vicente-useche");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(() => localStorage.getItem("connectavacantes_linkedin_connected") === "true");
  const [isIndeedConnected, setIsIndeedConnected] = useState(() => localStorage.getItem("connectavacantes_indeed_connected") === "true");
  const [selectedPlatform, setSelectedPlatform] = useState<"Todas" | "LinkedIn" | "Indeed" | "Workup">("Todas");
  const [jobSearch, setJobSearch] = useState("");
  const [vacancies, setVacancies] = useState<Vacancy[] | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);
  const [activeInspectTab, setActiveInspectTab] = useState<"analysis" | "document">("analysis");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [alertToast, setAlertToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [unreadEmailsCount, setUnreadEmailsCount] = useState(0);
  const [jobInput, setJobInput] = useState("");

  // Filtros adicionales
  const [selectedLanguage, setSelectedLanguage] = useState<"todos" | "es" | "en">("todos");
  const [selectedRegion, setSelectedRegion] = useState<"todos" | "latam" | "caribe" | "na" | "es">("todos");
  const [selectedContractType, setSelectedContractType] = useState<"todos" | "contrato" | "proyecto">("todos");

  // Escuchar mensajes de OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) return;

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { platform, profile } = event.data;
        if (platform === "linkedin") {
          setIsLinkedinConnected(true);
          localStorage.setItem("connectavacantes_linkedin_connected", "true");
        } else if (platform === "indeed") {
          setIsIndeedConnected(true);
          localStorage.setItem("connectavacantes_indeed_connected", "true");
        }

        if (profile) {
          if (profile.name) {
            setCandidateName(profile.name);
            localStorage.setItem(`cv_name_${userEmail}`, profile.name);
          }
          if (profile.keywords) {
            setProfileKeywords(profile.keywords);
            localStorage.setItem(`cv_keywords_${userEmail}`, profile.keywords);
          }
        }
        showToast(`🔌 ¡Cuenta de ${platform} vinculada correctamente!`, "success");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userEmail]);

  const handleConnectOAuth = async (platform: "linkedin" | "indeed") => {
    try {
      const res = await fetch(`/api/auth/${platform}/url`);
      if (!res.ok) throw new Error(`Error al obtener URL de OAuth para ${platform}`);
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(url, `oauth_${platform}_popup`, `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);
      
      if (!popup) {
        showToast("⚠️ El navegador bloqueó la ventana emergente. Por favor, permítela.", "warning");
      }
    } catch (err: any) {
      showToast(`Error de conexión: ${err.message}`, "error");
    }
  };

  const handleDisconnectOAuth = (platform: "linkedin" | "indeed") => {
    if (platform === "linkedin") {
      setIsLinkedinConnected(false);
      localStorage.removeItem("connectavacantes_linkedin_connected");
    } else {
      setIsIndeedConnected(false);
      localStorage.removeItem("connectavacantes_indeed_connected");
    }
    showToast(`🔌 Cuenta de ${platform} desvinculada.`, "success");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("connectavacantes_logged_in");
    localStorage.removeItem("connectavacantes_user_email");
    location.reload();
  };

  const showToast = (message: string, type: "success" | "error" | "warning" = "warning") => {
    setAlertToast({ message, type });
    setTimeout(() => setAlertToast(null), 4500);
  };

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      const savedProcs = localStorage.getItem(`cv_processes_${userEmail}`);
      if (savedProcs) setProcesses(JSON.parse(savedProcs));
    }
  }, [isLoggedIn, userEmail]);

  const handleSearchVacancies = async () => {
    setMatchingLoading(true);
    try {
      let cvBody: any = null;
      if (cv) {
        cvBody = cv.type === "application/pdf" ? { base64: cv.base64Data, mimeType: cv.type } : cv.textData;
      }

      let regions = selectedRegion === "todos" ? ["latam", "caribe", "na", "es"] : [selectedRegion];

      const response = await fetch("/api/match-vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvBody || profileKeywords, profileKeywords, allowedRegions: regions })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText.includes('<!doctype') ? 'El servidor devolvió HTML en lugar de JSON' : errorText}`);
      }
      
      const data = await response.json();
      setVacancies(data.vacancies || []);
    } catch (err) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSelectVacancy = async (vac: Vacancy) => {
    setActiveVacancy(vac);
    setRecruiterEmail(vac.recruiterEmail);
    setLoading(true);
    setGenerationError(null);
    try {
      let cvBody: any = null;
      if (cv) {
        cvBody = cv.type === "application/pdf" ? { base64: cv.base64Data, mimeType: cv.type } : cv.textData;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvBody || profileKeywords, jobInput: vac.requirements, format: "cover-letter", linkedinProfile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error IA");
      setGenerationResult(data);
    } catch (err) {
      setGenerationError("Error en el análisis de IA");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return <LoginScreen onLoginSuccess={(email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem("connectavacantes_logged_in", "true");
    localStorage.setItem("connectavacantes_user_email", email);
  }} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      {/* Top Professional Header */}
      <header className="border-b border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="font-display text-lg font-extrabold tracking-tight">
              Conecta<span className="text-blue-600">Vacantes</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowProfileModal(true)} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>Editar Perfil</span>
            </button>
            <button onClick={handleLogout} className="px-3 py-2 text-rose-600 text-xs font-bold">Salir</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-2 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm px-1.5">
            <span className="text-emerald-500 font-mono text-xs">●</span>
            <span>Espacio de Trabajo:</span>
            <span className="text-slate-400 font-normal text-xs">{userEmail}</span>
          </div>
          
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button onClick={() => setActivePage("postulations")} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePage === "postulations" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
              Buscar Vacantes
            </button>
            <button onClick={() => { setActivePage("mail"); setUnreadEmailsCount(0); }} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activePage === "mail" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
              Correo
              {unreadEmailsCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-[10px] text-white rounded-full flex items-center justify-center animate-pulse">{unreadEmailsCount}</span>}
            </button>
            <button onClick={() => setActivePage("dashboard")} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePage === "dashboard" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
              Tablero Analítico
            </button>
            <button onClick={() => setActivePage("consultor")} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePage === "consultor" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>
              Consultor de Carrera
            </button>
          </div>
        </div>

        {/* PAGE 1: BUSCADOR DE VACANTES (Layout de Producción) */}
        {activePage === "postulations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Resultados */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    🔍 Buscador de Vacantes Doble (LinkedIn + Indeed + Workup)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      <option value="Todas">🔍 Todas las Redes</option>
                      <option value="LinkedIn">🌐 LinkedIn Jobs</option>
                      <option value="Indeed">💼 Indeed Remote</option>
                      <option value="Workup">🟢 Workup Project</option>
                    </select>
                  </div>
                  <div className="sm:col-span-6">
                    <input type="text" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} placeholder="Ej. React Developer..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" />
                  </div>
                  <div className="sm:col-span-3">
                    <button onClick={handleSearchVacancies} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                      <Search className="h-4 w-4" /> Buscar
                    </button>
                  </div>
                </div>

                {/* Filtros secundarios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Región</label>
                    <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value as any)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="todos">Cualquier Región</option>
                      <option value="latam">Latinoamérica</option>
                      <option value="na">Norteamérica</option>
                      <option value="es">España</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Idioma</label>
                    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as any)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="todos">Todos</option>
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Contrato</label>
                    <select value={selectedContractType} onChange={(e) => setSelectedContractType(e.target.value as any)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <option value="todos">Todos</option>
                      <option value="contrato">Fijo</option>
                      <option value="proyecto">Proyecto</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Listado de vacantes */}
              <div className="space-y-3">
                {vacancies?.map((vac, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectVacancy(vac)}
                    className={`bg-white border p-4 rounded-xl flex items-center justify-between hover:border-blue-300 cursor-pointer transition-all ${activeVacancy?.title === vac.title ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-xs sm:text-sm">{vac.title}</h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{vac.platform}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">{vac.company} • {vac.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${vac.matchScore >= 55 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {vac.matchScore}% Match
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold flex items-center">
                        Inspeccionar <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna Derecha: Panel IA */}
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              {activeVacancy && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="border-b pb-3">
                    <h4 className="font-bold text-sm line-clamp-2">{activeVacancy.title}</h4>
                    <p className="text-[11px] text-slate-500">{activeVacancy.company} • {activeVacancy.platform}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
                    <div className="relative h-12 w-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" className="stroke-slate-200" strokeWidth="4" fill="transparent" />
                        <circle cx="24" cy="24" r="20" className={activeVacancy.matchScore >= 55 ? "stroke-emerald-500" : "stroke-rose-500"} strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (activeVacancy.matchScore / 100) * 125.6} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-[10px] font-bold">{activeVacancy.matchScore}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Afinidad ATS</span>
                      <span className={`text-xs font-bold ${activeVacancy.matchScore >= 55 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {activeVacancy.matchScore >= 55 ? 'Alta Posibilidad' : 'Afinidad Baja'}
                      </span>
                    </div>
                  </div>

                  <div className="flex border-b gap-2">
                    <button onClick={() => setActiveInspectTab("analysis")} className={`pb-2 text-xs font-bold border-b-2 ${activeInspectTab === "analysis" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}>Análisis</button>
                    <button onClick={() => setActiveInspectTab("document")} className={`pb-2 text-xs font-bold border-b-2 ${activeInspectTab === "document" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}>Borrador</button>
                  </div>

                  <div className="min-h-[150px] text-xs">
                    {loading ? (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <p className="text-slate-400">Procesando con Gemini...</p>
                      </div>
                    ) : generationError ? (
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">{generationError}</div>
                    ) : activeInspectTab === "analysis" ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {generationResult?.keywords?.map((kw, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded text-[10px] ${kw.matched ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {kw.keyword}
                            </span>
                          ))}
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
                          <strong>Consejo:</strong> {generationResult?.gaps?.[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <pre className="p-3 bg-slate-50 rounded-lg whitespace-pre-wrap font-sans max-h-[200px] overflow-y-auto border border-slate-150">
                          {generationResult?.generatedText}
                        </pre>
                        <button onClick={() => { navigator.clipboard.writeText(generationResult?.generatedText || ""); showToast("Copiado", "success"); }} className="w-full py-2 bg-slate-100 font-bold rounded-lg flex items-center justify-center gap-2">
                          <Clipboard className="h-3 w-3" /> Copiar Texto
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    {activeVacancy.matchScore >= 55 ? (
                      <button 
                        onClick={() => showToast(`Despachado a ${recruiterEmail}`, "success")}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                      >
                        <Mail className="h-4 w-4" /> Despachar Correo Automático
                      </button>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center space-y-1">
                        <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Postulación Manual
                        </p>
                        <p className="text-[10px] text-amber-700">Afinidad baja. El botón automático se bloquea por seguridad.</p>
                        <span className="inline-block bg-white px-2 py-0.5 rounded text-[9px] font-bold border">
                          Estas vacantes sí tienes que postularte tú
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activePage === "dashboard" && (
          <DashboardAnalytics userEmail={userEmail} cvText={cv?.textData} processes={processes} setProcesses={setProcesses} onShowToast={showToast} />
        )}

        {activePage === "mail" && <MailInbox userEmail={userEmail} onShowToast={showToast} />}
        
        {activePage === "consultor" && <CareerConsultant cvText={cv?.textData} jobDescription={jobInput} />}
      </main>
    </div>
  );
}