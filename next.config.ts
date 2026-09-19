import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep static generation reliable on memory-constrained Windows hosts.
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
  },
};

export default nextConfig;
