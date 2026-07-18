import type { FatorDisc, PerfilComportamental } from "@/lib/data/tipos";
import { FATORES_DISC } from "@/lib/data/tipos";

/**
 * Leituras do perfil comportamental. Perfil descreve estilo de trabalho,
 * nunca desempenho: nada aqui produz nota, ranking ou recomendacao
 * individual — apenas contagens e composicao de grupos.
 */

/** Registro mais recente de cada pessoa (a lista chega ordenada por data desc). */
export function perfilAtualPorPessoa(
  perfis: PerfilComportamental[],
): Map<string, PerfilComportamental> {
  const atual = new Map<string, PerfilComportamental>();
  for (const perfil of perfis) {
    if (!atual.has(perfil.colaborador_id)) {
      atual.set(perfil.colaborador_id, perfil);
    }
  }
  return atual;
}

/** "D/I" — fator primario e, quando houver, o secundario. */
export function formatarPerfil(perfil: PerfilComportamental): string {
  return perfil.fator_secundario
    ? `${perfil.fator_primario}/${perfil.fator_secundario}`
    : perfil.fator_primario;
}

export interface DistribuicaoDisc {
  fator: FatorDisc;
  pessoas: number;
  percentual: number;
}

/** Distribuicao dos fatores primarios, na ordem canonica D-I-S-C. */
export function distribuicaoDisc(
  perfis: PerfilComportamental[],
): DistribuicaoDisc[] {
  const contagem = new Map<FatorDisc, number>();
  for (const perfil of perfis) {
    contagem.set(
      perfil.fator_primario,
      (contagem.get(perfil.fator_primario) ?? 0) + 1,
    );
  }
  return FATORES_DISC.map((fator) => {
    const pessoas = contagem.get(fator) ?? 0;
    return {
      fator,
      pessoas,
      percentual: perfis.length > 0 ? (pessoas / perfis.length) * 100 : 0,
    };
  });
}

/** Fator primario mais frequente; empate resolve pela ordem D-I-S-C. */
export function fatorPredominante(
  perfis: PerfilComportamental[],
): FatorDisc | null {
  if (perfis.length === 0) return null;
  let vencedor: DistribuicaoDisc | null = null;
  for (const item of distribuicaoDisc(perfis)) {
    if (vencedor === null || item.pessoas > vencedor.pessoas) {
      vencedor = item;
    }
  }
  return vencedor && vencedor.pessoas > 0 ? vencedor.fator : null;
}
