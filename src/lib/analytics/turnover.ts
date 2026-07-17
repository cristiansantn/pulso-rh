import type { Colaborador } from "@/lib/data/tipos";
import { formatarIsoLocal } from "@/lib/datas";

/**
 * Indicadores de turnover. O denominador disponivel e o quadro atual, entao a
 * taxa aqui e um INDICE DE SAIDA do periodo (desligamentos / quadro atual),
 * uma aproximacao rotulada como tal — nao e turnover anualizado por headcount
 * medio, que exige historico mensal de quadro ainda inexistente.
 */

const DIA_MS = 86_400_000;

export function desligadosDesde(
  colaboradores: Colaborador[],
  desdeIso: string,
): Colaborador[] {
  return colaboradores.filter(
    (c) =>
      c.status === "desligado" &&
      c.data_desligamento !== null &&
      c.data_desligamento >= desdeIso,
  );
}

/** Dias entre admissao e desligamento; nulo quando falta uma das datas. */
export function tempoDeCasaDias(colaborador: Colaborador): number | null {
  if (!colaborador.data_admissao || !colaborador.data_desligamento) return null;
  return Math.round(
    (new Date(`${colaborador.data_desligamento}T00:00:00`).getTime() -
      new Date(`${colaborador.data_admissao}T00:00:00`).getTime()) /
      DIA_MS,
  );
}

/** Indice de saida do periodo: desligamentos sobre o quadro atual, em %. */
export function indiceDeSaida(
  desligamentos: number,
  quadroAtual: number,
): number | null {
  if (quadroAtual === 0) return null;
  return (desligamentos / quadroAtual) * 100;
}

/** Percentual de desligados no periodo com ate `limiteDias` de casa. */
export function turnoverPrecoce(
  desligados: Colaborador[],
  limiteDias: number,
): number | null {
  const comTenure = desligados
    .map(tempoDeCasaDias)
    .filter((dias): dias is number => dias !== null);
  if (comTenure.length === 0) return null;
  const precoces = comTenure.filter((dias) => dias <= limiteDias).length;
  return (precoces / comTenure.length) * 100;
}

export const FAIXAS_TEMPO_DE_CASA = [
  "Menos de 3 meses",
  "3 a 6 meses",
  "6 a 12 meses",
  "1 a 2 anos",
  "Mais de 2 anos",
] as const;

export function faixaTempoDeCasa(dias: number): string {
  if (dias < 90) return FAIXAS_TEMPO_DE_CASA[0];
  if (dias < 180) return FAIXAS_TEMPO_DE_CASA[1];
  if (dias < 365) return FAIXAS_TEMPO_DE_CASA[2];
  if (dias < 730) return FAIXAS_TEMPO_DE_CASA[3];
  return FAIXAS_TEMPO_DE_CASA[4];
}

export const FAIXAS_ETARIAS = ["18 a 24", "25 a 34", "35 a 44", "45 ou mais"] as const;

export function faixaEtaria(
  nascimentoIso: string,
  referenciaIso: string,
): string {
  const idade = Math.floor(
    (new Date(`${referenciaIso}T00:00:00`).getTime() -
      new Date(`${nascimentoIso}T00:00:00`).getTime()) /
      (DIA_MS * 365.25),
  );
  if (idade < 25) return FAIXAS_ETARIAS[0];
  if (idade < 35) return FAIXAS_ETARIAS[1];
  if (idade < 45) return FAIXAS_ETARIAS[2];
  return FAIXAS_ETARIAS[3];
}

export interface MesSerie {
  /** Chave YYYY-MM. */
  chave: string;
  rotulo: string;
  voluntarios: number;
  involuntarios: number;
}

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Serie mensal de desligamentos dos ultimos `meses` meses, incluindo o atual. */
export function seriePorMes(desligados: Colaborador[], meses: number): MesSerie[] {
  const hoje = new Date();
  const serie: MesSerie[] = [];

  for (let i = meses - 1; i >= 0; i -= 1) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = formatarIsoLocal(data).slice(0, 7);
    serie.push({
      chave,
      rotulo: `${MESES_CURTOS[data.getMonth()]}${data.getMonth() === 0 ? `/${String(data.getFullYear()).slice(2)}` : ""}`,
      voluntarios: 0,
      involuntarios: 0,
    });
  }

  const porChave = new Map(serie.map((m) => [m.chave, m]));
  for (const pessoa of desligados) {
    const mes = porChave.get((pessoa.data_desligamento ?? "").slice(0, 7));
    if (!mes) continue;
    if (pessoa.tipo_desligamento === "involuntario") {
      mes.involuntarios += 1;
    } else {
      mes.voluntarios += 1;
    }
  }

  return serie;
}
