import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUUpLeft,
  PencilSimple,
  UserMinus,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { registrarRetorno } from "@/app/(app)/frequencia/actions";
import { buscarColaborador } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import {
  CATEGORIAS_AFASTAMENTO,
  MOTIVOS_DESLIGAMENTO,
  TIPOS_AFASTAMENTO,
  TIPOS_DESLIGAMENTO,
  TIPOS_OCORRENCIA,
  TURNOS,
} from "@/lib/data/tipos";

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function calcularIdade(nascimento: string | null): string {
  if (!nascimento) return "—";
  const hoje = new Date();
  const data = new Date(`${nascimento}T00:00:00`);
  let idade = hoje.getFullYear() - data.getFullYear();
  const aniversarioPendente =
    hoje.getMonth() < data.getMonth() ||
    (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate());
  if (aniversarioPendente) idade -= 1;
  return `${idade} anos`;
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm">{valor || "—"}</dd>
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6">
      <h2 className="mb-4 text-sm font-semibold">{titulo}</h2>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</dl>
    </section>
  );
}

/** Ficha individual do colaborador (base do futuro prontuario 360). */
export default async function FichaColaboradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [colaborador, ocorrencias, afastamentos] = await Promise.all([
    buscarColaborador(id),
    listarOcorrencias({ colaboradorId: id }),
    listarAfastamentos({ colaboradorId: id }),
  ]);

  if (!colaborador) {
    notFound();
  }

  // Historico unificado de frequencia, mais recente primeiro.
  const historico = [
    ...ocorrencias.map((o) => ({
      id: o.id,
      data_inicio: o.data_inicio,
      data_fim: o.data_fim,
      rotulo: TIPOS_OCORRENCIA[o.tipo],
      detalhe: o.minutos != null ? `${o.minutos} min` : null,
    })),
    ...afastamentos.map((a) => ({
      id: a.id,
      data_inicio: a.data_inicio,
      data_fim: a.data_fim,
      rotulo: TIPOS_AFASTAMENTO[a.tipo],
      detalhe: CATEGORIAS_AFASTAMENTO[a.categoria],
    })),
  ].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  return (
    <>
      <Link
        href="/pessoas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Pessoas
      </Link>

      <PageHeader
        titulo={colaborador.nome}
        descricao={`Matrícula ${colaborador.matricula}`}
      >
        <StatusBadge status={colaborador.status} />
        {(colaborador.status === "ferias" || colaborador.status === "afastado") && (
          <form action={registrarRetorno.bind(null, colaborador.id)}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
            >
              <ArrowUUpLeft size={15} />
              Registrar retorno
            </button>
          </form>
        )}
        <Link
          href={`/pessoas/${colaborador.id}/editar`}
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          <PencilSimple size={15} />
          Editar
        </Link>
        {colaborador.status !== "desligado" && (
          <Link
            href={`/pessoas/${colaborador.id}/desligar`}
            className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-negative transition-colors hover:bg-negative-soft"
          >
            <UserMinus size={15} />
            Registrar desligamento
          </Link>
        )}
      </PageHeader>

      <div className="space-y-6">
        <Secao titulo="Dados pessoais">
          <Campo rotulo="Data de nascimento" valor={formatarData(colaborador.data_nascimento)} />
          <Campo rotulo="Idade" valor={calcularIdade(colaborador.data_nascimento)} />
          <Campo rotulo="Telefone" valor={colaborador.telefone} />
          <Campo rotulo="E-mail" valor={colaborador.email} />
          <Campo rotulo="Cidade" valor={colaborador.cidade} />
          <Campo rotulo="Bairro" valor={colaborador.bairro} />
          <Campo rotulo="Região" valor={colaborador.regiao} />
          <Campo
            rotulo="Deslocamento até a loja"
            valor={
              colaborador.tempo_deslocamento_min != null
                ? `${colaborador.tempo_deslocamento_min} min`
                : null
            }
          />
        </Secao>

        <Secao titulo="Dados demográficos">
          <Campo rotulo="Gênero" valor={colaborador.genero} />
          <Campo rotulo="Escolaridade" valor={colaborador.escolaridade} />
          <Campo rotulo="Pessoa com deficiência" valor={colaborador.pcd ? "Sim" : "Não"} />
        </Secao>

        <Secao titulo="Dados profissionais">
          <Campo rotulo="Setor" valor={colaborador.setor?.nome ?? null} />
          <Campo rotulo="Cargo" valor={colaborador.cargo?.nome ?? null} />
          <Campo rotulo="Gestor direto" valor={colaborador.gestor?.nome ?? null} />
          <Campo rotulo="Data de admissão" valor={formatarData(colaborador.data_admissao)} />
          <Campo rotulo="Tipo de contrato" valor={colaborador.tipo_contrato} />
          <Campo rotulo="Jornada" valor={colaborador.jornada} />
          <Campo
            rotulo="Turno"
            valor={colaborador.turno ? TURNOS[colaborador.turno] : null}
          />
        </Secao>

        {historico.length > 0 && (
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-sm font-semibold">Frequência</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Faltas, atrasos, folgas, férias, atestados e afastamentos.
            </p>
            <ul className="mt-3 divide-y divide-line">
              {historico.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <span className="font-medium">{registro.rotulo}</span>
                  <span className="text-ink-soft">
                    {registro.detalhe && (
                      <span className="mr-4 text-ink-muted">{registro.detalhe}</span>
                    )}
                    {formatarData(registro.data_inicio)}
                    {registro.data_fim && registro.data_fim !== registro.data_inicio
                      ? ` a ${formatarData(registro.data_fim)}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {colaborador.status === "desligado" && (
          <Secao titulo="Desligamento">
            <Campo
              rotulo="Data do desligamento"
              valor={formatarData(colaborador.data_desligamento)}
            />
            <Campo
              rotulo="Tipo"
              valor={
                colaborador.tipo_desligamento
                  ? TIPOS_DESLIGAMENTO[colaborador.tipo_desligamento]
                  : null
              }
            />
            <Campo
              rotulo="Motivo declarado"
              valor={
                colaborador.motivo_desligamento
                  ? (MOTIVOS_DESLIGAMENTO[colaborador.motivo_desligamento] ??
                    colaborador.motivo_desligamento)
                  : null
              }
            />
          </Secao>
        )}
      </div>
    </>
  );
}
