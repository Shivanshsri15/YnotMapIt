import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { RouteResponse } from '../types';

const NOIDA_CENTER: LatLngExpression = [28.5355, 77.391];

interface RouteMapProps {
  route: RouteResponse | null;
  onMapClick: (lat: number, lon: number) => void;
}

const FitRouteBounds = ({ positions }: { positions: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) {
      return;
    }
    map.fitBounds(positions as [number, number][], { padding: [48, 48] });
  }, [map, positions]);

  return null;
};

const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (event: { latlng: { lat: number; lng: number } }) => {
      onMapClick(event.latlng.lat, event.latlng.lng);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

export const RouteMap = ({ route, onMapClick }: RouteMapProps) => {
  const routePositions: LatLngExpression[] =
    route?.coordinates.map(([lat, lon]) => [lat, lon]) ?? [];

  return (
    <MapContainer
      center={NOIDA_CENTER}
      zoom={12}
      className="route-map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />

      {route && (
        <>
          <FitRouteBounds positions={routePositions} />
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#0f766e', weight: 5, opacity: 0.9 }}
          />
          <CircleMarker
            center={[route.source.snapped.lat, route.source.snapped.lon]}
            radius={8}
            pathOptions={{
              color: '#14532d',
              fillColor: '#22c55e',
              fillOpacity: 1,
            }}
          />
          <CircleMarker
            center={[
              route.destination.snapped.lat,
              route.destination.snapped.lon,
            ]}
            radius={8}
            pathOptions={{
              color: '#7f1d1d',
              fillColor: '#ef4444',
              fillOpacity: 1,
            }}
          />
        </>
      )}
    </MapContainer>
  );
};
