"use client";

import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const st = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const eur = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const eur0 = (x) => (Number(x) || 0).toLocaleString("sl-SI", { maximumFractionDigits: 0 }) + " €";
const jeBrezPonudbe = (x) => !x || x.vrsta !== "ponudba";
const BARVE_OSEB = ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6"];

// Števec, ki se ob prikazu "preleti" do končne vrednosti.
function Stevec({ vrednost, oblika = eur0, trajanje = 900 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const cilj = Number(vrednost) || 0;
    const korak = (t) => {
      const k = Math.min(1, (t - t0) / trajanje);
      setV(cilj * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(korak);
    };
    raf = requestAnimationFrame(korak);
    return () => cancelAnimationFrame(raf);
  }, [vrednost, trajanje]);
  return <>{oblika(v)}</>;
}

function Kartica({ naslov, podnaslov, ikona, children, razred = "" }) {
  return (
    <div className={`bg-white/90 backdrop-blur rounded-3xl border border-stone-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-5 ${razred}`}>
      <div className="flex items-center gap-2 mb-3">
        {ikona && <span className="text-lg">{ikona}</span>}
        <div>
          <div className="text-sm font-semibold text-stone-800 leading-tight">{naslov}</div>
          {podnaslov && <div className="text-[11px] text-stone-400">{podnaslov}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Cip({ ikona, naziv, vrednost, opomba, barva }) {
  return (
    <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: barva }}>
      <div className="text-xs opacity-80 flex items-center gap-1.5"><span>{ikona}</span>{naziv}</div>
      <div className="text-2xl font-bold tabular-nums mt-1"><Stevec vrednost={vrednost} /></div>
      {opomba && <div className="text-[11px] opacity-75 mt-0.5">{opomba}</div>}
    </div>
  );
}

function Lestvica({ podatki, enota }) {
  const max = Math.max(1, ...podatki.map((x) => x.stevilo));
  return (
    <div className="space-y-2.5">
      {podatki.map((x, i) => (
        <div key={x.ime} className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow" style={{ background: BARVE_OSEB[i % BARVE_OSEB.length] }}>
            {String(x.ime).trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-stone-800 truncate">{i === 0 ? "🏆 " : ""}{x.ime}</span>
              <span className="text-stone-500 tabular-nums text-xs">{x.stevilo} {enota}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-1">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(x.stevilo / max) * 100}%`, background: BARVE_OSEB[i % BARVE_OSEB.length] }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Statistika vrednosti naročil: samo za admina.
function statusModula(status) {
  const s = String(status || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/prevz|zakljuc|dostav|namesc/.test(s)) return "prevzeto";
  return "drugo";
}

export default function PregledVrednost() {
  const [admin, setAdmin] = useState(false);
  const [nalogi, setNalogi] = useState([]);
  const [pulti, setPulti] = useState([]);
  const [spomeniki, setSpomeniki] = useState([]);
  useEffect(() => {
    let konec = false;
    const nalozi = async () => {
      const dobi = (u) => fetch(u, { cache: "no-store" }).then((r) => r.json()).catch(() => []);
      const [a, b, c] = await Promise.all([dobi("/api/nalogi"), dobi("/api/pulti"), dobi("/api/spomeniki")]);
      if (konec) return;
      setNalogi(Array.isArray(a) ? a : []);
      setPulti(Array.isArray(b) ? b : []);
      setSpomeniki(Array.isArray(c) ? c : []);
    };
    nalozi();
    const t = setInterval(nalozi, 60000);
    return () => { konec = true; clearInterval(t); };
  }, []);
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
    // denar iz vseh modulov: Police (cena = neto), Pulti (ponudbena cena = bruto), Spomeniki (cena = neto)
    const zapisi = [
      ...nalogi.filter(jeBrezPonudbe).map((x) => {
        const neto = st(x.cena);
        const placano = (x.placano || "Ne") === "Da";
        const racun = x.racun === "poslan" || x.racun === "poslati";
        return { stranka: x.stranka, neto, bruto: neto * 1.22, aktivno: statusModula(x.status) !== "prevzeto", neplacano: !placano && !racun };
      }),
      ...pulti.filter(jeBrezPonudbe).map((x) => {
        const bruto = st(x.ponudbenaCena);
        return { stranka: x.stranka && x.stranka.ime, neto: bruto / 1.22, bruto, aktivno: statusModula(x.status) !== "prevzeto", neplacano: !x.placano };
      }),
      ...spomeniki.filter(jeBrezPonudbe).map((x) => {
        const neto = st(x.cena);
        return { stranka: x.stranka && x.stranka.ime, neto, bruto: neto * 1.22, aktivno: statusModula(x.status) !== "prevzeto", neplacano: x.placano !== "Da" };
      }),
    ];
    const aktivna = zapisi.filter((x) => x.aktivno);
    const neplacana = zapisi.filter((x) => x.neplacano && x.neto > 0);
    const poStrankah = {};
    zapisi.forEach((x) => {
      const ime = String(x.stranka || "").trim();
      if (!ime || !x.neto) return;
      poStrankah[ime] = (poStrankah[ime] || 0) + x.neto;
    });
    const top = Object.entries(poStrankah).map(([ime, vsota]) => ({ ime, vsota })).sort((a, b) => b.vsota - a.vsota).slice(0, 6);
    const vrednostPultiSpomeniki =
      pulti.filter(jeBrezPonudbe).reduce((v, x) => v + st(x.ponudbenaCena), 0) +
      spomeniki.filter(jeBrezPonudbe).reduce((v, x) => v + st(x.cena), 0);
    return {
      skupaj, placano, racun, neplacano: skupaj - placano - racun, meseci,
      oddal: steti("oddal"), prevzel: steti("izvajalec"),
      neplNeto: neplacana.reduce((s, x) => s + x.neto, 0),
      neplBruto: neplacana.reduce((s, x) => s + x.bruto, 0),
      neplSt: neplacana.length,
      aktNeto: aktivna.reduce((s, x) => s + (x.neto || 0), 0),
      aktBruto: aktivna.reduce((s, x) => s + (x.bruto || 0), 0),
      aktSt: aktivna.length,
      top, vrednostPultiSpomeniki,
    };
  }, [nalogi, pulti, spomeniki]);

  if (!admin) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center">
        <div className="text-4xl mb-2">🔒</div>
        <div className="text-sm text-stone-600">Vrednosti naročil so vidne samo, ko je odklenjen admin način. Odkleni ga v modulu Police in se vrni na to stran.</div>
      </div>
    );
  }

  const vrednostPultiSpomeniki = r.vrednostPultiSpomeniki;
  const skupajVse = r.skupaj + (vrednostPultiSpomeniki || 0);
  const deleziPlacil = [
    { naziv: "Plačano", vsota: r.placano, barva: "#10b981" },
    { naziv: "Račun poslan", vsota: r.racun, barva: "#0ea5e9" },
    { naziv: "Neplačano", vsota: Math.max(0, r.neplacano), barva: "#f59e0b" },
  ];
  const odstPlacano = r.skupaj ? Math.round((r.placano / r.skupaj) * 100) : 0;
  const maxTop = Math.max(1, ...r.top.map((x) => x.vsota));
  const tip = { borderRadius: 12, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" };

  return (
    <div className="space-y-5 mt-1 flex-1">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl text-white px-6 py-6 shadow-xl" style={{ background: "linear-gradient(135deg,#1c1917 0%,#7f1d1d 55%,#dc2626 100%)" }}>
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-24 bottom-[-60px] w-40 h-40 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-white/70">💶 Skupna vrednost vseh naročil</div>
          <div className="text-4xl sm:text-5xl font-extrabold mt-2 tabular-nums"><Stevec vrednost={skupajVse} oblika={eur} trajanje={1200} /></div>
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            <span className="bg-white/15 rounded-full px-3 py-1">📋 Police {eur0(r.skupaj)}</span>
            <span className="bg-white/15 rounded-full px-3 py-1">🪨 Pulti + 🪦 Spomeniki {eur0(vrednostPultiSpomeniki)}</span>
          </div>
        </div>
      </div>

      {/* štiri številke */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Cip ikona="⏳" naziv="Neplačano (neto)" vrednost={r.neplNeto} opomba={`${r.neplSt} naročil`} barva="linear-gradient(135deg,#f59e0b,#ea580c)" />
        <Cip ikona="🧾" naziv="Neplačano (bruto)" vrednost={r.neplBruto} opomba="z 22 % DDV" barva="linear-gradient(135deg,#fb7185,#e11d48)" />
        <Cip ikona="🔨" naziv="Vrednost aktivnih (neto)" vrednost={r.aktNeto} opomba={`${r.aktSt} aktivnih naročil`} barva="linear-gradient(135deg,#38bdf8,#2563eb)" />
        <Cip ikona="📦" naziv="Vrednost aktivnih (bruto)" vrednost={r.aktBruto} opomba="z 22 % DDV" barva="linear-gradient(135deg,#a78bfa,#7c3aed)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* obroč plačil */}
        <Kartica ikona="🍩" naslov="Kako je s plačili" podnaslov="Police">
          <div className="relative mx-auto" style={{ width: 210, height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deleziPlacil} dataKey="vsota" innerRadius={68} outerRadius={98} paddingAngle={3} cornerRadius={8} stroke="none">
                  {deleziPlacil.map((e) => <Cell key={e.naziv} fill={e.barva} />)}
                </Pie>
                <Tooltip contentStyle={tip} formatter={(v, n) => [eur(v), n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-extrabold text-stone-800 tabular-nums">{odstPlacano} %</div>
              <div className="text-[11px] text-stone-400">plačano</div>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {deleziPlacil.map((e) => (
              <div key={e.naziv} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-stone-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: e.barva }} />{e.naziv}</span>
                <span className="font-semibold text-stone-800 tabular-nums">{eur0(e.vsota)}</span>
              </div>
            ))}
          </div>
        </Kartica>

        {/* po mesecih */}
        <Kartica ikona="📈" naslov="Vrednost naročil po mesecih" podnaslov="Police, zadnjih 12 mesecev" razred="lg:col-span-2">
          {r.meseci.length === 0 ? (
            <p className="text-sm text-stone-400">Ni dovolj podatkov za prikaz.</p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.meseci} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVrednost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="naziv" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip contentStyle={tip} formatter={(v) => [eur(v), "Vrednost"]} />
                  <Area type="monotone" dataKey="vsota" stroke="#dc2626" strokeWidth={3} fill="url(#gradVrednost)" dot={{ r: 4, fill: "#fff", stroke: "#dc2626", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Kartica>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* top stranke */}
        <Kartica ikona="⭐" naslov="Največje stranke" podnaslov="vsi moduli, vrednost brez DDV">
          {r.top.length === 0 ? (
            <p className="text-sm text-stone-400">Ni podatkov.</p>
          ) : (
            <div className="space-y-3">
              {r.top.map((x, i) => (
                <div key={x.ime}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-stone-800 truncate">{["🥇", "🥈", "🥉"][i] || `${i + 1}.`} {x.ime}</span>
                    <span className="font-semibold text-stone-700 tabular-nums text-xs">{eur0(x.vsota)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full" style={{ width: `${(x.vsota / maxTop) * 100}%`, background: "linear-gradient(90deg,#f59e0b,#dc2626)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Kartica>

        {r.oddal.length > 0 && (
          <Kartica ikona="📝" naslov="Kdo je oddal naročila">
            <Lestvica podatki={r.oddal} enota="naročil" />
          </Kartica>
        )}
        {r.prevzel.length > 0 && (
          <Kartica ikona="🔧" naslov="Kdo je prevzel naročila">
            <Lestvica podatki={r.prevzel} enota="naročil" />
          </Kartica>
        )}
      </div>
    </div>
  );
}
