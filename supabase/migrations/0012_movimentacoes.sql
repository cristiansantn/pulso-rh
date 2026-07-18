-- Fase 1: historico de carreira (promocoes e transferencias). Cada linha e um
-- evento na trajetoria da pessoa: a transicao "de -> para" no momento em que
-- aconteceu.
--
-- Os rotulos de origem e destino ficam como texto de proposito: a ficha e um
-- historico e precisa continuar legivel mesmo que o cargo ou setor seja
-- renomeado depois. E um registro do que era verdade naquela data, nao uma
-- referencia viva.

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

alter table movimentacoes enable row level security;

create policy "movimentacoes: acesso autenticado" on movimentacoes
  for all to authenticated using (true) with check (true);
