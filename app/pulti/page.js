"use client";

import { useState, useEffect } from "react";

// ===================== NASTAVITVE =====================

const ADMIN_PIN = "1991";

const ZAPOSLENI_PROIZVODNJA = ["Luka", "Miha", "Rok", "Mersad", "Patrik"];
const ZAPOSLENI_SPREJEM = ["Luka", "Miha", "Jože", "Timea", "Žan", "Žiga"];

const STATUSI = [
  { id: "ponudba", naziv: "Ponudba", barva: "bg-gray-500" },
  { id: "izmera", naziv: "Izmera", barva: "bg-blue-500" },
  { id: "cad", naziv: "Priprava CAD", barva: "bg-indigo-500" },
  { id: "razrez", naziv: "Razrez", barva: "bg-yellow-500" },
  { id: "izrezi", naziv: "Obdelava izrezov", barva: "bg-orange-500" },
  { id: "brusenje", naziv: "Brušenje", barva: "bg-purple-500" },
  { id: "montaza", naziv: "Montaža", barva: "bg-red-600" },
  { id: "zakljuceno", naziv: "Zaključeno", barva: "bg-green-600" },
];

const DDV = 0.22;

// ===================== POMOŽNE =====================

function n(x) {
  const v = parseFloat(String(x).replace(",", "."));
  return isNaN(v) ? 0 : v;
}

function eur(x) {
  return (
    x.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
  );
}

function cenaMateriala(vrstica, cenik) {
  const mat = (cenik.materiali || []).find((m) => m.id === vrstica.materialId);
  if (!mat) return 0;
  if (mat.enota === "plosca") return n(vrstica.kolicina) * n(mat.cenaPlosca);
  const cenaM2 = vrstica.debelina === "3" ? n(mat.cena3cm) : n(mat.cena2cm);
  return n(vrstica.kolicina) * cenaM2;
}

function izracunNaloga(nalog, cenik) {
  let material = 0;
  for (const v of nalog.materiali || []) material += cenaMateriala(v, cenik);

  let storitveZnesek = 0;
  for (const s of cenik.storitve || []) {
    storitveZnesek += n(nalog.storitve?.[s.id]) * n(s.cena);
  }

  const netto = material + storitveZnesek;
  const popust = netto * (n(nalog.popust) / 100);
  const osnovaZaDdv = netto - popust;
  const davek = osnovaZaDdv * DDV;
  return { material, storitve: storitveZnesek, netto, popust, osnovaZaDdv, davek, bruto: osnovaZaDdv + davek };
}

function praznaVrsticaMateriala() {
  return { materialId: "", debelina: "2", kolicina: "" };
}

function prazenNalog() {
  return {
    id: Date.now(),
    stevilka: "",
    datum: new Date().toISOString().slice(0, 10),
    stranka: { ime: "", telefon: "", naslov: "" },
    sprejel: "",
    status: "ponudba",
    materiali: [praznaVrsticaMateriala()],
    storitve: {},
    popust: "",
    ponudbenaCena: null,
    dxf: "",
    datumMontaze: "",
    opombe: "",
    zgodovina: [],
    placano: false,
  };
}

// ===================== GLAVNA KOMPONENTA =====================

