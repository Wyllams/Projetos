// supabase/functions/generate-super-page/index.ts
// OMNISEEN SUPER PAGE ENGINE v5.0 — MULTI-PASS ARCHITECTURE
// Pipeline: SERP -> Outline Agent (JSON) -> Section Agents (Markdown) -> Quality Gate -> DB

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSystemPrompt, buildOutlinePrompt, buildSectionPrompt } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ─── AGENT-1: SERP ────────────────────────────────────────────────────────────
async function runSerpAgent(keyword: string, cidade: string, serperKey: string) {
  if (!serperKey) return { paa: [], organic: [], relatedSearches: [], localPack: [] };
  try {
    const q = cidade ? keyword + " " + cidade : keyword;
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q, gl: "br", hl: "pt", num: 10 }),
    });
    if (!res.ok) throw new Error("Serper HTTP " + res.status);
    const data = await res.json();
    return {
      paa: ((data.peopleAlsoAsk ?? []) as any[]).slice(0, 10).map((q: any) => q.question),
      organic: ((data.organic ?? []) as any[]).slice(0, 8).map((r: any) => ({
        title: r.title, snippet: r.snippet, domain: r.domain, link: r.link,
      })),
      relatedSearches: ((data.relatedSearches ?? []) as any[]).slice(0, 15).map((r: any) => r.query),
      localPack: ((data.localResults ?? []) as any[]).slice(0, 3).map((r: any) => r.title),
    };
  } catch (e) {
    console.warn("[AGENT-1] SERP fallback:", e);
    return { paa: [], organic: [], relatedSearches: [], localPack: [] };
  }
}

// ─── AGENT-2A: Outline Writer (JSON ONLY) ─────────────────────────────────────
async function runOutlineAgent(params: any): Promise<any> {
  const { openaiKey, tone, language } = params;
  const systemPrompt = buildSystemPrompt(tone, language);
  const userPrompt = buildOutlinePrompt(params);

  console.log("[AGENT-2A] Generating Outline JSON...");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + openaiKey },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error("GPT-4o Outline failed: " + JSON.stringify(data.error || data));
  }

  let raw = data.choices[0].message.content.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.toc || parsed.toc.length === 0) {
      // Fallback safe TOC
      parsed.toc = [{ id: "intro", label: "O que é " + params.keyword }];
    }
    return parsed;
  } catch (e) {
    console.error("[AGENT-2A] Parse error:", raw.substring(0, 300));
    throw new Error("Invalid Outline JSON");
  }
}

// ─── AGENT-2B: Section Writer (MARKDOWN ONLY) ─────────────────────────────────
async function runSectionAgent(params: any, sectionId: string, sectionTitle: string): Promise<string> {
  const { openaiKey, tone, language } = params;
  const systemPrompt = buildSystemPrompt(tone, language);
  const userPrompt = buildSectionPrompt(params, sectionTitle);

  console.log("[AGENT-2B] Generating Section: " + sectionTitle);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + openaiKey },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.7, // Creativity for text
      max_tokens: 2500, // Enough for 800-1000 words
    }),
  });

  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) {
    console.warn("[AGENT-2B] Failed to generate section " + sectionTitle);
    return "Falha ao carregar conteúdo desta seção.";
  }

  let text = data.choices[0].message.content.trim();
  
  // Replace pseudo-fences if any
  text = text.replaceAll("BLOCK_IMAGE_START", "```image").replaceAll("BLOCK_IMAGE_END", "```");
  text = text.replaceAll("BLOCK_CTA_START", "```cta").replaceAll("BLOCK_CTA_END", "```");

  return text;
}

