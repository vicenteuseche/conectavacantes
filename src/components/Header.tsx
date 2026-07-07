<<<<<<< HEAD
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
=======
import React from "react";
import { User, Settings, LogOut, Sliders } from "lucide-react";

interface HeaderProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  isLoggedIn: boolean;
  userEmail: string;
  onLogout: () => void;
  onEditProfile: () => void;
}

export default function Header({
  currentTheme,
  onThemeChange,
  isLoggedIn,
  userEmail,
  onLogout,
  onEditProfile,
}: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-50 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side: Clean Logo */}
        <div className="flex items-center space-x-2" id="brand-logo">
          <span className="text-lg font-bold tracking-tight text-[#2557a7]" style={{ fontFamily: '"Inter", sans-serif' }}>
            ConectaVacantes Hub
          </span>
        </div>

        {/* Right Side: Session Indicator & Controls */}
        <div className="flex items-center space-x-4">
          {isLoggedIn && (
            <div className="flex items-center space-x-3 text-xs text-neutral-600 font-medium" id="session-wrapper">
              {/* User Email Indicator */}
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-50 border border-neutral-200/80 rounded-md text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>👤 {userEmail}</span>
              </span>

              {/* Edit Profile Button */}
              <button
                type="button"
                onClick={onEditProfile}
                id="btn-edit-profile-header"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2557a7]/5 hover:bg-[#2557a7]/10 text-[#2557a7] border border-[#2557a7]/20 hover:border-[#2557a7]/40 rounded-md font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Editar Perfil</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          )}
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
        </div>
      </div>
    </header>
  );
}
