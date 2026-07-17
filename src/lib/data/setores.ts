import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { cargosDemo, colaboradoresDemo, setoresDemo, vagasDemo } from "./demo";
import type { Cargo, Setor } from "./tipos";

/** Repositorio de setores e cargos (dominio da estrutura da operacao). */

export async function listarSetores(): Promise<Setor[]> {
  if (!isSupabaseConfigured()) {
    return [...setoresDemo].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("setores").select("*").order("nome");
  if (error) {
    throw new Error(`Falha ao listar setores: ${error.message}`);
  }
  return data as Setor[];
}

export async function buscarSetor(id: string): Promise<Setor | null> {
  if (!isSupabaseConfigured()) {
    return setoresDemo.find((s) => s.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("setores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar setor: ${error.message}`);
  }
  return data as Setor | null;
}

export async function criarSetor(nome: string, headcountPlanejado: number): Promise<void> {
  if (!isSupabaseConfigured()) {
    setoresDemo.push({
      id: `s-${crypto.randomUUID()}`,
      nome,
      headcount_planejado: headcountPlanejado,
    });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("setores")
    .insert({ nome, headcount_planejado: headcountPlanejado });
  if (error) {
    throw new Error(`Falha ao criar setor: ${error.message}`);
  }
}

/**
 * Atualiza nome e headcount planejado. O vinculo dos colaboradores e por id,
 * entao a renomeacao alcanca todo mundo; no modo demonstracao os nomes
 * desnormalizados (colaborador.setor, vaga.setor) sao reescritos aqui.
 */
export async function atualizarSetor(
  id: string,
  dados: { nome: string; headcount_planejado: number },
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const setor = setoresDemo.find((s) => s.id === id);
    if (!setor) {
      throw new Error("Setor não encontrado.");
    }
    setor.nome = dados.nome;
    setor.headcount_planejado = dados.headcount_planejado;

    for (const colaborador of colaboradoresDemo) {
      if (colaborador.setor_id === id) {
        colaborador.setor = { nome: dados.nome };
      }
    }
    for (const vaga of vagasDemo) {
      if (vaga.setor_id === id) {
        vaga.setor = { nome: dados.nome };
      }
    }
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("setores").update(dados).eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar setor: ${error.message}`);
  }
}

/**
 * Exclui o setor; quem estava lotado nele fica sem setor definido. As vagas
 * abertas precisam ser resolvidas antes — a checagem fica na server action.
 */
export async function excluirSetor(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const indice = setoresDemo.findIndex((s) => s.id === id);
    if (indice === -1) {
      throw new Error("Setor não encontrado.");
    }

    for (const colaborador of colaboradoresDemo) {
      if (colaborador.setor_id === id) {
        colaborador.setor_id = null;
        colaborador.setor = null;
      }
    }
    setoresDemo.splice(indice, 1);
    return;
  }

  const supabase = await createClient();
  const { error: erroColaboradores } = await supabase
    .from("colaboradores")
    .update({ setor_id: null })
    .eq("setor_id", id);
  if (erroColaboradores) {
    throw new Error(`Falha ao desvincular colaboradores: ${erroColaboradores.message}`);
  }

  const { error } = await supabase.from("setores").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao excluir setor: ${error.message}`);
  }
}

export async function listarCargos(): Promise<Cargo[]> {
  if (!isSupabaseConfigured()) {
    return cargosDemo;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("cargos").select("*").order("nome");
  if (error) {
    throw new Error(`Falha ao listar cargos: ${error.message}`);
  }
  return data as Cargo[];
}
