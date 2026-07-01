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
        </div>
      </div>
    </header>
  );
}
