-- ============================================================================
-- Pulso RH — Estrutura completa do banco de dados
-- ============================================================================
-- Arquivo consolidado de todas as migrações (0001 a 0014).
-- Execute no SQL Editor do Supabase para criar a estrutura do zero.
--
-- IMPORTANTE: este arquivo substitui a execução individual das migrações
-- 0001 a 0014. Não execute ambos.
-- ============================================================================


-- ============================================================================
-- 1. TABELAS BASE: setores, cargos, colaboradores
-- ============================================================================

create table setores (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null unique,
  headcount_planejado  integer not null default 0,
  created_at           timestamptz not null default now()
);

create table cargos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now()
);

create table colaboradores (
  id                      uuid primary key default gen_random_uuid(),
  matricula               text not null unique,
  nome                    text not null,

  -- Dados pessoais
  email                   text,
  telefone                text,
  data_nascimento         date,
  cidade                  text,
  bairro                  text,
  cep                     text,
  regiao                  text,
  tempo_deslocamento_min  integer,

  -- Dados demograficos (coleta voluntaria)
  genero                  text,
  pcd                     boolean not null default false,
  escolaridade            text,

  -- Dados profissionais
  setor_id                uuid references setores (id) on delete set null,
  cargo_id                uuid references cargos (id),
  gestor_id               uuid references colaboradores (id),
  data_admissao           date,
  tipo_contrato           text,
  jornada                 text,
  turno                   text check (turno in ('manha', 'tarde', 'noite')),
  escala                  text check (escala in ('5x2', '6x1')),
  folga_fixa              smallint check (folga_fixa between 0 and 6),
  status                  text not null default 'ativo'
                          check (status in ('ativo', 'afastado', 'ferias', 'desligado')),

  -- Desligamento
  data_desligamento       date,
  tipo_desligamento       text
    check (tipo_desligamento in ('voluntario', 'involuntario')),
  motivo_desligamento     text
    check (motivo_desligamento in (
      'salario', 'escala', 'gestao', 'distancia', 'nova_oportunidade',
      'desempenho', 'adaptacao', 'carreira', 'outro'
    )),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint colaboradores_desligamento_consistente check (
    status <> 'desligado'
    or (
      data_desligamento is not null
      and tipo_desligamento is not null
      and motivo_desligamento is not null
    )
  )
);

create index colaboradores_setor_idx on colaboradores (setor_id);
create index colaboradores_status_idx on colaboradores (status);


-- ============================================================================
-- 2. FREQUÊNCIA: ocorrências e afastamentos
-- ============================================================================

create table ocorrencias (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  tipo            text not null check (tipo in (
                    'falta_injustificada', 'falta_justificada', 'atraso',
                    'saida_antecipada', 'folga', 'ferias'
                  )),
  data_inicio     date not null,
  data_fim        date check (data_fim >= data_inicio),
  minutos         integer check (minutos > 0),
  created_at      timestamptz not null default now(),

  constraint ocorrencias_minutos_por_tipo check (
    (tipo in ('atraso', 'saida_antecipada')) = (minutos is not null)
  ),
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
  data_fim        date check (data_fim >= data_inicio),
  cid             text,
  medico          text,
  created_at      timestamptz not null default now()
);

create index afastamentos_colaborador_idx on afastamentos (colaborador_id);
create index afastamentos_data_idx on afastamentos (data_inicio);


-- ============================================================================
-- 3. VAGAS E RECRUTAMENTO
-- ============================================================================

