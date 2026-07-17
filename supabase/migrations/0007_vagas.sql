-- Fase 4: vagas e recrutamento.
--
--   vagas        - a vaga em si, com motivo, solicitante e situacao atual.
--   vaga_eventos - data de entrada em cada etapa do fluxo. E deste historico
--                  que saem time to fill e SLA por etapa; a coluna etapa em
--                  vagas guarda apenas a posicao atual.

create table vagas (
  id                          uuid primary key default gen_random_uuid(),
  setor_id                    uuid not null references setores (id),
  cargo_id                    uuid not null references cargos (id),
  turno                       text check (turno in ('manha', 'tarde', 'noite')),
  motivo                      text not null check (motivo in ('reposicao', 'expansao')),
  -- Desligado que a vaga repoe; so faz sentido em reposicao.
  colaborador_substituido_id  uuid references colaboradores (id),
  gestor_solicitante_id       uuid references colaboradores (id),
  data_abertura               date not null,
  -- Meta de preenchimento; vaga aberta alem desta data conta como em atraso.
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

  -- O fluxo nao volta etapa; cada uma acontece no maximo uma vez por vaga.
  constraint vaga_eventos_etapa_unica unique (vaga_id, etapa)
);

create index vaga_eventos_vaga_idx on vaga_eventos (vaga_id);

alter table vagas enable row level security;
alter table vaga_eventos enable row level security;

create policy "vagas: acesso autenticado" on vagas
  for all to authenticated using (true) with check (true);

create policy "vaga_eventos: acesso autenticado" on vaga_eventos
  for all to authenticated using (true) with check (true);
