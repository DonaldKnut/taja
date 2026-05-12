"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { Check, Copy, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiderProvisionConfirmTarget = {
  partnerId: string;
  partnerName: string;
  hasExistingRider: boolean;
};

export type RiderProvisionCredentials = {
  email: string;
  temporaryPassword: string;
  mode: "account_created" | "password_rotated";
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyChip({
  label,
  value,
  successToast,
  className,
  variant = "outline",
}: {
  label: string;
  value: string;
  successToast: string;
  className?: string;
  variant?: "outline" | "default";
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [value]);

  const handle = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      toast.success(successToast);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy — select the text manually");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => void handle()}
      className={cn(
        "h-9 shrink-0 gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
        variant === "outline" && "border-slate-200",
        variant === "outline" && copied && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "default" && copied && "opacity-95",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export type RiderProvisionModalsProps = {
  confirmTarget: RiderProvisionConfirmTarget | null;
  credentials: RiderProvisionCredentials | null;
  confirmLoading: boolean;
  onCloseConfirm: () => void;
  onConfirmProvision: () => void | Promise<void>;
  onCloseCredentials: () => void;
};

export function RiderProvisionModals({
  confirmTarget,
  credentials,
  confirmLoading,
  onCloseConfirm,
  onConfirmProvision,
  onCloseCredentials,
}: RiderProvisionModalsProps) {
  const loginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/logistics/login` : "/logistics/login";

  const bundleText = credentials
    ? `Rider portal: ${loginUrl}\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}\n\nShare only over a secure channel. Previous passwords (if any) no longer work.`
    : "";

  return (
    <>
      <Modal
        isOpen={Boolean(confirmTarget)}
        onClose={confirmLoading ? () => {} : onCloseConfirm}
        title={confirmTarget?.hasExistingRider ? "Reset rider portal password?" : "Create rider-only login?"}
        description={
          confirmTarget?.hasExistingRider
            ? "A new temporary password will be issued once. The rider’s previous password will stop working immediately."
            : "A logistics-only account will be created (or linked). The temporary password is shown only once after you confirm."
        }
        size="md"
        closeOnOverlayClick={!confirmLoading}
        overlayClassName="z-[190] bg-slate-900/55 backdrop-blur-sm"
        panelClassName="z-[200]"
        className="rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-lg"
      >
        {confirmTarget ? (
          <div className="space-y-5 -mt-1">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-sm text-slate-700">
              <p className="font-bold text-slate-900">{confirmTarget.partnerName}</p>
              <ul className="mt-2 list-disc pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                <li>Partner must already be <strong className="text-slate-800">approved</strong> in this table.</li>
                <li>
                  You will receive a <strong className="text-slate-800">temporary password</strong> — copy it and send
                  it to the rider through a <strong className="text-slate-800">secure channel</strong> (not public chat
                  or email without encryption).
                </li>
                <li>We do not show this password again after you close the next step.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-xs font-semibold text-amber-950">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
              Treat rider credentials like banking access: verify the recipient before sharing.
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-[11px] font-black uppercase tracking-[0.18em] text-slate-500"
                onClick={onCloseConfirm}
                disabled={confirmLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl text-[11px] font-black uppercase tracking-[0.18em] gap-2 min-w-[10rem]"
                onClick={() => void onConfirmProvision()}
                disabled={confirmLoading}
              >
                {confirmLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Working…
                  </>
                ) : confirmTarget.hasExistingRider ? (
                  "Issue new password"
                ) : (
                  "Create rider access"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(credentials)}
        onClose={onCloseCredentials}
        title={credentials?.mode === "password_rotated" ? "New rider password" : "Rider credentials"}
        description={
          credentials?.mode === "password_rotated"
            ? "Copy now — the previous password no longer works."
            : "Copy now — this password is not shown again."
        }
        size="md"
        closeOnOverlayClick={false}
        overlayClassName="z-[190] bg-slate-900/60 backdrop-blur-sm"
        panelClassName="z-[200]"
        className="rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-lg"
      >
        {credentials ? (
          <div className="space-y-5 -mt-1">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-950">
              <KeyRound className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
              Rider sign-in URL:{" "}
              <code className="font-mono text-[11px] bg-white/80 px-1.5 py-0.5 rounded-md border border-emerald-100">
                /logistics/login
              </code>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900 break-all">{credentials.email}</p>
                  </div>
                  <CopyChip
                    label="Copy email"
                    value={credentials.email}
                    successToast="Email copied"
                    className="mt-5 sm:mt-6"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Temporary password
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900 break-all tracking-wide">
                      {credentials.temporaryPassword}
                    </p>
                  </div>
                  <CopyChip
                    label="Copy password"
                    value={credentials.temporaryPassword}
                    successToast="Password copied"
                    className="mt-5 sm:mt-6"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <CopyChip
                label="Copy sign-in link"
                value={loginUrl}
                successToast="Sign-in link copied"
                className="flex-1 h-10"
              />
              <CopyChip
                label="Copy all details"
                value={bundleText}
                successToast="Login bundle copied"
                variant="default"
                className="flex-1 h-10"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button type="button" className="rounded-xl text-[11px] font-black uppercase tracking-[0.18em]" onClick={onCloseCredentials}>
                Done — I’ve stored this securely
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
