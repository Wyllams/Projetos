import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bd } from "@/db";

/**
 * Configuração central do Better-Auth.
 * - Google OAuth como provedor social
 * - Drizzle ORM como adaptador de banco
 * - UUIDs gerados pelo PostgreSQL
 */
export const auth = betterAuth({
  database: drizzleAdapter(bd, {
    provider: "pg",
  }),

  /* ===== Provedores Sociais ===== */
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/business.manage"],
    },
  },
  
  /* ===== Autenticação Local (Bypass) ===== */
  emailAndPassword: {
    enabled: true,
  },

  /* ===== Sessão ===== */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,      // Atualiza a cada 1 dia
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache de cookie por 5 minutos
    },
  },

  /* ===== URLs de Trust ===== */
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
});

/** Tipo da sessão para uso nos componentes */
export type Sessao = typeof auth.$Infer.Session;
export type Usuario = typeof auth.$Infer.Session.user;
