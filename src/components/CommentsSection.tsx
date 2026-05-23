"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageCircle, Heart, Reply, MoreVertical, Trash2, Edit2, Send } from "lucide-react";
import { commentsApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    fullName?: string;
    name?: string;
    avatarUrl?: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  parentCommentId?: string;
  images?: string[];
}

interface CommentsSectionProps {
  postId?: string;
  productId?: string;
  type: "post" | "product";
}

export function CommentsSection({ postId, productId, type }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const targetId = postId || productId;

  useEffect(() => {
    if (!targetId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = type === "post"
          ? await commentsApi.getPostComments(targetId, 1, 50)
          : await commentsApi.getProductComments(targetId, 1, 50);

        // Handle different response structures
        let commentsData = [];
        if (response?.data?.comments) {
          commentsData = response.data.comments;
        } else if (response?.comments) {
          commentsData = response.comments;
        } else if (response?.data) {
          commentsData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          commentsData = response;
        }

        // Organize comments into parent-child structure
        const parentComments = commentsData.filter((c: any) => !c.parentCommentId);
        const repliesMap = new Map<string, Comment[]>();

        commentsData.forEach((comment: any) => {
          if (comment.parentCommentId) {
            const parentId = comment.parentCommentId;
            if (!repliesMap.has(parentId)) {
              repliesMap.set(parentId, []);
            }
            repliesMap.get(parentId)!.push({
              _id: comment._id || comment.id,
              content: comment.content || comment.text || "",
              author: {
                _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
                fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
                avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
              },
              createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
              likes: comment.likes || comment.likesCount || 0,
              isLiked: comment.isLiked || false,
              parentCommentId: comment.parentCommentId,
              images: comment.images || [],
            });
          }
        });

        const organizedComments = parentComments.map((comment: any) => ({
          _id: comment._id || comment.id,
          content: comment.content || comment.text || "",
          author: {
            _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
            fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
            avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
          },
          createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
          likes: comment.likes || comment.likesCount || 0,
          isLiked: comment.isLiked || false,
          replies: repliesMap.get(comment._id || comment.id) || [],
          images: comment.images || [],
        }));

        setComments(organizedComments);
      } catch (error: any) {
        console.error("Failed to fetch comments:", error);
        if (error?.status !== 401 && error?.status !== 403) {
          toast.error(error?.message || "Failed to load comments");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [targetId, type]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please login to comment");
      }
      return;
    }

    try {
      setSubmitting(true);
      const response = type === "post"
        ? await commentsApi.createPostComment(targetId!, { content: newComment.trim() })
        : await commentsApi.createProductComment(targetId!, { content: newComment.trim() });

      if (response?.success !== false) {
        setNewComment("");
        toast.success("Comment added!");
        // Refresh comments
        const refreshResponse = type === "post"
          ? await commentsApi.getPostComments(targetId!, 1, 50)
          : await commentsApi.getProductComments(targetId!, 1, 50);

        let commentsData = [];
        if (refreshResponse?.data?.comments) {
          commentsData = refreshResponse.data.comments;
        } else if (refreshResponse?.comments) {
          commentsData = refreshResponse.comments;
        } else if (refreshResponse?.data) {
          commentsData = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
        } else if (Array.isArray(refreshResponse)) {
          commentsData = refreshResponse;
        }

        const parentComments = commentsData.filter((c: any) => !c.parentCommentId);
        const repliesMap = new Map<string, Comment[]>();

        commentsData.forEach((comment: any) => {
          if (comment.parentCommentId) {
            const parentId = comment.parentCommentId;
            if (!repliesMap.has(parentId)) {
              repliesMap.set(parentId, []);
            }
            repliesMap.get(parentId)!.push({
              _id: comment._id || comment.id,
              content: comment.content || comment.text || "",
              author: {
                _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
                fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
                avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
              },
              createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
              likes: comment.likes || comment.likesCount || 0,
              isLiked: comment.isLiked || false,
              parentCommentId: comment.parentCommentId,
              images: comment.images || [],
            });
          }
        });

        const organizedComments = parentComments.map((comment: any) => ({
          _id: comment._id || comment.id,
          content: comment.content || comment.text || "",
          author: {
            _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
            fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
            avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
          },
          createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
          likes: comment.likes || comment.likesCount || 0,
          isLiked: comment.isLiked || false,
          replies: repliesMap.get(comment._id || comment.id) || [],
          images: comment.images || [],
        }));

        setComments(organizedComments);
      } else {
        toast.error(response?.message || "Failed to add comment");
      }
    } catch (error: any) {
      console.error("Failed to submit comment:", error);
      toast.error(error?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Please login to reply");
      }
      return;
    }

    try {
      setSubmitting(true);
      const response = type === "post"
        ? await commentsApi.createPostComment(targetId!, { content: replyContent.trim(), parentCommentId: parentId })
        : await commentsApi.createProductComment(targetId!, { content: replyContent.trim(), parentCommentId: parentId });

      if (response?.success !== false) {
        setReplyContent("");
        setReplyingTo(null);
        toast.success("Reply added!");
        // Refresh comments
        const refreshResponse = type === "post"
          ? await commentsApi.getPostComments(targetId!, 1, 50)
          : await commentsApi.getProductComments(targetId!, 1, 50);

        let commentsData = [];
        if (refreshResponse?.data?.comments) {
          commentsData = refreshResponse.data.comments;
        } else if (refreshResponse?.comments) {
          commentsData = refreshResponse.comments;
        } else if (refreshResponse?.data) {
          commentsData = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
        } else if (Array.isArray(refreshResponse)) {
          commentsData = refreshResponse;
        }

        const parentComments = commentsData.filter((c: any) => !c.parentCommentId);
        const repliesMap = new Map<string, Comment[]>();

        commentsData.forEach((comment: any) => {
          if (comment.parentCommentId) {
            const parentId = comment.parentCommentId;
            if (!repliesMap.has(parentId)) {
              repliesMap.set(parentId, []);
            }
            repliesMap.get(parentId)!.push({
              _id: comment._id || comment.id,
              content: comment.content || comment.text || "",
              author: {
                _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
                fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
                avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
              },
              createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
              likes: comment.likes || comment.likesCount || 0,
              isLiked: comment.isLiked || false,
              parentCommentId: comment.parentCommentId,
              images: comment.images || [],
            });
          }
        });

        const organizedComments = parentComments.map((comment: any) => ({
          _id: comment._id || comment.id,
          content: comment.content || comment.text || "",
          author: {
            _id: comment.author?._id || comment.author?.id || comment.user?._id || "",
            fullName: comment.author?.fullName || comment.author?.name || comment.user?.fullName || "Anonymous",
            avatarUrl: comment.author?.avatarUrl || comment.author?.avatar || comment.user?.avatarUrl || "",
          },
          createdAt: comment.createdAt || comment.created_at || comment.date || new Date().toISOString(),
          likes: comment.likes || comment.likesCount || 0,
          isLiked: comment.isLiked || false,
          replies: repliesMap.get(comment._id || comment.id) || [],
          images: comment.images || [],
        }));

        setComments(organizedComments);
      } else {
        toast.error(response?.message || "Failed to add reply");
      }
    } catch (error: any) {
      console.error("Failed to submit reply:", error);
      toast.error(error?.message || "Failed to add reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to like comments");
      return;
    }

    try {
      await commentsApi.like(commentId);
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked,
            };
          }
          // Also update in replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply._id === commentId
                  ? {
                      ...reply,
                      likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                      isLiked: !reply.isLiked,
                    }
                  : reply
              ),
            };
          }
          return comment;
        })
      );
    } catch (error: any) {
      console.error("Failed to like comment:", error);
      toast.error(error?.message || "Failed to like comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await commentsApi.delete(commentId);
      toast.success("Comment deleted");
      setComments((prev) =>
        prev.filter((comment) => {
          if (comment._id === commentId) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter((reply) => reply._id !== commentId);
          }
          return true;
        })
      );
    } catch (error: any) {
      console.error("Failed to delete comment:", error);
      toast.error(error?.message || "Failed to delete comment");
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      await commentsApi.update(commentId, { content: editContent.trim() });
      toast.success("Comment updated");
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === commentId) {
            return { ...comment, content: editContent.trim() };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply._id === commentId ? { ...reply, content: editContent.trim() } : reply
              ),
            };
          }
          return comment;
        })
      );
      setEditingId(null);
      setEditContent("");
    } catch (error: any) {
      console.error("Failed to update comment:", error);
      toast.error(error?.message || "Failed to update comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h2>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <div className="mb-8">
          <div className="flex gap-4">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.fullName || "You"}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-semibold">
                  {(user?.fullName || "U")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                className="mb-2"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                  variant="gradient"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Please login to comment</p>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/login"}>
            Login
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex gap-4">
                {comment.author.avatarUrl ? (
                  <Image
                    src={comment.author.avatarUrl}
                    alt={comment.author.fullName || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold">
                      {(comment.author.fullName || "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{comment.author.fullName}</h4>
                      <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    {user?._id === comment.author._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(comment._id);
                            setEditContent(comment.content);
                          }}
                          className="text-gray-400 hover:text-emerald-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId === comment._id ? (
                    <div className="space-y-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdate(comment._id)}
                          disabled={submitting}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(comment._id)}
                      className={`flex items-center gap-1 text-sm ${
                        comment.isLiked ? "text-emerald-600" : "text-gray-500"
                      } hover:text-emerald-600`}
                    >
                      <Heart className={`h-4 w-4 ${comment.isLiked ? "fill-current" : ""}`} />
                      {comment.likes}
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600"
                      >
                        <Reply className="h-4 w-4" />
                        Reply
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-emerald-200">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleReply(comment._id)}
                          disabled={!replyContent.trim() || submitting}
                          size="sm"
                        >
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex gap-3">
                          {reply.author.avatarUrl ? (
                            <Image
                              src={reply.author.avatarUrl}
                              alt={reply.author.fullName || "User"}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-emerald-600 font-semibold text-xs">
                                {(reply.author.fullName || "U")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h5 className="font-semibold text-sm text-gray-900">{reply.author.fullName}</h5>
                                <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                              </div>
                              {user?._id === reply.author._id && (
                                <button
                                  onClick={() => handleDelete(reply._id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{reply.content}</p>
                            <button
                              onClick={() => handleLike(reply._id)}
                              className={`flex items-center gap-1 text-xs ${
                                reply.isLiked ? "text-emerald-600" : "text-gray-500"
                              } hover:text-emerald-600`}
                            >
                              <Heart className={`h-3 w-3 ${reply.isLiked ? "fill-current" : ""}`} />
                              {reply.likes}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
