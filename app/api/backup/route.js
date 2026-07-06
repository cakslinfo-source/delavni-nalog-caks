import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const GLAVNI_KLJUC = "vsi-nalogi";
const SEZNAM_KLJUC = "backup:seznam";
const MAX_STEVILO_KOPIJ = 30;

export async function GET() {
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
