"use client";

import { SiWhatsapp } from "react-icons/si";

const WHATSAPP_E164 = "2349113547583";
const WHATSAPP_DISPLAY = "09113547583";

// Minimal test page to isolate webpack issue
export default function TestLoginPage() {
  const waUrl = `https://wa.me/${WHATSAPP_E164}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test Login Page</h1>
        <p>If you see this, the page is loading correctly.</p>
        <p className="mt-4 text-sm text-gray-600">
          This is a minimal page to test if webpack is working.
        </p>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Chat on WhatsApp: ${WHATSAPP_DISPLAY}`}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] py-3 pl-4 pr-5 text-white shadow-lg shadow-black/20 transition hover:bg-[#20BD5A] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
        aria-label={`Chat with us on WhatsApp ${WHATSAPP_DISPLAY}`}
      >
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-100 opacity-90" />
          <span className="relative inline-flex h-3 w-3 animate-pulse rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
        </span>
        <span className="flex flex-col gap-0.5 text-left leading-tight">
          <span className="text-sm font-semibold sm:text-base">Chat with us</span>
          <span className="text-xs font-medium text-emerald-50 opacity-95">
            {WHATSAPP_DISPLAY}
          </span>
        </span>
        <SiWhatsapp className="h-8 w-8 shrink-0 text-white" aria-hidden />
      </a>
    </div>
  );
}







