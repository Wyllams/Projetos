import {
  pgTable,
  uuid,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Tabela: Pontuação de Presença ===== */
export const pontuacoesPresenca = pgTable("pontuacoes_presenca", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  total: integer("total").notNull().default(0),       // 0-100
  pontuacaoGmb: integer("pontuacao_gmb").notNull().default(0),       // 0-25
  pontuacaoAvaliacoes: integer("pontuacao_avaliacoes").notNull().default(0), // 0-25
  pontuacaoSite: integer("pontuacao_site").notNull().default(0),      // 0-25
  pontuacaoBlog: integer("pontuacao_blog").notNull().default(0),      // 0-25
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const pontuacoesPresencaRelacoes = relations(pontuacoesPresenca, ({ one }) => ({
  negocio: one(negocios, {
    fields: [pontuacoesPresenca.negocioId],
    references: [negocios.id],
  }),
}));
