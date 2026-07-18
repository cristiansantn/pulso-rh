"use client";

import { useState } from "react";
import Link from "next/link";
import { lancarIndicador } from "@/app/(app)/performance/actions";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { INDICADORES, type TipoIndicador } from "@/lib/data/tipos";

export interface PessoaOpcao {
  id: string;
  nome: string;
  matricula: string;
  setorNome: string;
}

/**
 * Formulario de lancamento de indicador. A escolha do associado restringe os
 * indicadores aos do setor dele — o vinculo indicador -> setor e do catalogo,
 * e oferecer o catalogo inteiro so produziria lancamento invalido.
 */
export function IndicadorForm({
  pessoas,
  competenciaInicial,
}: {
  pessoas: PessoaOpcao[];
  competenciaInicial: string;
}) {
  const [pessoaId, setPessoaId] = useState("");
  const setorNome = pessoas.find((p) => p.id === pessoaId)?.setorNome;
  const tipos = (Object.keys(INDICADORES) as TipoIndicador[]).filter(
    (t) => INDICADORES[t].setor === setorNome,
  );

  return (
    <form action={lancarIndicador} className="max-w-3xl space-y-6">
      <Fieldset legenda="Indicador mensal">
        <div className="sm:col-span-2">
          <Label htmlFor="colaborador_id">Associado</Label>
          <Select
            id="colaborador_id"
            name="colaborador_id"
            required
            value={pessoaId}
            onChange={(evento) => setPessoaId(evento.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.matricula} · {p.setorNome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="competencia">Competência</Label>
          <Input
            id="competencia"
            name="competencia"
            type="month"
            required
            defaultValue={competenciaInicial}
          />
        </div>
        <div>
          <Label htmlFor="tipo">Indicador</Label>
          <Select
            id="tipo"
            name="tipo"
            required
            defaultValue=""
            key={pessoaId}
            disabled={!setorNome}
          >
            <option value="" disabled>
              {setorNome ? "Selecione" : "Escolha o associado antes"}
            </option>
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {INDICADORES[tipo].rotulo}
                {INDICADORES[tipo].formato === "percentual"
                  ? " (%)"
                  : INDICADORES[tipo].unidade
                    ? ` (${INDICADORES[tipo].unidade})`
                    : ""}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input
            id="valor"
            name="valor"
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 53,1"
            required
          />
          <p className="mt-1 text-xs text-ink-muted">
            Use o valor na unidade do indicador (percentuais como número, ex.: 24,5).
          </p>
        </div>
      </Fieldset>

      <div className="flex items-center gap-3">
        <BotaoEnviar className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-70">
          Lançar
        </BotaoEnviar>
        <Link
          href="/performance"
          className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
