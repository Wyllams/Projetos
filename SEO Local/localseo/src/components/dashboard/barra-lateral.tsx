"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Star,
  FileText,
  PenSquare,
  Globe,
  BarChart3,
  Settings,
  CreditCard,
  ChevronLeft,
  MapPin,
} from "lucide-react";
import { useState } from "react";

interface PropsBarraLateral {
  usuario: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/** Itens do menu lateral */
const ITENS_MENU = [
  {
    rotulo: "Visão Geral",
    href: "/painel",
    icone: LayoutDashboard,
    grupo: "PRINCIPAL",
  },
  {
    rotulo: "Avaliações",
    href: "/painel/avaliacoes",
    icone: Star,
    grupo: "PRINCIPAL",
  },
  {
    rotulo: "Postagens GMB",
    href: "/painel/postagens",
    icone: PenSquare,
    grupo: "PRINCIPAL",
  },
  {
    rotulo: "Blog SEO",
    href: "/painel/blog",
    icone: FileText,
    grupo: "CONTEÚDO",
  },
  {
    rotulo: "Meu Site",
    href: "/painel/site",
    icone: Globe,
    grupo: "CONTEÚDO",
  },
  {
    rotulo: "Relatórios",
    href: "/painel/relatorios",
    icone: BarChart3,
    grupo: "ANÁLISE",
  },
  {
    rotulo: "Configurações",
    href: "/painel/configuracoes",
    icone: Settings,
    grupo: "CONTA",
  },
  {
    rotulo: "Plano & Cobrança",
    href: "/painel/cobranca",
    icone: CreditCard,
    grupo: "CONTA",
  },
];

/**
 * Barra lateral (Sidebar) do dashboard.
 * Responsiva: oculta no mobile, fixa no desktop.
 */
export function BarraLateral({ usuario }: PropsBarraLateral) {
  const caminhoAtual = usePathname();
  const [aberta, setAberta] = useState(false);

  // Agrupar itens do menu
  const grupos = ITENS_MENU.reduce(
    (acc, item) => {
      if (!acc[item.grupo]) acc[item.grupo] = [];
      acc[item.grupo].push(item);
      return acc;
    },
    {} as Record<string, typeof ITENS_MENU>
  );

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setAberta(false)}
        />
      )}

      {/* Botão mobile para abrir sidebar */}
      <button
        onClick={() => setAberta(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-card border border-border"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50",
          "flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          aberta ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/painel" className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LocalSEO</span>
          </Link>
          <button
            onClick={() => setAberta(false)}
            className="lg:hidden p-1 rounded hover:bg-muted transition-colors"
            aria-label="Fechar menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {Object.entries(grupos).map(([grupo, itens]) => (
            <div key={grupo} className="mb-6">
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {grupo}
              </p>
              <ul className="space-y-1">
                {itens.map((item) => {
                  const ativo =
                    item.href === "/painel"
                      ? caminhoAtual === "/painel"
                      : caminhoAtual.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setAberta(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                          "transition-all duration-200",
                          ativo
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <item.icone
                          className={cn(
                            "w-4.5 h-4.5 flex-shrink-0",
                            ativo ? "text-primary" : ""
                          )}
                        />
                        {item.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Card do usuário */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            {usuario.image ? (
              <img
                src={usuario.image}
                alt={usuario.name || "Usuário"}
                className="w-9 h-9 rounded-full ring-2 ring-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {usuario.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {usuario.name || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {usuario.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
