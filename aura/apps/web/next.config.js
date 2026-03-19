/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aura/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.minio.io' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', '@react-three/fiber'],
  },
}

module.exports = nextConfig
