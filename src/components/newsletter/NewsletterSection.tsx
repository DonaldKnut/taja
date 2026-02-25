"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout";
import { toast } from "react-hot-toast";

// Schema definition using Zod
const newsletterSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type NewsletterValues = z.infer<typeof newsletterSchema>;

export function NewsletterSection() {
    const [isSubscribed, setIsSubscribed] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewsletterValues>({
        resolver: zodResolver(newsletterSchema),
    });

    const onSubmit = async (data: NewsletterValues) => {
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            console.log("Newsletter subscription:", data.email);

            setIsSubscribed(true);
            reset();
            toast.success("Welcome to the community!");
        } catch (error) {
            toast.error("Failed to subscribe. Please try again.");
        }
    };

    return (
        <section className="relative py-24 overflow-hidden bg-slate-50">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 motif-blanc opacity-20 pointer-events-none" />
            <div className="absolute -top-[20%] -right-[10%] w-[40%] h-[60%] bg-taja-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[60%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

            <Container size="md">
                <div className="relative z-10 bg-white rounded-[3rem] p-10 md:p-20 shadow-premium border border-white overflow-hidden group">
                    {/* Internal Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taja-light/50 border border-taja-primary/10">
                                <Mail className="h-3.5 w-3.5 text-taja-primary" />
                                <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Newsletter</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter leading-tight">
                                Join our <span className="text-taja-primary">Newsletters</span>
                            </h2>

                            <p className="text-lg text-gray-500 leading-relaxed font-medium">
                                Get the latest updates, curator insights, and exclusive marketplace drops delivered straight to your inbox.
                            </p>
                        </div>

                        <div className="relative">
                            {!isSubscribed ? (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-taja-primary transition-colors">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <input
                                            {...register("email")}
                                            type="email"
                                            placeholder="Enter your email address"
                                            className={`w-full h-16 pl-16 pr-6 rounded-[1.5rem] bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-taja-primary focus:bg-white text-sm font-bold text-taja-secondary placeholder:text-gray-400 outline-none transition-all ${errors.email ? "ring-rose-500 ring-2" : "group-hover/input:ring-slate-300"
                                                }`}
                                        />
                                        {errors.email && (
                                            <p className="absolute -bottom-6 left-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 rounded-[1.5rem] bg-taja-secondary hover:bg-taja-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-premium transition-all duration-500 group/btn"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Subscribe
                                                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-taja-secondary tracking-tight">You're in!</h3>
                                    <p className="text-sm font-medium text-gray-500">
                                        Welcome to the Taja community. Check your inbox soon for something special.
                                    </p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsSubscribed(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-taja-primary hover:bg-taja-light"
                                    >
                                        Subscribe another email
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
