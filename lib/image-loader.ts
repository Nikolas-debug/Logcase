"use client";

// next/image loader, enabled in next.config.ts once NEXT_PUBLIC_CF_IMAGES_HASH is set.
// src is a Cloudflare image ID; Cloudflare resizes via flexible variants.
export default function cloudflareLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Local files (/brand icons) and admin data: URLs pass through unresized.
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  return `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_IMAGES_HASH}/${src}/w=${width},q=${quality ?? 75}`;
}
