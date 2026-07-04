import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KLJUC = "vsi-nalogi";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    return Response.json(podatki || []);
  } catch (e) {
    console.error("Napaka pri branju iz Redis:", e);
    return Response.json({ napaka: "Napaka pri branju podatkov." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const noviSeznam = await request.json();
    await redis.set(KLJUC, noviSeznam);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju v Redis:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju." }, { status: 500 });
  }
}
