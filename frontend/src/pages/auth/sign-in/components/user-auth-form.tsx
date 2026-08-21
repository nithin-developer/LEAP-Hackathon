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
    <div className={cn("flex flex-col items-center gap-2", className)} {...props}>
      {/* Google renders its own button here */}
      <div
        ref={googleBtnRef}
        className="flex w-full items-center justify-center [&>div]:w-full"
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Signing you in…
        </div>
      )}
    </div>
  );
}
