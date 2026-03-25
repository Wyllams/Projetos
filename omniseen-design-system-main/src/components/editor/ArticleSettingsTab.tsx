import { useRef, useState } from "react";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  article: Tables<"articles">;
  category: string;
  tags: string;
  author: string;
  onCategoryChange: (v: string) => void;
  onTagsChange: (v: string) => void;
  onAuthorChange: (v: string) => void;
  onArticleUpdate: (updates: Partial<Tables<"articles">>) => void;
}

export default function ArticleSettingsTab({
  article, category, tags, author,
  onCategoryChange, onTagsChange, onAuthorChange, onArticleUpdate,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `covers/cover-${article.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("article-images")
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(fileName);
      await supabase.from("articles").update({ featured_image_url: urlData.publicUrl }).eq("id", article.id);
      onArticleUpdate({ featured_image_url: urlData.publicUrl });
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + (err.message || ""));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-image", {
        body: { article_id: article.id },
      });
      if (error) throw error;
      if (data?.image_url) {
        onArticleUpdate({ featured_image_url: data.image_url });
        toast.success("Imagem gerada com IA!");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar imagem: " + (err.message || ""));
    } finally {
      setGeneratingCover(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto p-space-6 space-y-space-6">
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">Categoria</label>
        <Input value={category} onChange={(e) => onCategoryChange(e.target.value)} placeholder="Ex: SEO, Marketing Digital" />
      </div>
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">Tags</label>
        <Input value={tags} onChange={(e) => onTagsChange(e.target.value)} placeholder="Separadas por vírgula: seo, marketing, google" />
      </div>
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">Autor</label>
        <Input value={author} onChange={(e) => onAuthorChange(e.target.value)} placeholder="Nome do autor" />
      </div>
      <div>
        <label className="text-body-sm font-medium text-foreground mb-space-2 block">Imagem Destacada</label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
        />
        <div
          onClick={() => imageInputRef.current?.click()}
          className="h-[200px] bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-colors relative"
        >
          {uploadingImage && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {sanitizeImageUrl(article?.featured_image_url) ? (
            <img src={sanitizeImageUrl(article!.featured_image_url)!} alt="Imagem destacada" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <span className="text-body-sm">Clique para enviar imagem</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" disabled={generatingCover} onClick={handleGenerateCover} className="text-xs">
            {generatingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            Gerar com IA
          </Button>
        </div>
      </div>
    </div>
  );
}
