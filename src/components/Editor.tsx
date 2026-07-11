import React, { useRef, useState, useEffect, useCallback } from "react";
import { Suggestion, SelectionRange } from "../types";
import { getCaretCoordinates } from "../utils";
import { AiPopover } from "./AiPopover";
import { Sparkles } from "lucide-react";

interface EditorProps {
  text: string;
  setText: (text: string) => void;
  suggestions: Suggestion[];
  onTriggerSuggestions: () => void;
}

export function Editor({ text, setText, suggestions, onTriggerSuggestions }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [showAiButton, setShowAiButton] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [aiButtonPos, setAiButtonPos] = useState({ top: 0, left: 0 });

  // Sync scrolling between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleSelection = () => {
    if (!textareaRef.current) return;
    
    // If popover is already open, don't mess with selection unless they click elsewhere
    if (showPopover) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end) {
      const selectedText = text.substring(start, end);
      // Ensure it's not just whitespace
      if (selectedText.trim().length > 0) {
        const coords = getCaretCoordinates(textareaRef.current, end);
        setSelection({ start, end, text: selectedText });
        setAiButtonPos({ top: coords.top, left: coords.left });
        setShowAiButton(true);
        return;
      }
    }
    
    setShowAiButton(false);
    setSelection(null);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If clicking inside the editor container, don't just close unless it's outside the popover.
      // Simplification: we'll handle outside clicks with a standard overlay or just checking bounds.
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReplace = (newText: string) => {
    if (!selection) return;
    const newDoc = text.substring(0, selection.start) + newText + text.substring(selection.end);
    setText(newDoc);
    setShowPopover(false);
    setShowAiButton(false);
    setSelection(null);
    
    // Schedule a new proactive suggestion check
    setTimeout(onTriggerSuggestions, 1000);
  };

  // Build highlighted text for backdrop
  const renderHighlights = () => {
    if (suggestions.length === 0) return text;

    let highlighted = text;
    // Simple replacement for highlights. In a real app, this needs careful offset mapping.
    // We'll wrap matched targets in a styled span.
    suggestions.forEach((s) => {
      // Escape for regex
      const safeTarget = s.targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(
        new RegExp(safeTarget, 'g'),
        `<mark class="bg-indigo-100 text-transparent rounded-sm cursor-help transition-colors" title="${s.suggestion}">${s.targetText}</mark>`
      );
    });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="relative flex-1 max-w-4xl mx-auto w-full h-full flex flex-col p-8 lg:p-12">
      <div className="relative flex-1 w-full text-lg lg:text-xl leading-relaxed text-gray-800 font-serif">
        {/* Backdrop for highlights */}
        <div 
          ref={backdropRef}
          className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-transparent"
          aria-hidden="true"
        >
          {renderHighlights()}
        </div>
        
        {/* Actual Editor */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none overflow-auto"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setShowAiButton(false);
            if (showPopover) setShowPopover(false);
          }}
          onScroll={handleScroll}
          onSelect={handleSelection}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          placeholder="Start writing..."
          spellCheck="false"
        />

        {/* AI Action Button (Floating) */}
        {showAiButton && !showPopover && (
          <button
            className="fixed z-40 bg-white border border-gray-200 shadow-lg rounded-full p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all transform hover:scale-105"
            style={{ top: aiButtonPos.top, left: aiButtonPos.left }}
            onClick={() => {
              setShowAiButton(false);
              setShowPopover(true);
            }}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}

        {/* AI Edit Popover */}
        {showPopover && selection && (
          <AiPopover
            top={aiButtonPos.top}
            left={aiButtonPos.left}
            selectedText={selection.text}
            fullText={text}
            onReplace={handleReplace}
            onCancel={() => {
              setShowPopover(false);
              setSelection(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
