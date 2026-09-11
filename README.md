# Precifica.Plenna

Publicado em: https://precifica-plenna.vercel.app

Calculadora de precificação para peças impressas em 3D: informe os custos reais de
produção (material, energia, depreciação, mão de obra, custos fixos, embalagem), escolha
a margem de lucro e o app calcula o preço de venda correto, deixando explícita a diferença
entre **margem sobre a venda** e **markup sobre o custo**.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4, com Supabase (Postgres + Auth) para
perfis salvos, histórico e contas de usuário.

## Rodando localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env` (veja `.env.example`) com as credenciais do seu projeto Supabase:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm test` — testes unitários (Vitest)
- `npm run build` — build de produção (`dist/`)

## Deploy

O app é uma SPA estática (fala direto com o Supabase, sem backend próprio) — funciona em
qualquer host de site estático (Vercel, Netlify, Cloudflare Pages...).

1. Configure as mesmas variáveis de ambiente do `.env` no painel do serviço de hospedagem.
2. `vercel.json` (Vercel) e `public/_redirects` (Netlify) já cuidam do fallback de rotas da
   SPA (`/login`, `/nova`, etc. precisam sempre servir `index.html`).
3. Depois do primeiro deploy, adicione a URL de produção em **Supabase → Authentication →
   URL Configuration** (Site URL / Redirect URLs) — sem isso, os links de confirmação de
   e-mail e de redefinição de senha continuam apontando só para `localhost`.
