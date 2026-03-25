import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Eye, Save, Loader2, Globe, Zap, BarChart2,
  BookOpen, HelpCircle, Megaphone, FileText, Settings, ChevronDown, Plus, Trash2, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSuperPage } from "@/hooks/useSuperpages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SuperPageMarkdownRenderer from "@/components/SuperPageMarkdownRenderer";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TocItem { id: string; label: string; }
interface FaqItem { q: string; a: string; }
interface CtaItem { text: string; anchor: string; }

function safeArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val as T[];
  return fallback;
}
function safeObj<T>(val: unknown, fallback: T): T {
  if (!val || typeof val !== "object" || Array.isArray(val)) return fallback;
  return val as T;
}

// ── Tab list ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "content", label: "Conteúdo", icon: FileText },
  { key: "blocks",  label: "Blocos",   icon: Zap },
  { key: "seo",     label: "SEO",      icon: BarChart2 },
  { key: "settings",label: "Config",   icon: Settings },
] as const;
type Tab = (typeof TABS)[number]["key"];

// ── Status config ────────────────────────────────────────────────────────────
const statusCfg: Record<string, { label: string; className: string }> = {
  draft:        { label: "Rascunho",  className: "bg-muted text-muted-foreground" },
  published:    { label: "Publicado", className: "bg-success/10 text-success border border-success/20" },
  needs_review: { label: "Revisar",   className: "bg-warning/10 text-warning border border-warning/20" },
  archived:     { label: "Arquivado", className: "bg-muted/50 text-muted-foreground" },
};

