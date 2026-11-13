import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// RVC (razlika v ceni): nabavne cene materialov in stroški izdelave. Bere/piše zavihek RVC v Pregledu.
const KLJUC = "cenik-rvc";

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    return new Response(JSON.stringify(podatki || {}), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e) {
    console.error("Napaka pri branju RVC:", e);
    return Response.json({ napaka: "Napaka pri branju podatkov RVC." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const novo = await request.json();
    if (!novo || typeof novo !== "object" || Array.isArray(novo)) {
      return Response.json({ napaka: "Napačna oblika podatkov." }, { status: 400 });
    }
    await redis.set(KLJUC, novo);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju RVC:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju podatkov RVC." }, { status: 500 });
  }
}
