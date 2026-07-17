import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { afastamentosDemo, ocorrenciasDemo } from "./demo";
import type {
  Afastamento,
  NovaOcorrencia,
  NovoAfastamento,
  Ocorrencia,
} from "./tipos";

/**
 * Repositorio de frequencia (ocorrencias e afastamentos). As consultas
 * retornam registros planos; o vinculo com colaborador, setor e gestor e
 * resolvido em memoria pelas paginas, que ja carregam o quadro completo.
 */

interface FiltroPeriodo {
  colaboradorId?: string;
  /** Data ISO minima de inicio (inclusive). */
  desde?: string;
}

function filtrarPeriodo<T extends { colaborador_id: string; data_inicio: string }>(
  registros: T[],
  filtro?: FiltroPeriodo,
): T[] {
  return registros
    .filter(
      (r) =>
        (!filtro?.colaboradorId || r.colaborador_id === filtro.colaboradorId) &&
        (!filtro?.desde || r.data_inicio >= filtro.desde),
    )
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));
}

export async function listarOcorrencias(filtro?: FiltroPeriodo): Promise<Ocorrencia[]> {
  if (!isSupabaseConfigured()) {
    return filtrarPeriodo(ocorrenciasDemo, filtro);
  }

  const supabase = await createClient();
  let query = supabase
    .from("ocorrencias")
    .select("*")
    .order("data_inicio", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }
  if (filtro?.desde) {
    query = query.gte("data_inicio", filtro.desde);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar ocorrências: ${error.message}`);
  }
  return data as Ocorrencia[];
}

export async function criarOcorrencia(dados: NovaOcorrencia): Promise<void> {
  if (!isSupabaseConfigured()) {
    ocorrenciasDemo.push({ ...dados, id: `o-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ocorrencias").insert(dados);
  if (error) {
    throw new Error(`Falha ao registrar ocorrência: ${error.message}`);
  }
}

export async function listarAfastamentos(filtro?: FiltroPeriodo): Promise<Afastamento[]> {
  if (!isSupabaseConfigured()) {
    return filtrarPeriodo(afastamentosDemo, filtro);
  }

  const supabase = await createClient();
  let query = supabase
    .from("afastamentos")
    .select("*")
    .order("data_inicio", { ascending: false });

  if (filtro?.colaboradorId) {
    query = query.eq("colaborador_id", filtro.colaboradorId);
  }
  if (filtro?.desde) {
    query = query.gte("data_inicio", filtro.desde);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar afastamentos: ${error.message}`);
  }
  return data as Afastamento[];
}

export async function criarAfastamento(dados: NovoAfastamento): Promise<void> {
  if (!isSupabaseConfigured()) {
    afastamentosDemo.push({ ...dados, id: `a-${crypto.randomUUID()}` });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("afastamentos").insert(dados);
  if (error) {
    throw new Error(`Falha ao registrar afastamento: ${error.message}`);
  }
}
