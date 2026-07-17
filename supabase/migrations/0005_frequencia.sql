-- Fase 3: jornada e frequencia.
--
-- Duas tabelas de proposito distinto:
--   ocorrencias  - eventos de frequencia sem carater de saude (faltas, atrasos,
--                  saidas antecipadas, folgas, ferias).
--   afastamentos - atestados e afastamentos, que carregam relacao com saude.
--                  Ficam em tabela separada (LGPD): quando houver papeis de
--                  acesso, esta tabela recebe politica restrita sem tocar no
--                  restante do modulo. Categoria e lista controlada; nenhum
--                  campo de texto livre para nao abrir porta a diagnosticos.

alter table colaboradores
  add column turno text check (turno in ('manha', 'tarde', 'noite'));

create table ocorrencias (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  tipo            text not null check (tipo in (
                    'falta_injustificada', 'falta_justificada', 'atraso',
                    'saida_antecipada', 'folga', 'ferias'
                  )),
  data_inicio     date not null,
  -- Nulo quando a ocorrencia dura um unico dia.
  data_fim        date check (data_fim >= data_inicio),
  -- Minutos perdidos: obrigatorio em atraso e saida antecipada, proibido no resto.
  minutos         integer check (minutos > 0),
  created_at      timestamptz not null default now(),

  constraint ocorrencias_minutos_por_tipo check (
    (tipo in ('atraso', 'saida_antecipada')) = (minutos is not null)
  ),
  -- Atraso e saida antecipada sao pontuais; nao formam periodo.
  constraint ocorrencias_periodo_por_tipo check (
    data_fim is null or tipo not in ('atraso', 'saida_antecipada')
  )
);

create index ocorrencias_colaborador_idx on ocorrencias (colaborador_id);
create index ocorrencias_data_idx on ocorrencias (data_inicio);

create table afastamentos (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  tipo            text not null check (tipo in ('atestado', 'afastamento')),
  categoria       text not null check (categoria in (
                    'doenca', 'acidente_trabalho', 'licenca_maternidade',
                    'licenca_paternidade', 'inss', 'acompanhamento_familiar',
                    'outro'
                  )),
  data_inicio     date not null,
  -- Data de retorno prevista; nula quando indeterminada.
  data_fim        date check (data_fim >= data_inicio),
  created_at      timestamptz not null default now()
);

create index afastamentos_colaborador_idx on afastamentos (colaborador_id);
create index afastamentos_data_idx on afastamentos (data_inicio);

alter table ocorrencias enable row level security;
alter table afastamentos enable row level security;

create policy "ocorrencias: acesso autenticado" on ocorrencias
  for all to authenticated using (true) with check (true);

-- Enquanto nao ha papeis, o acesso e o mesmo dos demais dados; a separacao
-- em tabela propria e o que permite restringir depois sem migracao de dados.
create policy "afastamentos: acesso autenticado" on afastamentos
  for all to authenticated using (true) with check (true);
