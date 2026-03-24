import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import FooterLinks from "@/components/FooterLinks";
import FloatingCard from "@/components/FloatingCard";
import { CreditConfirmModal } from "@/components/CreditConfirmModal";
import { useCredits } from "@/hooks/use-credits";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { CREDIT_COSTS } from "@/lib/credits";
import { Share2, Calendar, Plus, Heart, MessageCircle, Eye, Twitter, Facebook, Linkedin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function SocialPoster() {
  const navigate = useNavigate();
  const { credits, deductCredits, canAfford } = useCredits();
  const { isAuthenticated, loading } = useFirebaseAuth();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState("social_post_1");
  const [processingCredits, setProcessingCredits] = useState(false);

  // Redirect unauthenticated users AFTER auth state resolves
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border border-[hsl(var(--neon-cyan))] border-t-transparent"></div>
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const handleCreatePostClick = () => {

    setShowCreditModal(true);
  };

  const handleViewCalendar = () => {
    navigate("/social-media-scheduler");
  };

  const handlePlatformAction = (platformName: string, connected: boolean) => {
    toast({
      title: connected ? "Platform already connected" : "Connect platform",
      description: connected
        ? `${platformName} is already connected.`
        : `Starting ${platformName} connection...`,
    });
  };

  const handleAddPlatform = () => {
    toast({
      title: "Add platform",
      description: "New platform connections are coming soon.",
    });
  };

  const handleConfirmCredits = async () => {
    const creditCost = CREDIT_COSTS[selectedPostType] || 1;
    setProcessingCredits(true);

    try {
      const success = await deductCredits(creditCost);
      if (success) {
        toast({
          title: "Credits Deducted",
          description: `${creditCost} credit${creditCost > 1 ? "s" : ""} used. Opening post creator...`,
        });
        setShowCreditModal(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deducting credits",
        variant: "destructive",
      });
    } finally {
      setProcessingCredits(false);
    }
  };

  const scheduledPosts = [
    { id: 1, title: "New feature launch announcement", platform: "Twitter", date: "Today 3:00 PM", status: "scheduled" },
    { id: 2, title: "Behind-the-scenes team update", platform: "LinkedIn", date: "Tomorrow 9:00 AM", status: "scheduled" },
    { id: 3, title: "Product tips & tricks", platform: "Instagram", date: "Jan 25, 2024", status: "draft" },
  ];

  const publishedPosts = [
    { id: 1, title: "How we grew to 10K users", platform: "Twitter", engagement: 2450, date: "2 days ago" },
    { id: 2, title: "Our founding story", platform: "LinkedIn", engagement: 890, date: "5 days ago" },
    { id: 3, title: "Q4 2023 recap", platform: "Twitter", engagement: 1230, date: "1 week ago" },
  ];

  const platforms = [
    { id: "twitter", name: "Twitter/X", icon: Twitter, followers: "12.4K", connected: true },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, followers: "8.2K", connected: true },
    { id: "facebook", name: "Facebook", icon: Facebook, followers: "5.1K", connected: false },
  ];

  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Social Poster</h1>
            <p className="text-foreground/60">
              Schedule and publish content across all your social platforms
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Posts This Month", value: "48", color: "neon-cyan" },
            { label: "Total Reach", value: "245K", color: "neon-purple" },
            { label: "Engagement Rate", value: "8.2%", color: "neon-cyan" },
            { label: "Followers Growth", value: "+12%", color: "neon-blue" },
          ].map((stat, i) => (
            <FloatingCard key={i} delay={i * 100}>
              <GlassCard variant="dark" className="border-white/10">
                <p className="text-foreground/60 text-sm mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
              </GlassCard>
            </FloatingCard>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mb-12 flex flex-wrap gap-4">
          <button
            onClick={handleCreatePostClick}
            className="btn-neon px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Post {credits && `(${CREDIT_COSTS["social_post_1"]} credit)`}
          </button>
          <button
            onClick={handleViewCalendar}
            className="btn-glass px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:glow-cyan"
          >
            <Calendar className="w-4 h-4" /> View Calendar
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scheduled Posts */}
          <div className="lg:col-span-2 space-y-6">
            <FloatingCard delay={0}>
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Scheduled Posts</h2>
                  <div className="space-y-3">
                    {scheduledPosts.map((post) => (
                      <div key={post.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-neon-cyan transition-colors truncate">
                              {post.title}
                            </p>
                            <p className="text-xs text-foreground/60 mt-1">{post.date}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan whitespace-nowrap ml-2">
                            {post.platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-foreground/40" />
                          <span className="text-xs text-foreground/60">{post.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </FloatingCard>

            {/* Published Posts */}
            <FloatingCard delay={100}>
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Top Performing Posts</h2>
                  <div className="space-y-3">
                    {publishedPosts.map((post) => (
                      <div key={post.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">{post.title}</p>
                            <p className="text-xs text-foreground/60 mt-1">{post.platform} - {post.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-neon-cyan" />
                            <span className="text-sm text-foreground/60">{post.engagement}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-neon-cyan" />
                            <span className="text-sm text-foreground/60">
                              {Math.floor(post.engagement * 0.2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-neon-purple" />
                            <span className="text-sm text-foreground/60">
                              {Math.floor(post.engagement * 5)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </FloatingCard>
          </div>

          {/* Connected Platforms */}
          <FloatingCard delay={200}>
            <GlassCard variant="dark" className="border-white/10 h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Connected Platforms</h3>
                  <p className="text-foreground/60 text-xs mt-1">Manage your social accounts</p>
                </div>

                <div className="space-y-3">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <div
                        key={platform.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5 text-neon-cyan opacity-70" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{platform.name}</p>
                            <p className="text-xs text-foreground/60">{platform.followers}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlatformAction(platform.name, platform.connected)}
                          className={`w-full text-xs py-2 rounded transition-all duration-200 ${
                            platform.connected
                              ? "btn-glass text-foreground/80"
                              : "btn-neon"
                          }`}
                        >
                          {platform.connected ? "Connected" : "Connect"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddPlatform}
                  className="w-full btn-glass p-3 rounded-lg text-sm hover:glow-cyan"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add New Platform
                </button>
              </div>
            </GlassCard>
          </FloatingCard>
        </div>

        {/* Credit Confirmation Modal */}
        {credits && (
          <CreditConfirmModal
            isOpen={showCreditModal}
            creditsNeeded={CREDIT_COSTS[selectedPostType] || 1}
            creditsAvailable={credits.currentCredits}
            actionName="Create Social Media Post"
            onConfirm={handleConfirmCredits}
            onCancel={() => setShowCreditModal(false)}
            isProcessing={processingCredits}
          />
        )}
        <FooterLinks />
      </div>
    </div>
  );
}


