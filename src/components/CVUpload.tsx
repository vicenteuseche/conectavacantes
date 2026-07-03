import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, Trash2, FileCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CVFileState } from "../types";

interface CVUploadProps {
  onUpload: (file: CVFileState | null) => void;
  selectedFile: CVFileState | null;
}

export default function CVUpload({ onUpload, selectedFile }: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg(null);
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isText = file.type === "text/plain" || file.name.endsWith(".txt");

    if (!isPDF && !isText) {
      setErrorMsg("Formato de archivo no válido. Por favor, sube un CV en PDF o Texto (.txt).");
      return;
    }

    const reader = new FileReader();

    if (isPDF) {
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const len = bytes.byteLength;
        // Optimization for large PDF buffers to avoid stack overflow
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        onUpload({
          name: file.name,
          size: file.size,
          type: "application/pdf",
          base64Data: base64,
        });
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onUpload({
          name: file.name,
          size: file.size,
          type: "text/plain",
          textData: text,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="section bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <label className="font-display font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
          Upload Your Updated CV
        </label>
        <span className="text-xs text-slate-400">PDF or Text format</span>
      </div>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 flex items-center gap-2 overflow-hidden"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
          <span className="flex-1">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 font-bold text-sm ml-1 cursor-pointer">×</button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group ${
              isDragging
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/40"
            }`}
            id="cv-upload-dropzone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt"
              className="hidden"
            />
            <div className={`p-3 rounded-full mb-3 transition-colors duration-200 ${
              isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500"
            }`}>
              <Upload className="h-6 w-6" />
            </div>
            <p className="font-medium text-slate-700 text-sm mb-1 group-hover:text-blue-600 transition-colors duration-150">
              Drag & drop your file here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400">
              Supports standard resumes up to 10MB (.pdf, .txt)
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 flex items-center justify-between"
            id="uploaded-cv-panel"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0">
                {selectedFile.type === "application/pdf" ? (
                  <FileCheck className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate pr-2">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="capitalize font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                    {selectedFile.type.split("/")[1]}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 hidden sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5" />
                CV Loaded
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload(null);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200/60 hover:border-rose-100 bg-white transition-colors duration-150"
                title="Remove CV"
                id="btn-remove-cv"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
