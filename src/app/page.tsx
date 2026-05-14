"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { useChat } from "@/hooks/useChat";
import { AVAILABLE_MODELS } from "@/components/ModelSelector";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const {
    conversations,
    activeId,
    messages,
    isLoading,
    setActiveId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
  } = useChat();

  const handleSend = (content: string) => {
    sendMessage(content, selectedModel);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
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
