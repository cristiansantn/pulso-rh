import {
  listarDiasPerdidos,
  taxaAbsenteismo,
  type Periodo,
} from "@/lib/analytics/absenteismo";
import { desligadosDesde, tempoDeCasaDias } from "@/lib/analytics/turnover";
import { diasAtrasIso } from "@/lib/datas";
import type {
  Afastamento,
  Colaborador,
  Ocorrencia,
  Setor,
} from "@/lib/data/tipos";

/**
 * People Health Score. Um indice DIRECIONAL de saude operacional, nunca um
 * veredito: combina tres dimensoes objetivas — presenca, retencao e cobertura
 * — cada uma normalizada para 0-100 por regras explicitas e exibidas abertas,
 * para que ninguem trate o numero como caixa-preta. Os pesos sao uma escolha
 * de produto, nao uma verdade estatistica; por isso ficam declarados aqui.
 */

export type ChaveDimensao = "presenca" | "retencao" | "cobertura";

export interface DimensaoSaude {
  chave: ChaveDimensao;
  rotulo: string;
  score: number;
  peso: number;
  detalhe: string;
}

export type ClassificacaoSaude = "saudavel" | "atencao" | "critico";

export interface SaudeGrupo {
  score: number;
  classificacao: ClassificacaoSaude;
  dimensoes: DimensaoSaude[];
  pessoas: number;
}

export interface SaudeSetor extends SaudeGrupo {
  setorId: string;
  setorNome: string;
}

const PESOS: Record<ChaveDimensao, number> = {
  presenca: 0.4,
  retencao: 0.35,
  cobertura: 0.25,
};

const ROTULOS: Record<ChaveDimensao, string> = {
  presenca: "Presença",
  retencao: "Retenção",
  cobertura: "Cobertura",
};

function clamp(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)));
}

/** Absenteismo <=2% vale 100; cai linearmente ate zerar em 12%. */
function scorePresenca(taxa: number | null): number {
  if (taxa === null) return 100;
  return clamp(100 - (taxa - 2) * 10);
}

/**
 * Retencao ancorada em taxas, nao em contagens: penaliza pelo indice de saida
 * (saidas sobre o quadro atual) e pela parcela de saidas precoces. Assim a nota
 * e comparavel entre um setor pequeno e a loja inteira — contagens absolutas
 * zerariam qualquer grupo grande.
 */
function scoreRetencao(
  saidas12m: number,
  quadro: number,
  precoces12m: number,
): number {
  const taxaSaida = quadro > 0 ? (saidas12m / quadro) * 100 : 0;
  const pctPrecoce = saidas12m > 0 ? (precoces12m / saidas12m) * 100 : 0;
  return clamp(100 - taxaSaida * 0.8 - pctPrecoce * 0.3);
}

/** Quadro ativo sobre o headcount planejado, limitado a 100. */
function scoreCobertura(ativos: number, planejado: number): number {
  if (planejado <= 0) return 100;
  return clamp((ativos / planejado) * 100);
}

function classificar(score: number): ClassificacaoSaude {
  if (score >= 80) return "saudavel";
  if (score >= 60) return "atencao";
  return "critico";
}

export const CLASSIFICACAO_LABEL: Record<ClassificacaoSaude, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
};

function umDecimal(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

function montarDimensoes(
  presenca: { score: number; taxa: number | null },
  retencao: { score: number; saidas: number; precoces: number },
  cobertura: { score: number; ativos: number; planejado: number },
): DimensaoSaude[] {
  return [
    {
      chave: "presenca",
      rotulo: ROTULOS.presenca,
      score: presenca.score,
      peso: PESOS.presenca,
      detalhe:
        presenca.taxa === null
          ? "Sem quadro para calcular"
          : `Absenteísmo de ${umDecimal(presenca.taxa)}% no período`,
    },
    {
      chave: "retencao",
      rotulo: ROTULOS.retencao,
      score: retencao.score,
      peso: PESOS.retencao,
      detalhe: `${retencao.saidas} ${
        retencao.saidas === 1 ? "saída" : "saídas"
      } em 12 meses${retencao.precoces > 0 ? `, ${retencao.precoces} precoce(s)` : ""}`,
    },
    {
      chave: "cobertura",
      rotulo: ROTULOS.cobertura,
      score: cobertura.score,
      peso: PESOS.cobertura,
      detalhe: `${cobertura.ativos} de ${cobertura.planejado} posições planejadas`,
    },
  ];
}

function combinar(dimensoes: DimensaoSaude[]): number {
  return Math.round(
    dimensoes.reduce((soma, d) => soma + d.score * d.peso, 0),
  );
}

export interface DadosSaude {
  colaboradores: Colaborador[];
  setores: Setor[];
  ocorrencias: Ocorrencia[];
  afastamentos: Afastamento[];
  periodo: Periodo;
}

/** Saude geral da loja, a partir dos numeros consolidados (nao da media dos setores). */
export function saudeGeral(dados: DadosSaude): SaudeGrupo {
  const { colaboradores, setores, ocorrencias, afastamentos, periodo } = dados;
  const quadro = colaboradores.filter((c) => c.status !== "desligado");
  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const taxa = taxaAbsenteismo(diasPerdidos.length, quadro.length, periodo);

  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));
  const precoces = desligados12m.filter((c) => {
    const dias = tempoDeCasaDias(c);
    return dias !== null && dias <= 90;
  }).length;

  const ativos = quadro.filter((c) => c.status === "ativo").length;
  const planejado = setores.reduce((t, s) => t + s.headcount_planejado, 0);

  const dimensoes = montarDimensoes(
    { score: scorePresenca(taxa), taxa },
    {
      score: scoreRetencao(desligados12m.length, quadro.length, precoces),
      saidas: desligados12m.length,
      precoces,
    },
    { score: scoreCobertura(ativos, planejado), ativos, planejado },
  );
  const score = combinar(dimensoes);

  return { score, classificacao: classificar(score), dimensoes, pessoas: quadro.length };
}

/** Saude de cada setor, ordenada do pior para o melhor score. */
export function saudePorSetor(dados: DadosSaude): SaudeSetor[] {
  const { colaboradores, setores, ocorrencias, afastamentos, periodo } = dados;
  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));

  return setores
    .map((setor) => {
      const equipe = colaboradores.filter(
        (c) => c.setor_id === setor.id && c.status !== "desligado",
      );
      const idsEquipe = new Set(equipe.map((c) => c.id));
      const perdidos = diasPerdidos.filter((d) =>
        idsEquipe.has(d.colaborador_id),
      ).length;
      const taxa = taxaAbsenteismo(perdidos, equipe.length, periodo);

      const saidasSetor = desligados12m.filter((c) => c.setor_id === setor.id);
      const precoces = saidasSetor.filter((c) => {
        const dias = tempoDeCasaDias(c);
        return dias !== null && dias <= 90;
      }).length;

      const ativos = equipe.filter((c) => c.status === "ativo").length;

      const dimensoes = montarDimensoes(
        { score: scorePresenca(taxa), taxa },
        {
          score: scoreRetencao(saidasSetor.length, equipe.length, precoces),
          saidas: saidasSetor.length,
          precoces,
        },
        {
          score: scoreCobertura(ativos, setor.headcount_planejado),
          ativos,
          planejado: setor.headcount_planejado,
        },
      );
      const score = combinar(dimensoes);

      return {
        setorId: setor.id,
        setorNome: setor.nome,
        score,
        classificacao: classificar(score),
        dimensoes,
        pessoas: equipe.length,
      };
    })
    .sort((a, b) => a.score - b.score || a.setorNome.localeCompare(b.setorNome));
}
