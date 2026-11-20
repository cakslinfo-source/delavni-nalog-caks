"use client";

import { useEffect, useState } from "react";

// Način plačila naročila (nakazilo / gotovinski račun na e-računih) in omejitev, katera plačila vidi prijavljena oseba.
// Oznaka "gotovina" ostaja zaradi že shranjenih naročil in pravic oseb; prikazuje se kot "Gotovinski račun".
export const NACINI_PLACILA = [
  { id: "nakazilo", naziv: "🏦 Nakazilo", kratko: "🏦" },
  { id: "gotovina", naziv: "💶 Gotovinski račun", kratko: "💶" },
];

let pomnilnik = null;
// "vse" | "nakazilo" | "gotovina" — nastavi admin pri osebi (Osebe in pravice)
export function useOmejitevPlacil() {
  const [omejitev, setOmejitev] = useState(pomnilnik || "vse");
  useEffect(() => {
    if (pomnilnik) return;
    fetch("/api/jaz", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        pomnilnik = (j && j.placila) || "vse";
        setOmejitev(pomnilnik);
      })
      .catch(() => {});
  }, []);
  return omejitev;
}

// Ali naročilo ustreza izbranemu filtru. Oseba z omejitvijo vidi tudi naročila brez določenega načina.
export function ustrezaPlacilu(n, filter, omejitev) {
  if (!filter || filter === "vse") return true;
  if (n && n.nacinPlacila === filter) return true;
  return omejitev && omejitev !== "vse" && !(n && n.nacinPlacila);
}

// Gumbi za izbiro načina plačila v obrazcu.
// Ko je način izbran (nakazilo ali gotovinski račun), se pokaže še polje za številko računa iz e-računov (stRacuna).
// shraniObIzgubiFokusa = true: številka se shrani, ko polje izgubi fokus (za že shranjena naročila,
// kjer vsaka sprememba pomeni zapis v bazo). Privzeto se sporoča ob vsakem vnosu (obrazci v stanju).
export function IzbiraPlacila({ vrednost, nastavi, stRacuna, nastaviStRacuna, shraniObIzgubiFokusa = false, temno = false, samodejno = true }) {
  const omejitev = useOmejitevPlacil();
  const [stRacunaVnos, setStRacunaVnos] = useState(stRacuna || "");
  useEffect(() => {
    setStRacunaVnos(stRacuna || "");
  }, [stRacuna]);
  useEffect(() => {
    // v novem obrazcu oseba z omejitvijo dobi svoj način samodejno (ne pa pri ogledu obstoječega naročila)
    if (samodejno && omejitev !== "vse" && !vrednost) nastavi(omejitev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [omejitev, vrednost]);
  return (
    <div className={`rounded-xl p-3 border ${temno ? "bg-stone-100 border-stone-300" : "bg-white border-gray-200"}`}>
      <label className="text-xs font-medium text-stone-600 mb-1.5 block">Način plačila</label>
      <div className="flex gap-2">
        {NACINI_PLACILA.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => nastavi(vrednost === p.id ? "" : p.id)}
            className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
              vrednost === p.id
                ? p.id === "gotovina"
                  ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                  : "bg-sky-700 text-white border-sky-700 font-semibold"
                : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
            }`}
          >
            {p.naziv}
          </button>
        ))}
      </div>

      {vrednost && typeof nastaviStRacuna === "function" && (
        <div className="mt-3">
          <label className="text-xs font-medium text-stone-600 mb-1.5 block">Št. računa (e-računi)</label>
          <input
            type="text"
            value={stRacunaVnos}
            placeholder="npr. 123-2026"
            onChange={(e) => {
              setStRacunaVnos(e.target.value);
              if (!shraniObIzgubiFokusa) nastaviStRacuna(e.target.value);
            }}
            onBlur={(e) => {
              const v = e.target.value.trim();
              setStRacunaVnos(v);
              if (shraniObIzgubiFokusa) {
                if (v !== (stRacuna || "")) nastaviStRacuna(v);
              } else if (v !== e.target.value) {
                nastaviStRacuna(v);
              }
            }}
            className={`w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none ${
              vrednost === "gotovina" ? "focus:border-emerald-600" : "focus:border-sky-700"
            }`}
          />
          <p className="text-[11px] text-stone-500 mt-1">Vpiši številko računa, izdanega v e-računih.</p>
        </div>
      )}
    </div>
  );
}

// Majhna oznaka na kartici naročila (pripiše se še št. računa iz e-računov, če je vpisana)
export function ZnackaPlacila({ nacin, stRacuna }) {
  const st = stRacuna ? ` · ${stRacuna}` : "";
  if (nacin === "gotovina") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">💶 Gotovinski račun{st}</span>;
  if (nacin === "nakazilo") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-medium">🏦 Nakazilo{st}</span>;
  return null;
}

// Filter na seznamu: admin/neomejena oseba izbira, omejena oseba vidi samo svoj način
export function FilterPlacil({ filter, setFilter, seznam, omejitev }) {
  if (omejitev && omejitev !== "vse") {
    const p = NACINI_PLACILA.find((x) => x.id === omejitev);
    return <span className="text-xs px-3 py-1.5 rounded-full border border-stone-300 bg-stone-100 text-stone-700">Prikazano: samo {p ? p.naziv : omejitev}</span>;
  }
  const st = (id) => (seznam || []).filter((n) => n.nacinPlacila === id).length;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {[{ id: "vse", naziv: "Vsa plačila" }, ...NACINI_PLACILA].map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setFilter(p.id)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            filter === p.id ? "bg-stone-800 text-white border-stone-800 font-medium" : "bg-white text-stone-500 border-stone-300 hover:border-stone-500"
          }`}
        >
          {p.naziv}{p.id !== "vse" ? ` (${st(p.id)})` : ""}
        </button>
      ))}
    </span>
  );
}
