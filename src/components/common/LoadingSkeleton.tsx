"use client";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "table" | "grid";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "card", count = 3, className = "" }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        );
      case "list":
        return (
          <div className="bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        );
      case "grid":
        return (
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        );
      case "table":
        return (
          <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  if (variant === "table") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <tr key={i}>{renderSkeleton()}</tr>
        ))}
      </>
    );
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}







