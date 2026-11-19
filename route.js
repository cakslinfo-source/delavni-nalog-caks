import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Varnost: izvoz VSEH podatkov, izbris celotnega programa in obnova iz kopije. Samo admin (middleware).
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const OSEBE = "uporabniki";

function jeAdmin(request) {
  try {
    const g = request.headers.get("x-caks-uporabnik");
    return !!(g && JSON.parse(decodeURIComponent(g)).admin);
  } catch (e) {
    return false;
  }
}

async function vsiKljuci() {
  const kljuci = [];
  let kazalec = 0;
  do {
    const [naslednji, del] = await redis.scan(kazalec, { count: 500 });
    kazalec = Number(naslednji);
    kljuci.push(...del);
  } while (kazalec !== 0);
  return [...new Set(kljuci)].sort();
}

// GET            -> seznam vseh ključev
// GET ?kljuc=x   -> vrednost enega ključa
export async function GET(request) {
  if (!jeAdmin(request)) return Response.json({ napaka: "Samo admin." }, { status: 403 });
  try {
    const kljuc = new URL(request.url).searchParams.get("kljuc");
    if (kljuc) {
      const tip = await redis.type(kljuc);
      if (tip !== "string") return Response.json({ kljuc, preskoceno: true, tip });
      return Response.json({ kljuc, vrednost: await redis.get(kljuc) });
    }
    return Response.json({ kljuci: await vsiKljuci() });
  } catch (e) {
    return Response.json({ napaka: "Napaka pri branju.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}

// POST { akcija: "izbrisi", potrditev: "IZBRIŠI" }   -> izbriše vse razen oseb; osebe, ki niso admin, izklopi
// POST { akcija: "obnovi", kljuc, vrednost }          -> zapiše en ključ iz kopije
export async function POST(request) {
  if (!jeAdmin(request)) return Response.json({ napaka: "Samo admin." }, { status: 403 });
  try {
    const telo = await request.json();
    if (telo.akcija === "izbrisi") {
      if (telo.potrditev !== "IZBRIŠI") return Response.json({ napaka: "Manjka potrditev." }, { status: 400 });
      const kljuci = (await vsiKljuci()).filter((k) => k !== OSEBE);
      for (let i = 0; i < kljuci.length; i += 100) await redis.del(...kljuci.slice(i, i + 100));
      // prijava ostane samo adminom, da lahko program obnoviš
      const osebe = (await redis.get(OSEBE)) || [];
      if (Array.isArray(osebe)) await redis.set(OSEBE, osebe.map((u) => (u && !u.admin ? { ...u, aktiven: false } : u)));
      await redis.set("program-izbrisan", { cas: new Date().toISOString(), steviloKljucev: kljuci.length });
      return Response.json({ uspeh: true, izbrisano: kljuci.length });
    }
    if (telo.akcija === "obnovi") {
      if (!telo.kljuc || typeof telo.kljuc !== "string") return Response.json({ napaka: "Manjka ključ." }, { status: 400 });
      await redis.set(telo.kljuc, telo.vrednost);
      if (telo.zadnji) await redis.del("program-izbrisan");
      return Response.json({ uspeh: true });
    }
    return Response.json({ napaka: "Neznana akcija." }, { status: 400 });
  } catch (e) {
    return Response.json({ napaka: "Napaka.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
