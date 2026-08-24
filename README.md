# ComandaGO

Plataforma multi-tenant de pedidos para restaurantes. Contexto completo do
produto em [`BRIEFING.md`](./BRIEFING.md).

## Estrutura (DDD-lite)

```
src/
  domain/          entidades e tipos puros (sem dependência de framework)
  application/      portas (interfaces de repositório) consumidas pelo domínio
  infrastructure/    cliente Supabase, tipos gerados do banco
  presentation/       componentes de UI compartilhados (shadcn vai aqui)
  routes/             rotas do TanStack Start (file-based routing)
supabase/
  migrations/          migrations SQL (schema + RLS)
  tests/              teste de isolamento entre tenants (RLS)
```

## Configuração

Copie `.env.example` para `.env` e preencha:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — usados pelo cliente do
  browser (`src/infrastructure/supabase/client.ts`), respeitam RLS.
- `SUPABASE_SERVICE_ROLE_KEY` — só servidor, nunca prefixar com `VITE_`.
  Bypassa RLS (usado pelo futuro provisionamento de tenants).

## Banco de dados e RLS

A migration inicial está em
[`supabase/migrations/20260823200000_schema_multitenant_rls.sql`](./supabase/migrations/20260823200000_schema_multitenant_rls.sql)
— schema completo, `tenant_id` em toda tabela de dados, RLS habilitado em
todas as tabelas.

Para reproduzir o teste de isolamento entre tenants, rode
[`supabase/tests/rls-isolation.sql`](./supabase/tests/rls-isolation.sql) no
SQL Editor do Supabase (ou via `psql`) contra um projeto onde a migration já
foi aplicada.

## Middleware de hostname

`src/start.ts` registra `hostnameMiddleware`
([`src/infrastructure/hostname/hostname-middleware.ts`](./src/infrastructure/hostname/hostname-middleware.ts))
como request middleware global do TanStack Start. Em toda requisição, ele lê
o header `Host`, classifica o host (`src/domain/tenant/resolver-hostname.ts`)
e resolve o tenant correspondente via `tenants_publico()`
(`src/application/tenant/resolver-contexto-host.ts` +
`src/infrastructure/supabase/tenant-repository.ts`):

| Host | Modo resolvido |
|---|---|
| `comandago.app.br` (ou `COMANDAGO_APEX_DOMAIN`) | `landing` |
| `app.<apex>` | `painel` |
| `{slug}.<apex>` | `loja` (ou `loja_nao_encontrada` se o slug não existir/for reservado) |
| qualquer outro host | tenta casar com `tenants.custom_domain`; `dominio_custom` ou `nao_encontrado` |

`localhost` e `*.vercel.app` caem direto em `landing` (sem round-trip no
Supabase) — ainda não há domínio real apontado. O resultado fica disponível
em `Route.useRouteContext().hostContext` em qualquer rota, via
`beforeLoad` da rota raiz (`src/routes/__root.tsx`).

**Preview sem domínio próprio:** em `*.vercel.app` não existe subdomínio de
verdade (não dá pra apontar `loja.comandagoappbr.vercel.app` sem ser dono
do domínio) — então nesses hosts (e em `localhost`), `?loja=<slug>` e
`?painel=1` na URL forçam o modo correspondente
(`src/infrastructure/hostname/resolver-host-context.ts`), só pra dar pra
demonstrar loja/painel antes do domínio estar no ar. Nunca interfere em
host real. Loja de demonstração: `?loja=demo` (dados fictícios, seedados
direto no banco — não faz parte de nenhuma migration).

## Cardápio público (SSR)

Quando `hostContext.modo` é `loja` ou `dominio_custom`, `src/routes/index.tsx`
renderiza o cardápio de verdade (`src/presentation/components/cardapio/`):
categorias ativas com produtos ativos (`src/application/cardapio/buscar-cardapio-publico.ts`),
tema aplicado via CSS variables (`--cor-primaria`/`--cor-fundo` do tenant) e
status aberto/fechado calculado a partir de `tenants.horarios`
(`src/domain/tenant/status-loja.ts`, fuso `America/Sao_Paulo`, suporta
horário que cruza a meia-noite).

SEO por loja (seção 5 do briefing): título/description/Open Graph dinâmicos e
JSON-LD `Restaurant`+`Menu` (schema.org) no `head()` da rota, H1 com nome +
cidade, `alt` descritivo em toda imagem. `/robots.txt` e `/sitemap.xml`
(`src/routes/robots[.]txt.tsx`, `src/routes/sitemap[.]xml.tsx`) respondem por
subdomínio: loja pública libera indexação e anuncia o sitemap, painel do
lojista bloqueia (`Disallow: /`). O sitemap por ora só lista a home — cresce
quando existirem rotas por produto/categoria.

Landing de vendas e painel do lojista continuam sem tela (só o texto de
diagnóstico do modo resolvido) — são os próximos passos do roadmap.

