import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { 
  negocios, 
  avaliacoes, 
  postagens, 
  artigos, 
  pontuacoesPresenca, 
  execucoesAgente 
} from "@/db/schema";
import { eq, desc, count, gte, and, sql } from "drizzle-orm";
import { TrendingUp, Star, FileText, PenSquare, Activity, Plus } from "lucide-react";
import { GraficoEvolucao } from "@/components/dashboard/grafico-evolucao";
import Link from "next/link";
import { formatarData, tempoRelativo } from "@/lib/utils";

/**
 * Página principal do painel (Dashboard).
 * Exibe o Score de Presença real, Cards de resumo e histórico de atividades.
 */
export default async function PaginaPainel() {
  // 1. Verificar Sessão
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessao?.user?.id) {
    redirect("/login");
  }

  // 2. Buscar Negócio do Usuário
  const negocioUser = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  if (!negocioUser) {
    redirect("/onboarding");
  }

  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  const esseMesData = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // 3. Buscar Métricas e Dados Reais em Paralelo
  const [
    contagemAvaliacoesRes,
    avaliacoesNovasRes,
    contagemPostagensRes,
    postagensEsteMesRes,
    contagemArtigosRes,
    artigosPublicadosRes,
    pontuacaoAtualRes,
    pontuacoesHistoricoRes,
    atividadesRecentesRes
  ] = await Promise.all([
    bd.select({ count: count() }).from(avaliacoes).where(eq(avaliacoes.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(avaliacoes).where(and(eq(avaliacoes.negocioId, negocioUser.id), gte(avaliacoes.criadoEm, trintaDiasAtras))),
    
    bd.select({ count: count() }).from(postagens).where(eq(postagens.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(postagens).where(and(eq(postagens.negocioId, negocioUser.id), gte(postagens.criadoEm, esseMesData))),
    
    bd.select({ count: count() }).from(artigos).where(eq(artigos.negocioId, negocioUser.id)),
    bd.select({ count: count() }).from(artigos).where(and(eq(artigos.negocioId, negocioUser.id), eq(artigos.status, "PUBLICADO"))),
    
    bd.query.pontuacoesPresenca.findFirst({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
    }),

    bd.query.pontuacoesPresenca.findMany({
      where: eq(pontuacoesPresenca.negocioId, negocioUser.id),
      orderBy: [desc(pontuacoesPresenca.criadoEm)],
      limit: 10,
    }),

    bd.query.execucoesAgente.findMany({
      where: eq(execucoesAgente.negocioId, negocioUser.id),
      orderBy: [desc(execucoesAgente.criadoEm)],
      limit: 5,
    })
  ]);

  const pontuacao = pontuacaoAtualRes?.total || 0;
  
  // Formatando dados para o gráfico (da mais antiga para a mais nova)
  const dadosGrafico = pontuacoesHistoricoRes
    .reverse()
    .map(p => ({
      data: formatarData(p.criadoEm).substring(0, 5), // Pega apenas "DD/MM"
      score: p.total
    }));

  // Se não houver histórico, criamos um placeholder visual para o gráfico
  if (dadosGrafico.length === 0) {
    dadosGrafico.push({ data: formatarData(new Date()), score: 0 });
  }

  const dados = {
    avaliacoes: { total: contagemAvaliacoesRes[0].count, novas: avaliacoesNovasRes[0].count },
    postagens: { total: contagemPostagensRes[0].count, esteMes: postagensEsteMesRes[0].count },
    artigos: { total: contagemArtigosRes[0].count, publicados: artigosPublicadosRes[0].count },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Visão Geral — {negocioUser.nome}
          </h1>
          <p className="text-muted-foreground mt-1">
            Plano: <span className="font-medium text-primary uppercase">{negocioUser.plano}</span>
          </p>
        </div>
        <Link 
          href="/painel/postagens"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Ação AI
        </Link>
      </div>

      {/* Score + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Score de Presença */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center justify-center card-hover overflow-visible relative">
          <p className="text-sm font-medium text-muted-foreground mb-4 relative z-10 bg-card/50 px-2 rounded backdrop-blur-sm">
            Score de Presença
          </p>
          <div className="relative w-32 h-32 my-2">
            <svg className="w-32 h-32 score-circle" viewBox="0 0 100 100">
              {/* Trilho */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(217, 33%, 17%)"
                strokeWidth="8"
              />
              {/* Progresso */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  pontuacao >= 70
                    ? "hsl(142, 71%, 45%)"
                    : pontuacao >= 40
                      ? "hsl(38, 92%, 50%)"
                      : "hsl(0, 84%, 60%)"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * pontuacao) / 100}
                className="animate-score-fill drop-shadow-md"
                style={
                  {
                    "--score-offset": `${283 - (283 * pontuacao) / 100}`,
                  } as React.CSSProperties
                }
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{pontuacao}</span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
          </div>
          <p className={
            `mt-4 text-sm font-medium ${pontuacao >= 70 ? 'text-sucesso' : pontuacao >= 40 ? 'text-alerta' : 'text-perigo'}`
          }>
            {pontuacao >= 70 ? 'Excelente' : pontuacao >= 40 ? 'Precisa melhorar' : 'Presença fraca'}
          </p>
        </div>

        {/* Cards de métricas */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Avaliações */}
          <Link href="/painel/avaliacoes" className="glass-card p-6 card-hover block">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-alerta/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-alerta" />
              </div>
              <span className="text-xs font-medium text-sucesso bg-sucesso/10 px-2 py-1 rounded-full">
                +{dados.avaliacoes.novas} (30d)
              </span>
            </div>
            <p className="text-2xl font-bold">{dados.avaliacoes.total}</p>
            <p className="text-sm text-muted-foreground">Avaliações Coletadas</p>
          </Link>

          {/* Postagens */}
          <Link href="/painel/postagens" className="glass-card p-6 card-hover block">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {dados.postagens.esteMes} este mês
              </span>
            </div>
            <p className="text-2xl font-bold">{dados.postagens.total}</p>
            <p className="text-sm text-muted-foreground">Posts no Google</p>
          </Link>

          {/* Artigos */}
          <Link href="/painel/blog" className="glass-card p-6 card-hover block">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-sucesso/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-sucesso" />
              </div>
              <span className="text-xs font-medium text-sucesso/80 bg-sucesso/10 px-2 py-1 rounded-full">
                {dados.artigos.publicados} ativos
              </span>
            </div>
            <p className="text-2xl font-bold">{dados.artigos.total}</p>
            <p className="text-sm text-muted-foreground">Artigos de Blog Otimizado</p>
          </Link>
        </div>
      </div>

      {/* Gráfico e Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolução de Score */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Evolução da Presença Local
            </h2>
          </div>
          <p className="text-sm text-muted-foreground border-b border-border/50 pb-4">
            Acompanhe o crescimento do seu negócio ao longo do tempo.
          </p>
          <div className="flex-1 min-h-[300px]">
            <GraficoEvolucao dados={dadosGrafico} />
          </div>
        </div>

        {/* Feed de atividades */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col h-full overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sucesso" />
            Ativos Recentes (IA)
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {atividadesRecentesRes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">
                  Sem atividades da IA ainda
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                  Os robôs começarão a trabalhar assim que você configurar as integrações.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {atividadesRecentesRes.map((atividade) => (
                  <div key={atividade.id} className="flex gap-3 relative pb-4 last:pb-0">
                    {/* Linha vertical */}
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border last:hidden" />
                    
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted border border-border z-10 shrink-0">
                      {atividade.tipo === "GMB" && <PenSquare className="w-3.5 h-3.5 text-primary" />}
                      {atividade.tipo === "AVALIACOES" && <Star className="w-3.5 h-3.5 text-alerta" />}
                      {atividade.tipo === "BLOG" && <FileText className="w-3.5 h-3.5 text-sucesso" />}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">
                        Agente {atividade.tipo} {atividade.status === "SUCESSO" ? "concluiu" : "falhou"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tempoRelativo(atividade.criadoEm)}
                      </p>
                      {atividade.status === "SUCESSO" && (
                        <div className="mt-2 text-xs bg-sucesso/10 text-sucesso px-2 py-1 rounded inline-block">
                          Sucesso ({atividade.duracaoMs ? Math.round(atividade.duracaoMs / 1000) : '?'}s)
                        </div>
                      )}
                      {atividade.status === "FALHOU" && (
                        <div className="mt-2 text-xs bg-perigo/10 text-perigo px-2 py-1 rounded inline-block">
                          Falha na execução
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
