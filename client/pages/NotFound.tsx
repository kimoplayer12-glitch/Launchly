import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="page-shell flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <div className="text-6xl font-semibold text-foreground/80">404</div>
          <h1 className="text-3xl font-semibold">Page not found</h1>
          <p className="text-foreground/60">
            Looks like this mission doesn't exist in our control center. Let's get you back on track.
          </p>
        </div>

        <GlassCard variant="dark" className="border-white/10">
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              The page you're looking for might have been moved or doesn't exist yet.
            </p>
            <Link
              to="/"
              className="btn-neon w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
          </div>
        </GlassCard>
        <FooterLinks />
      </div>
    </div>
  );
};

export default NotFound;

