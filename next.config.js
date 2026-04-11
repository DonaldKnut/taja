const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
// Helper function to extract hostname from URL
const getHostnameFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

// Build R2 image patterns dynamically
const r2ImagePatterns = [];

// Add specific R2 domain from error
r2ImagePatterns.push({
  protocol: "https",
  hostname: "pub-1bc01021a631452885c83bc1cc30d706.r2.dev",
  pathname: "/**",
});

// Add R2 public base URL hostname if configured
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
if (r2PublicBaseUrl) {
  const hostname = getHostnameFromUrl(r2PublicBaseUrl);
  if (hostname && !r2ImagePatterns.some(p => p.hostname === hostname)) {
    r2ImagePatterns.push({
      protocol: "https",
      hostname: hostname,
      pathname: "/**",
    });
  }
}

// R2 S3 API hostname used when R2_PUBLIC_BASE_URL is unset (must match upload URL host for next/image)
const r2AccountId = process.env.R2_ACCOUNT_ID;
if (r2AccountId) {
  const h = `${r2AccountId}.r2.cloudflarestorage.com`;
  if (!r2ImagePatterns.some((p) => p.hostname === h)) {
    r2ImagePatterns.push({
      protocol: "https",
      hostname: h,
      pathname: "/**",
    });
  }
}

// Any Cloudflare R2 *.r2.dev public bucket (wildcard supported in Next 14.2+)
if (!r2ImagePatterns.some((p) => p.hostname === "*.r2.dev")) {
  r2ImagePatterns.push({
    protocol: "https",
    hostname: "*.r2.dev",
    pathname: "/**",
  });
}

// AWS S3 and compatible URLs (bucket.s3.region.amazonaws.com, etc.)
if (!r2ImagePatterns.some((p) => p.hostname === "*.amazonaws.com")) {
  r2ImagePatterns.push({
    protocol: "https",
    hostname: "*.amazonaws.com",
    pathname: "/**",
  });
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["framer-motion"],
  // Allow production builds to complete even if lint/type-check
  // find issues. We still run `npm run lint` and `npm run type-check`
  // in CI or locally when needed.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Improve RSC handling
  experimental: {
    // Help with RSC payload fetching
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Webpack configuration to help with module loading
  webpack: (config, { isServer, webpack }) => {
    // Fix for webpack module loading issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Ignore problematic modules during client-side bundling
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Add all R2 image patterns
      ...r2ImagePatterns,
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://tajaapp.shop",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // Production: https://tajaapp-backend-nzkj.onrender.com
    // Development: http://localhost:5000 (set via .env.local)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://tajaapp-backend-nzkj.onrender.com",
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "https://tajaapp-backend-nzkj.onrender.com",
  },
};

module.exports = withPWA(nextConfig);
