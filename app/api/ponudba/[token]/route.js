import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "vsi-nalogi";
const VERZIJA_KLJUC = "vsi-nalogi-verzija";

const odgovor = (obj, status = 200) =>
  Response.json(obj, { status, headers: { "Cache-Control": "no-store" } });

const jeVeljavenZeton = (t) => typeof t === "string" && /^[a-f0-9]{24,64}$/.test(t);

async function poisci(zeton) {
  const seznam = (await redis.get(KLJUC)) || [];
  if (!Array.isArray(seznam)) return { seznam: [], idx: -1 };
  return { seznam, idx: seznam.findIndex((n) => n && n.podpisToken === zeton) };
}

// Javni podatki ponudbe za stranko: brez telefona, e-pošte, internih opomb in drugih naročil.
export async function GET(request, { params }) {
  const zeton = params.token;
  if (!jeVeljavenZeton(zeton)) return odgovor({ napaka: "Povezava ni veljavna." }, 404);
  try {
    const { seznam, idx } = await poisci(zeton);
    if (idx < 0) return odgovor({ napaka: "Povezava ni veljavna ali je potekla." }, 404);
    const n = seznam[idx];
    const neto = parseFloat(String(n.cena).replace(",", ".")) || 0;
    const popust = parseFloat(String(n.popustSkupaj).replace(",", ".")) || 0;
    const netoPoPopustu = neto * (1 - popust / 100);
    return odgovor({
      stevilka: n.stevilka || "",
      jePonudba: n.vrsta === "ponudba",
      stranka: n.stranka || "",
      objekt: n.tipStranke === "pravna" ? n.objekt || "" : n.objekt || "",
      opis: n.opis || "",
      veljavnost: n.veljavnostPonudbe || "",
      datum: n.datumVnosa || "",
      rok: n.rok || "",
      neto: Math.round(neto * 100) / 100,
      popust,
      netoPoPopustu: Math.round(netoPoPopustu * 100) / 100,
      bruto: Math.round(netoPoPopustu * 1.22 * 100) / 100,
      postavke: (n.postavke || [])
        .filter((p) => p && (p.naziv || p.material || p.dolzina))
        .map((p) => ({
          naziv: p.naziv || "",
          material: p.material || "",
          dolzina: p.dolzina || "",
          sirina: p.poseven ? "" : p.sirina || "",
          sirinaLevo: p.poseven ? p.sirinaLevo || "" : "",
          sirinaDesno: p.poseven ? p.sirinaDesno || "" : "",
          poseven: !!p.poseven,
          debelina: p.debelina || "",
          kolicina: p.kolicina || "1",
          vecKosov: !!p.vecKosov,
          steviloKosov: p.steviloKosov || "",
        })),
      podpisano: n.ponudbaPodpis
        ? { ime: n.ponudbaPodpis.ime || "", datum: n.ponudbaPodpis.datum || "" }
        : null,
    });
  } catch (e) {
    return odgovor({ napaka: "Napaka pri branju." }, 500);
  }
}

export async function POST(request, { params }) {
  const zeton = params.token;
  if (!jeVeljavenZeton(zeton)) return odgovor({ napaka: "Povezava ni veljavna." }, 404);
  let telo = {};
  try {
    telo = await request.json();
  } catch (e) {
    return odgovor({ napaka: "Neveljavna zahteva." }, 400);
  }
  const ime = String(telo.ime || "").trim().slice(0, 120);
  const podpis = String(telo.podpis || "");
  if (!ime) return odgovor({ napaka: "Vpiši ime in priimek." }, 400);
  if (!telo.potrjujem) return odgovor({ napaka: "Potrdi, da se strinjaš z ponudbo." }, 400);
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(podpis) || podpis.length > 250000) {
    return odgovor({ napaka: "Podpis ni veljaven. Podpiši se znova." }, 400);
  }
  try {
    const { seznam, idx } = await poisci(zeton);
    if (idx < 0) return odgovor({ napaka: "Povezava ni veljavna ali je potekla." }, 404);
    if (seznam[idx].ponudbaPodpis) return odgovor({ napaka: "Ta ponudba je že podpisana." }, 409);
    const neto = parseFloat(String(seznam[idx].cena).replace(",", ".")) || 0;
    const popust = parseFloat(String(seznam[idx].popustSkupaj).replace(",", ".")) || 0;
    const netoPoPopustu = neto * (1 - popust / 100);
    seznam[idx] = {
      ...seznam[idx],
      ponudbaPodpis: {
        ime,
        slika: podpis,
        datum: new Date().toISOString(),
        ip: (request.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64),
        naprava: (request.headers.get("user-agent") || "").slice(0, 200),
        netoPoPopustu: Math.round(netoPoPopustu * 100) / 100,
        bruto: Math.round(netoPoPopustu * 1.22 * 100) / 100,
      },
    };
    const trenutna = Number((await redis.get(VERZIJA_KLJUC)) || 0);
    await redis.set(KLJUC, seznam);
    await redis.set(VERZIJA_KLJUC, trenutna + 1);
    return odgovor({ uspeh: true, datum: seznam[idx].ponudbaPodpis.datum });
  } catch (e) {
    return odgovor({ napaka: "Napaka pri shranjevanju. Poskusi znova." }, 500);
  }
}
