"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const st = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const eur = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const jeBrezPonudbe = (x) => !x || x.vrsta !== "ponudba";

function Kartica({ naslov, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-stone-800 mb-2">{naslov}</div>
      {children}
    </div>
  );
}

function Vodoravni({ podatki, barva, enota }) {
  return (
    <div style={{ width: "100%", height: Math.max(120, podatki.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={podatki} layout="vertical" margin={{ top: 4, right: 30, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="ime" width={80} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} naročil`, enota]} />
          <Bar dataKey="stevilo" radius={[0, 4, 4, 0]} fill={barva} label={{ position: "right", fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Statistika vrednosti naročil (enako kot na prvi strani Polic): samo za admina.
export default function PregledVrednost({ nalogi, vrednostPultiSpomeniki }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const preberi = () => {
      try { setAdmin(localStorage.getItem("admin-odklenjen") === "da"); } catch (e) {}
    };
    preberi();
    window.addEventListener("focus", preberi);
    return () => window.removeEventListener("focus", preberi);
  }, []);

  const r = useMemo(() => {
    const n = (nalogi || []).filter(jeBrezPonudbe);
    const skupaj = n.reduce((v, x) => v + st(x.cena), 0);
    const placano = n.filter((x) => (x.placano || "Ne") === "Da").reduce((v, x) => v + st(x.cena), 0);
    const racun = n
      .filter((x) => (x.placano || "Ne") !== "Da" && (x.racun === "poslan" || x.racun === "poslati"))
      .reduce((v, x) => v + st(x.cena), 0);
    const poMesecu = {};
    n.forEach((x) => {
      if (!x.datumVnosa || !st(x.cena)) return;
      const k = String(x.datumVnosa).slice(0, 7);
      poMesecu[k] = (poMesecu[k] || 0) + st(x.cena);
    });
    const meseci = Object.entries(poMesecu)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-12)
      .map(([k, vsota]) => ({
        naziv: new Date(k + "-01").toLocaleDateString("sl-SI", { month: "short", year: "2-digit" }),
        vsota: Math.round(vsota * 100) / 100,
      }));
    const steti = (polje) => {
      const g = {};
      (nalogi || []).forEach((x) => {
        if (!x[polje]) return;
        g[x[polje]] = (g[x[polje]] || 0) + 1;
      });
      return Object.entries(g).map(([ime, stevilo]) => ({ ime, stevilo })).sort((a, b) => b.stevilo - a.stevilo);
    };
    return {
      skupaj, placano, racun, neplacano: skupaj - placano - racun, meseci,
      oddal: steti("oddal"), prevzel: steti("izvajalec"),
    };
  }, [nalogi]);

  if (!admin) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-sm text-stone-600">
        Vrednosti naročil so vidne samo, ko je odklenjen admin način. Odkleni ga v modulu Police in se vrni na to stran.
      </div>
    );
  }

  const placila = [
    { naziv: "Skupaj", vsota: r.skupaj, barva: "#7f1d1d" },
    { naziv: "Plačano", vsota: r.placano, barva: "#10b981" },
    { naziv: "Račun poslan", vsota: r.racun, barva: "#38bdf8" },
    { naziv: "Neplačano", vsota: r.neplacano, barva: "#facc15" },
  ];
  const tip = (v) => [eur(v), "Vsota"];

  return (
    <div className="space-y-4 mt-1 flex-1">
      <div className="bg-stone-950 text-white rounded-2xl px-5 py-4">
        <div className="text-xs uppercase text-stone-400">Skupna vrednost vseh naročil</div>
        <div className="text-3xl font-bold mt-1">{eur(r.skupaj + (vrednostPultiSpomeniki || 0))}</div>
        <div className="text-xs text-stone-400 mt-1">
          Police: {eur(r.skupaj)} · Pulti + Spomeniki: {eur(vrednostPultiSpomeniki)}
        </div>
      </div>

      <Kartica naslov="Police — plačano / račun poslan / neplačano">
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={placila} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis dataKey="naziv" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={tip} />
              <Bar dataKey="vsota" radius={[4, 4, 0, 0]}>
                {placila.map((e) => <Cell key={e.naziv} fill={e.barva} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Kartica>

      <Kartica naslov="Vrednost naročil po mesecih (Police, zadnjih 12)">
        {r.meseci.length === 0 ? (
          <p className="text-sm text-stone-400">Ni dovolj podatkov za prikaz.</p>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.meseci} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="naziv" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={tip} />
                <Bar dataKey="vsota" radius={[4, 4, 0, 0]} fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Kartica>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {r.oddal.length > 0 && (
          <Kartica naslov="Kdo je oddal naročila">
            <Vodoravni podatki={r.oddal} barva="#dc2626" enota="Oddal" />
          </Kartica>
        )}
        {r.prevzel.length > 0 && (
          <Kartica naslov="Kdo je prevzel naročila">
            <Vodoravni podatki={r.prevzel} barva="#0ea5e9" enota="Prevzel" />
          </Kartica>
        )}
      </div>
    </div>
  );
}
