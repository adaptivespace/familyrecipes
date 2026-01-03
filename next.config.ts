import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow loading images from external domains if needed (e.g. for potential future features)
  // For now, local images are fine.
};

export default nextConfig;
