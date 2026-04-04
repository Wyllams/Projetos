import {
  pgTable,
  uuid,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Enums ===== */
export const enumTipoAgente = pgEnum("tipo_agente", [
  "GMB",
  "AVALIACOES",
  "BLOG",
  "SITE",
]);

export const enumStatusExecucao = pgEnum("status_execucao", [
  "PENDENTE",
  "EXECUTANDO",
  "SUCESSO",
  "FALHOU",
]);

/* ===== Tabela: Execuções do Agente ===== */
export const execucoesAgente = pgTable("execucoes_agente", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  tipo: enumTipoAgente("tipo").notNull(),
  status: enumStatusExecucao("status").notNull().default("PENDENTE"),
  resultado: jsonb("resultado"),
  tokensUsados: integer("tokens_usados"),
  duracaoMs: integer("duracao_ms"),
  erro: jsonb("erro"),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const execucoesAgenteRelacoes = relations(execucoesAgente, ({ one }) => ({
  negocio: one(negocios, {
    fields: [execucoesAgente.negocioId],
    references: [negocios.id],
  }),
}));
