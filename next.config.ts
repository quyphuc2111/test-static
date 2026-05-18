import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ]
  },
  trailingSlash: false,

  // Allow large file uploads up to 1GB for ZIP content packages
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
    middlewareClientMaxBodySize: '1024mb',
  },
};

export default nextConfig;
