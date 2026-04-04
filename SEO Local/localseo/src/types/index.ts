/**
 * Tipos globais do projeto LocalSEO.
 * Centraliza todas as interfaces e types compartilhados.
 */

/* ===== Negócio ===== */
export type CategoriaNegocio =
  | "RESTAURANTE"
  | "CLINICA"
  | "BARBEARIA"
  | "ACADEMIA"
  | "FARMACIA"
  | "SALAO_DE_BELEZA"
  | "PET_SHOP"
  | "LOJA"
  | "SERVICOS"
  | "OUTRO";

export type PlanoAssinatura = "INICIAL" | "PRO" | "PRO_PLUS" | "AGENCIA";

export interface Negocio {
  id: string;
  nome: string;
  slug: string;
  categoria: CategoriaNegocio;
  cidade: string;
  estado?: string;
  telefone?: string;
  website?: string;
  subdominio: string;
  plano: PlanoAssinatura;
  logoUrl?: string;
  descricao?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

/* ===== Avaliação (Review) ===== */
export type Sentimento = "POSITIVO" | "NEGATIVO" | "NEUTRO";

export interface Avaliacao {
  id: string;
  negocioId: string;
  googleReviewId?: string;
  autor: string;
  nota: number;
  texto?: string;
  sentimento?: Sentimento;
  respondido: boolean;
  textoResposta?: string;
  respondidoEm?: Date;
  publicadoEm: Date;
  criadoEm: Date;
}

/* ===== Postagem GMB ===== */
export type TipoPostagem = "NOVIDADE" | "OFERTA" | "EVENTO";
export type StatusPostagem = "RASCUNHO" | "PUBLICADO" | "AGENDADO" | "FALHOU";

export interface Postagem {
  id: string;
  negocioId: string;
  conteudo: string;
  imagemUrl?: string;
  tipo: TipoPostagem;
  status: StatusPostagem;
  agendadoPara?: Date;
  publicadoEm?: Date;
  criadoEm: Date;
}

/* ===== Artigo ===== */
export type StatusArtigo = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

export interface SecaoArtigo {
  subtitulo: string;
  conteudo: string;
  imagemUrl?: string;
  imagemAlt?: string;
}

export interface ConteudoArtigo {
  introducao: string;
  secoes: SecaoArtigo[];
  conclusao: string;
}

export interface Artigo {
  id: string;
  negocioId: string;
  titulo: string;
  slug: string;
  conteudo?: ConteudoArtigo;
  metaDescricao?: string;
  palavraChave?: string;
  palavrasChaveSecundarias?: string[];
  imagemHero?: string;
  status: StatusArtigo;
  publicadoEm?: Date;
  criadoEm: Date;
}

/* ===== Execução do Agente ===== */
export type TipoAgente = "GMB" | "AVALIACOES" | "BLOG" | "SITE";
export type StatusExecucao = "PENDENTE" | "EXECUTANDO" | "SUCESSO" | "FALHOU";

export interface ExecucaoAgente {
  id: string;
  negocioId: string;
  tipo: TipoAgente;
  status: StatusExecucao;
  resultado?: Record<string, unknown>;
  tokensUsados?: number;
  duracaoMs?: number;
  erro?: Record<string, unknown>;
  criadoEm: Date;
}

/* ===== Pontuação de Presença ===== */
export interface PontuacaoPresenca {
  id: string;
  negocioId: string;
  total: number;
  pontuacaoGmb: number;
  pontuacaoAvaliacoes: number;
  pontuacaoSite: number;
  pontuacaoBlog: number;
  criadoEm: Date;
}

/* ===== Planos do Produto ===== */
export interface InfoPlano {
  id: PlanoAssinatura;
  nome: string;
  preco: number;
  descricao: string;
  funcionalidades: string[];
  destaque?: boolean;
}

export const PLANOS: InfoPlano[] = [
  {
    id: "INICIAL",
    nome: "Inicial",
    preco: 97,
    descricao: "Perfeito para começar sua presença digital",
    funcionalidades: [
      "Resposta automática de avaliações",
      "1 post semanal no Google",
      "Score de presença local",
      "Relatório semanal por email",
    ],
  },
  {
    id: "PRO",
    nome: "Pro",
    preco: 197,
    descricao: "Para negócios que querem crescer rápido",
    destaque: true,
    funcionalidades: [
      "Tudo do plano Inicial",
      "2 posts semanais no Google",
      "Blog com artigos SEO",
      "Site profissional com subdomínio",
      "Monitor de concorrentes",
    ],
  },
  {
    id: "PRO_PLUS",
    nome: "Pro+",
    preco: 297,
    descricao: "Máxima visibilidade para seu negócio",
    funcionalidades: [
      "Tudo do plano Pro",
      "4 posts semanais no Google",
      "Artigos SEO ilimitados",
      "Relatório via WhatsApp",
      "Suporte prioritário",
    ],
  },
  {
    id: "AGENCIA",
    nome: "Agência",
    preco: 697,
    descricao: "Para agências que gerenciam múltiplos clientes",
    funcionalidades: [
      "Tudo do plano Pro+",
      "Até 10 negócios",
      "Painel centralizado",
      "White-label",
      "API de integração",
      "Gerente de conta dedicado",
    ],
  },
];

/* ===== Categorias com labels ===== */
export const CATEGORIAS: { valor: CategoriaNegocio; rotulo: string }[] = [
  { valor: "RESTAURANTE", rotulo: "Restaurante" },
  { valor: "CLINICA", rotulo: "Clínica" },
  { valor: "BARBEARIA", rotulo: "Barbearia" },
  { valor: "ACADEMIA", rotulo: "Academia" },
  { valor: "FARMACIA", rotulo: "Farmácia" },
  { valor: "SALAO_DE_BELEZA", rotulo: "Salão de Beleza" },
  { valor: "PET_SHOP", rotulo: "Pet Shop" },
  { valor: "LOJA", rotulo: "Loja" },
  { valor: "SERVICOS", rotulo: "Serviços" },
  { valor: "OUTRO", rotulo: "Outro" },
];
