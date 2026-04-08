"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cigarette,
  Wine,
  Dumbbell,
  Moon,
  Salad,
  Brain,
} from "lucide-react";
import type { ProfileFormData } from "@/app/register/profile/page";

interface Props {
  formData: ProfileFormData;
  updateFormData: (data: Partial<ProfileFormData>) => void;
}

const lifestyleFields = [
  {
    key: "smoking" as const,
    label: "Smoking Habit",
    icon: Cigarette,
    options: [
      { value: "Non-smoker", label: "Non-smoker" },
      { value: "Occasional", label: "Occasional" },
      { value: "Regular", label: "Regular" },
    ],
  },
  {
    key: "alcohol" as const,
    label: "Alcohol Consumption",
    icon: Wine,
    options: [
      { value: "No", label: "No" },
      { value: "Occasionally", label: "Occasionally" },
      { value: "Frequently", label: "Frequently" },
    ],
  },
  {
    key: "physical_activity" as const,
    label: "Physical Activity Level",
    icon: Dumbbell,
    options: [
      { value: "Sedentary (no exercise)", label: "Sedentary (no exercise)" },
      { value: "Moderate (1–3 days/week)", label: "Moderate (1–3 days/week)" },
      { value: "Active (4+ days/week)", label: "Active (4+ days/week)" },
    ],
  },
  {
    key: "sleep_duration" as const,
    label: "Sleep Duration",
    icon: Moon,
    options: [
      { value: "Less than 5 hours", label: "Less than 5 hours" },
      { value: "5–7 hours", label: "5–7 hours" },
      { value: "7–9 hours", label: "7–9 hours" },
      { value: "More than 9 hours", label: "More than 9 hours" },
    ],
  },
  {
    key: "diet_type" as const,
    label: "Diet Type",
    icon: Salad,
    options: [
      { value: "Vegetarian", label: "Vegetarian" },
      { value: "Non-Vegetarian", label: "Non-Vegetarian" },
      { value: "Vegan", label: "Vegan" },
    ],
  },
];

const stressLevels = [
  { value: "Low", label: "Low", emoji: "😌", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { value: "Medium", label: "Medium", emoji: "😐", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "High", label: "High", emoji: "😰", color: "border-red-300 bg-red-50 text-red-700" },
];

export function StepLifestyle({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* Dropdown fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        {lifestyleFields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-3.5 w-3.5 text-teal-600" />
                {field.label}
              </Label>
              <Select
                value={formData[field.key] || ""}
                onValueChange={(value) =>
                  updateFormData({ [field.key]: value })
                }
              >
                <SelectTrigger className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Stress Level - special UI */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Brain className="h-3.5 w-3.5 text-teal-600" />
          Stress Level
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {stressLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => updateFormData({ stress_level: level.value })}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] ${formData.stress_level === level.value
                  ? `${level.color} shadow-md`
                  : "border-border bg-white hover:border-teal-200 hover:bg-teal-50/30"
                }`}
            >
              <span className="text-2xl">{level.emoji}</span>
              <span className="text-xs font-semibold">{level.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
