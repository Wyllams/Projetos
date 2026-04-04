import { bd } from "@/db";
import { artigos, negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatarData } from "@/lib/utils";
import Link from "next/link";
import { Globe, ArrowLeft, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const dbArtigo = await bd.query.artigos.findFirst({
    where: eq(artigos.slug, resolvedParams.slug),
    with: { negocio: true }
  });

  if (!dbArtigo) return { title: "Artigo não encontrado" };

  return {
    title: `${dbArtigo.titulo} | ${dbArtigo.negocio.nome}`,
    description: dbArtigo.metaDescricao,
    keywords: [dbArtigo.palavraChave, ...(dbArtigo.palavrasChaveSecundarias || [])].join(", "),
  };
}

export default async function PaginaLeituraBlog({ params }: PageProps) {
  const resolvedParams = await params;
  const dbArtigo = await bd.query.artigos.findFirst({
    where: eq(artigos.slug, resolvedParams.slug),
    with: { negocio: true } // join para buscar dados da empresa
  });

  if (!dbArtigo) {
    notFound();
  }

  // O conteúdo vem como JSONb no formato { tag: string, conteudo: string }[]
  const blocos = dbArtigo.conteudo as any[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Público Simples */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <Link href="/painel/blog" className="text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </Link>
          <div className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            {dbArtigo.negocio.nome}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl animate-fade-in pb-32">
        {/* Etiqueta / Categoria */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Blog SEO
          </span>
          <span className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatarData(dbArtigo.publicadoEm || dbArtigo.criadoEm)}
          </span>
        </div>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
          {dbArtigo.titulo}
        </h1>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-10 pb-10 border-b border-border/40">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {dbArtigo.negocio.nome.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm">Escrito por Equipe {dbArtigo.negocio.nome}</p>
            <p className="text-xs text-muted-foreground">Especialistas em {dbArtigo.negocio.categoria}</p>
          </div>
        </div>

        {/* Imagem de Capa */}
        {dbArtigo.imagemHero && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-2xl border border-border/50 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={dbArtigo.imagemHero} 
              alt={dbArtigo.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Conteúdo Dinâmico Renderizado do JSON */}
        <article className="prose prose-invert prose-blue max-w-none prose-img:rounded-xl prose-headings:font-bold prose-a:text-blue-400">
          {Array.isArray(blocos) && blocos.map((bloco, i) => {
            if (bloco.tag === "h2") {
              return <h2 key={i} className="text-3xl mt-12 mb-6 text-foreground/90">{bloco.conteudo}</h2>;
            }
            if (bloco.tag === "h3") {
              return <h3 key={i} className="text-2xl mt-8 mb-4 text-foreground/80">{bloco.conteudo}</h3>;
            }
            if (bloco.tag === "p") {
              return <p key={i} className="text-muted-foreground leading-relaxed mb-6 text-lg">{bloco.conteudo}</p>;
            }
            if (bloco.tag === "ul") {
              // Os bullets vem formatados separados por "|"
              const items = String(bloco.conteudo).split("|");
              return (
                <ul key={i} className="space-y-3 mb-8 bg-muted/20 p-6 rounded-xl border border-border/30">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-muted-foreground items-start">
                      <span className="text-primary mt-1">•</span> 
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </article>

        {/* Call to action fixo do negócio local no fim do artigo */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/20 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Gostou deste conteúdo?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto relative z-10">
            A {dbArtigo.negocio.nome} é referência em {dbArtigo.negocio.categoria}. Venha nos visitar e comprove nossa qualidade.
          </p>
          <button className="relative z-10 gradient-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1">
            Entre em Contato Agora
          </button>
        </div>
      </main>
    </div>
  );
}
