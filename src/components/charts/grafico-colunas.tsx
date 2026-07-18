interface ColunaDado {
  rotulo: string;
  valor: number;
  /** Realca a coluna com a cor de acento (ex.: o pico da distribuicao). */
  destaque?: boolean;
}

interface GraficoColunasProps {
  dados: ColunaDado[];
  /** Altura da area de plotagem, ja incluindo a linha de valor sobre a barra. */
  altura?: number;
  larguraMaxColuna?: number;
  formatarValor?: (valor: number) => string;
}

const RESERVA_ROTULO = 18;

/**
 * Grafico de colunas de serie unica, renderizado no servidor. A altura de cada
 * barra e calculada em pixels sobre uma base fixa para que a escala seja exata,
 * independentemente de quais colunas tenham valor. O valor acompanha o topo da
 * coluna; o texto usa tokens de tinta, nunca a cor da serie.
 */
export function GraficoColunas({
  dados,
  altura = 148,
  larguraMaxColuna = 44,
  formatarValor = (valor) => String(valor),
}: GraficoColunasProps) {
  const maior = Math.max(...dados.map((d) => d.valor), 1);
  const alturaBarras = altura - RESERVA_ROTULO;

  return (
    <div className="flex items-end gap-2">
      {dados.map((dado) => {
        const proporcao = dado.valor / maior;
        const alturaBarra =
          dado.valor > 0 ? Math.max(3, Math.round(alturaBarras * proporcao)) : 0;
        return (
          <div key={dado.rotulo} className="flex min-w-0 flex-1 flex-col items-center">
            <div
              className="flex w-full flex-col items-center justify-end"
              style={{ height: altura }}
            >
              <span
                className="text-xs font-medium text-ink-soft tabular-nums"
                style={{ height: RESERVA_ROTULO }}
              >
                {dado.valor > 0 ? formatarValor(dado.valor) : ""}
              </span>
              <div
                className={`w-full rounded-t-sm ${
                  dado.destaque ? "bg-brand" : "bg-brand/70"
                }`}
                style={{ height: alturaBarra, maxWidth: larguraMaxColuna }}
                title={`${dado.rotulo}: ${formatarValor(dado.valor)}`}
              />
            </div>
            <span className="mt-1.5 truncate text-[11px] leading-tight text-ink-muted">
              {dado.rotulo}
            </span>
          </div>
        );
      })}
    </div>
  );
}
