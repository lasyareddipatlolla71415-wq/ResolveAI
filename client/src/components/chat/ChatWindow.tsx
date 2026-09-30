import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, Bot, CheckCircle2, ChevronRight, Cpu, KeyRound, Network, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import type { ChatMessageRecord } from "../../services/api";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  messages: ChatMessageRecord[];
  isSending?: boolean;
  hasConversation: boolean;
  userName?: string;
  onSendSuggestion?: (text: string) => void;
}

const STARTER_CARDS = [
  {
    title: "Wi-Fi & Connectivity",
    desc: "Device shows connected but no internet access",
    icon: Wifi,
    prompt: "My laptop is connected to the office Wi-Fi, but says 'No Internet, secured'. How can I diagnose and fix this?",
    badge: "Network"
  },
  {
    title: "VPN Gateway Error",
    desc: "Authentication timeout or handshake failure",
    icon: ShieldCheck,
    prompt: "Corporate VPN client is giving an error: 'Connection failed due to unreachable gateway'. What troubleshooting steps should I take?",
    badge: "Security"
  },
  {
    title: "Outlook / Email Sync",
    desc: "Repeated credential prompts or sync stall",
    icon: KeyRound,
    prompt: "Outlook keeps asking for my Microsoft 365 password in a loop and will not synchronize my inbox.",
    badge: "Applications"
  },
  {
    title: "Hardware / High CPU",
    desc: "System freezing, fan spinning, slow responsiveness",
    icon: Cpu,
    prompt: "My workstation fan is running at max speed and Task Manager shows 100% CPU usage by an unknown process.",
    badge: "Hardware"
  }
];

export function ChatWindow({
  messages,
  isSending,
  hasConversation,
  userName,
  onSendSuggestion
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on new messages or typing state change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isSending]);

  // Track if user scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 150);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Empty state hero
  if (!hasConversation || messages.length === 0) {
    return (
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-center items-center text-center"
      >
        <div className="max-w-2xl w-full my-auto py-6">
          {/* Glowing Orb */}
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-teal-400 opacity-25 blur-xl animate-pulse" />
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-slate-950 via-teal-900 to-cyan-500 text-white shadow-xl shadow-teal-500/20 border border-teal-400/30">
              <Sparkles className="h-8 w-8 text-teal-300" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How can ResolveAI help you today?
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Automated Level-1 IT diagnosis with intelligent troubleshooting runbooks. Ask any question or select a common runbook below to begin.
          </p>

          {/* Quick Start Suggestions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {STARTER_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onSendSuggestion?.(card.prompt)}
                  className="group relative flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-teal-500 hover:shadow-md hover:shadow-teal-500/5 transition-all text-left"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                        {card.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Features Tagline */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              Outcome-driven analysis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              Verified runbook retrieval
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              One-click human escalation
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active chat conversation view
  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} userName={userName} />
        ))}

        {isSending && <TypingIndicator />}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 flex items-center gap-1.5 rounded-full bg-slate-900/90 text-white px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur hover:bg-slate-900 transition-all animate-in fade-in zoom-in-90"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          <span>Latest messages</span>
        </button>
      )}
    </div>
  );
}
