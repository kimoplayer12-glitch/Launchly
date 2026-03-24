import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useCredits } from "@/hooks/use-credits";
import {
  saveSocialAccount,
  getSocialAccounts,
  schedulePost,
  getScheduledPosts,
  deleteScheduledPost,
} from "@/lib/social-scheduler";
import GlassCard from "@/components/GlassCard";
import { readJson } from "@/lib/api-client";
import FloatingCard from "@/components/FloatingCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FooterLinks from "@/components/FooterLinks";
import {
  Instagram,
  Twitter,
  Music,
  Plus,
  Calendar,
  Clock,
  Image,
  Trash2,
  Link2,
  AlertCircle,
  CheckCircle2,
  Youtube,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SocialAccount {
  id: string;
  platform: "instagram" | "twitter" | "tiktok" | "youtube";
  username: string;
  connected: boolean;
  connectedAt: Date;
}

interface ScheduledPost {
  id: string;
  platform: "instagram" | "twitter" | "tiktok" | "youtube";
  caption: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  scheduledFor: Date;
  status: "scheduled" | "posted" | "failed";
  creditsCost: number;
  createdAt: Date;
}

const PLATFORM_CONFIGS = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "from-neon-cyan to-neon-purple",
    creditCost: 5,
    maxFileSize: 8, // MB
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "from-blue-400 to-blue-600",
    creditCost: 3,
    maxFileSize: 5, // MB
  },
  tiktok: {
    name: "TikTok",
    icon: Music,
    color: "from-black to-gray-700",
    creditCost: 8,
    maxFileSize: 2.8, // GB, but we'll limit to reasonable size
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "from-blue-600 to-blue-800",
    creditCost: 10,
    maxFileSize: 100, // MB (YouTube shorts)
  },
};

