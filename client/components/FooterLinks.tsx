import { Link } from "react-router-dom";

export default function FooterLinks() {
  return (
    <footer className="border-t border-white/10 py-16 px-6 text-foreground/60 text-sm">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="text-foreground font-semibold text-base">Launchly</div>
          <p className="text-sm text-foreground/60">
            The AI growth system for founders building fast.
          </p>
          <div className="text-xs text-foreground/40">(c) 2026 Launchly. All rights reserved.</div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/40">Product</div>
          <div className="grid gap-2">
            <Link to="/#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/integrations" className="hover:text-foreground transition-colors">
              Integrations
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/40">Company</div>
          <div className="grid gap-2">
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/status" className="hover:text-foreground transition-colors">
              Status
            </Link>
            <Link to="/changelog" className="hover:text-foreground transition-colors">
              Changelog
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/40">Legal</div>
          <div className="grid gap-2">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link to="/status" className="hover:text-foreground transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