## Carrinho + checkout via WhatsApp

Briefing seção 6, item 2. O carrinho vive só no `localStorage` do browser
(`src/presentation/hooks/use-carrinho.ts`) — sem cliente com login, não há
onde mais guardar. Cada subdomínio de loja já é uma origem separada, então o
localStorage naturalmente isola o carrinho de uma loja do de outra.

Risco de segurança que este passo resolveu: até aqui, a tabela `pedidos`
tinha uma policy que deixava o cliente anônimo inserir uma linha direto via
PostgREST com qualquer preço/subtotal/total que quisesse (bastava adulterar
o payload no DevTools). A migration
[`20260824130000_criar_pedido.sql`](./supabase/migrations/20260824130000_criar_pedido.sql)
remove essa policy e cria `criar_pedido(...)`, uma function `SECURITY
DEFINER` que é a ÚNICA porta de entrada: o cliente manda só
`produtoId + quantidade` por item (nunca preço), e o banco recalcula
subtotal/taxa de entrega/total a partir do cardápio real (`produtos`,
`tenants`) dentro da própria function. Testado explicitamente contra:
preço adulterado (ignorado, sempre recalculado), produto de outro tenant
(rejeitado — a FK/where já garante isolamento), produto inativo
(rejeitado), tenant inativo (rejeitado), pedido abaixo do mínimo
(rejeitado) e insert direto na tabela pelo jeito antigo (bloqueado pela RLS
depois da policy removida).

Fluxo: `ProdutoCard` tem botão de adicionar
(`src/presentation/components/cardapio/produto-card.tsx`) → `BarraCarrinho`
flutuante mostra quantidade/subtotal
(`src/presentation/components/carrinho/barra-carrinho.tsx`) → modal
`CarrinhoCheckout` edita itens e coleta nome/telefone/tipo
(entrega/retirada)/endereço/forma de pagamento
(`src/presentation/components/carrinho/carrinho-checkout.tsx`). No submit,
`criarPedido` (`src/application/pedido/criar-pedido.ts`) valida no cliente
(`src/domain/carrinho/validar-checkout.ts`, só UX — a defesa de verdade é a
function no banco) e chama `pedidoRepository.criar`
(`src/infrastructure/supabase/pedido-repository.ts`), que envia a RPC. A
mensagem do WhatsApp é montada a partir do pedido confirmado pelo banco
(`src/domain/carrinho/mensagem-whatsapp.ts`) e aberta via `wa.me`. A aba é
aberta com `window.open('', '_blank')` já no clique síncrono do botão (antes
do `await` da chamada ao banco) e só recebe a URL depois — é o que evita cair
no bloqueio de popup do navegador para fluxos assíncronos.

## Painel do lojista

Briefing seção 6, item 3 (CRUD de categorias/produtos, upload de foto,
horários, cores/logo). Vive sob `app.<apex>` (`hostContext.modo === 'painel'`
— seção "Middleware de hostname" acima), sem cadastro self-service: o
lojista recebe login (e-mail/senha do Supabase Auth) de Márcio no
onboarding presencial.

