import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: ['node-ical'],
    images: {
        qualities: [25, 50, 75, 100]
    }
};

export default nextConfig;
