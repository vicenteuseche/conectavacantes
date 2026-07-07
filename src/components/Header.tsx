import { Briefcase } from "lucide-react";

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export default function Header({ userEmail, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3" id="brand-logo">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
            Conecta<span className="text-blue-600">Vacantes</span>
          </h1>
        </div>
        
        {userEmail && onLogout && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs">
            <span>{userEmail}</span>
            <button
              onClick={onLogout}
              className="p-1 hover:text-rose-600 transition-colors"
              title="Cerrar sesión"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}