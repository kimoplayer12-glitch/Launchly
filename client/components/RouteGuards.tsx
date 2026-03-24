import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

function GuardLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent"></div>
        <div className="text-foreground/70">Loading...</div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useFirebaseAuth();
  const location = useLocation();

  if (loading) {
    return <GuardLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireOnboardingCompletion({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, loading } = useFirebaseAuth();
  const location = useLocation();

  if (loading) {
    return <GuardLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
