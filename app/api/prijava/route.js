import { Redis } from "@upstash/redis";
import { ustvariZeton, zgostiGeslo, nakljucnaSol, geslo_ustreza, TRAJANJE_SEJE } from "../../../lib/seja.js";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "uporabniki";

function piskotek(vrednost, maxAge) {
  return ["caks-seja=" + vrednost, "Path=/", "HttpOnly", "SameSite=Lax", "Secure", `Max-Age=${maxAge}`].join("; ");
}

export async function POST(request) {
  let ime = "";
  let geslo = "";
  try {
    const telo = await request.json();
    ime = String((telo && telo.ime) || "").trim().toLowerCase();
    geslo = String((telo && telo.geslo) || "");
  } catch (e) {}
  const zavrni = async () => {
    await new Promise((r) => setTimeout(r, 1200)); // počasnejše ugibanje
    return Response.json({ napaka: "Napačno uporabniško ime ali geslo." }, { status: 401 });
  };
  if (!ime || !geslo) return zavrni();

  let seznam = (await redis.get(KLJUC)) || [];
  if (!Array.isArray(seznam)) seznam = [];

  // Prvi zagon: če še ni nobenega admina, se ustvari admin "luka" z začetnim geslom (ADMIN_GESLO ali 1991).
  if (!seznam.some((x) => x && x.admin)) {
    const zacetno = process.env.ADMIN_GESLO || "1991";
    if (ime === "luka" && geslo === zacetno) {
      const sol = nakljucnaSol();
      seznam.push({
        ime: "luka",
        prikaz: "Luka",
        sol,
        hash: await zgostiGeslo(zacetno, sol),
        verzija: 1,
        aktiven: true,
        admin: true,
        adminFunkcije: true,
        moduli: [],
        zacetnoGeslo: true,
        ustvarjen: new Date().toISOString(),
      });
      await redis.set(KLJUC, seznam);
    }
  }

  const u = seznam.find((x) => x && x.ime === ime);
  if (!u || u.aktiven === false || !(await geslo_ustreza(u, geslo))) return zavrni();

  const odgovor = Response.json({ uspeh: true, zacetnoGeslo: !!u.zacetnoGeslo });
  odgovor.headers.append("Set-Cookie", piskotek(await ustvariZeton(u.ime, u.verzija || 0), TRAJANJE_SEJE));
  return odgovor;
}

// odjava
export async function DELETE() {
  const odgovor = Response.json({ uspeh: true });
  odgovor.headers.append("Set-Cookie", piskotek("", 0));
  return odgovor;
}
