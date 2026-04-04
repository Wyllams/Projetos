import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CobrancaClient from "./cobranca-client";

/**
 * Server Component: busca o plano real do usuário no banco
 * e passa para o Client Component renderizar a UI interativa.
 */
export default async function PaginaCobranca() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessao?.user?.id) {
    redirect("/login");
  }

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  const planoAtual = negocioDb?.plano ?? "INICIAL";
  const statusAssinatura = negocioDb?.statusAssinatura ?? null;

  return (
    <CobrancaClient
      planoAtual={planoAtual}
      statusAssinatura={statusAssinatura}
    />
  );
}
