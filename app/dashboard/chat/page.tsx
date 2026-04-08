"use client";

import {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import Link from "next/link";
import {
    Heart, Send, Bot, User, Sparkles, ArrowLeft, Trash2,
    AlertCircle, Search, X, Plus, Microscope, ChevronDown,
    ChevronUp, CheckCircle2, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
type MessageRole = "user" | "assistant";

interface AnalysisResult {
    predicted_disease: string;
    confidence: number;
    top_predictions: { disease: string; confidence: number }[];
    matched_symptoms: string[];
    mapped_symptoms: { input: string; mapped_to: string }[];
    unknown_symptoms: string[];
    description: string;
    precautions: string[];
    suggestions: string;
}

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    analysisResult?: AnalysisResult;
    analysisSymptoms?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: number }) {
    const level =
        confidence >= 60 ? { label: "High", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" } :
            confidence >= 35 ? { label: "Moderate", cls: "bg-amber-100 text-amber-700 border-amber-200" } :
                { label: "Low", cls: "bg-red-100 text-red-700 border-red-200" };

    return (
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${level.cls}`}>
            Model Confidence · {level.label}
        </span>
    );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MDText({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div className="space-y-1.5 text-sm leading-relaxed">
            {lines.map((line, i) => {
                if (/^#{1,3} /.test(line))
                    return <p key={i} className="mt-3 font-bold text-base first:mt-0">{line.replace(/^#{1,3} /, "")}</p>;
                if (line.startsWith("**") && line.endsWith("**"))
                    return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
                if (/^\*\*(.+)\*\*: (.+)/.test(line)) {
                    const m = line.match(/^\*\*(.+)\*\*: (.+)/);
                    return <p key={i}><span className="font-semibold">{m![1]}:</span> {m![2]}</p>;
                }
                if (line.startsWith("- ") || line.startsWith("• "))
                    return (
                        <div key={i} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                            <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                        </div>
                    );
                if (line.trim() === "") return <div key={i} className="h-1" />;
                return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />;
            })}
        </div>
    );
}

// ── Analysis result card ──────────────────────────────────────────────────────
function AnalysisCard({
    result,
    symptoms,
}: {
    result: AnalysisResult;
    symptoms: string[];
}) {
    const [expanded, setExpanded] = useState(true);

    const confidenceColor =
        result.confidence >= 60 ? "text-emerald-600" :
            result.confidence >= 35 ? "text-amber-600" : "text-red-500";

    // Section parser for AI suggestions
    const sections = useMemo(() => {
        if (!result.suggestions) return [];
        return result.suggestions.split(/\n(?=#{1,2} |🔍|🤒|✅|❌|🛡️|🏥|💊|⚠️)/).filter(Boolean);
    }, [result.suggestions]);

    return (
        <div className="w-full max-w-[90%] space-y-3 text-sm">
            {/* ── Main prediction card ── */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-white/90 shadow-md backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                        <Microscope className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">🔬 Condition Detected</p>
                        <p className="text-lg font-bold text-foreground truncate">{result.predicted_disease}</p>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Confidence */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-2xl font-black ${confidenceColor}`}>{result.confidence.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">confidence</p>
                        </div>
                        <ConfidenceBadge confidence={result.confidence} />
                    </div>

                    {/* Confidence bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${result.confidence >= 60 ? "bg-emerald-500" :
                                    result.confidence >= 35 ? "bg-amber-500" : "bg-red-400"
                                }`}
                            style={{ width: `${result.confidence}%` }}
                        />
                    </div>

                    {/* Matched symptoms */}
                    {result.matched_symptoms.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                ✓ Exactly Matched (from dataset):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.matched_symptoms.map((s) => (
                                    <span
                                        key={s}
                                        className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                                    >
                                        <CheckCircle2 className="h-3 w-3" />
                                        {s.replace(/_/g, " ")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unknown symptoms */}
                    {result.unknown_symptoms && result.unknown_symptoms.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                ✗ Not Recognised (Excluded):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.unknown_symptoms.map((s: string) => (
                                    <span
                                        key={s}
                                        className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
                                    >
                                        <X className="h-3 w-3" />
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other possible conditions */}
                    {result.top_predictions.length > 1 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Other Possible Conditions:
                            </p>
                            <div className="space-y-1.5">
                                {result.top_predictions.slice(1, 5).map((p) => (
                                    <div key={p.disease} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">{p.disease}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-teal-300"
                                                    style={{ width: `${(p.confidence / result.confidence) * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-right text-xs text-muted-foreground">
                                                {p.confidence.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Suggestions card ── */}
            {result.suggestions && (
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-white/90 shadow-md backdrop-blur-sm">
                    {/* Suggestions header */}
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex w-full items-center justify-between border-b border-border/40 px-5 py-4 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🤖 AI Health Suggestions</p>
                                <p className="text-[10px] text-violet-600">Powered by LLaMA 3.3 70B via Groq</p>
                            </div>
                        </div>
                        {expanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>

                    {expanded && (
                        <div className="px-5 py-4">
                            {sections.length > 0 ? (
                                <MDText text={result.suggestions} />
                            ) : (
                                <p className="text-sm text-muted-foreground">{result.suggestions}</p>
                            )}

                            {/* Disclaimer */}
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                <p className="text-[11px] leading-relaxed text-amber-700">
                                    ⚠️ This information is AI-generated and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Typing dots ────────────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 px-1 py-0.5">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="inline-block h-2 w-2 rounded-full bg-teal-400"
                    style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                />
            ))}
        </div>
    );
}

// ── Symptom input panel ───────────────────────────────────────────────────────
const QUICK_SYMPTOMS = [
    "Headache", "Fever", "Nausea", "Fatigue", "Cough",
    "Vomiting", "Dizziness", "Joint Pain", "Chest Pain", "Breathlessness",
    "Abdominal Pain", "Back Pain", "Skin Rash", "Anxiety",
];

function SymptomPanel({
    onAnalyze,
    onClose,
    isAnalyzing,
}: {
    onAnalyze: (symptoms: string[]) => void;
    onClose: () => void;
    isAnalyzing: boolean;
}) {
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [knownSymptoms, setKnownSymptoms] = useState<string[]>([]);

    useEffect(() => {
        fetch("/api/analyze")
            .then((r) => r.json())
            .then((d) => setKnownSymptoms(d.symptoms || []))
            .catch(() => { });
    }, []);

    const addSymptom = (s: string) => {
        const clean = s.trim();
        if (clean && !symptoms.includes(clean)) setSymptoms((p) => [...p, clean]);
        setSearch("");
    };

    const removeSymptom = (s: string) => setSymptoms((p) => p.filter((x) => x !== s));

    const filtered = useMemo(
        () =>
            search.length > 1
                ? knownSymptoms.filter((s) =>
                    s.toLowerCase().includes(search.toLowerCase())
                ).slice(0, 8)
                : [],
        [search, knownSymptoms]
    );

    return (
        <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-teal-200/60 bg-white/95 shadow-xl backdrop-blur-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-teal-600" />
                    <p className="text-sm font-semibold text-foreground">Symptom Checker</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Search input */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Symptoms <span className="text-red-500">*</span>
                    </p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search known symptoms or type any + press Enter"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && search.trim()) addSymptom(search);
                            }}
                            className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-10 pr-20 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                        />
                        <button
                            onClick={() => search.trim() && addSymptom(search)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                            + Add
                        </button>
                    </div>

                    {/* Autocomplete dropdown */}
                    {filtered.length > 0 && (
                        <div className="mt-1 rounded-xl border border-border bg-white shadow-lg">
                            {filtered.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => addSymptom(s)}
                                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-teal-50 hover:text-teal-700 first:rounded-t-xl last:rounded-b-xl"
                                >
                                    {s.replace(/_/g, " ")}
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Press Enter or click + Add to add any symptom — even free-typed ones.
                    </p>
                </div>

                {/* Selected symptoms */}
                {symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {symptoms.map((s) => (
                            <span
                                key={s}
                                className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                            >
                                {s}
                                <button onClick={() => removeSymptom(s)} className="hover:text-teal-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Quick add */}
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Quick Add:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_SYMPTOMS.filter((s) => !symptoms.includes(s)).map((s) => (
                            <button
                                key={s}
                                onClick={() => addSymptom(s)}
                                className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all"
                            >
                                <Plus className="h-3 w-3" />
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analyze button */}
                <Button
                    onClick={() => symptoms.length > 0 && onAnalyze(symptoms)}
                    disabled={symptoms.length === 0 || isAnalyzing}
                    className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-teal-500/20 hover:brightness-105 disabled:opacity-50"
                >
                    {isAnalyzing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with ML + Groq AI…</>
                    ) : (
                        <><Microscope className="h-4 w-4" /> Analyze Symptoms</>
                    )}
                </Button>

                {symptoms.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground">Please add at least one symptom before analyzing.</p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Main chat page ────────────────────────────────────────────────────────────
const CHAT_SUGGESTIONS = [
    "What should I eat to lower blood pressure?",
    "How much water should I drink daily?",
    "I feel fatigued all the time",
    "What exercises help with stress?",
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hi! I'm HealthAI, your personal health assistant 🩺\n\nYou can:\n- **Chat** with me about any health topic\n- **Analyze Symptoms** using our ML model + Groq AI\n\nTap **🔬 Analyze Symptoms** below to get started, or just ask me anything!",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSymptomPanel, setShowSymptomPanel] = useState(false);
    const [profile, setProfile] = useState<Record<string, unknown>>({});
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("healthai_profile");
            if (raw) setProfile(JSON.parse(raw));
        } catch { }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isChatLoading, isAnalyzing, showSymptomPanel]);

    // ── Send chat message ────────────────────────────────────────────────────
    const sendChatMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isChatLoading) return;

            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: trimmed,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setInput("");
            setIsChatLoading(true);

            const history = messages
                .filter((m) => m.id !== "welcome" && !m.analysisResult)
                .map((m) => ({ role: m.role, content: m.content }));

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: trimmed, profile, history }),
                });
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `ai-${Date.now()}`,
                        role: "assistant",
                        content: data.response || data.error || "No response.",
                        timestamp: new Date(),
                    },
                ]);
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        role: "assistant",
                        content: "⚠️ Could not reach the HealthAI server. Make sure `python app.py` is running.",
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsChatLoading(false);
                inputRef.current?.focus();
            }
        },
        [isChatLoading, messages, profile]
    );

    // ── Run symptom analysis ─────────────────────────────────────────────────
    const runAnalysis = useCallback(
        async (symptoms: string[]) => {
            setShowSymptomPanel(false);
            setIsAnalyzing(true);

            // Show the symptom list as a user message
            const userMsg: Message = {
                id: `user-analysis-${Date.now()}`,
                role: "user",
                content: `🔬 Analyzing symptoms: ${symptoms.join(", ")}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);

            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symptoms, profile }),
                });
                const data = await res.json();

                if (data.error) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `err-${Date.now()}`,
                            role: "assistant",
                            content: `⚠️ Analysis error: ${data.error}`,
                            timestamp: new Date(),
                        },
                    ]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `analysis-${Date.now()}`,
                            role: "assistant",
                            content: "",
                            analysisResult: data as AnalysisResult,
                            analysisSymptoms: symptoms,
                            timestamp: new Date(),
                        },
                    ]);
                }
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        role: "assistant",
                        content: "⚠️ Could not reach the health server. Make sure `python app.py` is running.",
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsAnalyzing(false);
            }
        },
        [profile]
    );

    const clearChat = () => {
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content:
                    "Chat cleared! Ready to help again.\n\nTap **🔬 Analyze Symptoms** or ask me anything!",
                timestamp: new Date(),
            },
        ]);
        setShowSymptomPanel(false);
    };

    const profileKeys = Object.keys(profile).filter((k) => profile[k]);

    return (
        <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <header className="shrink-0 border-b border-border/50 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20">
                                <Sparkles className="h-4 w-4 text-white" />
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">HealthAI Assistant</p>
                                <p className="text-[11px] text-teal-600">ML + LLaMA 3.3 70B via Groq</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {profileKeys.length > 0 && (
                            <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700 sm:block">
                                🧬 Profile loaded
                            </span>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Heart className="h-4 w-4 text-teal-600" />
                            <span className="hidden text-sm font-bold sm:block">
                                Health<span className="text-teal-600">AI</span>
                            </span>
                        </div>
                        <button
                            onClick={clearChat}
                            title="Clear chat"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Messages ───────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${msg.role === "user"
                                        ? "bg-gradient-to-br from-teal-500 to-teal-600"
                                        : "bg-gradient-to-br from-emerald-100 to-teal-100"
                                    }`}
                            >
                                {msg.role === "user" ? (
                                    <User className="h-4 w-4 text-white" />
                                ) : (
                                    <Bot className="h-4 w-4 text-teal-700" />
                                )}
                            </div>

                            {/* Bubble or Analysis Card */}
                            {msg.analysisResult ? (
                                <AnalysisCard result={msg.analysisResult} symptoms={msg.analysisSymptoms ?? []} />
                            ) : (
                                <div
                                    className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === "user"
                                            ? "rounded-tr-md bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-teal-500/15"
                                            : "rounded-tl-md border border-border/40 bg-white/80 text-foreground backdrop-blur-sm"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <MDText text={msg.content} />
                                    )}
                                    <p className={`mt-1.5 text-[10px] ${msg.role === "user" ? "text-teal-100/70" : "text-muted-foreground/50"}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading states */}
                    {(isChatLoading || isAnalyzing) && (
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                                <Bot className="h-4 w-4 text-teal-700" />
                            </div>
                            <div className="rounded-2xl rounded-tl-md border border-border/40 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-2 text-xs text-teal-600">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Running ML model + Groq AI analysis…
                                    </div>
                                ) : (
                                    <TypingDots />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Suggestions (only at start) */}
                    {messages.length === 1 && !isChatLoading && !showSymptomPanel && (
                        <div className="pl-11">
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Quick questions</p>
                            <div className="flex flex-wrap gap-2">
                                {CHAT_SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => sendChatMessage(s)}
                                        className="rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-700 hover:border-teal-400 hover:bg-teal-100 active:scale-95 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* ── Symptom Panel (slides in above input) ─────────────────────────── */}
            {showSymptomPanel && (
                <SymptomPanel
                    onAnalyze={runAnalysis}
                    onClose={() => setShowSymptomPanel(false)}
                    isAnalyzing={isAnalyzing}
                />
            )}

            {/* ── Input bar ─────────────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-border/50 bg-white/80 px-4 py-4 backdrop-blur-xl">
                <div className="mx-auto max-w-4xl space-y-2">
                    {/* Analyze symptoms toggle */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowSymptomPanel((v) => !v)}
                            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${showSymptomPanel
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/25"
                                    : "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                                }`}
                        >
                            <Microscope className="h-3.5 w-3.5" />
                            🔬 Analyze Symptoms
                        </button>
                    </div>

                    {/* Chat input */}
                    <div className="flex items-end gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/10">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendChatMessage(input);
                                }
                            }}
                            placeholder="Ask about health topics, diet, lifestyle, medications…"
                            rows={1}
                            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                            style={{ maxHeight: "120px" }}
                            onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                            }}
                        />
                        <Button
                            onClick={() => sendChatMessage(input)}
                            disabled={!input.trim() || isChatLoading}
                            size="sm"
                            className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 p-0 shadow-md shadow-teal-500/25 hover:shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-40"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-muted-foreground/40" />
                        <p className="text-[10px] text-muted-foreground/40">
                            AI responses are informational only — not a medical diagnosis. Always consult a doctor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
