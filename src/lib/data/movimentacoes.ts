import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { movimentacoesDemo } from "./demo";
import type { Movimentacao, NovaMovimentacao } from "./tipos";

/**
 * Repositorio do historico de carreira. As consultas retornam da movimentacao
 * mais recente para a mais antiga; a ficha monta a linha do tempo a partir daí,
 * ancorando o fim da linha na admissao da pessoa.
 */

interface FiltroMovimentacoes {
  colaboradorId?: string;
}

export async function listarMovimentacoes(
  filtro?: FiltroMovimentacoes,
): Promise<Movimentacao[]> {
  if (!isSupabaseConfigured()) {
    return movimentacoesDemo
      .filter(
        (m) => !filtro?.colaboradorId || m.colaborador_id === filtro.colaboradorId,
      )
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  const supabase = await createClient();
  let query = supabase
    .from("movimentacoes")
    .select("*")
    .order("data", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar movimentações: ${error.message}`);
  }
  return data as Movimentacao[];
}

/** Registra uma movimentacao no historico (evento datado, sem sobrescrita). */
export async function registrarMovimentacao(
  dados: NovaMovimentacao,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    movimentacoesDemo.push({ ...dados, id: `mov-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("movimentacoes").insert(dados);
  if (error) {
    throw new Error(`Falha ao registrar movimentação: ${error.message}`);
  }
}
