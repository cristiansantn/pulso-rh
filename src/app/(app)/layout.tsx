import Image from "next/image";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { Sidebar } from "@/components/layout/sidebar";
import { logout } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env";

/** Layout das paginas autenticadas: sidebar fixa e area de conteudo. */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Image
            src="/logo-cea.webp"
            alt="C&A"
            width={36}
            height={36}
            className="shrink-0"
          />
          <div>
            <p className="text-sm font-semibold tracking-tight">Pulso</p>
            <p className="text-xs text-ink-muted">People Analytics C&amp;A</p>
          </div>
        </div>

        <Sidebar />

        <div className="border-t border-line p-3">
          {!isSupabaseConfigured() && (
            <p className="mb-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
              Modo demonstração: dados fictícios, sem persistência.
            </p>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
            >
              <SignOut size={17} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1600px] px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
