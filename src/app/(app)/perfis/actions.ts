"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarPerfil } from "@/lib/data/comportamento";
import { FATORES_DISC, type FatorDisc } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

export async function registrarPerfilAction(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const primario = texto(formData, "fator_primario") as FatorDisc;
  const secundarioBruto = texto(formData, "fator_secundario");
  const dataAvaliacao = texto(formData, "data_avaliacao");

  const secundario =
    secundarioBruto === "" ? null : (secundarioBruto as FatorDisc);

  if (
    !colaboradorId ||
    !FATORES_DISC.includes(primario) ||
    !dataAvaliacao ||
    (secundario !== null && !FATORES_DISC.includes(secundario))
  ) {
    redirect("/perfis/registrar?erro=obrigatorios");
  }
  if (secundario === primario) {
    redirect("/perfis/registrar?erro=fatores");
  }
  if (dataAvaliacao > hojeIso()) {
    redirect("/perfis/registrar?erro=data");
  }

  await registrarPerfil({
    colaborador_id: colaboradorId,
    metodologia: "disc",
    fator_primario: primario,
    fator_secundario: secundario,
    data_avaliacao: dataAvaliacao,
  });

  revalidatePath("/perfis");
  revalidatePath(`/pessoas/${colaboradorId}`);
  revalidatePath("/");
  redirect("/perfis");
}
