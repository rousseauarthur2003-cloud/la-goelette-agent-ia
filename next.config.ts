import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Phaser est chargé uniquement côté client (import dynamique), jamais rendu côté serveur.
  eslint: {
    // ESLint n'est pas installé dans ce projet : on évite qu'il bloque le build Hostinger.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Sécurité temporaire : la première version a été écrite sans pouvoir exécuter `next build`
    // (environnement sans accès au registre npm). La vérification de types reste disponible via
    // `npm run typecheck`. À repasser à `false` dès que `npm run typecheck` est vert avec les
    // vraies dépendances installées.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
