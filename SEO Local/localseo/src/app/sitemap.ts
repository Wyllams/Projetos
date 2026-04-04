import { MetadataRoute } from "next";
import { bd } from "@/db";
import { artigos } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Sitemap dinâmico do Next.js
 * Ele gera automaticamente o arquivo sitemap.xml para indexação no Google.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const URL_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Busca todos os artigos publicados
  const listaArtigos = await bd.query.artigos.findMany({
    where: eq(artigos.status, "PUBLICADO"),
    columns: { slug: true, publicadoEm: true, criadoEm: true },
  });

  const urlsArtigos = listaArtigos.map((artigo: any) => ({
    url: `${URL_BASE}/blog/${artigo.slug}`,
    lastModified: artigo.publicadoEm || artigo.criadoEm || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Rotas estáticas padrões
  const rotasEstaticas = [
    {
      url: `${URL_BASE}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${URL_BASE}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return [...rotasEstaticas, ...urlsArtigos];
}
