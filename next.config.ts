import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/foundations', destination: '/components/foundations', permanent: true }];
  },
};

export default nextConfig;
