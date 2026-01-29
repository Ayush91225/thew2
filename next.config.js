/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove all experimental features and complex webpack config
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig