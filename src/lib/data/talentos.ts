import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { planosSucessaoDemo } from "./demo";
import type { PlanoSucessao } from "./tipos";

/**
 * Repositorio de planos de sucessao. Somente leitura nesta fase: os planos
 * chegam por carga externa. Um plano por pessoa; a juncao com o cargo-alvo e
 * resolvida na leitura (o Supabase traz o nome do cargo pelo relacionamento).
 */

interface FiltroPlanos {
  colaboradorId?: string;
}

export async function listarPlanosSucessao(
  filtro?: FiltroPlanos,
): Promise<PlanoSucessao[]> {
  if (!isSupabaseConfigured()) {
    return planosSucessaoDemo.filter(
      (p) => !filtro?.colaboradorId || p.colaborador_id === filtro.colaboradorId,
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("planos_sucessao")
    .select("*, cargo_alvo:cargos!cargo_alvo_id (nome)");

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar planos de sucessão: ${error.message}`);
  }
  return data as unknown as PlanoSucessao[];
}
