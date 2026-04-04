import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const tokenSessao = request.cookies.get("better-auth.session_token")?.value;

  // 1. Extração do Subdomínio
  // Ignoramos localhost:3000 ou domínios root em prod, tudo diferente vira subdomínio
  const isLocalhost = hostname.includes("localhost:") || hostname.includes("127.0.0.1:");
  // Em prod alterar "seu-dominio.com.br" para o domínio final do SaaS
  const dominioPrincipal = isLocalhost ? "localhost:3000" : "localseo.com.br";
  
  let subdominio = null;
  if (hostname !== dominioPrincipal) {
    if (isLocalhost) {
      subdominio = hostname.replace(".localhost:3000", "");
    } else {
      subdominio = hostname.replace(`.${dominioPrincipal}`, "");
    }
  }

  // 2. Proteção de Rotas Normais do Painel SaaS
  const pathname = url.pathname;
  const ehRotaProtegida = pathname.startsWith("/painel");
  const ehRotaAuth = pathname.startsWith("/login") || pathname.startsWith("/cadastro");

  // Apenas protegemos as rotas se NAO for uma busca de site (para os sites serem 100% publicos)
  if (!subdominio) {
    if (ehRotaProtegida && !tokenSessao) {
      const urlLogin = new URL("/login", request.url);
      urlLogin.searchParams.set("redirecionar", pathname);
      return NextResponse.redirect(urlLogin);
    }

    if (ehRotaAuth && tokenSessao) {
      return NextResponse.redirect(new URL("/painel", request.url));
    }
  }

  // 3. Rewrite Silencioso de Subdomínios (Vercel Edge)
  // barbearia.localseo.com.br/contato -> /site/barbearia/contato
  if (subdominio && subdominio !== hostname) {
    return NextResponse.rewrite(new URL(`/site/${subdominio}${pathname === "/" ? "" : pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Roda em todas as rotas (necessário para subdomínios) bloqueando apenas os assets pesados
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
