"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "openai:gpt@5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    description: "Frontier reasoning model for coding & professional tasks",
  },
  {
    id: "anthropic:claude@opus-4.7",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    description: "Advanced coding, agents & multimodal reasoning",
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm"
      >
        <span className="font-medium text-[var(--text-primary)]">{currentModel.name}</span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-color)] last:border-b-0 ${
                selectedModel === model.id ? "bg-[var(--bg-tertiary)]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-primary)] text-sm">{model.name}</span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                  {model.provider}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{model.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
