import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarCargos } from "@/lib/data/setores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import {
  COMPETENCIAS,
  PRONTIDAO,
  type Competencia,
  type Prontidao,
} from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";
import { salvarPlano } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, cargo-alvo, prontidão e data.",
  data: "A data da revisão não pode ser no futuro.",
};

export default async function PlanoSucessaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; colaborador?: string }>;
}) {
  const { erro, colaborador } = await searchParams;

  const [colaboradores, cargos, planos] = await Promise.all([
    listarColaboradores(),
    listarCargos(),
    listarPlanosSucessao(),
  ]);

  const quadroAtual = colaboradores
    .filter((c) => c.status !== "desligado")
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const cargosOrdenados = [...cargos].sort((a, b) => a.nome.localeCompare(b.nome));

  // Edicao: se a pessoa ja tem plano, os campos vem preenchidos.
  const existente = colaborador
    ? planos.find((p) => p.colaborador_id === colaborador)
    : undefined;
  const gapsAtuais = new Set<Competencia>(existente?.gaps ?? []);
  const competencias = Object.keys(COMPETENCIAS) as Competencia[];
  const prontidoes = Object.keys(PRONTIDAO) as Prontidao[];

  return (
    <>
      <Link
        href="/talentos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Talentos e Sucessão
      </Link>

      <PageHeader
        titulo={existente ? "Editar plano de sucessão" : "Novo plano de sucessão"}
        descricao="Prepara uma pessoa para um cargo-alvo. Registra risco de cobertura e foco de desenvolvimento, não promessa de promoção. Um plano por pessoa."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={salvarPlano} className="max-w-3xl space-y-6">
        <Fieldset legenda="Plano de sucessão">
          <div className="sm:col-span-2">
            <Label htmlFor="colaborador_id">Associado</Label>
            <Select
              id="colaborador_id"
              name="colaborador_id"
              required
              defaultValue={existente?.colaborador_id ?? colaborador ?? ""}
            >
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
            <Label htmlFor="cargo_alvo_id">Cargo-alvo</Label>
            <Select
              id="cargo_alvo_id"
              name="cargo_alvo_id"
              required
              defaultValue={existente?.cargo_alvo_id ?? ""}
            >
              <option value="" disabled>
                Selecione
              </option>
              {cargosOrdenados.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="prontidao">Prontidão</Label>
            <Select
              id="prontidao"
              name="prontidao"
              required
              defaultValue={existente?.prontidao ?? ""}
            >
              <option value="" disabled>
                Selecione
              </option>
              {prontidoes.map((p) => (
                <option key={p} value={p}>
                  {PRONTIDAO[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="data_atualizacao">Data da revisão</Label>
            <Input
              id="data_atualizacao"
              name="data_atualizacao"
              type="date"
              required
              defaultValue={existente?.data_atualizacao ?? hojeIso()}
              max={hojeIso()}
            />
          </div>
        </Fieldset>

        <fieldset className="rounded-lg border border-line bg-panel p-6">
          <legend className="px-1 text-sm font-semibold">
            Gaps de competência (PDI)
          </legend>
          <p className="mb-4 text-xs text-ink-muted">
            Competências a desenvolver até a prontidão. Marque quantas se aplicarem.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {competencias.map((competencia) => (
              <label
                key={competencia}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm transition-colors hover:bg-neutral-soft/50"
              >
                <input
                  type="checkbox"
                  name="gaps"
                  value={competencia}
                  defaultChecked={gapsAtuais.has(competencia)}
                  className="size-4 rounded border-line text-brand focus:ring-brand"
                />
                {COMPETENCIAS[competencia]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <BotaoEnviar className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-70">
            {existente ? "Salvar alterações" : "Criar plano"}
          </BotaoEnviar>
          <Link
            href="/talentos"
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
