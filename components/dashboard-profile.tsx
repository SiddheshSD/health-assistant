"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, User, Heart, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Profile {
    age?: number;
    gender?: string;
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

export function DashboardProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const router = useRouter();

    useEffect(() => {
        try {
            const raw = localStorage.getItem("healthai_profile");
            if (raw) setProfile(JSON.parse(raw));
        } catch {
            // ignore
        }
    }, []);

    const bmiColor =
        !profile?.bmi_category
            ? "text-foreground"
            : profile.bmi_category === "Normal"
                ? "text-emerald-600"
                : profile.bmi_category === "Underweight"
                    ? "text-sky-600"
                    : profile.bmi_category === "Overweight"
                        ? "text-amber-600"
                        : "text-red-600";

    return (
        <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Health summary */}
                <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Activity className="h-4 w-4 text-teal-600" />
                            Age / Gender
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-foreground">
                            {profile?.age ? `${profile.age} yrs` : "—"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {profile?.gender || "Not set"}
                        </p>
                    </CardContent>
                </Card>

                {/* BMI */}
                <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Heart className="h-4 w-4 text-rose-500" />
                            BMI
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-3xl font-bold ${bmiColor}`}>
                            {profile?.bmi ?? "—"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {profile?.bmi_category
                                ? `Category: ${profile.bmi_category}`
                                : "Add height & weight in your profile"}
                        </p>
                    </CardContent>
                </Card>

                {/* Lifestyle snapshot */}
                <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4 text-emerald-600" />
                            Lifestyle
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {profile?.smoking && (
                            <p className="text-xs text-muted-foreground">
                                🚬 Smoking: <span className="font-medium text-foreground">{profile.smoking}</span>
                            </p>
                        )}
                        {profile?.physical_activity && (
                            <p className="text-xs text-muted-foreground">
                                🏃 Activity: <span className="font-medium text-foreground">{profile.physical_activity}</span>
                            </p>
                        )}
                        {profile?.diet_type && (
                            <p className="text-xs text-muted-foreground">
                                🥗 Diet: <span className="font-medium text-foreground">{profile.diet_type}</span>
                            </p>
                        )}
                        {profile?.stress_level && (
                            <p className="text-xs text-muted-foreground">
                                🧠 Stress: <span className="font-medium text-foreground">{profile.stress_level}</span>
                            </p>
                        )}
                        {!profile && (
                            <p className="text-xs text-muted-foreground italic">No data yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit profile button */}
            <div className="mt-4 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        localStorage.removeItem("healthai_profile_complete");
                        router.push("/register/profile");
                    }}
                    className="gap-1.5 rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Health Profile
                </Button>
            </div>
        </>
    );
}
