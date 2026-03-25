import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  title: string;
  htmlContent: string;
  authorName?: string;
  publishedAt?: string | null;
}

const PRINT_CSS = `
  /* ── Reset ───────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 20mm 18mm; }

  /* ── Typography ──────────────────── */
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #1a1a1a;
    background: #fff;
  }

  /* ── Header ──────────────────────── */
  .pdf-header {
    border-bottom: 2px solid #6366f1;
    padding-bottom: 12pt;
    margin-bottom: 20pt;
  }
  .pdf-header h1 {
    font-size: 20pt;
    font-weight: bold;
    color: #111827;
    margin-bottom: 6pt;
    line-height: 1.3;
  }
  .pdf-meta {
    font-size: 9pt;
    color: #6b7280;
    font-family: Arial, sans-serif;
  }

  /* ── Content ─────────────────────── */
  .pdf-body h1 { font-size: 17pt; font-weight: bold; margin: 18pt 0 10pt; }
  .pdf-body h2 { font-size: 14pt; font-weight: bold; margin: 16pt 0 8pt; border-left: 3px solid #6366f1; padding-left: 8pt; }
  .pdf-body h3 { font-size: 12pt; font-weight: bold; margin: 12pt 0 6pt; }
  .pdf-body p  { margin: 0 0 10pt; }
  .pdf-body ul, .pdf-body ol { margin: 8pt 0 10pt 20pt; }
  .pdf-body li { margin-bottom: 4pt; }
  .pdf-body blockquote {
    border-left: 4px solid #6366f1;
    padding: 8pt 12pt;
    margin: 12pt 0;
    color: #374151;
    background: #f8f7ff;
    font-style: italic;
  }
  .pdf-body code {
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    background: #f3f4f6;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }
  .pdf-body pre {
    background: #1f2937;
    color: #e5e7eb;
    padding: 10pt;
    border-radius: 4pt;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    font-size: 9pt;
    margin: 10pt 0;
  }
  .pdf-body a { color: #6366f1; text-decoration: underline; }
  .pdf-body img { max-width: 100%; height: auto; margin: 10pt 0; border-radius: 4pt; }
  .pdf-body table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  .pdf-body th, .pdf-body td { border: 1px solid #d1d5db; padding: 6pt 8pt; font-size: 10pt; }
  .pdf-body th { background: #f3f4f6; font-weight: bold; }

  /* ── Footer ─────────────────────── */
  .pdf-footer {
    margin-top: 20pt;
    padding-top: 10pt;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt;
    color: #9ca3af;
    text-align: center;
    font-family: Arial, sans-serif;
  }
`;

export default function ExportPDFButton({ title, htmlContent, authorName, publishedAt }: Props) {
  const [loading, setLoading] = useState(false);

  const exportPDF = () => {
    setLoading(true);
    try {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
        : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

      const metaLine = [
        authorName ? `Autor: ${authorName}` : null,
        `Publicado em: ${date}`,
      ].filter(Boolean).join(" • ");

      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Popup bloqueado. Permita popups e tente novamente."); return; }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>${PRINT_CSS}</style>
        </head>
        <body>
          <div class="pdf-header">
            <h1>${title}</h1>
            <p class="pdf-meta">${metaLine}</p>
          </div>
          <div class="pdf-body">${htmlContent}</div>
          <div class="pdf-footer">Gerado por Omniseen • ${new Date().toLocaleDateString("pt-BR")}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();

      // Allow images to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 600);

      toast.success("PDF gerado! Use 'Salvar como PDF' na janela de impressão.");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportPDF} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      Exportar PDF
    </Button>
  );
}
