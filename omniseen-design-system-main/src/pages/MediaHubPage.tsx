import { useState, useEffect, useCallback } from "react";
import { Search, Download, Copy, Image as ImageIcon, Loader2, Filter, Grid, LayoutList, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  alt: string;
  articleTitle: string;
  articleId: string;
  blogName: string;
  type: "cover" | "inline" | "regen";
  createdAt: string;
}

export default function MediaHubPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "cover" | "inline">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  // Load all images from articles
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: articles, error } = await supabase
          .from("articles")
          .select("id, title, content, featured_image_url, created_at, blogs(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mediaItems: MediaItem[] = [];

        for (const article of articles || []) {
          const blogName = (article.blogs as any)?.name ?? "Blog";

          // Cover image
          if (article.featured_image_url) {
            mediaItems.push({
              id: `${article.id}-cover`,
              url: article.featured_image_url,
              alt: `Capa: ${article.title}`,
              articleTitle: article.title,
              articleId: article.id,
              blogName,
              type: "cover",
              createdAt: article.created_at,
            });
          }

          // Inline images from content
          if (article.content) {
            const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="?([^"]*)"?[^>]*>/gi;
            let match;
            let idx = 0;
            while ((match = imgRegex.exec(article.content)) !== null) {
              mediaItems.push({
                id: `${article.id}-img-${idx}`,
                url: match[1],
                alt: match[2] || `Imagem ${idx + 1} do artigo`,
                articleTitle: article.title,
                articleId: article.id,
                blogName,
                type: "inline",
                createdAt: article.created_at,
              });
              idx++;
            }
          }
        }

        setItems(mediaItems);
        setFilteredItems(mediaItems);
      } catch (err) {
        console.error("Error loading media:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter items
  useEffect(() => {
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.alt.toLowerCase().includes(q) ||
          item.articleTitle.toLowerCase().includes(q) ||
          item.blogName.toLowerCase().includes(q),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    setFilteredItems(result);
  }, [search, typeFilter, items]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Download iniciado!");
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const coverCount = items.filter((i) => i.type === "cover").length;
  const inlineCount = items.filter((i) => i.type === "inline").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-space-6 py-space-5">
          <div className="flex items-center justify-between mb-space-4">
            <div>
              <h1 className="text-h2 text-foreground font-bold flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-primary" />
                Media Hub
              </h1>
              <p className="text-body-sm text-muted-foreground mt-1">
                {items.length} imagens • {coverCount} capas • {inlineCount} inline
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, artigo ou blog..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(["all", "cover", "inline"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-body-sm font-medium rounded-md transition-colors ${
                    typeFilter === type
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "all" ? "Todas" : type === "cover" ? "Capas" : "Inline"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-space-6 py-space-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-h3 text-muted-foreground">Nenhuma imagem encontrada</p>
            <p className="text-body-sm text-muted-foreground mt-2">
              {search ? "Tente outra busca" : "Gere artigos com imagens para preencher o Media Hub"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                onClick={() => setSelectedImage(item)}
              >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%239CA3AF' font-size='12'%3EErro%3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-tiny font-medium truncate">{item.articleTitle}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.type === "cover"
                            ? "bg-primary/80 text-white"
                            : "bg-white/20 text-white/80"
                        }`}
                      >
                        {item.type === "cover" ? "CAPA" : "INLINE"}
                      </span>
                      <span className="text-white/60 text-[10px]">{item.blogName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-foreground truncate">
                    {item.alt || item.articleTitle}
                  </p>
                  <p className="text-tiny text-muted-foreground">
                    {item.blogName} • {item.articleTitle}
                  </p>
                </div>
                <span
                  className={`text-tiny font-bold px-2 py-1 rounded shrink-0 ${
                    item.type === "cover"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.type === "cover" ? "CAPA" : "INLINE"}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadImage(item.url, `${item.id}.jpg`); }}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative max-w-4xl w-full mx-4 animate-in fade-in zoom-in-95">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent rounded-b-xl p-6">
              <p className="text-white font-semibold text-body">{selectedImage.alt}</p>
              <p className="text-white/70 text-body-sm mt-1">
                {selectedImage.blogName} → {selectedImage.articleTitle}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyUrl(selectedImage.url)}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copiar URL
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    downloadImage(selectedImage.url, `${selectedImage.id}.jpg`)
                  }
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(selectedImage.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                </Button>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
