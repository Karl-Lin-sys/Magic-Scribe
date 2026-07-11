import React, { useState, useRef } from "react";
import { Sparkles, Loader2, FileText, Paperclip, X } from "lucide-react";

interface DraftModalProps {
  onGenerate: (text: string) => void;
}

export function DraftModal({ onGenerate }: DraftModalProps) {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{name: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    selectedFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFiles(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && files.length === 0) return;

    setIsLoading(true);
    try {
      // Combine prompt and file context
      let combinedPrompt = prompt;
      if (files.length > 0) {
        const fileContext = files.map(f => `--- FILE: ${f.name} ---\n${f.content}\n`).join("\n");
        combinedPrompt = `User Prompt: ${prompt}\n\nAttached Context:\n${fileContext}`;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: combinedPrompt }),
      });
      const data = await res.json();
      if (data.text) {
        onGenerate(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-center">
          <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Magic Draft</h2>
          <p className="text-indigo-100">Describe what you want to write, and AI will give you a head start.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <textarea
            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            placeholder="Write a blog post about the future of remote work..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />

          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm border border-indigo-100">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-indigo-400 hover:text-indigo-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".txt,.md,.csv"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
                <span className="text-sm font-medium">Attach files</span>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && files.length === 0)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
