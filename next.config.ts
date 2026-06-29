import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type-check runs separately in CI (next typegen && tsc --noEmit)
    // so we don't block the Docker build on TS errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
