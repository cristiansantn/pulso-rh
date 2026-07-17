import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { avaliacoesDemo, indicadoresDemo } from "./demo";
import type { Avaliacao, IndicadorMensal } from "./tipos";

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
