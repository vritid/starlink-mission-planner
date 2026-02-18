"use client";

import type { TleSat } from "../lib/orbit";

export default function SatellitePicker({
  satellites,
  selected,
  onSelect,
  selectedTimeIso,
  onClearTime,
}: {
  satellites: TleSat[];
  selected: TleSat | null;
  onSelect: (s: TleSat) => void;
  selectedTimeIso: string | null;
  onClearTime: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 p-3">
      <div className="text-sm font-semibold">Satellite</div>

      <select
        className="rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
        value={selected?.name ?? ""}
        onChange={(e) => {
          const sat = satellites.find((s) => s.name === e.target.value);
          if (sat) onSelect(sat);
        }}
      >
        {satellites.map((s) => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3 text-xs text-white/70">
        {selectedTimeIso ? (
          <>
            <span>
              Focus time:{" "}
              <span className="font-mono">{new Date(selectedTimeIso).toLocaleString()}</span>
            </span>
            <button
              onClick={onClearTime}
              className="rounded-lg border border-white/10 px-2 py-1 hover:bg-white/5"
            >
              Clear
            </button>
          </>
        ) : (
          <span>Focus time: now</span>
        )}
      </div>
    </div>
  );
}
