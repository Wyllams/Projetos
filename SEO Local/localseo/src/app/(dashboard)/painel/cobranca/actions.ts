"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  criarAtualizarCliente,
  criarAssinatura,
  AsaasCartaoCredito,
} from "@/lib/asaas/cliente";

export async function processarAssinaturaAction(
  planoId: "INICIAL" | "PRO" | "PRO_PLUS" | "AGENCIA",
  valorMensal: number,
  dadosCartao: AsaasCartaoCredito,
  infoCliente: { nome: string; cpfCnpj: string; cep: string; numeroEnd: string }
) {
  try {
    const sessao = await auth.api.getSession({
      headers: await headers(),
    });
    if (!sessao?.user?.id) return { sucesso: false, erro: "Não autenticado." };

    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.donoId, sessao.user.id),
    });

    if (!negocioDb) return { sucesso: false, erro: "Negócio não encontrado." };

    // 1. Criar ou Obter Cliente no Asaas
    const asaasCliente = await criarAtualizarCliente({
      name: infoCliente.nome,
      email: sessao.user.email,
      cpfCnpj: infoCliente.cpfCnpj,
      postalCode: infoCliente.cep.replace(/\D/g, ""),
      addressNumber: infoCliente.numeroEnd,
    });

    // 2. Montar dados para criar assinatura
    const hoje = new Date();
    const dueDateStr = hoje.toISOString().split("T")[0]; // YYYY-MM-DD

    const assinatura = await criarAssinatura({
      customer: asaasCliente.id,
      billingType: "CREDIT_CARD",
      value: valorMensal,
      nextDueDate: dueDateStr,
      cycle: "MONTHLY",
      description: `Assinatura LocalSEO - Plano ${planoId}`,
      creditCard: dadosCartao,
      creditCardHolderInfo: {
        name: infoCliente.nome,
        email: sessao.user.email,
        cpfCnpj: infoCliente.cpfCnpj,
        postalCode: infoCliente.cep.replace(/\D/g, ""),
        addressNumber: infoCliente.numeroEnd,
        phone: negocioDb.telefone || "11999999999",
      },
    });

    // 3. Salvar no Banco
    await bd
      .update(negocios)
      .set({
        asaasClienteId: asaasCliente.id,
        asaasAssinaturaId: assinatura.id,
        statusAssinatura: assinatura.status,
        plano: planoId,
      })
      .where(eq(negocios.id, negocioDb.id));

    revalidatePath("/painel/cobranca");
    return { sucesso: true, assinaturaId: assinatura.id };
  } catch (error: any) {
    console.error("Erro na action de assinatura:", error);
    return { sucesso: false, erro: error.message || "Erro desconhecido" };
  }
}
