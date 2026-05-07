"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, uploadProductImage } from "@/lib/api";
import { toast } from "react-hot-toast";

const VEHICLES = [
  { value: "bicycle", label: "Bicycle" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
];

export default function LogisticsApplyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingIdFront, setUploadingIdFront] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleType: "bicycle",
    canHandleFragile: false,
    state: "",
    city: "",
    areas: "",
    activeHours: "",
    idType: "national_id",
    idNumber: "",
    selfieImage: "",
    idFrontImage: "",
    guarantorPhone: "",
    notes: "",
  });

  const handleImageUpload = async (
    file: File | undefined,
    kind: "selfieImage" | "idFrontImage"
  ) => {
    if (!file) return;
    try {
      if (kind === "selfieImage") setUploadingSelfie(true);
      if (kind === "idFrontImage") setUploadingIdFront(true);
      const url = await uploadProductImage(file);
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
      const res = await api("/api/logistics/apply", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res?.success) {
        toast.success("Application submitted. We will verify and activate your profile soon.");
        setForm((prev) => ({
          ...prev,
          notes: "",
          idNumber: "",
        }));
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Apply as a logistics partner
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Bicycle riders are welcome. Soft KYC is required before assignment access.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            required
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <select
            value={form.vehicleType}
            onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          >
            {VEHICLES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            required
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            placeholder="Coverage areas (comma separated)"
            value={form.areas}
            onChange={(e) => setForm((p) => ({ ...p, areas: e.target.value }))}
            className="sm:col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            placeholder="Active hours (e.g. 8AM - 7PM)"
            value={form.activeHours}
            onChange={(e) => setForm((p) => ({ ...p, activeHours: e.target.value }))}
            className="sm:col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <select
            value={form.idType}
            onChange={(e) => setForm((p) => ({ ...p, idType: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          >
            <option value="national_id">National ID</option>
            <option value="drivers_license">Driver&apos;s License</option>
            <option value="passport">Passport</option>
            <option value="voters_card">Voter&apos;s Card</option>
          </select>
          <input
            placeholder="ID number"
            value={form.idNumber}
            onChange={(e) => setForm((p) => ({ ...p, idNumber: e.target.value }))}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Selfie photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0], "selfieImage")}
                className="mt-1 block w-full text-xs"
              />
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {uploadingSelfie ? "Uploading..." : form.selfieImage ? "Uploaded" : "Not uploaded"}
              </p>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Government ID front</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0], "idFrontImage")}
                className="mt-1 block w-full text-xs"
              />
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {uploadingIdFront ? "Uploading..." : form.idFrontImage ? "Uploaded" : "Not uploaded"}
              </p>
            </label>
          </div>
          <input
            placeholder="Guarantor phone (recommended)"
            value={form.guarantorPhone}
            onChange={(e) => setForm((p) => ({ ...p, guarantorPhone: e.target.value }))}
            className="sm:col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.canHandleFragile}
              onChange={(e) => setForm((p) => ({ ...p, canHandleFragile: e.target.checked }))}
            />
            I can handle fragile packages
          </label>
          <textarea
            rows={4}
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="h-11 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">
              {submitting ? "Submitting..." : "Submit logistics application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
