import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Javni API za stran stanja stranke: vrne SAMO številko, status in rok enega naročila.
export async function GET(request, { params }) {
  const id = String(params.id);
  const odgovor = (obj, status = 200) =>
    Response.json(obj, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const [nalogi, pulti, spomeniki] = await Promise.all([
      redis.get("vsi-nalogi"),
      redis.get("vsi-pulti"),
      redis.get("vsi-spomeniki"),
    ]);
    const poisci = (s) => (Array.isArray(s) ? s.find((x) => x && String(x.id) === id) : null);

    const n = poisci(nalogi);
    if (n) return odgovor({ vrsta: "Police", stevilka: n.stevilka, status: n.status, rok: n.rok || null });
    const p = poisci(pulti);
    if (p) return odgovor({ vrsta: "Pulti", stevilka: p.stevilka, status: p.status, rok: p.datumMontaze || null });
    const s = poisci(spomeniki);
    if (s) return odgovor({ vrsta: "Spomenik", stevilka: s.stevilka, status: s.status, rok: s.montaza || null });
    return odgovor({ najdeno: false }, 404);
  } catch (e) {
    return odgovor({ napaka: "Napaka pri branju." }, 500);
  }
}
