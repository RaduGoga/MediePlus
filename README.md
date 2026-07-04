# MediePlus+

> Co-pilotul de productivitate pentru elevii din România.

Îți planifică timpul, te ține în ritm și te ajută să reții ce înveți — cu AI și o
mascotă (Lumi) care prinde viață odată cu tine. Consistență, momentum, recovery și
un heatmap de activitate — dar pe sesiuni de focus, nu pe note.

## Stack

| Strat | Tehnologie |
|------|------------|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS |
| Animații | Framer Motion + SVG (Lumi) |
| Date (offline-first) | IndexedDB via Dexie |
| AI | Google Gemini API (free tier) — cheia pe server |
| PWA | manifest + service worker |

## Pornire

```bash
npm install
cp .env.local.example .env.local   # adaugă GEMINI_API_KEY
npm run dev
```

Deschide http://localhost:3000.

## Structură

```
src/
  app/
    page.tsx            # Azi — briefing, Lumi, planul zilei, momentum
    plan/page.tsx       # Plan — taskuri + sesiuni + heatmap + profil
    chat/page.tsx       # Co-pilot conversațional (chat → taskuri)
    focus/page.tsx      # Mod focus cu Lumi + recall la final
    api/ai/parse        # frază → taskuri (JSON)
    api/ai/recall       # sesiune → întrebare de fixare
    api/ai/briefing     # plan + stare → text pe vocea lui Lumi
  components/
    Lumi.tsx            # mascota SVG parametrizată, toate stările
    Onboarding.tsx      # quiz de personalizare la prima intrare
  lib/
    db.ts               # Dexie (model de date, fără note)
    momentum.ts         # streak + momentum + recovery + heatmap
    planner.ts          # plan adaptiv (re-planificare)
    gemini.ts           # apel server + fallback local
```

## Build

```bash
npm run build && npm start
```
