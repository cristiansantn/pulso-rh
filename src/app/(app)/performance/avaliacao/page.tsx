import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Fieldset, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import {
  NOTAS_PERFORMANCE,
  NOTAS_POTENCIAL,
  type NotaAvaliacao,
} from "@/lib/data/tipos";
import { hojeData } from "@/lib/datas";
import { lancarAvaliacao } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, ciclo, performance e potencial.",
};

/** Ciclo semestral atual e o anterior, no formato YYYY-SN. */
function ciclosRecentes(): string[] {
  const hoje = hojeData();
  const ano = hoje.getFullYear();
  const semestre = hoje.getMonth() < 6 ? 1 : 2;
  const atual = `${ano}-S${semestre}`;
  const anterior = semestre === 1 ? `${ano - 1}-S2` : `${ano}-S1`;
  return [atual, anterior];
}

export default async function LancarAvaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const colaboradores = await listarColaboradores();
  const quadroAtual = colaboradores
    .filter((c) => c.status !== "desligado")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const ciclos = ciclosRecentes();
  const notas: NotaAvaliacao[] = [1, 2, 3];

  return (
    <>
      <Link
        href="/performance"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Performance
      </Link>

      <PageHeader
        titulo="Lançar avaliação"
        descricao="Posição na matriz 9-box de um ciclo. A avaliação reflete a leitura do gestor, não os indicadores operacionais. Reavaliar o mesmo ciclo atualiza a posição."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={lancarAvaliacao} className="max-w-3xl space-y-6">
        <Fieldset legenda="Avaliação de ciclo">
          <div className="sm:col-span-2">
            <Label htmlFor="colaborador_id">Associado</Label>
            <Select id="colaborador_id" name="colaborador_id" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {quadroAtual.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.matricula}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ciclo">Ciclo</Label>
            <Select id="ciclo" name="ciclo" required defaultValue={ciclos[0]}>
              {ciclos.map((ciclo) => (
                <option key={ciclo} value={ciclo}>
                  {ciclo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="performance">Performance</Label>
            <Select id="performance" name="performance" required defaultValue="2">
              {notas.map((nota) => (
                <option key={nota} value={nota}>
                  {nota} — {NOTAS_PERFORMANCE[nota]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="potencial">Potencial</Label>
            <Select id="potencial" name="potencial" required defaultValue="2">
              {notas.map((nota) => (
                <option key={nota} value={nota}>
                  {nota} — {NOTAS_POTENCIAL[nota]}
                </option>
              ))}
            </Select>
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
    </>
  );
}
