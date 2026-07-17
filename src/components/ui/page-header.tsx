interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  children?: React.ReactNode;
}

/** Cabecalho padrao das paginas: titulo, descricao e acoes a direita. */
export function PageHeader({ titulo, descricao, children }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && (
          <p className="mt-1 text-sm text-ink-muted">{descricao}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
