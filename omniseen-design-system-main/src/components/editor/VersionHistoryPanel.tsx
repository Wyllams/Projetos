import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, RotateCcw, Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  version_number: number;
  content: string | null;
  title: string | null;
  change_summary: string | null;
  created_at: string;
}

interface Props {
  articleId: string;
  currentContent: string;
  currentTitle: string;
  onRestore: (content: string, title: string) => void;
}

export function VersionHistoryPanel({ articleId, currentContent, currentTitle, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase
      .from("article_versions") as any)
      .select("id, version_number, content, title, change_summary, created_at")
      .eq("article_id", articleId)
      .order("version_number", { ascending: false })
      .limit(20);
    setVersions(data ?? []);
    setLoading(false);
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  const saveVersion = async () => {
    setSaving(true);
    try {
      // Get max version number
      const current = versions[0]?.version_number ?? 0;
      const next = current + 1;

      const { error } = await (supabase.from("article_versions") as any).insert({
        article_id: articleId,
        version_number: next,
        content: currentContent,
        title: currentTitle,
        change_summary: `Versão ${next} — salva manualmente`,
      });

      if (error) throw error;
      toast.success(`Versão ${next} salva!`);
      await load();
    } catch (e: any) {
      toast.error("Erro ao salvar versão: " + (e.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  const restore = async (v: Version) => {
    if (!v.content) return;
    setRestoring(v.id);
    // Auto-save current as a version first
    const current = versions[0]?.version_number ?? 0;
    await (supabase.from("article_versions") as any).insert({
      article_id: articleId,
      version_number: current + 1,
      content: currentContent,
      title: currentTitle,
      change_summary: `Backup antes de restaurar v${v.version_number}`,
    }).then(() => {});
    onRestore(v.content!, v.title ?? currentTitle);
    toast.success(`Versão ${v.version_number} restaurada!`);
    setRestoring(null);
    await load();
  };

  const wordCount = (html: string) =>
    (html ?? "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 text-body-sm font-semibold text-foreground">
          <History className="h-4 w-4 text-primary" />
          Histórico de Versões
        </div>
        <Button size="sm" variant="outline" onClick={saveVersion} disabled={saving} className="gap-1 text-xs">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar versão
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-body-sm">Nenhuma versão salva ainda.</p>
            <p className="text-caption mt-1">Clique em "Salvar versão" para criar um snapshot.</p>
          </div>
        )}

        {!loading && versions.map((v) => {
          const isOpen = expanded === v.id;
          const date = new Date(v.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          });
          const wc = wordCount(v.content ?? "");

          return (
            <div key={v.id} className="border-b border-border/50 last:border-0">
              {/* Version row */}
              <button
                onClick={() => setExpanded(isOpen ? null : v.id)}
                className="w-full flex items-start gap-3 p-3 hover:bg-accent/50 text-left transition-colors"
              >
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-tiny font-bold shrink-0 mt-0.5",
                  "bg-primary/10 text-primary"
                )}>
                  v{v.version_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-foreground truncate">
                    {v.title ?? "Sem título"}
                  </p>
                  <p className="text-caption text-muted-foreground">{date}</p>
                  <p className="text-caption text-muted-foreground">{wc} palavras</p>
                </div>
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                }
              </button>

              {/* Expanded preview */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {v.change_summary && (
                    <p className="text-caption text-muted-foreground italic px-1">
                      {v.change_summary}
                    </p>
                  )}
                  <div className="bg-muted/50 rounded-md p-3 max-h-[120px] overflow-hidden relative text-caption text-muted-foreground font-mono leading-relaxed">
                    {(v.content ?? "").replace(/<[^>]*>/g, " ").slice(0, 300)}…
                    <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-card to-transparent" />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs"
                    disabled={restoring === v.id}
                    onClick={() => restore(v)}
                  >
                    {restoring === v.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RotateCcw className="h-3 w-3" />
                    }
                    Restaurar esta versão
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
