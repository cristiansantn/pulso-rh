"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import {
  CATEGORIAS_AFASTAMENTO,
  TIPOS_AFASTAMENTO,
  type Afastamento,
} from "@/lib/data/tipos";

export interface DadosFicha {
  afastamento: Afastamento;
  nomeColaborador: string;
  matricula: string;
  colaboradorId: string;
  dataFormatadaInicio: string;
  dataFormatadaFim: string | null;
  emCurso: boolean;
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

export function FichaAfastamentoModal({
  ficha,
  onFechar,
}: {
  ficha: DadosFicha | null;
  onFechar: () => void;
}) {
  if (!ficha) return null;

  const { afastamento, nomeColaborador, matricula, colaboradorId, dataFormatadaInicio, dataFormatadaFim, emCurso } = ficha;

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={`${TIPOS_AFASTAMENTO[afastamento.tipo]} — ${nomeColaborador}`}
    >
      {emCurso && (
        <span className="mb-4 inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
          Em curso
        </span>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Campo rotulo="Associado" valor={`${nomeColaborador} — ${matricula}`} />
        <Campo rotulo="Tipo" valor={TIPOS_AFASTAMENTO[afastamento.tipo]} />
        <Campo rotulo="Categoria" valor={CATEGORIAS_AFASTAMENTO[afastamento.categoria]} />
        <Campo rotulo="Início" valor={dataFormatadaInicio} />
        <Campo rotulo="Retorno previsto" valor={dataFormatadaFim ?? "Indeterminado"} />
        <Campo rotulo="CID" valor={afastamento.cid} />
        <Campo rotulo="Médico" valor={afastamento.medico} />
      </dl>
      <p className="mt-6 border-t border-line pt-4 text-xs text-ink-muted">
        O histórico completo da pessoa fica na{" "}
        <Link
          href={`/pessoas/${colaboradorId}`}
          className="font-medium text-ink-soft underline-offset-2 hover:underline"
        >
          ficha individual
        </Link>
        .
      </p>
    </Modal>
  );
}