export default function SuperPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { page, setPage, loading, saving, lastSaved, save, publish, unpublish } = useSuperPage(id);

  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [markdown, setMarkdown] = useState("");
  const [preview, setPreview] = useState(true);

  // Editable meta fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [slug, setSlug] = useState("");

  // Blocks state
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [cta, setCta] = useState<CtaItem>({ text: "", anchor: "" });

  // Quality gate local state
  const [localScore, setLocalScore] = useState(0);
  const [localIssues, setLocalIssues] = useState<string[]>([]);
  const [localChecks, setLocalChecks] = useState<{ok: boolean, msg: string}[]>([]);
  const scoreRef = useRef(0);

  // Auto-save timer
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Populate from DB once loaded
  useEffect(() => {
    if (!page) return;
    setMarkdown(page.content_markdown ?? "");
    setMetaTitle(page.meta_title ?? "");
    setMetaDesc(page.meta_description ?? "");
    setSlug(page.slug ?? "");
    setTakeaways(safeArray<string>(page.key_takeaways));
    setFaq(safeArray<FaqItem>(page.faq));
    setCta(safeObj<CtaItem>(page.cta_primary, { text: "", anchor: "" }));
  }, [page]);

  // Recalculate score locally
  useEffect(() => {
    const wc = markdown.split(/\s+/).filter(Boolean).length;
    const issues: string[] = [];
    let score = 0;
    
    // Use more rigorous regexes to avoid counting empty or broken tags
    const h2 = (markdown.match(/^##\s+[^\n]+/gm) ?? []).length;
    const h3 = (markdown.match(/^###\s+[^\n]+/gm) ?? []).length;
    // Match block exactly: ```image\n ... \n``` where there's actual content
    const imgs = (markdown.match(/```image\s*\n(?!\s*```)[\s\S]+?```/gi) ?? []).length;
    const ctas = (markdown.match(/```cta\s*\n(?!\s*```)[\s\S]+?```/gi) ?? []).length;
    const extLinks = (markdown.match(/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/g) ?? []).length;

    const isUS = !markdown.toLowerCase().includes(" a ") && markdown.toLowerCase().includes(" the ");
    const minWc = isUS ? 3000 : 2000;
    const minH2 = isUS ? 8 : 5;
    const minH3 = isUS ? 6 : 4;

    const checks: [boolean, string, string][] = [
      [!!metaTitle, "Meta title configurado", "Meta title ausente"],
      [(metaTitle?.length ?? 0) <= 65, "Meta title otimizado (<65c)", "Meta title longo (>65c)"],
      [!!metaDesc, "Meta description configurada", "Meta description ausente"],
      [(metaDesc?.length ?? 0) >= 140, "Meta description densa (>140c)", "Meta description curta (<140c)"],
      [wc >= minWc, `Atingiu ${minWc.toLocaleString("pt-BR")}+ palavras`, `Abaixo de ${minWc.toLocaleString("pt-BR")} palavras (tem ${wc})`],
      [markdown.length >= (minWc * 5), `Conteúdo denso (${markdown.length.toLocaleString("pt-BR")} chars)`, `Conteúdo curto (<${(minWc * 5).toLocaleString("pt-BR")} chars)`],
      [h2 >= minH2, `Possui ${h2} H2s (Mínimo ${minH2})`, `Menos de ${minH2} H2s (tem ${h2})`],
      [h3 >= minH3, `Possui ${h3} H3s (Mínimo ${minH3})`, `Menos de ${minH3} H3s (tem ${h3})`],
      [imgs >= 3, `Possui ${imgs} blocos de imagem`, `Menos de 3 blocos de imagem (tem ${imgs})`],
      [ctas >= 3, `Possui ${ctas} CTAs injetados`, `Menos de 3 CTAs (tem ${ctas})`],
      [extLinks >= 5, `Possui ${extLinks} links externos`, `Menos de 5 links externos (tem ${extLinks})`],
      [/\|.+\|.+\|/.test(markdown), "Possui Tabela Comparativa", "Tabela comparativa ausente"],
      [(faq?.length ?? 0) >= 5, "FAQ Rico (+5 perguntas)", "FAQ com menos de 5 perguntas"],
      [!!slug, "URL Slug otimizado", "Slug ausente"],
    ];

    for (const [ok, successMsg, errorMsg] of checks) {
      if (ok) score++;
      else issues.push(errorMsg);
    }
    
    const finalScore = Math.round((score / checks.length) * 100);
    setLocalScore(finalScore);
    scoreRef.current = finalScore;
    setLocalIssues(issues);
    setLocalChecks(checks.map(([ok, successMsg, errorMsg]) => ({ ok, msg: ok ? successMsg : errorMsg })));
  }, [markdown, metaTitle, metaDesc, slug, faq]);

  // Auto-save markdown after 2s idle
  const scheduleAutoSave = useCallback((md: string) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      const wc = md.split(/\s+/).filter(Boolean).length;
      save({ content_markdown: md, word_count: wc, quality_score: scoreRef.current } as any);
    }, 2000);
  }, [save]);

  const handleMarkdownChange = (val: string) => {
    setMarkdown(val);
    scheduleAutoSave(val);
  };

  const saveAll = async () => {
    const wc = markdown.split(/\s+/).filter(Boolean).length;
    await save({
      content_markdown: markdown,
      meta_title: metaTitle,
      meta_description: metaDesc,
      slug,
      key_takeaways: takeaways as any,
      faq: faq as any,
      cta_primary: cta as any,
      word_count: wc,
      quality_score: scoreRef.current,
    } as any);
    toast.success("Salvo com sucesso");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Super Page não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/client/super-pages")}>Voltar</Button>
      </div>
    );
  }

  const status = page.status ?? "draft";
  const sCfg = statusCfg[status] ?? statusCfg.draft;
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen">
      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-16 px-space-6 flex items-center gap-space-4 border-b border-border bg-card shrink-0">
          <button onClick={() => navigate("/client/super-pages")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            value={page.title}
            onChange={(e) => setPage((prev) => prev ? { ...prev, title: e.target.value } : prev)}
            onBlur={() => save({ title: page.title } as any)}
            className="text-h3 font-semibold text-foreground bg-transparent border-none outline-none flex-1 min-w-0"
          />
          <span className={cn("text-tiny font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", sCfg.className)}>
            {sCfg.label}
          </span>
          <span className="text-caption text-muted-foreground hidden md:block whitespace-nowrap min-w-[120px]">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</span>
            ) : lastSaved ? `Salvo às ${lastSaved}` : ""}
          </span>
          {/* Preview */}
          <Button variant="ghost" size="sm" title="Ver página pública" onClick={() => window.open(`/sp/${page.slug}`, "_blank")}>
            <Eye className="h-4 w-4" />
          </Button>
          {/* Save */}
          <Button variant="secondary" size="sm" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          {/* Publish / Unpublish */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                {status === "published" ? "Publicado" : "Publicar"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={publish} disabled={status === "published"}>
                Publicar agora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={unpublish} disabled={status !== "published"}>
                Despublicar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="h-12 px-space-6 flex items-center gap-1 border-b border-border bg-card shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-1.5 text-body-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
                activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
          {activeTab === "content" && (
            <button
              onClick={() => setPreview(!preview)}
              className={cn("ml-auto px-3 py-1 text-caption rounded-md border transition-colors",
                preview ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {preview ? "Editar" : "Preview"}
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">

          {/* ── CONTENT tab ────────────────────────────────────────────── */}
          {activeTab === "content" && (
            <div className="h-full flex flex-col">
              {preview ? (
                <div className="flex-1 overflow-auto p-space-6">
                  <div className="max-w-3xl mx-auto">
                    <SuperPageMarkdownRenderer markdown={markdown} isPreview />
                  </div>
                </div>
              ) : (
                <Textarea
                  value={markdown}
                  onChange={(e) => handleMarkdownChange(e.target.value)}
                  className="flex-1 rounded-none border-0 resize-none font-mono text-body-sm leading-relaxed p-space-6 focus-visible:ring-0 min-h-full"
                  placeholder={"# Título Principal\n\n## Introdução\n\nEscreva o conteúdo em Markdown...\n\n## Seção 1\n\n..."}
                />
              )}
              {/* Status bar */}
              <div className="h-10 border-t border-border px-space-6 flex items-center gap-space-4 text-caption text-muted-foreground shrink-0 bg-card">
                <span>{wordCount} palavras</span>
                <span>~{readTime} min de leitura</span>
                <span className="text-muted-foreground/50">Markdown</span>
              </div>
            </div>
          )}

          {/* ── BLOCKS tab ─────────────────────────────────────────────── */}
          {activeTab === "blocks" && (
            <div className="max-w-[760px] mx-auto p-space-6 space-y-space-8">

              {/* Key Takeaways */}
              <section>
                <div className="flex items-center gap-2 mb-space-4">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-body font-semibold text-foreground">Key Takeaways</h3>
                  <span className="text-caption text-muted-foreground ml-auto">Exibidos no topo da página</span>
                </div>
                <div className="space-y-2">
                  {takeaways.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-primary font-bold text-body-sm shrink-0">✓</span>
                      <Input
                        value={t}
                        onChange={(e) => setTakeaways((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Takeaway ${i + 1}`}
                      />
                      <button onClick={() => setTakeaways((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="gap-1 mt-1" onClick={() => setTakeaways((prev) => [...prev, ""])}>
                    <Plus className="h-4 w-4" /> Adicionar Takeaway
                  </Button>
                </div>
              </section>

              {/* FAQ */}
              <section>
                <div className="flex items-center gap-2 mb-space-4">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <h3 className="text-body font-semibold text-foreground">FAQ</h3>
                  <span className="text-caption text-muted-foreground ml-auto">Schema FAQPage gerado automaticamente</span>
                </div>
                <div className="space-y-4">
                  {faq.map((item, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 space-y-2 relative">
                      <button
                        onClick={() => setFaq((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div>
                        <label className="text-caption text-muted-foreground mb-1 block">Pergunta</label>
                        <Input
                          value={item.q}
                          onChange={(e) => setFaq((prev) => prev.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
                          placeholder="Qual é a melhor estratégia de..."
                        />
                      </div>
                      <div>
                        <label className="text-caption text-muted-foreground mb-1 block">Resposta</label>
                        <Textarea
                          value={item.a}
                          onChange={(e) => setFaq((prev) => prev.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                          rows={2}
                          placeholder="A melhor estratégia é..."
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setFaq((prev) => [...prev, { q: "", a: "" }])}>
                    <Plus className="h-4 w-4" /> Adicionar Pergunta
                  </Button>
                </div>
              </section>

              {/* CTA */}
              <section>
                <div className="flex items-center gap-2 mb-space-4">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <h3 className="text-body font-semibold text-foreground">CTA Principal</h3>
                </div>
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-caption text-muted-foreground mb-1 block">Texto do botão</label>
                    <Input
                      value={cta.text}
                      onChange={(e) => setCta((prev) => ({ ...prev, text: e.target.value }))}
                      placeholder="Ex: Fale com um especialista"
                    />
                  </div>
                  <div>
                    <label className="text-caption text-muted-foreground mb-1 block">Âncora (ID da seção)</label>
                    <Input
                      value={cta.anchor}
                      onChange={(e) => setCta((prev) => ({ ...prev, anchor: e.target.value }))}
                      placeholder="Ex: contato"
                    />
                  </div>
                </div>
              </section>

              <Button onClick={saveAll} className="w-full gap-2" disabled={saving}>
                <Save className="h-4 w-4" /> Salvar Blocos
              </Button>
            </div>
          )}

          {/* ── SEO tab ────────────────────────────────────────────────── */}
          {activeTab === "seo" && (
            <div className="max-w-[760px] mx-auto p-space-6 space-y-space-6">
              {/* Meta Title */}
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                  Meta Title{" "}
                  <span className={cn("text-caption", metaTitle.length > 60 ? "text-error" : metaTitle.length >= 50 ? "text-success" : "text-muted-foreground")}>
                    ({metaTitle.length}/60)
                  </span>
                </label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder="Título SEO otimizado" />
              </div>
              {/* Meta Description */}
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                  Meta Description{" "}
                  <span className={cn("text-caption", metaDesc.length > 160 ? "text-error" : metaDesc.length >= 150 ? "text-success" : "text-muted-foreground")}>
                    ({metaDesc.length}/160)
                  </span>
                </label>
                <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={170} rows={3} placeholder="Descrição para o Google (150-160 caracteres)" />
              </div>
              {/* Slug */}
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-muted-foreground font-mono whitespace-nowrap">/sp/</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
                </div>
              </div>
              {/* Focus keyword */}
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Palavra-chave foco</label>
                <Input value={page.focus_keyword ?? ""} readOnly className="bg-muted cursor-not-allowed" />
              </div>
              {/* SERP Preview */}
              <div className="bg-card border border-border rounded-lg p-space-5">
                <p className="text-caption text-muted-foreground mb-space-3 uppercase tracking-widest font-medium">Pré-visualização Google</p>
                <p className="text-[18px] text-blue-400 leading-snug line-clamp-1">{metaTitle || page.title || "Título da página"}</p>
                <p className="text-caption text-green-600 font-mono mt-0.5">https://omniseen.app/sp/{slug || page.slug}</p>
                <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">{metaDesc || "Meta description aparecerá aqui..."}</p>
              </div>
              <Button onClick={saveAll} className="w-full gap-2" disabled={saving}>
                <Save className="h-4 w-4" /> Salvar SEO
              </Button>
            </div>
          )}

          {/* ── SETTINGS tab ───────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="max-w-[760px] mx-auto p-space-6 space-y-space-6">
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Autor</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nome do autor"
                    value={safeObj<any>(page.autor, {}).nome ?? ""}
                    onChange={(e) => {
                      const current = safeObj<any>(page.autor, {});
                      save({ autor: { ...current, nome: e.target.value } } as any);
                    }}
                  />
                  <Input
                    placeholder="Breve bio"
                    value={safeObj<any>(page.autor, {}).bio ?? ""}
                    onChange={(e) => {
                      const current = safeObj<any>(page.autor, {});
                      save({ autor: { ...current, bio: e.target.value } } as any);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Link público</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/sp/${page.slug}`}
                    className="font-mono text-caption bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sp/${page.slug}`); toast.success("Link copiado!"); }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar (Quality Panel) ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[300px] border-l border-border shrink-0 bg-card overflow-auto">
        {/* Quality Score */}
        <div className="p-space-5 border-b border-border">
          <h4 className="text-body-sm font-semibold text-foreground mb-space-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" /> Quality Score
          </h4>
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="40" cy="40" r="32" fill="none" strokeWidth="8"
                  className={localScore >= 95 ? "text-success" : localScore >= 80 ? "text-warning" : "text-destructive"}
                  stroke="currentColor"
                  strokeDasharray={`${(localScore / 100) * 201.06} 201.06`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                <span className="font-bold text-body tabular-nums leading-none tracking-tight">
                  {localScore}
                  <span className="text-[10px] text-muted-foreground font-normal ml-0.5">/100</span>
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-body-sm font-semibold text-foreground">
                {localScore >= 95 ? "Excelente" : localScore >= 80 ? "Bom" : "Precisa de melhorias"}
              </p>
              <p className="text-caption text-muted-foreground mt-0.5">
                {wordCount ? `${wordCount.toLocaleString("pt-BR")} palavras` : "Sem conteúdo"}
              </p>
            </div>
          </div>
          {/* Detailed checks */}
          <div className="mt-space-4">
            <h5 className="text-caption font-semibold text-foreground border-b border-border pb-2 mb-3">
              Detalhes da Pontuação
            </h5>
            <ul className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {localChecks.map((check, i) => (
                <li key={i} className="flex items-start gap-2 text-caption">
                  {check.ok ? (
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <span className="shrink-0 mt-0.5 text-destructive font-bold">⚠</span>
                  )}
                  <span className={check.ok ? "text-muted-foreground" : "text-destructive font-medium leading-tight"}>
                    {check.msg}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Page info */}
        <div className="p-space-5 border-b border-border space-y-2">
          <h4 className="text-body-sm font-semibold text-foreground mb-space-3">Informações</h4>
          <InfoRow label="Status">
            <span className={cn("text-tiny font-semibold px-2 py-0.5 rounded-full", statusCfg[status]?.className)}>
              {statusCfg[status]?.label}
            </span>
          </InfoRow>
          <InfoRow label="Criada em">
            <span className="text-caption text-muted-foreground">
              {new Date(page.created_at ?? "").toLocaleDateString("pt-BR")}
            </span>
          </InfoRow>
          {page.published_at && (
            <InfoRow label="Publicada em">
              <span className="text-caption text-muted-foreground">
                {new Date(page.published_at).toLocaleDateString("pt-BR")}
              </span>
            </InfoRow>
          )}
          <InfoRow label="Palavras">
            <span className="text-caption text-muted-foreground">{wordCount.toLocaleString("pt-BR")}</span>
          </InfoRow>
        </div>

        {/* Quick actions */}
        <div className="p-space-5 space-y-2">
          <h4 className="text-body-sm font-semibold text-foreground mb-space-3">Ações</h4>
          {status !== "published" ? (
            <Button className="w-full gap-2" size="sm" onClick={publish}>
              <Globe className="h-4 w-4" /> Publicar Super Page
            </Button>
          ) : (
            <Button className="w-full gap-2" variant="outline" size="sm" onClick={unpublish}>
              <Globe className="h-4 w-4" /> Despublicar
            </Button>
          )}
          <Button
            className="w-full gap-2"
            variant="outline"
            size="sm"
            onClick={() => window.open(`/sp/${page.slug}`, "_blank")}
          >
            <Eye className="h-4 w-4" /> Ver página pública
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-caption text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
