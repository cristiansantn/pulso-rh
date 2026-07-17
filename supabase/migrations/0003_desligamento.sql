-- Registro de desligamento.
--
-- O motivo e uma lista controlada de proposito: texto livre viraria porta de
-- entrada para dados sensiveis e inviabilizaria a agregacao no modulo de
-- Turnover (Fase 5).

alter table colaboradores
  add column data_desligamento date,
  add column tipo_desligamento text
    check (tipo_desligamento in ('voluntario', 'involuntario')),
  add column motivo_desligamento text
    check (motivo_desligamento in (
      'salario', 'escala', 'gestao', 'distancia', 'nova_oportunidade',
      'desempenho', 'adaptacao', 'carreira', 'outro'
    ));

-- Um desligamento so e valido com data, tipo e motivo preenchidos.
alter table colaboradores
  add constraint colaboradores_desligamento_consistente check (
    status <> 'desligado'
    or (
      data_desligamento is not null
      and tipo_desligamento is not null
      and motivo_desligamento is not null
    )
  );
