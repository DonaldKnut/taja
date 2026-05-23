import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100/50 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-gray-100 animate-pulse overflow-hidden">
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>

      <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow gap-4">
        <div className="space-y-3">
          {/* Title Skeleton */}
          <div className="space-y-1.5">
            <div className="h-3 sm:h-4 bg-gray-100 rounded animate-pulse w-[85%]" />
            <div className="h-3 sm:h-4 bg-gray-100 rounded animate-pulse w-[60%]" />
          </div>

          {/* Category/Stats Skeleton */}
          <div className="space-y-2">
            <div className="h-4 sm:h-5 bg-gray-50 rounded animate-pulse w-[35%]" />
            <div className="h-3 bg-gray-50 rounded animate-pulse w-[50%]" />
            <div className="h-3 bg-gray-50 rounded animate-pulse w-[40%]" />
          </div>
          
          {/* Seller Row Skeleton (optional matching height) */}
          <div className="mt-3 flex items-center gap-2 pt-1">
             <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
             <div className="space-y-1 flex-1">
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-[45%]" />
                <div className="h-2 bg-gray-100 rounded animate-pulse w-[30%]" />
             </div>
          </div>
        </div>

        {/* Price & Action Skeleton */}
        <div className="mt-auto pt-2 flex flex-col gap-3">
          <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-[50%]" />
          <div className="flex items-center justify-end w-full">
            <div className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
