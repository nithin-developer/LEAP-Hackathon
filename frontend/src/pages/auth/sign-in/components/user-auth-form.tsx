import { HTMLAttributes, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/utils/utils";
import { googleLogin } from "@/api/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (el: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> {
  selectedRole: "farmer" | "mandi_owner";
}

export function UserAuthForm({
  className,
  selectedRole,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef(selectedRole);

  // Keep role in sync via ref so the callback always has the latest value
  useEffect(() => {
    roleRef.current = selectedRole;
  }, [selectedRole]);

  const handleGoogleResponse = useCallback(
    async (response: any) => {
      if (!response.credential) {
        toast.error("Google sign-in failed. No credential received.");
        return;
      }

      setIsLoading(true);
      try {
        await googleLogin(response.credential, roleRef.current);
        toast.success("Signed in successfully!");
        const redirectTo = searchParams.get("redirect") || "/";
        navigate(redirectTo, { replace: true });
      } catch (error: any) {
        const detail =
          error.response?.data?.detail || "Google sign-in failed. Please try again.";
        toast.error(detail);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, searchParams]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "your-google-client-id-here") {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set.");
      return;
    }

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      // Clear any previous render
      googleBtnRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 380,
        height: 50,     
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} {...props}>
      {/* Google renders its own button here */}
      <div
        ref={googleBtnRef}
        className="flex w-full items-center justify-center [&>div]:w-full"
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Signing you in…
        </div>
      )}
    </div>
  );
}
