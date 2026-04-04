import { Megaphone, CalendarCheck, Image as ImageIcon, Box } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { bd } from "@/db";
import { negocios, postagens } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatarData, tempoRelativo } from "@/lib/utils";
import { CriadorPostagem } from "./criador-postagem";

export default async function PaginaPostagens() {
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

  // Buscar postagens do banco
  const listaPostagens = await bd.query.postagens.findMany({
    where: eq(postagens.negocioId, negocioUser.id),
    orderBy: [desc(postagens.criadoEm)],
  });

  const publicadas = listaPostagens.filter((p: any) => p.status === "PUBLICADO").length;
  const agendadas = listaPostagens.filter((p: any) => p.status === "AGENDADO").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Postagens GMB</h1>
          <p className="text-muted-foreground mt-1">
            Gere conteúdo atrativo para o seu perfil do Google Meu Negócio usando IA.
          </p>
        </div>
      </div>

      {/* Hero e Criador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CriadorPostagem />
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <Megaphone className="w-5 h-5 text-sucesso" />
              <span className="font-medium text-sm">Postagens Ativas</span>
            </div>
            <p className="text-3xl font-bold text-sucesso">{publicadas}</p>
            <p className="text-xs text-muted-foreground mt-2">Visíveis no seu perfil Google agora.</p>
          </div>
          
          <div className="glass-card p-6 flex flex-col justify-center border-dashed border-primary/40 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CalendarCheck className="w-8 h-8 text-primary mx-auto mb-3 opacity-80" />
            <h3 className="font-semibold text-lg text-foreground">Postagens Agendadas ({agendadas})</h3>
            <p className="text-xs text-muted-foreground mt-1">
              O agendador automático será liberado na versão final.
            </p>
          </div>
        </div>
      </div>

      {/* Histórico / Feed de Postagens */}
      <div className="glass-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">Histórico de Conteúdo</h2>

        {listaPostagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-border mt-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Box className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhum post criado ainda</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Gere sua primeira postagem usando a IA acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {listaPostagens.map((post: any) => (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
                {/* Imagem Cover */}
                <div className="h-40 bg-muted relative w-full overflow-hidden flex items-center justify-center">
                  {post.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={post.imagemUrl} 
                      alt="Imagem do Post" 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  {/* Badge Tipo overlay */}
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-foreground">
                    {post.tipo}
                  </div>
                </div>
                
                {/* Corpo */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Badge Status */}
                  <div className="mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                      post.status === "PUBLICADO" ? "bg-sucesso/10 text-sucesso" :
                      post.status === "AGENDADO" ? "bg-alerta/10 text-alerta" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pb-4 mb-auto">
                    {/* Trunca texto grande no preview */}
                    {post.conteudo.length > 200 ? post.conteudo.substring(0, 200) + "..." : post.conteudo}
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatarData(post.criadoEm)}</span>
                    <span>{tempoRelativo(post.criadoEm)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
