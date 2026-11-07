import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const PREDPONA = "slika-skladisce:";
const jeVeljavenKljuc = (k) => typeof k === "string" && /^[A-Za-z0-9_-]{3,80}$/.test(k);

// GET ?kljuc=…  → vrne sliko kot navadno sliko (da jo brskalnik lahko shrani v predpomnilnik)
export async function GET(request) {
  const kljuc = new URL(request.url).searchParams.get("kljuc");
  if (!jeVeljavenKljuc(kljuc)) return new Response("Neveljaven ključ.", { status: 400 });
  try {
    const podatki = await redis.get(PREDPONA + kljuc);
    const m = typeof podatki === "string" ? podatki.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
    if (!m) return new Response("Ni slike.", { status: 404 });
    return new Response(Buffer.from(m[2], "base64"), {
      status: 200,
      headers: {
        "Content-Type": m[1],
        // ključ se ob vsaki novi sliki spremeni, zato je predpomnjenje varno
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("Napaka pri branju slike skladišča:", e);
    return new Response("Napaka pri branju slike.", { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { kljuc, podatki } = await request.json();
    if (!jeVeljavenKljuc(kljuc)) return Response.json({ napaka: "Neveljaven ključ slike." }, { status: 400 });
    if (typeof podatki !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(podatki)) {
      return Response.json({ napaka: "Neveljavna slika." }, { status: 400 });
    }
    if (podatki.length > 900000) return Response.json({ napaka: "Slika je prevelika." }, { status: 413 });
    await redis.set(PREDPONA + kljuc, podatki);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju slike skladišča:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju slike." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const kljuc = new URL(request.url).searchParams.get("kljuc");
    if (jeVeljavenKljuc(kljuc)) await redis.del(PREDPONA + kljuc);
    return Response.json({ uspeh: true });
  } catch (e) {
    return Response.json({ napaka: "Napaka pri brisanju slike." }, { status: 500 });
  }
}
