import { FileText, Globe, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, artigos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { CriadorBlog } from "./criador-blog";
import Link from "next/link";
import { Star } from "lucide-react";
import { getAcessoPlano } from "@/lib/planos";
import { Paywall } from "@/components/paywall";
import type { PlanoAssinatura } from "@/types";

export default async function PaginaBlog() {
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

  // Verificar acesso pelo plano
  const acesso = getAcessoPlano((negocioUser.plano ?? "INICIAL") as PlanoAssinatura);
  if (!acesso.blogLiberado) {
    return (
      <Paywall
        feature="Portal & Blog SEO"
        planoMinimo="Pro"
        descricao="Gere artigos gigantes estruturados (EEAT) para dominar as buscas locais. Disponível a partir do plano Pro."
      />
    );
  }

  // Buscar artigos gerados
  const listaArtigos = await bd.query.artigos.findMany({
    where: eq(artigos.negocioId, negocioUser.id),
    orderBy: [desc(artigos.criadoEm)],
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Portal & Blog (SEO Long-form)</h1>
          <p className="text-muted-foreground mt-1">
            Gere artigos gigantes estruturados (EEAT) para dominar as buscas locais no Google.
          </p>
        </div>
      </div>

      {/* Hero, Criador e Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CriadorBlog />
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6 flex flex-col justify-center bg-sucesso/5 border border-sucesso/20">
            <div className="flex items-center gap-3 text-sucesso mb-4">
              <Globe className="w-5 h-5" />
              <span className="font-medium text-sm">Artigos Indexáveis</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{listaArtigos.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Páginas SSG prontas para o Googlebot Ler.</p>
          </div>
          
          <div className="glass-card p-6 flex flex-col justify-center border-dashed border-primary/40 relative overflow-hidden group">
            <div className="flex items-center gap-3 text-muted-foreground mb-4 opacity-80">
              <Search className="w-5 h-5" />
              <span className="font-medium text-sm">Dica de Ranqueamento</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
              "Para bater concorrentes locais, tente criar 1 artigo a cada dois dias respondendo dúvidas reais que clientes perguntam no balcão."
            </p>
          </div>
        </div>
      </div>

      {/* Histórico / Feed de Artigos */}
      <div className="glass-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sucesso" />
          Acervo de Artigos (Central Content)
        </h2>

        {listaArtigos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-border mt-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium">Seu Blog está vazio</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm mx-auto">
              Use a IA acima para montar seu primeiro pilar de conteúdo SEO e começar a atrair potenciais clientes através de busca orgânica profunda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {listaArtigos.map((artigo: any) => (
              <div key={artigo.id} className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-start group">
                
                {/* Imagem Thumbnail */}
                <div className="w-full sm:w-48 h-32 bg-muted rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
                  {artigo.imagemHero ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={artigo.imagemHero} 
                      alt={artigo.titulo} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-foreground">
                    SEO Longo
                  </div>
                </div>

                {/* Conteúdo Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate" title={artigo.titulo}>
                    {artigo.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {artigo.metaDescricao}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[10px] px-2 py-1 rounded bg-sucesso/10 text-sucesso font-semibold border border-sucesso/20">
                      🎯 KW: {artigo.palavraChave}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                      {artigo.status}
                    </span>
                  </div>
                </div>

                {/* Ações / Data */}
                <div className="sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto h-full pt-2">
                  <div className="text-xs text-muted-foreground flex flex-col sm:items-end">
                    <span>{formatarData(artigo.criadoEm)}</span>
                    <span>{tempoRelativo(artigo.criadoEm)}</span>
                  </div>
                  
                  <Link 
                    href={`/blog/${artigo.slug}`} 
                    target="_blank"
                    className="mt-4 sm:mb-2 text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1.5 transition-colors"
                  >
                    Ler Artigo <Globe className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
