"use client";

import { useEffect, useState, useRef } from "react";
import { api, getAuthToken, usersApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Shield, Bell, User, Lock, Trash2, Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common";
import { normalizeSingleItem } from "@/lib/utils/apiResponse";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useAuth } from "@/contexts/AuthContext";

type UserProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  oauthProviders?: {
    google?: {
      id?: string;
      email?: string;
      verified?: boolean;
    };
  };
};

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mark as mounted to prevent hydration issues
    setMounted(true);
    // Get token on client side only
    if (typeof window !== "undefined") {
      setToken(getAuthToken());
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getMe();
        const userData = normalizeSingleItem(response) as any;

        setProfile({
          fullName: userData?.fullName || userData?.full_name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          role: userData?.role || "",
          avatarUrl: userData?.avatarUrl || userData?.avatar_url || userData?.avatar || "",
        });
        setNotifyEmail(Boolean(userData?.notifications?.email ?? true));
        setNotifyPush(Boolean(userData?.notifications?.push ?? true));
        setNotifyOrders(Boolean(userData?.notifications?.orders ?? true));
      } catch {
        // Fallback to localStorage if unauth or endpoint missing
        const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (raw) {
          try {
            const u = JSON.parse(raw);
            setProfile({ fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, avatarUrl: u.avatarUrl });
          } catch { }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { submit: saveProfile, loading: savingProfile } = useFormSubmit({
    onSubmit: async (data: any) => {
      const response = await usersApi.updateMe({
        fullName: profile.fullName,
        phone: profile.phone,
      });
      return response;
    },
    successMessage: "Profile updated successfully!",
    onSuccess: async (response) => {
      // Update local storage
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const updatedUser = {
            ...u,
            fullName: profile.fullName,
            phone: profile.phone,
            ...(response?.data && { ...response.data }),
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch { }
      }
      // Refresh user context to update header
      await refreshUser();
    },
  });

  const handleSaveProfile = () => {
    saveProfile({});
  };

  const onPickAvatar = async () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.type = 'file';
    fileInputRef.current.accept = 'image/*';
    fileInputRef.current.onchange = async () => {
      const file = fileInputRef.current?.files && fileInputRef.current.files[0];
      if (!file) return;

      // Validate file size (max 5MB for avatars)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size exceeds 5MB limit');
        return;
      }

      try {
        setAvatarUploading(true);

        // Upload file using the existing upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'avatar');

        // Use fetch directly for FormData (api function sets JSON content-type)
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        // Don't set Content-Type - browser will set it with boundary for FormData

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to upload file');
        }

        const uploadResponse = await uploadRes.json();

        if (!uploadResponse?.success || !uploadResponse?.data?.url) {
          throw new Error(uploadResponse?.message || 'Failed to upload file');
        }

        const avatarUrl = uploadResponse.data.url;

        // Save avatar URL to user profile
        await api('/api/users/avatar', {
          method: 'POST',
          body: JSON.stringify({ avatarUrl }),
        });

        // Update local state
        setProfile((p) => ({ ...p, avatarUrl }));

        // Update localStorage
        const raw = localStorage.getItem('user');
        if (raw && avatarUrl) {
          try {
            const u = JSON.parse(raw);
            localStorage.setItem('user', JSON.stringify({ ...u, avatar: avatarUrl, avatarUrl }));
          } catch { }
        }

        toast.success('Avatar updated successfully');
      } catch (e: any) {
        console.error('Avatar upload error:', e);
        toast.error(e?.message || 'Failed to upload avatar');
      } finally {
        setAvatarUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    fileInputRef.current.click();
  };

  const removeAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;

    try {
      setAvatarUploading(true);

      // Remove avatar from backend
      await api('/api/users/avatar', {
        method: 'DELETE',
      });

      // Update local state
      setProfile((p) => ({ ...p, avatarUrl: '' }));

      // Update localStorage
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          localStorage.setItem('user', JSON.stringify({ ...u, avatar: '', avatarUrl: '' }));
        } catch { }
      }

      toast.success('Avatar removed successfully');
    } catch (e: any) {
      console.error('Avatar removal error:', e);
      toast.error(e?.message || 'Failed to remove avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setLoading(true);
      await api("/api/users/notifications", {
        method: "PUT",
        body: JSON.stringify({ email: notifyEmail, push: notifyPush, orders: notifyOrders }),
      });
      toast.success("Notifications saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save notifications");
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    // For OAuth users, they can set a password without current password
    if (isOAuthUser) {
      if (!newPassword || newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    } else {
      // For regular users, require current password
      if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
        toast.error("Check your password entries");
        return;
      }
    }

    try {
      setLoading(true);
      await api("/api/users/password", {
        method: "PUT",
        body: JSON.stringify({
          ...(isOAuthUser ? {} : { currentPassword }),
          newPassword
        }),
      });
      toast.success(isOAuthUser ? "Password created successfully! You can now sign in with email and password." : "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsOAuthUser(false); // After setting password, they're no longer OAuth-only
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      setLoading(true);
      await api("/api/users/me", { method: "DELETE" });
      toast.success("Account deleted");
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "/";
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-taja-primary/30 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-taja-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-motif-blanc opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <PageHeader
            title="Account Settings"
            description="Manage your profile, security, and communication preferences."
          />
          {mounted && profile.role && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-taja-primary rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
              <User className="h-3.5 w-3.5" />
              Role: <span className="text-taja-secondary underline decoration-taja-primary/30 underline-offset-4">{profile.role}</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-12"
        >
          {/* Profile */}
          <section className="glass-panel rounded-[40px] p-8 sm:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-taja-primary/10 transition-colors duration-700" />

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-taja-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-taja-primary" />
              </div>
              <h2 className="text-2xl font-black text-taja-secondary tracking-tighter uppercase italic">
                Identity <span className="text-taja-primary/40">•</span> Profile
              </h2>
            </div>

            <div className="grid gap-12 md:grid-cols-[auto,1fr] items-start relative z-10">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-32 h-32 rounded-[40px] overflow-hidden ring-4 ring-white shadow-premium group/avatar">
                  {profile.avatarUrl && profile.avatarUrl.startsWith('http') ? (
                    <Image
                      src={profile.avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 font-black text-3xl italic">
                      {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    onClick={onPickAvatar}
                    disabled={avatarUploading || !token}
                    variant="gradient"
                    className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px]"
                  >
                    {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Avatar'}
                  </Button>
                  {profile.avatarUrl && (
                    <Button
                      onClick={removeAvatar}
                      disabled={avatarUploading || !token}
                      variant="outline"
                      className="w-full h-11 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] border-white/60 text-red-500 hover:bg-red-50/50 hover:border-red-200"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                  <Input
                    value={profile.fullName || ""}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white focus:border-taja-primary/40 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white focus:border-taja-primary/40 transition-all font-medium"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
                  <Input
                    value={profile.email || ""}
                    disabled
                    className="w-full h-14 rounded-2xl border-white/40 bg-gray-50/50 text-gray-400 font-medium italic select-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end pt-8 border-t border-white/40 relative z-10">
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !token}
                variant="gradient"
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-emerald group-hover:scale-[1.02] transition-transform"
              >
                {savingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Profile Changes'}
              </Button>
            </div>
          </section>

          {/* Password */}
          <section className="glass-panel rounded-[40px] p-8 sm:p-12 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-taja-secondary tracking-tighter uppercase italic">
                Security <span className="text-emerald-500/40">•</span> Password
              </h2>
            </div>

            {isOAuthUser ? (
              <div className="space-y-8">
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[24px] flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide mb-1">Google Authentication Active</h3>
                    <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                      You're currently using Google sign-in. Creating a password will allow you to sign in with your email directly if needed.
                    </p>
                  </div>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-end pt-8 border-t border-white/40">
              <Button
                onClick={savePassword}
                disabled={loading || !token}
                variant="gradient"
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-emerald group-hover:scale-[1.02] transition-transform"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isOAuthUser ? 'Create Password' : 'Update Security'}
              </Button>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-panel rounded-[40px] p-8 sm:p-12 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-taja-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-taja-primary" />
              </div>
              <h2 className="text-2xl font-black text-taja-secondary tracking-tighter uppercase italic">
                Alerts <span className="text-taja-primary/40">•</span> Notifications
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: "Email alerts", sub: "Receipts & updates", state: notifyEmail, setState: setNotifyEmail },
                { label: "Push notifications", sub: "Real-time activity", state: notifyPush, setState: setNotifyPush },
                { label: "Order updates", sub: "Shipping tracking", state: notifyOrders, setState: setNotifyOrders }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between glass-card border-white/60 rounded-3xl px-6 py-5 hover:bg-white hover:border-taja-primary/20 transition-all group/item">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase tracking-[0.1em] text-taja-secondary group-hover/item:text-taja-primary transition-colors">{item.label}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.sub}</div>
                  </div>
                  <Switch checked={item.state} onCheckedChange={item.setState} />
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-end pt-8 border-t border-white/40">
              <Button
                onClick={saveNotifications}
                disabled={loading || !token}
                variant="gradient"
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-emerald group-hover:scale-[1.02] transition-transform"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Alert Rules'}
              </Button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 backdrop-blur-xl rounded-[40px] border-2 border-red-500/10 p-8 sm:p-12 group">
            <div className="flex items-center gap-3 mb-6 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Terminal <span className="text-red-500/40">•</span> Danger Zone</h2>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-red-500/70 mb-8 ml-1 leading-relaxed">
              Permanent process termination. Deleting your account will purge all associated neural data and storefront credentials.
            </p>
            <Button
              onClick={deleteAccount}
              disabled={loading || !token}
              variant="outline"
              className="h-14 px-8 rounded-2xl border-red-500/20 text-red-600 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-[0.98] shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Self-Destruct Account
            </Button>
          </section>
        </motion.div>
      </div>
    </div>
  );
}


