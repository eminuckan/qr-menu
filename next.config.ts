import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75],
    remotePatterns:[
      {
        protocol: 'https',
        hostname: 'auvcgbdzyhbuwekgkhsb.supabase.co'
      }
    ],
    maximumRedirects: 3
  }
};

export default nextConfig;
