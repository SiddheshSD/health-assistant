"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong shadow-[0_1px_30px_-8px_oklch(0.58_0.14_176_/_0.12)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <a
          href="#"
          id="logo"
          className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-teal-500/30">
            <Heart className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-xl bg-white/10" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Health<span className="text-teal-600">AI</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {["Features", "How it Works", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-teal-50 hover:text-teal-700"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button
              id="login-button"
              variant="outline"
              className="rounded-xl border-teal-200 px-5 text-teal-700 transition-all duration-300 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
            >
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out md:hidden ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-strong mx-4 mb-4 flex flex-col gap-1 rounded-2xl p-4">
          {["Features", "How it Works", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              {item}
            </a>
          ))}
          <div className="my-1 h-px bg-border" />
          <Link href="/login">
            <Button
              variant="outline"
              className="mt-1 w-full rounded-xl border-teal-200 text-teal-700 hover:border-teal-300 hover:bg-teal-50"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
