/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
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