"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  ShoppingBag,
  Shield,
  Truck,
  CreditCard,
  Headphones,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
  Diamond,
  Gem,
  Trophy,
  Sparkles,
  Wand2,
  Rocket,
  BarChart3,
  PieChart,
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Flag,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  ExternalLink,
  Check,
  X as XIcon,
  Minus,
  Plus,
  Edit3,
  Copy,
  Bookmark,
  Settings,
  HelpCircle,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  InfoIcon,
  Lightbulb,
  LightbulbOff,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  Wind as WindIcon,
  Droplets as DropletsIcon,
  Thermometer as ThermometerIcon,
  Gauge as GaugeIcon,
} from "lucide-react";

const steps = [
  {
    id: 2,
    title: "List Your Products",
    description:
      "Upload products with photos, videos, and detailed descriptions",
    icon: Target,
    color: "from-[#808080] to-[#2E6B4E]",
    features: [
      "Photo & video uploads",
      "Detailed specifications",
      "SEO optimization",
      "Category management",
    ],
    image: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771838542/smiling-black-lady-receiving-assistance-600nw-2485172611_pnu9ka.webp",
    video: "/videos/step2-list-products.mp4",
  },
  {
    id: 3,
    title: "Get Verified",
    description: "Build trust with customers through our verification process",
    icon: Shield,
    color: "from-[#808080] to-[#2E6B4E]",
    features: [
      "Identity verification",
      "Business registration",
      "Quality assurance",
      "Trust badges",
    ],
    image: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771838541/business-1031754_640_ekmgnj.webp",
    video: "/videos/step3-get-verified.mp4",
  },
  {
    id: 4,
    title: "Start Selling",
    description: "Receive orders, process payments, and grow your business",
    icon: TrendingUp,
    color: "from-[#808080] to-[#2E6B4E]",
    features: [
      "Secure payments",
      "Order management",
      "Customer support",
      "Analytics dashboard",
    ],
    image: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771838543/01JNKHRW58BXPZ66G7ZA6P1T94_jbvgkh.png",
    video: "/videos/step4-start-selling.mp4",
  },
  {
    id: 5,
    title: "Grow Your Business",
    description: "Scale your shop and reach more customers",
    icon: Rocket,
    color: "from-[#808080] to-[#2E6B4E]",
    features: [
      "Marketing tools",
      "Customer insights",
      "Growth analytics",
      "Business expansion",
    ],
    image: "https://res.cloudinary.com/db2fcni0k/image/upload/v1771838541/digital-information-marketing-leverages-technology-600nw-2459940977_jsioek.webp",
    video: "/videos/step5-grow-business.mp4",
  },
];

const features = [
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Bank-level security with escrow protection",
    gradient: "from-[#808080] to-[#2E6B4E]",
    bgGradient: "from-gray-50 to-green-50",
    link: "/how-it-works#secure-payments",
    learnMore: "Learn how our escrow system protects you",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Nationwide shipping with tracking",
    gradient: "from-[#2E6B4E] to-[#808080]",
    bgGradient: "from-green-50 to-gray-50",
    link: "/how-it-works#fast-delivery",
    learnMore: "Discover our delivery network",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help you succeed",
    gradient: "from-[#808080] to-[#2E6B4E]",
    bgGradient: "from-gray-50 to-green-50",
    link: "/how-it-works#support",
    learnMore: "Get help anytime you need",
  },
  {
    icon: Star,
    title: "Quality Guarantee",
    description: "100% satisfaction or your money back",
    gradient: "from-[#2E6B4E] to-[#808080]",
    bgGradient: "from-green-50 to-gray-50",
    link: "/how-it-works#quality-guarantee",
    learnMore: "Read our guarantee policy",
  },
];

const stats = [
  { number: "Verified", label: "Merchant Network", icon: Users },
  { number: "Secure", label: "Escrow Payments", icon: Shield },
  { number: "Express", label: "Nationwide Shipping", icon: Truck },
  { number: "24/7", label: "Seller Support", icon: Activity },
];

const testimonials = [
  {
    name: "Elizabeth Christopher",
    role: "Boutique Owner, Eli's Thrift",
    location: "Lagos, Nigeria",
    avatar: "/assets/Black Skin Care Basics, What You Need to Know (1).jpeg",
    company: "Eli's Thrift",
    companyLogo: "/images/logos/ailitic.svg",
    content: "Taja made it so easy to move my Instagram business to a professional storefront. No more 'check DM' stress.",
  },
  {
    name: "Jonathan Oluniyi",
    role: "Vintage Curator, Old Soul Finds",
    location: "Abuja, Nigeria",
    avatar: "/assets/Michael Neuenhaus.jpeg",
    company: "Old Soul Finds",
    companyLogo: "/images/logos/buildwave.svg",
    content:
      "The escrow system built trust with my customers instantly. My sales have been much smoother since I joined.",
  },
  {
    name: "Quadri Abdul Salam",
    role: "Sneaker Reseller, KickHive",
    location: "Port Harcourt, Nigeria",
    avatar:
      "/assets/corporate headshot, professional headshot, profile photo, Linkedin photo, sns profile.jpeg",
    company: "KickHive",
    companyLogo: "/images/logos/inhive.svg",
    content: "Finally, a platform that understands the Nigerian market. The dashboard gives me all the insights I need.",
  },
];

