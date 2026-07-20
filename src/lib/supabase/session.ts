import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, isSupabaseConfigured } from "@/lib/env";

/**
 * Controle de sessao executado pelo proxy em toda requisicao:
 * renova o token do Supabase e redireciona conforme o estado de autenticacao.
 * Em modo demonstracao, a verificacao se resume ao cookie de sessao demo.
 */
export async function updateSession(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isSupabaseConfigured()) {
    const hasDemoSession = request.cookies.has(DEMO_SESSION_COOKIE);

    if (!hasDemoSession && !isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (hasDemoSession && isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Uma falha ao consultar o Supabase (rede, credencial invalida, cookie
  // corrompido) nao pode derrubar toda a aplicacao: sem isto, qualquer excecao
  // aqui faz o proxy estourar e todas as rotas — inclusive /login — retornam
  // 500. Tratamos como "sem usuario" e deixamos o fluxo normal de redirecionar.
  let user = null;
  try {
    const resultado = await supabase.auth.getUser();
    user = resultado.data.user;
  } catch {
    user = null;
  }

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
