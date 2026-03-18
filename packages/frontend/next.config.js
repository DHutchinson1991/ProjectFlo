/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable to prevent double-mounting/double-fetching in dev
  eslint: {
    // Disable ESLint during builds since we run it from root
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
