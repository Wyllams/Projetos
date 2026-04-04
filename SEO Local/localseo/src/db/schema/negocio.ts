import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ===== Enums ===== */
export const enumPlano = pgEnum("plano", [
  "INICIAL",
  "PRO",
  "PRO_PLUS",
  "AGENCIA",
]);

export const enumCategoria = pgEnum("categoria_negocio", [
  "RESTAURANTE",
  "CLINICA",
  "BARBEARIA",
  "ACADEMIA",
  "FARMACIA",
  "SALAO_DE_BELEZA",
  "PET_SHOP",
  "LOJA",
  "SERVICOS",
  "OUTRO",
]);

/* ===== Tabela: Negócios ===== */
export const negocios = pgTable("negocios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  categoria: enumCategoria("categoria").notNull(),
  cidade: varchar("cidade", { length: 255 }).notNull(),
  estado: varchar("estado", { length: 2 }),
  telefone: varchar("telefone", { length: 20 }),
  website: varchar("website", { length: 500 }),
  subdominio: varchar("subdominio", { length: 255 }).notNull().unique(),
  gmbContaId: varchar("gmb_conta_id", { length: 255 }),
  gmbLocalId: varchar("gmb_local_id", { length: 255 }),
  donoId: varchar("dono_id", { length: 255 }).notNull(),
  plano: enumPlano("plano").notNull().default("INICIAL"),
  asaasClienteId: varchar("asaas_cliente_id", { length: 255 }),
  asaasAssinaturaId: varchar("asaas_assinatura_id", { length: 255 }),
  statusAssinatura: varchar("status_assinatura", { length: 50 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações: Negócios ===== */
export const negociosRelacoes = relations(negocios, ({ many }) => ({
  artigos: many(artigos),
  postagens: many(postagens),
  avaliacoes: many(avaliacoes),
  execucoesAgente: many(execucoesAgente),
  pontuacoesPresenca: many(pontuacoesPresenca),
}));

/* ===== Import circular-safe: Declarações forward das tabelas ===== */
import { artigos } from "./artigo";
import { postagens } from "./postagem";
import { avaliacoes } from "./avaliacao";
import { execucoesAgente } from "./execucao-agente";
import { pontuacoesPresenca } from "./pontuacao-presenca";
