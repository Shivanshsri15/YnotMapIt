# Road-network data prep (OSMnx)

Offline pipeline that turns OpenStreetMap roads into a JSON graph NestJS can load.

**Routing is not done here.** OSMnx only prepares data. Dijkstra runs later in TypeScript.

## Concepts (short)

| Term | Meaning here |
|------|----------------|
| Vertex / node | Road intersection (OSM node id + lat/lon) |
| Directed edge | Allowed drive from U → V |
| Weight | Road length in metres (`lengthM`) |

One-way OSM tags become missing reverse edges. Two-way roads become two directed edges.

## Setup

```powershell
cd backend\data-prep
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

## Scripts

| Script | Purpose |
|--------|---------|
| `export_noida.py` | Full Noida → `../data/noida-drive.json` + `.graphml` (gitignored) |
| `graph_export.py` | Shared NestJS JSON converter |

```powershell
.\.venv\Scripts\python.exe export_noida.py
```

## NestJS JSON shape

```json
{
  "meta": { "attribution": "© OpenStreetMap contributors", "nodeCount": 0, "edgeCount": 0 },
  "nodes": { "123": { "lat": 28.57, "lon": 77.32 } },
  "adjacency": {
    "123": [{ "to": "456", "lengthM": 42.5, "geometry": [[28.57, 77.32], [28.571, 77.321]] }]
  }
}
```

## Attribution

Data © OpenStreetMap contributors — https://www.openstreetmap.org/copyright

## Note on `cache/`

OSMnx may create `data-prep/cache/` automatically (Overpass HTTP cache). It is gitignored and is **not** the NestJS graph file.
