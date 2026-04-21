import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/AppShell'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light' },
      {
        name: 'description',
        content:
          'Hovjournal – digital hov- och behandlingsjournal med smart fakturering för hovslagare och hästföretagare.',
      },
      { title: 'Hovjournal – Behandling & fakturering' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
