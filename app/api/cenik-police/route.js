
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "cenik-police";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    return new Response(JSON.stringify(podatki || {}), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e) {
    console.error("Napaka pri branju cenika Police:", e);
    return Response.json({ napaka: "Napaka pri branju cenika." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const novCenik = await request.json();
    await redis.set(KLJUC, novCenik);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju cenika Police:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju cenika." }, { status: 500 });
  }
}
