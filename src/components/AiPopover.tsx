import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

interface AiPopoverProps {
  top: number;
  left: number;
  selectedText: string;
  fullText: string;
  onReplace: (newText: string) => void;
  onCancel: () => void;
}

export function AiPopover({ top, left, selectedText, fullText, onReplace, onCancel }: AiPopoverProps) {
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullText, selectedText, instruction }),
      });
      const data = await res.json();
      if (data.text) {
        onReplace(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed z-50 mt-8 -ml-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all"
      style={{ top, left }}
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 flex items-center space-x-2 border-b border-gray-100">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium text-gray-700">Ask AI to rewrite</span>
      </div>
      
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-3 truncate italic">
          "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
        </p>
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="E.g., Make this sound more professional..."
            className="flex-1 text-sm bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none text-gray-700 placeholder-gray-400"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !instruction.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
