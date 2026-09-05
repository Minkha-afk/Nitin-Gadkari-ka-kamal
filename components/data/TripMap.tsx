'use client';

/**
 * Real-world map: OSM tiles under a Leaflet canvas.
 *
 * Everything else in this app draws its own SVG maps, but a route from OSRM is
 * real geography — it needs real tiles under it or the coordinates mean nothing.
 *
 * Leaflet's default marker icons resolve their PNGs by URL and break under a
 * bundler, so endpoints are divIcons and hazards are circle markers. Nothing to
 * ship, nothing to 404.
 */

import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@/lib/geo';
import { color, severityColor } from '@/lib/tokens';
import { CLASS_LABEL, type DamageClass, type Severity } from '@/lib/types';

/**
 * Anything drawable as a damage pin. A route Hazard satisfies this and adds
 * offsetM/alongM; a stored defect with no route to compare against does not.
 */
export interface MapPoint {
  id: string;
  damageClass: DamageClass;
  severity: Severity;
  severityLabel: string;
  lat: number;
  lng: number;
  address: string | null;
  imageUrl: string;
  offsetM?: number;
  alongM?: number;
}

export default function TripMap({
  route,
  hazards,
  source,
  destination,
  height = 460,
  onSelect,
}: {
  route: LatLng[];
  hazards: MapPoint[];
  source?: LatLng & { label: string };
  destination?: LatLng & { label: string };
  height?: number;
  onSelect?: (id: string) => void;
}) {
  const el = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<L.Map | null>(null);
  const layer = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView(
      [26.1445, 91.7362],
      12,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  React.useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();

    if (route.length > 1) {
      const line = route.map((p) => [p.lat, p.lng] as [number, number]);
      // A pale casing under the line so it reads over busy tiles.
      L.polyline(line, { color: '#FFFFFF', weight: 8, opacity: 0.9 }).addTo(g);
      L.polyline(line, { color: '#0A0A0A', weight: 4, opacity: 0.95 }).addTo(g);
    }

    const endpoint = (p: LatLng & { label: string }, letter: string, bg: string) =>
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<span style="display:flex;align-items:center;justify-content:center;
                 width:26px;height:26px;border-radius:50%;background:${bg};color:#fff;
                 font:600 12px/1 system-ui;border:2px solid #fff;
                 box-shadow:0 1px 4px rgba(0,0,0,.35)">${letter}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      })
        .bindPopup(p.label)
        .addTo(g);

    if (source) endpoint(source, 'A', '#0A0A0A');
    if (destination) endpoint(destination, 'B', color.mark);

    for (const h of hazards) {
      const c = severityColor(h.severity, 'light');
      const marker = L.circleMarker([h.lat, h.lng], {
        radius: h.severity === 'critical' || h.severity === 'high' ? 9 : 7,
        color: '#FFFFFF',
        weight: 2,
        fillColor: c,
        fillOpacity: 0.95,
      }).addTo(g);

      marker.bindPopup(
        `<div style="font:400 12px/1.5 system-ui;min-width:170px">
           <b style="font-size:12.5px">${CLASS_LABEL[h.damageClass] ?? h.damageClass} · ${h.severityLabel}</b><br/>
           ${h.address ? `${escapeHtml(h.address)}<br/>` : ''}
           ${
             h.offsetM != null && h.alongM != null
               ? `${h.offsetM} m off the route, ${(h.alongM / 1000).toFixed(1)} km in<br/>`
               : ''
           }
           <img src="${h.imageUrl}" alt="" style="width:100%;margin-top:6px;border-radius:6px"/>
         </div>`,
      );
      if (onSelect) marker.on('click', () => onSelect(h.id));
    }

    const pts: [number, number][] = [
      ...route.map((p) => [p.lat, p.lng] as [number, number]),
      ...hazards.map((h) => [h.lat, h.lng] as [number, number]),
    ];
    // Cap the zoom when fitting: two defects a few metres apart would otherwise
    // fill the frame with one building and lose all sense of where this is.
    if (pts.length === 1) m.setView(pts[0], 15);
    else if (pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [route, hazards, source, destination, onSelect]);

  return (
    <div
      ref={el}
      style={{
        height,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: color.c.inset,
        zIndex: 0,
      }}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
