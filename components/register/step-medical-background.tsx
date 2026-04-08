"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Stethoscope, AlertTriangle } from "lucide-react";
import type { ProfileFormData } from "@/app/register/profile/page";

interface Props {
  formData: ProfileFormData;
  updateFormData: (data: Partial<ProfileFormData>) => void;
}

const commonDiseases = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Thyroid Disorder",
  "Arthritis",
  "PCOD/PCOS",
  "Migraine",
  "Kidney Disease",
  "Liver Disease",
  "Depression/Anxiety",
  "None of the above",
];

export function StepMedicalBackground({ formData, updateFormData }: Props) {
  const selectedDiseases = formData.existing_diseases || [];

  const handleDiseaseToggle = (disease: string) => {
    if (disease === "None of the above") {
      updateFormData({
        existing_diseases: selectedDiseases.includes(disease) ? [] : [disease],
      });
      return;
    }

    const filtered = selectedDiseases.filter((d) => d !== "None of the above");
    const updated = filtered.includes(disease)
      ? filtered.filter((d) => d !== disease)
      : [...filtered, disease];

    updateFormData({ existing_diseases: updated });
  };

  return (
    <div className="space-y-8">
      {/* Existing Diseases */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
          Existing Conditions
        </Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Select any conditions you currently have or have been diagnosed with.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {commonDiseases.map((disease) => {
            const isChecked = selectedDiseases.includes(disease);
            const isNone = disease === "None of the above";
            return (
              <label
                key={disease}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition-all duration-200 hover:border-teal-200 ${
                  isChecked
                    ? isNone
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-teal-300 bg-teal-50/50"
                    : "border-border bg-white"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleDiseaseToggle(disease)}
                  className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <span className="text-xs font-medium leading-tight">
                  {disease}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <Label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-3.5 w-3.5 text-teal-600" />
          Allergies
        </Label>
        <Input
          id="allergies"
          type="text"
          placeholder="e.g. Penicillin, Peanuts, Dust (comma-separated)"
          value={formData.allergies || ""}
          onChange={(e) => updateFormData({ allergies: e.target.value })}
          className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
        />
        <p className="text-[11px] text-muted-foreground">
          List any known allergies, separated by commas
        </p>
      </div>
    </div>
  );
}
