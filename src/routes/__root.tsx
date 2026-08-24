import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { getGlobalStartContext } from '@tanstack/react-start'

import appCss from '../styles.css?url'
import type { ContextoHost } from '#/application/tenant/resolver-contexto-host'

export const Route = createRootRoute({
  beforeLoad: () => {
    // getGlobalStartContext() só resolve no servidor (undefined no client).
    // A hidratação inicial reaproveita o resultado do SSR sem re-rodar este
    // beforeLoad; ele só re-executaria no client numa navegação client-side
    // futura — como hoje só existe a rota "/", isso ainda não é alcançável.
    // Falha segura enquanto isso: cai em "landing".
    //
    // O cast abaixo é necessário porque a tipagem genérica de
    // getGlobalStartContext() só liga corretamente ao Register quando
    // routeTree.gen.ts é regenerado por um `vite build`/`vite dev` completo
    // (a pipeline do plugin tanstackStart adiciona a declaração `config:
    // ...` ao module augmentation). Um `pnpm generate-routes` isolado (só
    // tsr generate, sem passar pelo Vite) NÃO inclui essa declaração —
    // então sem o cast, o typecheck fica dependente de qual comando rodou
    // por último. O formato em runtime é garantido pelo próprio
    // hostnameMiddleware (src/infrastructure/hostname), a única coisa que
    // escreve nesse contexto global.
    const resolvido = getGlobalStartContext() as { hostContext?: ContextoHost } | undefined
    const hostContext: ContextoHost = resolvido?.hostContext ?? { modo: 'landing' }
    return { hostContext }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ComandaGO',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
