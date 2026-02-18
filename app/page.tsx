import MapClient from "../components/MapClient";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Starlink Mission Planner</h1>
        <p className="mt-2 text-sm text-white/70">
          Ground tracks + pass planning + ML scoring (i&apos;ll add the space stuff next)
        </p>
      </div>

      <MapClient />
      

      <div className="mt-4 text-xs text-white/60">
        dev note: quick check: open <span className="font-mono">/api/tle</span> to see fetched TLE data.
      </div>
    </main>
  );
}
