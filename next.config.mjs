/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep local UAT/dev output isolated when another task runs `next build`
  // against the same checkout. Production and normal local runs still use
  // Next's default `.next` directory unless this variable is explicitly set.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Deployed on Vercel: no static export, no basePath.
  // Assets resolve at the domain root; next/image optimization is enabled.
  // A GitHub Pages build can still be produced by setting NEXT_PUBLIC_BASE_PATH
  // and output=export via env if ever needed (see lib/site.ts assetPath()).
};

export default nextConfig;
