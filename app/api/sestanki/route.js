import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "vsi-sestanki";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    return Response.json(podatki || []);
  } catch (e) {
    console.error("Napaka pri branju sestankov iz Redis:", e);
    return Response.json(
      { napaka: "Napaka pri branju podatkov.", podrobnosti: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const noviSeznam = await request.json();
    await redis.set(KLJUC, noviSeznam);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju sestankov v Redis:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju." }, { status: 500 });
  }
}
