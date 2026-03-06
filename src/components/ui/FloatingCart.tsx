"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { MessageCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { CartDrawer } from "@/components/cart";
import { useMounted } from "@/hooks/useMounted";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingCart() {
  const mounted = useMounted();
  const { isOpen, toggleCart, _hasHydrated } = useCartStore();

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
    { role: "assistant", content: "Welcome to Taja! I'm Ada, your guide to our premium registry. How can I assist you with the marketplace today?" },
  ]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Chat Button - Positioned higher to avoid bottom nav */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-32 right-6 z-40 bg-white text-taja-secondary p-4 rounded-full shadow-premium hover:bg-gray-50 transition-all active:scale-95 border border-gray-100/50 flex items-center justify-center"
        aria-label="Chat with Ada"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-taja-primary rounded-full animate-pulse border-2 border-white"></span>
      </button>

      {/* Floating Action Button: Seller sees Shop button, Buyer sees Cart */}

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 bottom-0 h-[80vh] w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl z-[101] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b bg-white relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-taja-light flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-taja-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-taja-secondary tracking-tight">Chat with Ada</div>
                    <div className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Digital Assistant</div>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 no-scrollbar">
                {chatMessages.map((m, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm font-medium shadow-sm leading-relaxed ${m.role === "user"
                      ? "bg-black text-white rounded-tr-none"
                      : "bg-white text-taja-secondary border border-gray-100 rounded-tl-none"
                      }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {chatBusy && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-tl-none px-5 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-taja-primary rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Section - Includes padding for bottom nav */}
              <div className="p-6 border-t bg-white pb-10 md:pb-6">
                <form
                  className="flex items-center gap-2"
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
                      const reply = res?.reply || "I'm having trouble connecting to my central brain. Please check your connection.";
                      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
                    } catch (err: any) {
                      setChatMessages((prev) => [...prev, { role: "assistant", content: "I'm experiencing a minor transmission glitch. Could you rephrase that?" }]);
                    } finally {
                      setChatBusy(false);
                    }
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Ada anything..."
                    className="flex-1 bg-gray-50 border-none rounded-2xl px-5 h-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-taja-primary/30 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={chatBusy || !chatInput.trim()}
                    className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    <motion.div animate={chatBusy ? { rotate: 360 } : {}} transition={chatBusy ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
                      <MessageCircle className="w-5 h-5" />
                    </motion.div>
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
