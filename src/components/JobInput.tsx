import React from "react";
import { Link2, FileText, HelpCircle } from "lucide-react";

interface JobInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function JobInput({ value, onChange }: JobInputProps) {
  const isUrl = value.trim().startsWith("http://") || value.trim().startsWith("https://");

  return (
    <div className="section bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <label className="font-display font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
          Paste Job Vacancy URL or Text Requirements
        </label>
        
        {value.trim().length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border">
            {isUrl ? (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 border-blue-100 border px-1.5 py-0.5 rounded-md">
                <Link2 className="h-3.5 w-3.5" />
                Webpage Link
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 border-slate-100 border px-1.5 py-0.5 rounded-md">
                <FileText className="h-3.5 w-3.5" />
                Raw Text Mode
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          id="job-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the careers page URL (e.g. https://careers.google.com/jobs/results/...) or simply paste the full raw text requirements of the job vacancy here..."
          className="w-full min-h-[140px] p-4 text-slate-800 border border-slate-200 rounded-xl bg-slate-50/40 text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-slate-400"
        />
        
        {value.trim().length === 0 && (
          <div className="absolute bottom-3 right-3 text-slate-300 flex items-center gap-1 pointer-events-none text-xs hidden sm:flex">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Link or text accepted</span>
          </div>
        )}
      </div>

      {isUrl && (
        <p className="text-xs text-blue-600/90 mt-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/40 flex items-start gap-1.5">
          <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>URL Detected:</strong> ConectaVacantes will retrieve and parse the job requirements, company culture keywords, and role details directly from this link.
          </span>
        </p>
      )}
    </div>
  );
}
