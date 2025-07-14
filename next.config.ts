import type { NextConfig } from "next";

const isExport = process.env.BUILD_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isExport && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    images: {
      unoptimized: true,
    },
  }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;