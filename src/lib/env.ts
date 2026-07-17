/**
 * Quando as credenciais do Supabase nao estao presentes, o sistema opera em
 * modo demonstracao: autenticacao simplificada e dados ficticios em memoria.
 * Isso permite desenvolver e apresentar o produto antes de provisionar o banco.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Cookie que marca uma sessao ativa do modo demonstracao. */
export const DEMO_SESSION_COOKIE = "demo_session";
