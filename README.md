# BurnFat.fun

A public ledger for fat burned by humans. Static waitlist landing page.

## Stack

- Next.js 15 (App Router)
- Tailwind CSS v4
- TypeScript

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_URL` | Public URL for OG meta tags (default: `https://burnfat.fun`) |

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Set `NEXT_PUBLIC_URL` in Vercel environment settings
4. Deploy
