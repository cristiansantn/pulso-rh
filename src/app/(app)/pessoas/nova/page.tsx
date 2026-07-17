import { PageHeader } from "@/components/ui/page-header";
import { ColaboradorForm } from "@/components/pessoas/colaborador-form";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarCargos, listarSetores } from "@/lib/data/setores";
import { buscarVaga } from "@/lib/data/vagas";
import { cadastrarColaborador } from "../actions";

export default async function NovoColaboradorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; vaga?: string }>;
}) {
  const { erro, vaga: vagaId } = await searchParams;
  const [setores, cargos, colaboradores, vaga] = await Promise.all([
    listarSetores(),
    listarCargos(),
    listarColaboradores(),
    vagaId ? buscarVaga(vagaId) : Promise.resolve(null),
  ]);
  const gestores = colaboradores.filter((c) => c.status === "ativo");

  // So amarra o cadastro a vagas prontas para admitir; o resto cadastra normal.
  const vagaEmAdmissao =
    vaga && vaga.status === "aberta" && vaga.etapa === "proposta" ? vaga : null;

  return (
    <>
      <PageHeader
        titulo="Novo colaborador"
        descricao="Os dados demográficos são de preenchimento voluntário e usados apenas de forma agregada."
      />

      {vagaEmAdmissao && (
        <p className="mb-4 rounded-md bg-neutral-soft px-4 py-2.5 text-sm text-ink-soft">
          Este cadastro conclui a vaga de {vagaEmAdmissao.cargo?.nome} em{" "}
          {vagaEmAdmissao.setor?.nome}.
        </p>
      )}

      {erro === "obrigatorios" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Nome e matrícula são obrigatórios.
        </p>
      )}

      <ColaboradorForm
        action={cadastrarColaborador}
        setores={setores}
        cargos={cargos}
        gestores={gestores}
        vaga={vagaEmAdmissao ?? undefined}
        rotuloSubmit="Cadastrar"
        urlCancelar={vagaEmAdmissao ? `/vagas/${vagaEmAdmissao.id}` : "/pessoas"}
      />
    </>
  );
}