create table vagas (
  id                          uuid primary key default gen_random_uuid(),
  setor_id                    uuid references setores (id) on delete set null,
  cargo_id                    uuid not null references cargos (id),
  turno                       text check (turno in ('manha', 'tarde', 'noite')),
  motivo                      text not null check (motivo in ('reposicao', 'expansao')),
  colaborador_substituido_id  uuid references colaboradores (id),
  gestor_solicitante_id       uuid references colaboradores (id),
  data_abertura               date not null,
  data_limite                 date check (data_limite >= data_abertura),
  etapa                       text not null default 'solicitacao' check (etapa in (
                                'solicitacao', 'aprovacao', 'divulgacao', 'triagem',
                                'entrevista', 'proposta', 'admissao'
                              )),
  status                      text not null default 'aberta' check (status in (
                                'aberta', 'concluida', 'cancelada'
                              )),
  data_fechamento             date check (data_fechamento >= data_abertura),
  admitido_colaborador_id     uuid references colaboradores (id),
  created_at                  timestamptz not null default now(),

  constraint vagas_substituido_por_motivo check (
    colaborador_substituido_id is null or motivo = 'reposicao'
  ),
  constraint vagas_fechamento_por_status check (
    (status = 'aberta') = (data_fechamento is null)
  ),
  constraint vagas_admitido_por_status check (
    (status = 'concluida') = (admitido_colaborador_id is not null)
  ),
  constraint vagas_admissao_encerra check (
    (etapa = 'admissao') = (status = 'concluida')
  )
);

create index vagas_setor_idx on vagas (setor_id);
create index vagas_status_idx on vagas (status);

create table vaga_eventos (
  id          uuid primary key default gen_random_uuid(),
  vaga_id     uuid not null references vagas (id) on delete cascade,
  etapa       text not null check (etapa in (
                'solicitacao', 'aprovacao', 'divulgacao', 'triagem',
                'entrevista', 'proposta', 'admissao'
              )),
  data        date not null,
  created_at  timestamptz not null default now(),

  constraint vaga_eventos_etapa_unica unique (vaga_id, etapa)
);

create index vaga_eventos_vaga_idx on vaga_eventos (vaga_id);


-- ============================================================================
-- 4. PERFORMANCE E PRODUTIVIDADE
-- ============================================================================

create table indicadores_mensais (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  competencia     text not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  tipo            text not null check (tipo in (
                    'produtividade_hora', 'pecas_remarcadas_hora', 'conclusao_dia',
                    'pecas_hora', 'execucao_setor_dia',
                    'pay_realizados', 'pcj_realizados', 'seguros_vendidos'
                  )),
  valor           numeric not null check (valor >= 0),
  created_at      timestamptz not null default now(),

  constraint indicadores_mensais_unico unique (colaborador_id, competencia, tipo)
);

create index indicadores_mensais_colaborador_idx on indicadores_mensais (colaborador_id);
create index indicadores_mensais_competencia_idx on indicadores_mensais (competencia);

create table avaliacoes (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  ciclo           text not null,
  performance     smallint not null check (performance between 1 and 3),
  potencial       smallint not null check (potencial between 1 and 3),
  created_at      timestamptz not null default now(),

  constraint avaliacoes_ciclo_unico unique (colaborador_id, ciclo)
);

create index avaliacoes_colaborador_idx on avaliacoes (colaborador_id);


-- ============================================================================
-- 5. PERFIL COMPORTAMENTAL (DISC)
-- ============================================================================

create table perfis_comportamentais (
  id               uuid primary key default gen_random_uuid(),
  colaborador_id   uuid not null references colaboradores (id),
  metodologia      text not null default 'disc' check (metodologia = 'disc'),
  fator_primario   text not null check (fator_primario in ('D', 'I', 'S', 'C')),
  fator_secundario text check (fator_secundario in ('D', 'I', 'S', 'C')),
  data_avaliacao   date not null,
  created_at       timestamptz not null default now(),

  constraint perfis_fatores_distintos check (
    fator_secundario is null or fator_secundario <> fator_primario
  ),
  constraint perfis_avaliacao_unica unique (colaborador_id, data_avaliacao)
);

create index perfis_comportamentais_colaborador_idx
  on perfis_comportamentais (colaborador_id);


-- ============================================================================
-- 6. TALENTOS E SUCESSÃO
-- ============================================================================