export default function SocialMediaScheduler() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useFirebaseAuth();
  const { credits, deductCredits, canAfford } = useCredits();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    ("instagram" | "twitter" | "tiktok" | "youtube")[]
  >([]);
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // Load accounts and posts on mount
  useEffect(() => {
    if (user?.uid) {
      loadAccounts();
      loadScheduledPosts();
    }
  }, [user?.uid]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    const token = params.get('token');
    const username = params.get('username');
    const expiresIn = params.get('expiresIn');
    const refreshToken = params.get('refreshToken');

    if (connected && token && username && user?.uid) {
      // Save to Firebase
      try {
        saveSocialAccount(
          connected,
          username,
          token,
          user.uid
        ).then(() => {
          toast({
            title: "Connected!",
            description: `${PLATFORM_CONFIGS[connected as any].name} account connected successfully`,
          });
          loadAccounts(); // Reload accounts
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to save account",
          variant: "destructive",
        });
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      toast({
        title: "Connection Failed",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user?.uid]);

  const loadAccounts = async () => {
    if (!user?.uid) return;
    try {
      const fetchedAccounts = await getSocialAccounts(user.uid);
      setAccounts(
        fetchedAccounts.map((acc) => ({
          id: acc.id,
          platform: acc.platform,
          username: acc.username,
          connected: true,
          connectedAt: new Date(acc.connectedAt),
        }))
      );
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadScheduledPosts = async () => {
    if (!user?.uid) return;
    try {
      const fetchedPosts = await getScheduledPosts(user.uid);
      setScheduledPosts(
        fetchedPosts.map((post) => ({
          id: post.id,
          platform: post.platform,
          caption: post.caption,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          scheduledFor: new Date(post.scheduledFor),
          status: post.status,
          creditsCost: post.creditsCost,
          createdAt: new Date(post.createdAt),
        }))
      );
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
    }
  };

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

  const handleConnectAccount = async (platform: "instagram" | "twitter" | "tiktok" | "youtube") => {
    // Check if already connected
    if (accounts.find((a) => a.platform === platform)) {
      toast({
        title: "Already Connected",
        description: `${PLATFORM_CONFIGS[platform].name} is already connected`,
      });
      return;
    }

    if (!user?.uid) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get OAuth URL from backend
      const response = await fetch(
        `/api/social/oauth-url?platform=${platform}&userId=${user.uid}`
      );
      const { url } = await readJson(response);

      // Redirect to platform OAuth
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start authentication",
        variant: "destructive",
      });
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize =
      selectedPlatforms.length > 0
        ? PLATFORM_CONFIGS[selectedPlatforms[0]].maxFileSize * 1024 * 1024
        : 8 * 1024 * 1024;

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSize / 1024 / 1024}MB`,
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSchedulePost = async () => {
    if (!caption.trim()) {
      toast({
        title: "Empty caption",
        description: "Please write a caption for your post",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Select at least one platform to post to",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Missing date/time",
        description: "Please select when to post",
        variant: "destructive",
      });
      return;
    }

    const totalCredits = selectedPlatforms.reduce(
      (sum, platform) => sum + PLATFORM_CONFIGS[platform].creditCost,
      0
    );

    // Calculate total credits needed
    setIsSubmitting(true);

    try {
      // Create scheduled posts
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const newPosts: ScheduledPost[] = selectedPlatforms.map((platform) => ({
        id: `post_${Date.now()}_${platform}`,
        platform,
        caption,
        mediaUrl: mediaPreview,
        mediaType: mediaFile?.type.startsWith("video") ? "video" : "image",
        scheduledFor: scheduledDateTime,
        status: "scheduled",
        creditsCost: PLATFORM_CONFIGS[platform].creditCost,
        createdAt: new Date(),
      }));

      setScheduledPosts([...scheduledPosts, ...newPosts]);

      // Reset form
      setCaption("");
      setMediaFile(null);
      setMediaPreview("");
      setScheduledDate("");
      setScheduledTime("");
      setSelectedPlatforms([]);
      setShowComposer(false);

      toast({
        title: "Posts Scheduled!",
        description: `${newPosts.length} post(s) scheduled successfully. ${totalCredits} credits deducted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduledPost = async (postId: string) => {
    if (!user?.uid) return;

    try {
      await deleteScheduledPost(user.uid, postId);
      setScheduledPosts(scheduledPosts.filter((p) => p.id !== postId));
      toast({
        title: "Post deleted",
        description: "Scheduled post has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <FloatingCard delay={0}>
          <div className="page-header">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-neon-cyan" />
              <h1 className="text-4xl font-bold">Social Media Scheduler</h1>
            </div>
            <p className="text-foreground/60">
              Connect your social accounts and schedule posts across TikTok, Instagram, Twitter, and YouTube
            </p>
          </div>
        </FloatingCard>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Connected Accounts & Scheduler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connected Accounts */}
            <FloatingCard delay={100}>
              <GlassCard variant="dark" className="border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Connected Accounts</h2>
                      <p className="text-foreground/60 text-sm mt-1">
                        {accounts.length} platform{accounts.length !== 1 ? "s" : ""} connected
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
                      const PlatformIcon = config.icon;
                      const connected = accounts.find((a) => a.platform === platform as any);

                      return (
                        <div
                          key={platform}
                          className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}
                              >
                                <PlatformIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {config.name}
                                </p>
                                {connected ? (
                                  <p className="text-xs text-green-400">
                                    ✓ {connected.username}
                                  </p>
                                ) : (
                                  <p className="text-xs text-foreground/60">
                                    Not connected
                                  </p>
                                )}
                              </div>
                            </div>
                            {!connected ? (
                              <Button
                                onClick={() =>
                                  handleConnectAccount(platform as any)
                                }
                                className="btn-neon text-xs"
                              >
                                <Link2 className="w-3 h-3 mr-1" /> Connect
                              </Button>
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </FloatingCard>

            {/* Post Composer */}
            {showComposer ? (
              <FloatingCard delay={200}>
                <GlassCard variant="dark" className="border-white/10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Compose Post</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowComposer(false)}
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">
                        Post to (Credits: {selectedPlatforms.reduce((sum, p) => sum + PLATFORM_CONFIGS[p].creditCost, 0)})
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
                          const PlatformIcon = config.icon;
                          const isSelected = selectedPlatforms.includes(
                            platform as any
                          );
                          const isConnected = accounts.some(
                            (a) => a.platform === platform
                          );

                          return (
                            <button
                              key={platform}
                              disabled={!isConnected}
                              onClick={() => {
                                setSelectedPlatforms((prev) =>
                                  isSelected
                                    ? prev.filter((p) => p !== platform)
                                    : [
                                        ...prev,
                                        platform as "instagram" | "twitter" | "tiktok",
                                      ]
                                );
                              }}
                              className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                isSelected
                                  ? "border-neon-cyan bg-neon-cyan/20"
                                  : "border-white/10 hover:border-white/30"
                              }`}
                            >
                              <PlatformIcon className="w-5 h-5 mx-auto mb-1" />
                              <p className="text-xs font-semibold">
                                {config.name}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Caption
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write your caption..."
                        maxLength={2200}
                        className="w-full input-glass h-32 text-sm"
                      />
                      <p className="text-xs text-foreground/40 mt-1">
                        {caption.length}/2200 characters
                      </p>
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Image/Video
                      </label>
                      <div className="relative border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {mediaPreview ? (
                          <div className="space-y-2">
                            {mediaFile?.type.startsWith("video") ? (
                              <video
                                src={mediaPreview}
                                className="max-h-48 mx-auto rounded"
                              />
                            ) : (
                              <img
                                src={mediaPreview}
                                alt="preview"
                                className="max-h-48 mx-auto rounded"
                              />
                            )}
                            <p className="text-xs text-foreground/60">
                              {mediaFile?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Image className="w-8 h-8 mx-auto text-foreground/40" />
                            <p className="text-sm font-semibold">
                              Click to upload media
                            </p>
                            <p className="text-xs text-foreground/60">
                              PNG, JPG, MP4, etc.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date/Time Picker */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Schedule Date
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full input-glass text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Schedule Time
                        </label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full input-glass text-sm"
                        />
                      </div>
                    </div>

                    {/* Schedule Button */}
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <Button
                        onClick={() => setShowComposer(false)}
                        variant="ghost"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSchedulePost}
                        disabled={isSubmitting || selectedPlatforms.length === 0}
                        className="flex-1 btn-neon"
                      >
                        {isSubmitting ? "Scheduling..." : "Schedule Post"}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </FloatingCard>
            ) : (
              <FloatingCard delay={200}>
                <button
                  onClick={() => setShowComposer(true)}
                  className="w-full p-8 rounded-lg border-2 border-dashed border-neon-cyan/50 hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all text-center"
                >
                  <Plus className="w-8 h-8 mx-auto mb-2 text-neon-cyan" />
                  <p className="font-semibold text-foreground">
                    Create New Post
                  </p>
                  <p className="text-sm text-foreground/60 mt-1">
                    Schedule a post to TikTok, Instagram, or Twitter
                  </p>
                </button>
              </FloatingCard>
            )}

            {/* Scheduled Posts List */}
            {scheduledPosts.length > 0 && (
              <FloatingCard delay={300}>
                <GlassCard variant="dark" className="border-white/10">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">
                      Scheduled Posts ({scheduledPosts.length})
                    </h2>
                    <div className="space-y-3">
                      {scheduledPosts.map((post) => {
                        const config =
                          PLATFORM_CONFIGS[post.platform];
                        const Icon = config.icon;

                        return (
                          <div
                            key={post.id}
                            className="p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className={`p-1.5 rounded bg-gradient-to-r ${config.color}`}
                                  >
                                    <Icon className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-semibold text-sm">
                                    {config.name}
                                  </span>
                                  <span className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan">
                                    {post.creditsCost} credits
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                                  {post.caption}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-foreground/60">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {post.scheduledFor.toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {post.scheduledFor.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteScheduledPost(post.id)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-blue-400" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              </FloatingCard>
            )}
          </div>

          {/* Right Column - Stats */}
          <FloatingCard delay={150}>
            <GlassCard variant="dark" className="border-white/10 h-fit">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-4">Platform Costs</h3>
                  <div className="space-y-2">
                    {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
                      <div
                        key={platform}
                        className="flex items-center justify-between text-sm p-2 rounded bg-white/5"
                      >
                        <span className="text-foreground/70">
                          {config.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-300">
                      <p className="font-semibold mb-1">Pro Tip</p>
                      <p>Schedule posts during peak hours for maximum engagement!</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </FloatingCard>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

