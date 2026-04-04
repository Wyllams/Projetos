import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

const schemaPostagemCriada = z.object({
  conteudo: z.string().describe("O texto otimizado para o Google Meu Negócio, persuasivo, contendo emojis e call to action."),
  termo_busca_imagem: z.string().describe("Uma palavra-chave em INGLÊS (curta, ex: 'barber shop', 'coffee cup') para buscarmos na API do Unsplash."),
  tipo: z.enum(["NOVIDADE", "OFERTA", "EVENTO"]).describe("A categoria que melhor define esta postagem."),
});

type ResultadoPost = z.infer<typeof schemaPostagemCriada>;

interface ParamsAgentePost {
  nomeNegocio: string;
  categoriaNegocio: string;
  instrucaoPersonalizada?: string;
}

export async function gerarPostagemGMB(params: ParamsAgentePost): Promise<ResultadoPost> {
  // Mock para quando testarmos localmente sem chave
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy") {
    await new Promise((res) => setTimeout(res, 2000));
    return {
      conteudo: `✨ Bem-vindo ao ${params.nomeNegocio}! ✨\n\nEstá precisando de um ótimo serviço focado em ${params.categoriaNegocio}? Nossa equipe está pronta para te atender com toda a atenção e qualidade que você merece.\n\n👇 Clique no link abaixo, confira nossos preços ou mande uma mensagem pelo WhatsApp. Não deixe para depois, agende seu horário hoje mesmo!\n\n#${params.categoriaNegocio.replace(/\s+/g,"")} #${params.nomeNegocio.replace(/\s+/g,"")} #AtendimentoDeQualidade #GoogleMeuNegocio`,
      termo_busca_imagem: params.categoriaNegocio === "Barbearia" ? "barber shop" : params.categoriaNegocio === "Cafeteria" ? "coffee" : "business presentation",
      tipo: "NOVIDADE",
    };
  }

  const systemPrompt = `Você é um Gerente de SEO Local e Social Media impecável no método 'Copywriting Direct Response'.
O usuário vai te passar o nome de um negócio e sua categoria. Você deve gerar um post super engajador para o "Google Meu Negócio" (GMB).
Regras:
1. O texto do post deve ter no máximo 1500 caracteres, mas idealmente entre 300-600.
2. Inicie com um 'gancho' forte.
3. Inclua motivos para visitar o lugar.
4. Feche sempre (sempre) com um Call To Action (Ex: Mande um WhatsApp, Ligue, Visite-nos).
5. Inclua 2 a 4 emojis discretos, não exagere.
6. A 'termo_busca_imagem' deve obrigatoriamente ser em Inglês para procurarmos no banco de imagens do Unsplash, foque em abstrações elegantes. O termo deve estar perfeitamente formatado (ex: "modern coffee shop aesthetic").`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            conteudo: { type: SchemaType.STRING },
            termo_busca_imagem: { type: SchemaType.STRING },
            tipo: { type: SchemaType.STRING, description: "Obrigatório ser um dentre: NOVIDADE, OFERTA, EVENTO" }
          },
          required: ["conteudo", "termo_busca_imagem", "tipo"]
        }
      }
    });

    const finalPrompt = `${systemPrompt}\n\nNegócio: ${params.nomeNegocio}\nCategoria: ${params.categoriaNegocio}\nInstrução ou tema: ${params.instrucaoPersonalizada || "Crie um post genérico, porém altamente otimizado de novidade ou serviços gerais."}`;

    const resultado = await model.generateContent(finalPrompt);
    const textoJson = resultado.response.text();
    
    // Validação de correspondência Zod
    const objeto = JSON.parse(textoJson);
    return schemaPostagemCriada.parse(objeto);

  } catch (erro) {
    console.error("[Agente Posts] Erro Gemini:", erro);
    throw erro;
  }
}
