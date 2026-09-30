import React, { useState } from "react";
import { Bot, Check, Copy, Sparkles, ThumbsDown, ThumbsUp, User } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessageRecord } from "../../services/api";
import { cn } from "../../utils/cn";

export function MessageBubble({
  message,
  userName = "You"
}: {
  message: ChatMessageRecord;
  userName?: string;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formattedTime = (() => {
    try {
      const date = new Date(message.createdAt);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  // Simple parser to render paragraphs, bold text, bullet points, and inline code blocks
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check for bullet lines
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
      const lineText = isBullet ? trimmed.replace(/^[•*-]\s*/, "") : line;

      // Replace bold **text** and code `cmd`
      const parts = lineText.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={pIdx}
              className={cn(
                "rounded px-1.5 py-0.5 text-[12px] font-mono",
                isUser ? "bg-white/20 text-cyan-200" : "bg-slate-100 text-teal-800 border border-slate-200"
              )}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", isUser ? "bg-cyan-300" : "bg-teal-500")} />
            <span className="flex-1">{parsedLine}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("group flex gap-3 px-2 py-1.5", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-slate-200 font-bold text-xs shadow-sm border border-slate-700">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 text-white shadow-md shadow-teal-500/20">
            <Sparkles className="h-4 w-4" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[78%]", isUser ? "items-end" : "items-start")}>
        {/* Header line: Name & Time */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-medium text-slate-600">
            {isUser ? userName : "ResolveAI L1 Assistant"}
          </span>
          {formattedTime ? <span>• {formattedTime}</span> : null}
        </div>

        {/* Message Bubble Card */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/50 selection:bg-teal-500 selection:text-white"
              : "rounded-tl-sm bg-white text-slate-800 border border-slate-200/90 shadow-slate-100/50 selection:bg-teal-100"
          )}
        >
          <div className="text-[13.5px] leading-relaxed break-words">
            {renderFormattedContent(message.content)}
          </div>
        </div>

        {/* Action Toolbar on hover */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md p-1 hover:bg-slate-200/70 hover:text-slate-700 text-[11px] transition-colors"
            title="Copy message"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>

          {!isUser && (
            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-1">
              <button
                type="button"
                onClick={() => setReaction(reaction === "up" ? null : "up")}
                className={cn(
                  "rounded-md p-1 hover:bg-slate-200/70 text-[11px] transition-colors",
                  reaction === "up" ? "text-teal-600 font-bold bg-teal-50" : "hover:text-slate-700"
                )}
                title="Helpful response"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setReaction(reaction === "down" ? null : "down")}
                className={cn(
                  "rounded-md p-1 hover:bg-slate-200/70 text-[11px] transition-colors",
                  reaction === "down" ? "text-rose-600 font-bold bg-rose-50" : "hover:text-slate-700"
                )}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
