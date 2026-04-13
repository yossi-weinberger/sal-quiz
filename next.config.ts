import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Allow images from any domain if needed in future
    remotePatterns: [],
  },
  // Ensure trailing slashes are consistent
  trailingSlash: false,
};

export default nextConfig;
