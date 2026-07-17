/**
 * Esqueleto exibido durante a troca de rota, enquanto a pagina seguinte e
 * renderizada no servidor. Evita a sensacao de travamento nas transicoes.
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="mb-2 h-7 w-56 rounded-md bg-neutral-soft" />
      <div className="mb-8 h-4 w-96 max-w-full rounded-md bg-neutral-soft/70" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div
            key={indice}
            className="rounded-lg border border-line bg-panel p-5"
          >
            <div className="h-3 w-24 rounded bg-neutral-soft" />
            <div className="mt-3 h-7 w-16 rounded bg-neutral-soft" />
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <div className="h-4 w-40 rounded bg-neutral-soft" />
        </div>
        <div className="space-y-4 px-6 py-5">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div key={indice} className="flex items-center gap-6">
              <div className="h-3.5 w-1/4 rounded bg-neutral-soft" />
              <div className="h-3.5 w-1/5 rounded bg-neutral-soft/70" />
              <div className="h-3.5 w-1/6 rounded bg-neutral-soft/70" />
              <div className="h-3.5 flex-1 rounded bg-neutral-soft/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
