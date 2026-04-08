import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer id="footer" className="relative border-t border-border/50 bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
            <Heart className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Health<span className="text-teal-600">AI</span>
          </span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} HealthAI. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex gap-5">
          {["Privacy", "Terms", "Contact"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-xs text-muted-foreground transition-colors duration-200 hover:text-teal-600"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
