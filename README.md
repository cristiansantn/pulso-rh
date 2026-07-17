# Pulso — People Analytics da Operação

Sistema de gestão de pessoas e analytics para operação de loja: cadastro 360 de
colaboradores, estrutura da operação, frequência, recrutamento, turnover e insights.

O escopo completo e a ordem de construção estão em [docs/ROADMAP.md](docs/ROADMAP.md).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + autenticação)
- Deploy na Vercel
- Iconografia: Phosphor Icons. Tipografia: Inter.

## Como rodar

```bash
npm install
npm run dev
```

Sem credenciais do Supabase, o sistema sobe em **modo demonstração**: login
simplificado e dados fictícios em memória (alterações não persistem). Útil para
desenvolvimento de interface e apresentações.

## Conectando ao Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Execute as migrações de `supabase/migrations/` no SQL Editor, em ordem.
3. Copie `.env.example` para `.env.local` e preencha com as credenciais do
   projeto (Project Settings > API).
4. Crie os usuários de acesso em Authentication > Users.

Com as variáveis presentes, o modo demonstração é desativado automaticamente e a
autenticação passa a ser feita pelo Supabase Auth.

## Estrutura

```
src/
  app/            Rotas (App Router). O grupo (app) exige autenticação.
  components/     Componentes de interface reutilizáveis.
  lib/
    auth/         Server actions de login e logout.
    data/         Repositórios de dados (Supabase ou modo demonstração).
    supabase/     Clientes e controle de sessão.
  proxy.ts        Proteção de rotas e renovação de sessão.
supabase/
  migrations/     Schema e carga inicial do banco.
docs/
  ROADMAP.md      Fases do projeto e diretrizes permanentes.
```
