"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, User, Clock, ArrowLeft, Share2, Heart, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { postsApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { CommentsSection } from "@/components/CommentsSection";

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  category: string;
  image?: string;
  readTime: number;
  likes: number;
  comments: number;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postsApi.getById(params.id as string);
        
        // Handle different response structures
        let postData;
        if (response?.data?.post) {
          postData = response.data.post;
        } else if (response?.data) {
          postData = response.data;
        } else if (response?.post) {
          postData = response.post;
        } else {
          postData = response;
        }

        // Transform API response to match our Post interface
        const transformedPost: Post = {
          id: postData._id || postData.id,
          title: postData.title || postData.name || "Untitled Post",
          content: postData.content || postData.body || postData.description || "",
          author: {
            name: postData.author?.fullName || postData.author?.name || postData.user?.fullName || "Anonymous",
            avatar: postData.author?.avatarUrl || postData.author?.avatar || postData.user?.avatarUrl || "",
            bio: postData.author?.bio || postData.user?.bio || "",
          },
          publishedAt: postData.createdAt || postData.publishedAt || postData.date || new Date().toISOString(),
          category: postData.category || "general",
          image: postData.image || postData.images?.[0] || postData.featuredImage || "",
          readTime: postData.readTime || Math.ceil((postData.content?.length || 0) / 200) || 5,
          likes: postData.likes || postData.likesCount || 0,
          comments: postData.comments || postData.commentsCount || 0,
        };

        setPost(transformedPost);
      } catch (error: any) {
        console.error("Failed to fetch post:", error);
        if (error?.status !== 401 && error?.status !== 403) {
          toast.error(error?.message || "Failed to load post");
        }
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Logo size="md" variant="header" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
            <p className="text-gray-600 mb-8">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/posts">
                <Button variant="gradient">
                  Browse Posts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" variant="header" />
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Header */}
        <div className="mb-8">
          <Badge className="mb-4">{post.category}</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.image && (
          <div className="relative h-96 w-full rounded-xl overflow-hidden mb-8">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Post Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
              <Heart className="h-5 w-5" />
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments}</span>
            </button>
          </div>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Author Bio */}
        {post.author.bio && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-start gap-4">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-emerald-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{post.author.name}</h3>
                <p className="text-gray-600">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentsSection postId={post.id} type="post" />
      </article>
    </div>
  );
}
