import { Clock } from "@phosphor-icons/react/dist/ssr";

/**
 * Selo de periodo. Torna explicita e visualmente uniforme a janela de tempo de
 * cada card do dashboard, para que janelas diferentes (12 meses, 90 dias, foto
 * atual) leiam como intencionais e nao como inconsistencia dos dados. Neutro de
 * proposito, para nao se confundir com os badges de status coloridos.
 */
export function PeriodoBadge({ periodo }: { periodo: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted">
      <Clock size={11} />
      {periodo}
    </span>
  );
}