export default function Pulti() {
  const [nalogi, setNalogi] = useState([]);
  const [cenik, setCenik] = useState(null);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [pogled, setPogled] = useState("seznam");
  const [filter, setFilter] = useState("vsi");
  const [obrazec, setObrazec] = useState(null);
  const [izbran, setIzbran] = useState(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/pulti").then((r) => r.json()),
      fetch("/api/cenik-pulti").then((r) => r.json()),
    ])
      .then(([p, c]) => {
        setNalogi(Array.isArray(p) ? p : []);
        setCenik(c && Array.isArray(c.materiali) && Array.isArray(c.storitve) ? c : null);
      })
      .catch(() => setNapaka("Napaka pri nalaganju podatkov."))
      .finally(() => setNalaganje(false));
  }, []);

  async function shraniNaloge(novi) {
    setNalogi(novi);
    try {
      const r = await fetch("/api/pulti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novi),
      });
      if (!r.ok) throw new Error();
    } catch {
      setNapaka("Napaka pri shranjevanju! Preveri povezavo.");
    }
  }

  async function shraniCenik(nov) {
    setCenik(nov);
    try {
      await fetch("/api/cenik-pulti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nov),
      });
    } catch {
      setNapaka("Napaka pri shranjevanju cenika!");
    }
  }

  function vprasajPin() {
    if (admin) return true;
    const pin = prompt("Vnesi admin PIN:");
    if (pin === ADMIN_PIN) {
      setAdmin(true);
      return true;
    }
    if (pin !== null) alert("Napačen PIN.");
    return false;
  }

  function novaStevilka() {
    const leto = new Date().getFullYear();
    const letos = nalogi.filter((x) => (x.stevilka || "").includes(`P-${leto}`)).length;
    return `P-${leto}-${String(letos + 1).padStart(3, "0")}`;
  }

  if (nalaganje)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
        Nalagam ...
      </div>
    );

  if (!cenik)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-red-600 p-4 text-center">
        Cenika ni bilo mogoče naložiti. Osveži stran ali preveri povezavo.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Pulti</span>
          </div>
          <div className="text-xs text-gray-400">Delovni nalogi — proizvodnja pultov</div>
        </div>
        <div className="flex gap-2">
          <a href="/" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            Police
          </a>
          <button
            onClick={() => {
              if (vprasajPin()) setPogled("cenik");
            }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            Cenik
          </button>
        </div>
      </div>

      {napaka && (
        <div
          className="bg-red-600 text-white text-sm px-4 py-2 cursor-pointer"
          onClick={() => setNapaka("")}
        >
          {napaka} (tapni za zapiranje)
        </div>
      )}

      {pogled === "seznam" && (
        <Seznam
          nalogi={nalogi}
          cenik={cenik}
          filter={filter}
          setFilter={setFilter}
          odpri={(nal) => {
            setIzbran(nal.id);
            setPogled("podrobnosti");
          }}
        />
      )}

      {pogled === "obrazec" && (
        <Obrazec
          zacetni={obrazec}
          cenik={cenik}
          preklici={() => setPogled(obrazec && obrazec._urejanje ? "podrobnosti" : "seznam")}
          shrani={(nal) => {
            const izr = izracunNaloga(nal, cenik);
            let novi;
            if (nal._urejanje) {
              delete nal._urejanje;
              novi = nalogi.map((x) => (x.id === nal.id ? nal : x));
            } else {
              nal.stevilka = novaStevilka();
              nal.ponudbenaCena = izr.bruto;
              nal.zgodovina = [
                { status: "ponudba", datum: new Date().toISOString(), kdo: nal.sprejel || "" },
              ];
              novi = [nal, ...nalogi];
            }
            shraniNaloge(novi);
            setIzbran(nal.id);
            setPogled("podrobnosti");
          }}
        />
      )}

      {pogled === "podrobnosti" && (
        <Podrobnosti
          nalog={nalogi.find((x) => x.id === izbran)}
          cenik={cenik}
          nazaj={() => setPogled("seznam")}
          uredi={(nal) => {
            setObrazec({
              ...prazenNalog(),
              ...nal,
              materiali:
                nal.materiali && nal.materiali.length ? nal.materiali : [praznaVrsticaMateriala()],
              storitve: nal.storitve || {},
              _urejanje: true,
            });
            setPogled("obrazec");
          }}
          spremeniStatus={(nal, novStatus, kdo) => {
            const posodobljen = {
              ...nal,
              status: novStatus,
              zgodovina: [
                ...(nal.zgodovina || []),
                { status: novStatus, datum: new Date().toISOString(), kdo: kdo || "" },
              ],
            };
            shraniNaloge(nalogi.map((x) => (x.id === nal.id ? posodobljen : x)));
          }}
          preklopiPlacano={(nal) => {
            shraniNaloge(nalogi.map((x) => (x.id === nal.id ? { ...x, placano: !x.placano } : x)));
          }}
          izbrisi={(nal) => {
            if (!vprasajPin()) return;
            if (!confirm(`Res izbrišem nalog ${nal.stevilka}?`)) return;
            shraniNaloge(nalogi.filter((x) => x.id !== nal.id));
            setPogled("seznam");
          }}
        />
      )}

      {pogled === "cenik" && (
        <CenikAdmin cenik={cenik} shrani={shraniCenik} nazaj={() => setPogled("seznam")} />
      )}

      {pogled === "seznam" && (
        <button
          onClick={() => {
            setObrazec(prazenNalog());
            setPogled("obrazec");
          }}
          className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center"
        >
          +
        </button>
      )}
    </div>
  );
}

