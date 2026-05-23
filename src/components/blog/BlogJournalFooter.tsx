import Link from "next/link";
import { Mail, ShoppingBag } from "lucide-react";

export function BlogJournalFooter() {
  return (
    <section className="relative mt-24 sm:mt-32 overflow-hidden rounded-[2rem] border border-slate-100 bg-gradient-to-br from-taja-secondary via-emerald-950 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-taja-primary/40 via-transparent to-transparent" />
      <div className="relative px-8 py-16 sm:px-14 sm:py-20 text-center max-w-3xl mx-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300/90 mb-4">Stay in the loop</p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter italic leading-tight">
          The marketplace moves fast. We write so you don&apos;t miss it.
        </h2>
        <p className="mt-6 text-emerald-100/80 text-sm leading-relaxed">
          Product drops, seller stories, and how to sell smarter — delivered with the same care we put into Taja.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:hello@taja.shop?subject=Journal%20newsletter"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-white text-taja-secondary text-[10px] font-black uppercase tracking-[0.2em] shadow-premium hover:bg-taja-light transition-colors w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" />
            Partner enquiries
          </a>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl border border-white/25 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop the marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
