"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Shield, Zap, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface PaymentsSettings {
  platformFeePercentage: number;
  autoReleaseDays: number;
}

export default function AdminPaymentsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentsSettings>({
    platformFeePercentage: 5,
    autoReleaseDays: 7,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api("/api/admin/settings/payments");
        if (res?.success && res?.data?.payments) {
          setSettings(res.data.payments as PaymentsSettings);
        }
      } catch (e: any) {
        console.error("Failed to load payment settings", e);
        toast.error(e?.message || "Failed to load payment settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api("/api/admin/settings/payments", {
        method: "PUT",
        body: JSON.stringify({ payments: settings }),
      });
      if (res?.success) {
        toast.success("Payment settings updated");
      } else {
        toast.error(res?.message || "Failed to update settings");
      }
    } catch (e: any) {
      console.error("Failed to save payment settings", e);
      toast.error(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-taja-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-taja-secondary tracking-tight">Payment & Escrow Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform fees and automatic escrow release rules. Changes affect future orders and any escrow holds created after the update.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-2xl bg-taja-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-taja-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-taja-secondary tracking-tight">
              Platform Revenue & Escrow
            </CardTitle>
            <p className="text-[11px] text-gray-500 font-medium">
              Keep fees competitive while ensuring the business remains sustainable and sellers are paid fairly.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Zap className="h-3 w-3 text-taja-primary" />
              Platform Fee Percentage
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={settings.platformFeePercentage}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    platformFeePercentage: parseFloat(e.target.value || "0"),
                  }))
                }
                className="w-32 h-10 text-sm font-bold"
              />
              <span className="text-sm text-gray-500">
                %
                <span className="ml-2 text-[11px] text-gray-400 font-medium">
                  of each order total kept as platform revenue
                </span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Example: 5 means if a buyer pays ₦10,000, the platform keeps ₦500 and ₦9,500 is available to the seller (before any taxes).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="h-3 w-3 text-taja-primary" />
              Escrow Auto-Release Days
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                value={settings.autoReleaseDays}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    autoReleaseDays: parseInt(e.target.value || "7", 10),
                  }))
                }
                className="w-32 h-10 text-sm font-bold"
              />
              <span className="text-sm text-gray-500">
                days
                <span className="ml-2 text-[11px] text-gray-400 font-medium">
                  after a seller marks an order delivered before escrow auto-releases (if no dispute)
                </span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Buyers can still open a dispute before this window ends. If they don&apos;t confirm or complain within this period, funds are automatically released to the seller.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl px-6 h-11 text-[11px] font-black uppercase tracking-widest"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

