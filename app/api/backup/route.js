import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const GLAVNI_KLJUC = "vsi-nalogi";
const SEZNAM_KLJUC = "backup:seznam";
const MAX_STEVILO_KOPIJ = 30;

// ---------- Varnost (samo admin): izvoz VSEH podatkov, izbris celotnega programa, obnova ----------
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

// GET ?varnost=seznam          -> seznam vseh ključev
// GET ?varnost=kljuc&kljuc=x   -> vrednost enega ključa
// GET (brez parametrov)        -> dnevna varnostna kopija nalogov (Vercel cron), kot prej
export async function GET(request) {
  const varnost = request ? new URL(request.url).searchParams.get("varnost") : null;
  if (varnost) {
    if (!jeAdmin(request)) return Response.json({ napaka: "Samo admin." }, { status: 403 });
    try {
      if (varnost === "kljuc") {
        const kljuc = new URL(request.url).searchParams.get("kljuc");
        const tip = await redis.type(kljuc);
        if (tip !== "string") return Response.json({ kljuc, preskoceno: true, tip });
        return Response.json({ kljuc, vrednost: await redis.get(kljuc) });
      }
      return Response.json({ kljuci: await vsiKljuci() });
    } catch (e) {
      return Response.json({ napaka: "Napaka pri branju.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
    }
  }
  try {
    const podatki = await redis.get(GLAVNI_KLJUC);
    const danes = new Date().toISOString().slice(0, 10);
    await redis.set(`backup:${danes}`, podatki || []);

    let seznam = (await redis.get(SEZNAM_KLJUC)) || [];
    if (!Array.isArray(seznam)) seznam = [];
    if (!seznam.includes(danes)) {
      seznam.push(danes);
      while (seznam.length > MAX_STEVILO_KOPIJ) {
        const odvecDatum = seznam.shift();
        await redis.del(`backup:${odvecDatum}`);
      }
      await redis.set(SEZNAM_KLJUC, seznam);
    }

    return Response.json({ uspeh: true, datum: danes, steviloNalogov: (podatki || []).length });
  } catch (e) {
    console.error("Napaka pri ustvarjanju varnostne kopije:", e);
    return Response.json({ napaka: "Napaka pri ustvarjanju varnostne kopije.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
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
    if (telo.akcija === "ponastavi") {
      // Ponastavitev na začetek: izbriše VSE (naročila, ponudbe, ceniki, material, skladišče, slike, kopije …),
      // kot ob prvem zagonu. Ostanejo samo osebe s prijavami, da te ne vrže ven.
      if (telo.potrditev !== "PONASTAVI") return Response.json({ napaka: "Manjka potrditev." }, { status: 400 });
      const OHRANI = new Set([OSEBE]);
      const kljuci = (await vsiKljuci()).filter((k) => !OHRANI.has(k));
      let izbrisano = 0;
      const zaBrisanje = [];
      for (const k of kljuci) {
        if (k.endsWith("-verzija")) {
          // verzijo povečamo, da odprt star zavihek ne more shraniti starih podatkov nazaj
          const v = Number((await redis.get(k)) || 0);
          await redis.set(k, v + 1);
        } else {
          zaBrisanje.push(k);
        }
      }
      for (let i = 0; i < zaBrisanje.length; i += 100) {
        await redis.del(...zaBrisanje.slice(i, i + 100));
        izbrisano += Math.min(100, zaBrisanje.length - i);
      }
      return Response.json({ uspeh: true, izbrisano });
    }
    if (telo.akcija === "skrij") {
      if (telo.vklopi) await redis.set("program-skrit", { cas: new Date().toISOString() });
      else await redis.del("program-skrit");
      return Response.json({ uspeh: true, skrit: !!telo.vklopi });
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
