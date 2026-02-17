import { NextResponse } from "next/server";

type TleSat = { name: string; line1: string; line2: string };

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let cache: { ts: number; data: Record<string, TleSat[]> } | null = null;

const SOURCES: Record<string, string> = {
  starlink: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
  stations: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
};

function parseTle(text: string): TleSat[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: TleSat[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (line1.startsWith("1 ") && line2.startsWith("2 ")) out.push({ name, line1, line2 });
  }
  return out;
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ cached: true, ...cache });
  }

  const entries = await Promise.all(
    Object.entries(SOURCES).map(async ([key, url]) => {
      const res = await fetch(url, { next: { revalidate: 60 * 60 } });
      if (!res.ok) throw new Error(`Failed to fetch ${key} TLEs: ${res.status}`);
      return [key, parseTle(await res.text())] as const;
    })
  );

  const data = Object.fromEntries(entries);
  cache = { ts: now, data };

  return NextResponse.json({ cached: false, ts: now, data });
}
