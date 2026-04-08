"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ruler, Weight, Activity } from "lucide-react";
import type { ProfileFormData } from "@/app/register/profile/page";

interface Props {
  formData: ProfileFormData;
  updateFormData: (data: Partial<ProfileFormData>) => void;
}

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getBMICategory(bmi: number): { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-sky-700 bg-sky-50 border-sky-200", variant: "outline" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-700 bg-emerald-50 border-emerald-200", variant: "outline" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-700 bg-amber-50 border-amber-200", variant: "outline" };
  return { label: "Obese", color: "text-red-700 bg-red-50 border-red-200", variant: "outline" };
}

function getBMICategoryKey(bmi: number): string {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function StepBodyMetrics({ formData, updateFormData }: Props) {
  const bmi =
    formData.height_cm && formData.weight_kg
      ? calculateBMI(formData.height_cm, formData.weight_kg)
      : null;

  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  useEffect(() => {
    if (bmi) {
      updateFormData({ bmi, bmi_category: getBMICategoryKey(bmi) });
    }
  }, [bmi]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2 text-sm font-medium">
            <Ruler className="h-3.5 w-3.5 text-teal-600" />
            Height (cm)
          </Label>
          <Input
            id="height"
            type="number"
            min={50}
            max={300}
            step={0.1}
            placeholder="e.g. 170"
            value={formData.height_cm || ""}
            onChange={(e) =>
              updateFormData({
                height_cm: parseFloat(e.target.value) || undefined,
              })
            }
            className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="flex items-center gap-2 text-sm font-medium">
            <Weight className="h-3.5 w-3.5 text-teal-600" />
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            min={10}
            max={500}
            step={0.1}
            placeholder="e.g. 65"
            value={formData.weight_kg || ""}
            onChange={(e) =>
              updateFormData({
                weight_kg: parseFloat(e.target.value) || undefined,
              })
            }
            className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
        </div>
      </div>

      {/* BMI Display */}
      {bmi && bmiInfo && (
        <div className="animate-fade-up rounded-xl border border-border/60 bg-white/80 p-5 shadow-sm" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <Activity className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Body Mass Index (BMI)
                </p>
                <p className="text-2xl font-bold text-foreground">{bmi}</p>
              </div>
            </div>
            <Badge
              variant={bmiInfo.variant}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${bmiInfo.color}`}
            >
              {bmiInfo.label}
            </Badge>
          </div>

          {/* BMI Scale */}
          <div className="mt-4">
            <div className="flex h-2 overflow-hidden rounded-full">
              <div className="flex-1 bg-sky-300" />
              <div className="flex-1 bg-emerald-400" />
              <div className="flex-1 bg-amber-400" />
              <div className="flex-1 bg-red-400" />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>Underweight</span>
              <span>Normal</span>
              <span>Overweight</span>
              <span>Obese</span>
            </div>
            {/* BMI Marker */}
            <div className="relative mt-1">
              <div
                className="absolute -top-4 h-3 w-0.5 bg-foreground rounded-full transition-all duration-500"
                style={{
                  left: `${Math.min(Math.max(((bmi - 15) / 30) * 100, 2), 98)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
