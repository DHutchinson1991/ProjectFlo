/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds since we run it from root
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
