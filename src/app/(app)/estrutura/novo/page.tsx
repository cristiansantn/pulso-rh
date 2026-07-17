import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Input, Label } from "@/components/ui/form";
import { cadastrarSetor } from "../actions";

export default async function NovoSetorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <>
      <PageHeader
        titulo="Novo setor"
        descricao="O headcount planejado define a meta de ocupação usada nos indicadores."
      />

      {erro === "invalido" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Informe um nome e um headcount planejado válido (número inteiro, zero ou mais).
        </p>
      )}

      <form
        action={cadastrarSetor}
        className="max-w-md space-y-4 rounded-lg border border-line bg-panel p-6"
      >
        <div>
          <Label htmlFor="nome">Nome do setor *</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div>
          <Label htmlFor="headcount_planejado">Headcount planejado *</Label>
          <Input
            id="headcount_planejado"
            name="headcount_planejado"
            type="number"
            min={0}
            required
            defaultValue={0}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
          >
            Criar setor
          </button>
          <Link
            href="/estrutura"
            className="rounded-md border border-line px-5 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
