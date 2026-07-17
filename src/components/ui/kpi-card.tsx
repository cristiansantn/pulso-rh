interface KpiCardProps {
  rotulo: string;
  valor: string;
  detalhe?: string;
  pendente?: boolean;
}

/**
 * Cartao de indicador da visao geral. Indicadores cujo modulo ainda nao foi
 * implementado sao exibidos como pendentes, mantendo o layout final desde ja.
 */
export function KpiCard({ rotulo, valor, detalhe, pendente = false }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        {rotulo}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          pendente ? "text-ink-muted" : ""
        }`}
      >
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-xs text-ink-muted">{detalhe}</p>}
    </div>
  );
}
