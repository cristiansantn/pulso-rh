import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { DISC, FATORES_DISC } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";
import { registrarPerfilAction } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, fator primário e data.",
  fatores: "O fator secundário deve ser diferente do primário.",
  data: "A data da avaliação não pode ser no futuro.",
};

export default async function RegistrarPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const colaboradores = await listarColaboradores();
  const quadroAtual = colaboradores
    .filter((c) => c.status !== "desligado")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <Link
        href="/perfis"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Perfil Comportamental
      </Link>

      <PageHeader
        titulo="Registrar perfil"
        descricao="Resultado de um assessment DISC. Descreve estilo de trabalho, não desempenho. Cada registro é datado; reavaliar gera um novo sem apagar o histórico."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={registrarPerfilAction} className="max-w-3xl space-y-6">
        <Fieldset legenda="Perfil DISC">
          <div className="sm:col-span-2">
            <Label htmlFor="colaborador_id">Associado</Label>
            <Select id="colaborador_id" name="colaborador_id" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {quadroAtual.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.matricula}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fator_primario">Fator primário</Label>
            <Select id="fator_primario" name="fator_primario" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {FATORES_DISC.map((fator) => (
                <option key={fator} value={fator}>
                  {fator} — {DISC[fator].nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fator_secundario">Fator secundário</Label>
            <Select id="fator_secundario" name="fator_secundario" defaultValue="">
              <option value="">Nenhum (perfil puro)</option>
              {FATORES_DISC.map((fator) => (
                <option key={fator} value={fator}>
                  {fator} — {DISC[fator].nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="data_avaliacao">Data da avaliação</Label>
            <Input
              id="data_avaliacao"
              name="data_avaliacao"
              type="date"
              required
              defaultValue={hojeIso()}
              max={hojeIso()}
            />
          </div>
        </Fieldset>

        <div className="flex items-center gap-3">
          <BotaoEnviar className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-70">
            Registrar
          </BotaoEnviar>
          <Link
            href="/perfis"
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
