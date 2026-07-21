# Documentação do Sistema — People Analytics C&A (Pulso RH)

Guia de referência do sistema: arquitetura, modelo de dados, todas as funções
e, principalmente, **como cada indicador é calculado**. Escrito para estudo:
cada fórmula aparece com o racional por trás dela.

> Convenção: datas de domínio são sempre `date-only` no formato `YYYY-MM-DD`,
> comparadas como texto (a ordem lexicográfica coincide com a cronológica).

---

## 1. Arquitetura em uma página

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions).
- **Banco:** Supabase (PostgreSQL + PostgREST + Auth).
- **Estilo:** Tailwind, com tokens próprios (`bg-panel`, `text-ink-muted`, …).
- **Idioma do domínio:** português; nomes de campo espelham as colunas do banco.

### Fluxo de uma requisição

```
Navegador → proxy.ts (middleware) → updateSession()  ──┐
                                                       │  autentica / renova sessão
Página (Server Component) → funções data/ ─────────────┤
                                                       │  isSupabaseConfigured() ?
   ├─ SIM → consulta o Supabase                        │
   └─ NÃO → dados de demonstração em memória           │
Camada analytics/ recebe os dados e calcula ───────────┘
```

Nenhum cálculo vive no banco: as tabelas guardam **fatos** (uma falta, um
desligamento, um evento de vaga); todos os indicadores são derivados em
`src/lib/analytics/` a partir desses fatos, na renderização da página.

### Modo dual: Supabase x demonstração

Toda função de dados começa com `isSupabaseConfigured()` (arquivo
`src/lib/env.ts`), que retorna `true` só quando **ambas** as variáveis existem:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Sem elas, o sistema roda em **modo demonstração**: autenticação simplificada e
dados fictícios em memória (`src/lib/data/demo.ts`). Isso permite desenvolver e
apresentar sem provisionar banco. As páginas nunca sabem qual fonte está ativa.

> **Diferença importante entre os modos:** no demo, os ids de setor/cargo são
> *slugs* (`s-caixa`, `c-gerente`); no Supabase são **UUIDs**. Onde o código
> precisa amarrar algo a um setor/cargo específico, o vínculo é feito por
> **nome** (estável nos dois modos), não por id. Ver a seção 8 (Limitações).

### Autenticação e proxy

- `src/proxy.ts` — middleware que roda em toda rota (exceto assets). Delega para
  `updateSession()`.
- `src/lib/supabase/session.ts` — `updateSession()`:
  - **Sem Supabase:** verifica só o cookie de sessão demo (`demo_session`).
  - **Com Supabase:** cria o client SSR, chama `supabase.auth.getUser()` e
    redireciona: sem usuário → `/login`; com usuário na `/login` → `/`.
  - A chamada ao Supabase é envolvida em `try/catch`: uma falha (rede,
    credencial, cookie corrompido) é tratada como "sem sessão" em vez de
    derrubar todas as rotas com erro 500.
- `src/lib/auth/actions.ts` — Server Actions `login`, `loginDemo`, `logout` e
  `sessaoLocal`. Com Supabase, usa `signInWithPassword`. Sem Supabase, valida
  contra uma conta local opcional (variáveis `ACESSO_*`, senha guardada só como
  hash SHA-256).
- `src/app/(app)/error.tsx` — limite de erro: qualquer falha ao carregar dados
  nas páginas autenticadas vira uma tela legível com "Tentar novamente", em vez
  da tela genérica sem mensagem.

---

## 2. Modelo de domínio

Definido em `src/lib/data/tipos.ts`. Entidades principais e seus catálogos
(listas controladas — nunca texto livre, para permitir agregação e evitar
entrada de dados sensíveis).

### Colaborador
Cadastro central. Campos de destaque:
- `status`: `ativo | afastado | ferias | desligado`.
- `setor_id`, `cargo_id`, `gestor_id` (auto-relacionamento para o gestor).
- `escala`: `5x2 | 6x1`; `folga_fixa`: dia da semana (0=domingo … 6=sábado).
- `turno`: `manha | tarde | noite`.
- Desligamento: `data_desligamento`, `tipo_desligamento`
  (`voluntario | involuntario`) e `motivo_desligamento` (lista controlada:
  salário, escala, gestão, distância, nova oportunidade, desempenho, adaptação,
  carreira, outro).
- Dados sensíveis de saúde **não** ficam aqui (princípio LGPD).

### Setor e Cargo
- `Setor`: `nome`, `headcount_planejado`.
- `Cargo`: `nome`.

