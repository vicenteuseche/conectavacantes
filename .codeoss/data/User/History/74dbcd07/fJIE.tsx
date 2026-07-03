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
  const [processes, setProcesses] = useState<Process[]>([]);
  const [alertToast, setAlertToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [unreadEmailsCount, setUnreadEmailsCount] = useState(2);
  const [jobInput, setJobInput] = useState("");

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
      const response = await fetch("/api/match-vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv || profileKeywords, profileKeywords, allowedRegions: ["latam", "na", "es"] })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText.includes('<!doctype') ? 'El servidor devolvió HTML en lugar de JSON' : errorText}`);
      }

      const data = await response.json();
      setVacancies(data.vacancies);
      if (data.vacancies?.length > 0) handleSelectVacancy(data.vacancies[0]);
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
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv || profileKeywords, jobInput: vac.requirements, format: "cover-letter" })
      });
      const data = await response.json();
      setGenerationResult(data);
    } catch (err) {
      showToast("Error en el análisis de IA", "error");
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
              {unreadEmailsCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-[10px] text-white rounded-full flex items-center justify-center">{unreadEmailsCount}</span>}
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
              </div>
              {/* Listado de vacantes... */}
            </div>

            {/* Columna Derecha: Panel IA */}
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              {activeVacancy && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="border-b pb-3">
                    <h4 className="font-bold text-sm line-clamp-2">{activeVacancy.title}</h4>
                    <p className="text-[11px] text-slate-500">{activeVacancy.company} • {activeVacancy.platform}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3">
                    <span className="text-2xl font-black text-blue-600">{activeVacancy.matchScore}%</span>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Afinidad ATS</div>
                  </div>
                  {/* Tabs de análisis... */}
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