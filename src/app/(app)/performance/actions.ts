"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  registrarAvaliacao,
  registrarIndicadorMensal,
} from "@/lib/data/performance";
import {
  INDICADORES,
  type NotaAvaliacao,
  type TipoIndicador,
} from "@/lib/data/tipos";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

/** Aceita "53,1" ou "53.1"; devolve null quando nao for um numero valido. */
function numero(valor: string): number | null {
  const convertido = Number(valor.replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}

function revalidarPerformance(colaboradorId: string) {
  revalidatePath("/performance");
  revalidatePath(`/pessoas/${colaboradorId}`);
  revalidatePath("/analytics");
  revalidatePath("/relatorios");
  revalidatePath("/");
}

export async function lancarIndicador(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const competencia = texto(formData, "competencia");
  const tipo = texto(formData, "tipo") as TipoIndicador;
  const valor = numero(texto(formData, "valor"));

  const competenciaValida = /^\d{4}-(0[1-9]|1[0-2])$/.test(competencia);
  if (
    !colaboradorId ||
    !competenciaValida ||
    !(tipo in INDICADORES) ||
    valor === null ||
    valor < 0
  ) {
    redirect("/performance/indicador?erro=obrigatorios");
  }

  await registrarIndicadorMensal({
    colaborador_id: colaboradorId,
    competencia,
    tipo,
    valor,
  });

  revalidarPerformance(colaboradorId);
  redirect("/performance");
}

export async function lancarAvaliacao(formData: FormData) {
  const colaboradorId = texto(formData, "colaborador_id");
  const ciclo = texto(formData, "ciclo");
  const performance = Number(texto(formData, "performance")) as NotaAvaliacao;
  const potencial = Number(texto(formData, "potencial")) as NotaAvaliacao;

  const cicloValido = /^\d{4}-S[12]$/.test(ciclo);
  const notaValida = (n: number) => n === 1 || n === 2 || n === 3;
  if (
    !colaboradorId ||
    !cicloValido ||
    !notaValida(performance) ||
    !notaValida(potencial)
  ) {
    redirect("/performance/avaliacao?erro=obrigatorios");
  }

  await registrarAvaliacao({
    colaborador_id: colaboradorId,
    ciclo,
    performance,
    potencial,
  });

  revalidarPerformance(colaboradorId);
  redirect("/performance");
}