// ===================== SEZNAM =====================

function Seznam({ nalogi, cenik, filter, setFilter, odpri }) {
  const filtrirani = filter === "vsi" ? nalogi : nalogi.filter((x) => x.status === filter);

  return (
    <div className="p-3">
      <div className="grid grid-cols-4 gap-2 mb-3">
        {STATUSI.map((s) => {
          const st = nalogi.filter((x) => x.status === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setFilter(filter === s.id ? "vsi" : s.id)}
              className={`rounded-lg p-2 text-center text-white ${s.barva} ${
                filter === s.id ? "ring-2 ring-black" : ""
              }`}
            >
              <div className="text-lg font-bold leading-none">{st}</div>
              <div className="text-[10px] leading-tight mt-1">{s.naziv}</div>
            </button>
          );
        })}
      </div>

      {filter !== "vsi" && (
        <button onClick={() => setFilter("vsi")} className="text-xs text-red-600 mb-2 underline">
          Prikaži vse
        </button>
      )}

      {filtrirani.length === 0 && (
        <div className="text-center text-gray-400 py-12">Ni nalogov. Dodaj prvega z gumbom +</div>
      )}

      <div className="space-y-2">
        {filtrirani.map((nal) => {
          const s = STATUSI.find((x) => x.id === nal.status) || STATUSI[0];
          const izr = izracunNaloga(nal, cenik);
          return (
            <div
              key={nal.id}
              onClick={() => odpri(nal)}
              className="bg-white rounded-xl p-3 shadow-sm cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{nal.stevilka}</div>
                  <div className="text-sm text-gray-600">{nal.stranka?.ime}</div>
                </div>
                <span className={`text-white text-xs px-2 py-1 rounded-full ${s.barva}`}>
                  {s.naziv}
                </span>
              </div>
              <div className="flex justify-between items-end mt-2 text-sm">
                <span className="text-gray-400">{nal.datum}</span>
                <span className="font-semibold">
                  {eur(izr.bruto)}
                  {nal.placano && <span className="text-green-600 ml-1">✓</span>}
                </span>
              </div>
              {nal.datumMontaze && nal.status !== "zakljuceno" && (
                <div className="text-xs text-red-600 mt-1">Montaža: {nal.datumMontaze}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== OBRAZEC =====================

function Obrazec({ zacetni, cenik, shrani, preklici }) {
  const [nal, setNal] = useState(zacetni);
  const [odprtaSkupina, setOdprtaSkupina] = useState(null);
  const izr = izracunNaloga(nal, cenik);

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";

  const skupine = [];
  for (const s of cenik.storitve) {
    const g = s.skupina || "Ostalo";
    if (!skupine.includes(g)) skupine.push(g);
  }

  function nastaviMaterial(i, polje, vrednost) {
    const materiali = nal.materiali.map((v, j) => (j === i ? { ...v, [polje]: vrednost } : v));
    setNal({ ...nal, materiali });
  }

  function nastaviStoritev(id, vrednost) {
    setNal({ ...nal, storitve: { ...nal.storitve, [id]: vrednost } });
  }

  function steviloVSkupini(g) {
    return cenik.storitve.filter((s) => (s.skupina || "Ostalo") === g && n(nal.storitve?.[s.id]) > 0)
      .length;
  }

  return (
    <div className="p-3 space-y-4">
      <h2 className="font-bold text-lg">
        {nal._urejanje ? `Urejanje ${nal.stevilka}` : "Nov nalog za pult"}
      </h2>

      {/* STRANKA */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Stranka</div>
        <div>
          <label className={lbl}>Ime in priimek / podjetje *</label>
          <input
            className={inp}
            value={nal.stranka.ime}
            onChange={(e) => setNal({ ...nal, stranka: { ...nal.stranka, ime: e.target.value } })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Telefon</label>
            <input
              className={inp}
              value={nal.stranka.telefon}
              onChange={(e) =>
                setNal({ ...nal, stranka: { ...nal.stranka, telefon: e.target.value } })
              }
            />
          </div>
          <div>
            <label className={lbl}>Naslov (montaža)</label>
            <input
              className={inp}
              value={nal.stranka.naslov}
              onChange={(e) =>
                setNal({ ...nal, stranka: { ...nal.stranka, naslov: e.target.value } })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Sprejel</label>
            <select
              className={inp}
              value={nal.sprejel}
              onChange={(e) => setNal({ ...nal, sprejel: e.target.value })}
            >
              <option value="">— izberi —</option>
              {ZAPOSLENI_SPREJEM.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Datum</label>
            <input
              type="date"
              className={inp}
              value={nal.datum}
              onChange={(e) => setNal({ ...nal, datum: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* MATERIAL */}
      <div className="bg-white rounded-xl p-3 space-y-3">
        <div className="font-semibold text-sm">Material</div>
        {nal.materiali.map((v, i) => {
          const mat = cenik.materiali.find((m) => m.id === v.materialId);
          const jePlosca = mat && mat.enota === "plosca";
          return (
            <div key={i} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex gap-2">
                <select
                  className={inp}
                  value={v.materialId}
                  onChange={(e) => nastaviMaterial(i, "materialId", e.target.value)}
                >
                  <option value="">— izberi material —</option>
                  {cenik.materiali.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.naziv}
                    </option>
                  ))}
                </select>
                {nal.materiali.length > 1 && (
                  <button
                    onClick={() =>
                      setNal({ ...nal, materiali: nal.materiali.filter((_, j) => j !== i) })
                    }
                    className="text-red-600 text-lg px-2"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!jePlosca && (
                  <div>
                    <label className={lbl}>Debelina</label>
                    <select
                      className={inp}
                      value={v.debelina}
                      onChange={(e) => nastaviMaterial(i, "debelina", e.target.value)}
                    >
                      <option value="2">2 cm{mat ? ` (${mat.cena2cm} €/m²)` : ""}</option>
                      <option value="3">3 cm{mat ? ` (${mat.cena3cm} €/m²)` : ""}</option>
                    </select>
                  </div>
                )}
                <div className={jePlosca ? "col-span-2" : ""}>
                  <label className={lbl}>
                    {jePlosca ? `Število plošč (${mat.cenaPlosca} €/ploščo)` : "Kvadratura (m²)"}
                  </label>
                  <input
                    className={inp}
                    inputMode="decimal"
                    value={v.kolicina}
                    onChange={(e) => nastaviMaterial(i, "kolicina", e.target.value)}
                  />
                </div>
              </div>
              {n(v.kolicina) > 0 && mat && (
                <div className="text-right text-sm font-semibold">
                  {eur(cenaMateriala(v, cenik))}
                </div>
              )}
            </div>
          );
        })}
        <button
          onClick={() => setNal({ ...nal, materiali: [...nal.materiali, praznaVrsticaMateriala()] })}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500"
        >
          + Dodaj material
        </button>
      </div>

      {/* STORITVE PO SKUPINAH */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Storitve in obdelave</div>
        {skupine.map((g) => {
          const odprta = odprtaSkupina === g;
          const stAktivnih = steviloVSkupini(g);
          return (
            <div key={g} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOdprtaSkupina(odprta ? null : g)}
                className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold bg-gray-50"
              >
                <span>
                  {g}
                  {stAktivnih > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                      {stAktivnih}
                    </span>
                  )}
                </span>
                <span>{odprta ? "▲" : "▼"}</span>
              </button>
              {odprta && (
                <div className="divide-y divide-gray-100">
                  {cenik.storitve
                    .filter((s) => (s.skupina || "Ostalo") === g)
                    .map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                        <div className="flex-1 text-sm leading-tight">
                          {s.naziv}
                          <div className="text-xs text-gray-400">
                            {s.cena} € / {s.enota}
                          </div>
                        </div>
                        <input
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center"
                          inputMode="decimal"
                          placeholder="0"
                          value={nal.storitve?.[s.id] ?? ""}
                          onChange={(e) => nastaviStoritev(s.id, e.target.value)}
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* OSTALO */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Popust (%)</label>
            <input
              className={inp}
              inputMode="decimal"
              value={nal.popust}
              onChange={(e) => setNal({ ...nal, popust: e.target.value })}
            />
          </div>
          <div>
            <label className={lbl}>Datum montaže</label>
            <input
              type="date"
              className={inp}
              value={nal.datumMontaze}
              onChange={(e) => setNal({ ...nal, datumMontaze: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={lbl}>DXF oznaka / link</label>
          <input
            className={inp}
            value={nal.dxf}
            onChange={(e) => setNal({ ...nal, dxf: e.target.value })}
            placeholder="npr. pult_novak_v2.dxf"
          />
        </div>
        <div>
          <label className={lbl}>Opombe</label>
          <textarea
            className={inp}
            rows={2}
            value={nal.opombe}
            onChange={(e) => setNal({ ...nal, opombe: e.target.value })}
          />
        </div>
      </div>

      {/* SKUPAJ */}
      <div className="bg-black text-white rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Material</span>
          <span>{eur(izr.material)}</span>
        </div>
        <div className="flex justify-between">
          <span>Storitve</span>
          <span>{eur(izr.storitve)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-700 pt-1">
          <span>Cena skupaj netto</span>
          <span>{eur(izr.netto)}</span>
        </div>
        {izr.popust > 0 && (
          <div className="flex justify-between text-red-400">
            <span>Popust ({nal.popust}%)</span>
            <span>−{eur(izr.popust)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Davek (22%)</span>
          <span>{eur(izr.davek)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-1">
          <span>CENA SKUPAJ BRUTO</span>
          <span>{eur(izr.bruto)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={preklici} className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold">
          Prekliči
        </button>
        <button
          onClick={() => {
            if (!nal.stranka.ime.trim()) {
              alert("Vnesi ime stranke.");
              return;
            }
            shrani(nal);
          }}
          className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold"
        >
          Shrani
        </button>
      </div>
    </div>
  );
}

// ===================== PODROBNOSTI =====================

function Podrobnosti({ nalog, cenik, nazaj, uredi, spremeniStatus, preklopiPlacano, izbrisi }) {
  const [kdoOpravil, setKdoOpravil] = useState("");
  if (!nalog)
    return (
      <div className="p-4">
        Nalog ne obstaja.{" "}
        <button onClick={nazaj} className="text-red-600 underline">
          Nazaj
        </button>
      </div>
    );

  const s = STATUSI.find((x) => x.id === nalog.status) || STATUSI[0];
  const idx = STATUSI.findIndex((x) => x.id === nalog.status);
  const naslednji = idx < STATUSI.length - 1 ? STATUSI[idx + 1] : null;
  const izr = izracunNaloga(nalog, cenik);
  const aktivneStoritve = (cenik.storitve || []).filter((st) => n(nalog.storitve?.[st.id]) > 0);

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">
        ← Nazaj na seznam
      </button>

      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-lg">{nalog.stevilka}</div>
            <div className="text-sm text-gray-600">{nalog.datum}</div>
          </div>
          <span className={`text-white text-xs px-3 py-1 rounded-full ${s.barva}`}>{s.naziv}</span>
        </div>
        <div className="text-sm">
          <div className="font-semibold">{nalog.stranka?.ime}</div>
          {nalog.stranka?.telefon && <div>{nalog.stranka.telefon}</div>}
          {nalog.stranka?.naslov && <div className="text-gray-600">{nalog.stranka.naslov}</div>}
        </div>
        {nalog.sprejel && <div className="text-xs text-gray-500">Sprejel: {nalog.sprejel}</div>}
        {nalog.dxf && <div className="text-xs text-gray-500">DXF: {nalog.dxf}</div>}
        {nalog.datumMontaze && (
          <div className="text-sm text-red-600 font-semibold">Montaža: {nalog.datumMontaze}</div>
        )}
        {nalog.opombe && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            {nalog.opombe}
          </div>
        )}
      </div>

      {/* SPECIFIKACIJA */}
      <div className="bg-white rounded-xl p-3 text-sm space-y-1">
        <div className="font-semibold mb-1">Specifikacija</div>
        {(nalog.materiali || []).map((v, i) => {
          const mat = (cenik.materiali || []).find((m) => m.id === v.materialId);
          if (!mat || !n(v.kolicina)) return null;
          const opis =
            mat.enota === "plosca"
              ? `${v.kolicina} plošč × ${mat.cenaPlosca} €`
              : `${v.kolicina} m² × ${v.debelina === "3" ? mat.cena3cm : mat.cena2cm} € (${v.debelina} cm)`;
          return (
            <div key={i} className="flex justify-between text-gray-600">
              <span>
                {mat.naziv} — {opis}
              </span>
              <span>{eur(cenaMateriala(v, cenik))}</span>
            </div>
          );
        })}
        {aktivneStoritve.map((st) => (
          <div key={st.id} className="flex justify-between text-gray-600">
            <span>
              {st.naziv} × {nalog.storitve[st.id]} {st.enota}
            </span>
            <span>{eur(n(nalog.storitve[st.id]) * n(st.cena))}</span>
          </div>
        ))}
        {aktivneStoritve.length === 0 && (nalog.materiali || []).every((v) => !n(v.kolicina)) && (
          <div className="text-gray-400">Ni vnesenih postavk.</div>
        )}
      </div>

      {/* CENA */}
      <div className="bg-black text-white rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Cena skupaj netto</span>
          <span>{eur(izr.netto)}</span>
        </div>
        {izr.popust > 0 && (
          <div className="flex justify-between text-red-400">
            <span>Popust ({nalog.popust}%)</span>
            <span>−{eur(izr.popust)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Davek (22%)</span>
          <span>{eur(izr.davek)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-1">
          <span>CENA SKUPAJ BRUTO</span>
          <span>{eur(izr.bruto)}</span>
        </div>
        {nalog.ponudbenaCena != null && Math.abs(nalog.ponudbenaCena - izr.bruto) > 0.01 && (
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Ponudbena cena (ob ponudbi)</span>
            <span>{eur(nalog.ponudbenaCena)}</span>
          </div>
        )}
        <button
          onClick={() => preklopiPlacano(nalog)}
          className={`w-full mt-2 rounded-lg py-2 text-sm font-semibold ${
            nalog.placano ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          {nalog.placano ? "✓ Plačano" : "Označi kot plačano"}
        </button>
      </div>

      {/* STATUS NAPREJ */}
      {naslednji && (
        <div className="bg-white rounded-xl p-3 space-y-2">
          <div className="text-sm font-semibold">Naslednja faza: {naslednji.naziv}</div>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={kdoOpravil}
            onChange={(e) => setKdoOpravil(e.target.value)}
          >
            <option value="">Kdo opravi? (neobvezno)</option>
            {ZAPOSLENI_PROIZVODNJA.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
          <button
            onClick={() => {
              spremeniStatus(nalog, naslednji.id, kdoOpravil);
              setKdoOpravil("");
            }}
            className={`w-full text-white rounded-xl py-3 font-semibold ${naslednji.barva}`}
          >
            Premakni v: {naslednji.naziv} →
          </button>
        </div>
      )}

      {/* ZGODOVINA */}
      {(nalog.zgodovina || []).length > 0 && (
        <div className="bg-white rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <div className="font-semibold text-gray-700 text-sm mb-1">Zgodovina</div>
          {nalog.zgodovina.map((z, i) => {
            const zs = STATUSI.find((x) => x.id === z.status);
            return (
              <div key={i}>
                {new Date(z.datum).toLocaleDateString("sl-SI")}{" "}
                {new Date(z.datum).toLocaleTimeString("sl-SI", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — {zs ? zs.naziv : z.status}
                {z.kdo && ` (${z.kdo})`}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => uredi(nalog)}
          className="flex-1 bg-gray-800 text-white rounded-xl py-3 font-semibold"
        >
          Uredi
        </button>
        <button
          onClick={() => izbrisi(nalog)}
          className="flex-1 bg-red-100 text-red-600 rounded-xl py-3 font-semibold"
        >
          Izbriši
        </button>
      </div>
    </div>
  );
}

// ===================== CENIK (ADMIN) =====================

function CenikAdmin({ cenik, shrani, nazaj }) {
  const [c, setC] = useState(JSON.parse(JSON.stringify(cenik)));
  const [zavihek, setZavihek] = useState("materiali");

  const inp = "border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white";

  function nastaviMat(i, polje, vrednost) {
    const materiali = c.materiali.map((m, j) => (j === i ? { ...m, [polje]: vrednost } : m));
    setC({ ...c, materiali });
  }

  function nastaviStor(i, polje, vrednost) {
    const storitve = c.storitve.map((s, j) => (j === i ? { ...s, [polje]: vrednost } : s));
    setC({ ...c, storitve });
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">
        ← Nazaj
      </button>
      <h2 className="font-bold text-lg">Cenik pultov</h2>

      <div className="flex gap-2">
        <button
          onClick={() => setZavihek("materiali")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            zavihek === "materiali" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Materiali
        </button>
        <button
          onClick={() => setZavihek("storitve")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            zavihek === "storitve" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Storitve
        </button>
      </div>

      {zavihek === "materiali" && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            Cene v €/m² za 2 cm in 3 cm. Keramika se obračuna na ploščo.
          </div>
          {c.materiali.map((m, i) => (
            <div key={m.id} className="bg-white rounded-xl p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  className={`${inp} flex-1`}
                  value={m.naziv}
                  onChange={(e) => nastaviMat(i, "naziv", e.target.value)}
                />
                <button
                  onClick={() => setC({ ...c, materiali: c.materiali.filter((_, j) => j !== i) })}
                  className="text-red-600 text-lg px-1"
                >
                  ×
                </button>
              </div>
              {m.enota === "plosca" ? (
                <div className="flex gap-2 items-center text-sm">
                  <span className="text-gray-500">€/ploščo:</span>
                  <input
                    className={`${inp} w-24 text-right`}
                    inputMode="decimal"
                    value={m.cenaPlosca}
                    onChange={(e) => nastaviMat(i, "cenaPlosca", e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex gap-2 items-center text-sm">
                  <span className="text-gray-500">2 cm:</span>
                  <input
                    className={`${inp} w-20 text-right`}
                    inputMode="decimal"
                    value={m.cena2cm}
                    onChange={(e) => nastaviMat(i, "cena2cm", e.target.value)}
                  />
                  <span className="text-gray-500">3 cm:</span>
                  <input
                    className={`${inp} w-20 text-right`}
                    inputMode="decimal"
                    value={m.cena3cm}
                    onChange={(e) => nastaviMat(i, "cena3cm", e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() =>
                setC({
                  ...c,
                  materiali: [
                    ...c.materiali,
                    { id: "mat" + Date.now(), naziv: "", enota: "m2", cena2cm: "", cena3cm: "" },
                  ],
                })
              }
              className="flex-1 border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500"
            >
              + Material (m²)
            </button>
            <button
              onClick={() =>
                setC({
                  ...c,
                  materiali: [
                    ...c.materiali,
                    { id: "mat" + Date.now(), naziv: "", enota: "plosca", cenaPlosca: "" },
                  ],
                })
              }
              className="flex-1 border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500"
            >
              + Material (plošča)
            </button>
          </div>
        </div>
      )}

      {zavihek === "storitve" && (
        <div className="space-y-2">
          {c.storitve.map((s, i) => (
            <div key={s.id} className="bg-white rounded-xl p-2 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  className={`${inp} flex-1`}
                  value={s.naziv}
                  onChange={(e) => nastaviStor(i, "naziv", e.target.value)}
                />
                <button
                  onClick={() => setC({ ...c, storitve: c.storitve.filter((_, j) => j !== i) })}
                  className="text-red-600 text-lg px-1"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2 items-center text-sm">
                <input
                  className={`${inp} w-20 text-right`}
                  inputMode="decimal"
                  value={s.cena}
                  onChange={(e) => nastaviStor(i, "cena", e.target.value)}
                />
                <select
                  className={inp}
                  value={s.enota}
                  onChange={(e) => nastaviStor(i, "enota", e.target.value)}
                >
                  <option>KOM</option>
                  <option>TM</option>
                  <option>M2</option>
                  <option>KOS</option>
                </select>
                <select
                  className={`${inp} flex-1`}
                  value={s.skupina || "Ostalo"}
                  onChange={(e) => nastaviStor(i, "skupina", e.target.value)}
                >
                  <option>Luknje</option>
                  <option>Izrezi</option>
                  <option>Inline</option>
                  <option>Obdelava</option>
                  <option>Poliranje</option>
                  <option>Montaža</option>
                  <option>Ostalo</option>
                </select>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              setC({
                ...c,
                storitve: [
                  ...c.storitve,
                  {
                    id: "stor" + Date.now(),
                    naziv: "",
                    cena: "",
                    enota: "KOM",
                    skupina: "Ostalo",
                  },
                ],
              })
            }
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500"
          >
            + Dodaj storitev
          </button>
        </div>
      )}

      <button
        onClick={() => {
          shrani(c);
          nazaj();
        }}
        className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold"
      >
        Shrani cenik
      </button>
    </div>
  );
}
