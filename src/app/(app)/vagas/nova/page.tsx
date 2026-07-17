import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarCargos, listarSetores } from "@/lib/data/setores";
import { MOTIVOS_VAGA, TURNOS } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";
import { abrirVaga } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha setor, cargo, motivo e data de abertura.",
  limite: "A meta de preenchimento não pode ser anterior à abertura.",
};

export default async function NovaVagaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const [setores, cargos, colaboradores] = await Promise.all([
    listarSetores(),
    listarCargos(),
    listarColaboradores(),
  ]);

  const ativos = colaboradores.filter((c) => c.status === "ativo");
  const desligados = colaboradores.filter((c) => c.status === "desligado");

  return (
    <>
      <Link
        href="/vagas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Vagas & Recrutamento
      </Link>

      <PageHeader
        titulo="Nova vaga"
        descricao="A vaga nasce em solicitação e avança pelo fluxo na própria página da vaga."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={abrirVaga} className="max-w-3xl space-y-6">
        <Fieldset legenda="Posição">
          <div>
            <Label htmlFor="setor_id">Setor *</Label>
            <Select id="setor_id" name="setor_id" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="cargo_id">Cargo *</Label>
            <Select id="cargo_id" name="cargo_id" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="turno">Turno</Label>
            <Select id="turno" name="turno" defaultValue="">
              <option value="">Não definido</option>
              {Object.entries(TURNOS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
        </Fieldset>

        <Fieldset legenda="Origem da vaga">
          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Select id="motivo" name="motivo" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(MOTIVOS_VAGA).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="colaborador_substituido_id">Repõe o desligamento de</Label>
            <Select
              id="colaborador_substituido_id"
              name="colaborador_substituido_id"
              defaultValue=""
            >
              <option value="">Não se aplica</option>
              {desligados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.matricula}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-ink-muted">
              Considerado apenas quando o motivo é reposição.
            </p>
          </div>
          <div>
            <Label htmlFor="gestor_solicitante_id">Gestor solicitante</Label>
            <Select
              id="gestor_solicitante_id"
              name="gestor_solicitante_id"
              defaultValue=""
            >
              <option value="">Não informado</option>
              {ativos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.matricula}
                </option>
              ))}
            </Select>
          </div>
        </Fieldset>

        <Fieldset legenda="Prazos">
          <div>
            <Label htmlFor="data_abertura">Data de abertura *</Label>
            <Input
              id="data_abertura"
              name="data_abertura"
              type="date"
              required
              defaultValue={hojeIso()}
            />
          </div>
          <div>
            <Label htmlFor="data_limite">Meta de preenchimento</Label>
            <Input id="data_limite" name="data_limite" type="date" />
            <p className="mt-1 text-xs text-ink-muted">
              Vaga aberta além desta data conta como em atraso.
            </p>
          </div>
        </Fieldset>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
          >
            Abrir vaga
          </button>
          <Link
            href="/vagas"
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
