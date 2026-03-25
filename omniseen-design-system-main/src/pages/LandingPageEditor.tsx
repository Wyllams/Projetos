import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Code2, Search as SearchIcon, Save, ExternalLink, Share2, Copy, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import SuperPageSeoPanel from "@/components/SuperPageSeoPanel";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type LandingPage = Tables<"landing_pages">;

const editorTabs = [
  { key: "code",    label: "HTML",    icon: Code2 },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "seo",     label: "SEO",     icon: SearchIcon },
];

export default function LandingPageEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [page, setPage]           = useState<LandingPage | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc]   = useState("");
  const [slug, setSlug]           = useState("");
  const [improving, setImproving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setPage(data);
        setTitle(data.title);
        setContent(data.content);
        setMetaTitle(data.meta_title ?? "");
        setMetaDesc(data.meta_description ?? "");
        setSlug(data.slug ?? "");
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const save = async () => {
    if (!page) return;
    setSaving(true);
    const { error } = await supabase
      .from("landing_pages")
      .update({
        title,
        content,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", page.id);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Landing Page salva!");
      setPage((prev) => prev ? { ...prev, title, content } : prev);
    }
    setSaving(false);
  };

  const improveHTML = async () => {
    if (!page || !content) return;
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("improve-landing-page", {
        body: { landing_page_id: page.id, current_html: content, focus_keyword: page.focus_keyword },
      });
      if (error) throw error;
      if (data?.html) {
        setContent(data.html);
        toast.success("HTML melhorado com IA!");
      }
    } catch {
      toast.error("Erro ao melhorar com IA");
    } finally {
      setImproving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    toast.success("Link copiado!");
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
        <p className="text-muted-foreground">Landing Page não encontrada.</p>
        <Button onClick={() => navigate("/client/landing-pages")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/client/landing-pages")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="w-px h-5 bg-border" />

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-body-sm font-medium border-0 bg-transparent focus-visible:ring-0 max-w-[340px] px-0"
          placeholder="Título da Landing Page"
        />

        <div className="ml-auto flex items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {editorTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "h-8 px-3 flex items-center gap-1.5 text-body-sm transition-colors",
                    activeTab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 hidden sm:flex">
            <Copy className="h-3.5 w-3.5" /> Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/p/${slug}`, "_blank")} className="gap-1.5 hidden sm:flex">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir
          </Button>
          <Button variant="outline" size="sm" onClick={improveHTML} disabled={improving} className="gap-1.5">
            {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            IA
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* HTML Editor */}
        {activeTab === "code" && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 font-mono text-xs resize-none min-h-0"
              placeholder="Cole ou edite o HTML aqui..."
            />
          </div>
        )}

        {/* Preview */}
        {activeTab === "preview" && (
          <iframe
            className="flex-1 bg-white"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;}</style></head><body>${content}</body></html>`}
            sandbox="allow-same-origin allow-scripts"
            title="Preview"
          />
        )}

        {/* SEO */}
        {activeTab === "seo" && (
          <div className="flex-1 overflow-auto p-6 max-w-[800px] mx-auto w-full space-y-6">
            {/* Meta Title */}
            <div>
              <label className="text-body-sm font-medium text-foreground mb-2 block">
                Título SEO{" "}
                <span className={cn("text-caption", metaTitle.length > 60 ? "text-destructive" : metaTitle.length >= 50 ? "text-success" : "text-muted-foreground")}>
                  ({metaTitle.length}/60)
                </span>
              </label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder="Título SEO" />
            </div>
            {/* Meta Desc */}
            <div>
              <label className="text-body-sm font-medium text-foreground mb-2 block">
                Meta Descrição{" "}
                <span className={cn("text-caption", metaDesc.length > 160 ? "text-destructive" : metaDesc.length >= 150 ? "text-success" : "text-muted-foreground")}>
                  ({metaDesc.length}/160)
                </span>
              </label>
              <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={170} rows={3} placeholder="Descrição para o Google" />
            </div>
            {/* Slug */}
            <div>
              <label className="text-body-sm font-medium text-foreground mb-2 block">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-muted-foreground font-mono">/p/</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
              </div>
            </div>
            {/* Focus keyword (read-only) */}
            <div>
              <label className="text-body-sm font-medium text-foreground mb-2 block">Palavra-chave Foco</label>
              <Input value={page.focus_keyword} readOnly className="bg-muted cursor-not-allowed" />
            </div>
            {/* SERP Preview */}
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-caption text-muted-foreground mb-3 uppercase tracking-widest font-medium">Pré-visualização Google</p>
              <p className="text-[18px] text-blue-400 leading-snug line-clamp-1">{metaTitle || title}</p>
              <p className="text-caption text-green-600 font-mono mt-0.5">{window.location.origin}/p/{slug}</p>
              <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">{metaDesc || "Meta description aparecerá aqui..."}</p>
            </div>
            {/* SEO analysis */}
            <SuperPageSeoPanel data={{ content, title, metaTitle, metaDescription: metaDesc, focusKeyword: page.focus_keyword }} />
          </div>
        )}
      </div>
    </div>
  );
}
