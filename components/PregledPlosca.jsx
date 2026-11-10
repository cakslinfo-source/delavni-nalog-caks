"use client";

import { useState, useEffect, useMemo } from "react";
import PregledRezanje from "./PregledRezanje";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts";

const BARVA = {
  Police: "#dc2626",
  Pulti: "#a855f7",
  Spomenik: "#eab308",
  sprejeto: "#a8a29e",
  izdelavi: "#f97316",
  pripravljeno: "#0ea5e9",
  ok: "#10b981",
  slabo: "#ef4444",
  modra: "#3b82f6",
};
const MODULI = ["Police", "Pulti", "Spomenik"];
const OBDOBJA = [
  { id: 30, naziv: "30 dni" },
  { id: 90, naziv: "90 dni" },
  { id: 365, naziv: "Leto" },
  { id: 0, naziv: "Vse" },
];
const MESECI = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];

function datum(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function zacetekDneva(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function zacetekTedna(d) {
  const x = zacetekDneva(d);
  const dan = (x.getDay() + 6) % 7; // ponedeljek = 0
  x.setDate(x.getDate() - dan);
  return x;
}
const kratkiDatum = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const eur = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function Kartica({ naslov, podnaslov, children, razred = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col ${razred}`}>
      <div className="mb-2">
        <div className="text-sm font-semibold text-stone-800">{naslov}</div>
        {podnaslov && <div className="text-xs text-stone-400">{podnaslov}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Kpi({ naziv, vrednost, opomba, barva = "#1c1917" }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3">
      <div className="text-xs text-stone-500">{naziv}</div>
      <div className="text-3xl font-bold tabular-nums mt-0.5" style={{ color: barva }}>{vrednost}</div>
      {opomba && <div className="text-xs text-stone-400 mt-0.5">{opomba}</div>}
    </div>
  );
}

const Prazno = ({ besedilo = "Ni podatkov" }) => (
  <div className="h-full flex items-center justify-center text-sm text-stone-400 py-10">{besedilo}</div>
);

const tooltipStil = { borderRadius: 10, border: "1px solid #e7e5e4", fontSize: 12 };

export default function PregledPlosca({ postavke }) {
  const [obdobje, setObdobje] = useState(90);
  const [pogled, setPogled] = useState("pregled");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    try {
      const o = parseInt(localStorage.getItem("pregled-obdobje") || "90", 10);
      if ([0, 30, 90, 365].includes(o)) setObdobje(o);
    } catch (e) {}
    const preberi = () => {
      try {
        setAdmin(localStorage.getItem("admin-odklenjen") === "da");
      } catch (e) {}
    };
    preberi();
    window.addEventListener("focus", preberi);
    return () => window.removeEventListener("focus", preberi);
  }, []);

  function izberiObdobje(o) {
    setObdobje(o);
    try { localStorage.setItem("pregled-obdobje", String(o)); } catch (e) {}
  }

  const p = useMemo(() => {
    const danes = zacetekDneva(new Date());
    const narocila = postavke.filter((x) => !x.ponudba);
    const ponudbe = postavke.filter((x) => x.ponudba);
    const od = obdobje ? new Date(danes.getTime() - obdobje * 86400000) : null;
    const vObdobju = narocila.filter((x) => {
      if (!od) return true;
      const d = datum(x.datum);
      return d ? d >= od : true;
    });
    const aktivna = narocila.filter((x) => x.stolpec !== "prevzeto");
    const zamujena = aktivna.filter((x) => { const r = datum(x.rok); return r && r < danes; });
    const brezRoka = aktivna.filter((x) => !datum(x.rok));

    // obroči: dokončanost, pravočasnost, plačanost
    const dokoncano = vObdobju.filter((x) => x.stolpec === "pripravljeno" || x.stolpec === "prevzeto").length;
    const delezDokoncano = vObdobju.length ? Math.round((dokoncano / vObdobju.length) * 100) : 0;
    const delezPravocasno = aktivna.length ? Math.round(((aktivna.length - zamujena.length) / aktivna.length) * 100) : 100;
    const zaPlacilo = vObdobju.filter((x) => x.cena > 0);
    const delezPlacano = zaPlacilo.length ? Math.round((zaPlacilo.filter((x) => x.placano).length / zaPlacilo.length) * 100) : 0;

    // novi nalogi skozi čas (tedensko do 90 dni, sicer mesečno)
    const tedensko = obdobje !== 0 && obdobje <= 90;
    let vedra = [];
    if (tedensko) {
      const stTednov = obdobje === 30 ? 5 : 13;
      const zac = zacetekTedna(danes);
      for (let i = stTednov - 1; i >= 0; i--) {
        const z = new Date(zac); z.setDate(z.getDate() - i * 7);
        const k = new Date(z); k.setDate(k.getDate() + 7);
        vedra.push({ naziv: kratkiDatum(z), z, k, Police: 0, Pulti: 0, Spomenik: 0 });
      }
    } else {
      const vse = narocila.map((x) => datum(x.datum)).filter(Boolean);
      const najstarejsi = vse.length ? new Date(Math.min(...vse.map((d) => d.getTime()))) : danes;
      let stMesecev = obdobje === 365 ? 12 : Math.min(24, Math.max(6, (danes.getFullYear() - najstarejsi.getFullYear()) * 12 + danes.getMonth() - najstarejsi.getMonth() + 1));
      for (let i = stMesecev - 1; i >= 0; i--) {
        const z = new Date(danes.getFullYear(), danes.getMonth() - i, 1);
        const k = new Date(z.getFullYear(), z.getMonth() + 1, 1);
        vedra.push({ naziv: `${MESECI[z.getMonth()]} ${String(z.getFullYear()).slice(2)}`, z, k, Police: 0, Pulti: 0, Spomenik: 0 });
      }
    }
    narocila.forEach((x) => {
      const d = datum(x.datum);
      if (!d) return;
      const v = vedra.find((b) => d >= b.z && d < b.k);
      if (v) v[x.modul] += 1;
    });
    const novi = vedra.map((v) => ({ naziv: v.naziv, Police: v.Police, Pulti: v.Pulti, Spomenik: v.Spomenik }));
    const skupajNovih = novi.reduce((s, v) => s + v.Police + v.Pulti + v.Spomenik, 0);

    // roki: zamujeno + prihodnjih 8 tednov
    const roki = [];
    const zacT = zacetekTedna(danes);
    for (let i = 0; i < 8; i++) {
      const z = new Date(zacT); z.setDate(z.getDate() + i * 7);
      const k = new Date(z); k.setDate(k.getDate() + 7);
      roki.push({
        naziv: kratkiDatum(z),
        stevilo: aktivna.filter((x) => { const r = datum(x.rok); return r && r >= Math.max(z, danes) && r < k; }).length,
      });
    }

    // stanje po modulih
    const poModulu = MODULI.map((m) => ({
      naziv: m,
      Sprejeto: aktivna.filter((x) => x.modul === m && x.stolpec === "sprejeto").length,
      "V izdelavi": aktivna.filter((x) => x.modul === m && x.stolpec === "izdelavi").length,
      Pripravljeno: aktivna.filter((x) => x.modul === m && x.stolpec === "pripravljeno").length,
    }));

    // materiali in stranke (aktivna naročila)
    const stej = (seznam) => {
      const m = {};
      seznam.forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; });
      return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([naziv, stevilo]) => ({ naziv: naziv.length > 24 ? naziv.slice(0, 23) + "…" : naziv, stevilo }));
    };
    const materiali = stej(aktivna.flatMap((x) => (x.material || "").split(",").map((s) => s.trim())));
    const stranke = stej(aktivna.map((x) => (x.stranka || "").trim()));

    // denar (samo admin)
    const neplacana = narocila.filter((x) => !x.placano && x.cena > 0);
    const neplNeto = neplacana.reduce((s, x) => s + x.neto, 0);
    const neplBruto = neplacana.reduce((s, x) => s + x.bruto, 0);
    const aktNeto = aktivna.reduce((s, x) => s + (x.neto || 0), 0);
    const aktBruto = aktivna.reduce((s, x) => s + (x.bruto || 0), 0);

    return {
      narocila, ponudbe, aktivna, zamujena, brezRoka, vObdobju,
      delezDokoncano, delezPravocasno, delezPlacano, novi, skupajNovih, tedensko, roki, poModulu,
      materiali, stranke, neplacana, neplNeto, neplBruto, aktNeto, aktBruto,
      vIzdelavi: aktivna.filter((x) => x.stolpec === "izdelavi").length,
      pripravljeno: aktivna.filter((x) => x.stolpec === "pripravljeno").length,
    };
  }, [postavke, obdobje]);

  const obroc = (vrednost, notranji, zunanji, barva) => (
    <Pie
      data={[{ v: vrednost }, { v: 100 - vrednost }]}
      dataKey="v" startAngle={90} endAngle={-270}
      innerRadius={notranji} outerRadius={zunanji} stroke="none" isAnimationActive={false}
    >
      <Cell fill={barva} />
      <Cell fill="#f1f5f9" />
    </Pie>
  );

  const stolpcniBarveStanja = [
    { k: "Sprejeto", b: BARVA.sprejeto },
    { k: "V izdelavi", b: BARVA.izdelavi },
    { k: "Pripravljeno", b: BARVA.pripravljeno },
  ];

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
        {[["pregled", "📊 Pregled"], ["rezanje", "📏 Rezanje skupaj"]].map(([id, naziv]) => (
          <button
            key={id}
            onClick={() => setPogled(id)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${pogled === id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {naziv}
          </button>
        ))}
      </div>
      {pogled === "rezanje" ? (
        <PregledRezanje postavke={postavke} />
      ) : (
      <>
      {/* obdobje */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-stone-500">
          Vsi moduli skupaj · {p.narocila.length} naročil v bazi{p.ponudbe.length > 0 ? ` · ${p.ponudbe.length} ponudb (niso všteta)` : ""}
        </div>
        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
          {OBDOBJA.map((o) => (
            <button
              key={o.id}
              onClick={() => izberiObdobje(o.id)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${obdobje === o.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
            >
              {o.naziv}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi naziv="Aktivna naročila" vrednost={p.aktivna.length} opomba="vsi moduli, brez prevzetih" />
        <Kpi naziv="V izdelavi" vrednost={p.vIzdelavi} barva={BARVA.izdelavi} />
        <Kpi naziv="Pripravljeno za prevzem" vrednost={p.pripravljeno} barva={BARVA.pripravljeno} />
        <Kpi naziv="Zamujena" vrednost={p.zamujena.length} barva={p.zamujena.length ? BARVA.slabo : BARVA.ok} opomba={p.brezRoka.length ? `${p.brezRoka.length} brez roka` : "vsi imajo rok"} />
        <Kpi naziv="Odprte ponudbe" vrednost={p.ponudbe.filter((x) => x.stolpec !== "prevzeto").length} barva="#db2777" opomba="še niso delovni nalog" />
      </div>
      {admin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi naziv="Neplačano (neto)" vrednost={eur(p.neplNeto)} barva={BARVA.slabo} opomba={`${p.neplacana.length} naročil`} />
          <Kpi naziv="Neplačano (bruto)" vrednost={eur(p.neplBruto)} barva={BARVA.slabo} opomba="z 22 % DDV" />
          <Kpi naziv="Vrednost aktivnih (neto)" vrednost={eur(p.aktNeto)} />
          <Kpi naziv="Vrednost aktivnih (bruto)" vrednost={eur(p.aktBruto)} opomba="z 22 % DDV" />
        </div>
      )}

      {/* vrstica grafov 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Kartica naslov="Dokončanost naročil" podnaslov={`naročila v obdobju: ${p.vObdobju.length}`}>
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 150, height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {obroc(p.delezDokoncano, 58, 70, BARVA.izdelavi)}
                  {obroc(p.delezPravocasno, 44, 54, BARVA.ok)}
                  {obroc(p.delezPlacano, 30, 40, BARVA.modra)}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl font-bold text-stone-800">{p.delezDokoncano}%</div>
                <div className="text-[10px] text-stone-400">dokončano</div>
              </div>
            </div>
            <div className="text-xs space-y-2">
              <div><div className="font-bold text-base" style={{ color: BARVA.izdelavi }}>{p.delezDokoncano}%</div><div className="text-stone-400">Dokončano</div></div>
              <div><div className="font-bold text-base" style={{ color: BARVA.ok }}>{p.delezPravocasno}%</div><div className="text-stone-400">Pravočasno</div></div>
              <div><div className="font-bold text-base" style={{ color: BARVA.modra }}>{p.delezPlacano}%</div><div className="text-stone-400">Plačano</div></div>
            </div>
          </div>
        </Kartica>

        <Kartica naslov="Novi delovni nalogi" podnaslov={p.tedensko ? "po tednih, po modulih" : "po mesecih, po modulih"}>
          {p.skupajNovih === 0 ? <Prazno /> : (
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={p.novi} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="naziv" tick={{ fontSize: 10, fill: "#78716c" }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#78716c" }} />
                  <Tooltip contentStyle={tooltipStil} cursor={{ fill: "#f5f5f4" }} />
                  <Bar dataKey="Police" stackId="a" fill={BARVA.Police} />
                  <Bar dataKey="Pulti" stackId="a" fill={BARVA.Pulti} />
                  <Bar dataKey="Spomenik" stackId="a" fill={BARVA.Spomenik} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex gap-3 text-[11px] text-stone-500 mt-1">
            {MODULI.map((m) => (
              <span key={m} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: BARVA[m] }} />{m}</span>
            ))}
          </div>
        </Kartica>

        <Kartica naslov="Obremenitev po rokih" podnaslov="aktivna naročila po roku v naslednjih 8 tednih">
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p.roki} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRoki" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="naziv" tick={{ fontSize: 10, fill: "#78716c" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#78716c" }} />
                <Tooltip contentStyle={tooltipStil} formatter={(v) => [`${v} naročil`, "Rok"]} />
                <Area type="monotone" dataKey="stevilo" stroke="#6366f1" strokeWidth={2} fill="url(#gRoki)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Kartica>

        <Kartica naslov="Delež modulov" podnaslov="aktivna naročila">
          {p.aktivna.length === 0 ? <Prazno /> : (
            <div className="flex items-center gap-3">
              <div style={{ width: 130, height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MODULI.map((m) => ({ naziv: m, stevilo: p.aktivna.filter((x) => x.modul === m).length })).filter((d) => d.stevilo > 0)}
                      dataKey="stevilo" nameKey="naziv" innerRadius={34} outerRadius={60} stroke="#fff" strokeWidth={2}
                    >
                      {MODULI.filter((m) => p.aktivna.some((x) => x.modul === m)).map((m) => <Cell key={m} fill={BARVA[m]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStil} formatter={(v, n) => [`${v} naročil`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs space-y-1.5">
                {MODULI.map((m) => {
                  const st = p.aktivna.filter((x) => x.modul === m).length;
                  return (
                    <div key={m} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BARVA[m] }} />
                      <span className="text-stone-600">{m}</span>
                      <span className="font-semibold text-stone-800 ml-1">{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Kartica>
      </div>

      {/* vrstica grafov 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Kartica naslov="Stanje po modulih" podnaslov="aktivna naročila po statusu">
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.poModulu} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#78716c" }} />
                <YAxis type="category" dataKey="naziv" width={64} tick={{ fontSize: 11, fill: "#44403c" }} />
                <Tooltip contentStyle={tooltipStil} cursor={{ fill: "#f5f5f4" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {stolpcniBarveStanja.map((s) => (
                  <Bar key={s.k} dataKey={s.k} stackId="s" fill={s.b} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kartica>

        <Kartica naslov="Materiali v delu" podnaslov="največ aktivnih naročil">
          {p.materiali.length === 0 ? <Prazno besedilo="Pri aktivnih naročilih ni vpisanih materialov" /> : (
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={p.materiali} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#78716c" }} />
                  <YAxis type="category" dataKey="naziv" width={110} tick={{ fontSize: 10, fill: "#44403c" }} />
                  <Tooltip contentStyle={tooltipStil} cursor={{ fill: "#f5f5f4" }} formatter={(v) => [`${v} naročil`, "Aktivna"]} />
                  <Bar dataKey="stevilo" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Kartica>

        <Kartica naslov="Stranke z največ aktivnimi naročili" podnaslov="vsi moduli">
          {p.stranke.length === 0 ? <Prazno /> : (
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={p.stranke} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#78716c" }} />
                  <YAxis type="category" dataKey="naziv" width={110} tick={{ fontSize: 10, fill: "#44403c" }} />
                  <Tooltip contentStyle={tooltipStil} cursor={{ fill: "#f5f5f4" }} formatter={(v) => [`${v} naročil`, "Aktivna"]} />
                  <Bar dataKey="stevilo" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Kartica>
      </div>

      {/* zamujena */}
      {p.zamujena.length > 0 && (
        <Kartica naslov="Zamujena naročila" podnaslov="rok je že mimo, naročilo še ni prevzeto">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {p.zamujena
              .slice()
              .sort((a, b) => new Date(a.rok) - new Date(b.rok))
              .slice(0, 12)
              .map((x) => (
                <div key={`${x.modul}-${x.id}`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <div className="font-semibold" style={{ color: BARVA[x.modul] }}>{x.modul} {x.stevilka}</div>
                  <div className="text-stone-700 truncate">{x.stranka || "—"}{x.objekt ? ` · ${x.objekt}` : ""}</div>
                  <div className="text-xs text-red-600">
                    Rok {new Date(x.rok).toLocaleDateString("sl-SI")} · zamuja {Math.max(1, Math.round((zacetekDneva(new Date()) - new Date(x.rok)) / 86400000))} dni
                  </div>
                </div>
              ))}
          </div>
          {p.zamujena.length > 12 && (
            <div className="text-xs text-stone-500 mt-2">in še {p.zamujena.length - 12} drugih (prikazanih je 12 najstarejših)</div>
          )}
        </Kartica>
      )}
      </>
      )}
    </div>
  );
}