**Sessão via cookies, não localStorage.** `src/infrastructure/supabase/
auth-server-client.ts` cria um client `@supabase/ssr` ligado aos cookies da
requisição atual (`getCookie`/`setCookie` de `@tanstack/react-start/server`)
— usado só dentro de server functions
(`src/infrastructure/supabase/auth-actions.ts`: `entrarFn`/`sairFn`, e
`sessao-painel.ts`: `obterSessaoPainelFn`, que resolve usuário + tenant via
`tenant_usuarios`). `src/infrastructure/supabase/auth-browser-client.ts`
(`@supabase/ssr`'s `createBrowserClient`) lê a mesma sessão via
`document.cookie` no browser — é o client usado por todo repositório de
escrita do painel (`*-repository-painel.ts`), nunca o anônimo
(`client.ts`) usado pelo cardápio público.

**CSRF:** `src/start.ts` registra `createCsrfMiddleware()` (padrão
same-origin), filtrado só pra chamadas de server function
(`handlerType === 'serverFn'`) — sem esse filtro, toda navegação normal
(GET de "/", robots.txt etc.) seria rejeitada, já que não carrega
Sec-Fetch-Site "same-origin" nem Referer.

**Bug real encontrado ao testar:** `router.invalidate()` (usado depois do
login/logout pra re-resolver a sessão sem recarregar a página) força uma
re-execução client-side do `beforeLoad` da rota raiz — e
`getGlobalStartContext()` só resolve durante o SSR do carregamento inicial,
vindo `undefined` nesse caso. Sem tratar isso, todo re-invalidate caía
silenciosamente em `hostContext = { modo: 'landing' }`, escondendo o painel
logo depois do login. Corrigido com um fallback via server function
(`src/infrastructure/hostname/resolver-host-context-fn.ts`), que resolve o
host de novo a partir da requisição atual quando o contexto global não
está disponível.

**Proteção de rota:** cada rota do painel (`/categorias`, `/produtos`,
`/horarios`, `/aparencia`) chama `exigirSessaoPainel()`
(`src/presentation/painel/proteger-rota-painel.ts`) no loader, que
redireciona pra "/" (mostra o login) se não houver sessão válida.

**CRUD e upload:** categorias/produtos (`categoria-repository-painel.ts`,
`produto-repository-painel.ts`) e horários/aparência de tenants
(`tenant-repository-painel.ts`) são protegidos pelas mesmas RLS policies da
migration inicial (`*_insert/update/delete_membros`, `tenants_update_owner`)
— a UI não duplica essa checagem, só trata o erro se vier. Fotos de
produto/logo sobem pro bucket público `lojas` (migration
[`20260824140000_storage_lojas.sql`](./supabase/migrations/20260824140000_storage_lojas.sql)),
sob `{tenant_id}/...` — a policy de Storage usa esse primeiro segmento do
path com `is_tenant_member()`, mesmo padrão das tabelas.

## Fidelidade automática

Briefing seção 6, item 4 ("pontos por telefone, consulta sem senha").

**Pontuação:** 1 ponto por pedido criado (não por valor gasto — regra não
especificada no briefing, decisão explícita, fácil de trocar). Creditado
dentro da própria function `criar_pedido`
([`20260824150000_fidelidade_automatica.sql`](./supabase/migrations/20260824150000_fidelidade_automatica.sql)):
upsert em `fidelidade_clientes` na mesma transação do pedido — "automático"
significa que não depende de nenhuma ação do lojista.

**Bug real encontrado testando:** o mesmo cliente digitando o telefone às
vezes com "+55" e às vezes sem virava dois registros diferentes
(`"62999991234"` vs `"5562999991234"`) — cada pedido creditando um
"cliente" diferente, quebrando o programa de pontos. Corrigido em
[`20260824160000_normalizar_telefone_ddi.sql`](./supabase/migrations/20260824160000_normalizar_telefone_ddi.sql)
com `normalizar_telefone()`, uma function compartilhada (só dígitos + remove
DDI 55 quando reconhecível) usada tanto por `criar_pedido` quanto por
`consultar_pontos_fidelidade` — as duas nunca mais podem divergir na forma
de normalizar, porque é a mesma function.

**Consulta pública:** `/fidelidade` (`src/routes/fidelidade.tsx`, só
renderiza para `hostContext.modo` `loja`/`dominio_custom`) — cliente digita
o telefone, sem login, e vê os pontos via RPC `consultar_pontos_fidelidade`
(`src/infrastructure/supabase/fidelidade-consulta-repository.ts`, client
anônimo, mesmo padrão do cardápio público). Link "Consultar meus pontos de
fidelidade" no cabeçalho da loja (`loja-header.tsx`).

## Landing de vendas

`src/presentation/components/landing/comandago-landing.tsx`, mostrada em
`hostContext.modo === 'landing'`. Identidade própria da marca ComandaGO
(Fraunces + Manrope, paleta carvão/creme/brasa), deliberadamente distinta do
tema por-loja (`cor_primaria`/`cor_fundo`, que só existe pro cardápio de cada
tenant).

**Movimento:** GSAP + ScrollTrigger pra entrada do hero e revelações de
seção, [Lenis](https://github.com/darkroomengineering/lenis) pra rolagem
suave (`src/presentation/hooks/use-lenis.ts`). Decisões deliberadas:

- Ousadia concentrada na entrada do hero (uma sequência só, ~600ms) — o
  resto da página só tem revelação curta (opacity+translateY, uma vez,
  nunca reanima ao rolar pra cima e descer de novo).
- **Sem** scroll-scrub/parallax contínuo no hero (era o pedido original) —
  é o primeiro item da lista de antipadrões de movimento em web: pesa a
  cada quadro e não comunica nada. Trocado por uma entrada única bem
  orquestrada.
- Respeita `prefers-reduced-motion` (desliga Lenis e os `gsap.from()`,
  mantendo o conteúdo já visível em vez de preso num estado inicial
  invisível).
- GSAP/Lenis (~70kB gzip) carregam via `React.lazy` só na rota da landing
  (`src/routes/index.tsx`) — cliente final numa loja ou o lojista no painel
  nunca baixam esse peso. Confirmado comparando o bundle antes/depois do
  lazy: o chunk compartilhado de rotas caiu de ~155kB pra ~17kB.
- Fundo do hero é um tratamento gráfico SVG (motivo de "comanda"/ticket),
  não foto/vídeo — sem asset real disponível ainda; trocar quando houver
  fotos de loja de verdade.

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```


## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server. To deploy, push the `dist/` directory to your host (Render, Fly.io, your own VPS, etc.) and run the server command above.

For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.) and tuning, see https://v3.nitro.build/deploy.



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).



# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
