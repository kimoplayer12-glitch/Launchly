import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Chrome, Lock, Mail, User } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { authenticateWithGoogle, signupWithPassword } from "@/lib/auth-client";
import { toast } from "@/components/ui/use-toast";

export default function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useFirebaseAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(user?.onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [authLoading, isAuthenticated, navigate, user?.onboardingCompleted]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signupWithPassword({ email, password });
      toast({
        title: "Account created",
        description: "Complete onboarding to unlock your dashboard.",
      });
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const response = await authenticateWithGoogle();
      toast({
        title: "Account ready",
        description: "Continue onboarding to unlock your dashboard.",
      });
      navigate(response.user.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/90 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">L</span>
            </div>
          </Link>
          <div className="eyebrow justify-center">Get started</div>
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="text-foreground/60">Build your personalized growth plan</p>
        </div>

        <GlassCard variant="dark" className="space-y-5 border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Founder"
                  className="input-glass w-full pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-glass w-full pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="input-glass w-full pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="********"
                  className="input-glass w-full pl-12"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full py-3 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-glass text-foreground/60">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn-glass w-full py-3 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </button>
        </GlassCard>

        <p className="text-center text-foreground/60 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
        <FooterLinks />
      </div>
    </div>
  );
}
