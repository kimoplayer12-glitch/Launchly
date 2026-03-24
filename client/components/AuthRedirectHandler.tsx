import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { consumeAuthRedirectResult, AUTH_INTENT_KEY, getCurrentUser } from "@/lib/firebase-auth";
import { toast } from "@/components/ui/use-toast";

type AuthIntent = "login" | "signup";

export default function AuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const sendAuthEmail = async (payload: { email: string; name: string; type: AuthIntent }) => {
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (emailErr) {
        console.warn("Email notification failed:", emailErr);
      }
    };

    const handleRedirect = async () => {
      try {
        const intentFromStorage = (sessionStorage.getItem(AUTH_INTENT_KEY) as AuthIntent | null) ?? null;
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

        const result = await consumeAuthRedirectResult();
        if (!active && result) return;
        if (!result) {
          const current = getCurrentUser();
          if (current && intentFromStorage) {
            sessionStorage.removeItem(AUTH_INTENT_KEY);
            if (current.email) {
              await sendAuthEmail({
                email: current.email,
                name: current.displayName || current.email.split("@")[0],
                type: intentFromStorage,
              });
            }
            navigate(intentFromStorage === "signup" ? "/survey" : "/dashboard");
            return;
          }

          if (urlParams.has("error") || hashParams.has("error")) {
            const err =
              urlParams.get("error") ||
              hashParams.get("error") ||
              "OAuth redirect error";
            const desc =
              urlParams.get("error_description") || hashParams.get("error_description") || err;
            toast({
              title: "Google sign-in failed",
              description: desc,
              variant: "destructive",
            });
          }
          return;
        }

        const { user, intent, isNewUser } = result;
        const resolvedIntent: AuthIntent =
          intent === "signup" && !isNewUser ? "login" : intent ?? (isNewUser ? "signup" : "login");

        if (user.email) {
          await sendAuthEmail({
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
            type: resolvedIntent,
          });
        }

        if (resolvedIntent === "signup") {
          navigate("/survey");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "OAuth redirect failed";
        console.error("OAuth redirect error:", err);
        toast({
          title: "Google sign-in failed",
          description: message,
          variant: "destructive",
        });
      }
    };

    handleRedirect();

    return () => {
      active = false;
    };
  }, [navigate]);

  return null;
}
