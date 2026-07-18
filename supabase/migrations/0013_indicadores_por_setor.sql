-- Indicadores por setor: o catalogo generico da loja (conversao, ticket medio,
-- NPS, SLA, planograma) sai; entram os indicadores que cada setor coleta de
-- fato, manualmente:
--
--   Ship From Store -> produtividade_hora
--   PD              -> pecas_remarcadas_hora, conclusao_dia
--   Picking         -> pecas_hora, execucao_setor_dia
--   Caixa           -> pay_realizados, pcj_realizados, seguros_vendidos
--
-- Lancamentos dos tipos antigos sao descartados: eram carga de demonstracao e
-- nao ha historico real a preservar. O vinculo indicador -> setor vive no
-- catalogo da aplicacao (tipos.ts), nao no banco.

alter table indicadores_mensais
  drop constraint indicadores_mensais_tipo_check;

delete from indicadores_mensais
where tipo not in (
  'produtividade_hora', 'pecas_remarcadas_hora', 'conclusao_dia',
  'pecas_hora', 'execucao_setor_dia',
  'pay_realizados', 'pcj_realizados', 'seguros_vendidos'
);

alter table indicadores_mensais
  add constraint indicadores_mensais_tipo_check check (tipo in (
    'produtividade_hora', 'pecas_remarcadas_hora', 'conclusao_dia',
    'pecas_hora', 'execucao_setor_dia',
    'pay_realizados', 'pcj_realizados', 'seguros_vendidos'
  ));
