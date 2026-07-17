import { STATUS_LABELS, type StatusColaborador } from "@/lib/data/tipos";

const ESTILOS: Record<StatusColaborador, string> = {
  ativo: "bg-positive-soft text-positive",
  ferias: "bg-warning-soft text-warning",
  afastado: "bg-negative-soft text-negative",
  desligado: "bg-neutral-soft text-ink-muted",
};

export function StatusBadge({ status }: { status: StatusColaborador }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
