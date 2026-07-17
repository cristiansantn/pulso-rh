-- Esquema inicial: estrutura organizacional e cadastro de colaboradores.
--
-- Nota LGPD: dados sensiveis (saude, diversidade alem do basico) NAO ficam nesta
-- tabela. Serao modelados em tabelas separadas, com acesso restrito por papel,
-- quando os modulos correspondentes forem implementados.

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

  -- Dados pessoais. Endereco completo foi omitido de proposito: para analise,
  -- bairro, regiao e tempo de deslocamento sao suficientes (minimizacao de dados).
  email                   text,
  telefone                text,
  data_nascimento         date,
  cidade                  text,
  bairro                  text,
  cep                     text,
  regiao                  text,
  tempo_deslocamento_min  integer,

  -- Dados demograficos basicos (coleta voluntaria).
  genero                  text,
  pcd                     boolean not null default false,
  escolaridade            text,

  -- Dados profissionais.
  setor_id                uuid references setores (id),
  cargo_id                uuid references cargos (id),
  gestor_id               uuid references colaboradores (id),
  data_admissao           date,
  tipo_contrato           text,
  jornada                 text,
  status                  text not null default 'ativo'
                          check (status in ('ativo', 'afastado', 'ferias', 'desligado')),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index colaboradores_setor_idx on colaboradores (setor_id);
create index colaboradores_status_idx on colaboradores (status);

-- Row Level Security: apenas usuarios autenticados acessam os dados.
-- Papeis mais granulares (ex.: gestor ve apenas a propria equipe) entram em fase posterior.

alter table setores enable row level security;
alter table cargos enable row level security;
alter table colaboradores enable row level security;

create policy "setores: leitura autenticada" on setores
  for select to authenticated using (true);

create policy "cargos: leitura autenticada" on cargos
  for select to authenticated using (true);

create policy "colaboradores: acesso autenticado" on colaboradores
  for all to authenticated using (true) with check (true);
