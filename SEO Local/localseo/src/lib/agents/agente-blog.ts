import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

// O conteúdo será um array de blocos para facilitar a renderização dinâmica e segura depois
const schemaBlocoConteudo = z.object({
  tag: z.enum(["h2", "h3", "p", "ul"]),
  conteudo: z.string().describe("O texto do bloco html. Se a tag for 'ul', envie uma lista de itens separados por |."),
});

const schemaArtigoGerado = z.object({
  titulo: z.string().describe("Título magnético focado na palavra-chave (máx 60 caracteres)."),
  metaDescricao: z.string().describe("Meta-description persuasiva para o Google (máx 150 caracteres)."),
  palavraChave: z.string().describe("A palavra-chave primária principal do artigo."),
  palavrasChaveSecundarias: z.array(z.string()).describe("3 a 5 palavras-chave complementares LSI (SEO)."),
  blocosDeConteudo: z.array(schemaBlocoConteudo).describe("O corpo do artigo longo estruturado topicamente."),
  termo_busca_imagem: z.string().describe("Palavra EXATA em inglês para a api do Unsplash buscar a foto de capa (ex: 'modern barber interior')."),
});

export type ResultadoArtigoBlog = z.infer<typeof schemaArtigoGerado>;

interface ParamsAgenteBlog {
  nomeNegocio: string;
  categoriaNegocio: string;
  temaSugestao: string;
}

export async function gerarArtigoBlogIA(params: ParamsAgenteBlog): Promise<ResultadoArtigoBlog> {
  // Mock para desenvolvimento local sem custos de token
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
    await new Promise((res) => setTimeout(res, 2500));
    return {
      titulo: `Guia Completo sobre ${params.temaSugestao} na ${params.categoriaNegocio}`,
      metaDescricao: `Aprenda tudo sobre ${params.temaSugestao} e como a ${params.nomeNegocio} oferece os melhores serviços da região para você.`,
      palavraChave: params.temaSugestao,
      palavrasChaveSecundarias: ["Dicas", "Como funciona", params.categoriaNegocio, "Especialista"],
      termo_busca_imagem: "professional service",
      blocosDeConteudo: [
        { tag: "p", conteudo: `O tema "${params.temaSugestao}" é altamente relevante hoje.` },
        { tag: "h2", conteudo: "Por que isso é tão importante?" },
        { tag: "p", conteudo: `Descobrir mais sobre ${params.temaSugestao} vai melhorar muito a sua percepção. A ${params.nomeNegocio} se preocupa em explicar tudo aos clientes.` },
        { tag: "h3", conteudo: "O Benefício Principal" },
        { tag: "ul", conteudo: "Gera mais conforto|Garante qualidade de atendimento|Melhora de performance em tempo recorde" },
        { tag: "p", conteudo: `Espero que tenha gostado das dicas preparadas pela nossa equipe! Visite a ${params.nomeNegocio} hoje mesmo.` }
      ],
    };
  }

  const systemPrompt = `Você é um Copywriter Sênior de SEO focado exclusivamente em "EEAT" (Experiência, Especialidade, Autoridade e Confiança).
Você vai ajudar a ranquear o site de um pequeno negócio local.
Eu te darei o Negócio e o Tema sobre qual escrever.
Regras:
1. Crie um artigo longo (ideal para ranquear, aprofundado).
2. Escreva blocos dinâmicos alternando parágrafos curtos, H2s lógicos, H3s, e bullet points (usando o separador | caso "ul").
3. Inclua a palavra-chave primária naturalmente pelo menos no título, na introdução (1º paragrafo) e num subtítulo.
4. Finalize com uma chamada para ação orgânica para o negócio local.
5. Todo o texto deverá ser formal, amigável e voltado ao público brasileiro (PT-BR).`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            titulo: { type: SchemaType.STRING },
            metaDescricao: { type: SchemaType.STRING },
            palavraChave: { type: SchemaType.STRING },
            palavrasChaveSecundarias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            termo_busca_imagem: { type: SchemaType.STRING },
            blocosDeConteudo: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  tag: { type: SchemaType.STRING },
                  conteudo: { type: SchemaType.STRING }
                },
                required: ["tag", "conteudo"]
              }
            }
          },
          required: ["titulo", "metaDescricao", "palavraChave", "palavrasChaveSecundarias", "termo_busca_imagem", "blocosDeConteudo"]
        }
      }
    });

    // Gemini system instructions need to be provided inside getGenerativeModel or prepend to user prompt
    const finalPrompt = `${systemPrompt}\n\nNegócio: ${params.nomeNegocio} (Categoria: ${params.categoriaNegocio}).\nTema/Sugestão de Artigo: ${params.temaSugestao}`;

    const resultado = await model.generateContent(finalPrompt);
    const textoJson = resultado.response.text();
    
    // Converte e valida via Zod para garantir 100% de match
    const objeto = JSON.parse(textoJson);
    return schemaArtigoGerado.parse(objeto);

  } catch (erro) {
    console.error("[Agente Blog] Erro Gemini:", erro);
    throw erro;
  }
}
