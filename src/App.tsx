import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, LogOut, User, BarChart3, Mail, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import CVUpload from "./components/CVUpload";
import JobInput from "./components/JobInput";
import ResultPanel from "./components/ResultPanel";
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
      return;
    }

    setLoading(true);
    setError(null);

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
    }
  };

  const handleMatchVacancies = async () => {
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
      });

      const data = await response.json();
      if (!response.ok) {
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
                  </div>
                </div>
              </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}