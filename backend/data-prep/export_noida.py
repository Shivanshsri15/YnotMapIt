"""
Download the full Noida drive network and export NestJS JSON + GraphML.

Outputs (under backend/data/, gitignored except sample):
  noida-drive.json   — runtime graph for NestJS (minified)
  noida-drive.graphml — OSMnx-native cache for reprocessing

Run from backend/data-prep:
  .venv\\Scripts\\python.exe export_noida.py
"""

from __future__ import annotations

import json
from pathlib import Path

import osmnx as ox

from graph_export import graph_to_nest_json

PLACE = {"city": "Noida", "state": "Uttar Pradesh", "country": "India"}
# Fallback if place geocoding fails / is ambiguous (approx Noida municipal area).
BBOX = (28.635, 77.295, 28.480, 77.510)  # north, south, east, west for older APIs
# OSMnx 2 graph_from_bbox expects (left, bottom, right, top) = (min_lon, min_lat, max_lon, max_lat)
BBOX_LBRT = (77.295, 28.480, 77.510, 28.635)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
JSON_PATH = DATA_DIR / "noida-drive.json"
GRAPHML_PATH = DATA_DIR / "noida-drive.graphml"


def download_noida_drive():
    print("Trying place query for Noida...")
    try:
        graph = ox.graph.graph_from_place(
            PLACE,
            network_type="drive",
            simplify=True,
        )
        source = f"place:{PLACE}"
    except Exception as exc:  # noqa: BLE001 — learning script: fall back and report
        print(f"  place query failed: {exc}")
        print(f"  Falling back to bbox {BBOX_LBRT} (minLon, minLat, maxLon, maxLat)...")
        graph = ox.graph.graph_from_bbox(
            bbox=BBOX_LBRT,
            network_type="drive",
            simplify=True,
        )
        source = f"bbox:{BBOX_LBRT}"

    before_nodes = graph.number_of_nodes()
    before_edges = graph.number_of_edges()

    # Keep the largest weakly connected component so routing has one main network.
    graph = ox.truncate.largest_component(graph, strongly=False)
    after_nodes = graph.number_of_nodes()
    after_edges = graph.number_of_edges()

    print(f"  source: {source}")
    print(f"  before component filter: {before_nodes} nodes, {before_edges} edges")
    print(f"  after largest WCC:       {after_nodes} nodes, {after_edges} edges")
    return graph, source, before_nodes, before_edges


def main() -> None:
    print("Downloading full Noida drive network (this can take a few minutes)...")
    graph, source, before_nodes, before_edges = download_noida_drive()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Saving GraphML cache → {GRAPHML_PATH}")
    ox.io.save_graphml(graph, filepath=GRAPHML_PATH)

    payload = graph_to_nest_json(
        graph,
        region="Noida, Uttar Pradesh, India",
        extra_meta={
            "downloadSource": source,
            "nodesBeforeComponentFilter": before_nodes,
            "edgesBeforeComponentFilter": before_edges,
        },
    )

    # Minified JSON for the full city (smaller on disk than pretty-print).
    print(f"Writing NestJS JSON → {JSON_PATH}")
    JSON_PATH.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")

    size_mb = JSON_PATH.stat().st_size / (1024 * 1024)
    print()
    print("Done.")
    print(f"  nodes: {payload['meta']['nodeCount']}")
    print(f"  directed edges: {payload['meta']['edgeCount']}")
    print(f"  bbox: {payload['meta']['bbox']}")
    print(f"  json size: {size_mb:.2f} MB")
    print(f"  attribution: {payload['meta']['attribution']}")
    print()
    print("Full Noida file is gitignored; regenerate with this script when needed.")


if __name__ == "__main__":
    main()
