-- Ajusta a estrutura ao contexto real da loja:
--   Atendimento  -> Operador de Loja (renomeado)
--   Omnichannel  -> Ship From Store (renomeado)
--   Estoque      -> extinto; pessoas vao para Processos
--   Forrador     -> extinto; pessoas vao para Processos
--   Novos setores: PD (Precificacao Dinamica) e Especialista VM
--   Novos cargos: Lider, Operador de Loja, Especialista VM

update setores set nome = 'Operador de Loja' where nome = 'Atendimento';
update setores set nome = 'Ship From Store' where nome = 'Omnichannel';

update colaboradores
   set setor_id = (select id from setores where nome = 'Processos')
 where setor_id in (select id from setores where nome in ('Estoque', 'Forrador'));

delete from setores where nome in ('Estoque', 'Forrador');

insert into setores (nome, headcount_planejado) values
  ('PD (Precificação Dinâmica)', 4),
  ('Especialista VM', 4);

insert into cargos (nome) values
  ('Líder'),
  ('Operador de Loja'),
  ('Especialista VM');

-- Cargos das areas extintas migram para Operador de Loja; o ajuste fino de
-- funcao e feito pessoa a pessoa na edicao do cadastro.
update colaboradores
   set cargo_id = (select id from cargos where nome = 'Operador de Loja')
 where cargo_id in (select id from cargos where nome in ('Estoquista', 'Forrador'));

delete from cargos where nome in ('Estoquista', 'Forrador');
