-- Carga inicial de dominio: setores da operacao e cargos base.
-- O headcount planejado e um ponto de partida e pode ser ajustado em Configuracoes.

insert into setores (nome, headcount_planejado) values
  ('VMO', 12),
  ('VM', 8),
  ('Caixa', 35),
  ('Processos', 10),
  ('Forrador', 6),
  ('Estoque', 8),
  ('Atendimento', 10),
  ('Provadores', 4),
  ('Omnichannel', 5),
  ('Lideranca', 6);

insert into cargos (nome) values
  ('Operador de Caixa'),
  ('Vendedor'),
  ('Visual Merchandiser'),
  ('Estoquista'),
  ('Forrador'),
  ('Assistente de Loja'),
  ('Analista Omnichannel'),
  ('Supervisor'),
  ('Coordenador'),
  ('Gerente');
