"use client";

import { Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import { Conversation } from "@/types/chat";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 top-0 left-0 h-full w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-[var(--border-color)]">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors text-sm"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-[var(--text-faint)] text-sm text-center mt-8 px-4">
              No conversations yet. Start a new chat!
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                  activeId === conv.id
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare size={14} className="shrink-0 text-[var(--text-muted)]" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-faint)]">
            Powered by Runware
          </p>
          <ThemeToggle />
        </div>

        {/* Mobile close button */}
        <button
          onClick={onToggle}
          className="absolute top-3 right-3 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden"
        >
          <X size={20} />
        </button>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-30 p-2 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
