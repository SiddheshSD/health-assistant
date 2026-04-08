import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatPreview } from "@/components/chat-preview";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[10%] h-72 w-72 rounded-full bg-teal-300/15 blur-3xl animate-orb-drift" />
      <div
        className="absolute bottom-[20%] right-[8%] h-64 w-64 rounded-full bg-emerald-300/12 blur-3xl animate-orb-drift"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute top-[60%] left-[50%] h-56 w-56 rounded-full bg-sky-200/15 blur-3xl animate-orb-drift"
        style={{ animationDelay: "-13s" }}
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.50 0.13 175 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.50 0.13 175 / 30%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-6 pt-28 pb-20 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:pt-0 lg:pb-0">
        {/* Left – Copy */}
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          {/* Tag */}
          <div
            className="animate-fade-up opacity-0"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            <Badge
              variant="outline"
              className="mb-6 gap-1.5 rounded-full border-teal-200/80 bg-teal-50/60 px-3.5 py-1.5 text-xs font-medium text-teal-700 backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3" />
              AI-Powered Healthcare
            </Badge>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up opacity-0 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            Your AI-Powered{" "}
            <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-shift">
              Health Assistant
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-fade-up opacity-0 mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-8"
            style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
          >
            Get instant health insights, symptom analysis, and personalized
            guidance — anytime, anywhere.
          </p>

          {/* CTA group */}
          <div
            className="animate-fade-up opacity-0 mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
            style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
          >
            <Link href="/login">
              <Button
                id="get-started-button"
                className="group h-12 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-7 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-105 active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href="/register"
                className="font-medium text-teal-600 underline-offset-4 transition-colors hover:text-teal-700 hover:underline"
              >
                Sign up in seconds
              </Link>
            </p>
          </div>

          {/* Trust indicators */}
          <div
            className="animate-fade-up opacity-0 mt-12 flex items-center gap-6"
            style={{ animationDelay: "700ms", animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["bg-teal-300", "bg-emerald-300", "bg-sky-300", "bg-teal-400"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${color} ring-2 ring-white text-[10px] font-bold text-white`}
                    >
                      {["S", "A", "M", "R"][i]}
                    </div>
                  )
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">2,400+</strong> users trust HealthAI
              </span>
            </div>
          </div>
        </div>

        {/* Right – Chat Preview */}
        <div className="flex flex-1 items-center justify-center lg:justify-end">
          <ChatPreview />
        </div>
      </div>
    </section>
  );
}
