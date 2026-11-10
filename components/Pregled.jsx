"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import PregledPlosca from "./PregledPlosca";
import PregledRezanje from "./PregledRezanje";
import PregledVrednost from "./PregledVrednost";

const STOLPCI = [
  { id: "sprejeto", naziv: "Sprejeto", barva: "#78716c" },
  { id: "izdelavi", naziv: "V izdelavi", barva: "#f97316" },
  { id: "pripravljeno", naziv: "Pripravljeno", barva: "#0ea5e9" },
];

const BARVA_MODULA = { Police: "#dc2626", Pulti: "#a855f7", Spomenik: "#eab308" };
const KRATICA_MODULA = { Police: "Police", Pulti: "Pulti", Spomenik: "Spomenik" };

// Ena sama, zanesljiva preslikava statusa (enaka kot pri Policah, Pultih in Spomenikih).
// Prepozna nove vrednosti (sprejeto, izdelavi ...), imena (V izdelavi ...) IN vse stare vrednosti
// (ponudba, izmera, razrez, montaza, zakljuceno ...).
function normalizirajStatusModula(status) {
  const s = String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/prevz|zakljuc|dostav|namesc/.test(s)) return "prevzeto";
  if (/pripravl|montaz/.test(s)) return "pripravljeno";
  if (/izdel|razrez|brus|izrez|obdel|polir|graviran/.test(s)) return "izdelavi";
  return "sprejeto";
}

const mapPoliceStatus = normalizirajStatusModula;
const mapPultiStatus = normalizirajStatusModula;
const mapSpomenikStatus = normalizirajStatusModula;

function materialiPolice(nalog) {
  const postavke = (nalog.postavke || []).filter((p) => p.material && p.material.trim());
  if (postavke.length === 0) return "";
  const videni = new Set();
  const rezultat = [];
  postavke.forEach((p) => {
    const ime = p.material.trim();
    if (videni.has(ime)) return;
    videni.add(ime);
    rezultat.push(ime);
  });
  return rezultat.join(", ");
}

// Police in spomeniki: vneseni znesek je neto; pulti: ponudbena cena je z DDV (22 %).
function zneski(znesek, vrsta) {
  const z = Number(znesek) || 0;
  if (vrsta === "bruto") return { cena: z, bruto: z, neto: z / 1.22 };
  return { cena: z, neto: z, bruto: z * 1.22 };
}

