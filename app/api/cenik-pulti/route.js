import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "cenik-pulti";

const PRIVZETI_CENIK = {
  materiali: [
    { id: "granit", naziv: "Granit", cenaM2: 250 },
    { id: "kvarc", naziv: "Kvarc", cenaM2: 280 },
    { id: "keramika", naziv: "Keramika", cenaM2: 300 },
  ],
  razrezTm: 15,
  brusenjeTm: 25,
  izrezi: {
    luknja: 20,
    poglobitev: 60,
    inlinePoglobitev: 90,
    izrez: 80,
  },
};

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    return Response.json(podatki || PRIVZETI_CENIK);
  } catch (e) {
    console.error("Napaka pri branju cenika:", e);
    return Response.json({ napaka: "Napaka pri branju cenika." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const novCenik = await request.json();
    await redis.set(KLJUC, novCenik);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju cenika:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju cenika." }, { status: 500 });
  }
}
