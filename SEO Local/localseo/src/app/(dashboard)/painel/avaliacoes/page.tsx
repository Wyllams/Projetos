import { Star, MessageCircle, AlertCircle, RefreshCw, Bot } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, avaliacoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { TabelaAvaliacoes } from "./tabela-avaliacoes";

export default async function PaginaAvaliacoes() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessao?.user?.id) {
    redirect("/login");
  }

  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) {
    redirect("/onboarding");
  }

  // Buscar avaliações
  const listaAvaliacoes = await bd.query.avaliacoes.findMany({
    where: eq(avaliacoes.negocioId, negocioUser.id),
    orderBy: [desc(avaliacoes.publicadoEm)],
  });

  // Métricas
  const total = listaAvaliacoes.length;
  const pendentes = listaAvaliacoes.filter((a: any) => !a.respondido).length;
  const negativas = listaAvaliacoes.filter((a: any) => a.sentimento === "NEGATIVO").length;

  // Calculo de Média
  const somaNotas = listaAvaliacoes.reduce((acc: number, a: any) => acc + (a.nota || 0), 0);
  const media = total > 0 ? (somaNotas / total).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e responda as avaliações no Google com Inteligência Artificial
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted font-medium transition-all text-sm w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" />
          Sincronizar Google
        </button>
      </div>

      {/* Cards Sub-topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avaliação Média */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Nota Média</span>
            <Star className="w-5 h-5 text-alerta" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold">{media}</h2>
            <span className="text-sm text-muted-foreground">de 5.0</span>
          </div>
        </div>

        {/* Total */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold">{total}</h2>
            <span className="text-sm text-muted-foreground">avaliações</span>
          </div>
        </div>

        {/* Pendentes */}
        <div className="glass-card p-6 flex flex-col justify-between border-alerta/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-alerta">Aguardando Resposta</span>
            <Bot className="w-5 h-5 text-alerta" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-alerta">{pendentes}</h2>
            <span className="text-sm text-muted-foreground">pendentes</span>
          </div>
        </div>

        {/* Críticas */}
        <div className="glass-card p-6 flex flex-col justify-between border-perigo/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-perigo">Avaliações Críticas</span>
            <AlertCircle className="w-5 h-5 text-perigo" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-perigo">{negativas}</h2>
            <span className="text-sm text-muted-foreground">necessitam atenção</span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <TabelaAvaliacoes avaliacoes={listaAvaliacoes} negocioId={negocioUser.id} />
      </div>
    </div>
  );
}
