import type { NextConfig } from "next";

const isExport = process.env.BUILD_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isExport && {
    output: 'export',
    trailingSlash: false,
    distDir: 'out',
    images: {
      unoptimized: true,
    },
  }),

  // Performance optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;