"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Camera,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface VerificationData {
  nin: string;
  businessName?: string;
  businessAddress?: string;
  businessType: "individual" | "business";
  documents: {
    ninImage?: File;
    selfie?: File;
    businessRegistration?: File;
    utilityBill?: File;
  };
}

const STEPS = [
  { id: 0, label: "Identity", icon: Shield },
  { id: 1, label: "Selfie", icon: Camera },
  { id: 2, label: "Documents", icon: FileText },
];

const verificationSteps = [
  { id: "nin", title: "National Identity Number (NIN)", description: "Verify your identity with your NIN", completed: false, required: true },
  { id: "selfie", title: "Selfie Verification", description: "Take a clear selfie for identity confirmation", completed: false, required: true },
  { id: "documents", title: "Supporting Documents", description: "Upload additional verification documents", completed: false, required: false },
];

const SELLER_BUSINESS_TYPE_LABELS = {
  individual: "Individual",
  registered_business: "Registered Business",
} as const;

// Helper: Custom UploadZone for premium redesign
const UploadZone = ({ type, label, uploaded, onUpload }: { type: keyof VerificationData["documents"]; label: string; uploaded?: File; onUpload: (file: File) => void }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">{label}</label>
    <label className={`relative flex flex-col items-center justify-center h-40 rounded-[32px] border-2 border-dashed cursor-pointer transition-all duration-500 overflow-hidden ${uploaded
      ? "border-taja-primary bg-taja-primary/5 shadow-inner"
      : "border-white/60 bg-white/20 hover:border-taja-primary/40 hover:bg-white/40"
      }`}>
      <input type="file" accept="image/*" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }} />
      {uploaded ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-taja-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle className="h-8 w-8 text-taja-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-taja-primary">Securely Uploaded</span>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-white group-hover:bg-taja-primary/10 transition-colors">
            <Upload className="h-6 w-6 text-gray-400 group-hover:text-taja-primary" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-taja-primary">Initiate Upload</span>
        </div>
      )}
      {uploaded && (
        <div className="absolute top-3 right-3">
          <Sparkles className="h-4 w-4 text-taja-primary/30 animate-pulse" />
        </div>
      )}
    </label>
  </div>
);

