import { useRef } from "react";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  Image as ImageIcon, Sparkles, RefreshCw, Wand2, Youtube, Loader2 } from "lucide-react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface Props {
  editor: Editor | null;
  improving: boolean;
  wordCount: number;
  readTime: number;
  onImprove: (mode: "improve" | "rewrite") => void;
  onOpenHumanize: () => void;
  onOpenYouTube: () => void;
}

function ToolbarBtn({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
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

export default function ArticleContentTab({ editor, improving, wordCount, readTime, onImprove, onOpenHumanize, onOpenYouTube }: Props) {
  return (
    <div className="h-full flex flex-col">
      {/* TipTap toolbar */}
      <div className="h-12 bg-card border-b border-border px-space-4 flex items-center gap-1 shrink-0">
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Negrito">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Itálico">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Lista">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numerada">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Citação">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => { const url = prompt("URL do link:"); if (url) editor?.chain().focus().setLink({ href: url }).run(); }}
          active={editor?.isActive("link")} title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => { const url = prompt("URL da imagem:"); if (url) editor?.chain().focus().setImage({ src: url }).run(); }}
          title="Imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn onClick={() => onImprove("improve")} title="Melhorar com IA">
          {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </ToolbarBtn>
        <ToolbarBtn onClick={() => onImprove("rewrite")} title="Reescrever com IA">
          <RefreshCw className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={onOpenHumanize} title="Humanizar Texto">
          <Wand2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={onOpenYouTube} title="Inserir Vídeo do YouTube">
          <Youtube className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Status bar */}
      <div className="h-10 border-t border-border px-space-6 flex items-center gap-space-4 text-caption text-muted-foreground shrink-0 bg-card">
        <span>{wordCount} palavras</span>
        <span>~{readTime} min de leitura</span>
      </div>
    </div>
  );
}
