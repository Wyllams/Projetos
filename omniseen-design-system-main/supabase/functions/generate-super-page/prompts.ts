// supabase/functions/generate-super-page/prompts.ts

export function buildSystemPrompt(tone: string, language: string) {
  return [
    "Voce é um especialista nivel Senior em SEO Local, Copywriting de Conversao e Marketing de Conteudo E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).",
    "Sua missao e escrever artigos 'Pillar Pages / Super Pages' gigantescos, densos e perfeitos para ranquear no Google, massacrando a concorrencia.",
    "Seu tom de voz DEVE SER ESTRITAMENTE: " + tone + ".",
    "Seu idioma de resposta DEVE SER ESTRITAMENTE: " + language + ".",
    "Voce compreende a intencao de busca e responde diretamente a dor do usuario de forma assertiva e confiavel.",
    "Voce NUNCA inventa dados irreais, telefones ou enderecos que nao foram fornecidos. Use os blocos de contexto fornecidos.",
    "VOCE ESCREVE DE FORMA EXTENSA, PROFUNDA, DENSA E ALTAMENTE PERSUASIVA.",
  ].join("\n");
}

export function buildOutlinePrompt(params: any) {
  const { keyword, nicho, blogName, cidade, bairro, servicos, paaList, relatedKws, competidoresBlock, localBlock, language = "pt-br" } = params;
  const cidadeStr = bairro ? cidade + ", " + bairro : cidade;
  
  const isUS = language.toLowerCase().includes("en");
  const targetH2s = isUS ? "EXATAMENTE DE 8 A 10 SEÇÕES H2" : "EXATAMENTE DE 5 A 7 SEÇÕES H2";
  const numFaq = isUS ? "8" : "5";

  return [
    "## MISSAO: Criar a ARQUITETURA DE INFORMAÇÃO (Outline JSON) da SUPER PAGE definitiva sobre: " + keyword,
    "Sua tarefa é focar 100% na estrutura e metadados. VOCE DEVE RETORNAR APENAS UM JSON VALIDO. NÃO GERE O MARKDOWN AQUI.",
    "",
    "KEYWORD PRINCIPAL: " + keyword,
    "NICHO: " + nicho,
    "EMPRESA: " + blogName,
    "CIDADE: " + cidadeStr,
    "SERVICOS: " + (servicos || "Geral"),
    "",
    "## PERGUNTAS REAIS DO GOOGLE (People Also Ask):",
    paaList,
    "",
    "## KEYWORDS RELACIONADAS:",
    relatedKws,
    competidoresBlock,
    localBlock,
    "",
    "## INSTRUÇÕES PARA O JSON:",
    "Crie um TOC (Sumário) com " + targetH2s + " altamente detalhadas e lógicas.",
    "A primeira seção deve introduzir o tema e a última ser a Conclusão.",
    "Distribua taticamente as keywords relacionadas nos H2s.",
    "",
    "### O TIPO DA RESPOSTA DEVE SER ESTE JSON EXATO:",
    JSON.stringify({
      meta: {
        title_tag: "keyword + diferencial local, max 60 chars",
        meta_description: "DEVE TER NO MÍNIMO 145 CARACTERES E NO MÁXIMO 155. Não entregue menos de 145 caracteres!! Descreva os beneficios para o leitor em " + cidadeStr,
        slug: "kebab-case-sem-acento-max-6-palavras",
        keyword_principal: keyword,
      },
      key_takeaways: [
        "insight 1 acionavel", "insight 2 numérico", "insight 3 diferencial", "insight 4", "insight 5", "insight 6"
      ],
      toc: [
        { id: "introducao", label: "O que é " + keyword },
        { id: "importancia", label: "Por que investir nisso em " + cidadeStr },
        { id: "como-fazer", label: "Como Funciona na Prática" }
      ],
      faq: [
        { q: "Pergunta 1 (PAA)", a: "Resposta 1 clara" },
        { q: "Pergunta 2 (PAA)", a: "Resposta 2 clara" }
      ],
      cta_primary: { text: "Solicite um Orçamento em " + cidadeStr, anchor: "#contato" },
      cta_secondary: { text: "Fale com Especialista", anchor: "#contato" },
      autor: { nome: "Redação " + blogName, bio: "Especialistas.", cargo: "Especialista em " + nicho, data_publicacao: new Date().toISOString() }
    }, null, 2),
    "",
    "RETORNE APENAS O JSON E NADA MAIS. MANTENHA A ESTRUTURA RIGOROSAMENTE. TENTE GERAR " + numFaq + " PERGUNTAS NO FAQ."
  ].join("\n");
}

