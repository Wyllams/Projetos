import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ===== Configuração do LocalSEO ===== */

  // Forçar variáveis de ambiente do servidor (bypassa dotenv-expand que engole o $ da chave Asaas)
  env: {
    ASAAS_API_KEY: "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjcyZmJjYWEzLTA2MjktNGI3Yi05ZTY5LTA0ZWUzMTU5ZGFiZDo6JGFhY2hfZWEwNGYwNGEtOTgzZS00ODViLTllZmYtZDUxMjU4ODI4ZWU0",
    ASAAS_ENVIRONMENT: "sandbox",
    ASAAS_WEBHOOK_TOKEN: "localseo_webhook_2026",
  },


  // Imagens externas permitidas (Unsplash + Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "sokskmuynndtjthuikgb.supabase.co",
      },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
