import React from "react";
import { Suggestion } from "../types";
import { Sparkles, Check, X } from "lucide-react";

interface SuggestionSidebarProps {
  suggestions: Suggestion[];
  onApply: (target: string, replacement: string) => void;
  onDismiss: (index: number) => void;
}

export function SuggestionSidebar({ suggestions, onApply, onDismiss }: SuggestionSidebarProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="w-80 border-l border-gray-100 bg-gray-50/50 p-6 overflow-y-auto hidden lg:block h-full">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-800">AI Suggestions</h3>
      </div>
      
      <div className="space-y-4">
        {suggestions.map((s, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm font-medium text-gray-800 mb-1">{s.reason}</p>
            
            <div className="mt-3 bg-red-50 text-red-700 text-sm p-2 rounded-lg line-through opacity-70">
              {s.targetText}
            </div>
            <div className="mt-1 bg-green-50 text-green-700 text-sm p-2 rounded-lg">
              {s.suggestion}
            </div>
            
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => onDismiss(idx)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => onApply(s.targetText, s.suggestion)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
