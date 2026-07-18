"use client";

import { DownloadSimple, Printer } from "@phosphor-icons/react";

/**
 * Acoes do relatorio. A exportacao em PDF usa a impressao do proprio
 * navegador (o layout ja esconde a navegacao ao imprimir); o CSV e montado no
 * cliente a partir do conteudo ja renderizado, sem round-trip ao servidor.
 */
export function AcoesRelatorio({
  csv,
  nomeArquivo,
}: {
  csv: string;
  nomeArquivo: string;
}) {
  const baixarCsv = () => {
    // BOM para o Excel reconhecer o UTF-8 e nao quebrar os acentos.
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3 print:hidden">
      <button
        type="button"
        onClick={baixarCsv}
        className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
      >
        <DownloadSimple size={15} />
        Baixar CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
      >
        <Printer size={15} />
        Imprimir / PDF
      </button>
    </div>
  );
}
