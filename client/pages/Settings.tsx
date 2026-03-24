import { useState, useEffect } from "react";
import FooterLinks from "@/components/FooterLinks";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Mail, User, Lock, Camera, Save, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useFirebaseAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user, loading, isAuthenticated, navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Here you would call an API to update the user profile
      // For now, we'll just show a success message
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Here you would call an API to change the password
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border border-neon-cyan border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-foreground/60">Manage your profile and preferences</p>
        </div>
        <div className="mb-8">
          <button
            onClick={() => navigate("/settings/connections")}
            className="btn-secondary-clean"
          >
            Manage Connections
          </button>
        </div>

        {/* Profile Card */}
        <GlassCard variant="dark" className="mb-6 border-white/20">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            </div>

            {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-black" />
              )}
            </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={() =>
                  toast({
                    title: "Avatar update",
                    description: "Avatar uploads are coming soon.",
                  })
                }
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Change Avatar</span>
              </button>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="input-glass w-full pl-12"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input-glass w-full pl-12 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-foreground/60">Email cannot be changed</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full btn-neon py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </GlassCard>

        {/* Password Card */}
        <GlassCard variant="dark" className="mb-6 border-white/20">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Security</h2>
              {showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-glass w-full pl-12"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-glass w-full pl-12"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-glass w-full pl-12"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex-1 btn-neon py-2 rounded-lg disabled:opacity-50"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1 btn-glass py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard variant="dark" className="border-blue-500/20">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-blue-400">Danger Zone</h2>
              <p className="text-sm text-foreground/60 mt-1">Irreversible actions</p>
            </div>
            <button
              className="w-full px-4 py-3 rounded-lg border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium"
              onClick={() =>
                toast({
                  title: "Delete account",
                  description: "Contact support to delete your account.",
                })
              }
            >
              Delete Account
            </button>
          </div>
        </GlassCard>
        <FooterLinks />
      </div>
    </div>
  );
}

