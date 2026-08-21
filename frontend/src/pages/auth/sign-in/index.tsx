import { useState } from "react";
import { UserAuthForm } from "./components/user-auth-form";
import { Sprout, Wheat, TrendingUp, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/utils/utils";
import Silk from "@/components/aurora";

type Role = "farmer" | "mandi_owner";

export default function SignIn() {
  const [selectedRole, setSelectedRole] = useState<Role>("farmer");

  return (
    <div className="relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* ── Left Panel ── */}
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">

        <div className="absolute inset-0">
          <Silk
            speed={5}
            scale={1}
            color="#00cc6a"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>

        <div className="relative z-20 mt-auto">
          <div className="bg-black/20 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              {/* <img src={Logo} alt="Logo" className="h-auto w-30 object-contain" /> */}
              <div className="text-center mx-auto">
                <h2 className="text-3xl font-bold text-white leading-tight">
                  MandiTrace
                </h2>
                <p className="text-sm text-white/80">Farm to Mandi Intelligence Platform</p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Welcome Back,
              </h3>
              <p className="text-base text-white/90 leading-relaxed">
                Track your crop journey from farm to mandi. AI harvest advice, IoT telemetry, and fair trade tracking.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white font-bold">
                &copy; Designed & Developed by NS Teams, All Rights Reserved
              </p>
            </div>
          </div>
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

        <div className="w-full max-w-[380px] space-y-6">
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
