"use client";

import { User, Bot } from "lucide-react";
import { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 px-4 py-6 ${isUser ? "" : "bg-[var(--msg-assistant-bg)]"}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
          isUser ? "bg-blue-600" : "bg-emerald-600"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
          {isUser ? "You" : "ChatVibez AI"}
        </p>
        <div className="text-[var(--text-primary)] text-sm max-w-none break-words">
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !className;

                  if (isInline) {
                    return (
                      <code
                        className="bg-[var(--code-bg)] text-[var(--code-text)] px-1.5 py-0.5 rounded text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match ? match[1] : "text"}
                      PreTag="div"
                      customStyle={{
                        margin: "1rem 0",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-bold mb-2 mt-3">{children}</h3>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 underline"
                    >
                      {children}
                    </a>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-[var(--border-color)] pl-4 my-3 italic text-[var(--text-secondary)]">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="min-w-full border border-[var(--border-color)] rounded">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-tertiary)] text-left font-semibold">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-[var(--border-color)] px-3 py-2">{children}</td>
                  );
                },
                hr() {
                  return <hr className="border-[var(--border-color)] my-4" />;
                },
                strong({ children }) {
                  return <strong className="font-bold">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic">{children}</em>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
