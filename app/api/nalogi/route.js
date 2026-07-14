import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "vsi-nalogi";
const VERZIJA_KLJUC = "vsi-nalogi-verzija";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    const verzija = Number((await redis.get(VERZIJA_KLJUC)) || 0);
    return new Response(JSON.stringify(podatki || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Verzija": String(verzija),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e) {
    console.error("Napaka pri branju iz Redis:", e);
    return Response.json({ napaka: "Napaka pri branju podatkov.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const telo = await request.json();

    // Star format (samo seznam, brez verzije) - zavrni, da ne pride do tihega prepisa.
    // To se zgodi, če ima kdo odprto staro, še ne osveženo različico aplikacije.
    if (Array.isArray(telo)) {
      return Response.json(
        { napaka: "Aplikacija na tej napravi je zastarela. Osveži stran (F5) in poskusi znova.", zastarelaAplikacija: true },
        { status: 409 }
      );
    }

    const { seznam, pricakovanaVerzija } = telo;
    const trenutnaVerzija = Number((await redis.get(VERZIJA_KLJUC)) || 0);

    if (
      pricakovanaVerzija !== undefined &&
      pricakovanaVerzija !== null &&
      Number(pricakovanaVerzija) !== trenutnaVerzija
    ) {
      return Response.json(
        {
          napaka: "Podatki so bili medtem spremenjeni na drugi napravi. Preveri najnovejše stanje in poskusi znova.",
          konflikt: true,
          trenutnaVerzija,
        },
        { status: 409 }
      );
    }

    const novaVerzija = trenutnaVerzija + 1;
    await redis.set(KLJUC, seznam);
    await redis.set(VERZIJA_KLJUC, novaVerzija);
    return Response.json({ uspeh: true, verzija: novaVerzija });
  } catch (e) {
    console.error("Napaka pri shranjevanju v Redis:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju." }, { status: 500 });
  }
}
