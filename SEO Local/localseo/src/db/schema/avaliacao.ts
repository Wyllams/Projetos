import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocios } from "./negocio";

/* ===== Enums ===== */
export const enumSentimento = pgEnum("sentimento", [
  "POSITIVO",
  "NEGATIVO",
  "NEUTRO",
]);

/* ===== Tabela: Avaliações (Reviews) ===== */
export const avaliacoes = pgTable("avaliacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .references(() => negocios.id, { onDelete: "cascade" }),
  googleReviewId: varchar("google_review_id", { length: 500 }).unique(),
  autor: varchar("autor", { length: 255 }).notNull(),
  nota: integer("nota").notNull(), // 1-5 estrelas
  texto: text("texto"),
  sentimento: enumSentimento("sentimento"),
  respondido: boolean("respondido").notNull().default(false),
  textoResposta: text("texto_resposta"),
  respondidoEm: timestamp("respondido_em", { withTimezone: true, mode: "date" }),
  publicadoEm: timestamp("publicado_em", { withTimezone: true, mode: "date" })
    .notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/* ===== Relações ===== */
export const avaliacoesRelacoes = relations(avaliacoes, ({ one }) => ({
  negocio: one(negocios, {
    fields: [avaliacoes.negocioId],
    references: [negocios.id],
  }),
}));
