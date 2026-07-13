/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deployed on Vercel: no static export, no basePath.
  // Assets resolve at the domain root; next/image optimization is enabled.
  // A GitHub Pages build can still be produced by setting NEXT_PUBLIC_BASE_PATH
  // and output=export via env if ever needed (see lib/site.ts assetPath()).
};

export default nextConfig;
