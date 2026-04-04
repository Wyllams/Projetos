"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bd } from "@/db";
import { negocios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGoogleAccessToken, listarContasGMB, listarLocaisGMB } from "@/lib/google-api/gmb";

export async function carregarDadosGMB() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const negocioDb = await bd.query.negocios.findFirst({
    where: eq(negocios.donoId, sessao.user.id),
  });

  const accessToken = await getGoogleAccessToken(sessao.user.id);
  if (!accessToken) {
    return { erro: "Token do Google não encontrado. Faça o login novamente." };
  }

  try {
    const accounts = await listarContasGMB(accessToken);
    return {
       accounts, 
       contaAtual: negocioDb?.gmbContaId, 
       localAtual: negocioDb?.gmbLocalId,
       accessToken // Só pra repassar pro clitente se ele for rodar chain, ou eu chamo tudo do server
    };
  } catch (erro: any) {
    console.error("Erro na carga do GMB:", erro);
    return { erro: "Erro ao comunicar com Google. Ficha não verificada? " + erro.message };
  }
}

export async function carregarLocaisGMB(accountName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  const accessToken = await getGoogleAccessToken(sessao.user.id);
  if (!accessToken) throw new Error("Sem token.");

  try {
    const locais = await listarLocaisGMB(accessToken, accountName);
    return { locais };
  } catch (erro: any) {
    return { erro: erro.message };
  }
}

export async function salvarConfiguracaoGMB(accountName: string, locationName: string) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user?.id) throw new Error("Não autenticado.");

  try {
    await bd
      .update(negocios)
      .set({
        gmbContaId: accountName,
        gmbLocalId: locationName,
      })
      .where(eq(negocios.donoId, sessao.user.id));
      
    return { sucesso: true };
  } catch (erro) {
    return { erro: "Erro ao salvar no banco." };
  }
}
