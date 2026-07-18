-- Fase 8: talentos e sucessao. Nesta fase o modulo e somente leitura: os
-- planos chegam por carga externa; a manutencao pela interface entra depois.
--
--   planos_sucessao - plano de sucessao de uma pessoa: o cargo para o qual ela
--                     e preparada, a prontidao e os gaps de competencia que o
--                     PDI precisa fechar. Um plano por pessoa; quem nao tem
--                     plano conta como "nao mapeado".
--
-- Os gaps ficam num array com dominio fechado (check por containment) em vez
-- de tabela propria: a lista e curta, sempre lida junto do plano e nunca
-- consultada isoladamente — uma tabela ligada so acrescentaria juncao.

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

alter table planos_sucessao enable row level security;

create policy "planos_sucessao: acesso autenticado" on planos_sucessao
  for all to authenticated using (true) with check (true);
