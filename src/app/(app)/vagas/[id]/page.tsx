import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, UserPlus } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/form";
import { permanenciaPorEtapa, vagaEmAtraso } from "@/lib/analytics/recrutamento";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { buscarVaga, listarEventosVaga, proximaEtapa } from "@/lib/data/vagas";
import {
  ETAPAS_VAGA,
  FLUXO_VAGA,
  MOTIVOS_VAGA,
  STATUS_VAGA,
  TURNOS,
} from "@/lib/data/tipos";
import { formatarDataBr, hojeIso } from "@/lib/datas";
import { admitirRecontratacao, avancarEtapaVaga, cancelarVagaAberta } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  recontratacao: "Selecione um ex-colaborador e a data de admissão.",
  etapa: "A admissão só é registrada com a vaga aberta e em proposta.",
};

function Info({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

export default async function VagaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const [{ id }, { erro }] = await Promise.all([params, searchParams]);
  const [vaga, eventos, colaboradores] = await Promise.all([
    buscarVaga(id),
    listarEventosVaga(id),
    listarColaboradores(),
  ]);

  if (!vaga) {
    notFound();
  }

  const nomePorId = new Map(colaboradores.map((c) => [c.id, c.nome]));
  const desligados = colaboradores.filter((c) => c.status === "desligado");
  const permanencias = new Map(
    permanenciaPorEtapa(vaga, eventos).map((p) => [p.etapa, p]),
  );
  const proxima = proximaEtapa(vaga);
  const emProposta = vaga.status === "aberta" && vaga.etapa === "proposta";
  const indiceAtual = FLUXO_VAGA.indexOf(vaga.etapa);

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
        titulo={`${vaga.cargo?.nome ?? "Cargo removido"} — ${vaga.setor?.nome ?? "Setor removido"}`}
        descricao={
          vaga.status === "aberta"
            ? `Vaga aberta, em ${ETAPAS_VAGA[vaga.etapa].toLowerCase()}.`
            : `Vaga ${STATUS_VAGA[vaga.status].toLowerCase()} em ${formatarDataBr(vaga.data_fechamento)}.`
        }
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      {vagaEmAtraso(vaga) && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          A meta de preenchimento ({formatarDataBr(vaga.data_limite)}) já passou.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-panel p-6 lg:col-span-1">
          <h2 className="text-sm font-semibold">Dados da vaga</h2>
          <dl className="mt-4 space-y-4">
            <Info rotulo="Motivo">{MOTIVOS_VAGA[vaga.motivo]}</Info>
            {vaga.colaborador_substituido_id && (
              <Info rotulo="Repõe o desligamento de">
                <Link
                  href={`/pessoas/${vaga.colaborador_substituido_id}`}
                  className="underline decoration-line underline-offset-2 transition-colors hover:text-ink-soft"
                >
                  {nomePorId.get(vaga.colaborador_substituido_id) ?? "—"}
                </Link>
              </Info>
            )}
            <Info rotulo="Gestor solicitante">
              {vaga.gestor_solicitante?.nome ?? "—"}
            </Info>
            <Info rotulo="Turno">{vaga.turno ? TURNOS[vaga.turno] : "Não definido"}</Info>
            <Info rotulo="Aberta em">{formatarDataBr(vaga.data_abertura)}</Info>
            <Info rotulo="Meta de preenchimento">
              {formatarDataBr(vaga.data_limite)}
            </Info>
            {vaga.admitido_colaborador_id && (
              <Info rotulo="Admitido">
                <Link
                  href={`/pessoas/${vaga.admitido_colaborador_id}`}
                  className="underline decoration-line underline-offset-2 transition-colors hover:text-ink-soft"
                >
                  {nomePorId.get(vaga.admitido_colaborador_id) ?? "—"}
                </Link>
              </Info>
            )}
          </dl>

          {vaga.status === "aberta" && (
            <form
              action={cancelarVagaAberta.bind(null, vaga.id)}
              className="mt-6 border-t border-line pt-4"
            >
              <button
                type="submit"
                className="rounded-md border border-line px-4 py-2 text-sm text-negative transition-colors hover:bg-negative-soft"
              >
                Cancelar vaga
              </button>
            </form>
          )}
        </section>

        <section className="rounded-lg border border-line bg-panel p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Fluxo</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            O tempo em cada etapa alimenta os indicadores de recrutamento.
          </p>

          <ol className="mt-4 space-y-1">
            {FLUXO_VAGA.map((etapa, indice) => {
              const permanencia = permanencias.get(etapa);
              const atual = vaga.status === "aberta" && etapa === vaga.etapa;
              const passada = permanencia !== undefined && !atual;
              const pulada = vaga.status === "cancelada" && indice > indiceAtual;

              return (
                <li
                  key={etapa}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    atual ? "bg-neutral-soft font-medium" : ""
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                      passada
                        ? "bg-brand text-panel"
                        : atual
                          ? "border border-ink"
                          : "border border-line text-ink-muted"
                    }`}
                  >
                    {passada ? <Check size={11} weight="bold" /> : indice + 1}
                  </span>
                  <span className={permanencia || atual ? "" : "text-ink-muted"}>
                    {ETAPAS_VAGA[etapa]}
                    {pulada && " — não alcançada"}
                  </span>
                  {permanencia && (
                    <span className="ml-auto text-xs text-ink-muted">
                      {formatarDataBr(permanencia.data)}
                      {etapa !== "admissao" &&
                        ` · ${permanencia.dias} ${permanencia.dias === 1 ? "dia" : "dias"}${atual ? " até agora" : ""}`}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {proxima && (
            <form
              action={avancarEtapaVaga.bind(null, vaga.id)}
              className="mt-5 border-t border-line pt-4"
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
              >
                Avançar para {ETAPAS_VAGA[proxima]}
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {emProposta && (
            <div className="mt-5 space-y-5 border-t border-line pt-4">
              <div>
                <h3 className="text-sm font-semibold">Admissão</h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  A admissão conclui a vaga. Cadastre a pessoa nova ou recontrate
                  quem já passou pela loja.
                </p>
              </div>

              <Link
                href={`/pessoas/nova?vaga=${vaga.id}`}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
              >
                <UserPlus size={15} />
                Cadastrar novo colaborador
              </Link>

              {desligados.length > 0 && (
                <form
                  action={admitirRecontratacao.bind(null, vaga.id)}
                  className="grid gap-4 rounded-md border border-line p-4 sm:grid-cols-3"
                >
                  <div className="sm:col-span-2">
                    <Label htmlFor="colaborador_id">Recontratar ex-colaborador</Label>
                    <Select id="colaborador_id" name="colaborador_id" required defaultValue="">
                      <option value="" disabled>
                        Selecione
                      </option>
                      {desligados.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} — {c.matricula}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data_admissao">Data de admissão</Label>
                    <Input
                      id="data_admissao"
                      name="data_admissao"
                      type="date"
                      required
                      defaultValue={hojeIso()}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
                    >
                      Registrar recontratação
                    </button>
                    <p className="mt-2 text-xs text-ink-muted">
                      A pessoa volta a ativa no setor, cargo e turno da vaga; o
                      registro do desligamento anterior sai do cadastro.
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
