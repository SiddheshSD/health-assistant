import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, MessageCircle, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    description:
      "Describe your symptoms and receive AI-driven analysis with possible conditions and next steps.",
    gradient: "from-teal-500 to-teal-600",
    glow: "shadow-teal-500/20",
    bg: "bg-teal-50/60",
    iconColor: "text-teal-600",
  },
  {
    icon: MessageCircle,
    title: "AI Chat Assistant",
    description:
      "Have a natural conversation about your health concerns with our intelligent assistant.",
    gradient: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-50/60",
    iconColor: "text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Health Insights",
    description:
      "Track patterns, get personalized recommendations, and understand your health trends over time.",
    gradient: "from-sky-500 to-sky-600",
    glow: "shadow-sky-500/20",
    bg: "bg-sky-50/60",
    iconColor: "text-sky-600",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
            Features
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              better health
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Powered by advanced AI to give you reliable, instant health guidance.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`group relative overflow-hidden border-0 bg-white/70 shadow-sm ring-1 ring-white/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:${feature.glow}`}
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                <CardContent className="flex flex-col gap-4 p-6">
                  {/* Icon */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md ${feature.glow} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover accent */}
                  <div
                    className={`absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
