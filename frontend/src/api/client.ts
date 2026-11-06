import type { GraphInfo, RouteRequest, RouteResponse } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export const fetchGraphInfo = async (): Promise<GraphInfo> => {
  const response = await fetch(`${API_BASE_URL}/graph/info`);
  if (!response.ok) {
    throw new Error(`Could not load graph info (${response.status})`);
  }
  return response.json() as Promise<GraphInfo>;
};

export const calculateRoute = async (
  request: RouteRequest,
): Promise<RouteResponse> => {
  const response = await fetch(`${API_BASE_URL}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Route failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      }
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  return response.json() as Promise<RouteResponse>;
};
