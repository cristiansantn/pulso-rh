interface FatiaDonut {
  rotulo: string;
  valor: number;
  /** Cor da fatia como valor CSS (ex.: "var(--color-positive)"). */
  cor: string;
  opacidade?: number;
}

interface GraficoDonutProps {
  fatias: FatiaDonut[];
  valorCentral?: string | number;
  rotuloCentral?: string;
  tamanho?: number;
  espessura?: number;
}

/**
 * Donut de parte-sobre-o-todo (ate 6 fatias), renderizado no servidor. Um vao
 * de 2px na cor da superficie separa as fatias. O centro carrega o total e a
 * legenda traz rotulo, valor e participacao — a cor fica na marca, nunca no texto.
 */
export function GraficoDonut({
  fatias,
  valorCentral,
  rotuloCentral,
  tamanho = 168,
  espessura = 20,
}: GraficoDonutProps) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const vao = total > 0 ? 2 : 0;

  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
          <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
            <circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              fill="none"
              stroke="var(--color-neutral-soft)"
              strokeWidth={espessura}
            />
            {total > 0 &&
              fatias.map((fatia) => {
                if (fatia.valor <= 0) return null;
                const comprimento = (fatia.valor / total) * circunferencia;
                const visivel = Math.max(0, comprimento - vao);
                const traco = (
                  <circle
                    key={fatia.rotulo}
                    cx={tamanho / 2}
                    cy={tamanho / 2}
                    r={raio}
                    fill="none"
                    stroke={fatia.cor}
                    strokeOpacity={fatia.opacidade ?? 1}
                    strokeWidth={espessura}
                    strokeDasharray={`${visivel} ${circunferencia - visivel}`}
                    strokeDashoffset={-acumulado}
                  >
                    <title>{`${fatia.rotulo}: ${fatia.valor} (${Math.round(
                      (fatia.valor / total) * 100,
                    )}%)`}</title>
                  </circle>
                );
                acumulado += comprimento;
                return traco;
              })}
          </g>
        </svg>
        {(valorCentral !== undefined || rotuloCentral) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {valorCentral !== undefined && (
              <span className="text-3xl font-semibold tracking-tight">{valorCentral}</span>
            )}
            {rotuloCentral && (
              <span className="mt-0.5 text-xs text-ink-muted">{rotuloCentral}</span>
            )}
          </div>
        )}
      </div>

      <ul className="w-full space-y-2.5">
        {fatias.map((fatia) => (
          <li key={fatia.rotulo} className="flex items-center gap-2.5 text-sm">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: fatia.cor, opacity: fatia.opacidade ?? 1 }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{fatia.rotulo}</span>
            <span className="font-medium tabular-nums">{fatia.valor}</span>
            <span className="w-9 text-right text-xs text-ink-muted tabular-nums">
              {total > 0 ? `${Math.round((fatia.valor / total) * 100)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
