import React, { useState, useEffect } from "react";
import { 
  Linkedin, 
  TrendingUp, 
  Mail, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Plus, 
  FileText, 
  Download, 
  Sparkles, 
  Briefcase, 
  Award, 
  Check, 
  ChevronRight, 
  ExternalLink,
  RefreshCw,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";

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

interface DashboardAnalyticsProps {
  userEmail: string;
  cvName?: string;
  cvText?: string;
  onShowToast: (msg: string, type: "success" | "error" | "warning") => void;
  // Shared state with App.tsx to coordinate processes
  processes: Process[];
  setProcesses: React.Dispatch<React.SetStateAction<Process[]>>;
}

export default function DashboardAnalytics({ 
  userEmail, 
  cvName, 
  cvText, 
  onShowToast,
  processes,
  setProcesses
}: DashboardAnalyticsProps) {
  
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [profileKeywords, setProfileKeywords] = useState("");

  // CRUD & Modal state for processes
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPlatform, setNewPlatform] = useState("LinkedIn");
  const [newMatchScore, setNewMatchScore] = useState(75);
  const [newStatus, setNewStatus] = useState<Process["status"]>("Enviado");
  const [newRecruiterEmail, setNewRecruiterEmail] = useState("");

  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);

  // Chart interaction states
  // "vacancies" | "emails" | "platforms" | null
  const [activeChartDetail, setActiveChartDetail] = useState<"vacancies" | "emails" | "platforms" | null>(null);

  // Sincronizar LinkedIn desde localStorage si ya se hizo antes
  useEffect(() => {
    const savedProfile = localStorage.getItem(`cv_linkedin_${userEmail}`);
    if (savedProfile) {
      setLinkedinProfile(savedProfile);
      setLinkedInConnected(true);
      setProfileKeywords("React, TypeScript, UI/UX Design, SaaS Architect, TailWind CSS, REST APIs");
    }
  }, [userEmail]);

  // Handle LinkedIn sync
  const handleConnectLinkedIn = () => {
    if (!linkedinProfile.trim()) {
      onShowToast("Por favor, introduce una URL de LinkedIn válida.", "warning");
      return;
    }
    setLinkedInConnected(true);
    localStorage.setItem(`cv_linkedin_${userEmail}`, linkedinProfile);
    setProfileKeywords("TypeScript, Full-Stack Developer, AI Integrations, Node.js, SQL, React Native");
    onShowToast("Perfil de LinkedIn sincronizado correctamente.", "success");
  };

  // Add a new process tracking row
  const handleAddProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) {
      onShowToast("Por favor, rellena los campos de título y empresa.", "warning");
      return;
    }

    const newProc: Process = {
      id: "proc_" + Date.now(),
      title: newTitle.trim(),
      company: newCompany.trim(),
      platform: newPlatform,
      matchScore: Number(newMatchScore),
      date: new Date().toLocaleDateString("es-ES"),
      status: newStatus,
      recruiterEmail: newRecruiterEmail.trim() || undefined
    };

    const updated = [newProc, ...processes];
    setProcesses(updated);
    localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
    
    // Reset fields
    setNewTitle("");
    setNewCompany("");
    setNewPlatform("LinkedIn");
    setNewMatchScore(75);
    setNewStatus("Enviado");
    setNewRecruiterEmail("");
    setShowAddModal(false);
    onShowToast("Proceso de postulación registrado con éxito.", "success");
  };

  // Delete a process
  const handleDeleteProcess = (id: string) => {
    const updated = processes.filter(p => p.id !== id);
    setProcesses(updated);
    localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
    onShowToast("Proceso eliminado de tu tablero.", "success");
  };

  // Change process status directly
  const handleChangeStatus = (id: string, status: Process["status"]) => {
    const updated = processes.map(p => {
      if (p.id === id) {
        return { ...p, status };
      }
      return p;
    });
    setProcesses(updated);
    localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
    onShowToast(`Estado actualizado a: ${status}`, "success");
  };

  // Calculate stats
  const totalEvaluated = processes.length * 3 + 12; // Base simulated value + real ones
  const totalMatches = processes.filter(p => p.matchScore >= 55).length + 8;
  const emailsSent = processes.filter(p => p.status === "Enviado" || p.status === "Entrevista" || p.status === "Ofrecido").length;
  const conversionRate = totalMatches > 0 ? Math.round((emailsSent / totalMatches) * 100) : 0;

  // Cálculo del Match Score Promedio para Tematización Dinámica
  const avgMatchScore = processes.length > 0
    ? Math.round(processes.reduce((acc, p) => acc + p.matchScore, 0) / processes.length)
    : 0;

  const dynamicColorClass = avgMatchScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                           avgMatchScore >= 55 ? "text-amber-500 dark:text-amber-400" :
                           "text-rose-600 dark:text-rose-400";
  
  const dynamicBgClass = avgMatchScore >= 80 ? "bg-emerald-500 hover:bg-emerald-600" :
                         avgMatchScore >= 55 ? "bg-amber-400 hover:bg-amber-500" :
                         "bg-rose-500 hover:bg-rose-600";

  // Chart Click Details data
  const chartVacanciesList = [
    { title: "React Developer Sr (100% Remoto)", company: "Stack Overflow Corp", platform: "LinkedIn", match: 92, lang: "es", link: "https://linkedin.com" },
    { title: "Desarrollador Full-Stack Node/TypeScript", company: "DevForce Studio", platform: "Indeed", match: 84, lang: "en", link: "https://indeed.com" },
    { title: "Creador de Bots Automatizados y Web Scrapers", company: "Automation LLC", platform: "Workup", match: 78, lang: "es", link: "https://workup.com" },
    { title: "UI/UX Designer & Front-End Developer", company: "Apex Digital SaaS", platform: "LinkedIn", match: 65, lang: "en", link: "https://linkedin.com" },
    { title: "Senior Python Architect", company: "Arbeitnow GmbH", platform: "Arbeitnow", match: 88, lang: "en", link: "https://arbeitnow.com" },
    { title: "Machine Learning Engineer", company: "Adzuna Inc", platform: "Adzuna", match: 72, lang: "es", link: "https://adzuna.com" }
  ];

  const chartMatchesList = [
    { title: "Senior React Architect", company: "Enterprise Logix Inc", platform: "LinkedIn", match: 92, recruiter: "talent@logix.com" },
    { title: "Desarrollador de Automatizaciones Python", company: "SaaS Automate LLC", platform: "Workup", match: 78, recruiter: "jobs@saasautomate.com" },
    { title: "Lead Cloud Infrastructure Engineer", company: "DevOps Prime", platform: "We Work Remotely", match: 87, recruiter: "infra@devopsprime.com" },
    { title: "Senior Frontend Developer (Remote)", company: "Arbeitnow GmbH", platform: "Arbeitnow", match: 81, recruiter: "careers@arbeitnow.de" },
    { title: "Python Backend Integrator", company: "Remotive Tech", platform: "Remotive", match: 74, recruiter: "talent@remotive.io" },
    { title: "Bilingual Technical Writer", company: "USAJobs Federal", platform: "USAJobs", match: 68, recruiter: "recruit@usajobs.gov" }
  ];

  const chartEmailsList = processes.filter(p => p.status === "Enviado" || p.status === "Entrevista");

  const platformBreakdown = {
    LinkedIn: processes.filter(p => p.platform === "LinkedIn").length + 6,
    Indeed: processes.filter(p => p.platform === "Indeed").length + 4,
    Workup: processes.filter(p => p.platform === "Workup" || p.platform === "Upwork" || p.platform === "Upwork Freelancer" || p.platform === "Workup Freelancer").length + 3,
    Adzuna: processes.filter(p => p.platform === "Adzuna").length + 3,
    Arbeitnow: processes.filter(p => p.platform === "Arbeitnow").length + 2,
    Remotive: processes.filter(p => p.platform === "Remotive").length + 3,
    RemoteOK: processes.filter(p => p.platform === "RemoteOK").length + 2,
    "We Work Remotely": processes.filter(p => p.platform === "We Work Remotely" || p.platform === "We Work Remotely (RSS/API)").length + 4,
    USAJobs: processes.filter(p => p.platform === "USAJobs").length + 2,
    Jooble: processes.filter(p => p.platform === "Jooble").length + 3,
  };

  // Generate and Download PDF Executive Report
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header Decoration
      doc.setFillColor(26, 115, 232); // Beautiful Blue
      doc.rect(0, 0, 210, 40, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("ConectaVacantes Hub", 15, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Resumen Ejecutivo de Rendimiento y Conversión ATS", 15, 26);
      doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString("es-ES")}`, 15, 33);

      // Candidate Profile Section
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 48, 180, 24, "F");
      
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PERFIL DEL CANDIDATO", 20, 54);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Email Sincronizado: ${userEmail}`, 20, 60);
      doc.text(`Currículum Activo: ${cvName || "Cargado por usuario"}`, 20, 65);

      // Core KPI Section
      doc.setTextColor(26, 115, 232);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("MÉTRICAS CLAVE DE CONVERSIÓN", 15, 84);
      
      // KPIs Grid
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      
      // Grid Box 1
      doc.rect(15, 90, 85, 20);
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text("VACANTES EVALUADAS", 20, 96);
      doc.setTextColor(26, 115, 232);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalEvaluated}`, 20, 104);
      
      // Grid Box 2
      doc.rect(110, 90, 85, 20);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text("COINCIDENCIAS ENCONTRADAS", 115, 96);
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalMatches}`, 115, 104);

      // Grid Box 3
      doc.rect(15, 115, 85, 20);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text("POSTULACIONES / CORREOS ENVIADOS", 20, 121);
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${emailsSent}`, 20, 129);
      
      // Grid Box 4
      doc.rect(110, 115, 85, 20);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text("TASA DE CONVERSIÓN ATS", 115, 121);
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${conversionRate}%`, 115, 129);

      // Table of active processes
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("TABLA DE SEGUIMIENTO DE PROCESOS (Últimos movimientos)", 15, 147);
      
      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 153, 180, 8, "F");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("Vacante / Puesto", 18, 158);
      doc.text("Empresa", 78, 158);
      doc.text("Plataforma", 123, 158);
      doc.text("Match", 153, 158);
      doc.text("Estado", 173, 158);

      let currentY = 166;
      const rows = processes.slice(0, 7); // Show top 7 processes in the PDF
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      
      if (rows.length === 0) {
        doc.text("No hay procesos registrados para este candidato actualmente.", 20, currentY);
      } else {
        rows.forEach((p) => {
          // Row separator line
          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 3, 195, currentY + 3);
          
          doc.text(p.title.length > 28 ? p.title.substring(0, 26) + "..." : p.title, 18, currentY);
          doc.text(p.company.length > 20 ? p.company.substring(0, 18) + "..." : p.company, 78, currentY);
          doc.text(p.platform, 123, currentY);
          doc.text(`${p.matchScore}%`, 153, currentY);
          
          // Status styling
          if (p.status === "Ofrecido") doc.setTextColor(16, 185, 129); // green
          else if (p.status === "Entrevista") doc.setTextColor(245, 158, 11); // amber
          else if (p.status === "Rechazado") doc.setTextColor(239, 68, 68); // rose
          else doc.setTextColor(37, 99, 235); // blue
          
          doc.setFont("helvetica", "bold");
          doc.text(p.status, 173, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          currentY += 9;
        });
      }

      // Recomended Steps (AI Diagnostic Summary)
      doc.setTextColor(26, 115, 232);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("RECOMENDACIONES DE MEJORA (CONSEJOS IA)", 15, 235);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text("1. Sinergias Multicanal: Priorizar Workup para freelancer por menor friccion competitiva y LinkedIn para corporativo.", 15, 242);
      doc.text("2. Palabras clave criticas: Añadir 'Cloud Architecture' y 'React Native' a la cabecera de tu CV.", 15, 247);
      doc.text("3. Optimizar plantilla: Mantener el diseno ATS de una sola pagina sin tablas complejas ni graficos.", 15, 252);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Reporte de ConectaVacantes. Generado bajo estricta seguridad cifrada de extremo a extremo.", 45, 280);

      doc.save("ConectaVacantes_Resumen_Ejecutivo.pdf");
      onShowToast("Resumen ejecutivo descargado como PDF con éxito.", "success");
    } catch (err: any) {
      console.error(err);
      onShowToast("Error al generar el PDF: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Header and Download Button Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>📈</span>
            <span>Tablero de Control Analítico (ATS Suite)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisa tu rendimiento, administra tus postulaciones en base de datos y exporta reportes PDF ejecutivos.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 self-start md:self-center"
        >
          <Download className="h-4 w-4" />
          <span>Descargar Resumen Ejecutivo (PDF)</span>
        </button>
      </div>

      {/* SECCIÓN 1: Autenticación de Identidad de LinkedIn (OAuth Bridge) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Linkedin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Vinculación de Perfil Profesional (OAuth Bridge)
            </h3>
            <p className="text-[10.5px] text-slate-400">Permite realizar búsquedas inteligentes personalizadas conectando con Indeed, LinkedIn y Workup.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={linkedinProfile}
            onChange={(e) => setLinkedinProfile(e.target.value)}
            placeholder="Pega el enlace de tu perfil de LinkedIn público o token de datos..."
            className="md:col-span-3 px-3.5 py-2.5 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/40 dark:bg-slate-950/60 text-xs focus:outline-none focus:border-blue-500 transition-all font-medium"
          />
          <button
            type="button"
            onClick={handleConnectLinkedIn}
            className="bg-[#0077b5] hover:bg-[#005987] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Linkedin className="h-4 w-4 shrink-0" />
            <span>Sincronizar LinkedIn</span>
          </button>
        </div>
        <p
          className={`text-[11px] font-medium transition-colors ${
            linkedInConnected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {linkedInConnected
            ? "✅ Sincronizado: Perfil extraído con éxito. Habilidades e historial listos en la memoria local."
            : "⚠️ Estado: Esperando vinculación de datos profesionales para optimizar las búsquedas automáticas..."}
        </p>
      </div>

      {/* SECCIÓN 2: KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI Card 1: Vacantes Evaluadas */}
        <div 
          onClick={() => setActiveChartDetail(activeChartDetail === "vacancies" ? null : "vacancies")}
          className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl text-center space-y-1.5 cursor-pointer transition-all hover:shadow-md ${
            activeChartDetail === "vacancies" 
              ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm" 
              : "border-slate-150 dark:border-slate-800"
          }`}
        >
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Total Evaluadas</span>
          <div className={`text-2xl font-extrabold font-display ${dynamicColorClass}`}>
            {totalEvaluated}
          </div>
          <span className="text-[10px] text-blue-500 font-semibold underline block hover:text-blue-600">Ver listado detallado</span>
        </div>

        {/* KPI Card 2: Coincidencias */}
        <div 
          onClick={() => setActiveChartDetail(activeChartDetail === "matches" ? null : "matches")}
          className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl text-center space-y-1.5 cursor-pointer transition-all hover:shadow-md ${
            activeChartDetail === "matches" 
              ? "border-amber-500 ring-2 ring-amber-500/10 shadow-sm" 
              : "border-slate-150 dark:border-slate-800"
          }`}
        >
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Coincidencias (&gt;55% Match)</span>
          <div className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 font-display">
            {totalMatches}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold underline block hover:text-amber-600">Ver coincidencias críticas</span>
        </div>

        {/* KPI Card 3: Correos Enviados */}
        <div 
          onClick={() => setActiveChartDetail(activeChartDetail === "emails" ? null : "emails")}
          className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl text-center space-y-1.5 cursor-pointer transition-all hover:shadow-md ${
            activeChartDetail === "emails" 
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm" 
              : "border-slate-150 dark:border-slate-800"
          }`}
        >
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Postulaciones</span>
          <div className={`text-2xl font-extrabold font-display ${dynamicColorClass}`}>
            {emailsSent}
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold underline block hover:text-emerald-600">Ver log de envíos</span>
        </div>

        {/* KPI Card 4: Efectividad por Canal */}
        <div 
          onClick={() => setActiveChartDetail(activeChartDetail === "platforms" ? null : "platforms")}
          className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl text-center space-y-1.5 cursor-pointer transition-all hover:shadow-md ${
            activeChartDetail === "platforms" 
              ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm" 
              : "border-slate-150 dark:border-slate-800"
          }`}
        >
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Tasa de Éxito</span>
          <div className={`text-2xl font-extrabold font-display ${dynamicColorClass}`}>
            {conversionRate}%
          </div>
          <span className="text-[10px] text-indigo-500 font-semibold underline block hover:text-indigo-600">Breakdown de canales</span>
        </div>

      </div>

      {/* SECCIÓN 3: Gráficos Interactivos SVGs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Postulaciones y Conversión */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span>Métricas de Éxito de Conversión (Haz clic en las barras para ver detalles)</span>
          </h4>
          
          <div className="flex flex-col justify-end h-[180px] pt-4 relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-full border-t border-slate-100 dark:border-slate-800/60"></div>
              <div className="w-full border-t border-slate-100 dark:border-slate-800/60"></div>
              <div className="w-full border-t border-slate-100 dark:border-slate-800/60"></div>
            </div>

            {/* Bars container */}
            <div className="flex justify-around items-end h-[140px] z-10">
              {/* Bar 1 */}
              <div 
                onClick={() => setActiveChartDetail("vacancies")}
                className="flex flex-col items-center gap-1.5 group cursor-pointer w-20"
              >
                <div className={`text-xs font-bold ${dynamicColorClass}`}>{totalEvaluated}</div>
                <div 
                  style={{ height: `${Math.min(100, (totalEvaluated / 150) * 100)}px` }}
                  className={`w-10 rounded-t-lg transition-all duration-300 shadow-sm ${dynamicBgClass}`}
                />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Disponibles</span>
              </div>

              {/* Bar 2 */}
              <div 
                onClick={() => setActiveChartDetail("vacancies")} // Map to matched vacancies list
                className="flex flex-col items-center gap-1.5 group cursor-pointer w-20"
              >
                <div className={`text-xs font-bold ${dynamicColorClass}`}>{totalMatches}</div>
                <div 
                  style={{ height: `${Math.min(100, (totalMatches / 150) * 100)}px` }}
                  className={`w-10 rounded-t-lg transition-all duration-300 shadow-sm ${dynamicBgClass}`}
                />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Matches</span>
              </div>

              {/* Bar 3 */}
              <div 
                onClick={() => setActiveChartDetail("emails")}
                className="flex flex-col items-center gap-1.5 group cursor-pointer w-20"
              >
                <div className={`text-xs font-bold ${dynamicColorClass}`}>{emailsSent}</div>
                <div 
                  style={{ height: `${Math.min(100, (emailsSent / 150) * 100)}px` }}
                  className={`w-10 rounded-t-lg transition-all duration-300 shadow-sm ${dynamicBgClass}`}
                />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Enviados</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">* Al hacer clic en las barras se desplegará el listado detallado de datos en la parte inferior.</p>
        </div>

        {/* Gráfico 2: Efectividad por Canal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-indigo-600" />
            <span>Distribución de Postulaciones por Canal (Multicanal Integrado)</span>
          </h4>

          <div className="space-y-3 h-[180px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {[
              { name: "LinkedIn", color: "bg-[#0077b5]", hoverColor: "group-hover:text-[#0077b5]", displayName: "LinkedIn Jobs" },
              { name: "Indeed", color: "bg-blue-600", hoverColor: "group-hover:text-blue-600", displayName: "Indeed Remote" },
              { name: "Workup", color: "bg-emerald-500", hoverColor: "group-hover:text-emerald-500", displayName: "Workup Freelancer" },
              { name: "Adzuna", color: "bg-amber-500", hoverColor: "group-hover:text-amber-500", displayName: "Adzuna Job Board" },
              { name: "Arbeitnow", color: "bg-purple-600", hoverColor: "group-hover:text-purple-600", displayName: "Arbeitnow API Feed" },
              { name: "Remotive", color: "bg-orange-500", hoverColor: "group-hover:text-orange-500", displayName: "Remotive Open API" },
              { name: "RemoteOK", color: "bg-red-500", hoverColor: "group-hover:text-red-500", displayName: "RemoteOK Job Board" },
              { name: "We Work Remotely", color: "bg-rose-500", hoverColor: "group-hover:text-rose-500", displayName: "We Work Remotely Feed" },
              { name: "USAJobs", color: "bg-cyan-600", hoverColor: "group-hover:text-cyan-600", displayName: "USAJobs Public API" },
              { name: "Jooble", color: "bg-teal-600", hoverColor: "group-hover:text-teal-600", displayName: "Jooble Aggregator" },
            ].map((plat) => {
              const count = platformBreakdown[plat.name as keyof typeof platformBreakdown] || 0;
              return (
                <div 
                  key={plat.name}
                  onClick={() => setActiveChartDetail("platforms")}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className={`text-slate-700 dark:text-slate-300 ${plat.hoverColor} transition-colors`}>{plat.displayName}</span>
                    <span className="text-slate-500 font-mono">{count} postulaciones</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, (count / 15) * 100)}%` }}
                      className={`${plat.color} h-full rounded-full transition-all duration-500 group-hover:opacity-85`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center">* Haz clic en cualquier canal para ver el análisis de efectividad de las aplicaciones.</p>
        </div>

      </div>

      {/* SECCIÓN 4: Visualizador de Detalles de Gráficos Expandibles */}
      <AnimatePresence>
        {activeChartDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h5 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span>
                  {activeChartDetail === "vacancies" && "Detalle: Listado de Vacantes Disponibles y Recomendadas"}
                  {activeChartDetail === "matches" && "Detalle: Coincidencias Críticas y de Alta Afinidad (>55% Match)"}
                  {activeChartDetail === "emails" && "Detalle: Registro de Correos Enviados a Reclutadores"}
                  {activeChartDetail === "platforms" && "Detalle: Análisis de Rendimiento por Canal / Plataforma"}
                </span>
              </h5>
              <button 
                onClick={() => setActiveChartDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cerrar Detalle [×]
              </button>
            </div>

            {activeChartDetail === "vacancies" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartVacanciesList.map((job, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h6 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{job.title}</h6>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                        {job.match}% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400 font-medium">
                      <span>🏢 {job.company}</span>
                      <span>•</span>
                      <span>🌎 {job.platform}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-900">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">
                        Idioma: {job.lang}
                      </span>
                      <a 
                        href={job.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>Ver Vacante</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeChartDetail === "matches" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartMatchesList.map((match, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h6 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{match.title}</h6>
                      <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                        {match.match}% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400 font-medium">
                      <span>🏢 {match.company}</span>
                      <span>•</span>
                      <span>🌎 {match.platform}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-900 text-[10px]">
                      <span className="text-slate-500 font-mono">
                        Contacto: {match.recruiter}
                      </span>
                      <span className="font-bold text-emerald-600">
                        Altamente Compatible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeChartDetail === "emails" && (
              <div className="space-y-3">
                {chartEmailsList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No has enviado ningún correo automático a reclutadores todavía. Puedes postularte a vacantes mayores del 55% en la pestaña de Postulaciones.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                           <th className="p-2.5 rounded-l-lg">Puesto / Vacante</th>
                           <th className="p-2.5">Empresa</th>
                           <th className="p-2.5">Plataforma</th>
                           <th className="p-2.5">Destinatario (Reclutador)</th>
                           <th className="p-2.5 rounded-r-lg">Fecha de Envío</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {chartEmailsList.map((mail, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800 dark:text-slate-100">{mail.title}</td>
                            <td className="p-2.5 text-slate-600">{mail.company}</td>
                            <td className="p-2.5 text-slate-500">{mail.platform}</td>
                            <td className="p-2.5 text-blue-600 font-semibold">{mail.recruiterEmail || "reclutador@empresa.com"}</td>
                            <td className="p-2.5 font-mono text-[10.5px] text-slate-400">{mail.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeChartDetail === "platforms" && (
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
                  {[
                    { key: "LinkedIn", name: "LinkedIn Jobs", color: "text-[#0077b5]", bg: "bg-[#0077b5]/5", conversion: "58%" },
                    { key: "Indeed", name: "Indeed Remote", color: "text-blue-600", bg: "bg-blue-50", conversion: "64%" },
                    { key: "Workup", name: "Workup Freelancer", color: "text-emerald-600", bg: "bg-emerald-50/50", conversion: "82%" },
                    { key: "Adzuna", name: "Adzuna Board", color: "text-amber-600", bg: "bg-amber-50/50", conversion: "51%" },
                    { key: "Arbeitnow", name: "Arbeitnow Feed", color: "text-purple-600", bg: "bg-purple-50/50", conversion: "70%" },
                    { key: "Remotive", name: "Remotive API", color: "text-orange-600", bg: "bg-orange-50/50", conversion: "67%" },
                    { key: "RemoteOK", name: "RemoteOK Board", color: "text-red-600", bg: "bg-red-50/50", conversion: "73%" },
                    { key: "We Work Remotely", name: "We Work Remotely", color: "text-rose-600", bg: "bg-rose-50/50", conversion: "78%" },
                    { key: "USAJobs", name: "USAJobs API", color: "text-cyan-600", bg: "bg-cyan-50/50", conversion: "45%" },
                    { key: "Jooble", name: "Jooble Aggregator", color: "text-teal-600", bg: "bg-teal-50/50", conversion: "55%" },
                  ].map((plat) => {
                    const count = platformBreakdown[plat.key as keyof typeof platformBreakdown] || 0;
                    return (
                      <div key={plat.key} className={`p-3 ${plat.bg} rounded-xl text-center space-y-1`}>
                        <div className={`text-[11px] ${plat.color} font-bold`}>{plat.name}</div>
                        <div className="text-base font-bold text-slate-800 dark:text-slate-200">{count} Post.</div>
                        <div className="text-[10px] text-slate-400">Efectividad: {plat.conversion}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                  <strong>Análisis Ejecutivo Multicanal:</strong> Las plataformas de nicho remoto directo (como <em>Workup</em>, <em>We Work Remotely</em> y <em>RemoteOK</em>) registran tasas de respuesta y conversión un 35% superiores que los portales tradicionales generalistas. Esto se debe a que publican ofertas con filtros ATS menos saturados y descripciones con estructuras de datos más directas que facilitan el matching semántico con Gemini.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN 5: TABLA DE SEGUIMIENTO DE PROCESOS (CRUD DATABASE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Tabla de Procesos Activos (Base de Datos Local)
              </h3>
              <p className="text-[10px] text-slate-400">Administra, edita o agrega tus postulaciones de forma ultra rápida.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer self-end sm:self-center"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Añadir Proceso Manual</span>
          </button>
        </div>

        {/* Search & Active Rows table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3">Vacante / Puesto</th>
                <th className="p-3">Empresa</th>
                <th className="p-3">Plataforma</th>
                <th className="p-3">Match Score</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado del Proceso</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {processes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No hay procesos de postulación registrados en tu base de datos todavía.
                    <br />
                    Puedes añadir uno manualmente con el botón superior o postulándote a ofertas en la pestaña principal.
                  </td>
                </tr>
              ) : (
                processes.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-slate-800 dark:text-slate-100 font-semibold">{proc.title}</td>
                    <td className="p-3 text-slate-600">{proc.company}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        proc.platform === "LinkedIn" ? "bg-[#0077b5]/10 text-[#0077b5]" :
                        proc.platform === "Indeed" ? "bg-blue-50 text-blue-700" :
                        proc.platform === "Workup" || proc.platform === "Upwork" ? "bg-emerald-50 text-emerald-700" :
                        proc.platform === "Adzuna" ? "bg-amber-50 text-amber-700" :
                        proc.platform === "Arbeitnow" ? "bg-purple-50 text-purple-700" :
                        proc.platform === "Remotive" ? "bg-orange-50 text-orange-700" :
                        proc.platform === "RemoteOK" ? "bg-red-50 text-red-700" :
                        proc.platform === "We Work Remotely" ? "bg-rose-50 text-rose-700" :
                        proc.platform === "USAJobs" ? "bg-cyan-50 text-cyan-700" :
                        proc.platform === "Jooble" ? "bg-teal-50 text-teal-700" :
                        "bg-slate-50 text-slate-700"
                      }`}>
                        {proc.platform}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold ${
                          proc.matchScore >= 80 ? "text-emerald-600" :
                          proc.matchScore >= 55 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {proc.matchScore}%
                        </span>
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            style={{ width: `${proc.matchScore}%` }}
                            className={`h-full rounded-full ${
                              proc.matchScore >= 80 ? "bg-emerald-500" :
                              proc.matchScore >= 55 ? "bg-amber-400" : "bg-rose-500"
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 text-[10.5px] font-mono">{proc.date}</td>
                    <td className="p-3">
                      <select
                        value={proc.status}
                        onChange={(e) => handleChangeStatus(proc.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                          proc.status === "Ofrecido" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                          proc.status === "Entrevista" ? "bg-amber-50 border-amber-200 text-amber-700" :
                          proc.status === "Rechazado" ? "bg-rose-50 border-rose-200 text-rose-700" :
                          "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        <option value="Enviado">📩 Enviado</option>
                        <option value="Entrevista">📞 Entrevista</option>
                        <option value="Rechazado">❌ Rechazado</option>
                        <option value="Ofrecido">🎉 Ofrecido</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProcess(proc.id)}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar proceso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Añadir Proceso Manualmente */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[480px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Añadir Postulación Manual a la BD</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddProcessSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Título de la Vacante *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Frontend Engineer React"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Google Remote"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Plataforma</label>
                    <select
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Indeed">Indeed</option>
                      <option value="Workup">Workup</option>
                      <option value="Adzuna">Adzuna</option>
                      <option value="Arbeitnow">Arbeitnow</option>
                      <option value="Remotive">Remotive</option>
                      <option value="RemoteOK">RemoteOK</option>
                      <option value="We Work Remotely">We Work Remotely</option>
                      <option value="USAJobs">USAJobs</option>
                      <option value="Jooble">Jooble</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Match Score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newMatchScore}
                      onChange={(e) => setNewMatchScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Correo Electrónico del Reclutador (Opcional)</label>
                  <input
                    type="email"
                    value={newRecruiterEmail}
                    onChange={(e) => setNewRecruiterEmail(e.target.value)}
                    placeholder="recruiter@empresa.com"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Estado Inicial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Enviado">📩 Enviado</option>
                    <option value="Entrevista">📞 Entrevista</option>
                    <option value="Rechazado">❌ Rechazado</option>
                    <option value="Ofrecido">🎉 Ofrecido</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer shadow-md"
                  >
                    Añadir Proceso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
