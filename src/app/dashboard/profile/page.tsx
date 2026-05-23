"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Edit,
  LogOut,
  Lock,
  Download,
  Trash2,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Bell,
  Fingerprint,
  UploadCloud,
  X,
  CreditCard,
  Target,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, uploadAvatar, uploadCoverPhoto } from "@/lib/api";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  job: z.string().optional(),
});

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  job?: string;
  avatar?: string;
  coverPhoto?: string;
  addresses: Array<{
    id: string;
    type: "home" | "work" | "other";
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    categories: string[];
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    phone: "",
    job: "",
    avatar: "",
    coverPhoto: "",
    addresses: [],
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      categories: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        let userData = user;

        if (!userData) {
          try {
            const response = await api("/api/users/me");
            userData = response?.data || response?.user || response;
          } catch (err) {
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            if (userStr) {
              try { userData = JSON.parse(userStr); } catch (_) { }
            }
          }
        }

        if (userData) {
          const userDataAny = userData as any;
          const avatarUrl = userDataAny.avatar || userDataAny.picture || userDataAny.avatarUrl || userDataAny.avatar_url || "";

          setProfile((prev) => ({
            ...prev,
            fullName: userDataAny.fullName || userDataAny.full_name || userDataAny.name || "",
            email: userDataAny.email || "",
            phone: userDataAny.phone || "",
            job: userDataAny.job || userDataAny.occupation || "",
            avatar: avatarUrl,
            coverPhoto: userDataAny.coverPhoto || userDataAny.cover_photo || "",
          }));
        }

        // Fetch addresses
        try {
          const addressesResponse = await api("/api/users/addresses");
          const addresses = addressesResponse?.data || addressesResponse || [];
          if (Array.isArray(addresses)) {
            setProfile((prev) => ({
              ...prev,
              addresses: addresses.map((addr: any) => ({
                id: addr._id || addr.id,
                type: addr.type || "home",
                street: addr.street || addr.address || "",
                city: addr.city || "",
                state: addr.state || "",
                postalCode: addr.postalCode || addr.postal_code || "",
                country: addr.country || "Nigeria",
                isDefault: addr.isDefault || addr.is_default || false,
              })),
            }));
          }
        } catch (_) { }

      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const validationResult = profileSchema.safeParse({
        fullName: profile.fullName,
        phone: profile.phone,
        job: profile.job,
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0]?.message || "Validation failed");
        setLoading(false);
        return;
      }

      const updateData = {
        fullName: profile.fullName,
        phone: profile.phone,
        job: profile.job,
        avatar: profile.avatar,
        coverPhoto: profile.coverPhoto,
      };

      await api("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      await refreshUser();
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (category: string, field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...(prev.preferences as any)[category],
          [field]: value,
        },
      },
    }));
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadCoverPhoto(file);
      setProfile((prev) => ({ ...prev, coverPhoto: url }));
      toast.success("Cover photo updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCover = () => {
    setProfile((prev) => ({ ...prev, coverPhoto: "" }));
    toast.success("Cover photo removed");
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file);
      await api("/api/users/avatar", {
        method: "POST",
        body: JSON.stringify({ avatarUrl: url }),
      });
      setProfile((prev) => ({ ...prev, avatar: url }));
      await refreshUser();
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await api("/api/users/avatar", { method: "DELETE" });
      setProfile((prev) => ({ ...prev, avatar: "" }));
      await refreshUser();
      toast.success("Profile picture removed");
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      setLoading(true);
      const res = await api("/api/users/export") as any;
      if (res?.success && res?.data) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `taja-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Your data has been downloaded");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to download data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all your data. This action cannot be undone.")) return;
    const confirmText = prompt('Type "DELETE" to authorize deletion:');
    if (confirmText !== "DELETE") return;

    try {
      setLoading(true);
      await api("/api/users/me", { method: "DELETE" });
      toast.success("Account deleted");
      logout();
      router.push("/");
    } catch (error: any) {
      toast.error(error?.message || "Termination failed");
      setLoading(false);
    }
  };

  if (loading && !profile.email) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-taja-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-taja-primary">Loading</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter">
              Account <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Information</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Account Information • Status: <span className="text-taja-secondary font-black uppercase tracking-widest text-[10px]">Active</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-6 h-12 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-8 h-12 rounded-full bg-taja-primary text-white text-[10px] font-black uppercase tracking-widest shadow-emerald hover:shadow-emerald-hover transition-all flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-8 h-12 rounded-full bg-taja-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-premium hover:shadow-premium-hover transition-all flex items-center gap-2"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Cinematic Header / Cover Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-48 md:h-64 rounded-[3rem] overflow-hidden border border-gray-100 shadow-huge group"
          >
            {profile.coverPhoto ? (
              <Image
                src={profile.coverPhoto}
                alt="Profile Cover"
                fill
                className="object-cover"
                unoptimized={profile.coverPhoto.startsWith("http")}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-slate-200" />
              </div>
            )}

            <AnimatePresence>
              {editing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center gap-4"
                >
                  <label className="px-6 h-12 rounded-full bg-white text-taja-secondary text-[10px] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-all flex items-center gap-2 cursor-pointer">
                    <UploadCloud className="w-4 h-4" /> Upload Cover
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverFileSelect} />
                  </label>
                  {profile.coverPhoto && (
                    <button
                      onClick={handleRemoveCover}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Identity Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-huge relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl -z-10" />

            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-taja-secondary/5 flex items-center justify-center text-taja-secondary">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-taja-secondary uppercase tracking-tight">Personal Information</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
              {/* Avatar Sector */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-premium ring-4 ring-taja-primary/5 transition-all duration-500 group-hover:scale-105">
                    {avatarUploading ? (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="h-8 w-8 rounded-full border-t-2 border-taja-primary animate-spin" />
                      </div>
                    ) : null}
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt="Profile Picture"
                        fill
                        className="object-cover"
                        unoptimized={profile.avatar.startsWith("http")}
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <User className="w-10 h-10 text-gray-200" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-premium border border-gray-100 flex items-center justify-center text-taja-secondary hover:text-taja-primary hover:scale-110 transition-all active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleAvatarFileSelect} accept="image/*" />
                </div>

                {profile.avatar && (
                  <button onClick={handleRemoveAvatar} className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-500 transition-colors">
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Data Sector */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      value={profile.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      disabled={!editing}
                      className="h-12 pl-12 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-[11px] font-bold uppercase tracking-widest transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      value={profile.email}
                      disabled
                      className="h-12 pl-12 rounded-2xl bg-gray-50 border-transparent text-[11px] font-bold tracking-widest opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      value={profile.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      disabled={!editing}
                      className="h-12 pl-12 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-[11px] font-bold tracking-widest transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Occupation / Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      value={profile.job || ""}
                      onChange={(e) => handleChange("job", e.target.value)}
                      disabled={!editing}
                      className="h-12 pl-12 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-[11px] font-bold uppercase tracking-widest transition-all"
                      placeholder="Your job title..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location Nodes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-huge"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-taja-primary/5 flex items-center justify-center text-taja-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-taja-secondary uppercase tracking-tight">My Addresses</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/addresses")}
                className="text-[10px] font-black uppercase tracking-widest text-taja-primary px-6 h-10 rounded-full border border-taja-primary/10 hover:bg-taja-primary/5 transition-all flex items-center gap-2"
              >
                Manage Addresses <ChevronRight className="w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.addresses.length > 0 ? (
                profile.addresses.map((addr) => (
                  <div key={addr.id} className="p-6 rounded-[2rem] bg-white shadow-sm border border-gray-100 relative group hover:border-taja-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-taja-primary/20 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-taja-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">{addr.type}</span>
                      {addr.isDefault && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Primary</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed mb-1 pr-10">{addr.street}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{addr.city}, {addr.state} • {addr.country}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">No addresses saved yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          {/* Neural Preferences */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-huge"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-taja-secondary uppercase tracking-tight">Notifications</h2>
            </div>

            <div className="space-y-6">
              {[
                { label: "Email Notifications", desc: "Get updates in your inbox", field: "email" },
                { label: "SMS Notifications", desc: "Get updates on your phone", field: "sms" },
                { label: "Push Notifications", desc: "Get notified in your browser", field: "push" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/40 transition-colors group">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-taja-secondary">{item.label}</h4>
                    <p className="text-[9px] font-medium text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    disabled={!editing}
                    onClick={() => handlePreferenceChange("notifications", item.field, !(profile.preferences.notifications as any)[item.field])}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${(profile.preferences.notifications as any)[item.field] ? "bg-taja-primary" : "bg-gray-200"
                      } ${!editing ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${(profile.preferences.notifications as any)[item.field] ? "left-7" : "left-1"
                      }`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security & Data Sector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-huge"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-taja-secondary uppercase tracking-tight">Account & Security</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/dashboard/settings")}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-taja-secondary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Security Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-taja-primary transition-all group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleDownloadData}
                disabled={loading}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-taja-secondary transition-colors">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">Download My Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-taja-primary transition-all group-hover:translate-x-1" />
              </button>

              <div className="pt-4 mt-4 border-t border-gray-50">
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-red-50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-300 group-hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 group-hover:text-red-600">Delete My Account</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
