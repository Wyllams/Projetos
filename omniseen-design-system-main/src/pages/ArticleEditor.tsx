import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Save, ChevronDown, Loader2, Globe, Send, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SeoScorePanel from "@/components/SeoScorePanel";
import { supabase } from "@/integrations/supabase/client";
import { useSeoScore } from "@/hooks/useSeoScore";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { AIImageBlock } from "@/components/editor/AIImageBlock";
import InternalLinkSuggestions from "@/components/editor/InternalLinkSuggestions";
import SchedulePublishDialog from "@/components/editor/SchedulePublishDialog";
import HumanizeTextDialog from "@/components/editor/HumanizeTextDialog";
import ExternalLinkSuggestions from "@/components/editor/ExternalLinkSuggestions";
import ContentScoreVsSerp from "@/components/editor/ContentScoreVsSerp";
import WordPressExportDialog from "@/components/editor/WordPressExportDialog";
import YouTubeEmbedDialog from "@/components/editor/YouTubeEmbedDialog";
import SyndicationDialog from "@/components/editor/SyndicationDialog";
import { VersionHistoryPanel } from "@/components/editor/VersionHistoryPanel";
import ExportPDFButton from "@/components/editor/ExportPDFButton";
import ArticleContentTab from "@/components/editor/ArticleContentTab";
import ArticleSEOTab from "@/components/editor/ArticleSEOTab";
import ArticleSettingsTab from "@/components/editor/ArticleSettingsTab";
import { useInternalLinks } from "@/hooks/useInternalLinks";
import { useExternalLinks } from "@/hooks/useExternalLinks";
import { cn } from "@/lib/utils";

const editorTabs = [
  { key: "content", label: "Conteúdo" },
  { key: "seo", label: "SEO" },
  { key: "settings", label: "Configurações" },
];

type ArticleStatus = "draft" | "scheduled" | "published";

interface ArticleUpdates {
  status?: ArticleStatus;
  published_at?: string | null;
}

