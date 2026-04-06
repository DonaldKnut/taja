"use client";

import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cartStore";
import { Image as ImageIcon, MessageCircle, Paperclip, Phone, X } from "lucide-react";
import { api, supportApi, uploadSupportAttachment } from "@/lib/api";
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
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Welcome to Taja Support. Send a message and our team will reply shortly." },
  ]);
  const [isAuthed, setIsAuthed] = useState(false);
  const supportWhatsAppUrl = (() => {
    const raw = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
    if (!raw) return null;
    const clean = raw.replace(/[^\d]/g, "");
    if (!clean) return null;
    return `https://wa.me/${clean}`;
  })();

  const loadSupportThread = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setIsAuthed(false);
      setSupportTicketId(null);
      setChatMessages([
        {
          role: "assistant",
          content: "Please sign in to start a support ticket chat. You can also create a ticket from the Support page after signing in.",
        },
      ]);
      return;
    }

    setIsAuthed(true);
    try {
      setChatBusy(true);
      const threadRes = await supportApi.getChatThread();
      const ticketId = threadRes?.data?.ticketId as string | undefined;
      if (!ticketId) throw new Error("Missing chat thread id");
      setSupportTicketId(ticketId);

      const ticketRes = await supportApi.getTicket(ticketId);
      const ticket = ticketRes?.data;
      const msgs = (ticket?.messages || []).map((m: any) => ({
        role: m.senderRole === "admin" || m.senderRole === "seller" || m.senderRole === "system" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      setChatMessages((prev) => {
        // If thread is empty, keep the welcome copy but relabel as Support.
        if (!msgs.length) {
          return [{ role: "assistant" as const, content: "Welcome to Taja Support. Send a message and our team will reply shortly." }];
        }
        return msgs;
      });
    } catch (e: any) {
      setIsAuthed(false);
      setSupportTicketId(null);
      setChatMessages([
        {
          role: "assistant",
          content: "Support chat is temporarily unavailable. Please try again, or create a ticket at /support.",
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  useEffect(() => {
    if (!chatOpen) return;
    loadSupportThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen || !supportTicketId) return;
    const interval = setInterval(async () => {
      try {
        if (document.visibilityState !== "visible") return;
        const ticketRes = await supportApi.getTicket(supportTicketId);
        const ticket = ticketRes?.data;
        const msgs = (ticket?.messages || []).map((m: any) => ({
          role: m.senderRole === "admin" || m.senderRole === "seller" || m.senderRole === "system" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));
        if (msgs.length) setChatMessages(msgs);
      } catch {
        // ignore polling errors
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [chatOpen, supportTicketId]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating contact buttons: lifted above mobile bottom nav */}
      <div className="fixed right-6 bottom-[8.5rem] md:bottom-6 z-40 flex flex-col gap-3">
        {supportWhatsAppUrl && (
          <a
            href={supportWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 text-white p-4 rounded-full shadow-premium hover:bg-emerald-600 transition-all active:scale-95 border border-emerald-400/40 flex items-center justify-center"
            aria-label="WhatsApp support"
            title="WhatsApp support"
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
        <button
          onClick={() => setChatOpen(true)}
          className="relative bg-white text-taja-secondary p-4 rounded-full shadow-premium hover:bg-gray-50 transition-all active:scale-95 border border-gray-100/50 flex items-center justify-center"
          aria-label="Support chat"
          title="Support chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-taja-primary rounded-full animate-pulse border-2 border-white"></span>
        </button>
      </div>

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
                    <div className="text-lg font-black text-taja-secondary tracking-tight">
                      Support Chat
                    </div>
                    <div className="text-[10px] font-black text-taja-primary uppercase tracking-widest">
                      Ticket Thread
                    </div>
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
                {pendingFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {pendingFiles.map((f, i) => (
                      <div
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs font-semibold"
                      >
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                        <span className="max-w-[180px] truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-1 text-gray-400 hover:text-gray-700"
                          aria-label="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  className="flex items-center gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const content = chatInput.trim();
                    if (!content && pendingFiles.length === 0) return;
                    setChatMessages((prev) => [...prev, { role: "user", content }]);
                    setChatInput("");
                    setChatBusy(true);
                    try {
                      if (!isAuthed) {
                        setChatMessages((prev) => [
                          ...prev,
                          { role: "assistant", content: "Please sign in first, then send your message here." },
                        ]);
                        return;
                      }
                      if (!supportTicketId) {
                        await loadSupportThread();
                      }
                      if (!supportTicketId) {
                        throw new Error("Support thread unavailable");
                      }
                      const attachments =
                        pendingFiles.length > 0
                          ? await Promise.all(pendingFiles.map((f) => uploadSupportAttachment(f)))
                          : [];
                      setPendingFiles([]);

                      await supportApi.addMessage(supportTicketId, { content: content || "Attachment(s)", attachments });
                      const ticketRes = await supportApi.getTicket(supportTicketId);
                      const ticket = ticketRes?.data;
                      const msgs = (ticket?.messages || []).map((m: any) => ({
                        role:
                          m.senderRole === "admin" || m.senderRole === "seller"
                            ? ("assistant" as const)
                            : ("user" as const),
                        content: m.content,
                      }));
                      if (msgs.length) setChatMessages(msgs);
                    } catch (err: any) {
                      setChatMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content:
                            "Support chat is temporarily unavailable. Please try again, or create a ticket at /support.",
                        },
                      ]);
                    } finally {
                      setChatBusy(false);
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) setPendingFiles((prev) => [...prev, ...files].slice(0, 4));
                      e.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={chatBusy}
                    className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-gray-100 transition-all"
                    aria-label="Attach image"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isAuthed ? "Type your message..." : "Sign in to message support"}
                    disabled={!isAuthed || chatBusy}
                    className="flex-1 bg-gray-50 border-none rounded-2xl px-5 h-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-taja-primary/30 transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!isAuthed || chatBusy || (!chatInput.trim() && pendingFiles.length === 0)}
                    className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    <motion.div animate={chatBusy ? { rotate: 360 } : {}} transition={chatBusy ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
                      <MessageCircle className="w-5 h-5" />
                    </motion.div>
                  </button>
                </form>

                {!isAuthed && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") window.location.href = "/login";
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-white bg-taja-secondary rounded-xl px-4 h-10 hover:bg-black transition-colors"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") window.location.href = "/support";
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-taja-secondary bg-gray-50 rounded-xl px-4 h-10 hover:bg-gray-100 transition-colors"
                    >
                      Go to Support
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
