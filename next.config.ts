import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fco.dn.nexoncdn.co.kr',
        pathname: '/live/externalAssets/**',
      },
      {
        protocol: 'https',
        hostname: 'ssl.nexon.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
