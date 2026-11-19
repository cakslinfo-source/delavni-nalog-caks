"use client";

import { useEffect, useState } from "react";

// Prenese vse podatke programa (ključ za ključem) in vrne objekt kopije.
async function izvoziVse(napredek) {
  const r = await fetch("/api/varnost", { cache: "no-store" });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).napaka || "Ni dostopa.");
  const { kljuci } = await r.json();
  const podatki = {};
  for (let i = 0; i < kljuci.length; i++) {
    napredek(`Prenašam ${i + 1} / ${kljuci.length} …`);
    const o = await fetch(`/api/varnost?kljuc=${encodeURIComponent(kljuci[i])}`, { cache: "no-store" });
    if (!o.ok) throw new Error(`Podatka »${kljuci[i]}« ni bilo mogoče prebrati.`);
    const j = await o.json();
    if (!j.preskoceno) podatki[kljuci[i]] = j.vrednost;
  }
  return { program: "delovni-nalogi-caks", ustvarjeno: new Date().toISOString(), steviloKljucev: Object.keys(podatki).length, podatki };
}

function shraniDatoteko(kopija) {
  const blob = new Blob([JSON.stringify(kopija)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CELOTNA-KOPIJA-caks-${kopija.ustvarjeno.slice(0, 16).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function Varnost() {
  const [stanje, setStanje] = useState("");
  const [napaka, setNapaka] = useState("");
  const [delam, setDelam] = useState(false);
  const [potrditev, setPotrditev] = useState("");
  const [izbrisan, setIzbrisan] = useState(false);
  const [steviloKljucev, setSteviloKljucev] = useState(null);

  async function osvezi() {
    try {
      const r = await fetch("/api/varnost", { cache: "no-store" });
      if (!r.ok) {
        setNapaka("Dostop imajo samo admini.");
        return;
      }
      const j = await r.json();
      setSteviloKljucev(j.kljuci.length);
      setIzbrisan(j.kljuci.includes("program-izbrisan"));
    } catch (e) {}
  }
  useEffect(() => {
    osvezi();
  }, []);

  async function samoKopija() {
    setNapaka("");
    setDelam(true);
    try {
      const k = await izvoziVse(setStanje);
      shraniDatoteko(k);
      setStanje(`✓ Varnostna kopija prenesena (${k.steviloKljucev} delov podatkov). Shrani jo na varno mesto.`);
    } catch (e) {
      setNapaka("Kopije ni bilo mogoče narediti: " + e.message);
      setStanje("");
    }
    setDelam(false);
  }

  async function izbrisiVse() {
    setNapaka("");
    if (potrditev !== "IZBRIŠI") {
      setNapaka("Za izbris v polje vpiši točno: IZBRIŠI");
      return;
    }
    if (!window.confirm("ZADNJE OPOZORILO: najprej se prenese celotna varnostna kopija, nato se VSI podatki programa izbrišejo (nalogi, ponudbe, pulti, spomeniki, ceniki, skladišče, priloge …). Ostane samo prijava adminov. Nadaljujem?")) return;
    setDelam(true);
    try {
      setStanje("Najprej delam varnostno kopijo …");
      const k = await izvoziVse(setStanje);
      shraniDatoteko(k);
      setStanje("Kopija prenesena. Brišem …");
      const r = await fetch("/api/varnost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcija: "izbrisi", potrditev: "IZBRIŠI" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.napaka || "Izbris ni uspel.");
      setStanje(`✓ Program je izbrisan (${j.izbrisano} delov podatkov). Varnostna kopija je v mapi Prenosi. Ostali uporabniki so izklopljeni.`);
      setPotrditev("");
      osvezi();
    } catch (e) {
      setNapaka("Ustavljeno, NIČ ni bilo izbrisano, če kopija ni uspela: " + e.message);
    }
    setDelam(false);
  }

  async function obnovi(datoteka) {
    setNapaka("");
    if (!datoteka) return;
    let kopija;
    try {
      kopija = JSON.parse(await datoteka.text());
      if (!kopija || kopija.program !== "delovni-nalogi-caks" || !kopija.podatki) throw new Error("To ni celotna kopija tega programa.");
    } catch (e) {
      setNapaka("Datoteke ni mogoče prebrati: " + e.message);
      return;
    }
    const kljuci = Object.keys(kopija.podatki).filter((k) => k !== "program-izbrisan");
    if (!window.confirm(`Obnovim program iz kopije z dne ${new Date(kopija.ustvarjeno).toLocaleString("sl-SI")} (${kljuci.length} delov podatkov)? Trenutni podatki z istimi imeni bodo zamenjani s tistimi iz kopije.`)) return;
    setDelam(true);
    try {
      for (let i = 0; i < kljuci.length; i++) {
        setStanje(`Obnavljam ${i + 1} / ${kljuci.length} …`);
        const r = await fetch("/api/varnost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ akcija: "obnovi", kljuc: kljuci[i], vrednost: kopija.podatki[kljuci[i]], zadnji: i === kljuci.length - 1 }),
        });
        if (!r.ok) throw new Error(`pri »${kljuci[i]}«: ` + ((await r.json().catch(() => ({}))).napaka || r.status));
      }
      setStanje(`✓ Program je obnovljen (${kljuci.length} delov podatkov). Vsi uporabniki so spet taki, kot so bili v kopiji.`);
      osvezi();
    } catch (e) {
      setNapaka("Obnova se je ustavila " + e.message + ". Poskusi znova z isto datoteko.");
    }
    setDelam(false);
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="font-bold">
          ČAKŠ <span className="text-red-500">· Varnost programa</span>
        </div>
        <div className="flex gap-2">
          <a href="/uporabniki" className="text-xs bg-stone-800 px-3 py-2 rounded-lg">Osebe</a>
          <a href="/" className="text-xs bg-stone-800 px-3 py-2 rounded-lg">← Nazaj v program</a>
        </div>
      </div>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {napaka && <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-3 text-sm">{napaka}</div>}
        {stanje && <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-lg p-3 text-sm">{stanje}</div>}
        {izbrisan && (
          <div className="bg-red-600 text-white rounded-xl p-4 text-sm font-medium">
            Program je trenutno IZBRISAN. Spodaj ga obnoviš iz datoteke s celotno kopijo.
          </div>
        )}

        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
          <h2 className="font-semibold">1. Celotna varnostna kopija</h2>
          <p className="text-sm text-stone-600">
            Prenese VSE podatke programa v eno datoteko na ta računalnik (nalogi, ponudbe, pulti, spomeniki, ceniki, skladišče, sestanki, priloge, osebe).
            {steviloKljucev !== null && ` Trenutno ${steviloKljucev} delov podatkov.`}
          </p>
          <button disabled={delam} onClick={samoKopija} className="w-full bg-stone-800 text-white rounded-lg py-3 font-semibold disabled:opacity-50">
            ⬇ Prenesi celotno varnostno kopijo
          </button>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-500 p-4 space-y-2">
          <h2 className="font-semibold text-red-700">2. 🚨 Izbriši celoten program</h2>
          <p className="text-sm text-stone-700">
            Najprej se <b>samodejno prenese celotna varnostna kopija</b>, šele nato se izbrišejo vsi podatki. Če kopija ne uspe, se ne izbriše nič.
            Ostanejo samo prijave adminov; vsi ostali uporabniki se izklopijo.
          </p>
          <p className="text-sm text-stone-700">Kopijo shrani na varno (USB, drug računalnik) — brez nje programa ni mogoče vrniti.</p>
          <input
            value={potrditev}
            onChange={(e) => setPotrditev(e.target.value.toUpperCase())}
            placeholder="Za potrditev vpiši: IZBRIŠI"
            className="w-full border-2 border-red-300 rounded-lg px-3 py-2"
          />
          <button disabled={delam || potrditev !== "IZBRIŠI"} onClick={izbrisiVse} className="w-full bg-red-600 text-white rounded-lg py-3 font-bold disabled:opacity-40">
            🚨 Naredi kopijo in IZBRIŠI celoten program
          </button>
        </div>

        <div className="bg-white rounded-xl border-2 border-emerald-500 p-4 space-y-2">
          <h2 className="font-semibold text-emerald-700">3. ♻ Obnovi program iz kopije</h2>
          <p className="text-sm text-stone-700">Izberi datoteko <b>CELOTNA-KOPIJA-caks-….json</b>. Program se vrne v stanje ob kopiji, vključno z uporabniki.</p>
          <label className={`block w-full text-center bg-emerald-600 text-white rounded-lg py-3 font-semibold cursor-pointer ${delam ? "opacity-50 pointer-events-none" : ""}`}>
            ♻ Izberi datoteko s kopijo in obnovi
            <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => { obnovi(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>
    </div>
  );
}
