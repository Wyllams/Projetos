"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { avaliacoes, negocios, execucoesAgente } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analisarEResponderAvaliacao } from "@/lib/agents/agente-avaliacoes";

/**
 * Server Action que roda de forma segura no servidor.
 * Ela é disparada pelo Client Component da tabela e lida com banco + IA.
 */
export async function gerarRespostaComIA(avaliacaoId: string) {
  try {
    const inicioExecucao = Date.now();

    // 1. Check de segurança
    const sessao = await auth.api.getSession({
      headers: await headers(),
    });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    // 2. Buscar Avaliação e Negócio associado
    const avaliacaoDb = await bd.query.avaliacoes.findFirst({
      where: eq(avaliacoes.id, avaliacaoId),
    });

    if (!avaliacaoDb || !avaliacaoDb.texto) {
      return { sucesso: false, erro: "Avaliação não encontrada ou sem texto." };
    }

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.id, avaliacaoDb.negocioId),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // 3. Executar o Agente de IA para criar a resposta
    const resultadoIA = await analisarEResponderAvaliacao({
      nota: avaliacaoDb.nota,
      texto: avaliacaoDb.texto,
      nomeCliente: avaliacaoDb.autor,
      nomeNegocio: negocioDb.nome,
      categoriaNegocio: negocioDb.categoria,
    });

    // 4. Salvar log de auditoria no Banco (execucoes_agente)
    await bd.insert(execucoesAgente).values({
      negocioId: negocioDb.id,
      tipo: "AVALIACOES",
      status: "SUCESSO",
      resultado: resultadoIA,
      duracaoMs: Date.now() - inicioExecucao,
    });

    // 5. Atualizar a avaliação no banco com os dados gerados
    await bd.update(avaliacoes)
      .set({
        sentimento: resultadoIA.sentimento,
        textoResposta: resultadoIA.resposta_sugerida,
        respondido: true,
        respondidoEm: new Date(),
      })
      .where(eq(avaliacoes.id, avaliacaoId));

    // 6. Forçar atualização da página
    revalidatePath("/painel/avaliacoes");

    return { sucesso: true };

  } catch (erro) {
    console.error("Action error gerarRespostaComIA:", erro);
    return { sucesso: false, erro: "Ocorreu um erro interno na IA." };
  }
}
