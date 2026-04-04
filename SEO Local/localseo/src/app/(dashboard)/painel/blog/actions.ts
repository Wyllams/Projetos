"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { artigos, negocios, execucoesAgente } from "@/db/schema";
import { eq } from "drizzle-orm";
import { gerarArtigoBlogIA } from "@/lib/agents/agente-blog";
import { buscarImagemUnsplash } from "@/lib/unsplash";
import { gerarSlug } from "@/lib/utils";

export async function criarNovoArtigoIA(temaPrincipal: string) {
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

    // 1. Aciona o Claude para escrever o artigo longo estruturado JSON
    const resultadoIA = await gerarArtigoBlogIA({
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
      temaSugestao: temaPrincipal,
    });

    // 2. Busca Imagem de Cover "Hero" no Unsplash usando o termo fornecido
    const urlImagem = await buscarImagemUnsplash(resultadoIA.termo_busca_imagem);

    // 3. Salvar auditoria
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "BLOG",
      status: "SUCESSO",
      resultado: { tituloGerado: resultadoIA.titulo, imagemFinal: urlImagem, palavraChave: resultadoIA.palavraChave },
      duracaoMs: Date.now() - inicioExecucao,
    });

    // 4. Salvar o artigo de fato para ser renderizado pelo front/publico
    const slugDesejado = gerarSlug(resultadoIA.titulo);
    
    // Check de slugs duplicados pode ser refinado dps (se der erro de unicidade anexa numero)
    // Usamos um schema jsonb(conteudo) nativo do pg
    await bd.insert(artigos).values({
      negocioId: negocioDb.id,
      titulo: resultadoIA.titulo,
      slug: slugDesejado,
      metaDescricao: resultadoIA.metaDescricao,
      palavraChave: resultadoIA.palavraChave,
      palavrasChaveSecundarias: resultadoIA.palavrasChaveSecundarias,
      conteudo: resultadoIA.blocosDeConteudo, // Injeta o array direto no Jsonb
      imagemHero: urlImagem,
      status: "PUBLICADO", // Automatico pra simplificar fase de testes
      publicadoEm: new Date(),
    });

    revalidatePath("/painel/blog");

    return { sucesso: true, slug: slugDesejado };
  } catch (erro) {
    console.error("Action error criarNovoArtigoIA:", erro);
    return { sucesso: false, erro: "Ocorreu um erro interno na IA ao gerar o Artigo." };
  }
}
