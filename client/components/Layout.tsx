import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, loading } = useFirebaseAuth();
  const location = useLocation();

  // Show app shell on authenticated routes
  const hideShellRoutes = ["/", "/login", "/signup", "/landing", "/onboarding"];
  const isPreviewRoute = location.pathname.startsWith("/preview");
  const showSidebar =
    isAuthenticated &&
    !hideShellRoutes.includes(location.pathname) &&
    !isPreviewRoute;
  const showNavbar = !showSidebar && !isPreviewRoute;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showNavbar && <Navbar isAuthenticated={isAuthenticated} />}
      {showSidebar && <Sidebar />}
      {showSidebar && <Topbar />}
      <main
        className={`page-transition ${showSidebar ? "lg:ml-64 pt-20" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
