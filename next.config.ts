import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                // Pour l'instant vu qu'on a pas de BDD,
                // je fetch les images aléatoirement depuis randomuser.me
                // plus tard on mettera ici le lien de Supabase pour les images
                protocol: 'https',
                hostname: 'randomuser.me'
            }
        ]
    }
};

export default nextConfig;
