"use client";

import { useState } from "react";
import { formatarData } from "@/lib/utils";
import { Bot, Check, Clock, Search, ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import { gerarRespostaComIA } from "./actions";

interface PropsTabela {
  avaliacoes: any[];
  negocioId: string;
}

export function TabelaAvaliacoes({ avaliacoes, negocioId }: PropsTabela) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"TODAS" | "PENDENTES" | "RESPONDIDAS">("TODAS");
  const [gerandoId, setGerandoId] = useState<string | null>(null);

  const filtradas = avaliacoes.filter((a) => {
    if (filtro === "PENDENTES" && a.respondido) return false;
    if (filtro === "RESPONDIDAS" && !a.respondido) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        (a.autor && a.autor.toLowerCase().includes(q)) ||
        (a.texto && a.texto.toLowerCase().includes(q))
      );
    }
    return true;
  });

  async function handleGerarResposta(id: string) {
    try {
      setGerandoId(id);
      const res = await gerarRespostaComIA(id);
      
      if (res.sucesso) {
        toast.success("Resposta gerada pela IA e salva com sucesso!");
        // O router.refresh() ocorrerá na action para atualizar os dados do servidor.
      } else {
        toast.error(res.erro || "Falha ao gerar resposta.");
      }
    } catch (e) {
      toast.error("Erro inesperado de rede.");
    } finally {
      setGerandoId(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Barra de Filtros */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou trecho..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setFiltro("TODAS")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filtro === "TODAS" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro("PENDENTES")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filtro === "PENDENTES" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFiltro("RESPONDIDAS")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filtro === "RESPONDIDAS" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Respondidas
          </button>
        </div>
      </div>

      {/* Tabela de Conteúdo */}
      <div className="divide-y divide-border">
        {filtradas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma avaliação encontrada com esses filtros.
          </div>
        ) : (
          filtradas.map((av) => (
            <div key={av.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-6">
              
              {/* Esquerda: Info da Avaliação */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{av.autor || "Cliente Google"}</span>
                    <span className="text-xs text-muted-foreground">• {formatarData(av.publicadoEm)}</span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star 
                        key={estrela} 
                        className={`w-4 h-4 ${estrela <= av.nota ? "text-alerta fill-alerta" : "text-muted-foreground"}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  "{av.texto || "Avaliação sem comentário texto."}"
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    av.sentimento === "POSITIVO" ? "bg-sucesso/10 text-sucesso" :
                    av.sentimento === "NEGATIVO" ? "bg-perigo/10 text-perigo" :
                    av.sentimento === "NEUTRO" ? "bg-muted text-muted-foreground" : "hidden"
                  }`}>
                    {av.sentimento}
                  </span>
                  {av.googleReviewId && (
                    <a href="#" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-3 h-3" /> Ver no Google
                    </a>
                  )}
                </div>
              </div>

              {/* Direita: Ação / Resposta */}
              <div className="md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                {av.respondido ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-sucesso">
                      <Check className="w-4 h-4" /> Resposta Publicada 
                      <span className="text-muted-foreground font-normal">({formatarData(av.respondidoEm || new Date())})</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                      {av.textoResposta}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-alerta">
                      <Clock className="w-4 h-4" /> Aguardando resposta
                    </div>
                    
                    <button 
                      onClick={() => handleGerarResposta(av.id)}
                      disabled={gerandoId === av.id || !av.texto}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-card border border-primary/30 hover:border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-medium transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {gerandoId === av.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      )}
                      Gerar e Responder com IA
                    </button>
                    {!av.texto && (
                      <p className="text-[10px] text-muted-foreground text-center w-full">
                        Avaliações sem texto não requerem IA.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
