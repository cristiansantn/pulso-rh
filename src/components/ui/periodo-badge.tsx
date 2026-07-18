import { Clock } from "@phosphor-icons/react/dist/ssr";

/**
 * Selo de periodo. Marca apenas os cards cuja janela de tempo foge da
 * fotografia atual (12 meses, 90 dias), para que janelas diferentes lado a
 * lado leiam como intencionais e nao como inconsistencia dos dados. A foto
 * atual e o padrao da pagina e nao recebe selo. Neutro de proposito, para nao
 * se confundir com os badges de status coloridos.
 */
export function PeriodoBadge({ periodo }: { periodo: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted">
      <Clock size={11} />
      {periodo}
    </span>
  );
}