export default function SellerVerificationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData>({ nin: "", businessType: "individual", documents: {} });
  const [steps, setSteps] = useState(verificationSteps);
  const [ninValidation, setNinValidation] = useState<{ isValid?: boolean; data?: any; loading?: boolean }>({});

  useEffect(() => {
    const kyc = (user as any)?.kyc;
    if (!kyc) return;
    setVerificationData((prev) => ({
      ...prev,
      businessType: kyc.businessType && kyc.businessType !== "individual" ? "business" : "individual",
      businessName: kyc.businessName || prev.businessName,
      businessAddress: kyc.businessAddress?.addressLine1 || prev.businessAddress,
      nin: kyc.idType === "national_id" ? (kyc.idNumber || prev.nin) : prev.nin,
    }));
  }, [user]);

  useEffect(() => {
    if (user?.accountStatus === "under_review") {
      toast.error("Your account is under review. Verification is temporarily unavailable.");
      router.replace("/seller/dashboard");
    }
  }, [user?.accountStatus, router]);

  const updateStepCompletion = (stepId: string, completed: boolean) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, completed } : s)));
  };

  const validateNIN = async (nin: string) => {
    if (nin.length !== 11) {
      setNinValidation({ isValid: false });
      return;
    }
    setNinValidation({ loading: true });
    try {
      const nameParts = (user?.fullName || "").trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;
      const response = await api("/api/verify/identity", {
        method: "POST",
        body: JSON.stringify({
          idType: "nin",
          idNumber: nin,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      }) as { success?: boolean; verified?: boolean; data?: { fullName?: string; dateOfBirth?: string; gender?: string }; message?: string };
      const verified = response?.success && response?.verified;
      setNinValidation({
        isValid: verified,
        data: response?.data,
        loading: false,
      });
      if (verified) {
        updateStepCompletion("nin", true);
        toast.success("NIN verified successfully!");
      } else {
        toast.error(response?.message || "NIN verification failed. Please check the number and try again.");
      }
    } catch (err: any) {
      setNinValidation({ isValid: false, loading: false });
      toast.error(err?.message || "NIN verification failed");
    }
  };

  const handleNINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nin = e.target.value.replace(/\D/g, "").slice(0, 11);
    setVerificationData((prev) => ({ ...prev, nin }));
    if (nin.length === 11) {
      validateNIN(nin);
    } else {
      setNinValidation({});
      updateStepCompletion("nin", false);
    }
  };

  const handleFileUpload = async (file: File, type: keyof VerificationData["documents"]) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) { toast.error("Please upload JPG or PNG"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be less than 5MB"); return; }
    setVerificationData((prev) => ({ ...prev, documents: { ...prev.documents, [type]: file } }));
    if (type === "selfie") updateStepCompletion("selfie", true);
    else updateStepCompletion("documents", true);
    toast.success("Document uploaded!");
  };

  const capturePhoto = async (type: keyof VerificationData["documents"]) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setTimeout(() => {
          context?.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) { const file = new File([blob], `${type}-${Date.now()}.jpg`, { type: "image/jpeg" }); handleFileUpload(file, type); }
            stream.getTracks().forEach((track) => track.stop());
          }, "image/jpeg", 0.8);
        }, 3000);
      };
    } catch { toast.error("Camera access denied or not available"); }
  };

  const submitVerification = async () => {
    const requiredSteps = steps.filter((s) => s.required);
    const incompleteSteps = requiredSteps.filter((s) => !s.completed);
    if (incompleteSteps.length > 0) { toast.error("Please complete all required verification steps"); return; }
    if (verificationData.businessType === "business" && !verificationData.businessName?.trim()) {
      toast.error("Business name is required for business accounts");
      return;
    }
    if (!verificationData.nin || verificationData.nin.length !== 11) {
      toast.error("NIN must be 11 digits");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/users/kyc/submit", {
        method: "POST",
        body: JSON.stringify({
          businessName: verificationData.businessName?.trim() || (verificationData.businessType === "business" ? "Business Account" : user?.fullName || "Individual Seller"),
          businessType: verificationData.businessType === "business" ? "registered_business" : "individual",
          businessRegistrationNumber: undefined,
          idType: "national_id",
          idNumber: verificationData.nin,
          bankName: "Pending",
          accountNumber: "0000000000",
          accountName: (user?.fullName || "Pending").trim(),
          bankVerificationNumber: undefined, // optional
        }),
      });
      if (data.success) {
        const nextBusinessType = verificationData.businessType === "business" ? "registered_business" : "individual";
        const previousBusinessType = ((user as any)?.kyc?.businessType || "individual") as "individual" | "registered_business";
        const businessTypeChanged = !!(user as any)?.kyc?.businessType && previousBusinessType !== nextBusinessType;

        if (businessTypeChanged) {
          toast.success(
            `Business type updated from ${SELLER_BUSINESS_TYPE_LABELS[previousBusinessType]} to ${SELLER_BUSINESS_TYPE_LABELS[nextBusinessType]}.`
          );
        } else {
          toast.success("Verification submitted! We'll review within 24–48 hours.");
        }
        window.location.href = "/seller/dashboard?verification=pending";
      } else {
        toast.error(data.message || "Verification submission failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit verification");
    } finally { setLoading(false); }
  };


  if (user?.accountStatus === "under_review") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white selection:bg-taja-primary/30 relative overflow-hidden font-jakarta">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-taja-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-motif-blanc opacity-40" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-16 relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 sm:mb-16"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-taja-secondary tracking-tighter leading-tight uppercase italic mb-3">
              Become a <span className="text-taja-primary">Verified Seller</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-md">
              Verify your identity to start selling securely and receive payouts on Taja.
            </p>
          </div>
          <Link href="/seller/dashboard">
            <Button variant="outline" className="h-12 sm:h-14 px-5 sm:px-8 rounded-2xl font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[10px] border-white/60 bg-white/20 backdrop-blur-xl group hover:border-taja-primary/40 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr,350px] gap-6 sm:gap-10 lg:gap-12 items-start">
          <div className="space-y-8">
            <div className="glass-panel rounded-[28px] sm:rounded-[40px] p-4 sm:p-8 lg:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-3xl rounded-full -mr-32 -mt-32" />

              {/* Step indicator */}
              <div className="overflow-x-auto pb-3 mb-10 sm:mb-16 relative z-10">
                <div className="min-w-[320px] flex items-center justify-center gap-0">
                {STEPS.map((s, idx) => {
                  const StepIcon = s.icon;
                  const isActive = currentStep === s.id;
                  const isDone = steps[s.id]?.completed;
                  return (
                    <div key={s.id} className="flex items-center">
                      <div className="flex flex-col items-center group/step">
                        <div
                          className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500 ${isDone
                            ? "bg-taja-primary text-white shadow-emerald"
                            : isActive
                              ? "bg-gradient-to-br from-taja-primary to-emerald-400 text-white shadow-premium scale-110"
                              : "bg-white border-2 border-white/60 text-gray-300"
                            }`}
                        >
                          {isDone ? <CheckCircle className="h-6 w-6" /> : <StepIcon className={`h-6 w-6 ${isActive ? 'animate-pulse' : ''}`} />}
                        </div>
                        <span
                          className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? "text-taja-primary" : isDone ? "text-taja-primary/70" : "text-gray-400"
                            }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && <div className={`w-10 sm:w-20 lg:w-24 h-[2px] mx-1 sm:mx-2 mb-8 transition-all duration-700 ${isDone ? "bg-taja-primary" : "bg-white/40"}`} />}
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Step Content */}
              <div className="relative z-10">
                {/* ── Step 0: NIN ── */}
                {currentStep === 0 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="space-y-10"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-taja-secondary mb-3 tracking-tighter uppercase italic">Identity Verification</h2>
                      <p className="text-gray-500 font-medium">Enter your 11-digit National Identity Number to verify your profile.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">NIN Number <span className="text-taja-primary">*</span></label>
                      <input
                        type="text"
                        value={verificationData.nin}
                        onChange={handleNINChange}
                        placeholder="•••• •••• •••"
                        maxLength={11}
                        className="w-full h-16 px-6 rounded-2xl border-white/60 bg-white/40 backdrop-blur-sm focus:bg-white focus:border-taja-primary uppercase text-2xl tracking-[0.3em] font-black text-taja-secondary placeholder:text-gray-200 transition-all shadow-inner"
                      />
                      {ninValidation.loading && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white/40 rounded-xl text-[11px] font-black uppercase tracking-widest text-taja-primary animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin" /> Verifying NIN…
                        </div>
                      )}
                      {ninValidation.isValid === true && (
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                          <div className="flex items-center gap-3 text-emerald-600 text-xs font-black uppercase tracking-widest">
                            <CheckCircle className="h-4 w-4" /> NIN Verified Successfully
                          </div>
                          {ninValidation.data && (
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Legal Name</div>
                                <div className="text-[11px] font-bold text-taja-secondary">{ninValidation.data.fullName}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</div>
                                <div className="text-[11px] font-bold text-taja-secondary">{ninValidation.data.dateOfBirth}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {ninValidation.isValid === false && (
                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-red-600">
                          <AlertCircle className="h-4 w-4" /> Invalid NIN. Please check the number.
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Account Type <span className="text-taja-primary">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { value: "individual", label: "Individual", sub: "Personal Account", icon: User },
                          { value: "business", label: "Business", sub: "Registered Business", icon: Shield },
                        ].map((mode) => (
                          <button key={mode.value} type="button"
                            onClick={() => setVerificationData((p) => ({ ...p, businessType: mode.value as any }))}
                            className={`flex flex-col items-start p-6 rounded-3xl border-2 transition-all group ${verificationData.businessType === mode.value
                              ? "border-taja-primary bg-white shadow-premium"
                              : "border-white/60 bg-white/20 hover:border-taja-primary/40 hover:bg-white/40"
                              }`}>
                            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors ${verificationData.businessType === mode.value ? "bg-taja-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-taja-primary/10 group-hover:text-taja-primary"
                              }`}>
                              <mode.icon className="h-5 w-5" />
                            </div>
                            <p className="font-black text-taja-secondary text-[11px] uppercase tracking-widest mb-1">{mode.label}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{mode.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {verificationData.businessType === "business" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="space-y-6 pt-4 border-t border-white/40"
                      >
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Entity Name <span className="text-taja-primary">*</span></label>
                          <input type="text" value={verificationData.businessName || ""} onChange={(e) => setVerificationData((p) => ({ ...p, businessName: e.target.value }))}
                            placeholder="Enter business name"
                            className="w-full h-14 px-6 rounded-2xl border-white/60 bg-white/40 focus:bg-white transition-all font-medium" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Registered Address <span className="text-taja-primary">*</span></label>
                          <textarea rows={3} value={verificationData.businessAddress || ""} onChange={(e) => setVerificationData((p) => ({ ...p, businessAddress: e.target.value }))}
                            placeholder="Full headquarter address"
                            className="w-full px-6 py-4 rounded-2xl border-white/60 bg-white/40 focus:bg-white transition-all font-medium resize-none" />
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-8 border-t border-white/40">
                      <Button variant="gradient"
                        onClick={() => setCurrentStep(1)}
                        disabled={steps[0].required && !steps[0].completed}
                        className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-emerald hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                        Continue to Selfie <ArrowRight className="h-4 w-4" />
                      </Button>
                      {steps[0].required && !steps[0].completed && (
                        <p className="text-center text-[9px] font-black uppercase tracking-widest text-gray-400 mt-4">NIN Verification Required to Continue</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 1: Selfie ── */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="space-y-10"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-taja-secondary mb-3 tracking-tighter uppercase italic">Selfie Verification</h2>
                      <p className="text-gray-500 font-medium">Take a clear photo of yourself to confirm your identity.</p>
                    </div>

                    <div className="flex flex-col items-center gap-8 py-10">
                      <div className="relative">
                        <div className="w-48 h-48 rounded-[60px] bg-white border-4 border-white/80 shadow-premium overflow-hidden flex items-center justify-center group/scan">
                          {verificationData.documents.selfie ? (
                            <div className="relative w-full h-full">
                              <CheckCircle className="absolute inset-0 m-auto h-20 w-20 text-taja-primary z-10" />
                              <div className="w-full h-full bg-taja-primary/5 animate-pulse" />
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <Camera className="h-16 w-16 text-gray-200 group-hover/scan:text-taja-primary transition-colors" />
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">Ready for Photo</div>
                            </div>
                          )}
                        </div>
                        <div className="absolute -inset-4 border border-taja-primary/20 rounded-[70px] animate-slow-spin pointer-events-none" />
                      </div>

                      {verificationData.documents.selfie && (
                        <div className="px-6 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Biometric Signature Recorded ✓
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button type="button" variant="outline" onClick={() => capturePhoto("selfie")} className="h-24 flex-col gap-3 rounded-[32px] border-white/60 bg-white/40 hover:border-taja-primary/40 group">
                        <Camera className="h-8 w-8 text-gray-400 group-hover:text-taja-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Open Camera</span>
                      </Button>
                      <label className="flex flex-col items-center justify-center h-24 rounded-[32px] border-2 border-dashed border-white/60 bg-white/20 cursor-pointer hover:border-taja-primary hover:bg-white/60 transition-all gap-3 group">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "selfie"); }} />
                        <Upload className="h-8 w-8 text-gray-400 group-hover:text-taja-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Media</span>
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-8 border-t border-white/40">
                      <Button variant="outline" onClick={() => setCurrentStep(0)} className="h-14 sm:h-16 px-8 rounded-2xl border-white/60 font-black uppercase tracking-widest text-[10px]">Back</Button>
                      <Button variant="gradient" onClick={() => setCurrentStep(2)}
                        disabled={steps[1].required && !steps[1].completed}
                        className="flex-1 h-14 sm:h-16 rounded-[24px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[11px] shadow-emerald hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                        Upload Documents <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Documents ── */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="space-y-10"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-taja-secondary mb-3 tracking-tighter uppercase italic">Document Upload</h2>
                      <p className="text-gray-500 font-medium">Upload supporting documents to complete your verification.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <UploadZone type="ninImage" label="NIN Credential" uploaded={verificationData.documents.ninImage} onUpload={(file) => handleFileUpload(file, "ninImage")} />
                      <UploadZone type="utilityBill" label="Residency Proof" uploaded={verificationData.documents.utilityBill} onUpload={(file) => handleFileUpload(file, "utilityBill")} />
                      {verificationData.businessType === "business" && (
                        <div className="col-span-2">
                          <UploadZone type="businessRegistration" label="Corporate Charter (CAC)" uploaded={verificationData.documents.businessRegistration} onUpload={(file) => handleFileUpload(file, "businessRegistration")} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-8 border-t border-white/40">
                      <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-14 sm:h-16 px-8 rounded-2xl border-white/60 font-black uppercase tracking-widest text-[10px]">Back</Button>
                      <Button variant="gradient" onClick={submitVerification} disabled={loading || steps.some((s) => s.required && !s.completed)}
                        className="flex-1 h-14 sm:h-16 rounded-[24px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[11px] shadow-emerald hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Sparkles className="h-5 w-5" /> Submit Verification</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            <div className="glass-panel rounded-[32px] p-8 border-taja-primary/20 bg-taja-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/10 blur-2xl rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <AlertCircle className="h-5 w-5 text-taja-primary" />
                <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest">Verification Info</h3>
              </div>
              <ul className="space-y-5 relative z-10">
                {[
                  "Processing: 24–48 Business Hours",
                  "Get a Verified Badge",
                  "Full Shipping Access",
                  "Secure Identity Protection"
                ].map((intel, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-taja-primary shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-relaxed">{intel}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-[32px] p-6 text-center border-white/60">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                Phase Progress: {currentStep + 1} / {STEPS.length}
              </p>
              <div className="w-full h-1 bg-white/40 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-taja-primary to-emerald-400 transition-all duration-700 shadow-emerald"
                  style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

