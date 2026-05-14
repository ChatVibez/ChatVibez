"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import LoginGate from "@/components/LoginGate";
import { useChat } from "@/hooks/useChat";
import { AVAILABLE_MODELS } from "@/components/ModelSelector";

export default function Home() {
  return (
    <LoginGate>
      <ChatApp />
    </LoginGate>
  );
}

function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const {
    conversations,
    activeId,
    messages,
    isLoading,
    isLoadingConversations,
    setActiveId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
  } = useChat();

  const handleSend = (content: string) => {
    sendMessage(content, selectedModel);
  };

  if (isLoadingConversations) {
    return (
      <div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNew={() => {
          createConversation();
          setSidebarOpen(false);
        }}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea
          messages={messages}
          onSend={handleSend}
          onStop={stopGeneration}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </main>
    </div>
  );
}
