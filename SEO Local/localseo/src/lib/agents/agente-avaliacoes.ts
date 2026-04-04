import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Inicializa o SDK caso haja a chave (pode ser mockado na Fase 0/1)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dummy",
});

/**
 * Interface estrita de saída da IA.
 * Garante que a IA responda exatamente neste formato JSON.
 */
const schemaRespostaAvaliacao = z.object({
  sentimento: z.enum(["POSITIVO", "NEGATIVO", "NEUTRO"]).describe("O sentimento geral detectado na avaliação."),
  resposta_sugerida: z.string().describe("A resposta educada, profissional e otimizada elaborada pela IA."),
});

type ResultadoAvaliacao = z.infer<typeof schemaRespostaAvaliacao>;

interface ParamsAgente {
  nota: number;
  texto: string;
  nomeCliente: string;
  nomeNegocio: string;
  categoriaNegocio: string;
}

/**
 * Agente de Avaliações (Claude 3.5 Sonnet)
 * Lê os dados da avaliação e elabora uma resposta cordial e com palavras-chave de SEO Local.
 */
export async function analisarEResponderAvaliacao(params: ParamsAgente): Promise<ResultadoAvaliacao> {
  // Se não tem chave de API configurada, retorna um Mock estático para testar a UI
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "dummy") {
    // delay falso
    await new Promise((res) => setTimeout(res, 1500));
    
    const sentimentoMock = params.nota >= 4 ? "POSITIVO" : params.nota === 3 ? "NEUTRO" : "NEGATIVO";
    const desculpa = sentimentoMock === "NEGATIVO" ? " Lamentamos que sua experiência não tenha sido a ideal, entraremos em contato." : "";
    
    return {
      sentimento: sentimentoMock,
      resposta_sugerida: `Olá ${params.nomeCliente}! Muito obrigado pela avaliação de ${params.nota} estrelas para nosso ${params.categoriaNegocio} (${params.nomeNegocio}).${desculpa} Esperamos vê-lo novamente em breve.`,
    };
  }

  // Integração Real utilizando Tool calls / Structured outputs
  const systemPrompt = `Você é um robô assistente especializado em SEO Local e Relações Públicas.
Seu objetivo é analisar uma avaliação que um cliente deixou no Google Meu Negócio e gerar uma resposta perfeita.
Regras da resposta:
- Tom profissional, cortês e acolhedor.
- Se for crítica (nota baixa), seja compreensivo e ofereça resolução. Não brigue com o cliente.
- Se for positivo, agradeça e convide a voltar.
- INCLUA o nome do negócio e a categoria de forma sutil na resposta para ajudar no SEO (ex: "Aqui na [Barbearia X] ficamos felizes...").
- Retorne EXATAMENTE o JSON com sentimento e a resposta.`;

  try {
    const resposta = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Negócio: ${params.nomeNegocio}\nCategoria: ${params.categoriaNegocio}\nCliente: ${params.nomeCliente}\nNota: ${params.nota}/5\nComentário: "${params.texto}"`,
        }
      ],
      tools: [
        {
          name: "output_review_response",
          description: "Gera a resposta estruturada para salvar no banco de dados.",
          input_schema: {
            type: "object",
            properties: {
              sentimento: {
                type: "string",
                enum: ["POSITIVO", "NEGATIVO", "NEUTRO"],
                description: "O sentimento da avaliação do cliente"
              },
              resposta_sugerida: {
                type: "string",
                description: "A resposta elaborada que será postada publicamente"
              }
            },
            required: ["sentimento", "resposta_sugerida"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "output_review_response" }
    });

    const conteudoTool = resposta.content.find(block => block.type === "tool_use");
    if (conteudoTool && 'input' in conteudoTool) {
      const parsed = schemaRespostaAvaliacao.parse(conteudoTool.input);
      return parsed;
    }
    
    throw new Error("A IA não retornou o esquema esperado.");

  } catch (erro) {
    console.error("[Agente Avaliacoes] Erro Claude:", erro);
    throw erro;
  }
}
