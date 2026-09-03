
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "obvestilo-plosca";
const VERZIJA_KLJUC = "obvestilo-plosca-verzija";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    const verzija = Number((await redis.get(VERZIJA_KLJUC)) || 0);
    return new Response(JSON.stringify(podatki || null), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Verzija": String(verzija),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e) {
    console.error("Napaka pri branju obvestila:", e);
    return Response.json({ napaka: "Napaka pri branju." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { podatki, pricakovanaVerzija } = await request.json();
    const trenutnaVerzija = Number((await redis.get(VERZIJA_KLJUC)) || 0);

    if (
      pricakovanaVerzija !== undefined &&
      pricakovanaVerzija !== null &&
      Number(pricakovanaVerzija) !== trenutnaVerzija
    ) {
      return Response.json(
        { napaka: "Nekdo drug je medtem dodal komentar. Osveži in poskusi znova.", konflikt: true, trenutnaVerzija },
        { status: 409 }
      );
    }

    const novaVerzija = trenutnaVerzija + 1;
    await redis.set(KLJUC, podatki);
    await redis.set(VERZIJA_KLJUC, novaVerzija);
    return Response.json({ uspeh: true, verzija: novaVerzija });
  } catch (e) {
    console.error("Napaka pri shranjevanju obvestila:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju." }, { status: 500 });
  }
}
