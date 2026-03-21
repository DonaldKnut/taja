"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, FileText, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout";

export function CorporateRegistry() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#FDFDFD]">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-taja-primary/20 to-transparent" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-taja-primary/5 blur-[120px] rounded-full" />
      </div>

      <Container size="lg" className="relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="glass-panel rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-16 border border-white shadow-huge overflow-hidden relative group"
          >
            {/* Animated Glow Effect */}
            <div className="absolute -inset-24 bg-gradient-to-tr from-taja-primary/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
              {/* Official Seal / Shield Side */}
              <div className="flex-shrink-0 relative">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0],
                    y: [0, -5, 0, -5, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-32 w-32 xs:h-40 xs:w-40 md:h-56 md:w-56"
                >
                  {/* Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-taja-primary/20 animate-[spin_20s_linear_infinite]" />
                  
                  {/* Inner Seal */}
                  <div className="absolute inset-4 rounded-full bg-white shadow-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-taja-primary/10 to-transparent opacity-50" />
                    
                    {/* CAC-inspired Symbolism */}
                    <div className="relative flex flex-col items-center text-center">
                      <ShieldCheck className="h-16 w-16 md:h-24 md:w-24 text-taja-primary drop-shadow-lg" />
                      <div className="mt-2 px-3 py-1 bg-taja-primary text-[8px] md:text-[10px] font-black text-white rounded-full uppercase tracking-widest">
                        Official Registry
                      </div>
                    </div>
                  </div>

                  {/* Floating Notification-style Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -top-2 -right-2 h-12 w-12 bg-white rounded-full shadow-lg border border-gray-50 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Textual Content */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-primary/5 border border-taja-primary/10">
                  <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Regulatory Compliance</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-tight">
                  A Registered & Trusted <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-taja">Nigerian Company.</span>
                </h2>

                <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-2xl">
                  Taja is fully incorporated with the **Corporate Affairs Commission (CAC)** of Nigeria. 
                  We adhere to strict regulatory standards to ensure a secure, transparent, and legal 
                  marketplace for all buyers and sellers across the federation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-taja-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Number</p>
                      <p className="text-sm font-bold text-taja-secondary mt-1">RC: 1782394</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-taja-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Status</p>
                      <p className="text-sm font-bold text-taja-secondary mt-1">Active & Compliant</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-center lg:justify-start">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                        <div className="h-full w-full bg-taja-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-taja-primary" />
                        </div>
                      </div>
                    ))}
                    <div className="h-8 px-3 rounded-full border-2 border-white bg-taja-light flex items-center justify-center text-[10px] font-bold text-taja-secondary ml-4">
                      Trusted by 800+ Businesses
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
