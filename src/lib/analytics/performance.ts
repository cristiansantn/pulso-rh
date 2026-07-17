import type {
  Avaliacao,
  IndicadorMensal,
  TipoIndicador,
} from "@/lib/data/tipos";
import { INDICADORES } from "@/lib/data/tipos";

/**
 * Indicadores de performance. Nao existe nota unica de produtividade: cada
 * indicador so e comparavel com ele mesmo, e a matriz 9-box reflete a
 * avaliacao do gestor no ciclo, nao os indicadores operacionais.
 */

/** Ciclo mais recente presente nas avaliacoes (ordem lexicografica YYYY-SN). */
export function cicloMaisRecente(avaliacoes: Avaliacao[]): string | null {
  let maior: string | null = null;
  for (const avaliacao of avaliacoes) {
    if (maior === null || avaliacao.ciclo > maior) maior = avaliacao.ciclo;
  }
  return maior;
}

/** Competencias unicas presentes nos lancamentos, da mais recente para a mais antiga. */
export function competenciasDisponiveis(registros: IndicadorMensal[]): string[] {
  return [...new Set(registros.map((r) => r.competencia))].sort((a, b) =>
    b.localeCompare(a),
  );
}

export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

/** Media de cada indicador presente nos registros. */
export function mediaPorTipo(
  registros: IndicadorMensal[],
): Map<TipoIndicador, number> {
  const valores = new Map<TipoIndicador, number[]>();
  for (const registro of registros) {
    const lista = valores.get(registro.tipo) ?? [];
    lista.push(registro.valor);
    valores.set(registro.tipo, lista);
  }
  const medias = new Map<TipoIndicador, number>();
  for (const [tipo, lista] of valores) {
    medias.set(tipo, media(lista) as number);
  }
  return medias;
}

export interface PontoSerie {
  competencia: string;
  media: number | null;
  pessoas: number;
}

/** Media do indicador em cada competencia informada, na ordem recebida. */
export function serieMensal(
  registros: IndicadorMensal[],
  tipo: TipoIndicador,
  competencias: string[],
): PontoSerie[] {
  return competencias.map((competencia) => {
    const valores = registros
      .filter((r) => r.tipo === tipo && r.competencia === competencia)
      .map((r) => r.valor);
    return { competencia, media: media(valores), pessoas: valores.length };
  });
}

/** Rotulos classicos da matriz, indexados por `p{performance}-t{potencial}`. */
export const QUADRANTES_9BOX: Record<string, string> = {
  "p1-t3": "Enigma",
  "p2-t3": "Crescimento",
  "p3-t3": "Estrela",
  "p1-t2": "Questionável",
  "p2-t2": "Mantenedor",
  "p3-t2": "Alta performance",
  "p1-t1": "Insuficiente",
  "p2-t1": "Eficaz",
  "p3-t1": "Especialista",
};

export function quadrante(avaliacao: Avaliacao): { chave: string; rotulo: string } {
  const chave = `p${avaliacao.performance}-t${avaliacao.potencial}`;
  return { chave, rotulo: QUADRANTES_9BOX[chave] };
}

/** Formata o valor na unidade do proprio indicador (nunca em nota composta). */
export function formatarValorIndicador(
  tipo: TipoIndicador,
  valor: number | null,
): string {
  if (valor === null) return "—";
  const definicao = INDICADORES[tipo];
  const numero = valor.toFixed(definicao.casas).replace(".", ",");
  if (definicao.formato === "moeda") return `R$ ${numero}`;
  if (definicao.formato === "percentual") return `${numero}%`;
  return definicao.unidade ? `${numero} ${definicao.unidade}` : numero;
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

/** "2026-06" -> "jun/2026". */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const indice = Number(mes) - 1;
  if (!MESES_CURTOS[indice]) return competencia;
  return `${MESES_CURTOS[indice]}/${ano}`;
}
