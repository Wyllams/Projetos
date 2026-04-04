"use client";

import { useState } from "react";
import { Sparkles, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { criarNovoArtigoIA } from "./actions";

export function CriadorBlog() {
  const [tema, setTema] = useState("");
  const [gerando, setGerando] = useState(false);

  async function handleGerar() {
    if (!tema.trim()) {
      toast.error("Por favor, insira o tema que deseja para o artigo.");
      return;
    }

    try {
      setGerando(true);
      const res = await criarNovoArtigoIA(tema);
      if (res.sucesso) {
        toast.success("Artigo super longo SEO Gerado e Publicado!");
        setTema(""); // limpa o input
      } else {
        toast.error(res.erro || "Falha ao gerar o artigo.");
      }
    } catch (e) {
      toast.error("Erro inesperado de rede.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="glass-card p-6 h-full flex flex-col border-sucesso/20 shadow-[-10px_10px_30px_-15px_rgba(34,197,94,0.1)]">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-sucesso/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sucesso" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Blog Agent (SEO Longo)</h2>
            <p className="text-sm text-muted-foreground">Artigos aprofundados para indexação (Google Local).</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <label className="text-sm font-medium">Tema ou Palavra-chave principal</label>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Como cuidar de uma barba grande em casa"
            className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-sucesso/50 transition-all font-medium"
            disabled={gerando}
          />
          <p className="text-xs text-muted-foreground">O Agent criará o título hero, meta descrição LSI, Header H2/H3 e a conclusão com CTA automático.</p>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={handleGerar}
          disabled={gerando || !tema.trim()}
          className="w-full bg-sucesso hover:bg-sucesso/90 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-white hover:shadow-lg hover:shadow-sucesso/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {gerando ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Escrevendo artigo longo... (Ranks #1)
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Esculpir Artigo de Autoridade
            </>
          )}
        </button>
      </div>
    </div>
  );
}
