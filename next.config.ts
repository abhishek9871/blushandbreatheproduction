import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Compress responses
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@/components', 'lucide-react'],
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.transparentlabs.com',
      },
      {
        protocol: 'https',
        hostname: '*.nootropicsdepot.com',
      },
      {
        protocol: 'https',
        hostname: '*.iherb.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'dailymed.nlm.nih.gov',
      },
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Cache static assets
      {
        source: '/api/substances/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // Redirects for legacy routes (if needed)
  async redirects() {
    return [
      // Example: Redirect old routes to new substance routes
      // {
      //   source: '/drugs/:slug',
      //   destination: '/medicine/:slug',
      //   permanent: true,
      // },
    ];
  },
};

export default nextConfig;
