import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Rota catch-all para o Better-Auth.
 * Gerencia login, logout, callback OAuth, etc.
 */
export const { POST, GET } = toNextJsHandler(auth);
