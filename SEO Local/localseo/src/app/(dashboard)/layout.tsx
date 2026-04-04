"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarraSuperior } from "@/components/dashboard/barra-superior";
import { BarraLateral } from "@/components/dashboard/barra-lateral";
import { Toaster } from "sonner";

/**
 * Layout principal do painel (dashboard).
 * Protegido por middleware + verificação client-side.
 */
export default function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessao, isPending: carregando } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !sessao) {
      router.replace("/login");
    }
  }, [sessao, carregando, router]);

  // Skeleton enquanto carrega a sessão
  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!sessao) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <BarraLateral usuario={sessao.user} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <BarraSuperior usuario={sessao.user} />

        {/* Área de conteúdo com padding */}
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Notificações toast */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(222, 47%, 8%)",
            border: "1px solid hsl(217, 33%, 17%)",
            color: "hsl(210, 40%, 96%)",
          },
        }}
      />
    </div>
  );
}
