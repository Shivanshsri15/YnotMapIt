"""Shared helpers: OSMnx MultiDiGraph → NestJS JSON contract."""

from __future__ import annotations

from datetime import datetime, timezone


def edge_geometry_latlon(edge_data: dict, u_data: dict, v_data: dict) -> list[list[float]]:
    """Return [[lat, lon], ...] for map polylines. Fall back to endpoints."""
    geom = edge_data.get("geometry")
    if geom is not None:
        return [[float(lat), float(lon)] for lon, lat in geom.coords]

    return [
        [float(u_data["y"]), float(u_data["x"])],
        [float(v_data["y"]), float(v_data["x"])],
    ]


def graph_to_nest_json(graph, *, region: str, extra_meta: dict | None = None) -> dict:
    nodes: dict[str, dict[str, float]] = {}
    for node_id, data in graph.nodes(data=True):
        nodes[str(node_id)] = {"lat": float(data["y"]), "lon": float(data["x"])}

    adjacency: dict[str, list[dict]] = {node_key: [] for node_key in nodes}
    best_uv: dict[tuple[str, str], dict] = {}

    for u, v, _key, data in graph.edges(data=True, keys=True):
        u_key, v_key = str(u), str(v)
        length_m = float(data["length"])
        candidate = {
            "to": v_key,
            "lengthM": length_m,
            "geometry": edge_geometry_latlon(data, graph.nodes[u], graph.nodes[v]),
        }
        prev = best_uv.get((u_key, v_key))
        if prev is None or length_m < prev["lengthM"]:
            best_uv[(u_key, v_key)] = candidate

    for (u_key, _v_key), edge in best_uv.items():
        adjacency[u_key].append(edge)

    lats = [n["lat"] for n in nodes.values()]
    lons = [n["lon"] for n in nodes.values()]
    edge_count = sum(len(edges) for edges in adjacency.values())

    meta = {
        "region": region,
        "networkType": "drive",
        "crs": "EPSG:4326",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "attribution": "© OpenStreetMap contributors",
        "attributionUrl": "https://www.openstreetmap.org/copyright",
        "nodeCount": len(nodes),
        "edgeCount": edge_count,
        "bbox": {
            "minLat": min(lats),
            "minLon": min(lons),
            "maxLat": max(lats),
            "maxLon": max(lons),
        },
    }
    if extra_meta:
        meta.update(extra_meta)

    return {"meta": meta, "nodes": nodes, "adjacency": adjacency}
