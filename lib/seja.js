// Skupna logika prijave (deluje v middleware in v API-jih): podpis seje, geslo, pravice.
const enc = new TextEncoder();

export const TRAJANJE_SEJE = 7 * 24 * 60 * 60; // 7 dni v sekundah

export const MODULI = [
  { id: "police", naziv: "Police", poti: ["/"] },
  { id: "pulti", naziv: "Pulti", poti: ["/pulti"] },
  { id: "spomeniki", naziv: "Spomeniki", poti: ["/spomeniki"] },
  { id: "material", naziv: "Material", poti: ["/material"] },
  { id: "skener", naziv: "Skener", poti: ["/scanner"] },
  { id: "inventura", naziv: "Inventura", poti: ["/inventura"] },
  { id: "skladisce", naziv: "Skladišče", poti: ["/skladisce"] },
  { id: "sestanki", naziv: "Sestanki", poti: ["/sestanki"] },
  { id: "pregled", naziv: "Pregled", poti: ["/pregled"] },
];

function skrivnost() {
  return process.env.SEJA_SKRIVNOST || process.env.KV_REST_API_TOKEN || "caks-privzeta-skrivnost";
}

function vHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(podatek) {
  const kljuc = await crypto.subtle.importKey("raw", enc.encode(skrivnost()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return vHex(await crypto.subtle.sign("HMAC", kljuc, enc.encode(podatek)));
}

function enakoBesedilo(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function ustvariZeton(ime, verzija) {
  const iat = Math.floor(Date.now() / 1000);
  const telo = btoa(encodeURIComponent(JSON.stringify({ u: ime, v: verzija || 0, iat, exp: iat + TRAJANJE_SEJE })));
  return `${telo}.${await hmac(telo)}`;
}

export async function preveriZeton(zeton) {
  try {
    if (!zeton || typeof zeton !== "string") return null;
    const [telo, podpis] = zeton.split(".");
    if (!telo || !podpis) return null;
    if (!enakoBesedilo(podpis, await hmac(telo))) return null;
    const p = JSON.parse(decodeURIComponent(atob(telo)));
    if (!p || !p.u || !p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch (e) {
    return null;
  }
}

export function nakljucnaSol() {
  return vHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function zgostiGeslo(geslo, sol) {
  const kljuc = await crypto.subtle.importKey("raw", enc.encode(String(geslo)), "PBKDF2", false, ["deriveBits"]);
  const biti = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(sol), iterations: 100000, hash: "SHA-256" },
    kljuc,
    256
  );
  return vHex(biti);
}

export async function geslo_ustreza(uporabnik, geslo) {
  if (!uporabnik || !uporabnik.sol || !uporabnik.hash) return false;
  return enakoBesedilo(await zgostiGeslo(geslo, uporabnik.sol), uporabnik.hash);
}

export function imaModul(u, modul) {
  if (!u) return false;
  if (u.admin) return true;
  return Array.isArray(u.moduli) && u.moduli.includes(modul);
}

export function imaKaterikoliModul(u, seznam) {
  return seznam.some((m) => imaModul(u, m));
}

export function prvaStran(u) {
  for (const m of MODULI) if (imaModul(u, m.id)) return m.poti[0];
  return null;
}

// Kaj uporabnik sme: vrne "ok" ali "zavrni"
export function dostopDoPoti(pot, metoda, u) {
  if (!u || u.aktiven === false) return "zavrni";
  if (u.admin) return "ok";
  const pisanje = metoda !== "GET" && metoda !== "HEAD";

  // strani
  if (pot === "/") return imaModul(u, "police") ? "ok" : "zavrni";
  if (pot.startsWith("/pulti")) return imaModul(u, "pulti") ? "ok" : "zavrni";
  if (pot.startsWith("/spomeniki")) return imaModul(u, "spomeniki") ? "ok" : "zavrni";
  if (pot.startsWith("/material")) return imaModul(u, "material") ? "ok" : "zavrni";
  if (pot.startsWith("/scanner")) return imaModul(u, "skener") ? "ok" : "zavrni";
  if (pot.startsWith("/inventura")) return imaModul(u, "inventura") ? "ok" : "zavrni";
  if (pot.startsWith("/skladisce")) return imaModul(u, "skladisce") ? "ok" : "zavrni";
  if (pot.startsWith("/sestanki")) return imaModul(u, "sestanki") ? "ok" : "zavrni";
  if (pot.startsWith("/pregled")) return imaModul(u, "pregled") ? "ok" : "zavrni";
  if (pot.startsWith("/uporabniki")) return "zavrni";

  // API-ji
  if (pot.startsWith("/api/jaz")) return "ok";
  if (pot.startsWith("/api/uporabniki") || pot.startsWith("/api/backup")) return "zavrni";
  if (pot.startsWith("/api/cenik-")) {
    // branje cenikov potrebujejo moduli, ki iz njih računajo; spreminjanje samo admin funkcije
    if (pisanje) return u.adminFunkcije ? "ok" : "zavrni";
    return imaKaterikoliModul(u, ["police", "pulti", "spomeniki", "material", "inventura", "skener", "pregled"]) ? "ok" : "zavrni";
  }
  if (pot.startsWith("/api/priloge-pulti") || pot.startsWith("/api/pulti")) return imaModul(u, "pulti") ? "ok" : "zavrni";
  if (pot.startsWith("/api/priloge-spomeniki") || pot.startsWith("/api/spomeniki")) return imaModul(u, "spomeniki") ? "ok" : "zavrni";
  if (pot.startsWith("/api/priloge-material") || pot.startsWith("/api/material"))
    return imaKaterikoliModul(u, ["material", "inventura", "skener"]) ? "ok" : "zavrni";
  if (pot.startsWith("/api/skladisce")) return imaModul(u, "skladisce") ? "ok" : "zavrni";
  if (pot.startsWith("/api/sestanki")) return imaModul(u, "sestanki") ? "ok" : "zavrni";
  if (pot.startsWith("/api/nalogi") || pot.startsWith("/api/priloge") || pot.startsWith("/api/obvestilo") || pot.startsWith("/api/posljidobavnico"))
    return imaModul(u, "police") ? "ok" : "zavrni";
  return "zavrni";
}
