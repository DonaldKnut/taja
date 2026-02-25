"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { Home, MapPin, Pencil, Trash2, Star, X } from "lucide-react";
import { usersApi, getAuthToken } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/common";
import { normalizeApiResponse, transformAddress } from "@/lib/utils/apiResponse";
import { motion } from "framer-motion";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  type: "shipping" | "billing";
  isDefault?: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = getAuthToken();

  const emptyAddress: Address = {
    id: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "Nigeria",
    postalCode: "",
    type: "shipping",
    isDefault: addresses.length === 0,
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersApi.getAddresses();
        const normalized = normalizeApiResponse(res);
        const transformedAddresses = normalized.data.map(transformAddress);
        setAddresses(transformedAddresses);
      } catch (error: any) {
        console.error("Failed to fetch addresses:", error);
        // Fallback to localStorage only if API fails
        const raw = localStorage.getItem("addresses");
        if (raw) {
          try { setAddresses(JSON.parse(raw)); } catch { }
        }
      }
    };
    load();
  }, []);

  const startCreate = () => {
    setEditing({ ...emptyAddress, id: crypto.randomUUID?.() || Math.random().toString(36).slice(2) });
    setShowForm(true);
  };

  const startEdit = (addr: Address) => {
    setEditing({ ...addr });
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  const saveAddress = async () => {
    if (!editing) return;
    const required = ["fullName", "phone", "line1", "city", "state", "country"] as const;
    for (const k of required) {
      if (!(editing as any)[k]) {
        toast.error("Please complete all required fields");
        return;
      }
    }
    try {
      setSaving(true);

      const exists = addresses.some((a) => a.id === editing.id);

      if (exists) {
        await usersApi.updateAddress(editing.id, editing);
      } else {
        await usersApi.addAddress(editing);
      }

      const res = await usersApi.getAddresses();
      const normalized = normalizeApiResponse(res);
      setAddresses(normalized.data.map(transformAddress));

      toast.success("Address saved successfully");
      cancelForm();
    } catch (e: any) {
      console.error("Failed to save address:", e);
      toast.error(e?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (e: any) {
      console.error("Failed to remove address:", e);
      toast.error(e?.message || "Failed to remove address");
    }
  };

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const AddressCard = ({ a }: { a: Address }) => (
    <div className="group relative glass-card rounded-[2.5rem] p-8 border-white/60 shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl -z-10 group-hover:bg-taja-primary/10 transition-colors" />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-taja-secondary/5 border border-taja-secondary/10 text-taja-secondary flex items-center justify-center shrink-0 shadow-inner group-hover:bg-taja-primary group-hover:text-white transition-all duration-500">
            {a.type === "shipping" ? <MapPin className="h-6 w-6" /> : <Home className="h-6 w-6" />}
          </div>
          <div>
            <div className="text-xl font-black text-taja-secondary tracking-tight">{a.fullName}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{a.phone}</div>
          </div>
        </div>
        {a.isDefault && (
          <span className="inline-flex items-center gap-1.5 text-taja-primary bg-taja-primary/10 border border-taja-primary/20 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">
            <Star className="h-3 w-3 fill-taja-primary" /> Default Address
          </span>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500 font-medium space-y-1.5 leading-relaxed">
        <div className="text-taja-secondary font-bold">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
        <div>{a.city}, {a.state} {a.postalCode}</div>
        <div className="text-[10px] uppercase font-black tracking-widest text-gray-300">{a.country}</div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.2em]">{a.type} Address</div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          {!a.isDefault && (
            <button onClick={() => setDefault(a.id)} className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-50 text-gray-500 transition-all">Set Default</button>
          )}
          <button onClick={() => startEdit(a)} className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-50 text-taja-secondary transition-all">
            <Pencil className="h-3 w-3 text-taja-primary" /> Edit
          </button>
          <button onClick={() => removeAddress(a.id)} className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-red-50 hover:bg-red-50 text-red-500 transition-all">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter">
              My <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Addresses</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
            Manage your delivery addresses • {addresses.length} saved locations
          </p>
        </div>

        <Button
          onClick={startCreate}
          className="rounded-full px-8 h-12 shadow-premium hover:shadow-premium-hover transition-all text-[11px] font-black uppercase tracking-[0.2em]"
        >
          Add New Address
          <MapPin className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="glass-panel rounded-[3rem] p-24 text-center border-white/60 border-dashed">
          <div className="max-w-md mx-auto space-y-8">
            <div className="h-24 w-24 rounded-[2rem] bg-taja-light/30 flex items-center justify-center mx-auto mb-6 transform rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-inner">
              <MapPin className="w-10 h-10 text-taja-primary opacity-40" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-taja-secondary tracking-tight">No addresses found</h3>
              <p className="text-gray-400 font-medium text-base">Add your first delivery address to get started with your orders.</p>
            </div>
            <div className="pt-4">
              <Button onClick={startCreate} size="lg" className="rounded-full px-12 h-16 shadow-emerald hover:shadow-emerald-hover transition-all text-[11px] font-black uppercase tracking-[0.2em]">
                Add Address
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {addresses.map((a) => (
            <AddressCard key={a.id} a={a} />
          ))}
        </div>
      )}

      {/* Premium Drawer Form */}
      {showForm && editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-taja-secondary/60 backdrop-blur-md"
            onClick={cancelForm}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-huge p-8 md:p-12 overflow-y-auto max-h-[90vh] border border-white/40"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-taja-secondary tracking-tight">
                  {addresses.some(x => x.id === editing.id) ? "Edit" : "Add"} <span className="text-taja-primary">Address</span>
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enter your delivery details below</p>
              </div>
              <button onClick={cancelForm} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-taja-secondary hover:text-white transition-all shadow-sm">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid gap-10">
              <div className="space-y-8">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Full Name</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="e.g. John Doe"
                      value={editing.fullName}
                      onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Phone Number</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="e.g. +234 800 000 0000"
                      value={editing.phone}
                      onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-8">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Street Address</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="Enter your street address"
                      value={editing.line1}
                      onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Apartment, suite, etc. (optional)</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="Apt, Suite, Building, etc."
                      value={editing.line2 || ""}
                      onChange={(e) => setEditing({ ...editing, line2: e.target.value })}
                    />
                  </div>
                </div>

                {/* Region */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">City</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="City Name"
                      value={editing.city}
                      onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">State</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="State Name"
                      value={editing.state}
                      onChange={(e) => setEditing({ ...editing, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Postal Code</label>
                    <Input
                      className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-sm font-medium focus:ring-taja-primary/10 transition-all px-6"
                      placeholder="Optional"
                      value={editing.postalCode || ""}
                      onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="group col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-taja-secondary mb-3 ml-1 group-focus-within:text-taja-primary transition-colors">Address Type & Priority</label>
                    <div className="flex gap-4">
                      <select
                        className="flex-1 h-14 bg-gray-50/50 border-gray-100 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                        value={editing.type}
                        onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                      >
                        <option value="shipping">Shipping</option>
                        <option value="billing">Billing</option>
                      </select>
                      <label className="flex items-center gap-4 h-14 bg-gray-50/50 border-gray-100 rounded-2xl px-6 cursor-pointer hover:bg-white transition-all group/check shadow-sm min-w-[180px]">
                        <input
                          type="checkbox"
                          checked={!!editing.isDefault}
                          onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                          className="w-5 h-5 rounded-md border-gray-200 text-taja-primary focus:ring-taja-primary transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-taja-secondary group-hover/check:text-taja-primary transition-colors">Set as Default</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-gray-50">
                <Button
                  onClick={saveAddress}
                  disabled={saving}
                  size="lg"
                  className="flex-1 h-16 rounded-2xl shadow-premium text-[11px] font-black uppercase tracking-[0.2em]"
                >
                  {saving ? "Saving Changes..." : "Save Address"}
                </Button>
                <Button
                  onClick={cancelForm}
                  variant="outline"
                  size="lg"
                  className="h-16 rounded-2xl px-12 text-[10px] font-black uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


