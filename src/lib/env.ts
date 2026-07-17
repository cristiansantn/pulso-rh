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

/** Cookie que marca uma sessao ativa fora do Supabase (demo ou conta local). */
export const DEMO_SESSION_COOKIE = "demo_session";

export interface ContaLocal {
  usuario: string;
  senhaSha256: string;
  nome: string;
  papel: string;
}

/**
 * Conta local unica definida por variaveis de ambiente, para dar acesso
 * nominal antes do Supabase entrar. A senha nunca fica no codigo: apenas o
 * hash (sha256 de "pulso:" + senha) e configurado no ambiente.
 */
export function contaLocal(): ContaLocal | null {
  const usuario = process.env.ACESSO_USUARIO;
  const senhaSha256 = process.env.ACESSO_SENHA_SHA256;
  if (!usuario || !senhaSha256) return null;

  return {
    usuario,
    senhaSha256,
    nome: process.env.ACESSO_NOME ?? usuario,
    papel: process.env.ACESSO_PAPEL ?? "Acesso total",
  };
}
