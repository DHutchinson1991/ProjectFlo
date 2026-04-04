/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@projectflo/shared'],
  eslint: {
    // Disable ESLint during builds since we run it from root
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking runs locally and in CI — skip during Vercel build to avoid timeout
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
