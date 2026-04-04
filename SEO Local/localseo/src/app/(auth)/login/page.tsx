"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Página de Login — LocalSEO
 * Design premium com login via Google OAuth.
 */
export default function PaginaLogin() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const parametros = useSearchParams();
  const redirecionarPara = parametros.get("redirecionar") || "/painel";

  async function entrarComGoogle() {
    try {
      setCarregando(true);
      setErro(null);

      await signIn.social({
        provider: "google",
        callbackURL: redirecionarPara,
      });
    } catch {
      setErro("Não foi possível conectar com o Google. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Logo mobile */}
      <div className="lg:hidden mb-8 flex items-center gap-3">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <span className="text-xl font-bold">LocalSEO</span>
      </div>

      {/* Cabeçalho */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-muted-foreground">
          Entre com sua conta Google para continuar
        </p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-6 p-4 rounded-lg bg-perigo/10 border border-perigo/20 text-perigo text-sm">
          {erro}
        </div>
      )}

      {/* Botão Google OAuth */}
      <button
        onClick={entrarComGoogle}
        disabled={carregando}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl 
          bg-white text-gray-800 font-medium text-base
          hover:bg-gray-50 active:bg-gray-100
          border border-gray-200
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
          group"
      >
        {carregando ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{carregando ? "Conectando..." : "Continuar com Google"}</span>
      </button>

      {/* Separador */}
      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          ou
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Campo de email (Para Dev e Testes Iniciais Rápido) */}
      <div className="space-y-4 text-left">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as typeof e.target & {
            email: { value: string };
            senha: { value: string };
          };
          const email = target.email.value;
          const password = target.senha.value;
          
          if (!email || !password) return setErro("Preencha todos os campos.");

          try {
            setCarregando(true);
            setErro(null);

            // Tenta o Login
            const resLogin = await signIn.email({
              email: email,
              password: password,
            });

            if (resLogin.error) {
               // Tenta criar a conta automaticamente se der erro (UX rápida para MVP)
               const { signUp } = await import('@/lib/auth-client');
               const resCad = await signUp.email({
                 email: email,
                 password: password,
                 name: email.split("@")[0]
               });
               
               if (resCad.error) throw new Error(resCad.error.message || "Erro de Auth");
            }
            
            // Sucesso! Encaminha para painel:
            window.location.href = redirecionarPara;

          } catch (err: any) {
             setErro(err.message || "Credenciais inválidas");
             setCarregando(false);
          }
        }}>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 mt-2"> Email </label>
            <input
              id="email" type="email" required
              placeholder="exemplo@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 mt-2"> Senha </label>
            <input
              id="senha" type="password" required
              placeholder="12345678"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 mt-4 rounded-xl gradient-primary text-white font-medium hover:shadow-lg transition-all duration-200"
          >
            {carregando ? "Autenticando..." : "Testar Login Rápido (Email)"}
          </button>
        </form>
      </div>

      {/* Termos */}
      <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
        Você pode usar senhas genéricas (ex: 12345678) apenas para pular o Setup local do Google OAuth.
      </p>
    </div>
  );
}
