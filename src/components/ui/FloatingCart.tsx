"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { Store, MessageCircle, X } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { api } from "@/lib/api";
import Link from "next/link";
import { CartIcon, CartDrawer } from "@/components/cart";
import { useMounted } from "@/hooks/useMounted";

export function FloatingCart() {
  const mounted = useMounted();
  const { isOpen, toggleCart, _hasHydrated } = useCartStore();
  const { role } = useUserRole();
  const isSeller = role === "seller";

  // Ensure cart store is hydrated
  useEffect(() => {
    if (mounted && !_hasHydrated && typeof window !== "undefined") {
      useCartStore.persist.rehydrate();
    }
  }, [mounted, _hasHydrated]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi, I'm Ada. How can I help you today?" },
  ]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-24 right-6 z-50 bg-white text-gray-800 p-4 rounded-full shadow-lg hover:bg-gray-50 transition-all btn-hover flex items-center justify-center border"
        aria-label="Customer care chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Floating Action Button: Seller sees Shop button, Buyer sees Cart */}
      {isSeller ? (
        <Link
          href="/seller/products"
          className="fixed bottom-6 right-6 z-50 bg-taja-primary text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 transition-all btn-hover flex items-center justify-center"
          aria-label="Seller shop"
        >
          <Store className="h-6 w-6" />
        </Link>
      ) : (
        <CartIcon
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-50 bg-taja-primary text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 transition-all btn-hover"
          iconClassName="text-white"
        />
      )}

      {/* Cart Drawer - Using modular component */}
      {mounted && !isSeller && (
        <CartDrawer isOpen={isOpen} onClose={toggleCart} />
      )}

      {/* Chat Panel */}
      {chatOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setChatOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-base font-semibold">Chat with Ada</div>
                <div className="text-xs text-gray-500">Our smart customer care rep</div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-white border"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow bg-white border">
                    <div className="flex items-center gap-1">
                      <span className="sr-only">Ada is typing</span>
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="inline-block w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form
              className="p-3 border-t flex items-center gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const content = chatInput.trim();
                if (!content) return;
                setChatMessages((prev) => [...prev, { role: "user", content }]);
                setChatInput("");
                setChatBusy(true);
                try {
                  const res: any = await api("/api/assistant/chat", {
                    method: "POST",
                    body: JSON.stringify({ messages: [...chatMessages, { role: "user", content }].slice(-12) }),
                  });
                  const reply = res?.reply || "Sorry, I couldn't process that.";
                  setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
                } catch (err: any) {
                  setChatMessages((prev) => [...prev, { role: "assistant", content: err?.message || "Network error." }]);
                } finally {
                  setChatBusy(false);
                }
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={chatBusy || !chatInput.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-taja text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {chatBusy ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
