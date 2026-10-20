import { Redis } from "@upstash/redis";
import { preveriZeton, MODULI } from "../../../lib/seja.js";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Kdo sem in kaj smem (za prikaz v programu).
export async function GET(request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)caks-seja=([^;]+)/);
  const z = await preveriZeton(m && m[1]);
  if (!z) return Response.json({ napaka: "Ni prijave." }, { status: 401 });
  const seznam = (await redis.get("uporabniki")) || [];
  const u = Array.isArray(seznam) ? seznam.find((x) => x && x.ime === z.u) : null;
  if (!u || u.aktiven === false) return Response.json({ napaka: "Ni prijave." }, { status: 401 });
  return Response.json(
    {
      ime: u.ime,
      prikaz: u.prikaz || u.ime,
      admin: !!u.admin,
      adminFunkcije: !!(u.admin || u.adminFunkcije),
      moduli: u.admin ? MODULI.map((x) => x.id) : u.moduli || [],
      seja: z.iat,
      zacetnoGeslo: !!u.zacetnoGeslo,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
