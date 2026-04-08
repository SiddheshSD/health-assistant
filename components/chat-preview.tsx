"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bot, User, Sparkles } from "lucide-react";

const chatMessages = [
  {
    role: "user" as const,
    text: "I've been having a headache and mild fever for 2 days",
    delay: 0,
  },
  {
    role: "ai" as const,
    text: "Based on your symptoms, here are some possible insights:",
    delay: 400,
  },
  {
    role: "ai-analysis" as const,
    text: "",
    delay: 800,
  },
];

interface AnalysisItem {
  label: string;
  value: string;
  color: string;
}

const analysisItems: AnalysisItem[] = [
  { label: "Likelihood", value: "Common Cold / Viral", color: "text-teal-600" },
  { label: "Severity", value: "Mild", color: "text-emerald-600" },
  { label: "Suggestion", value: "Rest & hydration recommended", color: "text-sky-600" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
          style={{
            animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatPreview() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    chatMessages.forEach((msg, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages(index + 1);
          if (msg.role === "ai-analysis") {
            setTimeout(() => setShowAnalysis(true), 400);
          }
        }, 1200 + msg.delay * 2)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md animate-slide-in-right opacity-0"
      style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
    >
      {/* Glow behind card */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal-300/20 via-emerald-200/15 to-sky-200/20 blur-2xl" />

      <Card className="relative overflow-hidden rounded-2xl border-0 bg-white/70 shadow-xl shadow-teal-900/5 ring-1 ring-white/60 backdrop-blur-xl">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-teal-100/60 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">HealthAI Assistant</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400/50" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-3 p-5">
          {/* User message */}
          {visibleMessages >= 1 && (
            <div className="flex justify-end animate-fade-up" style={{ animationDuration: "0.5s" }}>
              <div className="flex max-w-[85%] items-start gap-2.5">
                <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-teal-500 to-teal-600 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-md shadow-teal-500/15">
                  {chatMessages[0].text}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <User className="h-3.5 w-3.5 text-teal-700" />
                </div>
              </div>
            </div>
          )}

          {/* AI response */}
          {visibleMessages >= 2 && (
            <div className="flex justify-start animate-fade-up" style={{ animationDuration: "0.5s" }}>
              <div className="flex max-w-[90%] items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Bot className="h-3.5 w-3.5 text-teal-700" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-teal-50/80 to-emerald-50/60 px-4 py-2.5 text-[13px] leading-relaxed text-foreground ring-1 ring-teal-100/50">
                  {chatMessages[1].text}
                </div>
              </div>
            </div>
          )}

          {/* Analysis card */}
          {visibleMessages >= 3 && (
            <div className="flex justify-start animate-fade-up" style={{ animationDuration: "0.5s" }}>
              <div className="ml-9 w-full">
                {!showAnalysis ? (
                  <div className="rounded-xl bg-teal-50/60 px-4 py-3 ring-1 ring-teal-100/40">
                    <TypingIndicator />
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-xl bg-gradient-to-br from-white/90 to-teal-50/40 p-3.5 ring-1 ring-teal-100/50 shadow-sm">
                    {analysisItems.map((item, idx) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between animate-fade-up opacity-0"
                        style={{
                          animationDelay: `${idx * 150}ms`,
                          animationDuration: "0.4s",
                          animationFillMode: "forwards",
                        }}
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.label}
                        </span>
                        <span className={`text-xs font-semibold ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input preview */}
        <div className="border-t border-teal-100/40 px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 ring-1 ring-border/50">
            <span className="text-xs text-muted-foreground">Ask about your symptoms...</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
