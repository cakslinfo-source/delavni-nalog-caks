import { Redis } from "@upstash/redis";
import { zgostiGeslo, nakljucnaSol, MODULI } from "../../../lib/seja.js";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "uporabniki";

function jeAdmin(request) {
  try {
    const g = request.headers.get("x-caks-uporabnik");
    return !!(g && JSON.parse(decodeURIComponent(g)).admin);
  } catch (e) {
    return false;
  }
}

function brezGesla(u) {
  const { hash, sol, ...ostalo } = u;
  return ostalo;
}

async function preberi() {
  const s = (await redis.get(KLJUC)) || [];
  return Array.isArray(s) ? s : [];
}

const veljavniModuli = MODULI.map((m) => m.id);

export async function GET(request) {
  if (!jeAdmin(request)) return Response.json({ napaka: "Samo admin." }, { status: 403 });
  return Response.json({ uporabniki: (await preberi()).map(brezGesla), moduli: MODULI }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!jeAdmin(request)) return Response.json({ napaka: "Samo admin." }, { status: 403 });
  let t = {};
  try {
    t = await request.json();
  } catch (e) {
    return Response.json({ napaka: "Neveljavna zahteva." }, { status: 400 });
  }
  const ime = String(t.ime || "").trim().toLowerCase();
  if (!ime || !/^[a-z0-9._-]{2,30}$/.test(ime)) {
    return Response.json({ napaka: "Uporabniško ime: 2–30 znakov, samo male črke brez šumnikov, številke, . _ -" }, { status: 400 });
  }
  const seznam = await preberi();
  const idx = seznam.findIndex((x) => x && x.ime === ime);
  const moduli = Array.isArray(t.moduli) ? t.moduli.filter((m) => veljavniModuli.includes(m)) : [];

  if (t.akcija === "dodaj") {
    if (idx >= 0) return Response.json({ napaka: "To uporabniško ime že obstaja." }, { status: 400 });
    const geslo = String(t.geslo || "");
    if (geslo.length < 4) return Response.json({ napaka: "Geslo mora imeti vsaj 4 znake." }, { status: 400 });
    const sol = nakljucnaSol();
    seznam.push({
      ime,
      prikaz: String(t.prikaz || ime).trim() || ime,
      sol,
      hash: await zgostiGeslo(geslo, sol),
      verzija: 1,
      aktiven: true,
      admin: false,
      adminFunkcije: !!t.adminFunkcije,
      moduli,
      ustvarjen: new Date().toISOString(),
    });
  } else if (t.akcija === "uredi") {
    if (idx < 0) return Response.json({ napaka: "Uporabnika ni." }, { status: 404 });
    const u = seznam[idx];
    u.prikaz = String(t.prikaz || u.prikaz || ime).trim() || ime;
    if (!u.admin) {
      u.aktiven = t.aktiven !== false;
      u.adminFunkcije = !!t.adminFunkcije;
      u.moduli = moduli;
    }
    if (t.geslo) {
      const geslo = String(t.geslo);
      if (geslo.length < 4) return Response.json({ napaka: "Geslo mora imeti vsaj 4 znake." }, { status: 400 });
      u.sol = nakljucnaSol();
      u.hash = await zgostiGeslo(geslo, u.sol);
      u.verzija = (u.verzija || 0) + 1; // stare seje prenehajo veljati
      delete u.zacetnoGeslo;
    } else if (u.aktiven === false) {
      u.verzija = (u.verzija || 0) + 1;
    }
  } else if (t.akcija === "izbrisi") {
    if (idx < 0) return Response.json({ napaka: "Uporabnika ni." }, { status: 404 });
    if (seznam[idx].admin) return Response.json({ napaka: "Admina ni mogoče izbrisati." }, { status: 400 });
    seznam.splice(idx, 1);
  } else {
    return Response.json({ napaka: "Neznana akcija." }, { status: 400 });
  }
  await redis.set(KLJUC, seznam);
  return Response.json({ uspeh: true, uporabniki: seznam.map(brezGesla) });
}
