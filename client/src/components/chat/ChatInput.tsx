import React, { useRef, useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Send, CornerDownLeft, Sparkles, X, Wifi, ShieldAlert, KeyRound, Laptop } from "lucide-react";
import { cn } from "../../utils/cn";

interface ChatInputProps {
  disabled?: boolean;
  isSending?: boolean;
  onSend: (message: string) => Promise<void>;
  onSelectSuggestion?: (prompt: string) => void;
}

const QUICK_CHIPS = [
  { label: "Wi-Fi Issue", icon: Wifi, text: "My laptop keeps disconnecting from the campus Wi-Fi network." },
  { label: "VPN Failure", icon: ShieldAlert, text: "VPN client failed to authenticate with gateway error code 403." },
  { label: "Password Reset", icon: KeyRound, text: "I need to reset my corporate directory password." },
  { label: "App Crash", icon: Laptop, text: "The engineering suite crashed unexpectedly and won't restart." }
];

export function ChatInput({
  disabled,
  isSending,
  onSend
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = message.trim();
    if (!clean || disabled || isSending) return;

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSend(clean);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleApplyChip = (text: string) => {
    setMessage(text);
    setShowQuickPrompts(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const charCount = message.length;
  const isNearLimit = charCount > 3500;

  return (
    <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur-md p-3 sm:p-4">
      {/* Quick Prompts Drawer */}
      {showQuickPrompts && (
        <div className="mb-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-900">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Quick Troubleshooting Prompts
            </span>
            <button
              type="button"
              onClick={() => setShowQuickPrompts(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleApplyChip(chip.text)}
                  className="flex items-center gap-2 rounded-lg border border-teal-200/60 bg-white/80 p-2 text-left text-xs text-slate-700 hover:border-teal-400 hover:bg-white transition-all shadow-xs"
                >
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-700">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{chip.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{chip.text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Input Box */}
      <div
        className={cn(
          "relative rounded-2xl border bg-slate-50/60 shadow-xs transition-all duration-200",
          "focus-within:border-teal-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-teal-500/10",
          disabled && "opacity-60 bg-slate-100"
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder="Describe your technical issue, error message, or question..."
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-slate-800 placeholder-slate-400 outline-none max-h-36 overflow-y-auto"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                showQuickPrompts
                  ? "bg-teal-100 text-teal-800 font-semibold"
                  : "hover:bg-slate-200/60 hover:text-slate-700"
              )}
              title="Insert sample troubleshooting prompt"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Prompt library</span>
            </button>

            {message && (
              <button
                type="button"
                onClick={() => setMessage("")}
                className="rounded-lg p-1 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {isNearLimit && (
              <span className="text-[11px] text-amber-600 font-medium ml-1">
                {charCount} / 4000
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 select-none">
              <span>Shift+Enter for newline</span>
            </span>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={disabled || isSending || !message.trim()}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-200",
                message.trim() && !disabled && !isSending
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 active:scale-95 shadow-teal-600/25"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
