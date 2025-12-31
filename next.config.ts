import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  // Only use standalone output in production builds, not in dev
  ...(process.env.NODE_ENV === 'production' ? { output: "standalone" } : {}),
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Suppress connection errors in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Configure SWC compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    
    // Exclude problematic troika-three-text files from SWC processing
    // These files contain Unicode regex patterns that SWC can't parse
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Find all rules that use SWC loader and add exclude for troika-three-text dist files
    config.module.rules.forEach((rule: any) => {
      if (rule && rule.use) {
        const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
        const hasSwcLoader = uses.some((use: any) => 
          use && (use.loader?.includes('next-swc-loader') || use === 'next-swc-loader')
        );
        
        if (hasSwcLoader) {
          // Add exclude patterns for troika-three-text dist files
          const excludePatterns = [
            /node_modules[\\/]troika-three-text[\\/]dist/,
            /node_modules[\\/].*unicode-font-resolver/,
          ];
          
          if (rule.exclude) {
            if (Array.isArray(rule.exclude)) {
              rule.exclude.push(...excludePatterns);
            } else {
              rule.exclude = [rule.exclude, ...excludePatterns];
            }
          } else {
            rule.exclude = excludePatterns.length === 1 ? excludePatterns[0] : excludePatterns;
          }
        }
      }
    });
    
    // Also use IgnorePlugin as a fallback - completely exclude troika-three-text
    // Note: The source files are already patched, but this prevents any bundling issues
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /troika-three-text/,
        contextRegExp: /node_modules/,
      })
    );
    
    return config;
  },
  
  // TypeScript and ESLint (keep for now, but should be fixed)
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix TypeScript errors
  },
  reactStrictMode: true, // Enable for better React behavior
  eslint: {
    ignoreDuringBuilds: true, // TODO: Fix ESLint errors
  },
};

export default nextConfig;
