"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FichaAfastamentoModal,
  type DadosFicha,
} from "./ficha-afastamento-modal";
import {
  CATEGORIAS_AFASTAMENTO,
  TIPOS_AFASTAMENTO,
  type CategoriaAfastamento,
  type TipoAfastamento,
} from "@/lib/data/tipos";

export type { DadosFicha };

export interface LinhaFrequencia {
  id: string;
  colaboradorId: string;
  nomeColaborador: string;
  rotulo: string;
  periodoFormatado: string;
  ficha: DadosFicha | null;
}

export interface LinhaAfastamentoEspecial {
  id: string;
  colaboradorId: string;
  nomeColaborador: string;
  tipo: TipoAfastamento;
  categoria: CategoriaAfastamento;
  dataInicioFormatada: string;
  dataFimFormatada: string | null;
  emCurso: boolean;
  ficha: DadosFicha;
}

export function TabelaFaltasAtestados({
  linhas,
  tituloSecao,
}: {
  linhas: LinhaFrequencia[];
  tituloSecao: string;
}) {
  const [fichaAberta, setFichaAberta] = useState<DadosFicha | null>(null);

  return (
    <>
      <FichaAfastamentoModal ficha={fichaAberta} onFechar={() => setFichaAberta(null)} />
      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">
            Faltas e atestados — {tituloSecao}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            O dia a dia da frequência. O histórico completo de cada pessoa fica
            na ficha individual; atestados abrem a ficha do registro.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Tipo</th>
              <th className="px-6 py-2.5 font-medium">Período</th>
              <th className="px-6 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-ink-muted">
                  Nenhuma falta ou atestado registrado no período.
                </td>
              </tr>
            )}
            {linhas.map((linha) => (
              <tr
                key={linha.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-6 py-3">
                  <Link href={`/pessoas/${linha.colaboradorId}`} className="font-medium">
                    {linha.nomeColaborador}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">{linha.rotulo}</td>
                <td className="px-6 py-3 text-ink-soft">{linha.periodoFormatado}</td>
                <td className="px-6 py-3 text-right">
                  {linha.ficha && (
                    <button
                      type="button"
                      onClick={() => setFichaAberta(linha.ficha)}
                      className="text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
                    >
                      Abrir ficha
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function TabelaAfastamentos({
  linhas,
  tituloSecao,
}: {
  linhas: LinhaAfastamentoEspecial[];
  tituloSecao: string;
}) {
  const [fichaAberta, setFichaAberta] = useState<DadosFicha | null>(null);

  return (
    <>
      <FichaAfastamentoModal ficha={fichaAberta} onFechar={() => setFichaAberta(null)} />
      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">
            Afastamentos — {tituloSecao}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Somente casos especiais: INSS, licenças e afins. Os detalhes ficam na
            ficha do afastamento; quando houver papéis de acesso, esta seção passa
            a ser restrita (LGPD).
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Tipo</th>
              <th className="px-6 py-2.5 font-medium">Categoria</th>
              <th className="px-6 py-2.5 font-medium">Início</th>
              <th className="px-6 py-2.5 font-medium">Retorno previsto</th>
              <th className="px-6 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  Nenhum afastamento registrado no período.
                </td>
              </tr>
            )}
            {linhas.map((a) => (
              <tr
                key={a.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-6 py-3">
                  <Link href={`/pessoas/${a.colaboradorId}`} className="font-medium">
                    {a.nomeColaborador}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">{TIPOS_AFASTAMENTO[a.tipo]}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {CATEGORIAS_AFASTAMENTO[a.categoria]}
                </td>
                <td className="px-6 py-3 text-ink-soft">{a.dataInicioFormatada}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {a.dataFimFormatada ?? "Indeterminado"}
                  {a.emCurso && (
                    <span className="ml-2 inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                      Em curso
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setFichaAberta(a.ficha)}
                    className="text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
                  >
                    Abrir ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
