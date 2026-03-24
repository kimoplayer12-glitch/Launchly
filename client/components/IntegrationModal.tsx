import { useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface IntegrationModalProps {
  isOpen: boolean;
  platform: string;
  onClose: () => void;
  onConnect: (credentials: Record<string, string>) => Promise<void>;
}

export default function IntegrationModal({
  isOpen,
  platform,
  onClose,
  onConnect,
}: IntegrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getPlatformConfig = () => {
    const configs: Record<
      string,
      {
        title: string;
        description: string;
        fields: Array<{ key: string; label: string; type: string; placeholder: string }>;
        instruction: string;
        icon: string;
        color: string;
      }
    > = {
      shopify: {
        title: "Connect Shopify Store",
        description: "Link your Shopify store to track sales and inventory",
        icon: "🛍️",
        color: "from-green-500/20 to-green-600/20",
        fields: [
          {
            key: "storeUrl",
            label: "Store URL",
            type: "text",
            placeholder: "your-store.myshopify.com",
          },
          {
            key: "accessToken",
            label: "Access Token",
            type: "password",
            placeholder: "Your Shopify API access token",
          },
        ],
        instruction:
          "Get your access token from Shopify Admin > Apps and integrations > App and sales channel settings > Admin API access tokens",
      },
      stripe: {
        title: "Connect Stripe Account",
        description: "Link your Stripe account to track payments and payouts",
        icon: "💳",
        color: "from-blue-500/20 to-blue-600/20",
        fields: [
          {
            key: "apiKey",
            label: "Secret API Key",
            type: "password",
            placeholder: "sk_live_...",
          },
          {
            key: "publishableKey",
            label: "Publishable Key",
            type: "password",
            placeholder: "pk_live_...",
          },
        ],
        instruction:
          "Find your API keys in Stripe Dashboard > Developers > API keys",
      },
      paddle: {
        title: "Connect Paddle Account",
        description: "Link your Paddle account for subscription management",
        icon: "🏄",
        color: "from-purple-500/20 to-purple-600/20",
        fields: [
          {
            key: "vendorId",
            label: "Vendor ID",
            type: "text",
            placeholder: "Your Paddle Vendor ID",
          },
          {
            key: "apiKey",
            label: "API Key",
            type: "password",
            placeholder: "Your Paddle API Key",
          },
        ],
        instruction:
          "Get your credentials from Paddle Dashboard > Settings > Authentication",
      },
      instagram: {
        title: "Connect Instagram Account",
        description: "Link your Instagram for influencer tracking",
        icon: "📸",
        color: "from-neon-cyan/20 to-neon-purple/20",
        fields: [
          {
            key: "username",
            label: "Username",
            type: "text",
            placeholder: "@your_username",
          },
          {
            key: "accessToken",
            label: "Access Token",
            type: "password",
            placeholder: "Your Instagram API token",
          },
        ],
        instruction:
          "Get access token from Instagram Graph API in Meta for Developers",
      },
      twitter: {
        title: "Connect Twitter Account",
        description: "Link your Twitter for engagement tracking",
        icon: "𝕏",
        color: "from-gray-500/20 to-gray-600/20",
        fields: [
          {
            key: "username",
            label: "Username",
            type: "text",
            placeholder: "@your_username",
          },
          {
            key: "apiKey",
            label: "API Key",
            type: "password",
            placeholder: "Your Twitter API Key",
          },
        ],
        instruction:
          "Get API keys from Twitter Developer Portal > Keys and tokens",
      },
      tiktok: {
        title: "Connect TikTok Account",
        description: "Link your TikTok for creator analytics",
        icon: "🎵",
        color: "from-black/20 to-gray-900/20",
        fields: [
          {
            key: "username",
            label: "Username",
            type: "text",
            placeholder: "@your_username",
          },
          {
            key: "accessToken",
            label: "Access Token",
            type: "password",
            placeholder: "Your TikTok API token",
          },
        ],
        instruction:
          "Get access token from TikTok Developer Portal > My apps",
      },
      youtube: {
        title: "Connect YouTube Channel",
        description: "Link your YouTube channel for analytics and revenue tracking",
        icon: "▶️",
        color: "from-blue-500/20 to-blue-600/20",
        fields: [
          {
            key: "channelId",
            label: "Channel ID",
            type: "text",
            placeholder: "UC...",
          },
          {
            key: "apiKey",
            label: "API Key",
            type: "password",
            placeholder: "Your YouTube Data API key",
          },
        ],
        instruction:
          "Get your Channel ID from YouTube Studio > Settings > Basic info. Get API key from Google Cloud Console > APIs & Services",
      },
    };

    return configs[platform] || configs.stripe;
  };

  const config = getPlatformConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const allFilled = config.fields.every((field) => credentials[field.key]);
      if (!allFilled) {
        setError("Please fill in all fields");
        return;
      }

      await onConnect(credentials);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCredentials({});
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard variant="dark" className="w-full max-w-2xl">
        <div className="space-y-6 p-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{config.icon}</div>
              <div>
                <h2 className="text-3xl font-bold">{config.title}</h2>
                <p className="text-foreground/60 mt-1">{config.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {success ? (
            // Success State
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-xl font-bold text-green-400">Connected!</h3>
              <p className="text-foreground/60">Your {config.title.split(" ")[2]} account is now connected</p>
            </div>
          ) : (
            <>
              {/* Instructions Box */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">{config.instruction}</div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {config.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold mb-2">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ""}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan/50 focus:outline-none transition-colors text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                ))}

                {error && (
                  <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-500/50 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-neon-cyan/30 hover:bg-neon-cyan/40 disabled:opacity-50 rounded-lg transition-colors font-medium"
                  >
                    {loading ? "Connecting..." : "Connect Account"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
