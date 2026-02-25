"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Calendar, User, ArrowRight, FileText } from "lucide-react";
import { postsApi } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  category: string;
  image?: string;
  readTime: number;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await postsApi.getAll({ limit: 50 });
        
        // Handle different response structures
        let postsData = [];
        if (response?.data?.posts) {
          postsData = response.data.posts;
        } else if (response?.posts) {
          postsData = response.posts;
        } else if (response?.data) {
          postsData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          postsData = response;
        }

        // Transform API response to match our Post interface
        const transformedPosts = postsData.map((post: any) => ({
          id: post._id || post.id,
          title: post.title || post.name || "Untitled Post",
          excerpt: post.excerpt || post.description || post.content?.substring(0, 150) || "",
          author: {
            name: post.author?.fullName || post.author?.name || post.user?.fullName || "Anonymous",
            avatar: post.author?.avatarUrl || post.author?.avatar || post.user?.avatarUrl || "",
          },
          publishedAt: post.createdAt || post.publishedAt || post.date || new Date().toISOString(),
          category: post.category || "general",
          image: post.image || post.images?.[0] || post.featuredImage || "",
          readTime: post.readTime || Math.ceil((post.content?.length || 0) / 200) || 5,
        }));

        setPosts(transformedPosts);
      } catch (error: any) {
        console.error("Failed to fetch posts:", error);
        if (error?.status !== 401 && error?.status !== 403) {
          toast.error(error?.message || "Failed to load posts");
        }
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return posts;
    return posts.filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Posts</h1>
          <p className="text-lg text-gray-600">
            Discover stories, tips, and insights from our community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {post.image && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <Badge className="mb-2">{post.category}</Badge>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{post.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{post.readTime} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? "No posts found" : "Be the first to create!"}
              </h2>
              <p className="text-gray-600 mb-8">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "No posts have been created yet. Check back soon for community stories and insights!"}
              </p>
              {!searchTerm && (
                <Link href="/marketplace">
                  <Button size="lg" variant="gradient">
                    Browse Marketplace
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
