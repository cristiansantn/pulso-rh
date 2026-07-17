# Roadmap do Projeto

Sistema de People Analytics para operacao de loja. A logica do produto segue a cadeia:

Pessoa > Lotacao > Jornada > Performance > Comportamento > Movimentacao > Recrutamento > Diagnostico > Decisao.

A ordem das fases foi definida por dependencia de dados: primeiro o cadastro (fonte de tudo),
depois os dados operacionais (frequencia, vagas, desligamentos) e por ultimo as camadas
analiticas (cockpit, alertas, insights), que so fazem sentido quando ha dados acumulados.

## Fase 0 — Fundacao

- [x] Scaffold Next.js (App Router, TypeScript, Tailwind)
- [x] Design system: tokens de cor, tipografia (Inter), icones (Phosphor)
- [x] Autenticacao (Supabase Auth) com modo demonstracao para desenvolvimento
- [x] Layout base: sidebar de navegacao, estrutura de paginas
- [x] Schema inicial do banco (setores, cargos, colaboradores)
- [x] Deploy inicial na Vercel (pulso-rh.vercel.app, deploy automatico via GitHub);
      projeto Supabase ainda pendente — em producao roda o modo demonstracao

## Fase 1 — Pessoas (Cadastro 360)

- [x] Listagem de colaboradores com busca e filtros (setor, cargo, turno, status)
- [x] Cadastro: dados pessoais, demograficos e profissionais
- [x] Ficha individual do colaborador
- [x] Edicao de colaborador
- [x] Desligamento com data, tipo e motivo controlado (alimenta o modulo de Turnover)
- [x] Reativacao / recontratacao de desligados (desfecho do fluxo de admissao da Fase 4;
      o registro do desligamento anterior e limpo ate existir o historico de passagens)
- [ ] Historico de promocoes e transferencias
- [ ] Escolaridade, cursos, certificacoes e idiomas
- [ ] Importacao em massa (CSV) para carga inicial

## Fase 2 — Estrutura da Operacao

- [x] Cadastro de setores com headcount planejado (criar e ajustar meta)
- [x] Mapa da operacao: planejado x ativos x afastados x ferias por setor
      (vagas por setor entram na Fase 4)
- [x] Pagina de detalhe do setor: KPIs, tempo medio de casa, composicao por cargo, equipe
- [x] Vinculo gestor > equipe (campo no cadastro; exibido na ficha e na equipe do setor)

## Fase 3 — Jornada e Frequencia

- [x] Registro de faltas, atrasos, folgas e ferias
- [x] Afastamentos e atestados (categorias controladas, acesso restrito — LGPD)
- [ ] Integracao com o sistema de ponto da loja (reduz o registro manual)
- [ ] Escala planejada x realizada
- [ ] Horas extras e banco de horas
- [x] Absenteismo por setor, dia da semana, turno e gestor

## Fase 4 — Vagas e Recrutamento

- [x] Cadastro de vagas (motivo, reposicao/expansao, gestor solicitante, meta de preenchimento)
- [x] Fluxo da vaga: solicitacao > aprovacao > divulgacao > triagem > entrevista > proposta > admissao
      (admissao cadastra colaborador novo ou recontrata desligado)
- [x] Indicadores: time to fill, tempo por etapa, vagas em atraso, vagas por setor no mapa

## Fase 5 — Turnover Intelligence

- [x] Registro de desligamentos com motivo declarado (fluxo da Fase 1)
- [x] Indice de saida geral, voluntario e involuntario, com serie mensal
      (rotulado como aproximacao sobre o quadro atual; turnover anualizado por
      headcount medio entra quando houver historico mensal de quadro)
- [x] Cortes: setor, gestor, turno, motivo, tempo de empresa, faixa etaria
- [x] Turnover precoce (30/90/180 dias)

## Fase 6 — Performance e Produtividade

- [ ] Indicadores por funcao (pecas/hora, conversao, NPS, ticket medio, SLA...)
- [ ] Visao por pessoa, equipe, setor, turno e gestor
- [ ] Matriz Performance x Potencial (9-box)

## Fase 7 — Perfil Comportamental

- [ ] Registro de perfis (DISC ou metodologia adotada), separado de performance
- [ ] Perfil predominante e secundario, estilos de comunicacao e decisao
- [ ] Mapa comportamental por equipe

## Fase 8 — Talentos e Sucessao

- [ ] Prontidao por pessoa (pronto agora / 6 meses / 12 meses / nao mapeado)
- [ ] Gaps de competencia e PDI
- [ ] Banco de sucessores por cargo

## Fase 9 — Cockpit e Alertas

- [ ] Home com indicadores consolidados (headcount, turnover, absenteismo, cobertura...)
- [ ] Graficos: planejado x realizado, turnover mensal, absenteismo por setor, demografia
- [ ] Motor de alertas: desvios em relacao a media (absenteismo, vagas em atraso, turnover precoce)

## Fase 10 — People Analytics e Health Score

- [ ] Central de insights: pergunta + evidencia + hipotese + acao sugerida
- [ ] People Health Score geral e por setor
- [ ] Relatorios exportaveis
      
## Questionamentos e Melhorias (Vale uma ponderação antes de serem executados e devem ser removidos da lista quando resolvidos ou respondidos)

## Ideias adicionais — (Ainda deve passar por validação)

- [ ] Ferias: Supervisores tem o seu proprio login, onde tem acesso a todos os seus associados, devem obrigatoriamente sinalizarem os dias refente as férias de cada um. Em um segundo tempo o mesmo aparece no portal do Gerente, onde é feita a aprovação ou rejeição. Em caso de aprovação a back é sinalizada, em caso de rejeição o supervisor é sinalizado.
- [ ] Atestados: Supervisores através do seu login devem registrar todos os atestados dos seus respectivos associados, preenchendo os campos obrigatorios, em casa de atestado digital anexar o arquivo correspondente.
- [ ] Período crítico: Automaticamente o sistema deve avisar se o associado está em periodo critico ou não.
- [ ] Contratação: Deve ser sinalizado se a cadeira do associado já foi utilizada para uma segunda contração ou não.

## Diretrizes permanentes

- LGPD: dados sensiveis (saude, diversidade) em tabelas separadas, acesso restrito,
  exibicao apenas agregada em dashboards. Coleta de diversidade sempre voluntaria.
- O sistema aponta correlacoes e hipoteses; nunca afirma causa automaticamente.
- Sem emojis na interface. Iconografia via Phosphor Icons.
- Cada fase entra em producao ao ser concluida — nada de big bang.
