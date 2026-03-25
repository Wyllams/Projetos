import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MetaFields {
  metaTitle: string;
  metaDesc: string;
  slug: string;
  focusKeyword: string;
  blogSubdomain: string;
}

interface Props extends MetaFields {
  onMetaTitleChange: (v: string) => void;
  onMetaDescChange: (v: string) => void;
  onSlugChange: (v: string) => void;
}

export default function ArticleSEOTab({
  metaTitle, metaDesc, slug, focusKeyword, blogSubdomain,
  onMetaTitleChange, onMetaDescChange, onSlugChange,
}: Props) {
  return (
    <div className="max-w-[800px] mx-auto p-space-6 space-y-space-6">
      {/* Meta Title */}
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">
          Título SEO{" "}
          <span className={cn("text-caption", metaTitle.length > 60 ? "text-error" : metaTitle.length >= 50 ? "text-success" : "text-muted-foreground")}>
            ({metaTitle.length}/60)
          </span>
        </label>
        <Input value={metaTitle} onChange={(e) => onMetaTitleChange(e.target.value)} maxLength={70} placeholder="Título SEO otimizado" />
      </div>

      {/* Meta Description */}
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">
          Meta Description{" "}
          <span className={cn("text-caption", metaDesc.length > 160 ? "text-error" : metaDesc.length >= 150 ? "text-success" : "text-muted-foreground")}>
            ({metaDesc.length}/160)
          </span>
        </label>
        <Textarea value={metaDesc} onChange={(e) => onMetaDescChange(e.target.value)} maxLength={170} rows={3} placeholder="Descrição para o Google (150-160 caracteres)" />
      </div>

      {/* Slug */}
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">URL Slug</label>
        <div className="flex items-center gap-space-2">
          <span className="text-body-sm text-muted-foreground font-mono whitespace-nowrap">/blog/</span>
          <Input value={slug} onChange={(e) => onSlugChange(e.target.value)} className="font-mono" />
        </div>
      </div>

      {/* Focus Keyword (read-only) */}
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">Palavra-chave Foco</label>
        <Input value={focusKeyword} readOnly className="bg-muted cursor-not-allowed" />
      </div>

      {/* SERP Preview */}
      <div className="bg-card border border-border rounded-lg p-space-5">
        <p className="text-caption text-muted-foreground mb-space-3 uppercase tracking-widest font-medium">Pré-visualização Google</p>
        <p className="text-[18px] text-blue-400 leading-snug line-clamp-1">{metaTitle || "Título da página"}</p>
        <p className="text-caption text-green-600 font-mono mt-0.5">
          https://{blogSubdomain || "app"}.omniseen.app/blog/{slug || "slug"}
        </p>
        <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">
          {metaDesc || "Meta description aparecerá aqui após você preencher o campo acima..."}
        </p>
      </div>
    </div>
  );
}
