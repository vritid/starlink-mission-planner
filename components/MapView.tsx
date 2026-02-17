"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import type { TleSat } from "../lib/orbit";
import { sampleGroundTrack, toLeafletLatLngs, propagateLatLonAlt } from "../lib/orbit";


function fixLeafletIcons() {
  // @ts-expect-error Leaflet internal
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

type ApiResponse = {
  cached: boolean;
  ts: number;
  data: {
    stations: TleSat[];
    starlink: TleSat[];
  };
};

export default function MapView() {
  const toronto: [number, number] = [43.6532, -79.3832];

  const [issTle, setIssTle] = useState<TleSat | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Tick time (for moving marker)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch TLEs once
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/tle", { cache: "no-store" });
      const json = (await res.json()) as ApiResponse;

      // Find ISS from "stations" group (usually named "ISS (ZARYA)")
      const iss = json.data.stations.find((s) => s.name.toUpperCase().includes("ISS"));
      if (!cancelled) setIssTle(iss ?? null);
    }

    load().catch(() => setIssTle(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const { trackLatLngs, currentPos } = useMemo(() => {
    if (!issTle) return { trackLatLngs: [] as [number, number][], currentPos: null as any };

    const start = new Date(now.getTime() - 45 * 60 * 1000);
    const end = new Date(now.getTime() + 45 * 60 * 1000);

    const pts = sampleGroundTrack(issTle, start, end, 60);
    const trackLatLngs = toLeafletLatLngs(pts);

    const cur = propagateLatLonAlt(issTle, now);
    const currentPos = cur ? ([cur.lat, cur.lon] as [number, number]) : null;


    return { trackLatLngs, currentPos };
  }, [issTle, now]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-white/10">
      <MapContainer center={toronto} zoom={2} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Toronto marker */}
        <Marker position={toronto}>
          <Popup>Toronto (default observer)</Popup>
        </Marker>

        {/* ISS track */}
        {trackLatLngs.length > 1 && (
          <Polyline
            positions={trackLatLngs}
            pathOptions={{ weight: 3, opacity: 0.9 }}
          />
        )}

        {/* ISS current position */}
        {currentPos && (
          <Marker position={currentPos}>
            <Popup>
              <b>ISS</b>
              <br />
              {now.toLocaleString()}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-6 top-[108px] rounded-lg bg-black/60 px-3 py-2 text-xs text-white/80">
        {issTle ? (
          <>
            <div className="font-semibold">Tracking: ISS</div>
            <div className="opacity-80">Ground track ±45 min</div>
          </>
        ) : (
          <div className="opacity-80">Loading ISS TLE…</div>
        )}
      </div>
    </div>
  );
}
