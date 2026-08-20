import { useState } from "react";
import { UserAuthForm } from "./components/user-auth-form";
import { Sprout, Wheat, TrendingUp, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/utils/utils";

type Role = "farmer" | "mandi_owner";

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState<Role>("farmer");

  return (
    <div className="relative grid h-svh lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">
      {/* ── Left Panel ── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 lg:flex lg:flex-col">
        {/* Decorative background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative gradient circles */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Sprout className="h-5 w-5 text-green-300" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              MandiTrace
            </span>
          </div>

          {/* Hero section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
                From Seed to Sale,{" "}
                <span className="bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                  Every Step Traced.
                </span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-green-100/70 xl:text-lg">
                Track your crop journey, connect with mandis, and get
                transparent, fair prices — all in one place.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: TrendingUp, label: "Live Pricing" },
                { icon: Shield, label: "Verified Transactions" },
                { icon: BarChart3, label: "Crop Analytics" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-green-100/80 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-green-100/40">
            © 2026 MandiTrace. Built for Indian farmers.
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-10 sm:px-10">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
            <Sprout className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            MandiTrace
          </span>
        </div>

        <div className="w-full max-w-[380px] space-y-8">
          {/* Heading */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose your role to continue
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole("farmer")}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 transition-all duration-200 cursor-pointer",
                selectedRole === "farmer"
                  ? "border-green-600 bg-green-50 shadow-sm shadow-green-600/10 dark:bg-green-950/20 dark:shadow-green-500/5"
                  : "border-border hover:border-green-600/30 hover:bg-accent/50"
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                  selectedRole === "farmer"
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground group-hover:bg-green-100 group-hover:text-green-700 dark:group-hover:bg-green-900/30 dark:group-hover:text-green-400"
                )}
              >
                <Sprout className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    selectedRole === "farmer"
                      ? "text-green-700 dark:text-green-400"
                      : "text-foreground"
                  )}
                >
                  Farmer
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Sell your crops
                </p>
              </div>
              {selectedRole === "farmer" && (
                <div className="absolute -top-px -right-px flex h-5 w-5 items-center justify-center rounded-bl-lg rounded-tr-[10px] bg-green-600">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("mandi_owner")}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 transition-all duration-200 cursor-pointer",
                selectedRole === "mandi_owner"
                  ? "border-amber-600 bg-amber-50 shadow-sm shadow-amber-600/10 dark:bg-amber-950/20 dark:shadow-amber-500/5"
                  : "border-border hover:border-amber-600/30 hover:bg-accent/50"
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                  selectedRole === "mandi_owner"
                    ? "bg-amber-600 text-white"
                    : "bg-muted text-muted-foreground group-hover:bg-amber-100 group-hover:text-amber-700 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400"
                )}
              >
                <Wheat className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    selectedRole === "mandi_owner"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-foreground"
                  )}
                >
                  Mandi Owner
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Buy from farmers
                </p>
              </div>
              {selectedRole === "mandi_owner" && (
                <div className="absolute -top-px -right-px flex h-5 w-5 items-center justify-center rounded-bl-lg rounded-tr-[10px] bg-amber-600">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                Continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <UserAuthForm selectedRole={selectedRole} />

          {/* Footer */}
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
