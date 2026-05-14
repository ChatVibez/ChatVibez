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
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm"
      >
        <span className="font-medium text-white">{currentModel.name}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 overflow-hidden">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                selectedModel === model.id ? "bg-gray-700/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">{model.name}</span>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                  {model.provider}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{model.description}</p>
              {selectedModel === model.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
