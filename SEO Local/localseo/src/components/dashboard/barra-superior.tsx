"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Search } from "lucide-react";
import { useState } from "react";

interface PropsBarraSuperior {
  usuario: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Barra superior (Header) do dashboard.
 * Contém busca, notificações e ações do usuário.
 */
export function BarraSuperior({ usuario }: PropsBarraSuperior) {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Busca */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar avaliações, posts, artigos..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border 
              text-sm text-foreground placeholder:text-muted-foreground/50
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
              transition-all duration-200"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notificações */}
        <button
          className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {/* Badge de notificação */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-perigo rounded-full" />
        </button>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {usuario.image ? (
              <img
                src={usuario.image}
                alt={usuario.name || "Usuário"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {usuario.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {menuAberto && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuAberto(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 py-2 animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">{usuario.name}</p>
                  <p className="text-xs text-muted-foreground">{usuario.email}</p>
                </div>
                <button
                  onClick={sair}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-perigo hover:bg-perigo/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
