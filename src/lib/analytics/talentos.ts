import type { Colaborador, PlanoSucessao, Prontidao } from "@/lib/data/tipos";

/**
 * Leituras de talentos e sucessao. Sucessao e uma leitura de risco de
 * cobertura, nao um ranking de pessoas: o modulo aponta onde ha (e onde falta)
 * banco de sucessores, sem transformar isso em nota individual.
 */

/** Prioridade de exibicao: pronto agora primeiro, depois 6 e 12 meses. */
export const ORDEM_PRONTIDAO: Record<Prontidao, number> = {
  pronto: 0,
  "6_meses": 1,
  "12_meses": 2,
};

/** Plano vigente de cada pessoa (um por pessoa; o mais recente prevalece). */
export function planoPorPessoa(
  planos: PlanoSucessao[],
): Map<string, PlanoSucessao> {
  const atual = new Map<string, PlanoSucessao>();
  for (const plano of planos) {
    const anterior = atual.get(plano.colaborador_id);
    if (!anterior || plano.data_atualizacao > anterior.data_atualizacao) {
      atual.set(plano.colaborador_id, plano);
    }
  }
  return atual;
}

export interface SucessorNoCargo {
  plano: PlanoSucessao;
  colaborador: Colaborador;
}

export interface BancoCargo {
  cargoNome: string;
  sucessores: SucessorNoCargo[];
  /** Ha pelo menos um sucessor pronto agora. */
  temProntos: boolean;
}

/**
 * Banco de sucessores agrupado pelo cargo-alvo. Cada grupo vem ordenado pela
 * prontidao (pronto agora no topo) e os grupos, pela quantidade de candidatos.
 */
export function bancoPorCargo(
  planos: PlanoSucessao[],
  pessoaPorId: Map<string, Colaborador>,
): BancoCargo[] {
  const grupos = new Map<string, SucessorNoCargo[]>();
  for (const plano of planos) {
    const colaborador = pessoaPorId.get(plano.colaborador_id);
    if (!colaborador) continue;
    const nome = plano.cargo_alvo?.nome ?? "Cargo não informado";
    const lista = grupos.get(nome) ?? [];
    lista.push({ plano, colaborador });
    grupos.set(nome, lista);
  }

  return [...grupos.entries()]
    .map(([cargoNome, sucessores]) => {
      sucessores.sort(
        (a, b) =>
          ORDEM_PRONTIDAO[a.plano.prontidao] - ORDEM_PRONTIDAO[b.plano.prontidao] ||
          a.colaborador.nome.localeCompare(b.colaborador.nome),
      );
      return {
        cargoNome,
        sucessores,
        temProntos: sucessores.some((s) => s.plano.prontidao === "pronto"),
      };
    })
    .sort(
      (a, b) =>
        b.sucessores.length - a.sucessores.length ||
        a.cargoNome.localeCompare(b.cargoNome),
    );
}

export interface FaixaProntidao {
  prontidao: Prontidao;
  pessoas: number;
}

/** Distribuicao dos planos pelas faixas de prontidao, na ordem canonica. */
export function distribuicaoProntidao(planos: PlanoSucessao[]): FaixaProntidao[] {
  const contagem = new Map<Prontidao, number>();
  for (const plano of planos) {
    contagem.set(plano.prontidao, (contagem.get(plano.prontidao) ?? 0) + 1);
  }
  return (Object.keys(ORDEM_PRONTIDAO) as Prontidao[]).map((prontidao) => ({
    prontidao,
    pessoas: contagem.get(prontidao) ?? 0,
  }));
}
