import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Briefcase, HelpCircle, DollarSign, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface CareerConsultantProps {
  cvText?: string;
  jobDescription?: string;
}

export default function CareerConsultant({ cvText, jobDescription }: CareerConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "¡Hola! Soy tu asesor de carrera de Gemini. Puedo ayudarte a refinar tus textos de postulación, simular preguntas de entrevista o darte consejos para negociar tu salario remoto en dólares o euros. ¿En qué te asesoro hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message to state
    const updatedMessages = [...messages, { role: "user" as const, text: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map messages history to format expected by backend (excluding the last user message we just sent, as backend handles it separately)
      const history = messages.map(msg => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        text: msg.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history,
          cvText,
          jobDescription
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al conectar con el consultor de IA.");
      }

      setMessages(prev => [...prev, { role: "model" as const, text: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Error al conectar con Gemini.");
      // Keep user input if failed
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-md overflow-hidden flex flex-col h-[640px] max-h-[85vh] md:max-h-none md:h-[680px] sticky top-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white p-4 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md relative overflow-hidden">
            <Bot className="h-5 w-5 text-blue-100" />
            <Sparkles className="h-3 w-3 text-amber-300 absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-tight flex items-center gap-1">
              Consultor de Carrera
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500 text-white font-bold rounded-full animate-pulse">
                GEMINI AI
              </span>
            </h3>
            <p className="text-[10.5px] text-blue-100 font-medium">Soporte Inteligente para Trabajo Remoto</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div 
        id="chat-box"
        className="flex-grow overflow-y-auto p-4 bg-slate-50/50 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600 border border-indigo-200"
                }`}>
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans shadow-xs whitespace-pre-line ${
                  isUser 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-white text-slate-500 border border-slate-100 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-1.5 shadow-xs">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span>Gemini está analizando tu caso...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts / shortcuts */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleQuickPrompt("¿Cómo puedo optimizar mi currículum para postulaciones en EE.UU.?")}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 px-2.5 rounded-lg border border-slate-100 transition-colors text-left flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Briefcase className="h-3 w-3 text-indigo-500" />
            <span>Optimizar CV para EE.UU.</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("¿Qué preguntas me pueden hacer para una vacante de Project Manager remoto?")}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 px-2.5 rounded-lg border border-slate-100 transition-colors text-left flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <HelpCircle className="h-3 w-3 text-emerald-500" />
            <span>Simular Entrevista</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("Dame consejos para negociar mi salario remoto en dólares.")}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 px-2.5 rounded-lg border border-slate-100 transition-colors text-left flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <DollarSign className="h-3 w-3 text-amber-500" />
            <span>Negociar Salario en USD</span>
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0 items-center">
        <input
          type="text"
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Pregúntale a Gemini o pídele cambios..."
          className="flex-grow text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-5/20 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
        />
        <button
          type="submit"
          id="btn-send-chat"
          disabled={!input.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 w-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
