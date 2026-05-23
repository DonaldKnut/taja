"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Truck, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Globe2,
  Package,
  HeadphonesIcon
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { Logo } from "@/components/ui/Logo";
import { AdvancedFooter } from "@/components/ui/AdvancedFooter";

export default function ShippingPage() {
  const protocols = [
    {
      icon: ShieldCheck,
      title: "Safe Payments",
      description: "We hold your money safely. We only pay the seller after you confirm that you have received your item. Total peace of mind for you.",
      color: "bg-emerald-500"
    },
    {
      icon: Zap,
      title: "Fast Lagos Delivery",
      description: "We work with the best dispatch riders in Lagos to make sure you get your items within 24 to 48 hours.",
      color: "bg-taja-primary"
    },
    {
      icon: Globe2,
      title: "Anywhere in Lagos",
      description: "From Ikeja to Ikorodu, Lekki to Badagry—if it is in Lagos, we will deliver it to your doorstep safely.",
      color: "bg-blue-500"
    }
  ];

  const stats = [
    { label: "Delivery Success", value: "99.9%" },
    { label: "Lagos Hubs", value: "5+" },
    { label: "Avg. Time", value: "24h" },
    { label: "Area Coverage", value: "100%" }
  ];

  return (
    <div className="min-h-screen bg-motif-blanc relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-taja-light/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="glass-panel border-b border-white/60 sticky top-0 z-50 backdrop-blur-xl">
        <Container size="lg">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" variant="header" href="/" />
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/marketplace" className="text-xs font-black text-gray-400 hover:text-taja-secondary transition-colors uppercase tracking-[0.2em]">Marketplace</Link>
              <Link href="/how-it-works" className="text-xs font-black text-gray-400 hover:text-taja-secondary transition-colors uppercase tracking-[0.2em]">Protocol</Link>
              <Link href="/register" className="bg-taja-primary text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-emerald hover:shadow-emerald-hover transition-all">Start Selling</Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* Cinematic Hero */}
      <Section className="relative pt-24 pb-32 overflow-hidden">
        <Container size="lg" className="relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card border-white shadow-huge text-taja-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12"
            >
              <Truck className="w-4 h-4" />
              <span>Fast & Safe Shipping</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-8xl lg:text-9xl font-black text-taja-secondary tracking-tighter leading-[0.9] mb-12 italic"
            >
              How we <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-taja drop-shadow-sm">Ship.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-2xl text-gray-500/80 max-w-3xl mx-auto leading-relaxed mb-16 font-medium text-balance"
            >
              We are making shopping and delivery in Lagos easy and safe for everyone. Your money is protected, and your items arrive fast.
            </motion.p>
            
            {/* Stats Row */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="glass-card p-6 md:p-8 rounded-[2.5rem] border-white/60 shadow-premium">
                  <div className="text-2xl md:text-3xl font-black text-taja-secondary tracking-tighter mb-1 font-sora">{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-taja-primary/60">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Protocol Pillars */}
      <Section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-motif-blanc opacity-40" />
        <Container size="lg" className="relative z-10 px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {protocols.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.7 }}
                  className="glass-card p-10 md:p-12 rounded-[3.5rem] border-white/80 hover:shadow-premium-hover transition-all duration-500 group"
                >
                  <div className={`w-16 h-16 rounded-3xl ${p.color} text-white flex items-center justify-center mb-10 shadow-huge group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-taja-secondary mb-6 tracking-tight italic font-sora">
                    {p.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed font-medium text-lg">
                    {p.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Atmospheric Transit Experience Section */}
      <Section className="py-24 relative overflow-hidden bg-taja-secondary">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-taja-primary via-transparent to-emerald-900" />
        </div>
        <Container size="lg" className="relative z-10 px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-6 block">Real-Time Updates</span>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-10 leading-[1.05] tracking-tighter italic font-sora">
                Follow your order. <br />
                See where it is.
              </h2>
              <ul className="space-y-6">
                {[
                  { icon: CheckCircle2, text: "Fast updates as your order moves" },
                  { icon: CheckCircle2, text: "Trustworthy Lagos delivery riders" },
                  { icon: CheckCircle2, text: "Get your items before we pay the seller" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/80 group">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-taja-primary transition-colors">
                      <item.icon className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full animate-pulse" />
                <div className="glass-card h-full w-full rounded-[4rem] border-white/10 p-12 flex flex-col justify-center border-dashed border-2">
                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                           <Package className="w-7 h-7 text-taja-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                           <div className="h-4 w-2/3 bg-white/40 rounded-full" />
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                           <MapPin className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="flex-1 space-y-2 opacity-50">
                           <div className="h-2 w-1/4 bg-white/20 rounded-full" />
                           <div className="h-4 w-1/2 bg-white/40 rounded-full" />
                        </div>
                     </div>
                     <div className="pt-8 flex justify-center">
                        <div className="h-16 w-16 rounded-full border-4 border-dashed border-emerald-500/30 flex items-center justify-center animate-spin-slow">
                           <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Support & Community Section */}
      <Section className="py-32">
        <Container size="lg" className="px-4 sm:px-6">
           <div className="glass-card p-12 md:p-20 rounded-[4rem] border-white shadow-huge relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-taja-primary/5 blur-[80px] rounded-full" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                 <div className="max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-black text-taja-secondary mb-6 leading-tight tracking-tight italic font-sora">
                       We are here to <br/>
                       help you.
                    </h2>
                    <p className="text-gray-500 text-lg leading-relaxed mb-10">
                       Our Lagos-based support team is always online to help you with any questions about your delivery.
                    </p>
                    <div className="flex flex-wrap gap-4">
                       <button className="h-14 px-8 rounded-2xl bg-taja-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-huge hover:scale-105 transition-all flex items-center gap-3">
                          <HeadphonesIcon className="w-4 h-4" />
                          Priority Logistics Support
                       </button>
                    </div>
                 </div>
                 <div className="hidden md:block w-px h-64 bg-slate-100" />
                 <div className="text-center md:text-left">
                    <div className="text-6xl font-black text-taja-primary tracking-tighter mb-2">24/7</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Response Protocol</div>
                 </div>
              </div>
           </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="pb-32">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-12"
          >
            <h2 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter italic font-sora">
              The best way to <span className="text-taja-primary">Shop</span> in Lagos.
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-taja-secondary text-white px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-huge hover:shadow-premium-hover transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                Join Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/marketplace"
                className="w-full sm:w-auto glass-card border-white text-taja-secondary px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center active:scale-95 shadow-premium"
              >
                Explore Protocol
              </Link>
            </div>
          </motion.div>
        </Container>
      </Section>

      <AdvancedFooter />
    </div>
  );
}
