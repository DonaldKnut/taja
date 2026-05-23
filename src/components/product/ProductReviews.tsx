"use client";

import { useState, useEffect } from "react";
import { Star, MessageCircle, ShieldCheck, User, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
    _id: string;
    reviewer: {
        fullName: string;
        avatar?: string;
    };
    rating: number;
    title?: string;
    comment: string;
    verifiedPurchase: boolean;
    createdAt: string;
}

interface ReviewStats {
    averageRating: number;
    totalCount: number;
    distribution: {
        [key: number]: number;
    };
}

interface ProductReviewsProps {
    productId: string;
    shopId?: string;
}

export function ProductReviews({ productId, shopId }: ProductReviewsProps) {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canReview, setCanReview] = useState(false);

    // Form state
    const [formRating, setFormRating] = useState(5);
    const [formComment, setFormComment] = useState("");
    const [formTitle, setFormTitle] = useState("");

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api(`/api/reviews?productId=${productId}`);
            if (response.success) {
                setReviews(response.data.reviews);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkCanReview = async () => {
        if (!isAuthenticated) return;
        try {
            // Check if user has a delivered order for this product
            const response = await api(`/api/orders?role=buyer&status=delivered`);
            if (response.success) {
                const hasOrdered = response.data.orders.some((order: any) =>
                    order.items.some((item: any) => (item.product?._id || item.product) === productId)
                );

                // Also check if already reviewed
                const userId = user?._id || (user as any)?.userId;
                const alreadyReviewed = reviews.some(r => (r as any).reviewer?._id === userId);

                setCanReview(hasOrdered && !alreadyReviewed);
            }
        } catch (error) {
            console.error("Error checking review eligibility:", error);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    useEffect(() => {
        if (reviews.length >= 0) {
            checkCanReview();
        }
    }, [reviews, isAuthenticated]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formComment) return;

        try {
            setIsSubmitting(true);

            // We need an orderId to submit a review per current API requirement
            // Fetch user's orders for this product
            const ordersRes = await api(`/api/orders?role=buyer&status=delivered`);
            const eligibleOrder = ordersRes.data.orders.find((order: any) =>
                order.items.some((item: any) => (item.product?._id || item.product) === productId)
            );

            if (!eligibleOrder) {
                toast.error("You need a delivered order to review this product");
                return;
            }

            await api("/api/reviews", {
                method: "POST",
                body: JSON.stringify({
                    orderId: eligibleOrder._id,
                    productId,
                    shopId: eligibleOrder.shop?._id || eligibleOrder.shop,
                    rating: formRating,
                    title: formTitle,
                    comment: formComment,
                }),
            });

            toast.success("Review submitted! Thank you.");
            setShowReviewModal(false);
            fetchReviews();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="grid lg:grid-cols-12 gap-12">
                {/* Stats Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-4xl font-black text-taja-secondary tracking-tighter">
                                {stats?.averageRating.toFixed(1) || "0.0"}
                            </h3>
                            <div className="flex justify-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-4 w-4",
                                            i < Math.round(stats?.averageRating || 0)
                                                ? "fill-emerald-500 text-emerald-500"
                                                : "text-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Based on {stats?.totalCount || 0} reviews
                            </p>
                        </div>

                        {/* Price Distribution Bars */}
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = stats?.distribution[star] || 0;
                                const percentage = stats?.totalCount ? (count / stats.totalCount) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-gray-400 w-4">{star}</span>
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className="h-full bg-emerald-500"
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 w-8">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {canReview && (
                        <Button
                            onClick={() => setShowReviewModal(true)}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                        >
                            Write a Review
                        </Button>
                    )}
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-8 space-y-8">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                            <p className="text-sm text-slate-500 italic">No reviews yet. Be the first to share your experience.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reviews.map((review) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={review._id}
                                    className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {review.reviewer.avatar ? (
                                                    <img src={review.reviewer.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-taja-secondary text-sm">{review.reviewer.fullName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={cn(
                                                                    "h-2.5 w-2.5",
                                                                    i < review.rating ? "fill-emerald-500 text-emerald-500" : "text-slate-200"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                    {review.verifiedPurchase && (
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                            <ShieldCheck className="w-2.5 h-2.5" />
                                                            Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(review.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {review.title && <h5 className="font-bold text-slate-900 mb-2">{review.title}</h5>}
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowReviewModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-taja-secondary tracking-tighter mb-6 italic">Write a Review</h3>

                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quality Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormRating(star)}
                                                className="p-1 transition-transform active:scale-90"
                                            >
                                                <Star
                                                    className={cn(
                                                        "h-8 w-8 transition-colors",
                                                        star <= formRating ? "fill-emerald-500 text-emerald-500" : "text-slate-200"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Headline</label>
                                    <input
                                        type="text"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                        placeholder="Brief summary of your experience"
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Review</label>
                                    <textarea
                                        required
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium resize-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Review"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