export function BrandShowcase() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isStepsAutoPlaying, setIsStepsAutoPlaying] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [perView, setPerView] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const hoverRef = useRef<HTMLDivElement | null>(null);

  // Auto-play for steps slider
  useEffect(() => {
    if (!isStepsAutoPlaying) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isStepsAutoPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setCurrentPage((prev) => {
        const maxPage = Math.max(
          0,
          Math.ceil(testimonials.length / perView) - 1
        );
        return (prev + 1) % (maxPage + 1);
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, perView]);

  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth >= 1024) {
        setPerView(2);
      } else {
        setPerView(1);
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const nextStep = () => {
    setDirection(1);
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const goToStep = (stepIndex: number) => {
    setDirection(stepIndex > currentStep ? 1 : -1);
    setCurrentStep(stepIndex);
  };

  return (
    <div className="relative py-24 md:py-40 bg-motif-blanc overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-taja-light/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-taja-light/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - High Contrast White & Green */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card border-white/60 mb-8"
          >
            <Sparkles className="h-4 w-4 text-taja-primary" />
            <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">Operational Protocol</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-taja-secondary mb-10 tracking-tighter leading-tight"
          >
            DM to <span className="text-transparent bg-clip-text bg-gradient-to-r from-taja-secondary via-taja-primary to-emerald-600">Digital Growth</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            Join a growing network of Nigerian entrepreneurs who've transformed their
            craft with Taja's reliable commerce tools.
          </motion.p>
        </div>

        {/* Steps Carousel - Premium Glass Slider */}
        <div className="mb-40">
          <div className="glass-card p-4 md:p-12 rounded-[40px] border-white/80 shadow-premium overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-taja-primary/5 blur-3xl -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-6xl font-black text-taja-light/30 tracking-tighter">
                        0{steps[currentStep].id}
                      </div>
                      <div className="h-px flex-1 bg-taja-light/20" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-taja-secondary tracking-tight">
                        {steps[currentStep].title}
                      </h3>
                      <p className="text-lg text-gray-500 font-medium leading-relaxed">
                        {steps[currentStep].description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {steps[currentStep].features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 rounded-2xl glass-card border-white/40 bg-white/20">
                          <div className="h-6 w-6 rounded-lg bg-taja-primary/10 flex items-center justify-center text-taja-primary">
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-taja-secondary/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button
                        size="lg"
                        className="rounded-full px-10 bg-taja-primary text-white shadow-emerald hover:shadow-emerald-hover group"
                        onClick={() => window.location.href = '/register'}
                      >
                        Start Your Story
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-10 glass-card border-white/60 text-taja-secondary hover:bg-white/40"
                        onClick={() => window.location.href = '/how-it-works'}
                      >
                        Operational Details
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Media Display - Immersive Container */}
              <div
                className="relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-premium-hover border border-white/80 group"
                onMouseEnter={() => setIsStepsAutoPlaying(false)}
                onMouseLeave={() => setIsStepsAutoPlaying(true)}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    {steps[currentStep].image && (
                      <Image
                        src={steps[currentStep].image}
                        alt={steps[currentStep].title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-taja-secondary/40 via-transparent to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* Status Indicator */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="glass-card px-4 py-2 rounded-full border-white/40 text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md">
                    Live Interface
                  </div>
                  <button
                    onClick={() => setIsStepsAutoPlaying(!isStepsAutoPlaying)}
                    className="h-12 w-12 rounded-full glass-card border-white/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all backdrop-blur-md"
                  >
                    {isStepsAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Pagination & Controls */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/40">
              <div className="flex items-center gap-4">
                <button
                  onClick={prevStep}
                  className="h-12 w-12 rounded-full glass-card border-white/40 flex items-center justify-center text-taja-secondary hover:bg-white/40 active:scale-90 transition-all"
                  aria-label="Previous Step"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextStep}
                  className="h-12 w-12 rounded-full glass-card border-white/40 flex items-center justify-center text-taja-secondary hover:bg-white/40 active:scale-90 transition-all"
                  aria-label="Next Step"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={`h-1.5 transition-all duration-300 rounded-full ${currentStep === index ? "w-10 bg-taja-primary" : "w-3 bg-taja-light/40 hover:bg-taja-light/60"
                      }`}
                  />
                ))}
              </div>

              <div className="hidden md:block text-[10px] font-black text-taja-primary uppercase tracking-[0.3em]">
                System Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Features Infrastructure Grid */}
        <div className="mb-40">
          <div className="text-center mb-20">
            <h3 className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] mb-4">
              Core Capabilities
            </h3>
            <p className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tight">
              Clinical Precision. Every Order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group h-full"
              >
                <div className="glass-card p-10 rounded-[40px] border-white/80 hover:shadow-premium-hover transition-all duration-500 h-full flex flex-col hover:-translate-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-taja-primary text-white flex items-center justify-center mb-8 shadow-emerald group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-taja-secondary mb-4 leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-gray-500 font-medium leading-relaxed mb-8 flex-grow">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.link}
                    className="flex items-center gap-2 text-[10px] font-black text-taja-primary uppercase tracking-widest group-hover:gap-4 transition-all"
                  >
                    Deploy Feature
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Global Statistics */}
        <div className="mb-40">
          <div className="relative glass-card bg-taja-secondary/5 rounded-[48px] p-8 sm:p-12 md:p-24 border-white overflow-hidden">
            <div className="absolute inset-0 bg-motif-blanc opacity-20" />

            <div className="relative z-10 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-20">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[28px] glass-card bg-white/60 border-white flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-sm text-taja-primary">
                    <stat.icon className="h-7 w-7 md:h-10 md:w-10" />
                  </div>
                  <div className="text-4xl md:text-7xl font-black text-taja-secondary mb-3 md:mb-4 tracking-tighter">
                    {stat.number}
                  </div>
                  <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] md:tracking-[0.4em] px-2">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Testimonials */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-black text-taja-primary uppercase tracking-[0.4em] mb-4 block">
                Partner Intel
              </span>
              <h3 className="text-4xl md:text-6xl font-black text-taja-secondary leading-[1.1] tracking-tighter">
                Feedback from our <span className="text-transparent bg-clip-text bg-gradient-to-r from-taja-secondary via-taja-primary to-emerald-600">Merchant Network</span>
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                className="h-14 w-14 rounded-full glass-card border-white/60 flex items-center justify-center text-taja-secondary hover:bg-white active:scale-90 transition-all shadow-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => {
                  const maxPage = Math.ceil(testimonials.length / perView) - 1;
                  setCurrentPage(prev => Math.min(maxPage, prev + 1));
                }}
                className="h-14 w-14 rounded-full glass-card border-white/60 flex items-center justify-center text-taja-secondary hover:bg-white active:scale-90 transition-all shadow-sm"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div
            className="overflow-hidden"
            onMouseEnter={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(true)}
          >
            <motion.div
              className="flex gap-8"
              animate={{ x: `calc(-${currentPage * 100}% - ${currentPage * 32}px)` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {testimonials.map((t, idx) => (
                <div key={idx} className="min-w-full lg:min-w-[calc(50%-16px)]">
                  <div className="glass-card p-10 md:p-12 rounded-[40px] border-white/80 h-full flex flex-col shadow-premium transition-all duration-500 hover:-translate-y-2">
                    <div className="flex items-start justify-between mb-10">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white shadow-premium">
                          <Image
                            src={t.avatar}
                            alt={t.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-taja-secondary leading-none mb-2">{t.name}</p>
                          <p className="text-xs font-black text-taja-primary uppercase tracking-widest">{t.role}</p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                        {t.location}
                      </div>
                    </div>

                    <div className="relative flex-grow">
                      <p className="text-xl text-gray-500 font-medium leading-relaxed italic">
                        "{t.content}"
                      </p>
                    </div>

                    <div className="mt-10 flex items-center gap-4">
                      <div className="h-px flex-1 bg-gray-100" />
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Verified Merchant</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Global CTA Section */}
        <div className="text-center py-20 relative">
          <div className="absolute inset-0 bg-taja-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-12">
            <h3 className="text-4xl md:text-6xl font-black text-taja-secondary tracking-tighter max-w-3xl mx-auto leading-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-taja-secondary via-taja-primary to-emerald-600">Build</span> Your Brand?
            </h3>

            <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Nigeria's most intuitive commerce engine is waiting for your brand.
              Launch your shop instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="rounded-full px-16 h-16 text-sm font-black uppercase tracking-widest bg-taja-primary text-white shadow-emerald hover:shadow-emerald-hover active:scale-95 transition-all"
                onClick={() => window.location.href = '/register'}
              >
                <ShoppingBag className="mr-3 h-5 w-5" />
                Initialize Shop
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-16 h-16 text-sm font-black uppercase tracking-widest glass-card border-white/60 text-taja-secondary hover:bg-white/40 active:scale-95 transition-all"
                onClick={() => window.location.href = '/how-it-works'}
              >
                <Users className="mr-3 h-5 w-5" />
                Partner Portal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
