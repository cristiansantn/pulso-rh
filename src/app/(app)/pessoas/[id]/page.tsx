import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUUpLeft,
  PencilSimple,
  TrendUp,
  UserMinus,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { registrarRetorno } from "@/app/(app)/frequencia/actions";
import {
  formatarCompetencia,
  formatarValorIndicador,
  media,
  quadrante,
} from "@/lib/analytics/performance";
import { formatarPerfil } from "@/lib/analytics/comportamento";
import { buscarColaborador } from "@/lib/data/colaboradores";
import { listarPerfis } from "@/lib/data/comportamento";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarMovimentacoes } from "@/lib/data/movimentacoes";
import { listarAvaliacoes, listarIndicadoresMensais } from "@/lib/data/performance";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import {
  CATEGORIAS_AFASTAMENTO,
  COMPETENCIAS,
  DISC,
  INDICADORES,
  PRONTIDAO,
  TIPOS_MOVIMENTACAO,
  MOTIVOS_DESLIGAMENTO,
  NOTAS_PERFORMANCE,
  NOTAS_POTENCIAL,
  TIPOS_AFASTAMENTO,
  TIPOS_DESLIGAMENTO,
  TIPOS_OCORRENCIA,
  TURNOS,
  DIAS_SEMANA,
  ESCALAS,
  type TipoIndicador,
} from "@/lib/data/tipos";
import { hojeData } from "@/lib/datas";

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function calcularIdade(nascimento: string | null): string {
  if (!nascimento) return "—";
  const hoje = hojeData();
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
  const [
    colaborador,
    ocorrencias,
    afastamentos,
    indicadores,
    avaliacoes,
    perfis,
    planos,
    movimentacoes,
  ] = await Promise.all([
    buscarColaborador(id),
    listarOcorrencias({ colaboradorId: id }),
    listarAfastamentos({ colaboradorId: id }),
    listarIndicadoresMensais({ colaboradorId: id }),
    listarAvaliacoes({ colaboradorId: id }),
    listarPerfis({ colaboradorId: id }),
    listarPlanosSucessao({ colaboradorId: id }),
    listarMovimentacoes({ colaboradorId: id }),
  ]);

  if (!colaborador) {
    notFound();
  }

  // Indicadores da pessoa: ultimo lancamento e media do historico por tipo.
  const tiposDaPessoa = (Object.keys(INDICADORES) as TipoIndicador[])
    .map((tipo) => {
      const registros = indicadores.filter((i) => i.tipo === tipo);
      return registros.length > 0
        ? {
            tipo,
            ultimo: registros[0],
            mediaHistorico: media(registros.map((r) => r.valor)),
            competencias: registros.length,
          }
        : null;
    })
    .filter((resumo) => resumo !== null);

  // As consultas vem ordenadas do registro mais recente para o mais antigo.
  const avaliacaoRecente = avaliacoes[0];
  const perfilVigente = perfis[0];
  const planoSucessao = planos[0];

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
        {colaborador.status !== "desligado" && (
          <Link
            href={`/pessoas/${colaborador.id}/movimentacao`}
            className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            <TrendUp size={15} />
            Movimentação
          </Link>
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
            rotulo="Escala"
            valor={colaborador.escala ? ESCALAS[colaborador.escala] : null}
          />
          <Campo
            rotulo="Folga fixa"
            valor={
              colaborador.folga_fixa != null
                ? DIAS_SEMANA[colaborador.folga_fixa]
                : null
            }
          />
          <Campo
            rotulo="Turno"
            valor={colaborador.turno ? TURNOS[colaborador.turno] : null}
          />
        </Secao>

        {(movimentacoes.length > 0 || colaborador.data_admissao) && (
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-sm font-semibold">Histórico de carreira</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Promoções, transferências e mudanças de turno, do mais recente ao
              mais antigo.
            </p>
            <ol className="mt-4 space-y-0">
              {movimentacoes.map((mov) => (
                <li key={mov.id} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-brand" />
                    <span className="w-px flex-1 bg-line" />
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium">
                      {TIPOS_MOVIMENTACAO[mov.tipo]}
                      {mov.para && (
                        <span className="font-normal text-ink-soft">
                          {mov.de ? ` · ${mov.de} → ${mov.para}` : ` · ${mov.para}`}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">{formatarData(mov.data)}</p>
                  </div>
                </li>
              ))}
              {colaborador.data_admissao && (
                <li className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full border border-line bg-surface" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Admissão
                      {colaborador.cargo?.nome && (
                        <span className="font-normal text-ink-soft">
                          {" "}
                          · {colaborador.cargo.nome}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatarData(colaborador.data_admissao)}
                    </p>
                  </div>
                </li>
              )}
            </ol>
          </section>
        )}

        {(tiposDaPessoa.length > 0 || avaliacaoRecente) && (
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-sm font-semibold">Performance</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Indicadores lançados por competência e avaliação do ciclo mais
              recente.
            </p>
            {avaliacaoRecente && (
              <p className="mt-3 text-sm">
                <span className="font-medium">
                  Ciclo {avaliacaoRecente.ciclo}: {quadrante(avaliacaoRecente).rotulo}
                </span>
                <span className="text-ink-soft">
                  {" "}
                  · Performance: {NOTAS_PERFORMANCE[avaliacaoRecente.performance]} ·
                  Potencial: {NOTAS_POTENCIAL[avaliacaoRecente.potencial]}
                </span>
              </p>
            )}
            {tiposDaPessoa.length > 0 && (
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tiposDaPessoa.map((resumo) => (
                  <div key={resumo.tipo}>
                    <dt className="text-xs text-ink-muted">
                      {INDICADORES[resumo.tipo].rotulo}
                    </dt>
                    <dd className="mt-0.5 text-sm">
                      {formatarValorIndicador(resumo.tipo, resumo.ultimo.valor)}
                      <span className="text-ink-muted">
                        {" "}
                        · {formatarCompetencia(resumo.ultimo.competencia)}
                      </span>
                    </dd>
                    <dd className="mt-0.5 text-xs text-ink-muted">
                      Média em {resumo.competencias}{" "}
                      {resumo.competencias === 1 ? "competência" : "competências"}:{" "}
                      {formatarValorIndicador(resumo.tipo, resumo.mediaHistorico)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}

        {perfilVigente && (
          <section className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-sm font-semibold">Perfil comportamental</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              DISC · avaliado em {formatarData(perfilVigente.data_avaliacao)} ·
              descreve estilo de trabalho, não desempenho.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Campo
                rotulo="Perfil"
                valor={`${formatarPerfil(perfilVigente)} — ${DISC[perfilVigente.fator_primario].nome}${
                  perfilVigente.fator_secundario
                    ? ` com ${DISC[perfilVigente.fator_secundario].nome}`
                    : ""
                }`}
              />
              <Campo
                rotulo="Ênfase"
                valor={DISC[perfilVigente.fator_primario].enfase}
              />
              <Campo
                rotulo="Comunicação"
                valor={DISC[perfilVigente.fator_primario].comunicacao}
              />
              <Campo
                rotulo="Decisão"
                valor={DISC[perfilVigente.fator_primario].decisao}
              />
            </dl>
          </section>
        )}

        {planoSucessao && (
          <section className="rounded-lg border border-line bg-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Talento e sucessão</h2>
              <Link
                href={`/talentos/plano?colaborador=${colaborador.id}`}
                className="text-xs font-medium text-brand transition-colors hover:text-brand-strong"
              >
                Editar plano
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Plano de sucessão do comitê · revisado em{" "}
              {formatarData(planoSucessao.data_atualizacao)}. Aponta preparação
              para um cargo-alvo, não promessa de promoção.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Campo
                rotulo="Cargo-alvo"
                valor={planoSucessao.cargo_alvo?.nome ?? null}
              />
              <Campo rotulo="Prontidão" valor={PRONTIDAO[planoSucessao.prontidao]} />
              <Campo
                rotulo="Gaps de competência (PDI)"
                valor={
                  planoSucessao.gaps.length > 0
                    ? planoSucessao.gaps.map((gap) => COMPETENCIAS[gap]).join(", ")
                    : "Sem gaps registrados"
                }
              />
            </dl>
          </section>
        )}

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
