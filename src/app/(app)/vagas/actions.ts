"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atualizarColaborador, buscarColaborador } from "@/lib/data/colaboradores";
import {
  avancarEtapa,
  buscarVaga,
  cancelarVaga,
  concluirVaga,
  criarVaga,
} from "@/lib/data/vagas";
import { MOTIVOS_VAGA, type MotivoVaga, type Turno } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function revalidarVagas(vagaId?: string) {
  revalidatePath("/vagas");
  if (vagaId) {
    revalidatePath(`/vagas/${vagaId}`);
  }
  revalidatePath("/estrutura");
  revalidatePath("/");
}

export async function abrirVaga(formData: FormData) {
  const setorId = texto(formData, "setor_id");
  const cargoId = texto(formData, "cargo_id");
  const motivo = texto(formData, "motivo") as MotivoVaga | null;
  const dataAbertura = texto(formData, "data_abertura");
  const dataLimite = texto(formData, "data_limite");
  const substituidoId = texto(formData, "colaborador_substituido_id");

  if (!setorId || !cargoId || !motivo || !(motivo in MOTIVOS_VAGA) || !dataAbertura) {
    redirect("/vagas/nova?erro=obrigatorios");
  }
  if (dataLimite && dataLimite < dataAbertura) {
    redirect("/vagas/nova?erro=limite");
  }

  const id = await criarVaga({
    setor_id: setorId,
    cargo_id: cargoId,
    turno: texto(formData, "turno") as Turno | null,
    motivo,
    colaborador_substituido_id: motivo === "reposicao" ? substituidoId : null,
    gestor_solicitante_id: texto(formData, "gestor_solicitante_id"),
    data_abertura: dataAbertura,
    data_limite: dataLimite,
  });

  revalidarVagas(id);
  redirect(`/vagas/${id}`);
}

export async function avancarEtapaVaga(id: string) {
  await avancarEtapa(id, hojeIso());

  revalidarVagas(id);
  redirect(`/vagas/${id}`);
}

export async function cancelarVagaAberta(id: string) {
  await cancelarVaga(id, hojeIso());

  revalidarVagas(id);
  redirect(`/vagas/${id}`);
}

/**
 * Recontratacao: um desligado volta ao quadro preenchendo a vaga. O registro
 * do desligamento anterior e limpo no cadastro — o historico completo de
 * passagens entra com o item de historico do roadmap.
 */
export async function admitirRecontratacao(vagaId: string, formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const dataAdmissao = texto(formData, "data_admissao");

  if (!colaboradorId || !dataAdmissao) {
    redirect(`/vagas/${vagaId}?erro=recontratacao`);
  }

  const [vaga, colaborador] = await Promise.all([
    buscarVaga(vagaId),
    buscarColaborador(colaboradorId),
  ]);

  if (!vaga || vaga.status !== "aberta" || vaga.etapa !== "proposta") {
    redirect(`/vagas/${vagaId}?erro=etapa`);
  }
  if (!colaborador || colaborador.status !== "desligado") {
    redirect(`/vagas/${vagaId}?erro=recontratacao`);
  }

  await atualizarColaborador(colaboradorId, {
    status: "ativo",
    setor_id: vaga.setor_id,
    cargo_id: vaga.cargo_id,
    turno: vaga.turno,
    data_admissao: dataAdmissao,
    data_desligamento: null,
    tipo_desligamento: null,
    motivo_desligamento: null,
  });
  await concluirVaga(vagaId, colaboradorId, dataAdmissao);

  revalidarVagas(vagaId);
  revalidatePath("/pessoas");
  revalidatePath(`/pessoas/${colaboradorId}`);
  redirect(`/vagas/${vagaId}`);
}