create table planos_sucessao (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  cargo_alvo_id   uuid not null references cargos (id),
  prontidao       text not null check (prontidao in ('pronto', '6_meses', '12_meses')),
  gaps            text[] not null default '{}',
  data_atualizacao date not null,
  created_at      timestamptz not null default now(),

  constraint planos_sucessao_pessoa_unica unique (colaborador_id),
  constraint planos_sucessao_gaps_validos check (
    gaps <@ array[
      'lideranca', 'gestao_pessoas', 'comunicacao', 'planejamento',
      'visao_negocio', 'conhecimento_tecnico', 'orientacao_resultado',
      'adaptabilidade'
    ]::text[]
  )
);

create index planos_sucessao_cargo_alvo_idx on planos_sucessao (cargo_alvo_id);


-- ============================================================================
-- 7. MOVIMENTAÇÕES (histórico de carreira)
-- ============================================================================

create table movimentacoes (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  tipo            text not null check (tipo in (
                    'promocao', 'transferencia', 'mudanca_turno'
                  )),
  data            date not null,
  de              text,
  para            text not null,
  created_at      timestamptz not null default now()
);

create index movimentacoes_colaborador_idx on movimentacoes (colaborador_id);


-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

alter table setores enable row level security;
alter table cargos enable row level security;
alter table colaboradores enable row level security;
alter table ocorrencias enable row level security;
alter table afastamentos enable row level security;
alter table vagas enable row level security;
alter table vaga_eventos enable row level security;
alter table indicadores_mensais enable row level security;
alter table avaliacoes enable row level security;
alter table perfis_comportamentais enable row level security;
alter table planos_sucessao enable row level security;
alter table movimentacoes enable row level security;

-- Setores: leitura + escrita
create policy "setores: leitura autenticada" on setores
  for select to authenticated using (true);
create policy "setores: escrita autenticada" on setores
  for insert to authenticated with check (true);
create policy "setores: atualizacao autenticada" on setores
  for update to authenticated using (true) with check (true);

-- Cargos: leitura + escrita
create policy "cargos: leitura autenticada" on cargos
  for select to authenticated using (true);
create policy "cargos: escrita autenticada" on cargos
  for insert to authenticated with check (true);

-- Demais tabelas: acesso completo para autenticados
create policy "colaboradores: acesso autenticado" on colaboradores
  for all to authenticated using (true) with check (true);
create policy "ocorrencias: acesso autenticado" on ocorrencias
  for all to authenticated using (true) with check (true);
create policy "afastamentos: acesso autenticado" on afastamentos
  for all to authenticated using (true) with check (true);
create policy "vagas: acesso autenticado" on vagas
  for all to authenticated using (true) with check (true);
create policy "vaga_eventos: acesso autenticado" on vaga_eventos
  for all to authenticated using (true) with check (true);
create policy "indicadores_mensais: acesso autenticado" on indicadores_mensais
  for all to authenticated using (true) with check (true);
create policy "avaliacoes: acesso autenticado" on avaliacoes
  for all to authenticated using (true) with check (true);
create policy "perfis_comportamentais: acesso autenticado" on perfis_comportamentais
  for all to authenticated using (true) with check (true);
create policy "planos_sucessao: acesso autenticado" on planos_sucessao
  for all to authenticated using (true) with check (true);
create policy "movimentacoes: acesso autenticado" on movimentacoes
  for all to authenticated using (true) with check (true);


-- ============================================================================
-- 9. DADOS INICIAIS (seed)
-- ============================================================================

insert into setores (nome, headcount_planejado) values
  ('VMO', 12),
  ('VM', 8),
  ('Caixa', 35),
  ('Reserva', 10),
  ('Operador de Loja', 10),
  ('Provadores', 4),
  ('Ship From Store', 5),
  ('PD (Precificação Dinâmica)', 4),
  ('Picking (Reposição)', 2);

insert into cargos (nome) values
  ('Operador de Caixa'),
  ('Vendedor'),
  ('Visual Merchandiser'),
  ('Assistente de Loja'),
  ('Analista Omnichannel'),
  ('Supervisor'),
  ('Coordenador'),
  ('Gerente'),
  ('Líder'),
  ('Operador de Loja'),
  ('Especialista VM');
