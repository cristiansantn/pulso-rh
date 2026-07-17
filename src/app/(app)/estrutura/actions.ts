"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atualizarSetor, criarSetor, excluirSetor } from "@/lib/data/setores";
import { listarVagas } from "@/lib/data/vagas";

export async function cadastrarSetor(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const planejado = Number(formData.get("headcount_planejado") ?? 0);

  if (!nome || !Number.isInteger(planejado) || planejado < 0) {
    redirect("/estrutura/novo?erro=invalido");
  }

  await criarSetor(nome, planejado);

  revalidatePath("/estrutura");
  revalidatePath("/");
  redirect("/estrutura");
}

export async function salvarSetor(id: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const planejado = Number(formData.get("headcount_planejado") ?? -1);

  if (!nome || !Number.isInteger(planejado) || planejado < 0) {
    redirect(`/estrutura/${id}?erro=invalido`);
  }

  await atualizarSetor(id, { nome, headcount_planejado: planejado });

  revalidatePath("/estrutura");
  revalidatePath(`/estrutura/${id}`);
  revalidatePath("/pessoas");
  revalidatePath("/");
  redirect(`/estrutura/${id}`);
}

export async function removerSetor(id: string) {
  const vagas = await listarVagas();
  const abertas = vagas.filter((v) => v.setor_id === id && v.status === "aberta");
  if (abertas.length > 0) {
    redirect(`/estrutura/${id}?erro=vagas-abertas`);
  }

  await excluirSetor(id);

  revalidatePath("/estrutura");
  revalidatePath("/pessoas");
  revalidatePath("/");
  redirect("/estrutura");
}
