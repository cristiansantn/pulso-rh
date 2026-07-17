"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Autentica com e-mail e senha via Supabase Auth. */
export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?erro=nao-configurado");
  }

  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    redirect("/login?erro=campos-obrigatorios");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
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
    maxAge: 60 * 60 * 8,
  });

  redirect("/");
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
