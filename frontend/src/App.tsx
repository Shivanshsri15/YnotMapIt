import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { calculateRoute, fetchGraphInfo } from './api/client';
import { RouteMap } from './components/RouteMap';
import type { GraphInfo, RouteResponse } from './types';
import 'leaflet/dist/leaflet.css';
import './App.css';

const DEFAULT_SOURCE = { lat: '28.5703', lon: '77.3219' };
const DEFAULT_DEST = { lat: '28.5355', lon: '77.3910' };

type ClickTarget = 'source' | 'destination';

const App = () => {
  const [sourceLat, setSourceLat] = useState(DEFAULT_SOURCE.lat);
  const [sourceLon, setSourceLon] = useState(DEFAULT_SOURCE.lon);
  const [destLat, setDestLat] = useState(DEFAULT_DEST.lat);
  const [destLon, setDestLon] = useState(DEFAULT_DEST.lon);
  const [clickTarget, setClickTarget] = useState<ClickTarget>('source');

  const [graphInfo, setGraphInfo] = useState<GraphInfo | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGraphInfo()
      .then(setGraphInfo)
      .catch(() => {
        // Graph info is optional for the demo panel; route errors surface separately.
      });
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      const latText = lat.toFixed(6);
      const lonText = lon.toFixed(6);
      if (clickTarget === 'source') {
        setSourceLat(latText);
        setSourceLon(lonText);
        setClickTarget('destination');
      } else {
        setDestLat(latText);
        setDestLon(lonText);
        setClickTarget('source');
      }
    },
    [clickTarget],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await calculateRoute({
        sourceLat: Number(sourceLat),
        sourceLon: Number(sourceLon),
        destLat: Number(destLat),
        destLon: Number(destLon),
      });
      setRoute(result);
    } catch (err) {
      setRoute(null);
      setError(err instanceof Error ? err.message : 'Route request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="panel">
        <header className="panel-header">
          <p className="brand">YnotMapIt</p>
          <h1>Noida drive routing</h1>
          <p className="subtitle">
            Shortest road distance via our NestJS Dijkstra — not an external maps
            API.
          </p>
        </header>

        {graphInfo && (
          <p className="graph-meta">
            Graph: {graphInfo.region} · {graphInfo.nodeCount.toLocaleString()}{' '}
            nodes · {graphInfo.edgeCount.toLocaleString()} edges
          </p>
        )}

        <form className="route-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Source</legend>
            <label>
              Latitude
              <input
                value={sourceLat}
                onChange={(e) => setSourceLat(e.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label>
              Longitude
              <input
                value={sourceLon}
                onChange={(e) => setSourceLon(e.target.value)}
                inputMode="decimal"
                required
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Destination</legend>
            <label>
              Latitude
              <input
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label>
              Longitude
              <input
                value={destLon}
                onChange={(e) => setDestLon(e.target.value)}
                inputMode="decimal"
                required
              />
            </label>
          </fieldset>

          <p className="hint">
            Click the map to fill coordinates (
            {clickTarget === 'source' ? 'next: source' : 'next: destination'}).
          </p>

          <button type="submit" disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate route'}
          </button>
        </form>

        {error && <p className="status status-error">{error}</p>}

        {route && !error && (
          <section className="stats" aria-live="polite">
            <h2>Result</h2>
            <dl>
              <div>
                <dt>Distance</dt>
                <dd>
                  {route.distanceKm.toFixed(2)} km ({route.distanceM.toFixed(0)}{' '}
                  m)
                </dd>
              </div>
              <div>
                <dt>Algorithm time</dt>
                <dd>{route.stats.algorithmExecutionTimeMs.toFixed(2)} ms</dd>
              </div>
              <div>
                <dt>Nodes explored</dt>
                <dd>{route.stats.nodesExplored.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Edges evaluated</dt>
                <dd>{route.stats.edgesEvaluated.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Path nodes</dt>
                <dd>{route.stats.nodePathLength}</dd>
              </div>
              <div>
                <dt>Source snap</dt>
                <dd>{route.source.snapped.distanceM.toFixed(1)} m</dd>
              </div>
              <div>
                <dt>Dest snap</dt>
                <dd>{route.destination.snapped.distanceM.toFixed(1)} m</dd>
              </div>
            </dl>
            <p className="attribution">{route.attribution}</p>
          </section>
        )}
      </aside>

      <main className="map-pane">
        <RouteMap route={route} onMapClick={handleMapClick} />
      </main>
    </div>
  );
};

export default App;
