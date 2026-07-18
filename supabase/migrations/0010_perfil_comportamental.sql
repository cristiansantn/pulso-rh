-- Fase 7: perfil comportamental (DISC). Registro separado de performance por
-- principio: perfil descreve estilo de trabalho, nao desempenho, e nao entra
-- em avaliacao. Nesta fase o modulo e somente leitura: os registros chegam
-- por carga externa; aplicacao e lancamento pela interface entram depois.
--
-- Reavaliacoes geram novos registros (um por data); as leituras usam o mais
-- recente de cada pessoa.

create table perfis_comportamentais (
  id               uuid primary key default gen_random_uuid(),
  colaborador_id   uuid not null references colaboradores (id),
  -- Metodologia adotada; hoje apenas DISC, a coluna antecipa a troca.
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

alter table perfis_comportamentais enable row level security;

create policy "perfis_comportamentais: acesso autenticado" on perfis_comportamentais
  for all to authenticated using (true) with check (true);
