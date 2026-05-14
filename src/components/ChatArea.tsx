"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Message } from "@/types/chat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ModelSelector from "./ModelSelector";

interface ChatAreaProps {
  messages: Message[];
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ChatArea({ messages, onSend, onStop, isLoading, selectedModel, onModelChange }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with model selector */}
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 flex items-center justify-center md:justify-start">
        <ModelSelector selectedModel={selectedModel} onSelect={onModelChange} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">ChatVibez</h1>
            <p className="text-[var(--text-muted)] max-w-md">
              Powered by GPT-5.5 & Claude via Runware API. Ask me anything — I can help with code,
              writing, analysis, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
              {[
                "Explain quantum computing simply",
                "Write a Python web scraper",
                "Help me plan a trip to Japan",
                "Debug my React component",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="text-left px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-hover)] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} />
    </div>
  );
}
