/** Elementos de formulario com o estilo padrao do sistema. */

const CAMPO_BASE =
  "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm " +
  "placeholder:text-ink-muted focus:border-line-strong focus:outline-none " +
  "focus:ring-2 focus:ring-line";

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-soft">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={CAMPO_BASE} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={CAMPO_BASE} />;
}

/** Agrupa campos sob um titulo de secao (Dados pessoais, Dados profissionais...). */
export function Fieldset({
  legenda,
  descricao,
  children,
}: {
  legenda: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-line bg-panel p-6">
      <legend className="px-1 text-sm font-semibold">{legenda}</legend>
      {descricao && <p className="mb-4 text-xs text-ink-muted">{descricao}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </fieldset>
  );
}
