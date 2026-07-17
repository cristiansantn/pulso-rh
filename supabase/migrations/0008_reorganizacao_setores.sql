-- Reorganizacao da estrutura (2026-07-16):
-- - Especialistas VM passam a ser lotados no setor VM (o cargo permanece);
-- - Lideranca deixa de ser setor (lideres e supervisores ficam nas areas);
-- - Processos e renomeado para Reserva;
-- - Nasce o time de Picking (Reposicao);
-- - Exclusao de setor passa a deixar os vinculados sem setor definido.

update setores set nome = 'Reserva' where nome = 'Processos';

insert into setores (nome, headcount_planejado)
values ('Picking (Reposição)', 2);

update colaboradores
   set setor_id = (select id from setores where nome = 'VM')
 where setor_id in (select id from setores where nome = 'Especialista VM');
delete from setores where nome = 'Especialista VM';

-- A lotacao correta de cada lider e feita pela interface; aqui apenas
-- desvincula para o setor poder ser removido.
update colaboradores
   set setor_id = null
 where setor_id in (select id from setores where nome = 'Liderança');
delete from setores where nome = 'Liderança';

-- Excluir um setor nao pode orfanar registros: colaboradores e vagas ficam
-- sem setor definido (a interface ja exibe "Sem setor" / "Setor removido").
alter table colaboradores drop constraint colaboradores_setor_id_fkey;
alter table colaboradores add constraint colaboradores_setor_id_fkey
  foreign key (setor_id) references setores (id) on delete set null;

alter table vagas alter column setor_id drop not null;
alter table vagas drop constraint vagas_setor_id_fkey;
alter table vagas add constraint vagas_setor_id_fkey
  foreign key (setor_id) references setores (id) on delete set null;