export default function Pregled() {
  const [nacin, setNacin] = useState("tabla");
  useEffect(() => {
    try {
      const n = localStorage.getItem("pregled-nacin");
      if (n === "plosca" || n === "tabla" || n === "rezanje" || n === "vrednost") setNacin(n);
    } catch (e) {}
  }, []);
  function izberiNacin(n) {
    setNacin(n);
    try { localStorage.setItem("pregled-nacin", n); } catch (e) {}
  }
  const [postavke, setPostavke] = useState([]);
  const [policeSurovo, setPoliceSurovo] = useState([]);
  const [vrednostPS, setVrednostPS] = useState(0);
  const [nalaganje, setNalaganje] = useState(true);
  const [uraOsvezitve, setUraOsvezitve] = useState(null);
  const [zdaj, setZdaj] = useState(new Date());

  async function nalozi() {
    try {
      const [nalogiRes, pultiRes, spomenikiRes, pultiCenikRes] = await Promise.all([
        fetch("/api/nalogi", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch("/api/pulti", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch("/api/spomeniki", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        fetch("/api/cenik-pulti", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);

      const vse = [
        ...(Array.isArray(nalogiRes) ? nalogiRes : []).map((n) => ({
          modul: "Police",
          id: n.id,
          stevilka: n.stevilka,
          stranka: n.stranka,
          rok: n.rok,
          material: materialiPolice(n),
          objekt: n.tipStranke === "pravna" ? n.objekt : "",
          stolpec: mapPoliceStatus(n.status),
          datum: n.datumVnosa || n.datum,
          ponudba: n.vrsta === "ponudba",
          kosi: (n.postavke || [])
            .filter((p) => p && (p.dolzina || p.sirina || p.sirinaLevo || p.sirinaDesno))
            .map((p) => ({
              material: (p.material || "").trim(),
              dolzina: p.dolzina,
              sirina: p.poseven ? Math.max(parseFloat(String(p.sirinaDesno).replace(",", ".")) || 0, parseFloat(String(p.sirinaLevo).replace(",", ".")) || 0) : p.sirina,
              kolicina: p.kolicina,
            })),
          placano: (n.placano || "Ne") === "Da" || n.racun === "poslan",
          ...zneski((Number(String(n.cena).replace(",", ".")) || 0) * (1 - (parseFloat(String(n.popustSkupaj).replace(",", ".")) || 0) / 100), "neto"),
        })),
        ...(Array.isArray(pultiRes) ? pultiRes : []).map((p) => {
          const matPodatki = pultiCenikRes?.materiali?.find((m) => m.id === p.materialId);
          return {
            modul: "Pulti",
            id: p.id,
            stevilka: p.stevilka,
            stranka: p.stranka?.ime,
            rok: p.datumMontaze,
            material: matPodatki ? matPodatki.naziv : "",
            objekt: "",
            stolpec: mapPultiStatus(p.status),
            datum: p.datum,
            ponudba: p.vrsta === "ponudba",
            placano: !!p.placano,
            kosi: (p.kosi || [])
              .filter((k) => k && (k.dolzina || k.sirina))
              .map((k) => ({ material: matPodatki ? matPodatki.naziv : "", dolzina: k.dolzina, sirina: k.sirina, kolicina: 1 })),
            ...zneski(Number(p.ponudbenaCena) || 0, "bruto"),
          };
        }),
        ...(Array.isArray(spomenikiRes) ? spomenikiRes : []).map((s) => ({
          modul: "Spomenik",
          id: s.id,
          stevilka: s.stevilka,
          stranka: s.stranka?.ime,
          rok: s.montaza,
          material: s.material || "",
          objekt: "",
          stolpec: mapSpomenikStatus(s.status),
          datum: s.datum,
          ponudba: s.vrsta === "ponudba",
          placano: s.placano === "Da",
          kosi: (s.komponente || [])
            .filter((k) => k && (k.dolzina || k.sirina))
            .map((k) => ({ material: (s.material || "").trim(), dolzina: k.dolzina, sirina: k.sirina, kolicina: k.kolicina })),
          ...zneski(Number(String(s.cena).replace(",", ".")) || 0, "neto"),
        })),
      ];

      setPostavke(vse);
      const sv = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(x) ? 0 : x; };
      setPoliceSurovo(Array.isArray(nalogiRes) ? nalogiRes : []);
      setVrednostPS(
        (Array.isArray(pultiRes) ? pultiRes : []).filter((p) => p.vrsta !== "ponudba").reduce((v, p) => v + sv(p.ponudbenaCena), 0) +
        (Array.isArray(spomenikiRes) ? spomenikiRes : []).filter((x) => x.vrsta !== "ponudba").reduce((v, x) => v + sv(x.cena), 0)
      );
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
    <div className={nacin !== "tabla" ? "min-h-screen bg-stone-100 text-stone-900 p-4 sm:p-5 flex flex-col" : "h-screen bg-stone-950 text-white p-4 sm:p-5 flex flex-col overflow-hidden"} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className={`flex items-center justify-between mb-3 shrink-0 gap-4 ${nacin !== "tabla" ? "bg-stone-950 text-white rounded-2xl px-4 py-3" : ""}`}>
        <div className="min-w-0">
          <div className="font-bold text-2xl tracking-tight">
            ČAKŠ <span className="text-red-500">· Pregled proizvodnje</span>
          </div>
          <div className="text-stone-500 text-xs mt-0.5">Kamnoseštvo Čakš — vsi moduli v živo</div>
        </div>

        {nacin === "tabla" && podatkiGrafa.length > 0 && (
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
          <div className="flex gap-1.5 justify-end mb-1.5 flex-wrap">
            {[
              { id: "tabla", naziv: "🗂 Tabla naročil" },
              { id: "plosca", naziv: "📊 Nadzorna plošča" },
              { id: "rezanje", naziv: "📏 Rezanje skupaj" },
              { id: "vrednost", naziv: "💶 Vrednost naročil" },
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => izberiNacin(z.id)}
                className={`text-[10px] px-2 py-1 rounded font-semibold transition-colors ${nacin === z.id ? "bg-red-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-300"}`}
              >
                {z.naziv}
              </button>
            ))}
            <a href="/" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">Police</a>
            <a href="/pulti" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">Pulti</a>
            <a href="/spomeniki" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">Spomeniki</a>
            <a href="/sestanki" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">Sestanki</a>
            <a href="/material" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">🪨 Material</a>
            <a href="/inventura" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">📋 Inventura</a>
            <a href="/skladisce" className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300 transition-colors">📦 Skladišče</a>
          </div>
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
      ) : nacin === "plosca" ? (
        <PregledPlosca postavke={postavke} />
      ) : nacin === "vrednost" ? (
        <PregledVrednost />
      ) : nacin === "rezanje" ? (
        <PregledRezanje postavke={postavke} />
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
                            {p.material && <> · <span className="text-stone-300">{p.material}</span></>}
                          </div>
                          <div className={`text-xs truncate ${zamujen ? "text-red-400 font-semibold" : "text-stone-500"}`}>
                            {p.rok ? `Rok: ${new Date(p.rok).toLocaleDateString("sl-SI")}${zamujen ? " — ZAMUJA" : ""}` : "Brez roka"}
                            {p.objekt && ` · Objekt: ${p.objekt}`}
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

      <div className="text-center text-stone-400 text-[10px] mt-2 shrink-0">
        {uraOsvezitve && `Osveženo ${uraOsvezitve.toLocaleTimeString("sl-SI")} · `}samodejno se osvežuje vsakih 45 sekund
      </div>
    </div>
  );
}
