"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { api, uploadLogisticsKycImage } from "@/lib/api";
import { toast } from "react-hot-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Camera, 
  Upload,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const VEHICLES = [
  { value: "bicycle", label: "Bicycle" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
] as const;

const CUSTOM_VEHICLE = "__custom__" as const;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function formatActiveHoursLabel(start: string, end: string): string {
  if (!start || !end) return "";
  return `${start} – ${end}`;
}

const ID_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "voters_card", label: "Voter's Card" },
];

export default function LogisticsApplyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingIdFront, setUploadingIdFront] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleSelect: "bicycle" as string,
    vehicleCustom: "",
    canHandleFragile: false,
    state: "",
    city: "",
    areas: "",
    availabilityStart: "08:00",
    availabilityEnd: "18:00",
    idType: "national_id",
    idNumber: "",
    selfieImage: "",
    idFrontImage: "",
    guarantorPhone: "",
    notes: "",
  });

  const resolvedVehicleType =
    form.vehicleSelect === CUSTOM_VEHICLE
      ? form.vehicleCustom.trim()
      : form.vehicleSelect;

  const availabilityValid =
    !!form.availabilityStart &&
    !!form.availabilityEnd &&
    timeToMinutes(form.availabilityEnd) > timeToMinutes(form.availabilityStart);

  const vehicleValid =
    form.vehicleSelect !== CUSTOM_VEHICLE ||
    (form.vehicleCustom.trim().length >= 2 && form.vehicleCustom.trim().length <= 80);

  const canProceedStep1 =
    !!form.fullName.trim() &&
    !!form.email.trim() &&
    !!form.phone.trim() &&
    !!form.state.trim() &&
    !!form.city.trim() &&
    !!form.areas.trim() &&
    availabilityValid &&
    vehicleValid &&
    !!resolvedVehicleType;

  const canProceedStep2 =
    form.idType &&
    form.idNumber.trim() &&
    form.selfieImage.trim() &&
    form.idFrontImage.trim();

  const handleImageUpload = async (
    file: File | undefined,
    kind: "selfieImage" | "idFrontImage"
  ) => {
    if (!file) return;
    try {
      if (kind === "selfieImage") setUploadingSelfie(true);
      if (kind === "idFrontImage") setUploadingIdFront(true);
      const url = await uploadLogisticsKycImage(file);
      setForm((prev) => ({ ...prev, [kind]: url }));
      toast.success(kind === "selfieImage" ? "Selfie uploaded" : "ID image uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload image");
    } finally {
      if (kind === "selfieImage") setUploadingSelfie(false);
      if (kind === "idFrontImage") setUploadingIdFront(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const activeHours = formatActiveHoursLabel(form.availabilityStart, form.availabilityEnd);
      const res = await api("/api/logistics/apply", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          vehicleType: resolvedVehicleType,
          canHandleFragile: form.canHandleFragile,
          state: form.state,
          city: form.city,
          areas: form.areas,
          activeHours,
          idType: form.idType,
          idNumber: form.idNumber,
          selfieImage: form.selfieImage,
          idFrontImage: form.idFrontImage,
          guarantorPhone: form.guarantorPhone,
          notes: form.notes,
        }),
      });
      if (res?.success) {
        toast.success("Application submitted. We will verify and activate your profile soon.");
        setForm({
          fullName: "",
          email: "",
          phone: "",
          vehicleSelect: "bicycle",
          vehicleCustom: "",
          canHandleFragile: false,
          state: "",
          city: "",
          areas: "",
          availabilityStart: "08:00",
          availabilityEnd: "18:00",
          idType: "national_id",
          idNumber: "",
          selfieImage: "",
          idFrontImage: "",
          guarantorPhone: "",
          notes: "",
        });
        setStep(1);
      } else {
        toast.error(res?.message || "Failed to submit application");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen motif-blanc py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-gradient-premium mb-4">
            Join Our Logistics Network
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            Become a partner and start earning. We welcome everyone from bicycle riders to truck drivers.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Already have rider access from operations?{" "}
            <Link href="/logistics/login" className="text-emerald-700 font-bold hover:underline">
              Rider sign-in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-card p-4 sm:p-5 rounded-[1.75rem]">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    step >= idx ? "bg-taja-primary" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Step {step} of 3
            </p>
          </div>

          {step === 1 && (
            <>
          {/* Section: Personal Info */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-taja-primary/10 flex items-center justify-center text-taja-primary">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="fullName"
                    required
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="email"
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="phone"
                    required
                    placeholder="+234 ..."
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guarantorPhone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Guarantor Phone</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="guarantorPhone"
                    placeholder="Emergency contact"
                    value={form.guarantorPhone}
                    onChange={(e) => setForm((p) => ({ ...p, guarantorPhone: e.target.value }))}
                    className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-bold">Service Area</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-slate-500">State</Label>
                <Input
                  id="state"
                  required
                  placeholder="Lagos"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  className="h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-500">City</Label>
                <Input
                  id="city"
                  required
                  placeholder="Ikeja"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="areas" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Coverage Areas <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <Textarea
                    id="areas"
                    required
                    placeholder="Enter areas separated by commas (e.g. Lekki, Victoria Island, Ajah)"
                    value={form.areas}
                    onChange={(e) => setForm((p) => ({ ...p, areas: e.target.value }))}
                    className="pl-10 min-h-[100px] bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Vehicle & Capacity */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Truck size={20} />
              </div>
              <h2 className="text-xl font-bold">Vehicle & Capacity</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Type</Label>
                <div className="relative max-w-xl">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-[1]" size={18} />
                  <select
                    value={form.vehicleSelect}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        vehicleSelect: e.target.value,
                        ...(e.target.value !== CUSTOM_VEHICLE ? { vehicleCustom: "" } : {}),
                      }))
                    }
                    className="w-full pl-10 h-12 bg-white/50 border border-slate-200/60 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-taja-primary/30 transition-all appearance-none cursor-pointer"
                  >
                    {VEHICLES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                    <option value={CUSTOM_VEHICLE}>Other — describe my vehicle</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
                {form.vehicleSelect === CUSTOM_VEHICLE && (
                  <div className="mt-3 space-y-2 max-w-xl">
                    <Label htmlFor="vehicleCustom" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your vehicle (required)
                    </Label>
                    <Input
                      id="vehicleCustom"
                      placeholder="e.g. Keke NAPEP, pickup, cargo trike…"
                      value={form.vehicleCustom}
                      onChange={(e) => setForm((p) => ({ ...p, vehicleCustom: e.target.value }))}
                      maxLength={80}
                      className="h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                    />
                    <p className="text-[11px] text-slate-500">2–80 characters. We&apos;ll review with your application.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability</Label>
                <p className="text-[11px] text-slate-500 mb-2">Pick your usual on-duty window (24-hour times).</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="availabilityStart" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      From
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <Input
                        id="availabilityStart"
                        type="time"
                        value={form.availabilityStart}
                        onChange={(e) => setForm((p) => ({ ...p, availabilityStart: e.target.value }))}
                        className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="availabilityEnd" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      To
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <Input
                        id="availabilityEnd"
                        type="time"
                        value={form.availabilityEnd}
                        onChange={(e) => setForm((p) => ({ ...p, availabilityEnd: e.target.value }))}
                        className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
                {form.availabilityStart && form.availabilityEnd && !availabilityValid && (
                  <p className="text-xs font-semibold text-amber-700 mt-1">End time must be after start time.</p>
                )}
                {availabilityValid && (
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    Saved as: <span className="text-taja-primary font-bold">{formatActiveHoursLabel(form.availabilityStart, form.availabilityEnd)}</span>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                <Checkbox
                  id="fragile"
                  checked={form.canHandleFragile}
                  onCheckedChange={(val) => setForm((p) => ({ ...p, canHandleFragile: !!val }))}
                  className="mt-1 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div>
                  <Label htmlFor="fragile" className="text-sm font-bold text-blue-900 cursor-pointer">Fragile Handling</Label>
                  <p className="text-xs text-blue-700 mt-1">I have the necessary experience and equipment to handle fragile items safely.</p>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {step === 2 && (
            <>
          {/* Section: ID Verification */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-bold">Identity Verification</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Type</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <select
                    value={form.idType}
                    onChange={(e) => setForm((p) => ({ ...p, idType: e.target.value }))}
                    className="w-full pl-10 h-12 bg-white/50 border border-slate-200/60 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-taja-primary/30 transition-all appearance-none cursor-pointer"
                  >
                    {ID_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="idNumber"
                    placeholder="Enter number"
                    value={form.idNumber}
                    onChange={(e) => setForm((p) => ({ ...p, idNumber: e.target.value }))}
                    className="pl-10 h-12 bg-white/50 border-slate-200/60 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {/* Selfie Upload */}
                <div className="space-y-4">
                  <Label className="text-sm font-bold">Selfie Photo</Label>
                  <div 
                    className={cn(
                      "relative group cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 aspect-video flex flex-col items-center justify-center gap-2",
                      form.selfieImage ? "border-emerald-500/50 bg-emerald-50/30" : "border-slate-200 bg-slate-50/50 hover:border-taja-primary/50 hover:bg-white"
                    )}
                  >
                    {form.selfieImage ? (
                      <>
                        <img src={form.selfieImage} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs font-bold">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-taja-primary transition-colors">
                          <Camera size={24} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Capture or Upload</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], "selfieImage")}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingSelfie}
                    />
                    {uploadingSelfie && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-taja-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-taja-primary uppercase">Uploading</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Front Upload */}
                <div className="space-y-4">
                  <Label className="text-sm font-bold">ID Front Side</Label>
                  <div 
                    className={cn(
                      "relative group cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 aspect-video flex flex-col items-center justify-center gap-2",
                      form.idFrontImage ? "border-emerald-500/50 bg-emerald-50/30" : "border-slate-200 bg-slate-50/50 hover:border-taja-primary/50 hover:bg-white"
                    )}
                  >
                    {form.idFrontImage ? (
                      <>
                        <img src={form.idFrontImage} alt="ID Front" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs font-bold">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-taja-primary transition-colors">
                          <Upload size={24} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload ID Document</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0], "idFrontImage")}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingIdFront}
                    />
                    {uploadingIdFront && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-taja-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-taja-primary uppercase">Uploading</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {step === 3 && (
            <>
          {/* Section: Notes */}
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-600">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-bold">Additional Notes</h2>
            </div>
            
            <Textarea
              rows={4}
              placeholder="Tell us anything else we should know..."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-[120px] bg-white/50 border-slate-200/60 focus:bg-white transition-all rounded-3xl"
            />
          </div>
            </>
          )}

          {/* Submit */}
          <div className="flex flex-col items-center gap-6 pt-4 pb-12">
            <div className="flex items-center gap-2 text-slate-500 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50">
              <Info size={14} className="text-taja-primary" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Soft KYC verification takes 24-48 hours</p>
            </div>
            
            <div className="flex items-center justify-between w-full max-w-xl gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
                disabled={step === 1 || submitting}
                className="h-14 px-8 rounded-full font-black text-xs uppercase tracking-[0.2em]"
              >
                Back
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep((prev) => ((prev + 1) as 1 | 2 | 3))}
                  disabled={
                    submitting ||
                    uploadingSelfie ||
                    uploadingIdFront ||
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                  title={
                    step === 1 && !canProceedStep1
                      ? "Fill all required fields on this step to continue"
                      : step === 2 && !canProceedStep2
                        ? "Complete ID verification to continue"
                        : undefined
                  }
                  className="btn-premium h-14 px-8 rounded-full bg-taja-primary text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-45 disabled:pointer-events-none"
                >
                  Continue
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting || uploadingSelfie || uploadingIdFront}
                  className="btn-premium h-16 px-12 rounded-full bg-taja-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-taja-primary/20 hover:shadow-2xl hover:shadow-taja-primary/40 flex items-center gap-3 group"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

