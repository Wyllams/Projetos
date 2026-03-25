// src/components/SuperPageMarkdownRenderer.tsx
// Renders Super Page markdown with visual blocks for ```image``` and ```cta``` fences
// Used by: SuperPageEditor (preview) and SuperPagePublicView (public)

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImageBlock {
  type: "image";
  prompt?: string;
  alt: string;
  caption?: string;
  position?: string;
  src?: string; // injected at render time via Unsplash fallback
}

interface CtaBlock {
  type: "cta";
  ctaType: "primary" | "secondary";
  text: string;
  anchor: string;
  subtext?: string;
}

type ParsedBlock =
  | { kind: "markdown"; content: string }
  | { kind: "image"; data: ImageBlock }
  | { kind: "cta"; data: CtaBlock };

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  // Forgive trailing spaces or carriage returns after the fence name, and tolerate leading spaces
  const fenceRegex = /^[ \t]*```(image|cta)[ \t\r]*\n([\s\S]*?)^[ \t]*```/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(markdown)) !== null) {
    // Push markdown before this block
    if (match.index > lastIndex) {
      const md = markdown.slice(lastIndex, match.index).trim();
      if (md) blocks.push({ kind: "markdown", content: md });
    }

    const blockType = match[1];
    const blockContent = match[2];

    // Parse key: value pairs
    const fields: Record<string, string> = {};
    blockContent.split("\n").forEach((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (key) fields[key] = value;
      }
    });

    if (blockType === "image") {
      blocks.push({
        kind: "image",
        data: {
          type: "image",
          prompt: fields.prompt,
          alt: fields.alt || "Imagem do artigo",
          caption: fields.caption,
          position: fields.position || "mid",
        },
      });
    } else if (blockType === "cta") {
      blocks.push({
        kind: "cta",
        data: {
          type: "cta",
          ctaType: (fields.type as "primary" | "secondary") || "primary",
          text: fields.text || "Saiba mais",
          anchor: fields.anchor || "#contato",
          subtext: fields.subtext,
        },
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining markdown
  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) blocks.push({ kind: "markdown", content: remaining });

  return blocks;
}

// ─── Image Block ──────────────────────────────────────────────────────────────
function ImageBlockRenderer({ data }: { data: ImageBlock }) {
  // Use Pollinations AI to generate an on-the-fly image based on the AI's alt text prompt!
  const width = data.position === "hero" ? 1200 : 800;
  const height = data.position === "hero" ? 400 : 400;
  
  // Format the prompt nicely for the AI image generator
  // If the AI provided a dedicated English prompt, use it. Otherwise, fallback to the alt text.
  const basePromptText = data.prompt && data.prompt.length > 10 ? data.prompt : data.alt;
  const promptText = basePromptText.trim().substring(0, 300) + ", photorealistic, high quality, professional photography";
  const query = encodeURIComponent(promptText);
  const src = `https://image.pollinations.ai/prompt/${query}?width=${width}&height=${height}&nologo=true&model=flux`;

  return (
    <figure className="my-8 rounded-xl overflow-hidden border border-border shadow-md bg-muted/20">
      <div className="relative w-full" style={{ minHeight: "200px" }}>
        <img
          src={src}
          alt={data.alt}
          className="w-full object-cover relative z-10 transition-opacity duration-300"
          style={{ maxHeight: data.position === "hero" ? 400 : 350 }}
          loading="lazy"
          onError={(e) => {
            // Fallback to a placeholder if the AI generation endpoint fails
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(data.alt.slice(0,10))}/${width}/${height}`;
          }}
        />
      </div>
      {data.caption && (
        <figcaption className="px-4 py-2 text-sm text-muted-foreground bg-card border-t border-border text-center italic">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── CTA Block ────────────────────────────────────────────────────────────────
function CtaBlockRenderer({ data }: { data: CtaBlock }) {
  const isPrimary = data.ctaType === "primary";

  return (
    <div
      className={`my-8 rounded-xl p-6 flex flex-col items-center text-center gap-3 border ${
        isPrimary
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border"
      }`}
    >
      <a
        href={data.anchor}
        className={`inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-base transition-all hover:scale-105 active:scale-95 ${
          isPrimary
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            : "bg-card border border-border text-foreground hover:bg-accent"
        }`}
      >
        {data.text}
      </a>
      {data.subtext && (
        <p className="text-sm text-muted-foreground">{data.subtext}</p>
      )}
    </div>
  );
}

// ─── Markdown section ─────────────────────────────────────────────────────────
function MarkdownSection({ content, isPreview }: { content: string; isPreview: boolean }) {
  return (
    <div
      className={
        isPreview
          ? "prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-table:text-body-sm prose-th:bg-muted prose-strong:text-foreground"
          : "prose max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-muted/50 prose-code:px-1.5 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-table:text-sm prose-strong:font-semibold"
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          // Open external links in new tab
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface SuperPageMarkdownRendererProps {
  markdown: string;
  /** true = editor dark preview, false = public light page */
  isPreview?: boolean;
}

/** Strip `{#anchor}` inline syntax — rehype-slug generates IDs from heading text automatically */
function cleanMarkdown(md: string): string {
  return md.replace(/\s*\{#[a-z0-9-]+\}/gi, "");
}

export default function SuperPageMarkdownRenderer({
  markdown,
  isPreview = false,
}: SuperPageMarkdownRendererProps) {
  const cleaned = useMemo(() => cleanMarkdown(markdown), [markdown]);
  const blocks = useMemo(() => parseBlocks(cleaned), [cleaned]);

  if (!markdown.trim()) {
    return (
      <p className="text-muted-foreground italic text-center py-12">
        Nenhum conteúdo ainda...
      </p>
    );
  }

  return (
    <div className="w-full">
      {blocks.map((block, i) => {
        if (block.kind === "markdown") {
          return <MarkdownSection key={i} content={block.content} isPreview={isPreview} />;
        }
        if (block.kind === "image") {
          return <ImageBlockRenderer key={i} data={block.data} />;
        }
        if (block.kind === "cta") {
          return <CtaBlockRenderer key={i} data={block.data} />;
        }
        return null;
      })}
    </div>
  );
}
