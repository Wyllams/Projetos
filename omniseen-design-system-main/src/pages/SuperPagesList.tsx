import { useNavigate } from "react-router-dom";
import { Plus, Zap, Eye, Pencil, Trash2, Globe, Clock, BarChart2, BookOpen, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSuperPagesList, type SuperPageStatus } from "@/hooks/useSuperpages";
import { useBlog } from "@/hooks/useBlog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const statusConfig: Record<SuperPageStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  published: { label: "Publicado", className: "bg-success/10 text-success border border-success/20" },
  needs_review: { label: "Revisar", className: "bg-warning/10 text-warning border border-warning/20" },
  archived: { label: "Arquivado", className: "bg-muted/50 text-muted-foreground border border-border" },
};

function QualityRing({ score }: { score: number }) {
  const color = score >= 95 ? "text-success" : score >= 80 ? "text-warning" : "text-destructive";
  return (
    <span className={cn("font-bold text-body-sm tabular-nums", color)}>{score}%</span>
  );
}

export default function SuperPagesList() {
  const navigate = useNavigate();
  const { blog } = useBlog();
  const { pages, loading, deletePage, changeStatus } = useSuperPagesList(blog?.id);

  return (
    <div className="p-space-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-space-7">
        <div>
          <h1 className="text-h1 text-foreground flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </span>
            Super Pages
          </h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Pillar pages e hubs de conteúdo gerados por IA, otimizados para ranquear em posição 0.
          </p>
        </div>
        <Button onClick={() => navigate("/client/super-pages/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Super Page
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && pages.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-16 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-h2 text-foreground">Nenhuma Super Page ainda</h2>
          <p className="text-body text-muted-foreground max-w-md">
            Super Pages são pillar pages profundas com +3.000 palavras, sumário interativo, FAQ, e structured data — geradas em segundos.
          </p>
          <Button onClick={() => navigate("/client/super-pages/new")} size="lg" className="mt-2 gap-2">
            <Plus className="h-5 w-5" /> Criar minha primeira Super Page
          </Button>
        </div>
      )}

      {/* Grid */}
      {!loading && pages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => {
            const status = (page.status ?? "draft") as SuperPageStatus;
            const cfg = statusConfig[status];
            const date = page.updated_at
              ? new Date(page.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
              : "—";

            return (
              <div
                key={page.id}
                className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/client/super-pages/${page.id}`)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("text-tiny font-semibold px-2 py-0.5 rounded-full", cfg.className)}>
                    {cfg.label}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/client/super-pages/${page.id}`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      {status === "published" ? (
                        <DropdownMenuItem onClick={() => window.open(`/sp/${page.slug}`, "_blank")}>
                          <Eye className="h-4 w-4 mr-2" /> Ver publicada
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      {status === "published" ? (
                        <DropdownMenuItem onClick={() => changeStatus(page.id, "draft")}>
                          <Globe className="h-4 w-4 mr-2" /> Despublicar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => changeStatus(page.id, "published")}>
                          <Globe className="h-4 w-4 mr-2 text-success" /> Publicar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deletePage(page.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Title + keyword */}
                <div>
                  {page.focus_keyword && (
                    <p className="text-caption text-primary font-medium mb-1">
                      🎯 {page.focus_keyword}
                    </p>
                  )}
                  <h3 className="text-body font-semibold text-foreground line-clamp-2 leading-snug">
                    {page.title}
                  </h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-caption text-muted-foreground mt-auto pt-2 border-t border-border/50">
                  {page.word_count ? (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {page.word_count.toLocaleString("pt-BR")} palavras
                    </span>
                  ) : null}
                  {page.quality_score ? (
                    <span className="flex items-center gap-1">
                      <BarChart2 className="h-3.5 w-3.5" />
                      <QualityRing score={page.quality_score} />
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="h-3.5 w-3.5" />
                    {date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
