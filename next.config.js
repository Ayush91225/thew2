/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devServer = {
        ...config.devServer,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      }
    }
    return config
  },
}

module.exports = nextConfig