import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { RelatorioSemanalEmail } from "@/emails/relatorio-semanal";
import { bd } from "@/db";
import { negocios, pontuacoesPresenca } from "@/db/schema";
import { auth } from "@/lib/auth"; // Precisamos buscar o e-mail real do usuario no "user" db do better-auth
import { eq, desc } from "drizzle-orm";
// better auth server instance
import { render } from "@react-email/render";

// Vercel Cron Endpoint: Envio dos Relatórios Semanais SEO das PMEs
// O vercel chamará ela via cron configurada no vercel.json

export async function GET(request: Request) {
  try {
    // 1. Validacao de Seguranca da Vercel (garantir q a chamada é local ou CRON)
    const ah = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Descomentar em produção:
    // se if (ah !== `Bearer ${cronSecret}`) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

    if (!resend) {
      return NextResponse.json({ erro: "Módulo de e-mail (Resend) não configurado no servidor." }, { status: 500 });
    }

    // 2. Busca de todos os negócios pagantes na plataforma (Ex: ignorar inativos)
    const listaNegocios = await bd.query.negocios.findMany({
      with: {
        postagens: true,
        artigos: true,
        avaliacoes: true,
        pontuacoesPresenca: {
          orderBy: [desc(pontuacoesPresenca.criadoEm)],
          limit: 1 // pega o ultimo score para enviar no e-mail
        }
      }
    });

    if (listaNegocios.length === 0) {
      return NextResponse.json({ mensagem: "Nenhum negócio cadastrado." }, { status: 200 });
    }

    let enviados = 0;

    // 3. Processa cada assinante
    for (const negocio of listaNegocios) {
      
      // Precisamos achar o email do Dono. Como usamos o better-auth, 
      // precisariamos consultar a tabela the "user". Vamos contornar usando o bd pq `auth.api` requer fetch raw ali.
      // A biblioteca do better-auth cria a tabela pública "user" no postgres
      // @ts-ignore - Fallback usando drizzle nativo p/ auth db caso tipagem não exista
      const userResult = await bd.execute(`SELECT email FROM "user" WHERE id = '${negocio.donoId}' LIMIT 1`);
      const emailDono = ((userResult as any[])[0]?.email as string) || ((userResult as any).rows?.[0]?.email as string);

      if (!emailDono) continue;

      const pontuacaoFinal = negocio.pontuacoesPresenca[0]?.total || 50;

      // Compilar o componente react para html
      const emailHtml = await render(RelatorioSemanalEmail({
        nomeNegocio: negocio.nome,
        pontuacaoAtual: pontuacaoFinal,
        artigosGerados: negocio.artigos.length,
        postsGerados: negocio.postagens.length,
        novasAvaliacoes: negocio.avaliacoes.length,
        dicaSemana: pontuacaoFinal > 80 
          ? "Excelente trabalho. Seu site orgânico está voando no Google Maps! Continue assim."
          : "Tente usar o Agente de IA para responder todas as avaliações desta semana e alavancar suas posições."
      }));

      // Disparo Resend
      await resend.emails.send({
        from: "LocalSEO Bot <bot@app.localseo.com.br>", // Precisará estar autenticado na sua conta Resend
        to: emailDono,
        subject: "Seu Relatório de Performance Local (Esta Semana)",
        html: emailHtml,
      });

      enviados++;
    }

    return NextResponse.json({ 
      sucesso: true, 
      mensagem: `${enviados} relatórios enviados com sucesso via Cron.` 
    });

  } catch (error) {
    console.error("Erro no processamento da Cron de E-mail:", error);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
