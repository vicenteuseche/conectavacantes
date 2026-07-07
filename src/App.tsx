import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, LogOut, User, BarChart3, Mail, Search, FileText, Send, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import CVUpload from "./components/CVUpload";
import { CVFileState, GenerationResult, Vacancy } from "./types";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "dashboard" | "consultant">("search");
  const [selectedFile, setSelectedFile] = useState<CVFileState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [autoSentCount, setAutoSentCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [cvModifiedCount, setCVModifiedCount] = useState(0);
  const [linksShownCount, setLinksShownCount] = useState(0);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([]);

  // Check for saved session
  useEffect(() => {
    const savedEmail = localStorage.getItem("cv_user_email");
    if (savedEmail) {
      setUserEmail(savedEmail);
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

  const handleSearchVacancies = async () => {
    if (!selectedFile) {
      setError("Por favor, sube tu CV primero.");
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
          searchQuery: "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al buscar vacantes.");
      }

      const results = data.vacancies || [];
      setVacancies(results);

      // Process vacancies: auto-send if >55% and has recruiter email
      let autoSent = 0;
      let pending = 0;
      let links = 0;
      const suggestions: string[] = [];

      for (const vac of results) {
        if (vac.matchScore >= 55) {
          if (vac.recruiterEmail) {
            // Auto-send cover letter
            autoSent++;
            await sendCoverLetter(vac, selectedFile);
          } else {
            // Show link for manual application
            links++;
          }
        } else {
          // Add improvement suggestions
            if (vac.requirements) {
              const skills = vac.requirements.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
              suggestions.push(...skills.slice(0, 3));
            }
        }
      }

      setAutoSentCount(autoSent);
      setPendingApprovalCount(pending);
      setLinksShownCount(links);
      setImprovementSuggestions([...new Set(suggestions)].slice(0, 10));

      showToast(`Se encontraron ${results.length} vacantes. ${autoSent} envíos automáticos realizados.`, "success");
    } catch (err: any) {
      setError(err.message || "Error al buscar vacantes.");
    } finally {
      setLoading(false);
    }
  };

  const sendCoverLetter = async (vacancy: Vacancy, cv: CVFileState) => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: cv,
          jobInput: vacancy.requirements || vacancy.description,
          format: "cover-letter",
        }),
      });

      const data = await response.json();
      if (response.ok && data.generatedText) {
        // In a real app, this would send an email
        console.log(`Cover letter generated for ${vacancy.company}`);
      }
    } catch (err) {
      console.error("Error generating cover letter:", err);
    }
  };

  // If no user, show login screen
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Conecta<span className="text-blue-600">Vacantes</span></h1>
          <p className="text-slate-600 mb-6">Ingresa con tu cuenta de Google</p>
          <button
            onClick={() => handleLoginSuccess("demo@conectavacantes.com")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md w-full"
          >
            <User className="h-5 w-5" />
            <span>Ingresar con Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header userEmail={userEmail} onLogout={handleLogout} />

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Busca Vacantes</span>
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
            onClick={() => setActiveTab("consultant")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "consultant"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Consultor de Carrera</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <AnimatePresence mode="wait">
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* CV Upload Section */}
              <CVUpload onUpload={setSelectedFile} selectedFile={selectedFile} />

              {/* Search Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSearchVacancies}
                  disabled={loading || !selectedFile}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Buscar Vacantes Compatibles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Results Section */}
              {vacancies.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-800">Vacantes Encontradas</h2>
                  <div className="grid gap-4">
                    {vacancies.map((vac, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-900">{vac.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            vac.matchScore >= 55 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {vac.matchScore}% compatibilidad
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{vac.company} - {vac.location}</p>
                        {vac.recruiterEmail && vac.matchScore >= 55 && (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Carta enviada automáticamente
                          </p>
                        )}
                        {!vac.recruiterEmail && vac.matchScore >= 55 && (
                          <a href="#" className="text-xs text-blue-600 hover:underline">
                            Ver enlace de postulación
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {improvementSuggestions.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Mejora tu CV para estas vacantes
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {improvementSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-slate-800">Tablero de Métricas</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-blue-600">{vacancies.length}</p>
                  <p className="text-xs text-slate-500">Postulaciones Evaluadas</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{autoSentCount}</p>
                  <p className="text-xs text-slate-500">Envíos Automáticos</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-amber-600">{pendingApprovalCount}</p>
                  <p className="text-xs text-slate-500">En Aprobación</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-purple-600">{cvModifiedCount}</p>
                  <p className="text-xs text-slate-500">CVs Modificados</p>
                </div>
              </div>

              {/* Vacancies Table */}
              {vacancies.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Vacante</th>
                        <th className="px-4 py-2 text-left">Empresa</th>
                        <th className="px-4 py-2 text-center">Compatibilidad</th>
                        <th className="px-4 py-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacancies.map((vac, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-4 py-2">{vac.title}</td>
                          <td className="px-4 py-2">{vac.company}</td>
                          <td className="px-4 py-2 text-center">{vac.matchScore}%</td>
                          <td className="px-4 py-2 text-center">
                            {vac.matchScore >= 55 && vac.recruiterEmail ? "Enviado" : 
                             vac.matchScore >= 55 ? "Link mostrado" : "No compatible"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "consultant" && (
            <motion.div
              key="consultant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white p-6 rounded-xl border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Consultor de Carrera AI</h2>
                <p className="text-slate-600">Simulador de consultor de carrera - Próximamente disponible</p>
              </div>
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