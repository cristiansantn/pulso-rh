-- A Fase 2 introduz gestao de setores pela interface (criar e ajustar
-- headcount planejado), o que exige politicas de escrita nas tabelas de
-- dominio - a migration 0001 so liberava leitura.

create policy "setores: escrita autenticada" on setores
  for insert to authenticated with check (true);

create policy "setores: atualizacao autenticada" on setores
  for update to authenticated using (true) with check (true);

create policy "cargos: escrita autenticada" on cargos
  for insert to authenticated with check (true);
