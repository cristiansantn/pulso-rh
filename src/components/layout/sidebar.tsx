"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CalendarBlank,
  ChartLineUp,
  ChartScatter,
  FileText,
  GearSix,
  House,
  Medal,
  Pulse,
  Storefront,
  Swap,
  UserFocus,
  Users,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";

interface ItemNav {
  href: string;
  rotulo: string;
  icone: Icon;
  /** Modulos previstos no roadmap mas ainda nao implementados. */
  emBreve?: boolean;
}

interface SecaoNav {
  titulo: string;
  itens: ItemNav[];
}

/** O menu espelha o roadmap completo; itens futuros ficam visiveis e desabilitados. */
const SECOES: SecaoNav[] = [
  {
    titulo: "Operação",
    itens: [
      { href: "/", rotulo: "Visão Geral", icone: House },
      { href: "/pessoas", rotulo: "Associados", icone: Users },
      { href: "/estrutura", rotulo: "Estrutura da Operação", icone: Storefront },
      { href: "/frequencia", rotulo: "Escala & Frequência", icone: CalendarBlank },
    ],
  },
  {
    titulo: "Análise",
    itens: [
      { href: "/performance", rotulo: "Performance", icone: ChartLineUp },
      { href: "/perfis", rotulo: "Perfil Comportamental", icone: UserFocus },
      { href: "/talentos", rotulo: "Talentos & Sucessão", icone: Medal, emBreve: true },
      { href: "/turnover", rotulo: "Turnover", icone: Swap },
      { href: "/absenteismo", rotulo: "Absenteísmo", icone: Pulse },
      { href: "/analytics", rotulo: "People Analytics", icone: ChartScatter, emBreve: true },
      { href: "/alertas", rotulo: "Alertas", icone: WarningCircle, emBreve: true },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { href: "/vagas", rotulo: "Vagas & Recrutamento", icone: Briefcase },
      { href: "/relatorios", rotulo: "Relatórios", icone: FileText, emBreve: true },
      { href: "/configuracoes", rotulo: "Configurações", icone: GearSix, emBreve: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {SECOES.map((secao) => (
        <div key={secao.titulo}>
          <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            {secao.titulo}
          </p>
          <ul className="space-y-0.5">
            {secao.itens.map((item) => {
              const ativo =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              if (item.emBreve) {
                return (
                  <li key={item.href}>
                    <span className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-ink-muted/60">
                      <item.icone size={17} />
                      {item.rotulo}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      ativo
                        ? "bg-brand-soft font-medium text-brand"
                        : "text-ink-soft hover:bg-neutral-soft/60"
                    }`}
                  >
                    <item.icone size={17} weight={ativo ? "fill" : "regular"} />
                    {item.rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
