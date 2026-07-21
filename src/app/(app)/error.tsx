"use client";

/**
 * Limite de erro das paginas autenticadas. Sem ele, uma falha ao carregar
 * dados (ex.: uma consulta ao Supabase que estoura) derruba a rota inteira com
 * a tela generica "This page couldn't load", sem mensagem. Aqui a falha vira
 * uma tela legivel com opcao de tentar de novo; o digest ajuda a cruzar com os
 * logs do servidor.
 */
export default function ErroPagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold">Não foi possível carregar esta página</h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Ocorreu um erro ao buscar os dados. Tente novamente; se persistir,
        verifique a conexão com o banco de dados.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink-muted">
          Código do erro: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-panel transition-colors hover:bg-brand-strong"
      >
        Tentar novamente
      </button>
    </div>
  );
}
