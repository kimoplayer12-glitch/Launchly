import { useNavigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useCredits } from "@/hooks/use-credits";
import { ChevronDown } from "lucide-react";

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();

  const pageTitle = location.pathname
    .replace("/", "")
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4 lg:pl-8 lg:pr-10">
        <div className="space-y-1">
          <div className="text-sm text-foreground/50">Launchly</div>
          <h1 className="text-xl font-semibold tracking-tight">
            {pageTitle || "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/pricing")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            Credits
            <span className="text-foreground font-semibold">
              {credits?.currentCredits ?? 0}
            </span>
            <span className="text-foreground/40">/</span>
            <span className="text-foreground/60">
              {credits?.monthlyLimit ?? 0}
            </span>
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-white/10 transition-colors">
            <span>{user?.displayName || user?.email?.split("@")[0] || "Account"}</span>
            <ChevronDown className="w-4 h-4 text-foreground/50" />
          </button>
        </div>
      </div>
    </header>
  );
}