### Frequência (Fase 3)
Duas tabelas de propósito distinto:
- **Ocorrência** (`ocorrencias`): eventos sem caráter de saúde —
  `falta_injustificada`, `falta_justificada`, `atraso`, `saida_antecipada`,
  `folga`, `ferias`. `data_fim` nula = um único dia. `minutos` só em atraso e
  saída antecipada.
- **Afastamento** (`afastamentos`): atestados e afastamentos (relacionados a
  saúde, tabela separada por LGPD). `categoria` controlada. `cid` e `medico`
  opcionais, visíveis só na ficha. `data_fim` nula = retorno indeterminado.

### Vaga (Fase 4)
- Fluxo de 7 etapas: `solicitacao → aprovacao → divulgacao → triagem →
  entrevista → proposta → admissao` (`FLUXO_VAGA`).
- `motivo`: `reposicao | expansao`; `status`: `aberta | concluida | cancelada`.
- `data_limite`: meta de preenchimento; passou dela = vaga em atraso.
- **VagaEvento** (`vaga_eventos`): data de entrada em cada etapa. É desse
  histórico — e não da coluna `etapa` da vaga — que saem *time to fill* e SLA.

### Performance (Fase 6)
- **IndicadorMensal**: valor de um indicador operacional por pessoa e
  competência (`YYYY-MM`). Catálogo fechado `INDICADORES`, cada indicador
  vinculado ao **setor que o coleta** (por nome):

  | Indicador | Setor | Unidade | Formato |
  |---|---|---|---|
  | `produtividade_hora` | Ship From Store | peças/h | número |
  | `pecas_remarcadas_hora` | PD (Precificação Dinâmica) | peças/h | número |
  | `conclusao_dia` | PD (Precificação Dinâmica) | — | percentual |
  | `pecas_hora` | Picking (Reposição) | peças/h | número |
  | `execucao_setor_dia` | Picking (Reposição) | — | percentual |
  | `pay_realizados` | Caixa | — | número |
  | `pcj_realizados` | Caixa | — | número |
  | `seguros_vendidos` | Caixa | — | número |

  > Não existe "nota única" de produtividade: cada indicador só é comparável
  > com ele mesmo.

- **Avaliacao**: `performance` e `potencial`, ambos escala 1–3, por `ciclo`
  semestral (`YYYY-SN`, ex. `2026-S1`). Base da matriz 9-box.

### Perfil comportamental (Fase 7)
- **PerfilComportamental**: metodologia DISC. `fator_primario` e opcional
  `fator_secundario` (D, I, S, C). Reavaliações geram novos registros; as
  leituras usam o mais recente. Descreve **estilo de trabalho, nunca
  desempenho** — não produz nota nem ranking individual.

### Talentos e sucessão (Fase 8)
- **PlanoSucessao**: um por pessoa. `cargo_alvo_id`, `prontidao`
  (`pronto | 6_meses | 12_meses`) e `gaps` (competências a desenvolver, lista
  controlada `COMPETENCIAS`). Quem não tem plano conta como "não mapeado".

### Movimentação (histórico de carreira)
- **Movimentacao**: evento datado `de → para` (`promocao`, `transferencia`,
  `mudanca_turno`). Guarda o **texto** do estado da época, para a ficha
  continuar legível mesmo que cargo/setor seja renomeado depois.

---

## 3. Camada de dados (`src/lib/data/`)

Cada repositório expõe leituras e escritas; todas seguem o padrão dual
(Supabase ou demo). Erros do Supabase viram `throw new Error("Falha ao …")`,
capturados pelo limite de erro da página.

### `colaboradores.ts`
- `listarColaboradores(filtro?)` — lista com filtros (busca, setor, cargo,
  turno, status), ordenada por nome. Traz `setor` e `cargo` por *embedding*;
  o **gestor é resolvido em consulta separada** (`anexarGestores`), porque o
  auto-relacionamento `gestor_id → colaboradores` nem sempre é resolvido pelo
  *embedding* do PostgREST.
- `buscarColaborador(id)` — um registro (ou null).
- `criarColaborador(dados)` — insere e devolve o id.
- `atualizarColaborador(id, dados)` — atualiza campos editáveis.

### `setores.ts`
- `listarSetores()`, `buscarSetor(id)`, `listarCargos()`.
- `criarSetor(nome, headcount)`, `atualizarSetor(id, dados)`.
- `excluirSetor(id)` — desvincula colaboradores (`setor_id = null`) e então
  remove o setor. Vagas abertas devem ser resolvidas antes (checado na action).

