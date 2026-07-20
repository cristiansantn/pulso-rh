/**
 * Utilitarios de data no fuso da operacao. As datas do dominio sao date-only
 * (YYYY-MM-DD) e o "hoje" e sempre o de Sao Paulo (horario de Brasilia),
 * independente do fuso do servidor — perto da meia-noite, o relogio do
 * servidor (UTC, em geral) ja virou o dia enquanto a loja ainda nao.
 */

export const FUSO_OPERACAO = "America/Sao_Paulo";

export function formatarIsoLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function hojeIso(): string {
  // O locale en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_OPERACAO }).format(
    new Date(),
  );
}

/** O dia de hoje em Sao Paulo como Date a meia-noite, para contas de calendario. */
export function hojeData(): Date {
  return new Date(`${hojeIso()}T00:00:00`);
}

export function diasAtrasIso(dias: number): string {
  const data = new Date(`${hojeIso()}T00:00:00`);
  data.setDate(data.getDate() - dias);
  return formatarIsoLocal(data);
}

export function primeiroDiaDoMesIso(): string {
  return `${hojeIso().slice(0, 7)}-01`;
}

export function formatarDataBr(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}
