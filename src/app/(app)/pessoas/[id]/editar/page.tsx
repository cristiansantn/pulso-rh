import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ColaboradorForm } from "@/components/pessoas/colaborador-form";
import { buscarColaborador, listarColaboradores } from "@/lib/data/colaboradores";
import { listarCargos, listarSetores } from "@/lib/data/setores";
import { editarColaborador } from "../../actions";

export default async function EditarColaboradorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const [{ id }, { erro }] = await Promise.all([params, searchParams]);
  const [colaborador, setores, cargos, colaboradores] = await Promise.all([
    buscarColaborador(id),
    listarSetores(),
    listarCargos(),
    listarColaboradores(),
  ]);

  if (!colaborador) {
    notFound();
  }

  const gestores = colaboradores.filter(
    (c) => c.status === "ativo" && c.id !== id,
  );

  return (
    <>
      <PageHeader
        titulo="Editar associado"
        descricao={`${colaborador.nome} — matrícula ${colaborador.matricula}`}
      />

      {erro === "obrigatorios" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Nome e matrícula são obrigatórios.
        </p>
      )}

      <ColaboradorForm
        action={editarColaborador.bind(null, id)}
        colaborador={colaborador}
        setores={setores}
        cargos={cargos}
        gestores={gestores}
        rotuloSubmit="Salvar alterações"
        urlCancelar={`/pessoas/${id}`}
      />
    </>
  );
}