### `frequencia.ts`
- `listarOcorrencias(filtro?)`, `listarAfastamentos(filtro?)` — filtro por
  colaborador e por `desde` (data mínima). `buscarAfastamento(id)`.
- `criarOcorrencia(dados)`, `criarAfastamento(dados)`.

### `vagas.ts`
- `listarVagas()`, `buscarVaga(id)`, `listarEventosVaga(vagaId?)`.
- `criarVaga(dados)` — abre em `solicitacao` e registra o primeiro evento.
- `avancarEtapa(id, data)` — move para a próxima etapa (ver `proximaEtapa`) e
  registra o evento datado.
- `concluirVaga(id, admitidoId, data)` — encerra com admissão, vinculando o
  colaborador admitido.
- `cancelarVaga(id, data)` — encerra sem admissão.

### `performance.ts`
- `listarIndicadoresMensais(filtro?)`, `listarAvaliacoes(filtro?)`.
- `registrarIndicadorMensal(dados)` — **upsert** por (colaborador, competência,
  tipo): relançar corrige o valor.
- `registrarAvaliacao(dados)` — upsert por (colaborador, ciclo).

### `comportamento.ts`, `talentos.ts`, `movimentacoes.ts`
- `listarPerfis(filtro?)` / `registrarPerfil(dados)`.
- `listarPlanosSucessao(filtro?)` / `salvarPlanoSucessao(dados)` (upsert por
  colaborador — um plano por pessoa).
- `listarMovimentacoes(filtro?)` / `registrarMovimentacao(dados)`.

---

## 4. Cálculos — Absenteísmo (`analytics/absenteismo.ts`)

**Conceito de dia perdido:** falta (justificada ou não), atestado ou
afastamento. Folgas e férias são ausências planejadas e **ficam de fora**
(`TIPOS_DIA_PERDIDO = ["falta_injustificada", "falta_justificada"]` +
todos os afastamentos).

### `diasDoPeriodo(periodo)`
Dias corridos, inclusive as duas pontas:
```
(fim − inicio) em dias  +  1
```

### `listarDiasPerdidos(ocorrencias, afastamentos, periodo)`
Expande cada registro em **dias individuais** dentro do período, preservando o
`colaborador_id`. Para cada registro:
- início efetivo = `max(registro.inicio, periodo.inicio)`;
- fim efetivo = `min(registro.fim, periodo.fim)`;
- em ocorrência, `data_fim` nula → um único dia;
- em afastamento, `data_fim` nula → conta até o fim do período (retorno
  indeterminado).

Retorna uma lista `{ colaborador_id, data }` — um item por dia perdido. É essa
lista, e seu tamanho, que alimenta todos os cortes (loja, setor, dia da semana).

### `taxaAbsenteismo(diasPerdidos, quadro, periodo)`
```
programados = quadro × diasDoPeriodo(periodo)
taxa (%)    = (diasPerdidos / programados) × 100
```
Retorna `null` quando não há quadro (`programados = 0`).

> **Aproximação assumida:** o denominador usa **dias corridos × quadro atual**,
> não dias efetivamente escalados. É honesto e rotulado como tal até a escala
> planejada×realizada existir. Sempre exiba a métrica deixando isso claro.

---

## 5. Cálculos — Turnover (`analytics/turnover.ts`)

### `desligadosDesde(colaboradores, desdeIso)`
Filtra `status = "desligado"` com `data_desligamento >= desdeIso`.

### `tempoDeCasaDias(colaborador)`
`data_desligamento − data_admissao`, em dias (null se faltar uma das datas).

### `indiceDeSaida(desligamentos, quadroAtual)`
```
índice (%) = (desligamentos / quadroAtual) × 100
```
> **Não é turnover anualizado** por headcount médio (que exigiria histórico
> mensal de quadro, ainda inexistente). É um **índice de saída** do período,
> rotulado como aproximação: saídas sobre o quadro **atual**.

### `turnoverPrecoce(desligados, limiteDias)`
Percentual das saídas (com tempo de casa conhecido) que ocorreram com até
`limiteDias` de casa:
```
precoce (%) = (nº de saídas com tenure ≤ limiteDias / nº de saídas com tenure) × 100
```

### `seriePorMes(desligados, meses)`
Série mensal dos últimos `meses` meses (inclusive o atual), cada mês com
contagem de `voluntarios` e `involuntarios`. Chave `YYYY-MM`.

### Faixas
- `faixaTempoDeCasa(dias)`: <90 / <180 / <365 / <730 / ≥730 dias →
  "Menos de 3 meses" … "Mais de 2 anos".
- `faixaEtaria(nascimento, referência)`: idade por `365.25` dias →
  18–24 / 25–34 / 35–44 / 45+.

