import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Container } from "@/components/layout";
import {
  BlogCard,
  BlogFeaturedHero,
  BlogJournalFooter,
} from "@/components/blog";
import {
  getBlogCategories,
  getFeaturedPost,
  getPublishedPosts,
  type BlogPostListItem,
} from "@/lib/blog-queries";
import { cn } from "@/lib/utils";

export const revalidate = 120;

type Search = { page?: string; category?: string };

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const categoryId = searchParams.category || undefined;

  const [categories, featured, listResult] = await Promise.all([
    getBlogCategories(),
    categoryId ? Promise.resolve(null) : getFeaturedPost(),
    getPublishedPosts({ page, limit: 12, categoryId }),
  ]);

  const { posts, pagination } = listResult;

  let hero: BlogPostListItem | null = categoryId ? null : featured;
  let gridPosts = posts;

  if (!categoryId) {
    if (hero) {
      gridPosts = posts.filter((p) => String(p._id) !== String(hero._id));
    } else if (posts.length > 0) {
      hero = posts[0];
      gridPosts = posts.slice(1);
    }
  }

  return (
    <main className="bg-white">
      <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-24 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-taja-light/60 to-white pointer-events-none" />
        <Container size="lg" className="relative z-10 px-4 sm:px-6">
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-taja-primary/20 bg-white/80 backdrop-blur px-4 py-2 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-taja-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-taja-primary">
                The Journal
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-taja-secondary tracking-tighter leading-[1.05] italic">
              Ideas worth
              <span className="text-taja-primary"> shopping</span> for.
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl">
              Deep dives on style, selling, and culture — written for buyers and sellers who care about craft, not
              clutter.
            </p>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              <Link
                href="/blog"
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                  !categoryId
                    ? "bg-taja-secondary text-white border-taja-secondary shadow-premium"
                    : "bg-white text-slate-500 border-slate-200 hover:border-taja-primary/30"
                )}
              >
                All
              </Link>
              {categories.map((c: { _id: unknown; name: string; color?: string }) => (
                <Link
                  key={String(c._id)}
                  href={`/blog?category=${String(c._id)}`}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                    categoryId === String(c._id)
                      ? "text-white border-transparent shadow-premium"
                      : "bg-white text-slate-500 border-slate-200 hover:border-taja-primary/30"
                  )}
                  style={
                    categoryId === String(c._id)
                      ? { backgroundColor: c.color || "#10B981" }
                      : undefined
                  }
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {hero && (
            <div className="mb-16 sm:mb-20">
              <BlogFeaturedHero post={hero} />
            </div>
          )}

          {gridPosts.length === 0 && !hero ? (
            <div className="text-center py-24 rounded-[2rem] border border-dashed border-slate-200 bg-white/50">
              <p className="text-taja-secondary font-black text-xl tracking-tight italic mb-2">No stories yet</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                We&apos;re preparing the first articles. Explore the marketplace while we brew something worth reading.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex h-12 items-center px-8 rounded-2xl bg-taja-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-premium hover:bg-taja-primary transition-colors"
              >
                Browse marketplace
              </Link>
            </div>
          ) : (
            gridPosts.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {gridPosts.map((post, i) => (
                  <BlogCard key={String(post._id)} post={post} index={i} />
                ))}
              </div>
            )
          )}

          {pagination.pages > 1 && (
            <nav className="mt-16 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(categoryId ? { category: categoryId } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="h-12 px-6 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:border-taja-primary/40 inline-flex items-center"
                >
                  Previous
                </Link>
              )}
              <span className="h-12 px-6 inline-flex items-center text-sm text-slate-400 font-semibold">
                Page {page} of {pagination.pages}
              </span>
              {page < pagination.pages && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(categoryId ? { category: categoryId } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="h-12 px-6 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:border-taja-primary/40 inline-flex items-center"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </Container>
      </section>

      <Container size="lg" className="px-4 sm:px-6 pb-24">
        <BlogJournalFooter />
      </Container>
    </main>
  );
}
