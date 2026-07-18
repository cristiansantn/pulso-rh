import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { cargosDemo, planosSucessaoDemo } from "./demo";
import type { NovoPlanoSucessao, PlanoSucessao } from "./tipos";

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

/**
 * Cria ou atualiza o plano de sucessao de uma pessoa. Upsert por colaborador:
 * um plano por pessoa, entao editar substitui o anterior. No modo demo o nome
 * do cargo-alvo e resolvido aqui; no Supabase vem pelo relacionamento na leitura.
 */
export async function salvarPlanoSucessao(dados: NovoPlanoSucessao): Promise<void> {
  if (!isSupabaseConfigured()) {
    const cargo = cargosDemo.find((c) => c.id === dados.cargo_alvo_id);
    const indice = planosSucessaoDemo.findIndex(
      (p) => p.colaborador_id === dados.colaborador_id,
    );
    const registro: PlanoSucessao = {
      ...dados,
      id: indice >= 0 ? planosSucessaoDemo[indice].id : `ps-${crypto.randomUUID()}`,
      cargo_alvo: cargo ? { nome: cargo.nome } : null,
    };
    if (indice >= 0) planosSucessaoDemo.splice(indice, 1, registro);
    else planosSucessaoDemo.push(registro);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("planos_sucessao")
    .upsert(dados, { onConflict: "colaborador_id" });
  if (error) {
    throw new Error(`Falha ao salvar plano de sucessão: ${error.message}`);
  }
}
