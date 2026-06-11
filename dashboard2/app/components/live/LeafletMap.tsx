"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker, Tooltip } from "react-leaflet";
import { MOCK_CRITICAL_POINTS, MOCK_PREDICTED_POINTS } from "@/lib/mock-data";
import { buildGrid, cellColor, distanceMeters, type SelectedCellInfo } from "@/lib/grid";
import { INSTITUTIONS, INSTITUTION_STATUS_META, INSTITUTION_TYPE_LABEL, occupancyPct, occupancyColor } from "@/lib/ops-data";

// Center on Mina
const CENTER: [number, number] = [21.408, 39.873];
const ZOOM = 15;

const LANDMARKS: { name: string; lat: number; lng: number }[] = [
  { name: "الجمرات", lat: 21.423, lng: 39.873 },
  { name: "مخيم منى", lat: 21.412, lng: 39.862 },
  { name: "مستشفى ميداني", lat: 21.398, lng: 39.885 },
  { name: "البوابة الرئيسية", lat: 21.386, lng: 39.857 },
];

function nearestLandmark(lat: number, lng: number) {
  let best = LANDMARKS[0];
  let bestDist = Infinity;
  for (const l of LANDMARKS) {
    const d = distanceMeters(lat, lng, l.lat, l.lng);
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  return { name: best.name, dist: Math.round(bestDist) };
}

interface LeafletMapProps {
  mode: "now" | "predicted";
  showInstitutions: boolean;
  selectedKey: string | null;
  onSelectCell: (info: SelectedCellInfo) => void;
}

export default function LeafletMap({ mode, showInstitutions, selectedKey, onSelectCell }: LeafletMapProps) {
  const cells = useMemo(() => {
    const points = mode === "now" ? MOCK_CRITICAL_POINTS : MOCK_PREDICTED_POINTS;
    const grid = buildGrid(points);
    const max = grid.reduce((m, c) => Math.max(m, c.value), 1);
    const total = grid.reduce((s, c) => s + c.value, 0) || 1;

    return grid.map(c => {
      const lat = (c.bounds[0][0] + c.bounds[1][0]) / 2;
      const lng = (c.bounds[0][1] + c.bounds[1][1]) / 2;
      const near = nearestLandmark(lat, lng);
      const info: SelectedCellInfo = {
        key: `${c.row}:${c.col}`,
        lat,
        lng,
        value: c.value,
        t: c.value / max,
        share: c.value / total,
        densityPerKm2: Math.round(c.value * 100), // 100m×100m = 0.01 km²
        nearestLandmark: near.name,
        nearestDist: near.dist,
      };
      return { cell: c, info };
    });
  }, [mode]);

  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      scrollWheelZoom
      className="w-full h-full"
      style={{ background: "#0a0f1e" }}
    >
      {/* Dark basemap — keeps the command-center look and makes heat cells pop */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />

      {/* 100m × 100m density cells — hottest ones glow */}
      {cells.map(({ cell, info }) => {
        const isSelected = info.key === selectedKey;
        return (
          <Rectangle
            key={info.key}
            bounds={cell.bounds}
            eventHandlers={{ click: () => onSelectCell(info) }}
            pathOptions={{
              stroke: isSelected,
              color: "#ffffff",
              weight: 2,
              fillColor: cellColor(info.t),
              fillOpacity: isSelected ? 0.8 : 0.3 + info.t * 0.45,
              className: info.t >= 0.65 ? "cell-glow" : undefined,
            }}
          >
            <Tooltip direction="auto" sticky>
              <div dir="rtl" style={{ fontSize: 11 }}>
                الحالات الحرجة: <strong>{info.value}</strong> — اضغط للتفاصيل
              </div>
            </Tooltip>
          </Rectangle>
        );
      })}

      {/* Landmarks for orientation */}
      {LANDMARKS.map(l => (
        <CircleMarker
          key={l.name}
          center={[l.lat, l.lng]}
          radius={5}
          pathOptions={{ color: "#60a5fa", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.9 }}
        >
          <Tooltip permanent direction="top" offset={[0, -4]} className="landmark-tooltip">
            <span dir="rtl" style={{ fontSize: 10 }}>{l.name}</span>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Health institutions — colored by bed occupancy */}
      {showInstitutions && INSTITUTIONS.map(inst => {
        const pct = occupancyPct(inst);
        const color = occupancyColor(pct);
        return (
          <CircleMarker
            key={inst.id}
            center={[inst.lat, inst.lng]}
            radius={inst.type === "hospital" ? 10 : 7}
            pathOptions={{ color, weight: 2.5, fillColor: color, fillOpacity: 0.35 }}
          >
            {/* direction="auto" — flips below the marker near the map's top edge instead of clipping */}
            <Tooltip direction="auto" offset={[0, -6]}>
              <div dir="rtl" style={{ fontSize: 11, lineHeight: 1.7 }}>
                <strong>{inst.name}</strong>
                <br />
                {INSTITUTION_TYPE_LABEL[inst.type]} · {INSTITUTION_STATUS_META[inst.status].label}
                <br />
                الأسرّة: {inst.bedsOccupied}/{inst.bedsTotal} ({pct}%)
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
