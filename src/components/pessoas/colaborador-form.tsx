import Link from "next/link";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import {
  DIAS_SEMANA,
  ESCALAS,
  ESCOLARIDADES,
  GENEROS,
  STATUS_LABELS,
  TIPOS_CONTRATO,
  TURNOS,
  type Cargo,
  type Colaborador,
  type Setor,
  type Vaga,
} from "@/lib/data/tipos";

interface ColaboradorFormProps {
  action: (formData: FormData) => Promise<void>;
  setores: Setor[];
  cargos: Cargo[];
  /** Colaboradores elegiveis como gestor direto (ativos, exceto a propria pessoa). */
  gestores: Colaborador[];
  /** Quando presente, o formulario preenche os campos para edicao. */
  colaborador?: Colaborador;
  /** Vaga que esta admissao conclui; pre-preenche setor, cargo e turno. */
  vaga?: Pick<Vaga, "id" | "setor_id" | "cargo_id" | "turno">;
  rotuloSubmit: string;
  urlCancelar: string;
}

/**
 * Formulario compartilhado de cadastro e edicao. O status "desligado" nao
 * aparece aqui: desligamento tem fluxo proprio, com data, tipo e motivo.
 */
export function ColaboradorForm({
  action,
  setores,
  cargos,
  gestores,
  colaborador,
  vaga,
  rotuloSubmit,
  urlCancelar,
}: ColaboradorFormProps) {
  const statusEditaveis = Object.entries(STATUS_LABELS).filter(
    ([valor]) => valor !== "desligado",
  );

  return (
    <form action={action} className="space-y-6">
      {vaga && <input type="hidden" name="vaga_id" value={vaga.id} />}
      <Fieldset legenda="Dados pessoais">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome completo *</Label>
          <Input id="nome" name="nome" required defaultValue={colaborador?.nome} />
        </div>
        <div>
          <Label htmlFor="matricula">Matrícula *</Label>
          <Input
            id="matricula"
            name="matricula"
            required
            defaultValue={colaborador?.matricula}
          />
        </div>
        <div>
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={colaborador?.data_nascimento ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            placeholder="(11) 90000-0000"
            defaultValue={colaborador?.telefone ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={colaborador?.email ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" name="cidade" defaultValue={colaborador?.cidade ?? undefined} />
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" name="bairro" defaultValue={colaborador?.bairro ?? undefined} />
        </div>
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            name="cep"
            placeholder="00000-000"
            defaultValue={colaborador?.cep ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="regiao">Região da cidade</Label>
          <Input
            id="regiao"
            name="regiao"
            placeholder="Zona Leste"
            defaultValue={colaborador?.regiao ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="tempo_deslocamento_min">Deslocamento até a loja (min)</Label>
          <Input
            id="tempo_deslocamento_min"
            name="tempo_deslocamento_min"
            type="number"
            min={0}
            defaultValue={colaborador?.tempo_deslocamento_min ?? undefined}
          />
        </div>
      </Fieldset>

      <Fieldset
        legenda="Dados demográficos"
        descricao="Preenchimento voluntário. Exibidos apenas de forma agregada nos indicadores."
      >
        <div>
          <Label htmlFor="genero">Gênero</Label>
          <Select id="genero" name="genero" defaultValue={colaborador?.genero ?? ""}>
            <option value="">Não informado</option>
            {GENEROS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="escolaridade">Escolaridade</Label>
          <Select
            id="escolaridade"
            name="escolaridade"
            defaultValue={colaborador?.escolaridade ?? ""}
          >
            <option value="">Não informado</option>
            {ESCOLARIDADES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="pcd"
              className="size-4 accent-ink"
              defaultChecked={colaborador?.pcd}
            />
            Pessoa com deficiência
          </label>
        </div>
      </Fieldset>

      <Fieldset legenda="Dados profissionais">
        <div>
          <Label htmlFor="setor_id">Setor</Label>
          <Select
            id="setor_id"
            name="setor_id"
            defaultValue={colaborador?.setor_id ?? vaga?.setor_id ?? ""}
          >
            <option value="">Selecione</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cargo_id">Cargo</Label>
          <Select
            id="cargo_id"
            name="cargo_id"
            defaultValue={colaborador?.cargo_id ?? vaga?.cargo_id ?? ""}
          >
            <option value="">Selecione</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="gestor_id">Gestor direto</Label>
          <Select id="gestor_id" name="gestor_id" defaultValue={colaborador?.gestor_id ?? ""}>
            <option value="">Sem gestor definido</option>
            {gestores.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="data_admissao">Data de admissão</Label>
          <Input
            id="data_admissao"
            name="data_admissao"
            type="date"
            defaultValue={colaborador?.data_admissao ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="tipo_contrato">Tipo de contrato</Label>
          <Select
            id="tipo_contrato"
            name="tipo_contrato"
            defaultValue={colaborador?.tipo_contrato ?? "CLT"}
          >
            {TIPOS_CONTRATO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="jornada">Jornada contratual</Label>
          <Input
            id="jornada"
            name="jornada"
            placeholder="180h"
            defaultValue={colaborador?.jornada ?? undefined}
          />
        </div>
        <div>
          <Label htmlFor="escala">Escala</Label>
          <Select
            id="escala"
            name="escala"
            defaultValue={colaborador ? (colaborador.escala ?? "") : "5x2"}
          >
            <option value="">Não definida</option>
            {Object.entries(ESCALAS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="folga_fixa">Folga fixa</Label>
          <Select
            id="folga_fixa"
            name="folga_fixa"
            defaultValue={
              colaborador?.folga_fixa != null ? String(colaborador.folga_fixa) : ""
            }
          >
            <option value="">Não definida</option>
            {Object.entries(DIAS_SEMANA).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-ink-muted">
            Dia de folga semanal da escala 5x2 (não precisa cair no fim de
            semana); base do planejamento automático de escala.
          </p>
        </div>
        <div>
          <Label htmlFor="turno">Turno</Label>
          <Select
            id="turno"
            name="turno"
            defaultValue={colaborador?.turno ?? vaga?.turno ?? ""}
          >
            <option value="">Não definido</option>
            {Object.entries(TURNOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Select>
        </div>
        {colaborador?.status === "desligado" ? (
          <div>
            <Label htmlFor="status">Status</Label>
            <p className="rounded-md bg-neutral-soft px-3 py-2 text-sm text-ink-muted">
              Desligado — não alterável pela edição
            </p>
            <input type="hidden" name="status" value="desligado" />
          </div>
        ) : (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={colaborador?.status ?? "ativo"}>
              {statusEditaveis.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
        >
          {rotuloSubmit}
        </button>
        <Link
          href={urlCancelar}
          className="rounded-md border border-line px-5 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
