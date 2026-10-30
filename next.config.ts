import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Photos come from Cloudflare Images once its account hash is configured (ARCHITECTURE.md).
  ...(process.env.NEXT_PUBLIC_CF_IMAGES_HASH && { images: { loader: "custom", loaderFile: "./lib/image-loader.ts" } }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
