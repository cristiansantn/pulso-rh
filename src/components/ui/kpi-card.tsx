import { PeriodoBadge } from "@/components/ui/periodo-badge";

interface KpiCardProps {
  rotulo: string;
  valor: string;
  detalhe?: string;
  periodo?: string;
  pendente?: boolean;
}

/**
 * Cartao de indicador da visao geral. Indicadores cujo modulo ainda nao foi
 * implementado sao exibidos como pendentes, mantendo o layout final desde ja.
 */
export function KpiCard({
  rotulo,
  valor,
  detalhe,
  periodo,
  pendente = false,
}: KpiCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {rotulo}
        </p>
        {periodo && <PeriodoBadge periodo={periodo} />}
      </div>
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
