import type { EtapaVaga, Vaga, VagaEvento } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

/**
 * Indicadores de recrutamento. Todos derivam das datas registradas em
 * vaga_eventos; nenhum numero e estimado.
 */

const DIA_MS = 86_400_000;

export function diasEntre(inicio: string, fim: string): number {
  return Math.round(
    (new Date(`${fim}T00:00:00`).getTime() - new Date(`${inicio}T00:00:00`).getTime()) /
      DIA_MS,
  );
}

/** Dias desde a abertura ate o fechamento ou, se aberta, ate hoje. */
export function idadeVaga(vaga: Vaga): number {
  return diasEntre(vaga.data_abertura, vaga.data_fechamento ?? hojeIso());
}

/** Vaga aberta cuja meta de preenchimento ja passou. */
export function vagaEmAtraso(vaga: Vaga): boolean {
  return (
    vaga.status === "aberta" && vaga.data_limite !== null && vaga.data_limite < hojeIso()
  );
}

/** Time to fill medio (abertura -> admissao) das vagas concluidas, em dias. */
export function timeToFillMedio(vagas: Vaga[]): number | null {
  const concluidas = vagas.filter(
    (v) => v.status === "concluida" && v.data_fechamento !== null,
  );
  if (concluidas.length === 0) return null;

  const total = concluidas.reduce(
    (soma, v) => soma + diasEntre(v.data_abertura, v.data_fechamento as string),
    0,
  );
  return Math.round(total / concluidas.length);
}

export interface PermanenciaEtapa {
  etapa: EtapaVaga;
  data: string;
  /** Dias ate a etapa seguinte; para a etapa atual, dias corridos ate hoje. */
  dias: number;
}

/** Quanto tempo a vaga passou em cada etapa registrada, na ordem do fluxo. */
export function permanenciaPorEtapa(
  vaga: Vaga,
  eventos: VagaEvento[],
): PermanenciaEtapa[] {
  const ordenados = [...eventos].sort((a, b) => a.data.localeCompare(b.data));
  const fimDaLinha = vaga.data_fechamento ?? hojeIso();

  return ordenados.map((evento, indice) => ({
    etapa: evento.etapa,
    data: evento.data,
    dias: diasEntre(evento.data, ordenados[indice + 1]?.data ?? fimDaLinha),
  }));
}
