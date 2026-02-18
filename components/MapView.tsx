"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import type { TleSat } from "../lib/orbit";
import { sampleGroundTrack, toLeafletLatLngs, propagateLatLonAlt } from "../lib/orbit";

function fixLeafletIcons() {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

type ApiResponse = {
  data: {
    stations: TleSat[];
    starlink: TleSat[];
  };
};

export default function MapView({
  satellite,
  focusTimeIso,
}: {
  satellite: TleSat | null;
  focusTimeIso: string | null;
}) {
  const toronto: [number, number] = [43.6532, -79.3832];

  const [issFallback, setIssFallback] = useState<TleSat | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Live clock updates only matter when focusTimeIso is null
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fallback: load ISS once, so map still works even if satellite prop is null
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/tle", { cache: "no-store" });
      const json = (await res.json()) as ApiResponse;
      const iss = json.data.stations.find((s) => s.name.toUpperCase().includes("ISS"));
      if (!cancelled) setIssFallback(iss ?? null);
    }
    load().catch(() => setIssFallback(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSat = satellite ?? issFallback;

  const focusTime = useMemo(() => {
    return focusTimeIso ? new Date(focusTimeIso) : now;
  }, [focusTimeIso, now]);

  const { trackLatLngs, currentPos } = useMemo(() => {
    if (!activeSat) return { trackLatLngs: [] as [number, number][], currentPos: null as any };

    // Rolling horizon around the focus time
    const start = new Date(focusTime.getTime() - 45 * 60 * 1000);
    const end = new Date(focusTime.getTime() + 45 * 60 * 1000);

    const pts = sampleGroundTrack(activeSat, start, end, 60);
    const trackLatLngs = toLeafletLatLngs(pts);

    const cur = propagateLatLonAlt(activeSat, focusTime);
    const currentPos = cur ? ([cur.lat, cur.lon] as [number, number]) : null;

    return { trackLatLngs, currentPos };
  }, [activeSat, focusTime]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-white/10 relative">
      <MapContainer center={toronto} zoom={2} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={toronto}>
          <Popup>Toronto (default observer)</Popup>
        </Marker>

        {trackLatLngs.length > 1 && (
          <Polyline positions={trackLatLngs} pathOptions={{ weight: 3, opacity: 0.9 }} />
        )}

        {currentPos && (
          <Marker position={currentPos}>
            <Popup>
              <b>{activeSat?.name ?? "Satellite"}</b>
              <br />
              {focusTime.toLocaleString()}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-2 text-xs text-white/80">
        <div className="font-semibold">Tracking: {activeSat ? activeSat.name : "Loading…"}</div>
        <div className="opacity-80">Track window: ±45 min</div>
      </div>
    </div>
  );
}