// ─── AGENT-3: Schema ──────────────────────────────────────────────────────────
function buildSchema(page: any, blogName: string, blogUrl: string) {
  return {
    article: {
      "@context": "https://schema.org", "@type": "Article",
      headline: page.meta?.title_tag ?? "",
      description: page.meta?.meta_description ?? "",
      datePublished: page.autor?.data_publicacao ?? new Date().toISOString().split("T")[0],
      dateModified: new Date().toISOString().split("T")[0],
      author: { "@type": "Person", name: page.autor?.nome ?? "Equipe Omniseen", jobTitle: page.autor?.cargo ?? "", description: page.autor?.bio ?? "" },
      publisher: { "@type": "Organization", name: blogName, url: blogUrl || "https://omniseen.com.br" },
      inLanguage: "pt-BR",
      wordCount: page.word_count ?? 4500,
      keywords: page.meta?.keyword_principal ?? "",
    },
    faqpage: {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: (page.faq ?? []).map((item: any) => ({
        "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  };
}

// ─── AGENT-4: Quality Gate (0-100%) ───────────────────────────────────────────
function runQualityGate(page: any, wc: number, content: string, language: string) {
  const issues: string[] = [];
  let score = 0;
  
  const h2 = (content.match(/^## /gm) ?? []).length;
  const h3 = (content.match(/^### /gm) ?? []).length;
  const imgs = (content.match(/```image/g) ?? []).length;
  const ctas = (content.match(/```cta/g) ?? []).length;
  const extLinks = (content.match(/\[.+?\]\(https?:\/\//g) ?? []).length;

  const isUS = (language || "pt-br").toLowerCase().includes("en");
  const minWc = isUS ? 3000 : 2000;
  const minH2 = isUS ? 8 : 5;
  const minH3 = isUS ? 6 : 4;

  const checks: [boolean, string][] = [
    [!!page.meta?.title_tag, "Meta title ausente"],
    [(page.meta?.title_tag?.length ?? 0) <= 65, "Meta title acima de 65 chars"],
    [!!page.meta?.meta_description, "Meta description ausente"],
    [(page.meta?.meta_description?.length ?? 0) >= 140, "Meta description abaixo de 140 chars"],
    [wc >= minWc, `Abaixo de ${minWc.toLocaleString("pt-BR")} palavras (tem ${wc})`],
    [content.length >= (minWc * 5), `Conteúdo curto (<${(minWc * 5).toLocaleString("pt-BR")} chars)`],
    [h2 >= minH2, `Menos de ${minH2} H2s (tem ${h2})`],
    [h3 >= minH3, `Menos de ${minH3} H3s (tem ${h3})`],
    [imgs >= 3, "Menos de 3 blocos de imagem (tem " + imgs + ")"],
    [ctas >= 3, "Menos de 3 CTAs (tem " + ctas + ")"],
    [extLinks >= 5, "Menos de 5 links externos (tem " + extLinks + ")"],
    [/\|.+\|.+\|/.test(content), "Tabela comparativa ausente"],
    [(page.faq?.length ?? 0) >= 5, "FAQ com menos de 5 perguntas"],
    [!!page.meta?.slug, "Slug ausente"],
  ];

  for (const [ok, issue] of checks) {
    if (ok) score++;
    else issues.push(issue);
  }

  const pct = Math.round((score / checks.length) * 100);
  return { passed: pct >= 80, score: pct, issues };
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  console.log("[generate-super-page v5 Multi-Pass] start");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY nao configurado");

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json();
    const { blog_id, keyword, nicho, mode = "pillar", tone = "profissional e persuasivo", language = "pt-br", title } = body;
    if (!blog_id || !keyword) return new Response(JSON.stringify({ error: "blog_id e keyword sao obrigatorios" }), { status: 400, headers: corsHeaders });

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let { data: blog } = await supabase.from("blogs").select("*").eq("id", blog_id).eq("user_id", user.id).maybeSingle();
    if (!blog) {
      const { data: mb } = await supabase.from("blogs").select("*, tenant_members!inner(user_id)").eq("id", blog_id).eq("tenant_members.user_id", user.id).maybeSingle();
      blog = mb;
    }
    if (!blog) return new Response(JSON.stringify({ error: "Blog nao encontrado" }), { status: 403, headers: corsHeaders });

    const cidade = blog.cidade || "";
    const bairro = blog.bairro || "";
    const blogName = blog.name || "Omniseen";
    const blogUrl = blog.domain ? "https://" + blog.domain : "";
    const blogNicho = nicho || blog.niche || blog.segmento || "Local Business";
    const servicos = blog.servicos_oferecidos || blog.target_audience || "";

    // 1. Gather Context
    console.log(`[v5] Starting Pipeline for: "${keyword}" na cidade: "${cidade}"`);
    const serpData = await runSerpAgent(keyword, cidade, SERPER_API_KEY);
    
    // Formatting variables for prompts
    const paaList = serpData.paa.length > 0 ? serpData.paa.map((q: string, i: number) => (i + 1) + ". " + q).join("\n") : "Crie perguntas frequentes.";
    const competidoresBlock = serpData.organic.length > 0 ? "\n## CONCORRENTES TOP:\n" + serpData.organic.map((r: any) => "- " + r.title).join("\n") : "";
    const externalLinksRef = serpData.organic.filter((r: any) => r.link).slice(0, 8).map((r: any) => "- [" + r.title + "](" + r.link + ")").join("\n");
    const relatedKws = serpData.relatedSearches.join(", ") || keyword;
    
    const params = {
      keyword, nicho: blogNicho, cidade, bairro, blogName, servicos,
      paaList, relatedKws, competidoresBlock, localBlock: "", externalLinksRef,
      openaiKey: OPENAI_API_KEY, tone, language
    };

    // 2. Multi-pass Phase 1: Outline
    const outline = await runOutlineAgent(params);
    let tocList = outline.toc || [];
    
    console.log(`[v5] Outline done. Generated ${tocList.length} sections.`);
    
    // 3. Multi-pass Phase 2: Concurrent Section Generation
    let finalMarkdown = "";
    
    // Batch process to avoid hitting API rate limits instantly or blocking resources
    const batches = chunkArray<{id: string, label: string}>(tocList, 3); // 3 concurrent requests at a time
    
    for (let i = 0; i < batches.length; i++) {
        console.log(`[v5] Processing batch ${i+1}/${batches.length}...`);
        const batch = batches[i];
        
        const promises = batch.map(item => runSectionAgent(params, item.id, item.label));
        const results = await Promise.all(promises);
        
        batch.forEach((item, idx) => {
            const returnedMd = results[idx];
            // Format strictly
            finalMarkdown += `\n\n## ${item.label}\n\n`;
            finalMarkdown += returnedMd;
        });
    }

    const wc = finalMarkdown.split(/\s+/).filter(Boolean).length;
    console.log("[v5] Multi-pass done! final word count=" + wc);

    // 4. Assemble and Save
    const schema = buildSchema(outline, blogName, blogUrl);
    const qa = runQualityGate(outline, wc, finalMarkdown, language);
    console.log("[v5] Quality Score=" + qa.score + "%");

    const slugBase = outline.meta?.slug || keyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = slugBase + "-" + Date.now().toString(36);

    const { data: inserted, error: insertError } = await supabase
      .from("super_pages")
      .insert({
        blog_id, user_id: user.id,
        title: title || outline.meta?.title_tag || keyword,
        slug,
        meta_title: outline.meta?.title_tag ?? "",
        meta_description: outline.meta?.meta_description ?? "",
        focus_keyword: keyword,
        content_markdown: finalMarkdown,
        key_takeaways: outline.key_takeaways ?? [],
        toc: outline.toc ?? [],
        faq: outline.faq ?? [],
        cta_primary: outline.cta_primary ?? {},
        cta_secondary: outline.cta_secondary ?? {},
        imagens: [],
        internal_links: [],
        autor: outline.autor ?? {},
        schema_article: schema.article,
        schema_faqpage: schema.faqpage,
        quality_score: qa.score,
        quality_issues: qa.issues,
        serp_data: { paa: serpData.paa, topResult: serpData.organic[0] ?? null, relatedSearches: serpData.relatedSearches },
        word_count: wc,
        status: qa.passed ? "draft" : "needs_review",
      })
      .select("id")
      .single();

    if (insertError) throw new Error("Falha ao salvar: " + insertError.message);

    return new Response(JSON.stringify({
      page_id: inserted.id, slug,
      title: outline.meta?.title_tag,
      quality: { score: qa.score, passed: qa.passed, issues: qa.issues },
      word_count: wc,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[v5] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
