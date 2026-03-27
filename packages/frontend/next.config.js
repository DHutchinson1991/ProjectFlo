/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@projectflo/shared'],
  eslint: {
    // Disable ESLint during builds since we run it from root
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
