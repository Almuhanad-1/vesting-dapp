/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  webpack: (config, { dev, isServer }) => {
    // Basic fallbacks
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Bundle splitting for performance
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000,
        cacheGroups: {
          web3: {
            test: /[\\/]node_modules[\\/](wagmi|@rainbow-me)[\\/]/,
            name: 'web3',
            priority: 30,
            chunks: 'all',
          },
          charts: {
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            name: 'charts',
            priority: 25,
            chunks: 'async',
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            priority: 20,
            chunks: 'all',
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
            maxSize: 200000,
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig
