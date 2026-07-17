import { formatarIsoLocal } from "@/lib/datas";
import {
  TIPOS_DIA_PERDIDO,
  type Afastamento,
  type Ocorrencia,
} from "@/lib/data/tipos";

/**
 * Calculo de absenteismo. Dia perdido = falta (justificada ou nao), atestado
 * ou afastamento. Folgas e ferias sao ausencias planejadas e ficam de fora.
 *
 * A taxa usa dias corridos x quadro atual como denominador — uma APROXIMACAO
 * honesta ate a escala planejada x realizada entrar (segundo incremento da
 * Fase 3). As paginas devem rotular a metrica deixando isso claro.
 */

export interface Periodo {
  inicio: string;
  fim: string;
}

export interface DiaPerdido {
  colaborador_id: string;
  data: string;
}

const DIA_MS = 86_400_000;

function paraData(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function diasDoPeriodo(periodo: Periodo): number {
  return (
    Math.round((paraData(periodo.fim).getTime() - paraData(periodo.inicio).getTime()) / DIA_MS) + 1
  );
}

/**
 * Expande faltas, atestados e afastamentos em dias perdidos individuais
 * dentro do periodo, preservando o colaborador para os cortes analiticos.
 */
export function listarDiasPerdidos(
  ocorrencias: Ocorrencia[],
  afastamentos: Afastamento[],
  periodo: Periodo,
): DiaPerdido[] {
  const registros = [
    ...ocorrencias
      .filter((o) => TIPOS_DIA_PERDIDO.includes(o.tipo))
      .map((o) => ({
        colaborador_id: o.colaborador_id,
        inicio: o.data_inicio,
        // Em ocorrencias, data_fim nula significa um unico dia.
        fim: o.data_fim ?? o.data_inicio,
      })),
    ...afastamentos.map((a) => ({
      colaborador_id: a.colaborador_id,
      inicio: a.data_inicio,
      // Em afastamentos, data_fim nula significa retorno indeterminado.
      fim: a.data_fim ?? periodo.fim,
    })),
  ];

  const dias: DiaPerdido[] = [];
  for (const registro of registros) {
    const de = registro.inicio > periodo.inicio ? registro.inicio : periodo.inicio;
    const ate = registro.fim < periodo.fim ? registro.fim : periodo.fim;

    for (let dia = paraData(de); formatarIsoLocal(dia) <= ate; dia.setDate(dia.getDate() + 1)) {
      dias.push({ colaborador_id: registro.colaborador_id, data: formatarIsoLocal(dia) });
    }
  }
  return dias;
}

/** Taxa de absenteismo em %; nula quando nao ha quadro para programar. */
export function taxaAbsenteismo(
  diasPerdidos: number,
  quadro: number,
  periodo: Periodo,
): number | null {
  const programados = quadro * diasDoPeriodo(periodo);
  if (programados === 0) return null;
  return (diasPerdidos / programados) * 100;
}

export function formatarTaxa(taxa: number | null): string {
  if (taxa === null) return "—";
  return `${taxa.toFixed(1).replace(".", ",")}%`;
}
