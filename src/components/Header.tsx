import { Briefcase, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3" id="brand-logo">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Conecta<span className="text-blue-600">Vacantes</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              ATS Keyword Optimizer & Tailored Application Draft Engine
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
          <span>Gemini 3.5 Flash Powered</span>
        </div>
      </div>
    </header>
  );
}