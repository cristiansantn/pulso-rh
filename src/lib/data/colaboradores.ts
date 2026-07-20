import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { cargosDemo, colaboradoresDemo, setoresDemo } from "./demo";
import type {
  Colaborador,
  ColaboradorEditavel,
  NovoColaborador,
  StatusColaborador,
  Turno,
} from "./tipos";

/**
 * Repositorio de colaboradores. Toda leitura e escrita passa por aqui, de modo
 * que as paginas nao sabem se a fonte e o Supabase ou o modo demonstracao.
 */

// O gestor NAO e embutido aqui de proposito. gestor_id e um auto-relacionamento
// (colaboradores -> colaboradores) e o PostgREST nem sempre resolve o embedding
// de uma FK auto-referencial, retornando "Could not find a relationship". O nome
// do gestor e resolvido em uma consulta separada por anexarGestores().
const SELECT_COLABORADOR = "*, setor:setores(nome), cargo:cargos(nome)";

type LinhaComGestorId = { gestor_id: string | null };

/**
 * Resolve o nome do gestor de cada linha com uma consulta a parte, evitando o
 * embedding do auto-relacionamento. Mantem o formato { gestor: { nome } | null }
 * esperado pelo tipo Colaborador.
 */
async function anexarGestores<T extends LinhaComGestorId>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  linhas: T[],
): Promise<(T & { gestor: { nome: string } | null })[]> {
  const ids = [
    ...new Set(
      linhas
        .map((l) => l.gestor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const nomePorId = new Map<string, string>();
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("id, nome")
      .in("id", ids);
    if (error) {
      throw new Error(`Falha ao resolver gestores: ${error.message}`);
    }
    for (const g of (data as { id: string; nome: string }[] | null) ?? []) {
      nomePorId.set(g.id, g.nome);
    }
  }

  return linhas.map((l) => ({
    ...l,
    gestor:
      l.gestor_id && nomePorId.has(l.gestor_id)
        ? { nome: nomePorId.get(l.gestor_id)! }
        : null,
  }));
}

/** Resolve as referencias de setor, cargo e gestor no modo demonstracao. */
function relacoesDemo(dados: ColaboradorEditavel) {
  const setor = setoresDemo.find((s) => s.id === dados.setor_id) ?? null;
  const cargo = cargosDemo.find((c) => c.id === dados.cargo_id) ?? null;
  const gestor = colaboradoresDemo.find((c) => c.id === dados.gestor_id) ?? null;

  return {
    setor: setor ? { nome: setor.nome } : null,
    cargo: cargo ? { nome: cargo.nome } : null,
    gestor: gestor ? { nome: gestor.nome } : null,
  };
}

export interface FiltroColaboradores {
  busca?: string;
  setorId?: string;
  cargoId?: string;
  turno?: Turno;
  status?: StatusColaborador;
}

export async function listarColaboradores(
  filtro?: FiltroColaboradores,
): Promise<Colaborador[]> {
  if (!isSupabaseConfigured()) {
    const termo = filtro?.busca?.trim().toLowerCase();
    const lista = colaboradoresDemo.filter(
      (c) =>
        (!termo ||
          c.nome.toLowerCase().includes(termo) ||
          c.matricula.includes(termo)) &&
        (!filtro?.setorId || c.setor_id === filtro.setorId) &&
        (!filtro?.cargoId || c.cargo_id === filtro.cargoId) &&
        (!filtro?.turno || c.turno === filtro.turno) &&
        (!filtro?.status || c.status === filtro.status),
    );
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const supabase = await createClient();
  let query = supabase
    .from("colaboradores")
    .select(SELECT_COLABORADOR)
    .order("nome");

  const termo = filtro?.busca?.trim();
  if (termo) {
    query = query.or(`nome.ilike.%${termo}%,matricula.ilike.%${termo}%`);
  }
  if (filtro?.setorId) {
    query = query.eq("setor_id", filtro.setorId);
  }
  if (filtro?.cargoId) {
    query = query.eq("cargo_id", filtro.cargoId);
  }
  if (filtro?.turno) {
    query = query.eq("turno", filtro.turno);
  }
  if (filtro?.status) {
    query = query.eq("status", filtro.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar colaboradores: ${error.message}`);
  }
  const comGestor = await anexarGestores(
    supabase,
    (data ?? []) as (Colaborador & LinhaComGestorId)[],
  );
  return comGestor as Colaborador[];
}

export async function buscarColaborador(id: string): Promise<Colaborador | null> {
  if (!isSupabaseConfigured()) {
    return colaboradoresDemo.find((c) => c.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colaboradores")
    .select(SELECT_COLABORADOR)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar colaborador: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  const [comGestor] = await anexarGestores(supabase, [
    data as Colaborador & LinhaComGestorId,
  ]);
  return comGestor as Colaborador;
}

/** Cadastra e devolve o id criado (a admissao de vaga precisa do vinculo). */
export async function criarColaborador(dados: NovoColaborador): Promise<string> {
  if (!isSupabaseConfigured()) {
    const id = `p-${crypto.randomUUID()}`;
    colaboradoresDemo.push({
      ...dados,
      id,
      ...relacoesDemo(dados),
    });
    return id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colaboradores")
    .insert(dados)
    .select("id")
    .single();
  if (error) {
    throw new Error(`Falha ao cadastrar colaborador: ${error.message}`);
  }
  return (data as { id: string }).id;
}

export async function atualizarColaborador(
  id: string,
  dados: ColaboradorEditavel,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const indice = colaboradoresDemo.findIndex((c) => c.id === id);
    if (indice === -1) {
      throw new Error("Colaborador não encontrado.");
    }
    const relacoes = relacoesDemo(dados);
    colaboradoresDemo[indice] = {
      ...colaboradoresDemo[indice],
      ...dados,
      ...(dados.setor_id !== undefined && { setor: relacoes.setor }),
      ...(dados.cargo_id !== undefined && { cargo: relacoes.cargo }),
      ...(dados.gestor_id !== undefined && { gestor: relacoes.gestor }),
    };
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("colaboradores")
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar colaborador: ${error.message}`);
  }
}
