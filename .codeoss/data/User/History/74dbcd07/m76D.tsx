import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  Sliders, 
  Linkedin, 
  Search, 
  Mail, 
  Briefcase, 
  ChevronRight, 
  X, 
  User, 
  AlertTriangle,
  Clipboard,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CVUpload from "./components/CVUpload";
import CareerConsultant from "./components/CareerConsultant";
import LoginScreen from "./components/LoginScreen";
import DashboardAnalytics from "./components/DashboardAnalytics";
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
  const [activePage, setActivePage] = useState<"postulations" | "dashboard" | "consultor">("postulations");
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
        body: JSON.stringify({ cv: cv?.textData || profileKeywords, profileKeywords, allowedRegions: ["latam", "na", "es"] })
      });
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
        body: JSON.stringify({ cv: cv?.textData || profileKeywords, jobInput: vac.requirements, format: "cover-letter" })
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600">ConectaVacantes</h1>
        <button onClick={() => setShowProfileModal(true)} className="bg-slate-200 p-2 rounded-lg"><User /></button>
      </header>
      
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
            <input 
              className="flex-1 border p-2 rounded-xl" 
              placeholder="Ej. React Developer..." 
              value={jobSearch} 
              onChange={(e) => setJobSearch(e.target.value)}
            />
            <button onClick={handleSearchVacancies} className="bg-blue-600 text-white px-6 rounded-xl font-bold">Buscar</button>
          </div>

          {vacancies?.map((vac, i) => (
            <div key={i} onClick={() => handleSelectVacancy(vac)} className="bg-white p-4 rounded-xl border hover:border-blue-500 cursor-pointer">
              <h3 className="font-bold">{vac.title}</h3>
              <p className="text-sm text-slate-500">{vac.company} • {vac.location}</p>
              <div className="mt-2 inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{vac.matchScore}% Match</div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          {activeVacancy && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border sticky top-4">
              <h2 className="font-bold text-lg mb-4">{activeVacancy.title}</h2>
              {loading ? <RefreshCw className="animate-spin mx-auto" /> : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-sm italic">{generationResult?.generatedText}</div>
                  <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Despachar Correo</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}