"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { postagens, negocios, execucoesAgente } from "@/db/schema";
import { eq } from "drizzle-orm";
import { gerarPostagemGMB } from "@/lib/agents/agente-posts";
import { buscarImagemUnsplash } from "@/lib/unsplash";

export async function criarNovaPostagemIA(instrucaoCustomizada?: string) {
  try {
    const inicioExecucao = Date.now();

    const sessao = await auth.api.getSession({
      headers: await headers(),
    });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // 1. Chama a IA para gerar o conteúdo
    const resultadoIA = await gerarPostagemGMB({
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
      instrucaoPersonalizada: instrucaoCustomizada
    });

    // 2. Busca Imagem no Unsplash Baseada no Termo Gerado
    const urlImagem = await buscarImagemUnsplash(resultadoIA.termo_busca_imagem);

    // 3. Salvar log de auditoria
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "GMB",
      status: "SUCESSO",
      resultado: { ...resultadoIA, imagemFinal: urlImagem },
      duracaoMs: Date.now() - inicioExecucao,
    });

    // 4. Integração Real: Publicar no Google Meu Negócio (Fase 4)
    let statusPublicacao: "PUBLICADO" | "FALHOU" | "RASCUNHO" | "AGENDADO" = "PUBLICADO";
    let linkPublicado = undefined;
    
    // Tenta puxar dinamicamente o Helper (Padrão de Falha Graciosa)
    try {
      const { getGoogleAccessToken, publicarPostGMB } = await import("@/lib/google-api/gmb");
      const accessToken = await getGoogleAccessToken(sessao.user.id);
      
      if (accessToken && negocioDb.gmbContaId && negocioDb.gmbLocalId) {
        if (negocioDb.gmbContaId.includes("sandbox")) {
          console.log("[Fase 4] Rodando em Modo Sandbox - pulando disparo para API Real");
          statusPublicacao = "PUBLICADO";
        } else {
          // Enviar para o Google!
          console.log("[Fase 4] Disparando para API Oficial do GMB!");
          const apiResponse = await publicarPostGMB(
            accessToken,
            negocioDb.gmbContaId, // ex: accounts/123
            negocioDb.gmbLocalId,  // ex: accounts/123/locations/456
            resultadoIA.conteudo,
            urlImagem,
            "LEARN_MORE", // CTA Default
            negocioDb.website || "https://local-seo-saas.vercel.app" // Fallback fallback URL
          );
          console.log("[Fase 4] Sucesso:", apiResponse);
          linkPublicado = apiResponse.searchUrl; // A API retorna a URL no maps
        }
      } else {
        console.log("[Fase 4] Modo Simulação (OAuth, Conta ou Local não conectados no Banco)");
      }
    } catch (apiError) {
      console.error("[Fase 4] Erro gravíssimo ao publicar na API:", apiError);
      statusPublicacao = "FALHOU";
    }

    // 5. Salvar postagem no Banco de Dados
    await bd.insert(postagens).values({
      negocioId: negocioDb.id,
      conteudo: resultadoIA.conteudo,
      imagemUrl: urlImagem,
      tipo: resultadoIA.tipo,
      status: statusPublicacao, 
      publicadoEm: new Date(),
    });

    revalidatePath("/painel/postagens");

    return { sucesso: true };
  } catch (erro) {
    console.error("Action error criarNovaPostagemIA:", erro);
    return { sucesso: false, erro: "Ocorreu um erro interno na IA ao gerar o post." };
  }
}
