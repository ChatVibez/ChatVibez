"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] focus-within:border-[var(--border-hover)] px-4 py-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-faint)] resize-none outline-none text-sm max-h-[200px]"
          />
          {isLoading ? (
            <button
              onClick={onStop}
              className="shrink-0 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Stop generating"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              className="shrink-0 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-faint)] mt-2 text-center">
          ChatVibez uses GPT-5.5 & Claude via Runware. AI can make mistakes.
        </p>
      </div>
    </div>
  );
}
