/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds (Vercel-compatible)
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // Don't run ESLint on any directories
  },
  
  // Disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Experimental features for better Vercel compatibility
  experimental: {
    // Skip type checking during build
    typedRoutes: false,
    // Disable strict mode for faster builds
    strictNextHead: false,
  },
  
  // Webpack configuration to skip linting
  webpack: (config, { dev, isServer }) => {
    // Disable ESLint webpack plugin in production
    if (!dev) {
      config.plugins = config.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );
    }
    return config;
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
