/**
 * Utilitarios de data em fuso local. As datas do dominio sao date-only
 * (YYYY-MM-DD); usar toISOString aqui deslocaria o dia perto da meia-noite.
 */

export function formatarIsoLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function hojeIso(): string {
  return formatarIsoLocal(new Date());
}

export function diasAtrasIso(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return formatarIsoLocal(data);
}

export function primeiroDiaDoMesIso(): string {
  const hoje = new Date();
  return formatarIsoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

export function formatarDataBr(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}
