"use client";

import { useEffect, useState } from "react";

export type Pass = {
  start: string;
  peak: string;
  end: string;
  maxElevationDeg: number;
};

type Props = {
  onPickPass?: (p: Pass) => void;
};

export default function PassTable({ onPickPass }: Props) {
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/passes", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setPasses((j.passes ?? []) as Pass[]);
      })
      .catch(() => setErr("Failed to load passes"));
  }, []);

  if (err) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-red-300">
        {err}
      </div>
    );
  }

  if (!passes) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-white/70">
        Loading passes…
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 p-4">
      <div className="mb-3 text-sm font-semibold">
        Next ISS passes over Toronto (24h, elevation ≥ 20°)
      </div>

      {passes.length === 0 ? (
        <div className="text-sm text-white/70">No passes found in the next 24 hours.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/60">
              <tr>
                <th className="py-2">Start</th>
                <th className="py-2">Peak</th>
                <th className="py-2">End</th>
                <th className="py-2">Max Elev</th>
              </tr>
            </thead>
            <tbody>
              {passes.slice(0, 10).map((p, idx) => (
                <tr
                  key={idx}
                  className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => onPickPass?.(p)}
                >
                  <td className="py-2">{new Date(p.start).toLocaleString()}</td>
                  <td className="py-2">{new Date(p.peak).toLocaleString()}</td>
                  <td className="py-2">{new Date(p.end).toLocaleString()}</td>
                  <td className="py-2">{p.maxElevationDeg.toFixed(1)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2 text-xs text-white/50">
        Tip: click a row to jump the map focus time to that pass.
      </div>
    </div>
  );
}
