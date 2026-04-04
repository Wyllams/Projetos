"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de autenticação para componentes React.
 * Fornece hooks como useSession, signIn, signOut.
 */
const clienteAuth = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = clienteAuth;
export default clienteAuth;
