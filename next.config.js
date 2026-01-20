/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devServer = {
        ...config.devServer,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      }
    }
    
    // Exclude database drivers from bundle (not needed on Vercel)
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'mysql2/promise': 'commonjs mysql2/promise',
        'pg': 'commonjs pg',
        'sqlite3': 'commonjs sqlite3',
        'sqlite': 'commonjs sqlite',
        'mongodb': 'commonjs mongodb'
      })
    }
    
    return config
  },
}

module.exports = nextConfig