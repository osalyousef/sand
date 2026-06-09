// Bins points into a fixed geographic grid (~100m × 100m cells) and returns
// one aggregated cell per occupied bin. Used to render a pixel-style density
// heatmap instead of individual pilgrim markers (which won't scale to millions).

export const CELL_METERS = 100;

// Area of interest: Mina / Arafat
export const AREA = {
  latMin: 21.378,
  latMax: 21.432,
  lngMin: 39.848,
  lngMax: 39.898,
};

// Meters-per-degree. Latitude is ~constant; longitude shrinks by cos(lat).
const M_PER_DEG_LAT = 111_320;
const CENTER_LAT = (AREA.latMin + AREA.latMax) / 2;
const M_PER_DEG_LNG = 111_320 * Math.cos((CENTER_LAT * Math.PI) / 180);

export const CELL_LAT = CELL_METERS / M_PER_DEG_LAT; // ~0.000898°
export const CELL_LNG = CELL_METERS / M_PER_DEG_LNG; // ~0.000965°

export interface GridCell {
  // [[south, west], [north, east]] — Leaflet LatLngBounds shape
  bounds: [[number, number], [number, number]];
  value: number; // aggregated weight (critical count, or summed prediction weight)
  row: number;
  col: number;
}

// points: [lat, lng, weight] triples
export function buildGrid(points: [number, number, number][]): GridCell[] {
  const cells = new Map<string, GridCell>();

  for (const [lat, lng, weight] of points) {
    if (lat < AREA.latMin || lat > AREA.latMax || lng < AREA.lngMin || lng > AREA.lngMax) {
      continue;
    }
    const row = Math.floor((lat - AREA.latMin) / CELL_LAT);
    const col = Math.floor((lng - AREA.lngMin) / CELL_LNG);
    const key = `${row}:${col}`;

    const existing = cells.get(key);
    if (existing) {
      existing.value += weight;
    } else {
      const south = AREA.latMin + row * CELL_LAT;
      const west = AREA.lngMin + col * CELL_LNG;
      cells.set(key, {
        bounds: [
          [south, west],
          [south + CELL_LAT, west + CELL_LNG],
        ],
        value: weight,
        row,
        col,
      });
    }
  }

  return [...cells.values()];
}

// Approx distance in meters between two coords (equirectangular — fine at this scale).
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat1 - lat2) * M_PER_DEG_LAT;
  const dLng = (lng1 - lng2) * M_PER_DEG_LNG;
  return Math.hypot(dLat, dLng);
}

// Arabic label for a normalized density t∈[0,1].
export function densityLabel(t: number): string {
  if (t >= 0.8) return "حرجة جدًا";
  if (t >= 0.6) return "عالية";
  if (t >= 0.4) return "متوسطة";
  if (t >= 0.2) return "منخفضة";
  return "خفيفة";
}

// Details for the panel shown when a cell is clicked.
export interface SelectedCellInfo {
  key: string;
  lat: number; // cell center
  lng: number;
  value: number; // critical pilgrims in cell
  t: number; // normalized density
  share: number; // fraction of all critical cases (0–1)
  densityPerKm2: number;
  nearestLandmark: string;
  nearestDist: number; // meters
}

// Red density color ramp (light → deep red) based on normalized intensity t∈[0,1].
export function cellColor(t: number): string {
  if (t >= 0.8) return "#7f1d1d"; // deepest
  if (t >= 0.6) return "#b91c1c";
  if (t >= 0.4) return "#ef4444";
  if (t >= 0.2) return "#f87171";
  return "#fca5a5"; // lightest
}
