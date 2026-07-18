"use client";

import { useState } from "react";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Input, Label, Select } from "@/components/ui/form";
import {
  TIPOS_MOVIMENTACAO,
  TURNOS,
  type TipoMovimentacao,
} from "@/lib/data/tipos";

/** Posicao atual da pessoa, usada como origem padrao de cada tipo de evento. */
interface PosicaoAtual {
  cargo: string | null;
  setor: string | null;
  turno: string | null;
}

const ROTULO_ORIGEM: Record<TipoMovimentacao, string> = {
  promocao: "Cargo anterior",
  transferencia: "Setor de origem",
  mudanca_turno: "Turno anterior",
};

const ROTULO_DESTINO: Record<TipoMovimentacao, string> = {
  promocao: "Novo cargo",
  transferencia: "Setor de destino",
  mudanca_turno: "Novo turno",
};

/**
 * Formulario de movimentacao. O tipo escolhido decide quais opcoes de origem e
 * destino aparecem (cargos, setores ou turnos) e qual e a origem padrao — a
 * posicao atual da pessoa. Client component apenas por causa dessa troca.
 */
export function MovimentacaoForm({
  acao,
  colaboradorId,
  cargos,
  setores,
  atual,
  hoje,
}: {
  acao: (formData: FormData) => void;
  colaboradorId: string;
  cargos: string[];
  setores: string[];
  atual: PosicaoAtual;
  hoje: string;
}) {
  const [tipo, setTipo] = useState<TipoMovimentacao>("promocao");

  const opcoes =
    tipo === "transferencia"
      ? setores
      : tipo === "mudanca_turno"
        ? Object.values(TURNOS)
        : cargos;

  const origemAtual =
    tipo === "transferencia"
      ? atual.setor
      : tipo === "mudanca_turno"
        ? atual.turno
        : atual.cargo;

  return (
    <form action={acao} className="max-w-3xl space-y-6">
      <input type="hidden" name="colaborador_id" value={colaboradorId} />

      <fieldset className="rounded-lg border border-line bg-panel p-6">
        <legend className="px-1 text-sm font-semibold">Movimentação</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimentacao)}
            >
              {(Object.keys(TIPOS_MOVIMENTACAO) as TipoMovimentacao[]).map((t) => (
                <option key={t} value={t}>
                  {TIPOS_MOVIMENTACAO[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              name="data"
              type="date"
              required
              defaultValue={hoje}
              max={hoje}
            />
          </div>
          <div>
            <Label htmlFor="de">{ROTULO_ORIGEM[tipo]}</Label>
            <Select
              key={`de-${tipo}`}
              id="de"
              name="de"
              defaultValue={origemAtual ?? ""}
            >
              <option value="">Não informado</option>
              {opcoes.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="para">{ROTULO_DESTINO[tipo]}</Label>
            <Select key={`para-${tipo}`} id="para" name="para" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {opcoes.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          Registra o histórico. A posição atual da pessoa continua sendo mantida
          pela edição do cadastro.
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <BotaoEnviar className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-70">
          Registrar
        </BotaoEnviar>
      </div>
    </form>
  );
}
