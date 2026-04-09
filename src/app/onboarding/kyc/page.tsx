"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Briefcase,
  CreditCard,
  Sparkles,
  BadgeCheck,
  Fingerprint,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OnboardingNavbar } from "@/components/ui/OnboardingNavbar";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const STEPS = [
  { id: 1, label: "Business", icon: Briefcase },
  { id: 2, label: "Identity", icon: Shield },
  { id: 3, label: "Banking", icon: CreditCard },
];

const BUSINESS_TYPE_LABELS: Record<"individual" | "registered_business" | "cooperative", string> = {
  individual: "Individual",
  registered_business: "Registered Business",
  cooperative: "Cooperative",
};

function KYCPageContent() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<"not_started" | "pending" | "approved" | "rejected">("not_started");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "individual" as "individual" | "registered_business" | "cooperative",
    businessRegistrationNumber: "",
    idType: "national_id" as "national_id" | "drivers_license" | "passport" | "voters_card",
    idNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankVerificationNumber: "",
  });
  const [verificationStatus, setVerificationStatus] = useState<{
    verifying: boolean;
    verified: boolean;
    error?: string;
    data?: any;
  }>({ verifying: false, verified: false });
  const [allowPendingEdit, setAllowPendingEdit] = useState(false);

  useEffect(() => {
    const kyc = user?.kyc;
    if (kyc) {
      const status = kyc.status || "not_started";
      setKycStatus(status);
      if (status === "approved") { router.push("/seller/dashboard"); return; }
      setFormData((prev) => ({
        ...prev,
        businessName: kyc.businessName || "",
        businessType: (kyc.businessType as any) || "individual",
        businessRegistrationNumber: kyc.businessRegistrationNumber || "",
        idType: (kyc.idType as any) || "national_id",
        idNumber: kyc.idNumber || "",
        bankName: kyc.bankName || "",
        accountNumber: kyc.accountNumber || "",
        accountName: kyc.accountName || "",
        bankVerificationNumber: kyc.bankVerificationNumber || "",
      }));
    } else {
      setKycStatus("not_started");
    }
  }, [user, router]);

  useEffect(() => {
    if (kycStatus === "approved") router.replace("/seller/dashboard");
  }, [kycStatus, router]);

  const handleInputChange = (field: string, value: any) => {
    let nextValue = value;

    // Keep numeric bank fields strictly numeric to avoid hidden validation failures.
    if (field === "accountNumber" || field === "bankVerificationNumber") {
      nextValue = String(value || "").replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (field === "idType" || field === "idNumber") {
      setVerificationStatus({ verifying: false, verified: false });
    }
  };

  const handleVerifyIdentity = async () => {
    if (!formData.idNumber || formData.idNumber.length < 3) {
      toast.error("Please enter a valid ID number");
      return;
    }
    try {
      setVerificationStatus({ verifying: true, verified: false });
      const idTypeMap: Record<string, string> = {
        national_id: "nin",
        drivers_license: "drivers_license",
        passport: "passport",
        voters_card: "voters_card",
      };
      const response = await api("/api/verify/identity", {
        method: "POST",
        body: JSON.stringify({
          idType: idTypeMap[formData.idType] || formData.idType,
          idNumber: formData.idNumber,
          firstName: user?.fullName?.split(" ")[0],
          lastName: user?.fullName?.split(" ").slice(1).join(" "),
        }),
      });
      if (response?.success && response?.verified) {
        setVerificationStatus({ verifying: false, verified: true, data: response.data });
        toast.success("Identity verified!");
      } else {
        setVerificationStatus({ verifying: false, verified: false, error: response?.message || "Verification failed" });
        toast.error(response?.message || "Verification failed");
      }
    } catch (error: any) {
      setVerificationStatus({ verifying: false, verified: false, error: error.message || "Failed" });
      toast.error("Failed to verify identity");
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const normalized = {
        ...formData,
        businessName: formData.businessName.trim(),
        idNumber: formData.idNumber.trim(),
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        accountName: formData.accountName.trim(),
        bankVerificationNumber: formData.bankVerificationNumber.trim(),
      };

      const requiredChecks = [
        { key: "businessName", label: "Business Name", value: normalized.businessName },
        { key: "idType", label: "ID Type", value: normalized.idType },
        { key: "idNumber", label: "ID Number", value: normalized.idNumber },
        { key: "bankName", label: "Bank Name", value: normalized.bankName },
        { key: "accountNumber", label: "Account Number", value: normalized.accountNumber },
        { key: "accountName", label: "Account Name", value: normalized.accountName },
      ];

      const missingFields = requiredChecks
        .filter((field) => !field.value)
        .map((field) => field.label);

      if (missingFields.length > 0) {
        toast.error(`Missing required field(s): ${missingFields.join(", ")}`);
        return;
      }

      if (!/^\d{10}$/.test(normalized.accountNumber)) {
        toast.error("Account Number must be exactly 10 digits");
        return;
      }
      if (normalized.bankVerificationNumber && !/^\d{11}$/.test(normalized.bankVerificationNumber)) {
        toast.error("BVN must be exactly 11 digits");
        return;
      }

      const response = await api("/api/users/kyc/submit", {
        method: "POST",
        body: JSON.stringify({ ...normalized, status: "pending" }),
      });
      if (response?.success) {
        const previousBusinessType = (user?.kyc?.businessType || "individual") as "individual" | "registered_business" | "cooperative";
        const businessTypeChanged = !!user?.kyc?.businessType && previousBusinessType !== formData.businessType;

        if (businessTypeChanged) {
          toast.success(
            `Business type updated from ${BUSINESS_TYPE_LABELS[previousBusinessType]} to ${BUSINESS_TYPE_LABELS[formData.businessType]}.`
          );
        } else {
          toast.success("KYC submitted! We'll review it shortly.");
        }
        await refreshUser();
        setKycStatus("pending");
        setAllowPendingEdit(false);
      } else {
        toast.error(response?.message || "Failed to submit KYC");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); router.push("/"); };

  // ── Status screens ──
  if (kycStatus === "pending" && !allowPendingEdit) {
    return (
      <div className="min-h-screen">
        <OnboardingNavbar currentPageLabel="KYC Verification" user={user} onLogout={handleLogout} />
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 relative overflow-hidden">
          <div className="fixed inset-0 -z-10 bg-gradient-to-br from-taja-light via-white to-amber-50 motif-blanc" />
          <div className="fixed top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-amber-300/10 blur-3xl -z-10" />
          <div className="max-w-md w-full">
            <div className="glass-panel rounded-3xl p-10 text-center shadow-premium-hover">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-taja-secondary mb-3">Under Review</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your KYC information is being reviewed. We'll notify you via email once it has been approved — usually within 24–48 hours.
              </p>
              <div className="space-y-3">
                <Button
                  variant="gradient"
                  onClick={() => setAllowPendingEdit(true)}
                  className="w-full h-12 rounded-xl"
                >
                  Update Submission
                </Button>
                <Button variant="outline" onClick={() => router.push("/seller/dashboard")} className="w-full h-12 rounded-xl">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRejected = kycStatus === "rejected";

  return (
    <div className="min-h-screen">
      <OnboardingNavbar currentPageLabel="Seller Verification" user={user} onLogout={handleLogout} />

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-taja-light via-white to-emerald-50 motif-blanc" />
      <div className="fixed top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-taja-primary/10 blur-3xl animate-float -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[32rem] h-[32rem] rounded-full bg-emerald-200/10 blur-3xl -z-10" />

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-taja shadow-premium mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-taja-secondary to-taja-primary">
            Seller Verification
          </h1>
          <p className="text-gray-500 mt-2">
            Verify your identity to start selling on{" "}
            <span className="text-taja-primary font-semibold">Taja.Shop</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="overflow-x-auto pb-2 mb-8">
          <div className="min-w-[360px] flex items-center justify-center gap-0">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isDone ? "bg-taja-primary text-white shadow-premium" : isActive ? "bg-gradient-taja text-white shadow-premium scale-110" : "bg-white border-2 border-gray-200 text-gray-400"}`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1 text-[11px] font-semibold transition-colors ${isActive ? "text-taja-primary" : isDone ? "text-taja-primary/70" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-1 mb-5 transition-all duration-500 ${step > s.id ? "bg-taja-primary" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Rejection alert */}
        {isRejected && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">KYC Rejected</p>
              <p className="text-sm text-red-600 mt-0.5">{user?.kyc?.rejectionReason || "Your submission was rejected. Please review and resubmit."}</p>
            </div>
          </div>
        )}

        {/* Info note */}
        {!isRejected && (
          <div className="mb-6 p-4 rounded-2xl border border-taja-primary/20 bg-taja-light flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 text-taja-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-taja-secondary">
              <strong>Why we verify:</strong> Identity verification protects buyers, enables secure crypto payouts, and boosts your shop's credibility. All data is encrypted.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="glass-panel rounded-3xl p-5 sm:p-8 shadow-premium-hover">
          {/* ── Step 1: Business ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-taja-secondary mb-1">Business Information</h2>
                <p className="text-sm text-gray-500">Tell us about the business behind your shop.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-taja-secondary mb-2">Business Name <span className="text-taja-primary">*</span></label>
                <Input value={formData.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} placeholder="e.g., Amina Essentials" className="h-12 rounded-xl border-gray-200 focus:border-taja-primary" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1">Business Configuration <span className="text-taja-primary">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "individual", label: "Individual", sub: "Personal Seller", emoji: "👤", color: "bg-blue-50 text-blue-600" },
                    { value: "registered_business", label: "Registered", sub: "Legal Entity", emoji: "🏢", color: "bg-amber-50 text-amber-600" },
                    { value: "cooperative", label: "Cooperative", sub: "Group/Union", emoji: "🤝", color: "bg-purple-50 text-purple-600" },
                  ].map(({ value, label, sub, emoji, color }) => (
                    <button key={value} type="button" onClick={() => handleInputChange("businessType", value)}
                      className={`group relative flex flex-col items-start p-6 rounded-[32px] border-2 transition-all duration-300 ${formData.businessType === value
                        ? "border-taja-primary bg-white shadow-premium ring-4 ring-taja-primary/5"
                        : "border-gray-100 bg-white/50 hover:bg-white hover:border-taja-primary/30"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 ${formData.businessType === value ? 'bg-taja-primary text-white shadow-emerald' : color}`}>
                        {emoji}
                      </div>
                      <span className="text-sm font-black text-taja-secondary uppercase tracking-tight mb-1">{label}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</span>
                      {formData.businessType === value && (
                        <div className="absolute top-4 right-4">
                          <div className="w-5 h-5 rounded-full bg-taja-primary flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {formData.businessType !== "individual" && (
                <div>
                  <label className="block text-sm font-semibold text-taja-secondary mb-2">Registration Number</label>
                  <Input value={formData.businessRegistrationNumber} onChange={(e) => handleInputChange("businessRegistrationNumber", e.target.value)} placeholder="Enter registration number" className="h-12 rounded-xl border-gray-200 focus:border-taja-primary" />
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <Button variant="gradient" onClick={() => setStep(2)} className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Identity ── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-taja-secondary mb-1">Identity Verification</h2>
                <p className="text-sm text-gray-500">We verify against government databases using secure encrypted channels.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1">Identity Document <span className="text-taja-primary">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: "national_id", label: "NIN", emoji: "🪪", color: "bg-emerald-50 text-emerald-600" },
                    { value: "voters_card", label: "VIN", emoji: "🗳️", color: "bg-purple-50 text-purple-600" },
                  ].map(({ value, label, emoji, color }) => (
                    <button key={value} type="button" onClick={() => handleInputChange("idType", value)}
                      className={`group relative flex flex-col items-center p-6 rounded-[24px] border-2 transition-all duration-300 ${formData.idType === value
                        ? "border-taja-primary bg-white shadow-premium ring-4 ring-taja-primary/5"
                        : "border-gray-100 bg-white/50 hover:bg-white hover:border-taja-primary/30"}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 ${formData.idType === value ? 'bg-taja-primary text-white shadow-emerald' : color}`}>
                        {emoji}
                      </div>
                      <span className="text-sm font-black text-taja-secondary uppercase tracking-tight">{label}</span>
                      {formData.idType === value && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle className="h-5 w-5 text-taja-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-taja-secondary mb-2">ID Number <span className="text-taja-primary">*</span></label>
                <div className="flex gap-2">
                  <Input
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange("idNumber", e.target.value)}
                    placeholder={formData.idType === "national_id" ? "11-digit NIN" : "Enter VIN Number"}
                    className="flex-1 h-12 rounded-xl border-gray-200 focus:border-taja-primary"
                  />
                  <Button type="button" onClick={handleVerifyIdentity} disabled={!formData.idNumber || verificationStatus.verifying} variant="outline"
                    className={`px-4 rounded-xl h-12 whitespace-nowrap ${verificationStatus.verified ? "border-taja-primary text-taja-primary" : ""}`}>
                    {verificationStatus.verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : verificationStatus.verified ? "✓ Verified" : "Verify"}
                  </Button>
                </div>
                {verificationStatus.verified && (
                  <div className="mt-2 p-3 bg-taja-light border border-taja-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-taja-primary font-semibold">
                      <CheckCircle className="h-4 w-4" /> Identity verified!
                    </div>
                    {verificationStatus.data?.fullName && <p className="text-xs text-taja-secondary mt-1">Name: {verificationStatus.data.fullName}</p>}
                  </div>
                )}
                {verificationStatus.error && !verificationStatus.verifying && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-red-700"><XCircle className="h-4 w-4" />{verificationStatus.error}</div>
                    <p className="text-xs text-red-600 mt-1">You can still proceed — submission will require manual review.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2 rounded-xl h-12 px-6"><ChevronLeft className="h-4 w-4" />Back</Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    if (!formData.idNumber.trim()) {
                      toast.error("Please enter your ID number to continue");
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  Continue<ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Banking ── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-taja-secondary mb-1">Bank Account Details</h2>
                <p className="text-sm text-gray-500">Your payout account for sales proceeds.</p>
              </div>

              {[
                { field: "bankName", label: "Bank Name", placeholder: "e.g., GTBank, Access Bank", required: true, inputMode: "text", maxLength: undefined as number | undefined },
                { field: "accountNumber", label: "Account Number", placeholder: "10-digit NUBAN", required: true, inputMode: "numeric", maxLength: 10 },
                { field: "accountName", label: "Account Name", placeholder: "As on bank records", required: true, inputMode: "text", maxLength: undefined as number | undefined },
                { field: "bankVerificationNumber", label: "BVN", placeholder: "11-digit BVN (optional, but recommended)", required: false, inputMode: "numeric", maxLength: 11 },
              ].map(({ field, label, placeholder, required, inputMode, maxLength }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-taja-secondary mb-2">
                    {label} {required && <span className="text-taja-primary">*</span>}
                  </label>
                  <Input
                    value={(formData as any)[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={placeholder}
                    inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>["inputMode"]}
                    maxLength={maxLength}
                    className="h-12 rounded-xl border-gray-200 focus:border-taja-primary"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setStep(2)} className="flex items-center gap-2 rounded-xl h-12 px-6"><ChevronLeft className="h-4 w-4" />Back</Button>
                <Button variant="gradient" onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting…</> : <><Sparkles className="h-5 w-5" />Submit for Review</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Step {step} of {STEPS.length} — all information is encrypted and stored securely.
        </p>
      </div>
    </div>
  );
}

export default function KYCPage() {
  return (
    <ProtectedRoute requiredRole="seller">
      <KYCPageContent />
    </ProtectedRoute>
  );
}
