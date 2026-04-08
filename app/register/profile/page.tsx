"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { updateProfile } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Cloud,
} from "lucide-react";

import { StepHealthProfile } from "@/components/register/step-health-profile";
import { StepBodyMetrics } from "@/components/register/step-body-metrics";
import { StepLifestyle } from "@/components/register/step-lifestyle";
import { StepMedicalBackground } from "@/components/register/step-medical-background";

export interface ProfileFormData {
  // Step 1: Health Profile
  age?: number;
  gender?: string;
  // Step 2: Body Metrics
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: string;
  // Step 3: Lifestyle
  smoking?: string;
  alcohol?: string;
  physical_activity?: string;
  sleep_duration?: string;
  diet_type?: string;
  stress_level?: string;
  // Step 4: Medical Background
  existing_diseases?: string[];
  allergies?: string;
}

const STEPS = [
  {
    id: 1,
    title: "Basic Health Profile",
    subtitle: "Age and gender for accurate predictions",
    emoji: "👤",
  },
  {
    id: 2,
    title: "Body Metrics",
    subtitle: "Height, weight & BMI calculation",
    emoji: "⚖️",
  },
  {
    id: 3,
    title: "Lifestyle Habits",
    subtitle: "Daily habits that affect your health",
    emoji: "🌿",
  },
  {
    id: 4,
    title: "Medical Background",
    subtitle: "Existing conditions and allergies",
    emoji: "🏥",
  },
];

// Map step number → fields saved at that step
const STEP_FIELDS: Record<number, (keyof ProfileFormData)[]> = {
  1: ["age", "gender"],
  2: ["height_cm", "weight_kg", "bmi", "bmi_category"],
  3: ["smoking", "alcohol", "physical_activity", "sleep_duration", "diet_type", "stress_level"],
  4: ["existing_diseases", "allergies"],
};

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Pre-load existing Supabase data on mount ─────────────────────────────
  useEffect(() => {
    async function loadExistingProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("age, gender, height_cm, weight_kg, bmi, bmi_category, smoking, alcohol, physical_activity, sleep_duration, diet_type, stress_level, existing_diseases, allergies, onboarding_step")
          .eq("id", user.id)
          .single();

        if (profile) {
          // Restore previously saved data
          setFormData({
            age: profile.age ?? undefined,
            gender: profile.gender ?? undefined,
            height_cm: profile.height_cm ?? undefined,
            weight_kg: profile.weight_kg ?? undefined,
            bmi: profile.bmi ?? undefined,
            bmi_category: profile.bmi_category ?? undefined,
            smoking: profile.smoking ?? undefined,
            alcohol: profile.alcohol ?? undefined,
            physical_activity: profile.physical_activity ?? undefined,
            sleep_duration: profile.sleep_duration ?? undefined,
            diet_type: profile.diet_type ?? undefined,
            stress_level: profile.stress_level ?? undefined,
            existing_diseases: profile.existing_diseases ?? undefined,
            allergies: profile.allergies ?? undefined,
          });
          // Resume from where they left off
          if (profile.onboarding_step && profile.onboarding_step > 1 && profile.onboarding_step <= STEPS.length) {
            setCurrentStep(profile.onboarding_step);
          }
        }
      } catch (e) {
        console.warn("Could not load existing profile:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadExistingProfile();
  }, [router]);

  const updateFormData = useCallback((data: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // ── Save current step's fields to Supabase ───────────────────────────────
  async function saveStepToSupabase(step: number, data: ProfileFormData) {
    setIsSaving(true);
    setSaveStatus("idle");

    // Pick only the fields for this step
    const fields = STEP_FIELDS[step] ?? [];
    const payload: Record<string, unknown> = { onboarding_step: step + 1 };
    for (const field of fields) {
      if (data[field] !== undefined) {
        payload[field] = data[field];
      }
    }

    const result = await updateProfile(payload);
    setIsSaving(false);

    if (result?.error) {
      setSaveStatus("error");
      setError(result.error);
      return false;
    }

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
    return true;
  }

  const handleNext = async () => {
    setError(null);
    const ok = await saveStepToSupabase(currentStep, formData);
    if (ok) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    setError(null);
    setIsSaving(true);

    // Save final step + mark profile complete
    const fields = STEP_FIELDS[currentStep] ?? [];
    const payload: Record<string, unknown> = {
      onboarding_step: STEPS.length + 1,
      profile_completed: true,
    };
    for (const field of fields) {
      if (formData[field] !== undefined) {
        payload[field] = formData[field];
      }
    }

    const result = await updateProfile(payload);
    setIsSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  const renderStep = () => {
    const stepProps = { formData, updateFormData };
    switch (currentStep) {
      case 1: return <StepHealthProfile {...stepProps} />;
      case 2: return <StepBodyMetrics   {...stepProps} />;
      case 3: return <StepLifestyle     {...stepProps} />;
      case 4: return <StepMedicalBackground {...stepProps} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;
  const step = STEPS[currentStep - 1];

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Decorative blobs */}
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

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600">
                <Cloud className="h-3 w-3" /> Saved to Supabase
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-8">
        <Progress value={progress} className="h-2 rounded-full bg-teal-100/50" />

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
        <div className="mb-8 animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-3xl">{step.emoji}</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {step.title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{step.subtitle}</p>
          {currentStep > 1 && (
            <p className="mt-1 text-xs text-teal-600">
              ✨ Your data is automatically saved to Supabase as you go
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step content */}
        <div
          key={currentStep}
          className="flex-1 animate-fade-up"
          style={{ animationFillMode: "forwards" }}
        >
          {renderStep()}
        </div>

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSaving}
            className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="group gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <>Next <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" /></>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSaving}
              className="group gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving to Supabase…</>
              ) : (
                <><Check className="h-4 w-4" /> Finish Setup</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
