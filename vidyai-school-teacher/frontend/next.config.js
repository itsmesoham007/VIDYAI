/** @type {import('next').NextConfig} */
const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://vidyai-backend-m4lj.onrender.com').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
