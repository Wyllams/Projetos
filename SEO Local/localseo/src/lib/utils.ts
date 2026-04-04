import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind de forma segura,
 * resolvendo conflitos automaticamente.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera um slug a partir de um texto.
 * Ex: "Barbearia do João" → "barbearia-do-joao"
 */
export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "")   // Remove caracteres especiais
    .replace(/\s+/g, "-")            // Espaços viram hífens
    .replace(/-+/g, "-")             // Remove hífens duplicados
    .replace(/^-|-$/g, "");          // Remove hífens no início/fim
}

/**
 * Formata uma data para o padrão brasileiro.
 * Ex: "04/04/2026 às 11:30"
 */
export function formatarData(data: Date | string, incluirHora = false): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const opcoes: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(incluirHora && { hour: "2-digit", minute: "2-digit" }),
  };
  return d.toLocaleDateString("pt-BR", opcoes);
}

/**
 * Formata um valor para moeda brasileira.
 * Ex: 97 → "R$ 97,00"
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Trunca um texto com "..." se exceder o limite.
 */
export function truncarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  return texto.substring(0, limite).trim() + "...";
}

/**
 * Retorna o tempo relativo em português.
 * Ex: "há 2 horas", "há 3 dias"
 */
export function tempoRelativo(data: Date | string): string {
  const agora = new Date();
  const d = typeof data === "string" ? new Date(data) : data;
  const diffMs = agora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? "s" : ""}`;
  if (diffHoras < 24) return `há ${diffHoras} hora${diffHoras > 1 ? "s" : ""}`;
  if (diffDias < 30) return `há ${diffDias} dia${diffDias > 1 ? "s" : ""}`;
  return formatarData(d);
}

/**
 * Gera uma cor baseada na pontuação (0-100).
 * Vermelho → Amarelo → Verde
 */
export function corDaPontuacao(pontuacao: number): string {
  if (pontuacao >= 70) return "text-sucesso";
  if (pontuacao >= 40) return "text-alerta";
  return "text-perigo";
}

/**
 * Gera uma cor de fundo baseada na pontuação.
 */
export function bgDaPontuacao(pontuacao: number): string {
  if (pontuacao >= 70) return "bg-sucesso/10 border-sucesso/20";
  if (pontuacao >= 40) return "bg-alerta/10 border-alerta/20";
  return "bg-perigo/10 border-perigo/20";
}
