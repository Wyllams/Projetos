"use client";

import { Lock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PaywallProps {
  /** Nome da feature bloqueada (ex: "Artigos SEO") */
  feature: string;
  /** Plano mínimo necessário (ex: "Pro") */
  planoMinimo: string;
  /** Descrição opcional do benefício */
  descricao?: string;
}

/**
 * Componente de paywall — exibido quando o usuário tenta
 * acessar uma funcionalidade bloqueada pelo plano atual.
 */
export function Paywall({ feature, planoMinimo, descricao }: PaywallProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card max-w-lg w-full p-8 text-center space-y-6">
        {/* Ícone */}
        <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold">
            {feature}
          </h2>
          <p className="text-muted-foreground mt-2">
            {descricao ??
              `Esta funcionalidade está disponível a partir do plano ${planoMinimo}.`}
          </p>
        </div>

        {/* Benefício rápido */}
        <div className="flex items-center gap-2 justify-center text-sm text-primary">
          <Sparkles className="w-4 h-4" />
          <span>
            Faça upgrade para <strong>{planoMinimo}</strong> e desbloqueie agora
          </span>
        </div>

        {/* CTA */}
        <Link
          href="/painel/cobranca"
          className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-lg font-medium
                     hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          Ver planos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