---

## 6. Cálculos — Recrutamento (`analytics/recrutamento.ts`)

Todos derivam das datas de `vaga_eventos`; nada é estimado.

### `idadeVaga(vaga)`
`(data_fechamento ?? hoje) − data_abertura`, em dias.

### `vagaEmAtraso(vaga)`
`true` quando `status = "aberta"` **e** `data_limite < hoje`.

### `timeToFillMedio(vagas)`
Média, em dias, de `data_fechamento − data_abertura` das vagas **concluídas**
(null se não houver nenhuma). É o tempo médio abertura → admissão.

### `permanenciaPorEtapa(vaga, eventos)`
Ordena os eventos por data e, para cada etapa, calcula os dias até a etapa
seguinte; para a última etapa registrada, os dias até `data_fechamento ?? hoje`.
Base do SLA por etapa do funil.

---

## 7. Cálculos — indicadores derivados

### 7.1 Motor de alertas (`analytics/alertas.ts`)
Cada regra compara um recorte com uma referência (média da loja, meta ou
limiar) e só dispara quando o desvio é material. Todo alerta carrega a evidência
numérica e um link para investigar — **aponta o desvio, nunca conclui a causa**.

| Regra | Dispara quando | Severidade | Ruído filtrado |
|---|---|---|---|
| **Absenteísmo** | taxa do setor ≥ 1,5× a taxa da loja | `alta` se ≥ 2,5×, senão `media` | equipe ≥ 2 e ≥ 3 dias perdidos no setor |
| **Vaga em atraso** | `vagaEmAtraso` | `alta` se atraso > 15 dias | — |
| **Turnover precoce** | ≥ 2 saídas com ≤ 90 dias de casa (12 meses) no setor | `alta` se ≥ 3 | — |
| **Cobertura** | ocupação < 70% do headcount planejado | `alta` se < 50% | headcount planejado ≥ 3 |
| **Sucessão** | cargo-chave sem nenhum sucessor **pronto** | `alta` se sem banco algum | — |

Onde ocupação = `ativos / headcount_planejado`.
Ordenação final: severidade e depois categoria.
`resumoPorSeveridade` conta alertas por severidade (usado no cockpit).

### 7.2 Central de insights (`analytics/insights.ts`)
Um insight vai além do alerta: parte de uma **pergunta**, mostra a
**evidência**, arrisca uma **hipótese** (rotulada como tal — correlação não é
causa) e sugere uma **ação**.

- **Escala:** setor com ≥ 2 saídas voluntárias em 12 meses que compartilham o
  **mesmo motivo** e, quando aplicável, o **mesmo turno**, cruzado com o
  absenteísmo do setor concentrado em **domingos/segundas** (`getDay()` 0 ou 1).
  Prioridade `alta` se ≥ 3 saídas.
- **Turnover:** dispara se há ≥ 4 desligados em 12 meses **e** o turnover
  precoce (≤ 90 dias) ≥ 25%. Prioridade `alta` se ≥ 40%.
- **Cobertura:** setor com ocupação < 70% **e** com uma vaga de reposição em
  atraso — o ciclo "quadro reduzido → sobrecarga → mais saídas".
- **Sucessão:** cargo-chave ocupado sem sucessor pronto.

### 7.3 People Health Score (`analytics/saude.ts`)
Índice **direcional** (0–100) de saúde operacional, combinando três dimensões
objetivas, cada uma normalizada por regra explícita. Os pesos são escolha de
produto, declarados no código:

| Dimensão | Peso | Como vira 0–100 |
|---|---|---|
| **Presença** | 0,40 | `100 − (absenteísmo% − 2) × 10` → 100 até 2%, zera em 12% |
| **Retenção** | 0,35 | `100 − índiceSaída% × 0,8 − %precoce × 0,3` |
| **Cobertura** | 0,25 | `(ativos / planejado) × 100`, limitado a 100 |

Todos os scores passam por `clamp` (0–100, arredondado). O score final é a
**soma ponderada** `Σ(score × peso)`, arredondada.

Classificação: ≥ 80 `saudável` · ≥ 60 `atenção` · < 60 `crítico`.

- `saudeGeral` usa números consolidados da loja (não a média dos setores).
- `saudePorSetor` calcula por setor, ordenado do pior para o melhor score.
- Retenção é ancorada em **taxas**, não contagens, para ser comparável entre um
  setor pequeno e a loja inteira.

