import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Search, Sparkles, BarChart3, RefreshCw, AlertCircle, FileDown, Edit, Trash2, PlusCircle } from 'lucide-react';

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

interface ServerStats {
  totalSearches: number;
  averageMatchScore: number;
  applicationsGenerated: number;
  chatsInitiated: number;
}

interface DashboardAnalyticsProps {
  userEmail: string;
  cvName?: string;
  cvText?: string;
  onShowToast: (message: string, type: "success" | "error" | "warning") => void;
  processes: Process[];
  setProcesses: React.Dispatch<React.SetStateAction<Process[]>>;
}

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444'];

export default function DashboardAnalytics({ userEmail, processes, setProcesses, onShowToast }: DashboardAnalyticsProps) {
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    setStatsLoading(true);
    fetch("/api/stats")
      .then(res => {
        if (!res.ok) throw new Error("No se pudo conectar al servidor de métricas.");
        return res.json();
      })
      .then(data => {
        setServerStats(data);
        setStatsLoading(false);
      })
      .catch(err => setStatsError(err.message));
  }, []);

  const processStatusData = useMemo(() => {
    const counts = processes.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [processes]);

  const handleDeleteProcess = (id: string) => {
    const updated = processes.filter(p => p.id !== id);
    setProcesses(updated);
    localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
    onShowToast("Proceso eliminado del CRM.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Server Stats Row with Recharts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsLoading ? (
          <div className="lg:col-span-3 text-center p-4 text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" /> Cargando métricas del servidor...
          </div>
        ) : statsError ? (
          <div className="lg:col-span-3 text-center p-4 text-xs text-rose-500 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> {statsError}
          </div>
        ) : serverStats && (
          <>
            {/* Stat Card: Total Searches */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Búsquedas Totales</p>
                <p className="text-xl font-extrabold font-display text-slate-800 dark:text-slate-100">{serverStats.totalSearches}</p>
              </div>
            </div>

            {/* Stat Card: Average Match Score */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Match Score Promedio</p>
                <p className="text-xl font-extrabold font-display text-slate-800 dark:text-slate-100">{serverStats.averageMatchScore}%</p>
              </div>
            </div>

            {/* Stat Card: AI Interactions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interacciones con IA</p>
                <p className="text-xl font-extrabold font-display text-slate-800 dark:text-slate-100">
                  {serverStats.applicationsGenerated + serverStats.chatsInitiated}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CRM Charts and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Estado de Procesos</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={processStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                {processStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Match Score por Plataforma</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={processes} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="matchScore" name="Match Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Process Tracking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Postulaciones (CRM)</h4>
          <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500">
            <PlusCircle className="h-4 w-4" />
            <span>Añadir Proceso Manual</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="p-2.5 rounded-l-lg">Puesto</th>
                <th>Plataforma</th>
                <th>Match</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {processes.map(p => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                    {p.title}
                    <span className="block text-[10px] font-normal text-slate-400">{p.company}</span>
                  </td>
                  <td>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                      p.platform === "Workup" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {p.platform}
                    </span>
                  </td>
                  <td>
                    <span className={`font-bold ${p.matchScore > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {p.matchScore}%
                    </span>
                  </td>
                  <td>
                    <select
                      value={p.status}
                      className="bg-transparent border-none text-xs p-1 rounded focus:ring-0"
                      onChange={(e) => {
                        const newStatus = e.target.value as Process['status'];
                        const updated = processes.map(proc => proc.id === p.id ? { ...proc, status: newStatus } : proc);
                        setProcesses(updated);
                        localStorage.setItem(`cv_processes_${userEmail}`, JSON.stringify(updated));
                      }}
                    >
                      <option>Enviado</option>
                      <option>Entrevista</option>
                      <option>Rechazado</option>
                      <option>Ofrecido</option>
                    </select>
                  </td>
                  <td className="text-slate-400">{p.date}</td>
                  <td className="flex items-center gap-2 p-2.5">
                    <button className="text-slate-400 hover:text-blue-500"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteProcess(p.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}