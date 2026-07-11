import React, { useState, useCallback, useRef } from "react";
import { Editor } from "./components/Editor";
import { SuggestionSidebar } from "./components/SuggestionSidebar";
import { DraftModal } from "./components/DraftModal";
import { Suggestion } from "./types";
import { Feather, RefreshCw } from "lucide-react";

export default function App() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(true);
  
  // Ref to store timeout ID for debouncing proactive suggestions
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProactiveSuggestions = useCallback(async (currentText: string) => {
    if (!currentText || currentText.trim().length < 50) {
      setSuggestions([]);
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const res = await fetch("/api/proactive-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullText: currentText }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Clear existing suggestions since the text changed, to avoid stale target text errors
    if (suggestions.length > 0) {
      // Basic check: if the targetText is no longer in the document, remove it
      setSuggestions(prev => prev.filter(s => newText.includes(s.targetText)));
    }

    // Debounce proactive suggestions
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchProactiveSuggestions(newText);
    }, 3000); // Wait 3 seconds of inactivity before suggesting
  };

  const handleApplySuggestion = (targetText: string, replacement: string) => {
    // Replace the first occurrence
    const newDoc = text.replace(targetText, replacement);
    setText(newDoc);
    setSuggestions(prev => prev.filter(s => s.targetText !== targetText));
    
    // Trigger a new check after a short delay
    setTimeout(() => fetchProactiveSuggestions(newDoc), 1000);
  };

  const handleDismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateDraft = (draftText: string) => {
    setText(draftText);
    setShowDraftModal(false);
    
    // Automatically trigger suggestions for the new draft
    setTimeout(() => fetchProactiveSuggestions(draftText), 1500);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Sidebar for document controls (minimalist) */}
      <div className="w-16 border-r border-gray-100 flex flex-col items-center py-6 bg-gray-50/30">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 shadow-sm">
          <Feather className="w-5 h-5" />
        </div>
        
        {isGeneratingSuggestions && (
          <div className="mt-auto mb-4 text-indigo-400 animate-spin" title="AI is thinking...">
            <RefreshCw className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Editor Surface */}
      <main className="flex-1 flex overflow-hidden">
        <Editor 
          text={text} 
          setText={handleTextChange} 
          suggestions={suggestions}
          onTriggerSuggestions={() => fetchProactiveSuggestions(text)}
        />
        
        {/* Proactive Suggestions Sidebar */}
        <SuggestionSidebar 
          suggestions={suggestions}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
        />
      </main>

      {/* Initial Draft Modal */}
      {showDraftModal && <DraftModal onGenerate={handleGenerateDraft} />}
    </div>
  );
}
