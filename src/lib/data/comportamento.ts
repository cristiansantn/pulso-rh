import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { perfisDemo } from "./demo";
import type { NovoPerfilComportamental, PerfilComportamental } from "./tipos";

/**
 * Repositorio de perfis comportamentais. Somente leitura nesta fase: os
 * registros chegam por carga externa. Reavaliacoes geram novos registros; as
 * consultas retornam do mais recente para o mais antigo e as leituras usam o
 * primeiro de cada pessoa.
 */

interface FiltroPerfis {
  colaboradorId?: string;
}

export async function listarPerfis(
  filtro?: FiltroPerfis,
): Promise<PerfilComportamental[]> {
  if (!isSupabaseConfigured()) {
    return perfisDemo
      .filter(
        (p) => !filtro?.colaboradorId || p.colaborador_id === filtro.colaboradorId,
      )
      .sort((a, b) => b.data_avaliacao.localeCompare(a.data_avaliacao));
  }

  const supabase = await createClient();
  let query = supabase
    .from("perfis_comportamentais")
    .select("*")
    .order("data_avaliacao", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar perfis: ${error.message}`);
  }
  return data as PerfilComportamental[];
}

/**
 * Registra um perfil comportamental. Cada registro e uma avaliacao datada:
 * reavaliar gera um novo registro e as leituras usam o mais recente, sem
 * sobrescrever o historico.
 */
export async function registrarPerfil(
  dados: NovoPerfilComportamental,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    perfisDemo.push({ ...dados, id: `pc-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("perfis_comportamentais").insert(dados);
  if (error) {
    throw new Error(`Falha ao registrar perfil: ${error.message}`);
  }
}
