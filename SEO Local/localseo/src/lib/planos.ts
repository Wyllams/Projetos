/**
 * Controle de acesso por plano.
 *
 * Define os limites de cada funcionalidade por plano,
 * garantindo que features premium ficam travadas para quem não paga.
 *
 * @example
 *   const acesso = getAcessoPlano("INICIAL");
 *   if (!acesso.blogLiberado) { redirect("/painel/cobranca"); }
 */

import { PlanoAssinatura } from "@/types";

export interface AcessoPlano {
  /** Nº máximo de posts por semana */
  postsSemanais: number;
  /** Pode usar o gerador de artigos SEO/Blog? */
  blogLiberado: boolean;
  /** Nº máximo de artigos por mês (Infinity = ilimitado) */
  artigosMaxMes: number;
  /** Pode ver monitor de concorrentes? */
  monitorConcorrentes: boolean;
  /** Pode ver relatório via WhatsApp? */
  relatorioWhatsApp: boolean;
  /** Suporte prioritário? */
  suportePrioritario: boolean;
  /** Número máximo de negócios */
  maxNegocios: number;
  /** White-label e API? */
  whiteLabel: boolean;
}

const ACESSO_POR_PLANO: Record<PlanoAssinatura, AcessoPlano> = {
  INICIAL: {
    postsSemanais: 1,
    blogLiberado: false,
    artigosMaxMes: 0,
    monitorConcorrentes: false,
    relatorioWhatsApp: false,
    suportePrioritario: false,
    maxNegocios: 1,
    whiteLabel: false,
  },
  PRO: {
    postsSemanais: 2,
    blogLiberado: true,
    artigosMaxMes: 4,
    monitorConcorrentes: true,
    relatorioWhatsApp: false,
    suportePrioritario: false,
    maxNegocios: 1,
    whiteLabel: false,
  },
  PRO_PLUS: {
    postsSemanais: 4,
    blogLiberado: true,
    artigosMaxMes: Infinity,
    monitorConcorrentes: true,
    relatorioWhatsApp: true,
    suportePrioritario: true,
    maxNegocios: 1,
    whiteLabel: false,
  },
  AGENCIA: {
    postsSemanais: 4,
    blogLiberado: true,
    artigosMaxMes: Infinity,
    monitorConcorrentes: true,
    relatorioWhatsApp: true,
    suportePrioritario: true,
    maxNegocios: 10,
    whiteLabel: true,
  },
};

/**
 * Retorna as permissões de acesso de acordo com o plano.
 */
export function getAcessoPlano(plano: PlanoAssinatura): AcessoPlano {
  return ACESSO_POR_PLANO[plano] ?? ACESSO_POR_PLANO.INICIAL;
}

/**
 * Verifica se o plano dá acesso a uma feature específica.
 */
export function temAcesso(
  plano: PlanoAssinatura,
  feature: keyof AcessoPlano
): boolean {
  const acesso = getAcessoPlano(plano);
  const val = acesso[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}
