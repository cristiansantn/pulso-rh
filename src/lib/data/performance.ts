import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { avaliacoesDemo, indicadoresDemo } from "./demo";
import type {
  Avaliacao,
  IndicadorMensal,
  NovaAvaliacao,
  NovoIndicadorMensal,
} from "./tipos";

/**
 * Repositorio de performance (indicadores mensais e avaliacoes). Somente
 * leitura nesta fase: os dados chegam por carga externa. As consultas
 * retornam registros planos; o vinculo com colaborador, setor e gestor e
 * resolvido em memoria pelas paginas, que ja carregam o quadro completo.
 */

interface FiltroIndicadores {
  colaboradorId?: string;
  /** Competencia YYYY-MM minima (inclusive). */
  desdeCompetencia?: string;
}

export async function listarIndicadoresMensais(
  filtro?: FiltroIndicadores,
): Promise<IndicadorMensal[]> {
  if (!isSupabaseConfigured()) {
    return indicadoresDemo
      .filter(
        (i) =>
          (!filtro?.colaboradorId || i.colaborador_id === filtro.colaboradorId) &&
          (!filtro?.desdeCompetencia || i.competencia >= filtro.desdeCompetencia),
      )
      .sort((a, b) => b.competencia.localeCompare(a.competencia));
  }

  const supabase = await createClient();
  let query = supabase
    .from("indicadores_mensais")
    .select("*")
    .order("competencia", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }
  if (filtro?.desdeCompetencia) {
    query = query.gte("competencia", filtro.desdeCompetencia);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar indicadores: ${error.message}`);
  }
  return data as IndicadorMensal[];
}

interface FiltroAvaliacoes {
  colaboradorId?: string;
  ciclo?: string;
}

export async function listarAvaliacoes(
  filtro?: FiltroAvaliacoes,
): Promise<Avaliacao[]> {
  if (!isSupabaseConfigured()) {
    return avaliacoesDemo
      .filter(
        (a) =>
          (!filtro?.colaboradorId || a.colaborador_id === filtro.colaboradorId) &&
          (!filtro?.ciclo || a.ciclo === filtro.ciclo),
      )
      .sort((a, b) => b.ciclo.localeCompare(a.ciclo));
  }

  const supabase = await createClient();
  let query = supabase
    .from("avaliacoes")
    .select("*")
    .order("ciclo", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }
  if (filtro?.ciclo) {
    query = query.eq("ciclo", filtro.ciclo);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar avaliações: ${error.message}`);
  }
  return data as Avaliacao[];
}

/**
 * Lanca um indicador mensal. E um upsert: relancar a mesma competencia e tipo
 * para a pessoa substitui o valor anterior (a correcao de um lancamento e
 * comum). O par unico espelha a constraint do banco.
 */
export async function registrarIndicadorMensal(
  dados: NovoIndicadorMensal,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const indice = indicadoresDemo.findIndex(
      (i) =>
        i.colaborador_id === dados.colaborador_id &&
        i.competencia === dados.competencia &&
        i.tipo === dados.tipo,
    );
    if (indice >= 0) indicadoresDemo.splice(indice, 1);
    indicadoresDemo.push({ ...dados, id: `im-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("indicadores_mensais")
    .upsert(dados, { onConflict: "colaborador_id,competencia,tipo" });
  if (error) {
    throw new Error(`Falha ao registrar indicador: ${error.message}`);
  }
}

/**
 * Lanca a avaliacao de um ciclo. Upsert por (colaborador, ciclo): reavaliar o
 * mesmo ciclo atualiza a posicao na matriz em vez de duplicar.
 */
export async function registrarAvaliacao(dados: NovaAvaliacao): Promise<void> {
  if (!isSupabaseConfigured()) {
    const indice = avaliacoesDemo.findIndex(
      (a) =>
        a.colaborador_id === dados.colaborador_id && a.ciclo === dados.ciclo,
    );
    if (indice >= 0) avaliacoesDemo.splice(indice, 1);
    avaliacoesDemo.push({ ...dados, id: `av-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("avaliacoes")
    .upsert(dados, { onConflict: "colaborador_id,ciclo" });
  if (error) {
    throw new Error(`Falha ao registrar avaliação: ${error.message}`);
  }
}
