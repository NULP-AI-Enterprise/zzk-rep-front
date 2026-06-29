import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Linting runs in CI as a separate step; don't block the Docker build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type-check runs in CI as a separate step (npx tsc --noEmit)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
