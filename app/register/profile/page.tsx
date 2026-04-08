"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { updateProfile } from "@/app/actions/auth";
import { Heart, ArrowRight, ArrowLeft, Loader2, SkipForward, Check } from "lucide-react";

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
  smoking_habit?: string;
  alcohol_consumption?: string;
  physical_activity?: string;
  sleep_duration?: string;
  diet_type?: string;
  stress_level?: string;
  // Step 4: Medical Background
  existing_diseases?: string[];
  allergies?: string;
}

const STEPS = [
  { id: 1, title: "Health Profile", subtitle: "Basic health information" },
  { id: 2, title: "Body Metrics", subtitle: "Height, weight & BMI" },
  { id: 3, title: "Lifestyle", subtitle: "Daily habits & routines" },
  { id: 4, title: "Medical Background", subtitle: "Conditions & allergies" },
];

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = useCallback((data: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateProfile({
      ...formData,
      profile_completed: true,
      onboarding_step: totalSteps + 1,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/dashboard");
    }
  };

  const renderStep = () => {
    const stepProps = { formData, updateFormData };
    switch (currentStep) {
      case 1:
        return <StepHealthProfile {...stepProps} />;
      case 2:
        return <StepBodyMetrics {...stepProps} />;
      case 3:
        return <StepLifestyle {...stepProps} />;
      case 4:
        return <StepMedicalBackground {...stepProps} />;
      default:
        return null;
    }
  };

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
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-8">
        <Progress
          value={progress}
          className="h-2 rounded-full bg-teal-100/50"
        />

        {/* Step indicators */}
        <div className="mt-4 flex justify-between">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${
                step.id === currentStep
                  ? "text-teal-700"
                  : step.id < currentStep
                  ? "text-teal-500 cursor-pointer hover:text-teal-600"
                  : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                  step.id === currentStep
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
                    : step.id < currentStep
                    ? "bg-teal-100 text-teal-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="h-3 w-3" />
                ) : (
                  step.id
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        {/* Step header */}
        <div className="mb-8 animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {STEPS[currentStep - 1].title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {STEPS[currentStep - 1].subtitle}
            {currentStep > 1 && (
              <span className="ml-2 text-xs text-teal-600">
                (Optional — you can skip this)
              </span>
            )}
          </p>
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

        {/* Navigation buttons */}
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

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="gap-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </Button>
            )}

            {currentStep < totalSteps ? (
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
                disabled={isSubmitting}
                className="group gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Finish Setup
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
