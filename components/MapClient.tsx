"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { TleSat } from "../lib/orbit";
import SatellitePicker from "./SatellitePicker";
import PassTable from "./PassTable";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapClient() {
  const [satellites, setSatellites] = useState<TleSat[]>([]);
  const [selectedSat, setSelectedSat] = useState<TleSat | null>(null);

  // Map time control: when null, map uses "now"
  const [selectedTimeIso, setSelectedTimeIso] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tle", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        const iss = (j.data.stations as TleSat[]).find((s) => s.name.toUpperCase().includes("ISS"));
        const starlinks = (j.data.starlink as TleSat[]).slice(0, 25); // keep it light for now
        const list = [iss, ...starlinks].filter(Boolean) as TleSat[];
        setSatellites(list);
        setSelectedSat(iss ?? list[0] ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <SatellitePicker
        satellites={satellites}
        selected={selectedSat}
        onSelect={setSelectedSat}
        selectedTimeIso={selectedTimeIso}
        onClearTime={() => setSelectedTimeIso(null)}
      />

      <MapView satellite={selectedSat} focusTimeIso={selectedTimeIso} />

      <PassTable
  satelliteName={selectedSat?.name ?? "ISS"}
  observer={{ lat: 43.6532, lon: -79.3832 }}
  onPickPass={(p) => setSelectedTimeIso(p.peak)}
/>

    </div>
  );
}
