# Hovjournal

En digital hov- och behandlingsjournal med smart fakturering för hovslagare och hästföretagare. Hantera kunder, hästar, behandlingar och fakturor – direkt i mobilen eller via webben.

## Funktioner

- **Journalföring i fält** – registrera skoning, verkning, hovvård och kontroller direkt vid hästen med anteckningar, bilder och planerad uppföljning.
- **Häst- och kundprofiler** – full historik per häst, kontaktuppgifter per kund och överblick över ekonomin.
- **Smart fakturering** – skapa faktura från valda behandlingar med automatisk moms, betalningsvillkor och statusuppföljning (skickad, betald, förfallen).
- **Dashboard** – intäktsgraf över senaste sex månaderna, obetalda fakturor, behandlingar denna månad och snabbåtgärder.
- **Fotodokumentation** – ladda upp bilder till varje behandling; bilderna lagras i Netlify Blobs.
- **Mobile-first** – responsiv layout som fungerar lika bra i stallet som på kontoret.

## Teknikstack

| Lager | Teknik |
|-------|--------|
| Ramverk | TanStack Start (React Server Components via server-functions) |
| Frontend | React 19, TanStack Router |
| Styling | Tailwind CSS 4 |
| Diagram | Chart.js / react-chartjs-2 |
| Ikoner | lucide-react |
| Lagring | Netlify Blobs (JSON + binärdata för foton) |
| Språk | TypeScript 5.7 (strict mode) |
| Deploy | Netlify (via `@netlify/vite-plugin-tanstack-start`) |

All data lagras i en Netlify Blobs-store (`hovjournal`). Första sidladdningen seedar några exempelkunder, hästar, behandlingar och fakturor så att appen är demo-redo omedelbart.

## Kom igång lokalt

```bash
npm install
npm run dev
```

Ovanstående startar Vite-dev-servern på port 3000. För att köra med full Netlify-emulering (inkl. Blobs-miljövariabler):

```bash
netlify dev
```

`netlify dev` startar på port 8888 och proxar mot Vite.

## Bygga för produktion

```bash
npm run build
```

Netlify bygger och publicerar från `dist/client` automatiskt när du deployar.

## Projektets struktur

```
src/
├── components/
│   ├── AppShell.tsx        # Sidomeny, mobilheader, layout-shell
│   └── ui/                 # Button, Card, Badge, Field (Input/Textarea/Select)
├── lib/
│   ├── format.ts           # Svenska datum/valuta-formatters
│   ├── types.ts            # Domäntyper (Customer, Horse, Treatment, Invoice)
│   └── utils.ts
├── routes/
│   ├── __root.tsx          # Rot-layout (AppShell + Head)
│   ├── index.tsx           # Dashboard
│   ├── kunder.*.tsx        # Kundlista, detalj, ny kund
│   ├── hastar.*.tsx        # Hästdetalj + journal, ny häst
│   ├── behandlingar.*.tsx  # Alla behandlingar, ny behandling
│   ├── fakturor.*.tsx      # Fakturor, fakturadetalj, ny faktura
│   └── api.photos.$.ts     # Utlämnar uppladdade foton från Blobs
└── server/
    ├── storage.ts          # Netlify Blobs CRUD + seed-data
    └── functions.ts        # createServerFn-wrappers (publik API)
```

## Datamodell

- **Customer** (kund / hästägare) – namn, kontakt, org.nr, anteckningar.
- **Horse** – tillhör en kund, ras/färg/disciplin, viktig information.
- **Treatment** – typ (skoning/verkning/hovvård/kontroll), pris, datum, anteckningar, foton, ev. uppföljning, ev. koppling till faktura.
- **Invoice** – numrerad, kopplad till kund och behandlingsrader, status (utkast/skickad/betald/förfallen), moms 25 %.

## Licens

Privat projekt – alla rättigheter förbehållna.