export default function ArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("content");
  const [article, setArticle] = useState<Tables<"articles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showHumanizeDialog, setShowHumanizeDialog] = useState(false);
  const [showWordPressDialog, setShowWordPressDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showSyndicationDialog, setShowSyndicationDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { score: seoScore, loading: seoLoading, debouncedCalculate } = useSeoScore();

  // Internal linking hook
  const {
    suggestions: linkSuggestions,
    loading: linksLoading,
    debouncedAnalyze: debouncedAnalyzeLinks,
  } = useInternalLinks({
    blogId: article?.blog_id ?? "",
    currentArticleId: id ?? "",
  });

  // External linking hook
  const {
    suggestions: externalSuggestions,
    loading: externalLoading,
    debouncedAnalyze: debouncedAnalyzeExternal,
  } = useExternalLinks({
    blogId: article?.blog_id ?? "",
    focusKeyword: article?.focus_keyword ?? "",
  });

  const [title, setTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("");

  const articleRef = useRef<Tables<"articles"> | null>(null);
  const titleRef = useRef("");
  const metaTitleRef = useRef("");
  const metaDescRef = useRef("");
  const slugRef = useRef("");

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Comece a escrever seu artigo aqui..." }),
      CharacterCount,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      AIImageBlock,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[500px] p-6 focus:outline-none text-body-lg leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      scheduleAutoSave(html);
      scheduleSeoCalc(html);
      debouncedAnalyzeLinks(html);
      debouncedAnalyzeExternal(html);
    },
  });

  const scheduleSeoCalc = useCallback((htmlContent: string) => {
    if (!id || !articleRef.current) return;
    debouncedCalculate({
      article_id: id,
      title: titleRef.current,
      content: htmlContent,
      meta_title: metaTitleRef.current,
      meta_description: metaDescRef.current,
      focus_keyword: articleRef.current.focus_keyword,
      slug: slugRef.current,
    });
  }, [id, debouncedCalculate]);

  const scheduleAutoSave = useCallback((htmlContent: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!id) return;
      setSaving(true);
      const wordCount = htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
      const { error } = await supabase.from("articles").update({
        content: htmlContent,
        word_count: wordCount,
        reading_time_minutes: Math.max(1, Math.round(wordCount / 200)),
      }).eq("id", id);
      if (!error) {
        setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
      setSaving(false);
    }, 2000);
  }, [id]);

  // Sync refs with state so callbacks always have fresh values
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { metaTitleRef.current = metaTitle; }, [metaTitle]);
  useEffect(() => { metaDescRef.current = metaDesc; }, [metaDesc]);
  useEffect(() => { slugRef.current = slug; }, [slug]);
  useEffect(() => { articleRef.current = article; }, [article]);

  // Trigger SEO when meta fields change
  useEffect(() => {
    if (!loading && article && editor) {
      scheduleSeoCalc(editor.getHTML());
    }
  }, [title, metaTitle, metaDesc, slug]);

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      const { data, error } = await supabase.from("articles").select("*, blogs(platform_subdomain)").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Artigo não encontrado");
        navigate("/client/articles");
        return;
      }
      setArticle(data as unknown as Tables<"articles">);
      setTitle(data.title);
      setMetaTitle(data.meta_title);
      setMetaDesc(data.meta_description);
      setSlug(data.slug);
      setCategory(data.category ?? "");
      setTags(data.tags?.join(", ") ?? "");
      setAuthor(data.author);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  // Set editor content once article loads
  useEffect(() => {
    if (!loading && article && editor && article.content) {
      editor.commands.setContent(article.content);
    }
  }, [loading, article, editor]);

  const saveAll = useCallback(async () => {
    if (!id || !editor) return;
    setSaving(true);
    const htmlContent = editor.getHTML();
    const wordCount = htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    const { error } = await supabase.from("articles").update({
      title,
      content: htmlContent,
      meta_title: metaTitle,
      meta_description: metaDesc,
      slug,
      category: category || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author,
      word_count: wordCount,
      reading_time_minutes: Math.max(1, Math.round(wordCount / 200)),
    }).eq("id", id);
    if (error) toast.error("Erro ao salvar");
    else {
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      toast.success("Salvo com sucesso");
    }
    setSaving(false);
  }, [id, title, metaTitle, metaDesc, slug, category, tags, author, editor]);

  const improveContent = async (mode: "improve" | "rewrite") => {
    if (!editor || !article) return;
    const currentContent = editor.getHTML();
    const focusKeyword = article.focus_keyword ?? "";
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-article-pro", {
        body: {
          blog_id: article.blog_id,
          keyword: focusKeyword,
          mode,
          existing_content: currentContent,
          language: "pt-br",
          size: "medium",
          tone: "professional",
          include_faq: false,
          include_images: false,
          web_research: false,
        },
      });
      if (error) { toast.error("Erro ao processar conteúdo"); return; }
      if (data?.content) {
        editor.commands.setContent(data.content);
        toast.success(mode === "improve" ? "Conteúdo melhorado!" : "Conteúdo reescrito!");
      } else {
        toast.info("Processado — verifique o conteúdo");
      }
    } catch {
      toast.error("Erro ao processar conteúdo");
    } finally {
      setImproving(false);
    }
  };

  const publish = async (action: string) => {
    if (!id) return;
    const updates: ArticleUpdates = {};
    if (action === "publish") {
      updates.status = "published";
      updates.published_at = new Date().toISOString();
    } else if (action === "schedule") {
      updates.status = "scheduled";
    } else if (action === "unpublish") {
      updates.status = "draft";
      updates.published_at = null;
    }
    const { error } = await supabase.from("articles").update(updates).eq("id", id);
    if (error) { toast.error("Erro ao publicar"); return; }
    
    if (action === "publish" && article?.slug) {
      const publicUrl = `https://app.omniseen.app/blog/${article.slug}`;
      supabase.functions.invoke("notify-google-indexing", {
        body: { url: publicUrl, type: "URL_UPDATED" },
      }).catch(err => console.error("Erro ao notificar indexação: ", err));
    }

    toast.success(action === "publish" ? "Publicado!" : action === "schedule" ? "Agendado!" : "Despublicado");
    setArticle((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const currentStatus = article?.status ?? "draft";

  const statusLabel: Record<string, string> = {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
  };
  const statusClass: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-warning/10 text-warning border border-warning/20",
    published: "bg-success/10 text-success border border-success/20",
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 px-space-6 flex items-center gap-space-4 border-b border-border bg-card shrink-0">
          <button onClick={() => navigate("/client/articles")} title="Voltar para artigos" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-h3 font-semibold text-foreground bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground"
            placeholder="Título do artigo"
          />
          <span className={cn("text-tiny font-semibold px-2 py-0.5 rounded-full", statusClass[currentStatus])}>
            {statusLabel[currentStatus]}
          </span>
          <span className="text-caption text-muted-foreground hidden md:block whitespace-nowrap min-w-[120px]">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</span>
            ) : lastSaved ? `Salvo às ${lastSaved}` : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            title="Visualizar artigo publicado"
            onClick={() => {
              const previewSlug = slug || article?.slug;
              const subdomain = (article as any)?.blogs?.platform_subdomain || 'app';
              if (previewSlug) window.open(`/blog/${subdomain}/${previewSlug}`, "_blank");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowWordPressDialog(true)} title="Exportar para WordPress">
            <Globe className="h-4 w-4" />
          </Button>
          <ExportPDFButton
            title={title}
            htmlContent={editor?.getHTML() ?? ""}
            authorName={author || undefined}
            publishedAt={article?.published_at ?? null}
          />
          <Button variant="outline" size="sm" onClick={() => setShowSyndicationDialog(true)} title="Syndication">
            <Send className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Publicar <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => publish("publish")}>Publicar Agora</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>Agendar Publicação</DropdownMenuItem>
              <DropdownMenuItem onClick={() => publish("unpublish")}>Despublicar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="h-12 px-space-6 flex items-center gap-1 border-b border-border bg-card shrink-0">
          {editorTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-1.5 text-body-sm font-medium rounded-md transition-colors",
                activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "content" && (
            <ArticleContentTab
              editor={editor}
              improving={improving}
              wordCount={wordCount}
              readTime={readTime}
              onImprove={(mode) => improveContent(mode)}
              onOpenHumanize={() => setShowHumanizeDialog(true)}
              onOpenYouTube={() => setShowYouTubeDialog(true)}
            />
          )}

          {activeTab === "seo" && article && (
            <ArticleSEOTab
              metaTitle={metaTitle}
              metaDesc={metaDesc}
              slug={slug}
              focusKeyword={article.focus_keyword ?? ""}
              blogSubdomain={(article as any)?.blogs?.platform_subdomain ?? ""}
              onMetaTitleChange={setMetaTitle}
              onMetaDescChange={setMetaDesc}
              onSlugChange={setSlug}
            />
          )}

          {activeTab === "settings" && article && (
            <ArticleSettingsTab
              article={article}
              category={category}
              tags={tags}
              author={author}
              onCategoryChange={setCategory}
              onTagsChange={setTags}
              onAuthorChange={setAuthor}
              onArticleUpdate={(updates) => setArticle((prev) => prev ? { ...prev, ...updates } : prev)}
            />
          )}
        </div>
      </div>

      {/* SEO Score Panel + Internal Links */}
      <div className="hidden lg:flex flex-col w-[380px] border-l border-border shrink-0">
        {/* Sidebar header with toggle */}
        <div className="h-10 px-4 flex items-center justify-between border-b border-border bg-card shrink-0">
          <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wide">
            {showHistory ? "Histórico" : "SEO & Links"}
          </span>
          <button
            onClick={() => setShowHistory(p => !p)}
            title={showHistory ? "Ver painel SEO" : "Ver histórico de versões"}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded transition-colors",
              showHistory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <History className="h-4 w-4" />
          </button>
        </div>

        {/* History panel */}
        {showHistory && id && article && editor ? (
          <VersionHistoryPanel
            articleId={id}
            currentContent={editor.getHTML()}
            currentTitle={title}
            onRestore={(content, restoredTitle) => {
              editor.commands.setContent(content);
              if (restoredTitle) setTitle(restoredTitle);
            }}
          />
        ) : (
          <div className="flex-1 overflow-auto">
            <SeoScorePanel score={seoScore} loading={seoLoading} />
            <div className="border-t border-border">
              <InternalLinkSuggestions
                suggestions={linkSuggestions}
                loading={linksLoading}
                onInsertLink={(url, text) => {
                  if (editor) {
                    editor.chain().focus().insertContent(
                      `<a href="${url}">${text}</a> `
                    ).run();
                  }
                }}
              />
            </div>
            <div className="border-t border-border">
              <ExternalLinkSuggestions
                suggestions={externalSuggestions}
                loading={externalLoading}
                onInsertLink={(url, text) => {
                  if (editor) {
                    editor.chain().focus().insertContent(
                      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a> `
                    ).run();
                  }
                }}
              />
            </div>
            {article && id && (
              <div className="border-t border-border">
                <ContentScoreVsSerp
                  articleId={id}
                  blogId={article.blog_id}
                  focusKeyword={article.focus_keyword}
                  currentScore={seoScore?.overall_score ?? 0}
                  wordCount={editor?.storage.characterCount?.words() ?? 0}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      {showScheduleDialog && id && (
        <SchedulePublishDialog
          articleId={id}
          currentScheduledAt={article?.scheduled_at ?? null}
          onScheduled={(scheduledAt, status) => {
            setArticle((prev) =>
              prev ? { ...prev, scheduled_at: scheduledAt, status } as any : prev
            );
          }}
          onClose={() => setShowScheduleDialog(false)}
        />
      )}

      {/* Humanize Dialog */}
      {showHumanizeDialog && id && article && editor && (
        <HumanizeTextDialog
          articleId={id}
          blogId={article.blog_id}
          currentContent={editor.getHTML()}
          focusKeyword={article.focus_keyword}
          onApply={(newContent) => {
            editor.commands.setContent(newContent);
          }}
          onClose={() => setShowHumanizeDialog(false)}
        />
      )}

      {/* WordPress Export Dialog */}
      {showWordPressDialog && id && article && editor && (
        <WordPressExportDialog
          articleId={id}
          title={title}
          content={editor.getHTML()}
          metaTitle={metaTitle}
          metaDescription={metaDesc}
          slug={slug}
          featuredImageUrl={article.featured_image_url}
          onClose={() => setShowWordPressDialog(false)}
        />
      )}

      {/* YouTube Embed Dialog */}
      {showYouTubeDialog && article && editor && (
        <YouTubeEmbedDialog
          focusKeyword={article.focus_keyword}
          onInsertEmbed={(embedHtml) => {
            editor.chain().focus().insertContent(embedHtml).run();
          }}
          onClose={() => setShowYouTubeDialog(false)}
        />
      )}

      {/* Syndication Dialog */}
      {showSyndicationDialog && article && editor && id && (
        <SyndicationDialog
          blogId={article.blog_id}
          articleId={id}
          title={title}
          content={editor.getHTML()}
          canonicalUrl={article.slug ? `/blog/${article.slug}` : undefined}
          tags={article.secondary_keywords ?? []}
          onClose={() => setShowSyndicationDialog(false)}
        />
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded transition-colors shrink-0",
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
