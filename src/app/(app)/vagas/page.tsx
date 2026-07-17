import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  idadeVaga,
  timeToFillMedio,
  vagaEmAtraso,
} from "@/lib/analytics/recrutamento";
import { listarVagas } from "@/lib/data/vagas";
import {
  ETAPAS_VAGA,
  FLUXO_VAGA,
  MOTIVOS_VAGA,
  STATUS_VAGA,
  TURNOS,
  type StatusVaga,
  type Vaga,
} from "@/lib/data/tipos";
import { formatarDataBr } from "@/lib/datas";

const ESTILOS_STATUS: Record<StatusVaga, string> = {
  aberta: "bg-positive-soft text-positive",
  concluida: "bg-neutral-soft text-ink-muted",
  cancelada: "bg-neutral-soft text-ink-muted",
};

function VagaBadge({ vaga }: { vaga: Vaga }) {
  if (vagaEmAtraso(vaga)) {
    return (
      <span className="inline-flex rounded-full bg-negative-soft px-2.5 py-0.5 text-xs font-medium text-negative">
        Em atraso
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS_STATUS[vaga.status]}`}
    >
      {STATUS_VAGA[vaga.status]}
    </span>
  );
}

export default async function VagasPage() {
  const vagas = await listarVagas();

  const abertas = vagas.filter((v) => v.status === "aberta");
  const emAtraso = abertas.filter(vagaEmAtraso);
  const concluidas = vagas.filter((v) => v.status === "concluida");
  const timeToFill = timeToFillMedio(vagas);
  const idadeMedia =
    abertas.length > 0
      ? Math.round(abertas.reduce((soma, v) => soma + idadeVaga(v), 0) / abertas.length)
      : null;

  return (
    <>
      <PageHeader
        titulo="Vagas & Recrutamento"
        descricao="Fluxo de solicitação a admissão. Os prazos por etapa alimentam os indicadores de recrutamento."
      >
        <Link
          href="/vagas/nova"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
        >
          <Plus size={15} weight="bold" />
          Nova vaga
        </Link>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          rotulo="Vagas abertas"
          valor={String(abertas.length)}
          detalhe={
            idadeMedia !== null ? `Idade média: ${idadeMedia} dias` : undefined
          }
        />
        <KpiCard rotulo="Em atraso" valor={String(emAtraso.length)} detalhe="Meta de preenchimento vencida" />
        <KpiCard
          rotulo="Time to fill"
          valor={timeToFill !== null ? `${timeToFill} dias` : "—"}
          detalhe="Média das concluídas, da solicitação à admissão"
          pendente={timeToFill === null}
        />
        <KpiCard rotulo="Admissões" valor={String(concluidas.length)} detalhe="Vagas concluídas" />
      </section>

      <section className="mt-8">
        {vagas.length === 0 && (
          <p className="rounded-lg border border-line bg-panel px-6 py-10 text-center text-sm text-ink-muted">
            Nenhuma vaga registrada. A primeira entra pelo botão acima.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vagas.map((vaga) => {
            const passo = FLUXO_VAGA.indexOf(vaga.etapa) + 1;
            return (
              <Link
                key={vaga.id}
                href={`/vagas/${vaga.id}`}
                className="flex flex-col rounded-lg border border-line bg-panel p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {vaga.cargo?.nome ?? "Cargo removido"}
                    </h2>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {vaga.setor?.nome ?? "Setor removido"}
                      {vaga.turno ? ` · ${TURNOS[vaga.turno]}` : ""}
                    </p>
                  </div>
                  <VagaBadge vaga={vaga} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{ETAPAS_VAGA[vaga.etapa]}</span>
                    <span className="text-ink-muted">
                      Etapa {passo} de {FLUXO_VAGA.length}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {FLUXO_VAGA.map((etapa, indice) => (
                      <span
                        key={etapa}
                        className={`h-1 flex-1 rounded-full ${
                          indice < passo ? "bg-brand" : "bg-neutral-soft"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <dl className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Motivo</dt>
                    <dd className="text-ink-soft">{MOTIVOS_VAGA[vaga.motivo]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Solicitante</dt>
                    <dd className="text-ink-soft">
                      {vaga.gestor_solicitante?.nome ?? "—"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
                  Aberta em {formatarDataBr(vaga.data_abertura)} · {idadeVaga(vaga)} dias
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
