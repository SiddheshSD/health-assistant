import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart, LogOut, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
              <Heart className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-foreground">
              Health<span className="text-teal-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                <User className="h-4 w-4 text-teal-700" />
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {profile?.full_name || user.email}
              </span>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your personal health dashboard
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4 text-teal-600" />
                Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">
                {profile?.profile_completed ? "85" : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile?.profile_completed
                  ? "Based on your profile data"
                  : "Complete your profile to see your score"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4 text-emerald-600" />
                Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground">
                {profile?.profile_completed ? "Complete ✓" : "Incomplete"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile?.profile_completed
                  ? "All health data provided"
                  : "Fill in your health details for better insights"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Heart className="h-4 w-4 text-rose-500" />
                BMI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {profile?.bmi || "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile?.bmi_category
                  ? `Category: ${profile.bmi_category}`
                  : "Add height & weight in your profile"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-teal-200 bg-teal-50/30 p-8 text-center">
          <p className="text-lg font-semibold text-teal-700">🚀 Dashboard coming soon</p>
          <p className="mt-2 text-sm text-teal-600/70">
            AI Chat, Symptom Checker, and Health Insights will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
