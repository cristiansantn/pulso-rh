import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  cargosDemo,
  colaboradoresDemo,
  setoresDemo,
  vagaEventosDemo,
  vagasDemo,
} from "./demo";
import {
  FLUXO_VAGA,
  type EtapaVaga,
  type NovaVaga,
  type Vaga,
  type VagaEvento,
} from "./tipos";

/**
 * Repositorio de vagas (Fase 4). Cada mudanca de etapa gera um evento datado
 * em vaga_eventos; e desse historico que saem time to fill e SLA por etapa.
 */

const SELECT_VAGA =
  "*, setor:setores(nome), cargo:cargos(nome), gestor_solicitante:colaboradores!vagas_gestor_solicitante_id_fkey(nome)";

/** Resolve as referencias de setor, cargo e solicitante no modo demonstracao. */
function relacoesDemo(dados: NovaVaga) {
  const setor = setoresDemo.find((s) => s.id === dados.setor_id) ?? null;
  const cargo = cargosDemo.find((c) => c.id === dados.cargo_id) ?? null;
  const solicitante =
    colaboradoresDemo.find((c) => c.id === dados.gestor_solicitante_id) ?? null;

  return {
    setor: setor ? { nome: setor.nome } : null,
    cargo: cargo ? { nome: cargo.nome } : null,
    gestor_solicitante: solicitante ? { nome: solicitante.nome } : null,
  };
}

export async function listarVagas(): Promise<Vaga[]> {
  if (!isSupabaseConfigured()) {
    return [...vagasDemo].sort((a, b) =>
      b.data_abertura.localeCompare(a.data_abertura),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vagas")
    .select(SELECT_VAGA)
    .order("data_abertura", { ascending: false });
  if (error) {
    throw new Error(`Falha ao listar vagas: ${error.message}`);
  }
  return data as Vaga[];
}

export async function buscarVaga(id: string): Promise<Vaga | null> {
  if (!isSupabaseConfigured()) {
    return vagasDemo.find((v) => v.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vagas")
    .select(SELECT_VAGA)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar vaga: ${error.message}`);
  }
  return data as Vaga | null;
}

export async function listarEventosVaga(vagaId?: string): Promise<VagaEvento[]> {
  if (!isSupabaseConfigured()) {
    return vagaEventosDemo
      .filter((e) => !vagaId || e.vaga_id === vagaId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  const supabase = await createClient();
  let query = supabase.from("vaga_eventos").select("*").order("data");
  if (vagaId) {
    query = query.eq("vaga_id", vagaId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao listar eventos da vaga: ${error.message}`);
  }
  return data as VagaEvento[];
}

async function registrarEvento(vagaId: string, etapa: EtapaVaga, data: string) {
  if (!isSupabaseConfigured()) {
    vagaEventosDemo.push({ id: `ve-${crypto.randomUUID()}`, vaga_id: vagaId, etapa, data });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vaga_eventos")
    .insert({ vaga_id: vagaId, etapa, data });
  if (error) {
    throw new Error(`Falha ao registrar etapa da vaga: ${error.message}`);
  }
}

/** Abre a vaga em solicitacao e devolve o id criado. */
export async function criarVaga(dados: NovaVaga): Promise<string> {
  let id: string;

  if (!isSupabaseConfigured()) {
    id = `v-${crypto.randomUUID()}`;
    vagasDemo.push({
      ...dados,
      id,
      etapa: "solicitacao",
      status: "aberta",
      data_fechamento: null,
      admitido_colaborador_id: null,
      ...relacoesDemo(dados),
    });
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vagas")
      .insert({ ...dados, etapa: "solicitacao", status: "aberta" })
      .select("id")
      .single();
    if (error) {
      throw new Error(`Falha ao abrir vaga: ${error.message}`);
    }
    id = (data as { id: string }).id;
  }

  await registrarEvento(id, "solicitacao", dados.data_abertura);
  return id;
}

async function atualizarVaga(id: string, dados: Partial<Vaga>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const indice = vagasDemo.findIndex((v) => v.id === id);
    if (indice === -1) {
      throw new Error("Vaga não encontrada.");
    }
    vagasDemo[indice] = { ...vagasDemo[indice], ...dados };
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vagas").update(dados).eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar vaga: ${error.message}`);
  }
}

/** Proxima etapa do fluxo; nula quando a vaga ja esta em proposta ou fechada. */
export function proximaEtapa(vaga: Vaga): EtapaVaga | null {
  if (vaga.status !== "aberta") return null;
  const indice = FLUXO_VAGA.indexOf(vaga.etapa);
  const proxima = FLUXO_VAGA[indice + 1];
  // Admissao nao entra aqui: ela encerra a vaga e tem fluxo proprio.
  return proxima && proxima !== "admissao" ? proxima : null;
}

export async function avancarEtapa(id: string, data: string): Promise<void> {
  const vaga = await buscarVaga(id);
  if (!vaga) {
    throw new Error("Vaga não encontrada.");
  }
  const etapa = proximaEtapa(vaga);
  if (!etapa) {
    throw new Error("A vaga não tem próxima etapa.");
  }

  await atualizarVaga(id, { etapa });
  await registrarEvento(id, etapa, data);
}

/** Encerra a vaga com admissao, vinculando o colaborador admitido. */
export async function concluirVaga(
  id: string,
  admitidoId: string,
  data: string,
): Promise<void> {
  const vaga = await buscarVaga(id);
  if (!vaga || vaga.status !== "aberta") {
    throw new Error("A vaga não está aberta.");
  }

  await atualizarVaga(id, {
    etapa: "admissao",
    status: "concluida",
    data_fechamento: data,
    admitido_colaborador_id: admitidoId,
  });
  await registrarEvento(id, "admissao", data);
}

export async function cancelarVaga(id: string, data: string): Promise<void> {
  const vaga = await buscarVaga(id);
  if (!vaga || vaga.status !== "aberta") {
    throw new Error("A vaga não está aberta.");
  }

  await atualizarVaga(id, { status: "cancelada", data_fechamento: data });
}
