import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix webpack chunk loading issues
  webpack: (config, { isServer }) => {
    // Ensure proper chunk path resolution
    if (isServer) {
      config.output.publicPath = '/_next/';
    }
    
    // Handle JSON imports properly
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    
    return config;
  },
  // Ensure static files are served correctly
  assetPrefix: '',
};

export default nextConfig;
