"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Message, Conversation } from "@/types/chat";

function generateId(): string {
  return crypto.randomUUID();
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConversation?.messages || [];

  // Load conversations from server on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs: Conversation[] = data.map((row: { id: string; title: string; messages: Message[]; created_at: string; updated_at: string }) => ({
          id: row.id,
          title: row.title,
          messages: row.messages || [],
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
        }));
        setConversations(convs);
        if (convs.length > 0 && !activeId) {
          setActiveId(convs[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Save conversation to server (debounced)
  const saveConversation = useCallback((conversation: Conversation) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conversation),
        });
      } catch (e) {
        console.error("Failed to save conversation:", e);
      }
    }, 500);
  }, []);

  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    saveConversation(newConv);
    return newConv.id;
  }, [saveConversation]);

  const deleteConversation = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId((prev) => {
          const remaining = conversations.filter((c) => c.id !== id);
          return remaining[0]?.id || null;
        });
      }
      try {
        await fetch("/api/conversations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch (e) {
        console.error("Failed to delete conversation:", e);
      }
    },
    [activeId, conversations]
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
        setConversations((prev) => [newConv, ...prev]);
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
      const finalConvId = convId;
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === finalConvId) {
            const newMessages = [...c.messages, userMessage, assistantMessage];
            const updatedConv = {
              ...c,
              messages: newMessages,
              title: c.messages.length === 0
                ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
                : c.title,
              updatedAt: Date.now(),
            };
            return updatedConv;
          }
          return c;
        });
        return updated;
      });

      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Build message history for API
        const currentConv = conversations.find((c) => c.id === finalConvId);
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

                  setConversations((prev) => {
                    return prev.map((c) => {
                      if (c.id === finalConvId) {
                        const msgs = [...c.messages];
                        const lastMsg = msgs[msgs.length - 1];
                        if (lastMsg && lastMsg.role === "assistant") {
                          msgs[msgs.length - 1] = { ...lastMsg, content: fullContent };
                        }
                        return { ...c, messages: msgs, updatedAt: Date.now() };
                      }
                      return c;
                    });
                  });
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        // Save final state to database
        setConversations((prev) => {
          const conv = prev.find((c) => c.id === finalConvId);
          if (conv) saveConversation(conv);
          return prev;
        });

      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // User stopped generation - save what we have
          setConversations((prev) => {
            const conv = prev.find((c) => c.id === finalConvId);
            if (conv) saveConversation(conv);
            return prev;
          });
        } else {
          const errorMessage = error instanceof Error ? error.message : "An error occurred";
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id === finalConvId) {
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
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [activeId, conversations, saveConversation]
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
    isLoadingConversations,
    setActiveId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
  };
}