export function buildSectionPrompt(params: any, sectionTitle: string) {
  const { keyword, nicho, blogName, cidade, bairro, servicos, externalLinksRef, language = "pt-br" } = params;
  const cidadeStr = bairro ? cidade + ", " + bairro : cidade;
  
  const isUS = language.toLowerCase().includes("en");
  const targetWords = isUS ? "CERCA DE 350 A 450 PALAVRAS" : "CERCA DE 300 A 400 PALAVRAS";

  return [
    "## MISSAO: Escrever APENAS a seguinte seção específica para uma Super Page sobre " + keyword + ".",
    "TÍTULO DA SEÇÃO (Seu Foco Único): " + sectionTitle,
    "",
    "CONTEXTO GERAL (Para manter coesão, mas NÃO repita a introdução do artigo):",
    "Keyword Principal: " + keyword,
    "Empresa: " + blogName,
    "Cidade: " + cidadeStr,
    "Nicho: " + nicho,
    "Serviços: " + (servicos || "Geral"),
    "",
    "## INSTRUÇÕES CRÍTICAS DE REDAÇÃO:",
    "1. NÃO inicie escrevendo o título H2 (" + sectionTitle + "). Vá direto para o conteúdo da seção.",
    "2. ESCREVA NO MÍNIMO 4 PARÁGRAFOS. QUEREMOS " + targetWords + " SÓ PARA ESTA SEÇÃO. Seja profundo mas não prolixo.",
    "3. Use H3 (###) livremente para dividir sub-pontos dentro desta seção.",
    "4. Se fizer sentido para esta seção, inclua uma tabela Markdown (| Col | Col |).",
    "5. Use listas (com `1.` ou `-`) sempre que precisar detalhar etapas ou recursos.",
    "6. OBRIGATÓRIO: Incorpore PELO MENOS UM link externo naturalmente no meio do seu texto, usando markdown `[texto âncora](URL)`. Escolha alguma destas referências: " + externalLinksRef,
    "7. Obrigatório: Em algum ponto estratégico do texto (entre parágrafos), adicione UM BLOCO de imagem com exata e precisamente esta sintaxe nas linhas isoladas:",
    "```image",
    "prompt: [ESCREVA AQUI UM PROMPT EM INGLÊS EXTREMAMENTE DETALHADO (Midjourney style) PARA GERAR UMA FOTO REALISTA sobre " + sectionTitle + ". Ex: A hyper-realistic professional photography of...]",
    "alt: [Descrição curta na língua oficial da postagem, para SEO]",
    "position: mid",
    "```",
    "8. Obrigatório: Em algum ponto do texto, adicione UM BLOCO de CTA exatamente com a sintaxe nas linhas isoladas:",
    "```cta",
    "type: primary",
    "text: Entrar em contato com " + blogName + " em " + cidadeStr,
    "anchor: #contato",
    "```",
    "",
    "VÁ DIRETO AO PONTO. RESPONDA APENAS COM O MARKDOWN RAW DA SEÇÃO. SEM FRASES DE INTRODUÇÃO COMO 'Aqui está a seção'. NÃO RETORNE JSON."
  ].join("\n");
}
