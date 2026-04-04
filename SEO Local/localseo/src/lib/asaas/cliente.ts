const getBaseUrl = () => {
  return process.env.ASAAS_ENVIRONMENT === "sandbox"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
};

const getHeaders = () => {
  if (!process.env.ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY is not defined");
  }
  return {
    "Content-Type": "application/json",
    access_token: process.env.ASAAS_API_KEY,
  };
};

export type AsaasClienteInput = {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
};

export type AsaasCartaoCredito = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type AsaasAssinaturaInput = {
  customer: string;
  billingType: "CREDIT_CARD" | "PIX" | "BOLETO";
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: "MONTHLY" | "YEARLY";
  description: string;
  creditCard?: AsaasCartaoCredito;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
};

/**
 * Procura um cliente existente pelo CPF/CNPJ
 */
export async function buscarClientePorCpfCnpj(cpfCnpj: string) {
  const url = `${getBaseUrl()}/customers?cpfCnpj=${cpfCnpj}`;
  const response = await fetch(url, { headers: getHeaders() });

  if (!response.ok) {
    throw new Error(`Erro ao buscar cliente: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.data && result.data.length > 0) {
    return result.data[0];
  }
  return null;
}

/**
 * Cria ou recupera um cliente no Asaas.
 */
export async function criarAtualizarCliente(dados: AsaasClienteInput) {
  // Tentar encontrar primeiro
  const existente = await buscarClientePorCpfCnpj(dados.cpfCnpj);
  if (existente) {
    return existente;
  }

  // Senão cria
  const url = `${getBaseUrl()}/customers`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(dados),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Erro Asaas (Customers):", result);
    throw new Error(result.errors?.[0]?.description || "Erro ao criar cliente");
  }

  return result;
}

/**
 * Cria uma Assinatura no Asaas
 */
export async function criarAssinatura(dados: AsaasAssinaturaInput) {
  const url = `${getBaseUrl()}/subscriptions`;
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      ...dados,
      updatePendingPayments: true,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Erro Asaas (Subscriptions):", result);
    throw new Error(
      result.errors?.[0]?.description || "Erro ao criar assinatura"
    );
  }

  return result;
}
