# YnotMapIt — frontend

Local **demo UI** for the NestJS routing backend. React + TypeScript + Leaflet.

**Deployment focus is the backend only.** This app is for verifying routes on a map while developing; it is not part of the current cloud/deploy track.

## What it does

- Form (and map-click) for source / destination lat/lon  
- Calls backend `POST /route`  
- Draws OSM tiles + route polyline and shows Dijkstra stats  

Routing math stays on the backend. This client does not compute shortest paths.

## Prerequisites

- Backend running at `http://localhost:3000` (see [`../backend/README.md`](../backend/README.md))  
- Node.js 20+

## Setup & run

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Optional `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Usage

1. Start backend: `cd ../backend && npm run start:dev`  
2. Start this app: `npm run dev`  
3. Use defaults (Sector 18 → Botanical Garden area) or click the map (alternates source → destination)  
4. **Calculate route**

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (local only for now) |
| `npm run preview` | Preview production build |

## Note on deployment

Backend Docker / EC2 / CI work lives under `backend/`. Do not assume this frontend is deployed with those steps unless we explicitly add a separate frontend hosting milestone later.
