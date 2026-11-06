# YnotMapIt — backend

NestJS + TypeScript API that loads a prebuilt OpenStreetMap drive graph for **Noida** and computes **shortest-distance** routes with a from-scratch **Dijkstra** implementation.

The frontend is a local demo only. **Deployment work targets this backend.**

## What it does

| Concern | Approach |
|---------|----------|
| Road data | Offline OSMnx export → `data/noida-drive.json` |
| Snapping | Grid index + haversine nearest vertex |
| Routing | Directed Dijkstra on road lengths (metres) |
| No external routing APIs | Google/OSRM/etc. are not used for pathfinding |

OpenStreetMap data © OpenStreetMap contributors — https://www.openstreetmap.org/copyright

## Prerequisites

- Node.js 20+ (or current LTS)
- `data/noida-drive.json` present (see [data-prep](./data-prep/README.md))

## Setup

```powershell
cd backend
npm install
```

If the graph file is missing:

```powershell
cd data-prep
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python.exe export_noida.py
cd ..
```

## Run locally

```powershell
npm run start:dev
```

Listens on `http://localhost:3000` (override with `PORT`).  
CORS allows the Vite demo at `http://localhost:5173`.

Optional: `GRAPH_PATH` = absolute path to another Nest-compatible graph JSON.

## API

### `GET /health`

```json
{ "status": "ok", "graphLoaded": true }
```

### `GET /graph/info`

Region, node/edge counts, bbox, attribution, source path.

### `POST /route`

```json
{
  "sourceLat": 28.5703,
  "sourceLon": 77.3219,
  "destLat": 28.5355,
  "destLon": 77.3910
}
```

Returns distance, polyline `coordinates`, snap details, Dijkstra stats (`nodesExplored`, `edgesEvaluated`, `algorithmExecutionTimeMs`).

## Tests

```powershell
npm test
npm run test:e2e
```

## Project layout

```text
backend/
  src/graph/       # load graph, grid snap
  src/routing/     # Dijkstra, min-heap, POST /route
  data/            # noida-drive.json (gitignored; regenerate via data-prep)
  data-prep/       # OSMnx Python export scripts
```

## Deployment roadmap (backend only)

Zero-spend first: prefer free-tier / local simulation; **do not** create paid AWS resources without checking pricing and explicit approval.  
Frontend is **not** deployed in this track.

### Exact next commands (follow in order)

#### 0) Confirm graph file exists

```powershell
cd d:\YnotMapIt\backend
dir data\noida-drive.json
# If missing:
cd data-prep
.\.venv\Scripts\python.exe export_noida.py
cd ..
```

#### 1) Add a Dockerfile (once the file exists in this repo)

From `backend/`:

```powershell
docker build -t ynotmapit-backend:local .
```

Expected Dockerfile behaviour (when added): multi-stage `npm ci` → `nest build` → `node dist/main`, graph at `/app/data/noida-drive.json`.

#### 2) Run the API container locally

```powershell
docker run --rm -p 3000:3000 --name ynotmapit-api ynotmapit-backend:local
```

Smoke test (another terminal):

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/graph/info
curl -Method POST http://localhost:3000/route -ContentType "application/json" -Body '{"sourceLat":28.5703,"sourceLon":77.3219,"destLat":28.5355,"destLon":77.3910}'
```

Optional mount instead of baking the graph into the image:

```powershell
docker run --rm -p 3000:3000 -e GRAPH_PATH=/data/noida-drive.json -v ${PWD}/data:/data:ro --name ynotmapit-api ynotmapit-backend:local
```

#### 3) Env vars to know

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `GRAPH_PATH` | `data/noida-drive.json` (cwd-relative) | Absolute path to graph JSON inside container/host |

#### 4) Single EC2-style host (after AWS account + free-tier check)

On the VM (Amazon Linux 2023 example):

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# log out/in, then:
docker pull <your-image>   # or scp/rsync the project and docker build on the box
docker run -d --restart unless-stopped -p 3000:3000 --name ynotmapit-api ynotmapit-backend:local
curl http://127.0.0.1:3000/health
```

Security Group: allow inbound TCP `3000` only from your IP (not `0.0.0.0/0` unless you accept the risk).

#### 5) Logs

```bash
docker logs -f ynotmapit-api
```

On AWS later: ship these to CloudWatch Logs (still cost-aware).

#### 6) GitHub Actions (after repo is on GitHub)

Workflow goals: `npm test`, `npm run test:e2e`, `docker build` on push to `main`.  
Push image to Amazon ECR only after you approve possible charges.

#### 7) Load test (infra benchmark)

Install [k6](https://k6.io/), then hit `/route` for RPS / p50 / p95 / p99.  
Do **not** confuse k6 latency with `stats.algorithmExecutionTimeMs` in the JSON body.

#### 8) Later scaling (approval required)

Second container/host → load balancer → ECS/Fargate experiments.

### Explicitly out of scope for this deploy track

- Deploying the React app  
- Multi-city prep API / Postgres (future product phase)  
- Bidirectional Dijkstra / A* (algorithm experiments, not deploy blockers)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Watch mode |
| `npm run start:prod` | Run compiled `dist/main` |
| `npm run build` | Compile Nest app |
| `npm test` / `npm run test:e2e` | Unit + e2e |
