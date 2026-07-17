-- Fase 6: performance e produtividade. Nesta fase o modulo e somente leitura:
-- os dados chegam por carga externa; formularios de lancamento entram depois.
--
--   indicadores_mensais - valor mensal de um indicador operacional por pessoa.
--                         Formato longo: os indicadores variam por setor e
--                         colunas fixas gerariam maioria de nulos.
--   avaliacoes          - performance x potencial (escala 1-3) por ciclo;
--                         base da matriz 9-box.

create table indicadores_mensais (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores (id),
  -- Competencia fechada; o dominio e o mes, nao uma data.
  competencia     text not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  tipo            text not null check (tipo in (
                    'pecas_hora', 'conversao', 'ticket_medio',
                    'nps', 'sla_no_prazo', 'execucao_planograma'
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
  -- Ciclo semestral no formato YYYY-SN (ex.: 2026-S1).
  ciclo           text not null,
  performance     smallint not null check (performance between 1 and 3),
  potencial       smallint not null check (potencial between 1 and 3),
  created_at      timestamptz not null default now(),

  constraint avaliacoes_ciclo_unico unique (colaborador_id, ciclo)
);

create index avaliacoes_colaborador_idx on avaliacoes (colaborador_id);

alter table indicadores_mensais enable row level security;
alter table avaliacoes enable row level security;

create policy "indicadores_mensais: acesso autenticado" on indicadores_mensais
  for all to authenticated using (true) with check (true);

create policy "avaliacoes: acesso autenticado" on avaliacoes
  for all to authenticated using (true) with check (true);
