// Zaklep celotnega programa: brez prijave (uporabniško ime + geslo) ne gre nič.
// Javno ostane samo prijava in stran stanja za stranke (/status/… in /api/status/…).
import { NextResponse } from "next/server";
import { preveriZeton, dostopDoPoti, prvaStran } from "./lib/seja.js";

let predpomnilnik = { cas: 0, seznam: [] };

async function preberiUporabnike(sveze) {
  if (!sveze && Date.now() - predpomnilnik.cas < 5000) return predpomnilnik.seznam;
  const url = process.env.KV_REST_API_URL;
  const zeton = process.env.KV_REST_API_TOKEN;
  const r = await fetch(`${url}/get/uporabniki`, { headers: { Authorization: `Bearer ${zeton}` }, cache: "no-store" });
  if (!r.ok) throw new Error("redis " + r.status);
  const j = await r.json();
  let v = j.result;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch (e) { v = []; }
  }
  predpomnilnik = { cas: Date.now(), seznam: Array.isArray(v) ? v : [] };
  return predpomnilnik.seznam;
}

function brezGlave(request) {
  const glave = new Headers(request.headers);
  glave.delete("x-caks-uporabnik");
  return glave;
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const metoda = request.method;

  const javno =
    pathname === "/prijava" ||
    pathname === "/api/prijava" ||
    pathname.startsWith("/status/") ||
    pathname.startsWith("/api/status/");
  if (javno) return NextResponse.next({ request: { headers: brezGlave(request) } });

  // dnevna varnostna kopija, ki jo sproži Vercel
  const ua = request.headers.get("user-agent") || "";
  if (pathname === "/api/backup" && ua.startsWith("vercel-cron")) return NextResponse.next({ request: { headers: brezGlave(request) } });

  const jeApi = pathname.startsWith("/api/");
  const neprijavljen = () => {
    if (jeApi) return NextResponse.json({ napaka: "Potrebna je prijava." }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/prijava";
    url.search = `?naprej=${encodeURIComponent(pathname + search)}`;
    const o = NextResponse.redirect(url);
    o.cookies.delete("caks-seja");
    return o;
  };

  const zeton = await preveriZeton(request.cookies.get("caks-seja")?.value);
  if (!zeton) return neprijavljen();

  let uporabnik = null;
  try {
    const najdi = (seznam) => seznam.find((x) => x && x.ime === zeton.u) || null;
    uporabnik = najdi(await preberiUporabnike(false));
    // predpomnjen seznam je morda zastarel (nova oseba, spremenjeno geslo): enkrat preberi na novo
    if (!uporabnik || (uporabnik.verzija || 0) !== (zeton.v || 0) || uporabnik.aktiven === false) {
      uporabnik = najdi(await preberiUporabnike(true));
    }
  } catch (e) {
    return jeApi ? NextResponse.json({ napaka: "Napaka pri preverjanju prijave." }, { status: 503 }) : new NextResponse("Napaka pri preverjanju prijave. Osveži stran.", { status: 503 });
  }
  if (!uporabnik || uporabnik.aktiven === false || (uporabnik.verzija || 0) !== (zeton.v || 0)) return neprijavljen();

  // pravica admin je potrebna za upravljanje oseb
  const jeAdminPot = pathname.startsWith("/uporabniki") || pathname.startsWith("/api/uporabniki") || pathname === "/api/backup";
  let odlocitev = jeAdminPot ? (uporabnik.admin ? "ok" : "zavrni") : dostopDoPoti(pathname, metoda, uporabnik);
  if (jeAdminPot && uporabnik.admin) odlocitev = "ok";

  if (odlocitev !== "ok") {
    if (jeApi) {
      if (jeAdminPot) return NextResponse.json({ napaka: "Samo admin." }, { status: 403 });
      if (metoda === "GET" || metoda === "HEAD") {
        // prazen odgovor namesto napake, da strani ne razpadejo
        if (pathname.startsWith("/api/cenik-")) return NextResponse.json({}, { headers: { "Cache-Control": "no-store" } });
        if (/^\/api\/priloge/.test(pathname)) return NextResponse.json({ napaka: "Ni dostopa." }, { status: 403 });
        return NextResponse.json([], { headers: { "Cache-Control": "no-store", "X-Dostop": "zavrnjen" } });
      }
      return NextResponse.json({ napaka: "Za to nimaš pravice." }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    const doma = prvaStran(uporabnik);
    if (doma && doma !== pathname) {
      url.pathname = doma;
      url.search = "";
      return NextResponse.redirect(url);
    }
    url.pathname = "/prijava";
    url.search = "?napaka=dostop";
    return NextResponse.redirect(url);
  }

  const glave = brezGlave(request);
  glave.set(
    "x-caks-uporabnik",
    encodeURIComponent(JSON.stringify({ ime: uporabnik.ime, admin: !!uporabnik.admin }))
  );
  return NextResponse.next({ request: { headers: glave } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png|apple-touch-icon.png).*)"],
};
