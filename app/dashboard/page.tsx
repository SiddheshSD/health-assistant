import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart, LogOut, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/app/actions/auth";
import { ProfileGuard } from "@/components/profile-guard";
import { DashboardProfile } from "@/components/dashboard-profile";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Display name from Supabase auth metadata (set at signup)
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Redirect to wizard if profile not complete (localStorage check) */}
      <ProfileGuard />

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
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
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
            Welcome back, {displayName.split(" ")[0]}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your personal health dashboard
          </p>
        </div>

        {/* Profile cards — read from localStorage client-side */}
        <DashboardProfile />

        {/* Chat launch card */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 p-px shadow-lg shadow-teal-500/20">
          <div className="rounded-2xl bg-gradient-to-br from-teal-600/90 to-emerald-500/90 p-8 text-white backdrop-blur-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-bold">💬 AI Health Assistant Chat</p>
                <p className="mt-1 text-sm text-teal-100/80">
                  Ask anything — symptoms, diet, medication, lifestyle tips. Your health profile is already loaded.
                </p>
              </div>
              <Link href="/dashboard/chat" className="shrink-0">
                <button className="flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm transition-all hover:bg-white/30 hover:ring-white/50 active:scale-95">
                  Open Chat →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
