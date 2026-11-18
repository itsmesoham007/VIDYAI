/** @type {import('next').NextConfig} */
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
        destination: 'http://127.0.0.1:8000/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
