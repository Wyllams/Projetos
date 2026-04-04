import { bd } from "@/db";
import { account } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";

/**
 * Função utilitária para recuperar o Access Token do Google do Banco de Dados
 * O token é salvo pelo Better Auth quando o usuário faz login e aceita os escopos.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const accountQuery = await bd.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });

  if (!accountQuery || !accountQuery.accessToken) {
    return null;
  }
  return accountQuery.accessToken;
}

/**
 * Interface simples para Contas e Locais
 */
interface GmbAccount {
  name: string; // ex: accounts/123456
  accountName: string; // O nome fantasia da conta
  type: string;
}

interface GmbLocation {
  name: string; // ex: accounts/123/locations/456
  title: string;
  storeCode?: string;
}

export async function listarContasGMB(accessToken: string): Promise<GmbAccount[]> {
  const url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[GMB] Erro ao listar contas:", txt);
    throw new Error(`Erro API Google: ${res.status}`);
  }

  const data = await res.json();
  return data.accounts || [];
}

export async function listarLocaisGMB(accessToken: string, accountName: string): Promise<GmbLocation[]> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[GMB] Erro ao listar locais:", txt);
    throw new Error(`Erro API Google: ${res.status}`);
  }

  const data = await res.json();
  return data.locations || [];
}

export async function publicarPostGMB(
  accessToken: string,
  accountName: string,
  locationName: string, // Pode vir tudo em "name" da query locations
  conteudo: string,
  imagemUrl?: string,
  tipoAcao: string = "LEARN_MORE",
  siteUrl?: string
) {
  // A string 'locationName' da businessInformation costuma ser igual a accounts/{accountId}/locations/{locationId}
  // A documentação do LocalPosts v4.9 pede parent: accounts/{accountId}/locations/{locationId}
  // BaseURL da API v4
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;

  const corpoPost: any = {
    languageCode: "pt-BR",
    summary: conteudo,
  };

  if (imagemUrl) {
    corpoPost.media = [
      {
        mediaFormat: "PHOTO",
        sourceUrl: imagemUrl,
      },
    ];
  }

  if (siteUrl && tipoAcao !== "NONE") {
    corpoPost.action = {
      actionType: tipoAcao,
      url: siteUrl,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpoPost),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[GMB] Erro ao publicar post local:", errorText);
    throw new Error(`Erro de publicação GMB: ${res.status} - ${errorText}`);
  }

  return await res.json();
}
