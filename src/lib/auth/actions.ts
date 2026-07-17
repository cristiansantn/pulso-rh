"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { contaLocal, DEMO_SESSION_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const OITO_HORAS = 60 * 60 * 8;

function hashSenha(senha: string): string {
  return createHash("sha256").update(`pulso:${senha}`).digest("hex");
}

function hashConfere(senha: string, esperadoHex: string): boolean {
  const recebido = Buffer.from(hashSenha(senha), "hex");
  const esperado = Buffer.from(esperadoHex, "hex");
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

/** Autentica via Supabase Auth ou, sem banco, pela conta local do ambiente. */
export async function login(formData: FormData) {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!usuario || !senha) {
    redirect("/login?erro=campos-obrigatorios");
  }

  if (!isSupabaseConfigured()) {
    const conta = contaLocal();
    if (!conta) {
      redirect("/login?erro=nao-configurado");
    }

    if (
      usuario.toLowerCase() !== conta.usuario.toLowerCase() ||
      !hashConfere(senha, conta.senhaSha256)
    ) {
      redirect("/login?erro=credenciais");
    }

    const cookieStore = await cookies();
    cookieStore.set(
      DEMO_SESSION_COOKIE,
      encodeURIComponent(JSON.stringify({ nome: conta.nome, papel: conta.papel })),
      { httpOnly: true, sameSite: "lax", maxAge: OITO_HORAS },
    );
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usuario,
    password: senha,
  });

  if (error) {
    redirect("/login?erro=credenciais");
  }

  redirect("/");
}

/** Inicia uma sessao de demonstracao (disponivel apenas sem Supabase configurado). */
export async function loginDemo() {
  if (isSupabaseConfigured()) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: OITO_HORAS,
  });

  redirect("/");
}

/** Dados da sessao local ativa; nulo em sessao demo anonima ou Supabase. */
export async function sessaoLocal(): Promise<{ nome: string; papel: string } | null> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!valor || valor === "1") return null;

  try {
    const dados = JSON.parse(decodeURIComponent(valor));
    if (typeof dados?.nome === "string" && typeof dados?.papel === "string") {
      return { nome: dados.nome, papel: dados.papel };
    }
  } catch {
    // Cookie de um formato antigo: trata como sessao anonima.
  }
  return null;
}

/** Encerra a sessao atual (Supabase ou demonstracao). */
export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);

  redirect("/login");
}
