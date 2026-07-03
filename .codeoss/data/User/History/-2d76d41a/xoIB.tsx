import React, { useState, useEffect } from "react";
import { Mail, Send, ChevronRight, User, Clock, CheckCircle, ExternalLink, Inbox, Search, Archive, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MailMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  tag: string;
  fullBody?: string;
}

export default function MailInbox({ userEmail, onShowToast }: { userEmail: string; onShowToast: any }) {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState("");

  useEffect(() => {
    const checkConnection = async () => {
      const connected = localStorage.getItem(`google_connected_${userEmail}`) === "true";
      setIsGoogleConnected(connected);
      if (connected) fetchEmails();
    };
    checkConnection();
  }, [userEmail]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mail/inbox?email=${userEmail}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      onShowToast("Error al sincronizar con Gmail", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    const res = await fetch("/api/auth/google/url");
    const { url } = await res.json();
    window.open(url, "google_auth", "width=600,height=600");
  };

  const handleGenerateAiReply = async (message: MailMessage) => {
    setGeneratingReply(message.id);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Redacta una respuesta profesional para este correo de un reclutador: "${message.preview}". El asunto es "${message.subject}". Mi nombre es Vicente.`,
        })
      });
      const data = await res.json();
      setAiReply(data.reply);
    } catch (err) {
      onShowToast("Error al generar respuesta", "error");
    } finally {
      setGeneratingReply(null);
    }
  };

  const handleOpenGmail = () => {
    window.open("https://mail.google.com/", "_blank");
    onShowToast("Redirigiendo a Gmail para gestionar tus envíos corporativos.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar de Carpetas */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <button
            onClick={handleOpenGmail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mb-4 shadow-md"
          >
            <Send className="h-4 w-4" />
            <span>Redactar en Gmail</span>
          </button>
          
          <nav className="space-y-1">
            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold cursor-pointer">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                <span>Bandeja de Entrada</span>
              </div>
              <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[10px]">2</span>
              {messages.filter(m => !m.isRead).length > 0 && (
                <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[10px]">{messages.filter(m => !m.isRead).length}</span>
              )}
            </div>
            <div className="flex items-center gap-2 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors">
              <Send className="h-4 w-4" />
              <span>Enviados (Sync)</span>
            </div>
            <div className="flex items-center gap-2 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors">
              <Archive className="h-4 w-4" />
              <span>Archivados</span>
            </div>
          </nav>
        </div>
      </div>

      {/* Listado de Mensajes */}
      <div className="lg:col-span-9 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Correos de Reclutadores Relacionados</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Sincronizado con {userEmail}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.5)" }}
                className={`p-4 cursor-pointer transition-colors flex items-start gap-4 ${!msg.isRead ? "bg-blue-50/20 dark:bg-blue-900/5" : ""}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!msg.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs ${!msg.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600"}`}>
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {msg.date}
                    </span>
                  </div>
                  <h4 className={`text-xs mb-1 truncate ${!msg.isRead ? "font-bold text-blue-600" : "text-slate-700 dark:text-slate-300"}`}>
                    {msg.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                    {msg.preview}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      msg.tag === "Entrevista" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                      msg.tag === "Seguimiento" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                      "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {msg.tag}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 self-center">
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="p-6 text-center bg-slate-50/30 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-600 dark:text-slate-400">
               <CheckCircle className="h-4 w-4 text-emerald-500" />
               <span>Protección Anti-Spam ATS Activa</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}