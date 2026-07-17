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

const SELECT_COLABORADOR =
  "*, setor:setores(nome), cargo:cargos(nome), gestor:colaboradores!colaboradores_gestor_id_fkey(nome)";

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
  return data as Colaborador[];
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
  return data as Colaborador | null;
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

