import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { toast } from "@/components/ui/use-toast";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  isAuthenticated: boolean;
}

export default function Navbar({ isAuthenticated }: NavbarProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useFirebaseAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileOpen(false);
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  const handleDashboard = () => {
    setMobileOpen(false);
    navigate("/dashboard");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/5 backdrop-blur-xl border-white/10"
          : "bg-white/5 backdrop-blur-lg border-white/10"
      }`}
    >
      <div className="section flex items-center justify-between py-3">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 group cursor-pointer transition-all duration-300"
        >
          <div className="w-9 h-9 rounded-lg bg-neon-cyan/90 flex items-center justify-center shadow-[0_8px_20px_rgba(124,92,255,0.35)]">
            <span className="text-sm font-black text-white">L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">Launchly</span>
            <span className="text-[11px] text-foreground/50 font-medium tracking-[0.2em]">AI PLATFORM</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/integrations"
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Integrations
              </Link>
              <Link
                to="/generate-website"
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Generate Website
              </Link>
              <Link
                to="/generate-store"
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Generate Store
              </Link>
              <button
                onClick={handleDashboard}
                className="text-foreground/80 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Modules
              </button>
            </>
          ) : (
            <>
              <Link
                to="/#features"
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                How it works
              </Link>
              <Link
                to="/pricing"
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                to="/#faq"
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                FAQ
              </Link>
            </>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-foreground/60">
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="btn-glass text-foreground/90 hover:text-foreground text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-glass text-foreground/90 hover:text-foreground text-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-neon text-sm"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={`md:hidden border-t border-white/10 bg-background/95 backdrop-blur ${mobileOpen ? "block" : "hidden"}`}
      >
        <div className="section py-4 space-y-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/60">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-glass border-neon-cyan/50 text-foreground/90 hover:text-foreground text-sm"
                >
                  Logout
                </button>
              </div>
              <div className="grid gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/integrations"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Integrations
                </Link>
                <Link
                  to="/generate-website"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Generate Website
                </Link>
                <Link
                  to="/generate-store"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Generate Store
                </Link>
                <button
                  onClick={handleDashboard}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-left text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Modules
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Link
                  to="/#features"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Features
                </Link>
                <Link
                  to="/#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  How it works
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="/#faq"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  FAQ
                </Link>
              </div>
              <div className="grid gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-glass text-foreground/90 hover:text-foreground text-sm text-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="btn-neon text-sm text-center"
                >
                  Start Free
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

