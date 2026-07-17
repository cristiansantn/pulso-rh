"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarColaborador,
  buscarColaborador,
} from "@/lib/data/colaboradores";
import { criarAfastamento, criarOcorrencia } from "@/lib/data/frequencia";
import {
  CATEGORIAS_AFASTAMENTO,
  TIPOS_AFASTAMENTO,
  TIPOS_OCORRENCIA_ATIVOS,
  type CategoriaAfastamento,
  type TipoAfastamento,
  type TipoOcorrencia,
} from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor === "" ? null : valor;
}

function periodoIncluiHoje(inicio: string, fim: string | null): boolean {
  const hoje = hojeIso();
  return inicio <= hoje && (fim === null || fim >= hoje);
}

function revalidarFrequencia(colaboradorId: string) {
  revalidatePath("/frequencia");
  revalidatePath("/absenteismo");
  revalidatePath(`/pessoas/${colaboradorId}`);
  revalidatePath("/pessoas");
  revalidatePath("/");
}

export async function registrarOcorrencia(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const tipo = texto(formData, "tipo") as TipoOcorrencia | null;
  const dataInicio = texto(formData, "data_inicio");
  const dataFim = texto(formData, "data_fim");

  // Somente faltas por enquanto; os demais tipos entram com a escala planejada.
  if (!colaboradorId || !tipo || !(tipo in TIPOS_OCORRENCIA_ATIVOS) || !dataInicio) {
    redirect("/frequencia/nova?erro=obrigatorios");
  }
  if (dataFim && dataFim < dataInicio) {
    redirect("/frequencia/nova?erro=periodo");
  }

  await criarOcorrencia({
    colaborador_id: colaboradorId,
    tipo,
    data_inicio: dataInicio,
    data_fim: dataFim,
    minutos: null,
  });

  revalidarFrequencia(colaboradorId);
  redirect("/frequencia");
}

export async function registrarAfastamento(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const tipo = texto(formData, "tipo") as TipoAfastamento | null;
  const categoria = texto(formData, "categoria") as CategoriaAfastamento | null;
  const dataInicio = texto(formData, "data_inicio");
  const dataFim = texto(formData, "data_fim");

  if (
    !colaboradorId ||
    !tipo ||
    !(tipo in TIPOS_AFASTAMENTO) ||
    !categoria ||
    !(categoria in CATEGORIAS_AFASTAMENTO) ||
    !dataInicio
  ) {
    redirect("/frequencia/afastamento?erro=obrigatorios");
  }
  if (dataFim && dataFim < dataInicio) {
    redirect("/frequencia/afastamento?erro=periodo");
  }

  await criarAfastamento({
    colaborador_id: colaboradorId,
    tipo,
    categoria,
    data_inicio: dataInicio,
    data_fim: dataFim,
  });

  if (periodoIncluiHoje(dataInicio, dataFim)) {
    await atualizarColaborador(colaboradorId, { status: "afastado" });
  }

  revalidarFrequencia(colaboradorId);
  redirect("/frequencia");
}

/** Volta a ativo quem estava em ferias ou afastado. */
export async function registrarRetorno(id: string) {
  const colaborador = await buscarColaborador(id);

  if (!colaborador || (colaborador.status !== "ferias" && colaborador.status !== "afastado")) {
    redirect(`/pessoas/${id}`);
  }

  await atualizarColaborador(id, { status: "ativo" });

  revalidarFrequencia(id);
  redirect(`/pessoas/${id}`);
}
