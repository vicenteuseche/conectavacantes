import { useState } from "react";
import { Clipboard, Check, Sparkles, TrendingUp, ThumbsUp, AlertTriangle, FileText } from "lucide-react";
import { motion } from "motion/react";
import { GenerationResult } from "../types";

interface ResultPanelProps {
  result: GenerationResult;
  recruiterEmail?: string;
  format?: string;
  companyName?: string;
}

export default function ResultPanel({ result, recruiterEmail, format, companyName }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.generatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendGmail = () => {
    const toEmail = recruiterEmail || "";
    const isEn = result.detectedLanguage === "en";
    const subject = encodeURIComponent(
      format === "cover-letter" 
        ? (isEn ? `Professional Application - Cover Letter${companyName ? ` (${companyName})` : ""}` : `Postulación Profesional - Carta de Presentación${companyName ? ` (${companyName})` : ""}`)
        : (isEn ? `Recruitment Outreach - Collaboration Proposal` : `Contacto de Reclutamiento - Propuesta de Colaboración`)
    );
    const body = encodeURIComponent(result.generatedText);
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
  };

  // Determine score colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const isEn = result.detectedLanguage === "en";

  const t = {
    scanResults: isEn ? "ATS Keyword Scan Results" : "Resultados del Escaneo de Palabras Clave ATS",
    alignmentSummary: isEn ? "Profile Alignment Summary" : "Resumen de Alineación del Perfil",
    matchLevel: isEn ? "ATS Match Level" : "Nivel de Coincidencia ATS",
    excellent: isEn ? "Excellent Match" : "Coincidencia Excelente",
    good: isEn ? "Good Match" : "Coincidencia Buena",
    recommended: isEn ? "Optimizations Recommended" : "Se Recomiendan Optimizaciones",
    mechanism: isEn ? "✨ ATS Mechanism: Linked Keywords Detected in the Vacancy" : "✨ Mecanismo ATS: Palabras Clave Detectadas en la Vacante",
    badgeHelp: isEn 
      ? "* Green badges indicate strong matches found in your CV. Plain badges denote keywords to emphasize further."
      : "* Las insignias verdes indican coincidencias fuertes en tu CV. Las insignias simples indican palabras clave a destacar.",
    strengths: isEn ? "Key Match Strengths" : "Fortalezas de Coincidencia Clave",
    advice: isEn ? "ATS Optimization Advice" : "Consejos de Optimización ATS",
    documentTitle: isEn ? "📄 Customized Generated Document" : "📄 Documento Personalizado Generado",
    copy: isEn ? "Copy to Clipboard" : "Copiar al Portapapeles",
    copiedText: isEn ? "Copied successfully" : "Copiado con éxito",
    gmailBtn: isEn ? "✉️ Prepare Email in Gmail" : "✉️ Preparar Envío en mi Gmail"
  };

  // Circular progress math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.matchScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
      id="result-panel-container"
    >
      {/* Smart Language Detection Banner */}
      <div id="lang-detected-banner" className="transition-all duration-300">
        {isEn ? (
          <div className="p-4 rounded-2xl border bg-blue-50 text-blue-800 border-blue-100 font-semibold text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span>🌐 LANGUAGE DETECTED: ENGLISH (Everything has been generated in English to match the vacancy requirements)</span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border bg-emerald-50 text-emerald-800 border-emerald-100 font-semibold text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span>🌐 IDIOMA DETECTADO: ESPAÑOL (Todo se ha generado en español para coincidir con los requisitos de la vacante)</span>
          </div>
        )}
      </div>

      {/* ATS Optimizer Summary Dashboard */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-blue-600 font-mono tracking-wider uppercase flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 animate-bounce" />
              {t.scanResults}
            </span>
            <h2 className="font-display font-bold text-slate-900 text-lg sm:text-xl">
              {t.alignmentSummary}
            </h2>
          </div>
          
          {/* Match Score */}
          <div className="flex items-center space-x-3.5 bg-slate-50 border border-slate-100 p-2.5 rounded-xl self-start">
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-slate-200/60"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Foreground Circle */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className={`transition-all duration-1000 ease-out ${getScoreProgressColor(result.matchScore)}`}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-display font-bold text-slate-800">
                  {result.matchScore}
                </span>
                <span className="text-[9px] text-slate-400 block -mt-1">%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{t.matchLevel}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getScoreColor(result.matchScore)}`}>
                  {result.matchScore >= 80 ? t.excellent : result.matchScore >= 60 ? t.good : t.recommended}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic ATS Keywords Section */}
        {result.keywords && result.keywords.length > 0 && (
          <div className="space-y-3" id="ats-keywords-panel">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              {t.mechanism}
            </h3>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
              {result.keywords.map((kw, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    kw.matched
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 border-dashed"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${kw.matched ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span>{kw.keyword}</span>
                  {kw.matched && <Check className="h-3.5 w-3.5 text-emerald-500 ml-0.5" />}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {t.badgeHelp}
            </p>
          </div>
        )}

        {/* Strengths and Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              {t.strengths}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {result.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps / Advice */}
          <div className="bg-amber-50/20 border border-amber-100/50 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              {t.advice}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {result.gaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Generated Document */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="generated-document-panel">
        <div className="bg-slate-50/60 px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-slate-800 text-sm">
              {t.documentTitle}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                copied
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:bg-slate-100"
              }`}
              id="btn-copy"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{t.copiedText}</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t.copy}</span>
                </>
              )}
            </button>
            <button
              onClick={handleSendGmail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all duration-150 shadow-sm cursor-pointer"
              id="btn-send-gmail"
            >
              {t.gmailBtn}
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-slate-50/20">
          <pre className="text-slate-800 text-sm font-sans whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {result.generatedText}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
