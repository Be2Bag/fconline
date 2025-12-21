import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers - ป้องกันช่องโหว่ทั่วไป
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ป้องกัน Clickjacking - ไม่อนุญาตให้ embed ใน iframe
          { key: 'X-Frame-Options', value: 'DENY' },
          // ป้องกัน MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // ป้องกัน XSS (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // ควบคุม Referrer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // ปิด permissions ที่ไม่จำเป็น
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
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
