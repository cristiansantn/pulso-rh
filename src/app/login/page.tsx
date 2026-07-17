import Image from "next/image";
import fundoLogin from "../../../public/login-fundo.webp";
import { login, loginDemo } from "@/lib/auth/actions";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Input, Label } from "@/components/ui/form";
import { isSupabaseConfigured } from "@/lib/env";

const MENSAGENS_ERRO: Record<string, string> = {
  credenciais: "Usuário ou senha inválidos.",
  "campos-obrigatorios": "Informe usuário e senha.",
  "nao-configurado": "Banco de dados não configurado. Use o modo demonstração.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const configurado = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen bg-panel">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[44%] lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-3">
            <Image src="/logo-cea.webp" alt="C&A" width={44} height={44} />
            <div>
              <p className="text-base font-semibold tracking-tight">Painel de Controle</p>
              <p className="text-xs text-ink-muted">People Analytics C&amp;A</p>
            </div>
          </div>

          <h1 className="mt-10 text-2xl font-semibold tracking-tight">
            Entrar no portal
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Gestão de pessoas e indicadores da operação da loja.
          </p>

          <form action={login} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                placeholder="Matrícula ou e-mail"
              />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <p className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
                {MENSAGENS_ERRO[erro] ?? "Não foi possível entrar. Tente novamente."}
              </p>
            )}

            <BotaoEnviar className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-panel transition-colors hover:bg-brand-strong disabled:opacity-70">
              Entrar
            </BotaoEnviar>
          </form>

          {!configurado && (
            <form action={loginDemo} className="mt-4">
              <BotaoEnviar className="flex w-full items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-neutral-soft/60 disabled:opacity-70">
                Entrar em modo demonstração
              </BotaoEnviar>
              <p className="mt-3 text-center text-xs text-ink-muted">
                Supabase não configurado. O modo demonstração usa dados fictícios.
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="relative hidden pl-3 lg:block lg:w-[56%]">
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={fundoLogin}
            alt=""
            fill
            priority
            sizes="56vw"
            quality={100}
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-10 pt-24 pb-8">
            <p className="max-w-md text-lg font-medium text-white">
              As pessoas no centro da operação.
            </p>
            <p className="mt-1 text-sm text-white/70">
              Quadro, frequência e recrutamento da loja em um só lugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
