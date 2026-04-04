"use client";

import { useState } from "react";
import { Sparkles, PenSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { criarNovaPostagemIA } from "./actions";

export function CriadorPostagem() {
  const [tema, setTema] = useState("");
  const [gerando, setGerando] = useState(false);

  async function handleGerar() {
    try {
      setGerando(true);
      const res = await criarNovaPostagemIA(tema);
      if (res.sucesso) {
        toast.success("Postagem GMB gerada e publicada com sucesso!");
        setTema(""); // limpa o input
      } else {
        toast.error(res.erro || "Falha ao gerar o post.");
      }
    } catch (e) {
      toast.error("Erro inesperado de rede.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="glass-card p-6 h-full flex flex-col justify-between border-primary/20">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gerador de Posts com IA</h2>
            <p className="text-sm text-muted-foreground">Deixe a inteligência artificial redigir para o Google.</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <label className="text-sm font-medium">Instrução especial (Opcional)</label>
          <textarea
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Crie um post falando que teremos promoção de Black Friday nesta sexta."
            className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            disabled={gerando}
          />
        </div>
      </div>

      <button
        onClick={handleGerar}
        disabled={gerando}
        className="w-full mt-6 gradient-primary px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-white hover:shadow-lg hover:shadow-primary/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {gerando ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Processando IA e Buscando Imagens...
          </>
        ) : (
          <>
            <PenSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Gerar Post e Publicar
          </>
        )}
      </button>
    </div>
  );
}
