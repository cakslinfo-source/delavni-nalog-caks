
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kljuc = searchParams.get("kljuc");
  if (!kljuc) return Response.json({ napaka: "Manjka ključ priloge." }, { status: 400 });
  try {
    const podatki = await redis.get(`priloga-spomenik:${kljuc}`);
    return new Response(JSON.stringify(podatki || null), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e) {
    return Response.json({ napaka: "Napaka pri branju priloge." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { kljuc, podatki } = await request.json();
    if (!kljuc) return Response.json({ napaka: "Manjka ključ priloge." }, { status: 400 });
    await redis.set(`priloga-spomenik:${kljuc}`, podatki);
    return Response.json({ uspeh: true });
  } catch (e) {
    return Response.json({ napaka: "Napaka pri shranjevanju priloge. Datoteka je morda prevelika." }, { status: 500 });
  }
}
