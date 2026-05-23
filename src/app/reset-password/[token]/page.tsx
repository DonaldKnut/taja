"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Zap,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { getPasswordStrength } from "@/lib/validation/password-schemas";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  // Form state
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenMessage, setTokenMessage] = useState("");
  const [passwordReset, setPasswordReset] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
  });

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, []);

  // Update password strength on password change
  useEffect(() => {
    if (formData.password) {
      const strength = getPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password]);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `/api/auth/verify-reset-token?token=${token}`,
      );
      const data = await response.json();

      if (data.valid) {
        setTokenValid(true);
        setTokenMessage(
          data.remainingMinutes
            ? `Link expires in ${data.remainingMinutes} minutes`
            : "Link is valid",
        );
      } else {
        setTokenValid(false);
        setTokenMessage(data.message || "Invalid or expired reset token");
        toast.error(data.message || "Invalid reset link");
      }
    } catch (error) {
      console.error("Token verification error:", error);
      setTokenValid(false);
      setTokenMessage("Unable to verify reset token");
      toast.error("Error verifying reset link");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate passwords
    if (formData.password.length < 8) {
      const error = "Password must be at least 8 characters";
      setErrors({ password: error });
      toast.error(error);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const error = "Passwords do not match";
      setErrors({ confirmPassword: error });
      toast.error(error);
      return;
    }

    // Check password strength
    if (passwordStrength.score < 4) {
      toast.error("Please choose a stronger password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordReset(true);
        toast.success("Password reset successfully!");
      } else {
        const errorMsg = data.message || "Failed to reset password";
        toast.error(errorMsg);

        // If token is invalid, update state
        if (
          data.reason === "token_expired" ||
          data.reason === "token_mismatch"
        ) {
          setTokenValid(false);
          setTokenMessage(data.message);
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Get password strength color and label
  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-red-500";
    if (score <= 4) return "bg-amber-500";
    if (score <= 6) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return "";
    if (score <= 2) return "Weak";
    if (score <= 4) return "Fair";
    if (score <= 6) return "Good";
    return "Strong";
  };

  // Loading state
  if (verifying) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-taja-primary border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-gray-600">
            Verifying reset link...
          </p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="h-screen bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          <div className="bg-white p-6 sm:p-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full space-y-8 text-center"
            >
              <div className="mx-auto w-24 h-24 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                  Invalid Reset <span className="text-red-600">Link</span>
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tokenMessage}
                </p>
              </div>

              <div className="glass-card p-8 space-y-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <p className="text-xs text-gray-600">
                  Password reset links expire after 60 minutes for security
                  reasons. You can request a new link anytime.
                </p>

                <Link href="/forgot-password">
                  <Button className="w-full bg-taja-primary text-white hover:bg-taja-primary/90 rounded-xl py-6 font-bold">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-taja-primary hover:text-taja-primary/80 font-bold transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right panel */}
          <div className="hidden md:flex relative flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
            <div className="absolute inset-0 motif-blanc opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-red-50/50 via-transparent to-transparent pointer-events-none rotate-12" />
          </div>
        </div>
      </div>
    );
  }

  // Password reset success state
  if (passwordReset) {
    return (
      <div className="h-screen bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          <div className="bg-white p-6 sm:p-10 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full space-y-8 text-center"
            >
              <div className="mx-auto w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <CheckCircle className="h-12 w-12 text-emerald-600 relative z-10" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                  Password <span className="text-taja-primary">Reset!</span>
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your password has been successfully updated. You can now sign
                  in with your new password.
                </p>
              </div>

              <div className="glass-card p-8 space-y-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-gray-700">
                      Password successfully changed
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-gray-700">
                      Account security updated
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-gray-700">Ready to sign in</p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-taja-primary text-white hover:bg-taja-primary/90 rounded-xl py-6 font-bold"
                >
                  Continue to Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                For security, you'll need to sign in with your new password
              </p>
            </motion.div>
          </div>

          {/* Right panel */}
          <div className="hidden md:flex relative flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
            <div className="absolute inset-0 motif-blanc opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-50/50 via-transparent to-transparent pointer-events-none rotate-12" />
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left Panel: Form Section */}
        <div className="relative bg-white p-6 sm:p-10 flex flex-col items-center justify-center overflow-y-auto">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="motif-blanc absolute inset-0 opacity-40" />
            <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-taja-primary/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-taja-primary/10 rounded-full blur-[120px]" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative z-10 w-full max-w-md space-y-8"
          >
            {/* Logo */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              <Logo size="lg" className="mb-8" href="/" />
            </motion.div>

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-4xl font-black text-taja-secondary tracking-tighter mb-3">
                Create New <span className="text-taja-primary">Password</span>
              </h2>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Choose a strong password to protect your account
              </p>
            </motion.div>

            {/* Token expiry warning */}
            {tokenMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl"
              >
                <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-xs font-medium text-blue-900">
                  {tokenMessage}
                </p>
              </motion.div>
            )}

            {/* Form */}
            <motion.div variants={itemVariants}>
              <div className="glass-card p-10 border-white/60 bg-white/20 backdrop-blur-xl space-y-6 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] ml-1"
                    >
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-taja-primary transition-colors text-gray-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        className="pl-12 pr-12 py-6 bg-white/30 backdrop-blur-md border border-white/40 focus:bg-white/50 focus:border-taja-primary/40 focus:ring-taja-primary/10 rounded-2xl shadow-inner text-sm font-bold transition-all disabled:opacity-50"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ml-1">
                          <span className="text-gray-500">
                            Password Strength
                          </span>
                          <span
                            className={
                              passwordStrength.score <= 2
                                ? "text-red-600"
                                : passwordStrength.score <= 4
                                  ? "text-amber-600"
                                  : passwordStrength.score <= 6
                                    ? "text-yellow-600"
                                    : "text-emerald-600"
                            }
                          >
                            {getStrengthLabel(passwordStrength.score)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                level <= passwordStrength.score
                                  ? getStrengthColor(passwordStrength.score)
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>

                        {passwordStrength.feedback.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {passwordStrength.feedback.map((tip, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-[10px] text-gray-600"
                              >
                                <Info className="h-3 w-3 shrink-0" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {errors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 ml-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        <p className="text-[10px] font-bold">
                          {errors.password}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] ml-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-taja-primary transition-colors text-gray-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        className="pl-12 pr-12 py-6 bg-white/30 backdrop-blur-md border border-white/40 focus:bg-white/50 focus:border-taja-primary/40 focus:ring-taja-primary/10 rounded-2xl shadow-inner text-sm font-bold transition-all disabled:opacity-50"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 ml-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        <p className="text-[10px] font-bold">
                          {errors.confirmPassword}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.password ||
                      !formData.confirmPassword ||
                      passwordStrength.score < 4
                    }
                    className="w-full py-7 bg-taja-primary hover:bg-taja-primary/90 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-emerald transition-all duration-300 transform active:scale-[0.98] border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Reset Password</span>
                        <Zap className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="pt-4 text-center border-t border-gray-200">
                  <Link
                    href="/login"
                    className="text-[10px] font-black text-taja-primary hover:text-taja-primary/80 uppercase tracking-[0.2em] transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Security Tips */}
            <motion.div
              variants={itemVariants}
              className="glass-card p-6 bg-blue-50/50 border border-blue-100 rounded-2xl"
            >
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-3">
                Password Security Tips
              </h3>
              <ul className="space-y-2 text-[10px] text-blue-800 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Use at least 8 characters with mixed case</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Include numbers and special characters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Avoid common words or personal information</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Panel: Info Section */}
        <div className="hidden md:flex relative flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
          <div className="absolute inset-0 motif-blanc opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-50/50 via-transparent to-transparent pointer-events-none rotate-12" />

          <div className="relative z-10 w-full max-w-sm space-y-12">
            <div className="space-y-4 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                  Secure Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-taja">
                    Digital Identity
                  </span>
                </h3>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-gray-400 font-medium leading-relaxed"
              >
                A strong password is your first line of defense. Choose wisely
                to keep your account and data protected.
              </motion.p>
            </div>

            {/* Security Features */}
            <div className="space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Encrypted Storage",
                  desc: "Passwords are hashed with bcrypt for maximum security.",
                },
                {
                  icon: Lock,
                  title: "Secure Transmission",
                  desc: "All data is encrypted in transit using TLS/SSL.",
                },
                {
                  icon: Zap,
                  title: "Instant Activation",
                  desc: "Your new password takes effect immediately.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-card p-5 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-taja-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-taja-secondary tracking-tight mb-0.5">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