### 7.4 Performance / 9-box (`analytics/performance.ts`)
- `media(valores)`, `mediaPorTipo(registros)` — média por indicador.
- `serieMensal(registros, tipo, competencias)` — média do indicador por
  competência (com contagem de pessoas por ponto).
- **Matriz 9-box** (`QUADRANTES_9BOX`): chave `p{performance}-t{potencial}`
  (ambos 1–3), rotulada:

  | potencial ↓ / performance → | 1 | 2 | 3 |
  |---|---|---|---|
  | **3 (alto)** | Enigma | Crescimento | Estrela |
  | **2 (médio)** | Questionável | Mantenedor | Alta performance |
  | **1 (baixo)** | Insuficiente | Eficaz | Especialista |

  > A escala é 1–3 de propósito: o 9-box é 3×3; escala maior fingiria uma
  > precisão que a avaliação não tem.
- `formatarValorIndicador` exibe na unidade do próprio indicador (R$, %, ou
  sufixo) — nunca em nota composta.

### 7.5 Comportamento / DISC (`analytics/comportamento.ts`)
- `perfilAtualPorPessoa(perfis)` — o mais recente de cada pessoa (a lista chega
  ordenada por data desc, então basta o primeiro visto).
- `distribuicaoDisc(perfis)` — contagem e % de cada fator primário, na ordem
  D-I-S-C.
- `fatorPredominante(perfis)` — fator primário mais frequente; empate resolve
  pela ordem canônica.
- **Nada aqui gera nota, ranking ou recomendação individual** — só contagens e
  composição de grupos.

### 7.6 Talentos / sucessão (`analytics/talentos.ts`)
- `planoPorPessoa(planos)` — plano vigente de cada pessoa (mais recente por
  `data_atualizacao`).
- `bancoPorCargo(planos, pessoaPorId)` — sucessores agrupados por cargo-alvo,
  cada grupo ordenado por prontidão (pronto no topo); grupos ordenados por
  quantidade de candidatos. `temProntos` marca se há alguém pronto agora.
- `distribuicaoProntidao(planos)` — contagem por faixa (`pronto` / `6_meses` /
  `12_meses`).
- **É leitura de risco de cobertura, não ranking de pessoas.**

---

## 8. Datas e fuso (`src/lib/datas.ts`)

Todo "hoje" é o de **São Paulo** (`America/Sao_Paulo`), independente do fuso do
servidor — perto da meia-noite, o servidor em UTC já virou o dia enquanto a loja
não. Funções: `hojeIso()` (YYYY-MM-DD), `hojeData()`, `diasAtrasIso(n)`,
`primeiroDiaDoMesIso()`, `formatarIsoLocal(date)`, `formatarDataBr(iso)`.

---

## 9. Limitações conhecidas e pontos de atenção

1. **Absenteísmo usa dias corridos**, não a escala realmente cumprida. É uma
   aproximação assumida até o módulo de escala planejada×realizada existir.

2. **Índice de saída ≠ turnover anualizado.** Falta histórico mensal de quadro
   para o cálculo clássico por headcount médio.

3. **RLS uniforme.** Todas as tabelas liberam acesso total ao usuário
   autenticado; papéis granulares (ex.: gestor vê só a própria equipe) e
   restrição dos campos sensíveis (CID, médico) são fase posterior. A separação
   de afastamentos em tabela própria já prepara essa restrição sem migração.

4. **Vínculos por nome de setor e de cargo.** O catálogo `INDICADORES`
   aponta o setor dono por nome, e `CARGOS_CHAVE_NOMES` (em `tipos.ts`) define
   os cargos críticos de sucessão também por nome — os ids diferem entre demo
   (slugs) e Supabase (uuids), o nome é estável nos dois. Se um setor ou cargo
   desses for renomeado no banco, some dos filtros/alertas até o catálogo ser
   atualizado.

---

## 10. Onde está cada coisa

| Camada | Caminho |
|---|---|
| Middleware / sessão | `src/proxy.ts`, `src/lib/supabase/session.ts` |
| Auth | `src/lib/auth/actions.ts`, `src/lib/env.ts` |
| Cliente Supabase | `src/lib/supabase/server.ts` |
| Tipos e catálogos | `src/lib/data/tipos.ts` |
| Repositórios de dados | `src/lib/data/*.ts` |
| Dados de demonstração | `src/lib/data/demo.ts` |
| Cálculos / indicadores | `src/lib/analytics/*.ts` |
| Datas / fuso | `src/lib/datas.ts` |
| Páginas | `src/app/(app)/**/page.tsx` |
| Limite de erro | `src/app/(app)/error.tsx` |
| Migrações do banco | `supabase/migrations/*.sql` |
