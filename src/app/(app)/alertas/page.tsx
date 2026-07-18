import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import {
  CATEGORIA_LABEL,
  gerarAlertas,
  resumoPorSeveridade,
  SEVERIDADE_LABEL,
  type Alerta,
  type SeveridadeAlerta,
} from "@/lib/analytics/alertas";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import { listarVagas } from "@/lib/data/vagas";
import { diasAtrasIso, hojeIso } from "@/lib/datas";

/** Faixa de cor de cada severidade; a alta usa o tom negativo. */
const ESTILO_SEVERIDADE: Record<
  SeveridadeAlerta,
  { ponto: string; etiqueta: string; borda: string }
> = {
  alta: {
    ponto: "bg-negative",
    etiqueta: "bg-negative-soft text-negative",
    borda: "border-l-negative",
  },
  media: {
    ponto: "bg-warning",
    etiqueta: "bg-warning-soft text-warning",
    borda: "border-l-warning",
  },
  baixa: {
    ponto: "bg-brand",
    etiqueta: "bg-brand-soft text-brand",
    borda: "border-l-brand",
  },
};

function CartaoAlerta({ alerta }: { alerta: Alerta }) {
  const estilo = ESTILO_SEVERIDADE[alerta.severidade];
  return (
    <Link
      href={alerta.href}
      className={`group flex items-start justify-between gap-4 rounded-lg border border-line border-l-4 bg-panel px-6 py-4 transition-colors hover:bg-surface ${estilo.borda}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.etiqueta}`}
          >
            {SEVERIDADE_LABEL[alerta.severidade]}
          </span>
          <span className="text-xs text-ink-muted">
            {CATEGORIA_LABEL[alerta.categoria]}
          </span>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold">{alerta.titulo}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{alerta.descricao}</p>
      </div>
      <ArrowRight
        size={18}
        className="mt-1 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/**
 * Motor de alertas (Fase 9). Reúne os desvios da operação em relação à média,
 * às metas e aos limiares — absenteísmo, cobertura, turnover precoce, vagas em
 * atraso e sucessão. Cada alerta traz a evidência e um link para investigar;
 * nenhum afirma causa.
 */
export default async function AlertasPage() {
  const periodo = { inicio: diasAtrasIso(90), fim: hojeIso() };

  const [colaboradores, setores, ocorrencias, afastamentos, vagas, planosSucessao] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: periodo.inicio }),
      listarAfastamentos({ desde: periodo.inicio }),
      listarVagas(),
      listarPlanosSucessao(),
    ]);

  const alertas = gerarAlertas({
    colaboradores,
    setores,
    ocorrencias,
    afastamentos,
    vagas,
    planosSucessao,
    periodo,
  });
  const resumo = resumoPorSeveridade(alertas);

  return (
    <>
      <PageHeader
        titulo="Alertas"
        descricao="Desvios da operação em relação à média, às metas e aos limiares. Cada alerta aponta um desvio com a evidência que o sustenta — a causa é sempre investigada, nunca presumida."
      />

      <section className="grid grid-cols-3 gap-4">
        {(["alta", "media", "baixa"] as SeveridadeAlerta[]).map((severidade) => (
          <div
            key={severidade}
            className="rounded-lg border border-line bg-panel p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2.5 rounded-full ${ESTILO_SEVERIDADE[severidade].ponto}`}
              />
              <span className="text-xs font-medium text-ink-muted">
                {SEVERIDADE_LABEL[severidade]}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{resumo[severidade]}</p>
          </div>
        ))}
      </section>

      {alertas.length === 0 ? (
        <section className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-line bg-panel px-6 py-16 text-center">
          <CheckCircle size={40} className="text-positive" weight="fill" />
          <div>
            <h2 className="text-sm font-semibold">Nenhum desvio no momento</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Nenhum setor, vaga ou cargo passou dos limiares monitorados.
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-3">
          {alertas.map((alerta) => (
            <CartaoAlerta key={alerta.id} alerta={alerta} />
          ))}
        </section>
      )}

      <p className="mt-6 text-xs text-ink-muted">
        Os limiares são fixos nesta fase: absenteísmo de setor a partir de 1,5x a
        média da loja, quadro abaixo de 70% do planejado, duas ou mais saídas
        precoces por setor em 12 meses, vagas além da meta e cargos-chave sem
        sucessor pronto. Um alerta é um convite a investigar, não um veredito.
      </p>
    </>
  );
}
