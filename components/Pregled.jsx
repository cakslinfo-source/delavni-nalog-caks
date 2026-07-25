"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STOLPCI = [
  { id: "sprejeto", naziv: "Sprejeto", barva: "#78716c" },
  { id: "izdelavi", naziv: "V izdelavi", barva: "#f97316" },
  { id: "pripravljeno", naziv: "Pripravljeno", barva: "#0ea5e9" },
];

const BARVA_MODULA = { Police: "#dc2626", Pulti: "#a855f7", Spomenik: "#eab308" };
const KRATICA_MODULA = { Police: "Police", Pulti: "Pulti", Spomenik: "Spomenik" };

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
          rok: n.rok,
          stolpec: mapPoliceStatus(n.status),
        })),
        ...(Array.isArray(pultiRes) ? pultiRes : []).map((p) => ({
          modul: "Pulti",
          id: p.id,
          stevilka: p.stevilka,
          stranka: p.stranka?.ime,
          rok: p.datumMontaze,
          stolpec: mapPultiStatus(p.status),
        })),
        ...(Array.isArray(spomenikiRes) ? spomenikiRes : []).map((s) => ({
          modul: "Spomenik",
          id: s.id,
          stevilka: s.stevilka,
          stranka: s.stranka?.ime,
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

  const aktivne = postavke.filter((p) => p.stolpec !== "prevzeto");
  const poModulu = { Police: 0, Pulti: 0, Spomenik: 0 };
  aktivne.forEach((p) => { poModulu[p.modul] = (poModulu[p.modul] || 0) + 1; });
  const podatkiGrafa = Object.entries(poModulu)
    .filter(([, stevilo]) => stevilo > 0)
    .map(([modul, stevilo]) => ({
      naziv: modul,
      stevilo,
      delez: aktivne.length ? Math.round((stevilo / aktivne.length) * 100) : 0,
    }));

  return (
    <div className="h-screen bg-stone-950 text-white p-4 sm:p-5 flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between mb-3 shrink-0 gap-4">
        <div className="min-w-0">
          <div className="font-bold text-2xl tracking-tight">
            ČAKŠ <span className="text-red-500">· Pregled proizvodnje</span>
          </div>
          <div className="text-stone-500 text-xs mt-0.5">Kamnoseštvo Čakš — vsi moduli v živo</div>
        </div>

        {podatkiGrafa.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div style={{ width: 90, height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={podatkiGrafa} dataKey="stevilo" nameKey="naziv" cx="50%" cy="50%" innerRadius={22} outerRadius={42}>
                    {podatkiGrafa.map((entry) => (
                      <Cell key={entry.naziv} fill={BARVA_MODULA[entry.naziv]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, naziv) => [`${value} naročil`, naziv]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs space-y-0.5">
              {podatkiGrafa.map((d) => (
                <div key={d.naziv} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: BARVA_MODULA[d.naziv] }} />
                  <span className="text-stone-300">{d.naziv} {d.delez}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-right shrink-0">
          <div className="text-xl font-mono tabular-nums text-stone-200">
            {zdaj.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-stone-500 text-xs capitalize">
            {zdaj.toLocaleDateString("sl-SI", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>

      {nalaganje ? (
        <div className="text-center text-stone-500 py-24 text-lg flex-1">Nalagam …</div>
      ) : (
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-0">
          {STOLPCI.map((stolpec) => {
            const postavkeStolpca = postavke.filter((p) => p.stolpec === stolpec.id);
            return (
              <div key={stolpec.id} className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden flex flex-col min-h-0">
                <div
                  className="px-4 py-2 flex items-center justify-between shrink-0"
                  style={{ backgroundColor: stolpec.barva + "22", borderBottom: `2px solid ${stolpec.barva}` }}
                >
                  <span className="font-semibold text-base" style={{ color: stolpec.barva }}>{stolpec.naziv}</span>
                  <span
                    className="text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center"
                    style={{ backgroundColor: stolpec.barva, color: "#0c0a09" }}
                  >
                    {postavkeStolpca.length}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 overflow-y-auto flex-1 min-h-0">
                  {postavkeStolpca.length === 0 ? (
                    <div className="text-stone-600 text-sm text-center py-8">— prazno —</div>
                  ) : (
                    postavkeStolpca.map((p) => {
                      const zamujen = p.rok && new Date(p.rok) < new Date(new Date().toDateString());
                      return (
                        <div
                          key={`${p.modul}-${p.id}`}
                          className={`rounded-lg px-2.5 py-1.5 bg-stone-800 border-l-4 border ${zamujen ? "border-red-500" : "border-stone-700"}`}
                          style={{ borderLeftColor: BARVA_MODULA[p.modul] }}
                        >
                          <div className="text-sm text-stone-100 truncate">
                            <span className="font-semibold" style={{ color: BARVA_MODULA[p.modul] }}>{KRATICA_MODULA[p.modul]} {p.stevilka}</span>
                            {" "}· {p.stranka || "—"}
                          </div>
                          <div className={`text-xs truncate ${zamujen ? "text-red-400 font-semibold" : "text-stone-500"}`}>
                            {p.rok ? `Rok: ${new Date(p.rok).toLocaleDateString("sl-SI")}${zamujen ? " — ZAMUJA" : ""}` : "Brez roka"}
                          </div>
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

      <div className="text-center text-stone-700 text-[10px] mt-2 shrink-0">
        {uraOsvezitve && `Osveženo ${uraOsvezitve.toLocaleTimeString("sl-SI")} · `}samodejno se osvežuje vsakih 45 sekund
      </div>
    </div>
  );
}
