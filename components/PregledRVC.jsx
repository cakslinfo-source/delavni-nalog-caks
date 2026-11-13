"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const st = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const eur = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const kljucMat = (ime) =>
  String(ime || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// Če cenik polic še ni bil shranjen v bazo, velja privzeti (enak kot v modulu Police; tu samo zadnji razred širine).
const PRIVZETI_CENIK_POLICE = {"Rosa Beta":{"materiali":["Rosa Beta"],"brackets":[{"min":96,"max":100,"cena2":82,"cena3":108}]},"Giandone, Bianco Sardo, Azul Tragal, Rosa Porino, Umetni marmor":{"materiali":["Giandone","Bianco Sardo","Azul Tragal","Rosa Porino","Umetni marmor bela z piko","Umetni marmor bela z liso"],"brackets":[{"min":96,"max":100,"cena2":107,"cena3":128}]},"Juparana Columbo, Multicolor, Nero Impala, Wiscont White, Tonalit, Steel Gray":{"materiali":["Juparana Columbo","Multicolor","Nero Impala","Wiscont White","Tonalit","Steel Gray"],"brackets":[{"min":96,"max":100,"cena2":149,"cena3":180}]},"Ivory Brown, Siwakashi, Paradiso":{"materiali":["Ivory Brown","Siwakashi","Paradiso"],"brackets":[{"min":96,"max":100,"cena2":200,"cena3":225}]},"Black Galaxy, Nero Assoluto, Jet Black":{"materiali":["Black Galaxy","Nero Assoluto","Jet Black"],"brackets":[{"min":96,"max":100,"cena2":220,"cena3":255}]}};

// Razdalja med imenoma (za drobne razlike v zapisu istega materiala v dveh cenikih).
function razdalja(a, b) {
  const m = a.length, n = b.length;
  let prej = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const zdaj = [i];
    for (let j = 1; j <= n; j++) {
      zdaj[j] = Math.min(prej[j] + 1, zdaj[j - 1] + 1, prej[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prej = zdaj;
  }
  return prej[n];
}

const MESECI_IMENA = ["januar", "februar", "marec", "april", "maj", "junij", "julij", "avgust", "september", "oktober", "november", "december"];
const jeZeVDelu = (status) => {
  const x = String(status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /prevz|zakljuc|dostav|namesc|pripravl|montaz|izdel|razrez|brus|izrez|obdel|polir/.test(x);
};

const PRIVZETI_STROSKI = {
  delavec: "",
  placeMesec: "",
  elektrika: "",
  potrosni: "",
  odpad: "",
  ure: "",
  stDelavcev: "",
  urNaDelavca: "",
  izkoristek: "",
  fiksni: [
    { naziv: "Najemnina / kredit za prostor", znesek: "" },
    { naziv: "Amortizacija in leasing strojev", znesek: "" },
    { naziv: "Vzdrževanje strojev in orodja", znesek: "" },
    { naziv: "Zavarovanja", znesek: "" },
    { naziv: "Vozila in gorivo", znesek: "" },
    { naziv: "Voda in odvoz mulja / odpadkov", znesek: "" },
    { naziv: "Računovodstvo, telefon, programi", znesek: "" },
  ],
  faze: [
    { naziv: "Priprava", police: "", pulti: "", stroj: false },
    { naziv: "Razrez", police: "", pulti: "", stroj: true },
    { naziv: "Brušenje", police: "", pulti: "", stroj: true },
    { naziv: "Pakiranje in nakladanje", police: "", pulti: "", stroj: false },
  ],
};

function Polje({ vrednost, onChange, enota, sirina = "w-24", namig }) {
  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={vrednost ?? ""}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        inputMode="decimal"
        placeholder={namig || "0"}
        className={`${sirina} px-2 py-1.5 rounded-lg border border-stone-300 bg-white text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/40`}
      />
      {enota && <span className="text-xs text-stone-500 whitespace-nowrap">{enota}</span>}
    </span>
  );
}

function Kartica({ ikona, naslov, podnaslov, children, razred = "" }) {
  return (
    <div className={`bg-white/90 rounded-3xl border border-stone-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-5 ${razred}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{ikona}</span>
        <div>
          <div className="text-sm font-semibold text-stone-800 leading-tight">{naslov}</div>
          {podnaslov && <div className="text-[11px] text-stone-400">{podnaslov}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Ena vrstica izračuna: prodaja − material − izdelava = ostane
function Ostanek({ naziv, prodaja, material, izdelava }) {
  if (!prodaja) return null;
  const imaNabavo = material > 0;
  const rvc = prodaja - material;
  const ostane = rvc - izdelava;
  const delez = prodaja ? (ostane / prodaja) * 100 : 0;
  const barva = !imaNabavo ? "text-stone-400" : ostane >= 0 ? "text-emerald-700" : "text-red-600";
  return (
    <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
      <div className="flex justify-between text-xs text-stone-500">
        <span>{naziv} — prodaja</span>
        <span className="tabular-nums font-medium text-stone-700">{eur(prodaja)}</span>
      </div>
      {imaNabavo ? (
        <>
          <div className="flex justify-between text-xs text-stone-500">
            <span>RVC</span>
            <span className="tabular-nums">{eur(rvc)}</span>
          </div>
          <div className={`mt-1 pt-1 border-t border-stone-200 ${barva}`}>
            <div className="text-[11px] font-medium">Ostane po stroških</div>
            <div className="text-base font-bold tabular-nums leading-tight">{eur(ostane)} <span className="text-xs font-semibold">({delez.toFixed(0)} %)</span></div>
          </div>
        </>
      ) : (
        <div className="text-[11px] text-stone-400 mt-0.5">Vpiši nabavno ceno za izračun.</div>
      )}
    </div>
  );
}

function DobicekMeseci({ meseci, manjkajo = [], nabava = {}, nastaviNabavo, samoIzdelano, setSamoIzdelano, brezVnosa, nacinPlac, setNacinPlac, placeMesec }) {
  const f2 = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // vrstice brez nabavne cene ostanejo na seznamu tudi med tipkanjem (da polje ne izgine sredi vnosa)
  const videne = useRef({});
  manjkajo.forEach((x) => { videne.current[x.id] = x; });
  const seznamManjkajocih = Object.values(videne.current)
    .map((x) => ({ ...x, reseno: !manjkajo.some((y) => y.id === x.id) }))
    .sort((a, b) => b.m2 - a.m2);
  const s = meseci.reduce(
    (v, m) => ({ prihodek: v.prihodek + m.prihodek, m2: v.m2 + m.m2, m2Brez: v.m2Brez + m.m2Brez, material: v.material + m.material, delo: v.delo + m.delo, elektrika: v.elektrika + m.elektrika, potrosni: v.potrosni + m.potrosni, rezija: v.rezija + m.rezija, izdelava: v.izdelava + m.izdelava, ostane: v.ostane + m.ostane, narocil: v.narocil + m.narocil }),
    { prihodek: 0, m2: 0, m2Brez: 0, material: 0, delo: 0, elektrika: 0, potrosni: 0, rezija: 0, izdelava: 0, ostane: 0, narocil: 0 }
  );
  const odst = (o, p) => (p ? `${((o / p) * 100).toFixed(0)} %` : "—");
  const barva = (x) => (x >= 0 ? "text-emerald-700" : "text-red-600");
  const c = "px-3 py-2 text-right tabular-nums whitespace-nowrap";
  const povprecje = meseci.filter((m) => m.kljuc !== "brez").length ? s.ostane / meseci.filter((m) => m.kljuc !== "brez").length : 0;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
          <input type="checkbox" checked={samoIzdelano} onChange={(e) => setSamoIzdelano(e.target.checked)} />
          Samo že izdelano: naročila v izdelavi ali dlje (brez »Sprejeto«)
        </label>
        <div className="text-[11px] text-stone-400 mt-1.5">
          Vsak mesec se odštejejo celotne plače in celotna režija, kot ju vpišeš v »Stroški in materiali«.
        </div>
      </div>

      {nacinPlac === "mesec" && !placeMesec && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 text-sm">
          Mesečne plače še niso vpisane, zato so tukaj 0. V zavihku »Stroški in materiali« vpiši polje »Plače na mesec — vsi delavci«.
        </div>
      )}

      {brezVnosa && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 text-sm">
          Stroški izdelave še niso vpisani, zato je »ostane« prevelik. Vpiši jih v zavihku »Stroški in materiali«.
        </div>
      )}
      {seznamManjkajocih.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 text-sm">
          {s.m2Brez > 0.005 ? (
            <>Za <b>{f2(s.m2Brez)} m²</b> od {f2(s.m2)} m² ni vpisane nabavne cene materiala, zato je strošek materiala tam štet kot 0 in je »ostane« prevelik. Spodaj so našteti vsi taki materiali — vpiši nabavno ceno kar tukaj.</>
          ) : (
            <>✓ Vsi materiali imajo zdaj nabavno ceno.</>
          )}
          <div className="mt-3 bg-white rounded-xl border border-amber-200 divide-y divide-amber-100 max-h-80 overflow-y-auto">
            {seznamManjkajocih.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2 text-stone-800">
                <div className="min-w-0">
                  <div className="font-medium truncate">{x.naziv} · {x.polje === "c3" ? "3 cm" : "2 cm"}</div>
                  <div className="text-[11px] text-stone-500">{x.reseno ? "✓ vpisano" : `${f2(x.m2)} m² brez nabavne cene`}</div>
                </div>
                <Polje vrednost={(nabava[x.kljuc] || {})[x.polje]} onChange={(v) => nastaviNabavo(x.kljuc, x.polje, v, x.naziv)} enota="€/m²" sirina="w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ["Prihodek (brez DDV)", eur(s.prihodek), `${s.narocil} naročil · ${f2(s.m2)} m²`, "text-stone-900"],
          ["Ostane skupaj", eur(s.ostane), `${odst(s.ostane, s.prihodek)} prihodka · povprečno ${eur(povprecje)} na mesec`, barva(s.ostane)],
        ].map(([naziv, vrednost, opomba, razred]) => (
          <div key={naziv} className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3">
            <div className="text-xs text-stone-500">{naziv}</div>
            <div className={`text-3xl font-bold tabular-nums mt-0.5 ${razred}`}>{vrednost}</div>
            <div className="text-xs text-stone-400 mt-0.5">{opomba}</div>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Stroški — vsak posebej</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["🪨 Material", eur(s.material), `${odst(s.material, s.prihodek)} prihodka`, "text-stone-900"],
          ["👷 Plače (delo)", eur(s.delo), `${odst(s.delo, s.prihodek)} prihodka`, "text-stone-900"],
          ["⚡ Elektrika", eur(s.elektrika), `${odst(s.elektrika, s.prihodek)} prihodka`, "text-stone-900"],
          ["🧰 Potrošni material", eur(s.potrosni), `${odst(s.potrosni, s.prihodek)} prihodka`, "text-stone-900"],
          ["🏭 Režija", eur(s.rezija), `${odst(s.rezija, s.prihodek)} prihodka`, "text-stone-900"],
        ].map(([naziv, vrednost, opomba, razred]) => (
          <div key={naziv} className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3">
            <div className="text-xs text-stone-500">{naziv}</div>
            <div className={`text-2xl font-bold tabular-nums mt-0.5 ${razred}`}>{vrednost}</div>
            <div className="text-xs text-stone-400 mt-0.5">{opomba}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-stone-800 mb-2">📅 Koliko ostane po mesecih</div>
        {meseci.length === 0 ? (
          <div className="text-sm text-stone-400 py-6 text-center">Ni naročil za prikaz.</div>
        ) : (
          <>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meseci.map((m) => ({ ...m, ostane: Math.round(m.ostane * 100) / 100 }))} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="kratko" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip formatter={(v) => [eur(v), "Ostane"]} labelFormatter={(l, p) => (p && p[0] ? p[0].payload.naziv : l)} />
                  <Bar dataKey="ostane" radius={[6, 6, 0, 0]}>
                    {meseci.map((m) => <Cell key={m.kljuc} fill={m.ostane >= 0 ? "#10b981" : "#dc2626"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-stone-500 border-b border-stone-200">
                    <th className="px-3 py-2 text-left font-medium">Mesec</th>
                    <th className="px-3 py-2 text-right font-medium">Naročil</th>
                    <th className="px-3 py-2 text-right font-medium">m²</th>
                    <th className="px-3 py-2 text-right font-medium">Prihodek</th>
                    <th className="px-3 py-2 text-right font-medium">Material</th>
                    <th className="px-3 py-2 text-right font-medium">Plače</th>
                    <th className="px-3 py-2 text-right font-medium">Elektrika</th>
                    <th className="px-3 py-2 text-right font-medium">Potrošni mat.</th>
                    <th className="px-3 py-2 text-right font-medium">Režija</th>
                    <th className="px-3 py-2 text-right font-medium">Stroški skupaj</th>
                    <th className="px-3 py-2 text-right font-medium">Ostane</th>
                    <th className="px-3 py-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {meseci.map((m) => (
                    <tr key={m.kljuc} className="border-b border-stone-100">
                      <td className="px-3 py-2 capitalize">{m.naziv}{m.m2Brez > 0.005 ? <span title="Del m² nima nabavne cene" className="text-amber-600"> ⚠</span> : null}</td>
                      <td className={c}>{m.narocil}</td>
                      <td className={c}>{f2(m.m2)}</td>
                      <td className={c}>{eur(m.prihodek)}</td>
                      <td className={c}>{eur(m.material)}</td>
                      <td className={c}>{eur(m.delo)}</td>
                      <td className={c}>{eur(m.elektrika)}</td>
                      <td className={c}>{eur(m.potrosni)}</td>
                      <td className={c}>{eur(m.rezija)}</td>
                      <td className={`${c} font-semibold`}>{eur(m.material + m.izdelava)}</td>
                      <td className={`${c} font-bold ${barva(m.ostane)}`}>{eur(m.ostane)}</td>
                      <td className={`${c} ${barva(m.ostane)}`}>{odst(m.ostane, m.prihodek)}</td>
                    </tr>
                  ))}
                  <tr className="bg-stone-50 font-bold">
                    <td className="px-3 py-2">SKUPAJ</td>
                    <td className={c}>{s.narocil}</td>
                    <td className={c}>{f2(s.m2)}</td>
                    <td className={c}>{eur(s.prihodek)}</td>
                    <td className={c}>{eur(s.material)}</td>
                    <td className={c}>{eur(s.delo)}</td>
                    <td className={c}>{eur(s.elektrika)}</td>
                    <td className={c}>{eur(s.potrosni)}</td>
                    <td className={c}>{eur(s.rezija)}</td>
                    <td className={c}>{eur(s.material + s.izdelava)}</td>
                    <td className={`${c} ${barva(s.ostane)}`}>{eur(s.ostane)}</td>
                    <td className={`${c} ${barva(s.ostane)}`}>{odst(s.ostane, s.prihodek)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-stone-400 pb-4">
        To je ocena, ne računovodski izid. Prihodek = dejanske cene naročil brez DDV (Police po popustu, Pulti ponudbena cena brez DDV), razporejene po datumu naročila.
        Material = razrezani m² × nabavna cena × odpad. Elektrika in potrošni material = razrezani m² × tvoj strošek na m². Plače in režija = dejanski mesečni znesek, ki ga vpišeš. Spomeniki, dostava in montaža niso všteti; režija je všteta samo prek ur izdelave.
      </p>
    </div>
  );
}

export default function PregledRVC() {
  const [admin, setAdmin] = useState(false);
  const [nalaganje, setNalaganje] = useState(true);
  const [cenikPolice, setCenikPolice] = useState({});
  const [cenikPulti, setCenikPulti] = useState(null);
  const [nabava, setNabava] = useState({});
  const [stroski, setStroski] = useState(PRIVZETI_STROSKI);
  const [stanje, setStanje] = useState("");
  const [iskanje, setIskanje] = useState("");
  const [pogled, setPogled] = useState("materiali");
  const [nalogi, setNalogi] = useState([]);
  const [pulti, setPulti] = useState([]);
  const [samoIzdelano, setSamoIzdelano] = useState(true);
  const [nacinPlac, setNacinPlac] = useState("mesec");
  const nalozeno = useRef(false);
  const casovnik = useRef(null);

  useEffect(() => {
    const preberi = () => {
      try { setAdmin(localStorage.getItem("admin-odklenjen") === "da"); } catch (e) {}
    };
    preberi();
    window.addEventListener("focus", preberi);
    return () => window.removeEventListener("focus", preberi);
  }, []);

  useEffect(() => {
    (async () => {
      const dobi = (u) => fetch(u, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      const [a, b, c, d, e] = await Promise.all([dobi("/api/cenik-police"), dobi("/api/cenik-pulti"), dobi("/api/cenik-rvc"), dobi("/api/nalogi"), dobi("/api/pulti")]);
      setNalogi(Array.isArray(d) ? d : []);
      setPulti(Array.isArray(e) ? e : []);
      setCenikPolice(a && typeof a === "object" && !a.napaka && Object.keys(a).length > 0 ? a : PRIVZETI_CENIK_POLICE);
      setCenikPulti(b && Array.isArray(b.materiali) ? b : null);
      if (c && typeof c === "object" && !c.napaka) {
        if (c.nabava && typeof c.nabava === "object") setNabava(c.nabava);
        if (c.stroski && typeof c.stroski === "object") {
          setStroski({
            ...PRIVZETI_STROSKI,
            ...c.stroski,
            fiksni: Array.isArray(c.stroski.fiksni) ? c.stroski.fiksni : PRIVZETI_STROSKI.fiksni,
            faze: Array.isArray(c.stroski.faze) ? c.stroski.faze : PRIVZETI_STROSKI.faze,
          });
        }
      }
      setNalaganje(false);
      setTimeout(() => { nalozeno.current = true; }, 0);
    })();
  }, []);

  // samodejno shranjevanje (0,8 s po zadnji spremembi)
  useEffect(() => {
    if (!nalozeno.current) return;
    setStanje("Shranjujem…");
    clearTimeout(casovnik.current);
    casovnik.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/cenik-rvc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nabava, stroski }),
        });
        setStanje(res.ok ? "✓ Shranjeno" : "⚠ Ni shranjeno (nimaš pravice za spreminjanje ali ni povezave)");
      } catch (e) {
        setStanje("⚠ Ni shranjeno — preveri povezavo");
      }
    }, 800);
    return () => clearTimeout(casovnik.current);
  }, [nabava, stroski]);

  // seznam materialov iz obeh cenikov
  const materiali = useMemo(() => {
    const m = {};
    Object.values(cenikPolice || {}).forEach((skupina) => {
      if (!skupina || !Array.isArray(skupina.materiali) || !Array.isArray(skupina.brackets) || !skupina.brackets.length) return;
      const zadnji = skupina.brackets[skupina.brackets.length - 1];
      const faktor = st(zadnji.max) / 100 || 1; // cenik polic je na tekoči meter pri dani širini -> preračun na m²
      skupina.materiali.forEach((ime) => {
        const k = kljucMat(ime);
        if (!k) return;
        m[k] = m[k] || { kljuc: k, naziv: ime };
        m[k].police = { c2: st(zadnji.cena2) / faktor, c3: st(zadnji.cena3) / faktor };
      });
    });
    ((cenikPulti && cenikPulti.materiali) || []).forEach((x) => {
      if (x.enota && x.enota !== "m2") return;
      let k = kljucMat(x.naziv);
      if (!k) return;
      if (!m[k] && k.length >= 8) {
        const podoben = Object.keys(m).find((o) => o.length >= 8 && razdalja(o, k) <= 2);
        if (podoben) k = podoben;
      }
      m[k] = m[k] || { kljuc: k, naziv: x.naziv };
      m[k].pulti = { c2: st(x.cena2cm), c3: st(x.cena3cm) };
    });
    return Object.values(m).sort((a, b) => a.naziv.localeCompare(b.naziv, "sl"));
  }, [cenikPolice, cenikPulti]);

  // stroški izdelave na m²
  const izr = useMemo(() => {
    const fiksniMesec = (stroski.fiksni || []).reduce((v, x) => v + st(x.znesek), 0);
    // produktivne ure = število delavcev × ur na delavca × izkoriščenost; (staro ročno polje velja le, če delavci niso vpisani)
    const stDelavcev = st(stroski.stDelavcev);
    const urNaDelavca = st(stroski.urNaDelavca) || 168;
    const izkoristek = st(stroski.izkoristek) || 100;
    const ure = stDelavcev > 0 ? stDelavcev * urNaDelavca * (izkoristek / 100) : st(stroski.ure);
    const rezijaUra = ure > 0 ? fiksniMesec / ure : 0;
    const placaUra = ure > 0 ? st(stroski.placeMesec) / ure : 0;
    const zaVrsto = (polje) => {
      const minVse = (stroski.faze || []).reduce((v, f) => v + st(f[polje]), 0);
      const minStroj = (stroski.faze || []).filter((f) => f.stroj).reduce((v, f) => v + st(f[polje]), 0);
      const delo = (minVse / 60) * st(stroski.delavec);
      const elektrika = (minStroj / 60) * st(stroski.elektrika);
      const rezija = (minVse / 60) * rezijaUra;
      const potrosni = st(stroski.potrosni);
      return { minVse, minStroj, delo, elektrika, rezija, potrosni, skupaj: delo + elektrika + rezija + potrosni };
    };
    return { fiksniMesec, rezijaUra, ure, stDelavcev, urNaDelavca, izkoristek, placaUra, police: zaVrsto("police"), pulti: zaVrsto("pulti"), odpad: st(stroski.odpad) };
  }, [stroski]);

  // DOBIČEK PO MESECIH: iz dejanskih naročil (prihodek) in vpisanih stroškov (material + izdelava na m²)
  const meseci = useMemo(() => {
    const kljuci = materiali.map((m) => m.kljuc);
    const predpomnilnik = {};
    const najdi = (ime) => {
      const k = kljucMat(ime);
      if (!k) return null;
      if (k in predpomnilnik) return predpomnilnik[k];
      let r = kljuci.includes(k) ? k : null;
      if (!r && k.length >= 8) r = kljuci.find((o) => o.length >= 8 && razdalja(o, k) <= 2) || null;
      predpomnilnik[k] = r;
      return r;
    };
    // material, ki ga ni v ceniku, dobi svoj ključ iz imena — tako mu lahko vseeno vpišeš nabavno ceno
    const kljucZa = (ime) => najdi(ime) || kljucMat(ime) || "brezmateriala";
    const manjkajo = {};
    const cenaNabave = (ime, debelina, m2) => {
      const k = kljucZa(ime);
      const polje = st(debelina) >= 2.5 ? "c3" : "c2";
      const cena = st((nabava[k] || {})[polje]);
      if (!cena) {
        const id = `${k}|${polje}`;
        const obstojeci = materiali.find((x) => x.kljuc === k);
        manjkajo[id] = manjkajo[id] || { id, kljuc: k, polje, naziv: obstojeci ? obstojeci.naziv : String(ime || "").trim() || "Brez vpisanega materiala", m2: 0 };
        manjkajo[id].m2 += m2;
      }
      return cena;
    };
    const po = {};
    const mesec = (datum) => {
      const d = datum ? new Date(datum) : null;
      const k = d && !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "brez";
      return (po[k] = po[k] || { kljuc: k, prihodek: 0, m2: 0, m2Brez: 0, material: 0, delo: 0, elektrika: 0, potrosni: 0, rezija: 0, narocil: 0 });
    };
    const dodajKos = (o, m2, ime, debelina, vrsta) => {
      if (!m2) return;
      const nab = cenaNabave(ime, debelina, m2);
      o.m2 += m2;
      if (!nab) o.m2Brez += m2;
      o.material += m2 * nab * (1 + izr.odpad / 100);
      o.delo += m2 * izr[vrsta].delo;
      o.elektrika += m2 * izr[vrsta].elektrika;
      o.potrosni += m2 * izr[vrsta].potrosni;
      o.rezija += m2 * izr[vrsta].rezija;
    };
    nalogi.forEach((n) => {
      if (n.vrsta === "ponudba" || (samoIzdelano && !jeZeVDelu(n.status))) return;
      const o = mesec(n.datumVnosa || n.datum);
      o.narocil += 1;
      o.prihodek += st(n.cena) * (1 - st(n.popustSkupaj) / 100);
      (n.postavke || []).forEach((p) => {
        const sirina = p.poseven ? Math.max(st(p.sirinaDesno), st(p.sirinaLevo)) : st(p.sirina);
        dodajKos(o, (st(p.dolzina) * sirina / 10000) * (st(p.kolicina) || 1), p.material, p.debelina, "police");
      });
    });
    pulti.forEach((n) => {
      if (n.vrsta === "ponudba" || (samoIzdelano && !jeZeVDelu(n.status))) return;
      const o = mesec(n.datum);
      o.narocil += 1;
      o.prihodek += st(n.ponudbenaCena) / 1.22;
      const mat = ((cenikPulti && cenikPulti.materiali) || []).find((x) => x.id === n.materialId);
      (n.kosi || []).forEach((k) => {
        dodajKos(o, st(k.dolzina) * st(k.sirina) / 10000, mat ? mat.naziv : "", k.debelina || n.debelina || 2, "pulti");
      });
    });
    const vrstice = Object.values(po)
      .sort((a, b) => (a.kljuc < b.kljuc ? -1 : 1))
      .map((o0) => {
        let o = o0;
        if (nacinPlac === "mesec" && o.kljuc !== "brez") {
          // dejanski mesečni stroški: plače in režija se plačajo v celoti, ne glede na to, koliko se razreže
          o = { ...o, delo: st(stroski.placeMesec), rezija: izr.fiksniMesec };
        }
        const izdelava = o.delo + o.elektrika + o.potrosni + o.rezija;
        const ostane = o.prihodek - o.material - izdelava;
        let naziv = "Brez datuma", kratko = "—";
        if (o.kljuc !== "brez") {
          const [l, m] = o.kljuc.split("-");
          naziv = `${MESECI_IMENA[parseInt(m, 10) - 1]} ${l}`;
          kratko = `${MESECI_IMENA[parseInt(m, 10) - 1].slice(0, 3)} ${l.slice(2)}`;
        }
        return { ...o, izdelava, ostane, naziv, kratko };
      });
    return { vrstice, manjkajo: Object.values(manjkajo).sort((a, b) => b.m2 - a.m2) };
  }, [nalogi, pulti, materiali, nabava, izr, cenikPulti, samoIzdelano, nacinPlac, stroski.placeMesec]);

  if (!admin) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 text-center">
        <div className="text-4xl mb-2">🔒</div>
        <div className="text-sm text-stone-600">RVC je viden samo, ko je odklenjen admin način. Odkleni ga v modulu Police in se vrni na to stran.</div>
      </div>
    );
  }
  if (nalaganje) return <div className="text-stone-500 text-sm p-6">Nalagam…</div>;

  const nastavi = (polje, v) => setStroski((s) => ({ ...s, [polje]: v }));
  const nastaviVrstico = (seznam, i, polje, v) =>
    setStroski((s) => ({ ...s, [seznam]: s[seznam].map((x, j) => (j === i ? { ...x, [polje]: v } : x)) }));
  const odstrani = (seznam, i) => setStroski((s) => ({ ...s, [seznam]: s[seznam].filter((_, j) => j !== i) }));
  const nastaviNabavo = (k, polje, v, naziv) => setNabava((n) => ({ ...n, [k]: { ...(n[k] || {}), [polje]: v, ...(naziv ? { naziv } : {}) } }));

  // materiali iz naročil, ki jih ni v nobenem ceniku, a imajo vpisano nabavno ceno
  const dodatni = Object.entries(nabava)
    .filter(([k, v]) => v && v.naziv && !materiali.some((m) => m.kljuc === k))
    .map(([k, v]) => ({ kljuc: k, naziv: v.naziv, dodatni: true }));
  const prikazani = [...materiali, ...dodatni].filter((m) => m.naziv.toLowerCase().includes(iskanje.toLowerCase()));
  const brezVnosa = !st(stroski.delavec) && izr.police.minVse === 0 && izr.pulti.minVse === 0;
  const povzetek = (naziv, x) => (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="text-xs font-semibold text-stone-700 mb-1">{naziv} — strošek izdelave na 1 m²</div>
      <div className="text-2xl font-bold tabular-nums text-stone-900">{eur(x.skupaj)}</div>
      <div className="text-[11px] text-stone-500 mt-1 space-y-0.5">
        <div className="flex justify-between"><span>Delo ({x.minVse.toFixed(0)} min)</span><span className="tabular-nums">{eur(x.delo)}</span></div>
        <div className="flex justify-between"><span>Elektrika ({x.minStroj.toFixed(0)} min strojev)</span><span className="tabular-nums">{eur(x.elektrika)}</span></div>
        <div className="flex justify-between"><span>Potrošni material</span><span className="tabular-nums">{eur(x.potrosni)}</span></div>
        <div className="flex justify-between"><span>Režija</span><span className="tabular-nums">{eur(x.rezija)}</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 mt-1 flex-1">
      <div className="relative overflow-hidden rounded-3xl text-white px-6 py-5 shadow-xl" style={{ background: "linear-gradient(135deg,#1c1917 0%,#065f46 60%,#10b981 100%)" }}>
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/70">💰 RVC — razlika v ceni</div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1">Koliko nam ostane pri posameznem materialu</div>
            <div className="text-xs text-white/70 mt-1">Vse cene so brez DDV in na 1 m². Prodajne cene se berejo iz cenikov Polic in Pultov.</div>
          </div>
          <div className="text-xs bg-white/15 rounded-full px-3 py-1">{stanje || "Spremembe se shranijo same"}</div>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
        {[["materiali", "🧮 Stroški in materiali"], ["meseci", "📅 Dobiček na mesec"]].map(([id, naziv]) => (
          <button
            key={id}
            onClick={() => setPogled(id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${pogled === id ? "bg-stone-900 text-white font-medium" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {naziv}
          </button>
        ))}
      </div>

      {pogled === "meseci" ? (
        <DobicekMeseci meseci={meseci.vrstice} manjkajo={meseci.manjkajo} nabava={nabava} nastaviNabavo={nastaviNabavo} samoIzdelano={samoIzdelano} setSamoIzdelano={setSamoIzdelano} brezVnosa={brezVnosa} nacinPlac={nacinPlac} setNacinPlac={setNacinPlac} placeMesec={st(stroski.placeMesec)} />
      ) : (
      <>
      {brezVnosa && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 text-sm">
          Stroški še niso vpisani. Najprej spodaj v »Stroški« vpiši urno postavko delavca in čase izdelave, potem pri materialih nabavne cene.
        </div>
      )}

      {/* STROŠKI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Kartica ikona="👷" naslov="Osnovni stroški" podnaslov="na uro oziroma na m²">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>Delavec — celoten strošek na uro<div className="text-[11px] text-stone-400">bruto plača s prispevki, malica, prevoz, regres</div></span>
              <Polje vrednost={stroski.delavec} onChange={(v) => nastavi("delavec", v)} enota="€/h" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Plače na mesec — vsi delavci<div className="text-[11px] text-stone-400">celoten mesečni strošek plač v proizvodnji; za »Dobiček na mesec«</div></span>
              <Polje vrednost={stroski.placeMesec} onChange={(v) => nastavi("placeMesec", v)} enota="€/mes" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Elektrika — ko stroj dela<div className="text-[11px] text-stone-400">šteje se pri fazah, označenih kot »stroj«</div></span>
              <Polje vrednost={stroski.elektrika} onChange={(v) => nastavi("elektrika", v)} enota="€/h" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Potrošni material<div className="text-[11px] text-stone-400">diski, brusni koluti, lepila, impregnacija, embalaža</div></span>
              <Polje vrednost={stroski.potrosni} onChange={(v) => nastavi("potrosni", v)} enota="€/m²" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Odpad pri razrezu<div className="text-[11px] text-stone-400">koliko materiala gre v ostanke in izmet</div></span>
              <Polje vrednost={stroski.odpad} onChange={(v) => nastavi("odpad", v)} enota="%" />
            </div>
          </div>
        </Kartica>

        <Kartica ikona="⏱" naslov="Povprečni čas izdelave" podnaslov="minut na 1 m², posebej za police in pulte">
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_70px_70px_44px_24px] gap-1.5 text-[11px] text-stone-500 px-1">
              <span>Faza</span><span className="text-right">Police</span><span className="text-right">Pulti</span><span className="text-center">Stroj</span><span />
            </div>
            {(stroski.faze || []).map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_70px_44px_24px] gap-1.5 items-center">
                <input value={f.naziv} onChange={(e) => nastaviVrstico("faze", i, "naziv", e.target.value)} className="px-2 py-1.5 rounded-lg border border-stone-300 text-sm min-w-0" />
                <Polje vrednost={f.police} onChange={(v) => nastaviVrstico("faze", i, "police", v)} sirina="w-full" />
                <Polje vrednost={f.pulti} onChange={(v) => nastaviVrstico("faze", i, "pulti", v)} sirina="w-full" />
                <input type="checkbox" checked={!!f.stroj} onChange={(e) => nastaviVrstico("faze", i, "stroj", e.target.checked)} className="mx-auto" />
                <button onClick={() => odstrani("faze", i)} className="text-stone-400 hover:text-red-600 text-sm" title="Odstrani">✕</button>
              </div>
            ))}
            <button onClick={() => setStroski((s) => ({ ...s, faze: [...s.faze, { naziv: "", police: "", pulti: "", stroj: false }] }))} className="text-xs text-red-700 font-medium mt-1">+ Dodaj fazo</button>
            <div className="text-[11px] text-stone-400 pt-1">Skupaj: police {izr.police.minVse.toFixed(0)} min/m² · pulti {izr.pulti.minVse.toFixed(0)} min/m²</div>
          </div>
        </Kartica>

        <Kartica ikona="🏭" naslov="Režija — fiksni stroški" podnaslov="mesečni zneski, razdeljeni na produktivne ure">
          <div className="space-y-1.5">
            {(stroski.fiksni || []).map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_24px] gap-1.5 items-center">
                <input value={f.naziv} onChange={(e) => nastaviVrstico("fiksni", i, "naziv", e.target.value)} className="px-2 py-1.5 rounded-lg border border-stone-300 text-sm min-w-0" />
                <Polje vrednost={f.znesek} onChange={(v) => nastaviVrstico("fiksni", i, "znesek", v)} sirina="w-full" enota="€" />
                <button onClick={() => odstrani("fiksni", i)} className="text-stone-400 hover:text-red-600 text-sm" title="Odstrani">✕</button>
              </div>
            ))}
            <button onClick={() => setStroski((s) => ({ ...s, fiksni: [...s.fiksni, { naziv: "", znesek: "" }] }))} className="text-xs text-red-700 font-medium mt-1">+ Dodaj strošek</button>
            <div className="pt-2 border-t border-stone-200 mt-2 space-y-2 text-sm">
              <div className="font-medium text-stone-700">Produktivne ure na mesec</div>
              <div className="flex items-center justify-between gap-2">
                <span>Število delavcev v proizvodnji</span>
                <Polje vrednost={stroski.stDelavcev} onChange={(v) => nastavi("stDelavcev", v)} sirina="w-20" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Ur na delavca na mesec<div className="text-[11px] text-stone-400">polni delovni čas je približno 168 h</div></span>
                <Polje vrednost={stroski.urNaDelavca} onChange={(v) => nastavi("urNaDelavca", v)} enota="h" sirina="w-20" namig="168" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Izkoriščenost<div className="text-[11px] text-stone-400">koliko časa res delajo na izdelkih (brez čiščenja, čakanja, premikov)</div></span>
                <Polje vrednost={stroski.izkoristek} onChange={(v) => nastavi("izkoristek", v)} enota="%" sirina="w-20" namig="100" />
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-stone-600 space-y-0.5">
                {izr.stDelavcev > 0 ? (
                  <div>{izr.stDelavcev} × {izr.urNaDelavca} h × {izr.izkoristek} % = <b>{izr.ure.toFixed(0)} produktivnih ur</b> na mesec</div>
                ) : (
                  <div className="text-amber-700">Vpiši število delavcev, da se izračunajo produktivne ure.</div>
                )}
                <div>Fiksni stroški {eur(izr.fiksniMesec)} ÷ {izr.ure.toFixed(0)} h = režija <b>{eur(izr.rezijaUra)}</b> na uro dela</div>
                {izr.placaUra > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Mesečne plače ÷ {izr.ure.toFixed(0)} h = <b>{eur(izr.placaUra)}</b> na uro dela</span>
                    <button onClick={() => nastavi("delavec", izr.placaUra.toFixed(2).replace(".", ","))} className="text-red-700 font-medium underline">uporabi kot urno postavko delavca</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Kartica>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {povzetek("📋 Police", izr.police)}
        {povzetek("🪨 Pulti", izr.pulti)}
      </div>

      {/* MATERIALI */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <div className="text-base font-bold text-stone-800">Materiali</div>
          <div className="text-xs text-stone-500">Vpiši, koliko plačamo za 1 m² materiala. Ostalo se izračuna samo.</div>
        </div>
        <input value={iskanje} onChange={(e) => setIskanje(e.target.value)} placeholder="Išči material…" className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm w-56" />
      </div>

      {prikazani.length === 0 ? (
        <div className="text-sm text-stone-400 py-6 text-center">Ni materialov v cenikih.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prikazani.map((m) => {
            const n = nabava[m.kljuc] || {};
            return (
              <div key={m.kljuc} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-4">
                <div className="font-semibold text-stone-900 mb-2">🪨 {m.naziv}{m.dodatni && <span className="ml-2 text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">ni v ceniku</span>}</div>
                <div className="grid grid-cols-2 gap-3">
                  {[["2 cm", "c2"], ["3 cm", "c3"]].map(([oznaka, polje]) => {
                    const nab = st(n[polje]);
                    const material = nab * (1 + izr.odpad / 100);
                    return (
                      <div key={polje} className="space-y-1.5">
                        <div className="text-xs font-semibold text-stone-600">{oznaka}</div>
                        <div className="text-[11px] text-stone-500">Nabavna cena</div>
                        <Polje vrednost={n[polje]} onChange={(v) => nastaviNabavo(m.kljuc, polje, v)} enota="€/m²" sirina="w-20" />
                        {nab > 0 && izr.odpad > 0 && <div className="text-[11px] text-stone-400">z odpadom {eur(material)}</div>}
                        <Ostanek naziv="Police" prodaja={m.police ? m.police[polje] : 0} material={material} izdelava={izr.police.skupaj} />
                        <Ostanek naziv="Pulti" prodaja={m.pulti ? m.pulti[polje] : 0} material={material} izdelava={izr.pulti.skupaj} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-stone-400 pb-4">
        Izračun na 1 m²: prodajna cena − nabavna cena (povečana za odpad) = RVC. RVC − strošek izdelave (delo + elektrika + potrošni material + režija) = ostane.
        Prodajna cena polic je preračunana iz cenika na tekoči meter. Popusti strankam, storitve (izrezi, luknje), dostava in montaža tukaj niso všteti.
      </p>
      </>
      )}
    </div>
  );
}
