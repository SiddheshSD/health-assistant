"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Info } from "lucide-react";
import type { ProfileFormData } from "@/app/register/profile/page";

interface Props {
  formData: ProfileFormData;
  updateFormData: (data: Partial<ProfileFormData>) => void;
}

export function StepHealthProfile({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-200/60 bg-teal-50/50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
        <p className="text-xs leading-relaxed text-teal-700">
          This information helps us provide more accurate health predictions and
          personalized recommendations.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            Age
          </Label>
          <Input
            id="age"
            type="number"
            min={1}
            max={150}
            placeholder="e.g. 25"
            value={formData.age || ""}
            onChange={(e) =>
              updateFormData({ age: parseInt(e.target.value) || undefined })
            }
            className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-3.5 w-3.5 text-teal-600" />
            Gender
          </Label>
          <Select
            value={formData.gender || ""}
            onValueChange={(value) => updateFormData({ gender: value })}
          >
            <SelectTrigger className="h-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Used for better prediction accuracy
          </p>
        </div>
      </div>
    </div>
  );
}
