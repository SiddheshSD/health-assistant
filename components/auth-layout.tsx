import { Heart } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 p-12 lg:flex">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Heart className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-white">HealthAI</span>
        </div>

        {/* Testimonial / pitch */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-3xl font-heading font-semibold leading-tight text-white/95">
            &ldquo;Your health journey, <br />
            powered by intelligence.&rdquo;
          </blockquote>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            Join thousands of users who trust HealthAI for personalized health
            insights, symptom analysis, and proactive wellness guidance.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-white/30", "bg-white/25", "bg-white/20", "bg-white/15"].map(
                (color, i) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${color} ring-2 ring-white/30 text-xs font-bold text-white backdrop-blur-sm`}
                  >
                    {["S", "A", "M", "R"][i]}
                  </div>
                )
              )}
            </div>
            <span className="text-sm text-white/60">2,400+ active users</span>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} HealthAI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20">
            <Heart className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Health<span className="text-teal-600">AI</span>
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
