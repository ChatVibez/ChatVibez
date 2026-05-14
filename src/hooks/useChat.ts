"use client";

import { useState, useCallback, useRef } from "react";
import { Message, Conversation } from "@/types/chat";

function generateId(): string {
  return crypto.randomUUID();
}

const STORAGE_KEY = "chatvibez_conversations";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(
    () => conversations[0]?.id || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConversation?.messages || [];

  const updateConversations = useCallback((updated: Conversation[]) => {
    // Sort by updatedAt descending
    const sorted = [...updated].sort((a, b) => b.updatedAt - a.updatedAt);
    setConversations(sorted);
    saveConversations(sorted);
  }, []);

  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateConversations([newConv, ...conversations]);
    setActiveId(newConv.id);
    return newConv.id;
  }, [conversations, updateConversations]);

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      updateConversations(updated);
      if (activeId === id) {
        setActiveId(updated[0]?.id || null);
      }
    },
    [conversations, activeId, updateConversations]
  );

  const sendMessage = useCallback(
    async (content: string, selectedModel?: string) => {
      let convId = activeId;

      // Create new conversation if none active
      if (!convId) {
        const newConv: Conversation = {
          id: generateId(),
          title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        convId = newConv.id;
        const updated = [newConv, ...conversations];
        updateConversations(updated);
        setActiveId(convId);
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: Date.now(),
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      // Add user message and empty assistant message
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === convId) {
            const newMessages = [...c.messages, userMessage, assistantMessage];
            return {
              ...c,
              messages: newMessages,
              title: c.messages.length === 0
                ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
                : c.title,
              updatedAt: Date.now(),
            };
          }
          return c;
        });
        saveConversations(updated);
        return updated;
      });

      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Build message history for API
        const currentConv = conversations.find((c) => c.id === convId);
        const apiMessages = [
          ...(currentConv?.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content },
        ];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, model: selectedModel }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const detail = errorData.details || errorData.error || `Status ${response.status}`;
          throw new Error(`API error: ${detail}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));

                if (json.errors) {
                  throw new Error(json.errors[0]?.message || "API Error");
                }

                const delta = json.choices?.[0]?.delta;
                const text = delta?.content || "";

                if (text) {
                  fullContent += text;

                  // Update the assistant message with streamed content
                  setConversations((prev) => {
                    const updated = prev.map((c) => {
                      if (c.id === convId) {
                        const msgs = [...c.messages];
                        const lastMsg = msgs[msgs.length - 1];
                        if (lastMsg && lastMsg.role === "assistant") {
                          msgs[msgs.length - 1] = { ...lastMsg, content: fullContent };
                        }
                        return { ...c, messages: msgs, updatedAt: Date.now() };
                      }
                      return c;
                    });
                    saveConversations(updated);
                    return updated;
                  });
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // User stopped generation - keep what we have
        } else {
          const errorMessage = error instanceof Error ? error.message : "An error occurred";
          // Update assistant message with error
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id === convId) {
                const msgs = [...c.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === "assistant") {
                  msgs[msgs.length - 1] = {
                    ...lastMsg,
                    content: `Error: ${errorMessage}. Please try again.`,
                  };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
              }
              return c;
            });
            saveConversations(updated);
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [activeId, conversations, updateConversations]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    conversations,
    activeId,
    messages,
    isLoading,
    setActiveId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
  };
}
