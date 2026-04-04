import { NextRequest, NextResponse } from "next/server";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Webhook do Asaas — recebe notificações de eventos de pagamento.
 *
 * Eventos tratados:
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED → assinatura ativa
 * - PAYMENT_OVERDUE → assinatura vencida
 * - PAYMENT_DELETED / PAYMENT_REFUNDED → assinatura cancelada/estornada
 *
 * Configuração no painel Asaas:
 * - URL: https://SEU_DOMINIO/api/webhooks/asaas
 * - Versão da API: v3
 * - Token: o valor de ASAAS_WEBHOOK_TOKEN
 * - Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
 *            PAYMENT_DELETED, PAYMENT_REFUNDED
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validar token de autenticação
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken) {
      const headerToken = req.headers.get("asaas-access-token");
      if (headerToken !== webhookToken) {
        console.warn("[Webhook Asaas] Token inválido recebido.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Parse do body
    const body = await req.json();
    const evento = body.event as string;
    const pagamento = body.payment;

    if (!evento || !pagamento) {
      return NextResponse.json(
        { error: "Payload inválido" },
        { status: 400 }
      );
    }

    console.log(`[Webhook Asaas] Evento: ${evento} | Cobrança: ${pagamento.id}`);

    // 3. Identificar o negócio pelo subscription (assinatura)
    const subscriptionId = pagamento.subscription;
    if (!subscriptionId) {
      // Pagamento avulso, sem assinatura vinculada. Ignorar por enquanto.
      console.log("[Webhook Asaas] Pagamento avulso (sem assinatura). Ignorado.");
      return NextResponse.json({ received: true });
    }

    // 4. Buscar negócio no nosso banco pela assinatura
    const negocioDb = await bd.query.negocios.findFirst({
      where: eq(negocios.asaasAssinaturaId, subscriptionId),
    });

    if (!negocioDb) {
      console.warn(
        `[Webhook Asaas] Assinatura ${subscriptionId} não encontrada no banco.`
      );
      return NextResponse.json({ received: true });
    }

    // 5. Mapear evento → status interno
    let novoStatus: string;

    switch (evento) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        novoStatus = "ACTIVE";
        break;

      case "PAYMENT_OVERDUE":
        novoStatus = "OVERDUE";
        break;

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_RESTORED":
        novoStatus = "CANCELLED";
        break;

      default:
        // Evento não mapeado — ignora graciosamente
        console.log(`[Webhook Asaas] Evento não tratado: ${evento}`);
        return NextResponse.json({ received: true });
    }

    // 6. Atualizar status no banco
    await bd
      .update(negocios)
      .set({ statusAssinatura: novoStatus })
      .where(eq(negocios.id, negocioDb.id));

    console.log(
      `[Webhook Asaas] Negócio "${negocioDb.nome}" → status atualizado para ${novoStatus}`
    );

    return NextResponse.json({ received: true, status: novoStatus });
  } catch (error: any) {
    console.error("[Webhook Asaas] Erro fatal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
