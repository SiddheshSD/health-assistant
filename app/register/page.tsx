"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signup } from "@/app/actions/auth";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Client-side validation
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      setSuccess(result.success);
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="flex w-full max-w-sm flex-col items-center text-center animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 mb-6">
            <CheckCircle2 className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">
            {success}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            Back to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm animate-fade-up" style={{ animationFillMode: "forwards" }}>
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start your health journey with HealthAI
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-up">
            {error}
          </div>
        )}

        {/* Form */}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                required
                className="h-11 rounded-xl pl-10 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 rounded-xl pl-10 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="h-11 rounded-xl pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                required
                minLength={6}
                className="h-11 rounded-xl pl-10 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="group mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>

        <Separator className="my-6" />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-600 underline-offset-4 transition-colors hover:text-teal-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
