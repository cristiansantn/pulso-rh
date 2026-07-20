-- Escala de trabalho no cadastro e detalhes da ficha do afastamento
-- (decisoes de produto de 2026-07-20).
--
-- Escala: na 5x2, padrao dos associados, cada pessoa tem 1 folga fixa em um
-- dia da semana (nao necessariamente sabado ou domingo), trabalha 9h48 por
-- dia e cumpre 2 domingos trabalhados para 1 domingo de folga. A folga fixa
-- registrada aqui e a base do planejamento automatico de escala dos proximos
-- incrementos.

alter table colaboradores
  add column escala text check (escala in ('5x2', '6x1')),
  -- Dia da semana da folga fixa (0 = domingo ... 6 = sabado).
  add column folga_fixa smallint check (folga_fixa between 0 and 6);

-- Detalhes clinicos do afastamento/atestado: CID e medico emissor, opcionais.
-- Aparecem apenas na ficha do registro; quando houver papeis de acesso, a
-- tabela inteira recebe politica restrita (LGPD) sem migracao de dados.
alter table afastamentos
  add column cid text,
  add column medico text;
