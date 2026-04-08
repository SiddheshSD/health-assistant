"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { StepHealthProfile } from "@/components/register/step-health-profile";
import { StepBodyMetrics } from "@/components/register/step-body-metrics";
import { StepLifestyle } from "@/components/register/step-lifestyle";
import { StepMedicalBackground } from "@/components/register/step-medical-background";

export interface ProfileFormData {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
  smoking?: string;
  alcohol?: string;
  physical_activity?: string;
  sleep_duration?: string;
  diet_type?: string;
  stress_level?: string;
  existing_diseases?: string[];
  allergies?: string;
}

const LS_KEY = "healthai_profile";
const LS_STEP_KEY = "healthai_profile_step";

const STEPS = [
  { id: 1, title: "Basic Health Profile", subtitle: "Age and gender for accurate predictions", emoji: "👤" },
  { id: 2, title: "Body Metrics", subtitle: "Height, weight & BMI calculation", emoji: "⚖️" },
  { id: 3, title: "Lifestyle Habits", subtitle: "Daily habits that affect your health", emoji: "🌿" },
  { id: 4, title: "Medical Background", subtitle: "Existing conditions and allergies", emoji: "🏥" },
];

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setFormData(JSON.parse(raw));

      const savedStep = parseInt(localStorage.getItem(LS_STEP_KEY) || "1");
      if (savedStep >= 1 && savedStep <= STEPS.length) setCurrentStep(savedStep);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFormData = useCallback((data: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // ── Save current data snapshot to localStorage ────────────────────────────
  function saveToLocal(data: ProfileFormData, step: number) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    localStorage.setItem(LS_STEP_KEY, String(step));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  const handleNext = () => {
    saveToLocal(formData, currentStep + 1);
    setCurrentStep((p) => p + 1);
  };

  const handlePrev = () => {
    setCurrentStep((p) => p - 1);
  };

  const handleFinish = () => {
    // Save complete profile + mark as done
    localStorage.setItem(LS_KEY, JSON.stringify(formData));
    localStorage.setItem("healthai_profile_complete", "true");
    localStorage.removeItem(LS_STEP_KEY);
    router.push("/dashboard");
  };

  const renderStep = () => {
    const props = { formData, updateFormData };
    switch (currentStep) {
      case 1: return <StepHealthProfile {...props} />;
      case 2: return <StepBodyMetrics   {...props} />;
      case 3: return <StepLifestyle     {...props} />;
      case 4: return <StepMedicalBackground {...props} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;
  const step = STEPS[currentStep - 1];

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-200/15 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 border-b border-border/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
              <Heart className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-foreground">
              Health<span className="text-teal-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Save indicator */}
            {savedFlash && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600 animate-fade-up">
                <HardDrive className="h-3 w-3" /> Saved locally
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-8">
        <Progress value={progress} className="h-2 rounded-full bg-teal-100/50" />

        {/* Step dots */}
        <div className="mt-4 flex justify-between">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => s.id < currentStep && setCurrentStep(s.id)}
              className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${s.id === currentStep
                  ? "text-teal-700"
                  : s.id < currentStep
                    ? "cursor-pointer text-teal-500 hover:text-teal-600"
                    : "text-muted-foreground/50"
                }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${s.id === currentStep
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
                    : s.id < currentStep
                      ? "bg-teal-100 text-teal-700"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {s.id < currentStep ? <Check className="h-3 w-3" /> : s.id}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        {/* Step header */}
        <div className="mb-8" style={{ animation: "fadeUp 0.3s ease both" }}>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-3xl">{step.emoji}</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {step.title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{step.subtitle}</p>
        </div>

        {/* Step content */}
        <div key={currentStep} className="flex-1">
          {renderStep()}
        </div>

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="group gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105"
            >
              Next
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="group gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105"
            >
              <Check className="h-4 w-4" />
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
