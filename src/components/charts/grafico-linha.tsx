interface PontoLinha {
  rotulo: string;
  valor: number | null;
  /** Ponto em foco (ex.: a competencia selecionada), realcado no tracado. */
  destaque?: boolean;
}

interface GraficoLinhaProps {
  pontos: PontoLinha[];
}

const LARGURA = 300;
const ALTURA = 56;
const MARGEM_X = 6;
const MARGEM_Y = 9;

/**
 * Sparkline de serie unica, renderizado no servidor. Escala minimo-a-maximo
 * para revelar a tendencia; buracos (meses sem dado) interrompem o tracado. O
 * ponto em destaque e a ponta ganham marcador com anel na cor da superficie.
 */
export function GraficoLinha({ pontos }: GraficoLinhaProps) {
  const total = pontos.length;
  const plotados = pontos
    .map((ponto, indice) => ({
      ...ponto,
      x:
        total === 1
          ? LARGURA / 2
          : MARGEM_X + (indice / (total - 1)) * (LARGURA - 2 * MARGEM_X),
    }))
    .filter((ponto): ponto is typeof ponto & { valor: number } => ponto.valor != null);

  if (plotados.length === 0) {
    return (
      <svg width="100%" height="auto" viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="block">
        <line
          x1={MARGEM_X}
          y1={ALTURA / 2}
          x2={LARGURA - MARGEM_X}
          y2={ALTURA / 2}
          stroke="var(--color-line)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const valores = plotados.map((p) => p.valor);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = maximo - minimo || 1;
  const base = ALTURA - MARGEM_Y;

  const coordenadaY = (valor: number) =>
    maximo === minimo
      ? ALTURA / 2
      : base - ((valor - minimo) / amplitude) * (ALTURA - 2 * MARGEM_Y);

  const nos = plotados.map((ponto) => ({ ...ponto, y: coordenadaY(ponto.valor) }));
  const traco = nos.map((no) => `${no.x},${no.y}`).join(" ");
  const area =
    nos.length > 1
      ? `M ${nos[0].x},${base} L ${nos.map((no) => `${no.x},${no.y}`).join(" L ")} L ${
          nos[nos.length - 1].x
        },${base} Z`
      : "";

  const ultimo = nos[nos.length - 1];
  const marcadores = nos.filter((no, indice) => no.destaque || indice === nos.length - 1);

  return (
    <svg width="100%" height="auto" viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="block">
      {area && <path d={area} fill="var(--color-brand)" fillOpacity={0.08} />}
      {nos.length > 1 && (
        <polyline
          points={traco}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {marcadores.map((no) => (
        <circle
          key={no.rotulo}
          cx={no.x}
          cy={no.y}
          r={no.destaque ? 4 : 3.5}
          fill="var(--color-brand)"
          fillOpacity={no.destaque || no === ultimo ? 1 : 0.4}
          stroke="var(--color-panel)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        >
          <title>{`${no.rotulo}: ${no.valor}`}</title>
        </circle>
      ))}
    </svg>
  );
}
