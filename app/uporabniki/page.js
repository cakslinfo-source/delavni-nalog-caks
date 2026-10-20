"use client";

import { useEffect, useState } from "react";

const PRAZNO = { ime: "", prikaz: "", geslo: "", moduli: [], adminFunkcije: false };

export default function Uporabniki() {
  const [seznam, setSeznam] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [nov, setNov] = useState(PRAZNO);
  const [sporocilo, setSporocilo] = useState("");
  const [napaka, setNapaka] = useState("");
  const [novoGeslo, setNovoGeslo] = useState({});

  async function naloži() {
    const r = await fetch("/api/uporabniki", { cache: "no-store" });
    if (!r.ok) {
      setNapaka("Dostop imajo samo admini.");
      return;
    }
    const j = await r.json();
    setSeznam(j.uporabniki || []);
    setModuli(j.moduli || []);
  }
  useEffect(() => {
    naloži();
  }, []);

  async function posli(telo, uspeh) {
    setNapaka("");
    setSporocilo("");
    const r = await fetch("/api/uporabniki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telo),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setNapaka(j.napaka || "Napaka pri shranjevanju.");
      return false;
    }
    setSeznam(j.uporabniki || []);
    setSporocilo(uspeh);
    return true;
  }

  function preklopi(u, polje, vrednost) {
    const naslednji = seznam.map((x) => (x.ime === u.ime ? { ...x, [polje]: vrednost } : x));
    setSeznam(naslednji);
  }
  function preklopiModul(u, id) {
    const ima = (u.moduli || []).includes(id);
    preklopi(u, "moduli", ima ? u.moduli.filter((m) => m !== id) : [...(u.moduli || []), id]);
  }
  function shrani(u) {
    posli({ akcija: "uredi", ime: u.ime, prikaz: u.prikaz, aktiven: u.aktiven !== false, adminFunkcije: !!u.adminFunkcije, moduli: u.moduli || [], geslo: novoGeslo[u.ime] || "" }, `Shranjeno: ${u.prikaz || u.ime}.`).then((ok) => {
      if (ok) setNovoGeslo({ ...novoGeslo, [u.ime]: "" });
    });
  }
  async function izbrisi(u) {
    if (!confirm(`Res izbrišem osebo ${u.prikaz || u.ime}?`)) return;
    await posli({ akcija: "izbrisi", ime: u.ime }, "Oseba izbrisana.");
  }
  async function dodaj() {
    const ok = await posli({ akcija: "dodaj", ...nov }, `Dodano: ${nov.prikaz || nov.ime}. Povej ji uporabniško ime in geslo.`);
    if (ok) setNov(PRAZNO);
  }

  const kljukice = (vrednosti, naPreklop) =>
    moduli.map((m) => (
      <label key={m.id} className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={vrednosti.includes(m.id)} onChange={() => naPreklop(m.id)} />
        {m.naziv}
      </label>
    ));

  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="font-bold">
          ČAKŠ <span className="text-red-500">· Osebe in pravice</span>
        </div>
        <a href="/" className="text-xs bg-stone-800 px-3 py-2 rounded-lg">← Nazaj v program</a>
      </div>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {napaka && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{napaka}</div>}
        {sporocilo && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">{sporocilo}</div>}

        {seznam.some((u) => u.zacetnoGeslo) && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-sm">
            ⚠ Admin še vedno uporablja začetno geslo. Spodaj pri sebi vpiši novo geslo in klikni Shrani (po shranjevanju se boš moral/a ponovno vpisati).
          </div>
        )}

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <h2 className="font-semibold mb-3">Dodaj osebo</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            <input className="border rounded-lg px-3 py-2" placeholder="Ime (npr. Rok)" value={nov.prikaz} onChange={(e) => setNov({ ...nov, prikaz: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Uporabniško ime (npr. rok)" autoCapitalize="none" value={nov.ime} onChange={(e) => setNov({ ...nov, ime: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Geslo (vsaj 4 znake)" value={nov.geslo} onChange={(e) => setNov({ ...nov, geslo: e.target.value })} />
          </div>
          <div className="mt-3 text-sm text-stone-500">Kaj sme videti:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">{kljukice(nov.moduli, (id) => setNov({ ...nov, moduli: nov.moduli.includes(id) ? nov.moduli.filter((m) => m !== id) : [...nov.moduli, id] }))}</div>
          <label className="flex items-center gap-1.5 text-sm mt-2">
            <input type="checkbox" checked={nov.adminFunkcije} onChange={(e) => setNov({ ...nov, adminFunkcije: e.target.checked })} />
            Admin funkcije: cene, plačila in brisanje
          </label>
          <button onClick={dodaj} className="mt-3 bg-red-600 text-white font-semibold rounded-lg px-4 py-2">Dodaj osebo</button>
        </div>

        {seznam.map((u) => (
          <div key={u.ime} className={`bg-white rounded-xl border p-4 ${u.aktiven === false ? "border-stone-300 opacity-70" : "border-stone-200"}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <input className="border rounded-lg px-2 py-1 font-semibold" value={u.prikaz || ""} onChange={(e) => preklopi(u, "prikaz", e.target.value)} />
                <span className="ml-2 text-xs text-stone-400">uporabniško ime: {u.ime}{u.admin ? " · ADMIN" : ""}</span>
              </div>
              {!u.admin && (
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={u.aktiven !== false} onChange={(e) => preklopi(u, "aktiven", e.target.checked)} />
                  Ima dostop
                </label>
              )}
            </div>
            {u.admin ? (
              <p className="text-sm text-stone-500 mt-2">Admin vidi in sme vse.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">{kljukice(u.moduli || [], (id) => preklopiModul(u, id))}</div>
                <label className="flex items-center gap-1.5 text-sm mt-2">
                  <input type="checkbox" checked={!!u.adminFunkcije} onChange={(e) => preklopi(u, "adminFunkcije", e.target.checked)} />
                  Admin funkcije: cene, plačila in brisanje
                </label>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Novo geslo (prazno = brez spremembe)" value={novoGeslo[u.ime] || ""} onChange={(e) => setNovoGeslo({ ...novoGeslo, [u.ime]: e.target.value })} />
              <button onClick={() => shrani(u)} className="bg-stone-900 text-white rounded-lg px-4 py-2 text-sm">Shrani</button>
              {!u.admin && <button onClick={() => izbrisi(u)} className="text-red-600 text-sm underline">Izbriši osebo</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
