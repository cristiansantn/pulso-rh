"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { salvarPlanoSucessao } from "@/lib/data/talentos";
import {
  COMPETENCIAS,
  PRONTIDAO,
  type Competencia,
  type Prontidao,
} from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

export async function salvarPlano(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const cargoAlvoId = texto(formData, "cargo_alvo_id");
  const prontidao = texto(formData, "prontidao") as Prontidao;
  const dataAtualizacao = texto(formData, "data_atualizacao");

  // Gaps chegam como multiplos campos de mesmo nome; mantem so os validos.
  const gaps = formData
    .getAll("gaps")
    .map((g) => String(g))
    .filter((g): g is Competencia => g in COMPETENCIAS);

  if (
    !colaboradorId ||
    !cargoAlvoId ||
    !(prontidao in PRONTIDAO) ||
    !dataAtualizacao
  ) {
    redirect("/talentos/plano?erro=obrigatorios");
  }
  if (dataAtualizacao > hojeIso()) {
    redirect("/talentos/plano?erro=data");
  }

  await salvarPlanoSucessao({
    colaborador_id: colaboradorId,
    cargo_alvo_id: cargoAlvoId,
    prontidao,
    gaps,
    data_atualizacao: dataAtualizacao,
  });

  revalidatePath("/talentos");
  revalidatePath(`/pessoas/${colaboradorId}`);
  revalidatePath("/alertas");
  revalidatePath("/analytics");
  revalidatePath("/relatorios");
  revalidatePath("/");
  redirect("/talentos");
}
