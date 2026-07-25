"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STOLPCI = [
  { id: "sprejeto", naziv: "Sprejeto", barva: "#78716c" },
  { id: "izdelavi", naziv: "V izdelavi", barva: "#f97316" },
  { id: "pripravljeno", naziv: "Pripravljeno", barva: "#0ea5e9" },
];

const BARVA_MODULA = { Police: "#dc2626", Pulti: "#a855f7", Spomenik: "#eab308" };

function mapPoliceStatus(status) {
  if (status === "Sprejeto") return "sprejeto";
  if (status === "V izdelavi") return "izdelavi";
  if (status === "Pripravljeno") return "pripravljeno";
  if (status === "Prevzeto") return "prevzeto";
  return "sprejeto";
}

function mapPultiStatus(status) {
  if (["ponudba", "izmera", "cad"].includes(status)) return "sprejeto";
  if (["razrez", "izrezi", "brusenje"].includes(status)) return "izdelavi";
  if (status === "montaza") return "pripravljeno";
  if (status === "zakljuceno") return "prevzeto";
  return "sprejeto";
}

function mapSpomenikStatus(status) {
  if (["sprejeto", "izdelavi", "pripravljeno", "prevzeto"].includes(status)) return status;
  return "sprejeto";
}

const IKONA = { Police: "📋", Pulti: "🪨", Spomenik: "🪦" };

export default function Pregled() {
  const [postavke, setPostavke] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [uraOsvezitve, setUraOsvezitve] = useState(null);
  const [zdaj, setZdaj] = useState(new Date());

  async function nalozi() {
    try {
      const [nalogiRes, pultiRes, spomenikiRes] = await Promise.all([
        fetch("/api/nalogi", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch("/api/pulti", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch("/api/spomeniki", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      ]);

      const vse = [
        ...(Array.isArray(nalogiRes) ? nalogiRes : []).map((n) => ({
          modul: "Police",
          id: n.id,
          stevilka: n.stevilka,
          stranka: n.stranka,
          opis: n.opis,
          rok: n.rok,
          stolpec: mapPoliceStatus(n.status),
        })),
        ...(Array.isArray(pultiRes) ? pultiRes : []).map((p) => ({
          modul: "Pulti",
          id: p.id,
          stevilka: p.stevilka,
          stranka: p.stranka?.ime,
          opis: "Pult",
          rok: p.datumMontaze,
          stolpec: mapPultiStatus(p.status),
        })),
        ...(Array.isArray(spomenikiRes) ? spomenikiRes : []).map((s) => ({
          modul: "Spomenik",
          id: s.id,
          stevilka: s.stevilka,
          stranka: s.stranka?.ime,
          opis: s.material || "Spomenik",
          rok: s.montaza,
          stolpec: mapSpomenikStatus(s.status),
        })),
      ];

      setPostavke(vse);
      setUraOsvezitve(new Date());
    } catch (e) {
      // tiho — ohrani prejšnje podatke na zaslonu
    } finally {
      setNalaganje(false);
    }
  }

  useEffect(() => {
    nalozi();
    const interval = setInterval(nalozi, 45000);
    const uraInterval = setInterval(() => setZdaj(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(uraInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-white p-6 sm:p-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="font-bold text-3xl tracking-tight">
            ČAKŠ <span className="text-red-500">· Pregled proizvodnje</span>
          </div>
          <div className="text-stone-500 text-sm mt-1">Kamnoseštvo Čakš — vsi moduli v živo</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono tabular-nums text-stone-200">
            {zdaj.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-stone-500 text-sm capitalize">
            {zdaj.toLocaleDateString("sl-SI", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>

      {nalaganje ? (
        <div className="text-center text-stone-500 py-24 text-lg">Nalagam …</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STOLPCI.map((stolpec) => {
            const postavkeStolpca = postavke.filter((p) => p.stolpec === stolpec.id);
            return (
              <div key={stolpec.id} className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden flex flex-col">
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: stolpec.barva + "22", borderBottom: `2px solid ${stolpec.barva}` }}
                >
                  <span className="font-semibold text-lg" style={{ color: stolpec.barva }}>{stolpec.naziv}</span>
                  <span
                    className="text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center"
                    style={{ backgroundColor: stolpec.barva, color: "#0c0a09" }}
                  >
                    {postavkeStolpca.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: "70vh" }}>
                  {postavkeStolpca.length === 0 ? (
                    <div className="text-stone-600 text-sm text-center py-8">— prazno —</div>
                  ) : (
                    postavkeStolpca.map((p) => {
                      const zamujen = p.rok && new Date(p.rok) < new Date(new Date().toDateString());
                      return (
                        <div
                          key={`${p.modul}-${p.id}`}
                          className={`rounded-xl p-3 bg-stone-800 border-l-4 border ${zamujen ? "border-red-500" : "border-stone-700"}`}
                          style={{ borderLeftColor: BARVA_MODULA[p.modul] }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-stone-400 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: BARVA_MODULA[p.modul] }} />
                              {p.modul} · {p.stevilka}
                            </span>
                            {zamujen && <span className="text-[10px] text-red-400 font-semibold">ZAMUJA</span>}
                          </div>
                          <div className="font-semibold text-stone-100 truncate">{p.stranka || "—"}</div>
                          <div className="text-sm text-stone-400 truncate">{p.opis}</div>
                          {p.rok && (
                            <div className="text-xs text-stone-500 mt-1">
                              Rok: {new Date(p.rok).toLocaleDateString("sl-SI")}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!nalaganje && postavke.filter((p) => p.stolpec !== "prevzeto").length > 0 && (() => {
        const aktivne = postavke.filter((p) => p.stolpec !== "prevzeto");
        const poModulu = { Police: 0, Pulti: 0, Spomenik: 0 };
        aktivne.forEach((p) => { poModulu[p.modul] = (poModulu[p.modul] || 0) + 1; });
        const podatkiGrafa = Object.entries(poModulu)
          .filter(([, stevilo]) => stevilo > 0)
          .map(([modul, stevilo]) => ({
            naziv: modul,
            stevilo,
            delez: Math.round((stevilo / aktivne.length) * 100),
          }));
        return (
          <div className="mt-8 bg-stone-900 rounded-2xl border border-stone-800 p-5 max-w-md mx-auto">
            <p className="text-center text-stone-400 text-sm uppercase font-semibold mb-2">
              Trenutno v proizvodnji — delež po segmentu
            </p>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={podatkiGrafa}
                    dataKey="stevilo"
                    nameKey="naziv"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ naziv, delez }) => `${naziv} ${delez}%`}
                    labelLine={{ stroke: "#57534e" }}
                  >
                    {podatkiGrafa.map((entry) => (
                      <Cell key={entry.naziv} fill={BARVA_MODULA[entry.naziv]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, naziv) => [`${value} naročil`, naziv]}
                  />
                  <Legend wrapperStyle={{ color: "#a8a29e", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      <div className="text-center text-stone-700 text-xs mt-8">
        {uraOsvezitve && `Osveženo ${uraOsvezitve.toLocaleTimeString("sl-SI")} · `}samodejno se osvežuje vsakih 45 sekund
      </div>
    </div>
  );
}
