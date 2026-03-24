import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Button } from "@/components/ui/button";
import FooterLinks from "@/components/FooterLinks";
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  Users,
  Code,
  Rocket,
  Target,
  Check,
  TrendingUp,
  Shield,
  Zap as ZapIcon
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useFirebaseAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
            <span className="text-sm font-medium text-neon-cyan">The AI Growth System for Founders</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            <span className="block">Plan, Launch, Market,</span>
            <span className="block bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              and Monetize - Without 10 Tools.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-foreground/75 max-w-3xl mx-auto leading-relaxed font-light">
            Launchly turns fragmented tools into one weekly growth system - plan your offer, generate content, publish, run ads, and track what actually drives revenue.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/signup")}
              className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/90 hover:to-neon-purple/90 text-black font-bold group shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40 transition-all"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="border-white/20 hover:bg-white/10 hover:border-neon-cyan/50 font-semibold backdrop-blur-sm"
            >
              View Plans
            </Button>
          </div>
          <p className="text-xs text-foreground/60">
            Replace planning docs, content tools, schedulers, and ad copy tools with one system.
          </p>

          {/* Trust indicators */}
          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-foreground/70 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">10,000+ Active Users</span>
            </div>
            <div className="h-5 w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
              <span className="font-medium">99.9% Uptime SLA</span>
            </div>
            <div className="h-5 w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-purple"></div>
              <span className="font-medium">Enterprise Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features Built for Scale</h2>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">Everything you need to build, launch, and grow your business profitably</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: "AI Business Plans",
                description: "Generate comprehensive business strategies in minutes. Cover market analysis, financials, and milestones with AI precision."
              },
              {
                icon: ZapIcon,
                title: "Content Monetization",
                description: "Turn your audience into revenue. Connect platforms, track earnings, and optimize monetization across all channels."
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Real-time dashboards tracking revenue, growth, and key metrics. Data-driven decisions at your fingertips."
              },
              {
                icon: Users,
                title: "Social Media Hub",
                description: "Schedule, analyze, and grow across platforms. Multi-channel management with one powerful dashboard."
              },
              {
                icon: Target,
                title: "AI Ad Generator",
                description: "Create high-converting ads instantly. Professional copy and visuals powered by enterprise AI."
              },
              {
                icon: Code,
                title: "Website & Store Builder",
                description: "Build beautiful e-commerce sites without coding. Deploy professionally in minutes, not months."
              }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="group p-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan/10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center mb-5 group-hover:from-neon-cyan/50 group-hover:to-neon-purple/50 transition-all">
                    <Icon className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Active Users", icon: Users },
              { number: "1.2M", label: "Plans Generated", icon: TrendingUp },
              { number: "99.9%", label: "Uptime", icon: Shield },
              { number: "50+", label: "Integrations", icon: Zap }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-8 h-8 text-neon-cyan" />
                  </div>
                  <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">{stat.number}</div>
                  <p className="text-foreground/60 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 p-12 md:p-16 text-center backdrop-blur">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
            <p className="text-foreground/75 mb-10 text-lg">
              Join thousands of successful entrepreneurs leveraging Launchly to scale their operations. Start your free trial today.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/signup")}
              className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/90 hover:to-neon-purple/90 text-black font-bold shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40 transition-all"
            >
              {isAuthenticated ? "Open Dashboard" : "Start Free"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <FooterLinks />
    </div>
  );
}


