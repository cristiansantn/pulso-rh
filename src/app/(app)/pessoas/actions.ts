"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarColaborador,
  criarColaborador,
} from "@/lib/data/colaboradores";
import { buscarVaga, concluirVaga } from "@/lib/data/vagas";
import { hojeIso } from "@/lib/datas";
import {
  MOTIVOS_DESLIGAMENTO,
  type ColaboradorEditavel,
  type NovoColaborador,
  type StatusColaborador,
  type TipoDesligamento,
  type Turno,
} from "@/lib/data/tipos";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

/** Extrai do formulario os campos comuns ao cadastro e a edicao. */
function extrairCampos(formData: FormData): ColaboradorEditavel {
  const deslocamento = texto(formData, "tempo_deslocamento_min");

  return {
    nome: texto(formData, "nome") ?? undefined,
    matricula: texto(formData, "matricula") ?? undefined,
    email: texto(formData, "email"),
    telefone: texto(formData, "telefone"),
    data_nascimento: texto(formData, "data_nascimento"),
    cidade: texto(formData, "cidade"),
    bairro: texto(formData, "bairro"),
    cep: texto(formData, "cep"),
    regiao: texto(formData, "regiao"),
    tempo_deslocamento_min: deslocamento ? Number(deslocamento) : null,
    genero: texto(formData, "genero"),
    pcd: formData.get("pcd") === "on",
    escolaridade: texto(formData, "escolaridade"),
    setor_id: texto(formData, "setor_id"),
    cargo_id: texto(formData, "cargo_id"),
    gestor_id: texto(formData, "gestor_id"),
    data_admissao: texto(formData, "data_admissao"),
    tipo_contrato: texto(formData, "tipo_contrato"),
    jornada: texto(formData, "jornada"),
    turno: texto(formData, "turno") as Turno | null,
    status: (texto(formData, "status") ?? "ativo") as StatusColaborador,
  };
}

export async function cadastrarColaborador(formData: FormData) {
  const campos = extrairCampos(formData);
  const vagaId = texto(formData, "vaga_id");

  if (!campos.nome || !campos.matricula) {
    const destino = vagaId ? `/pessoas/nova?vaga=${vagaId}&erro=obrigatorios` : "/pessoas/nova?erro=obrigatorios";
    redirect(destino);
  }

  const id = await criarColaborador({
    ...campos,
    data_desligamento: null,
    tipo_desligamento: null,
    motivo_desligamento: null,
  } as NovoColaborador);

  revalidatePath("/pessoas");
  revalidatePath("/");

  // Cadastro vindo de uma vaga em proposta e a admissao que a conclui.
  if (vagaId) {
    const vaga = await buscarVaga(vagaId);
    if (vaga && vaga.status === "aberta" && vaga.etapa === "proposta") {
      await concluirVaga(vagaId, id, campos.data_admissao ?? hojeIso());
      revalidatePath("/vagas");
      revalidatePath(`/vagas/${vagaId}`);
      revalidatePath("/estrutura");
      redirect(`/vagas/${vagaId}`);
    }
  }

  redirect("/pessoas");
}

export async function editarColaborador(id: string, formData: FormData) {
  const campos = extrairCampos(formData);

  if (!campos.nome || !campos.matricula) {
    redirect(`/pessoas/${id}/editar?erro=obrigatorios`);
  }

  await atualizarColaborador(id, campos);

  revalidatePath("/pessoas");
  revalidatePath(`/pessoas/${id}`);
  revalidatePath("/");
  redirect(`/pessoas/${id}`);
}

/**
 * Desligamento tem fluxo proprio: exige data, tipo e motivo (lista controlada),
 * que alimentam o modulo de Turnover.
 */
export async function desligarColaborador(id: string, formData: FormData) {
  const dataDesligamento = texto(formData, "data_desligamento");
  const tipo = texto(formData, "tipo_desligamento");
  const motivo = texto(formData, "motivo_desligamento");

  if (!dataDesligamento || !tipo || !motivo || !(motivo in MOTIVOS_DESLIGAMENTO)) {
    redirect(`/pessoas/${id}/desligar?erro=obrigatorios`);
  }

  await atualizarColaborador(id, {
    status: "desligado",
    data_desligamento: dataDesligamento,
    tipo_desligamento: tipo as TipoDesligamento,
    motivo_desligamento: motivo,
  });

  revalidatePath("/pessoas");
  revalidatePath(`/pessoas/${id}`);
  revalidatePath("/");
  redirect(`/pessoas/${id}`);
}
