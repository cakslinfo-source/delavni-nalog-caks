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

const IZREZI_TIPI = [
  { id: "luknja", naziv: "Luknja" },
  { id: "poglobitev", naziv: "Poglobitev" },
  { id: "inlinePoglobitev", naziv: "Inline poglobitev" },
  { id: "izrez", naziv: "Izrez" },
];

const DDV = 0.22;

// ===================== IZRAČUNI =====================

function n(x) {
  const v = parseFloat(String(x).replace(",", "."));
  return isNaN(v) ? 0 : v;
}

function izracunKosa(kos, cenik) {
  const material = cenik.materiali.find((m) => m.id === kos.materialId);
  const povrsina = (n(kos.dolzina) * n(kos.sirina)) / 10000; // cm -> m²
  const cenaMaterial = povrsina * (material ? n(material.cenaM2) : 0);
  const cenaRazrez = n(kos.razrezTm) * n(cenik.razrezTm);
  const cenaBrusenje = n(kos.brusenjeTm) * n(cenik.brusenjeTm);
  let cenaIzrezi = 0;
  for (const t of IZREZI_TIPI) {
    cenaIzrezi += n(kos.izrezi?.[t.id]) * n(cenik.izrezi?.[t.id]);
  }
  return {
    povrsina,
    cenaMaterial,
    cenaRazrez,
    cenaBrusenje,
    cenaIzrezi,
    skupaj: cenaMaterial + cenaRazrez + cenaBrusenje + cenaIzrezi,
  };
}

function izracunNaloga(nalog, cenik) {
  const osnova = (nalog.kosi || []).reduce(
    (s, kos) => s + izracunKosa(kos, cenik).skupaj,
    0
  );
  const popust = osnova * (n(nalog.popust) / 100);
  const brezDdv = osnova - popust;
  const ddv = brezDdv * DDV;
  return { osnova, popust, brezDdv, ddv, zDdv: brezDdv + ddv };
}

function eur(x) {
  return (
    x.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " €"
  );
}

function prazenKos() {
  return {
    naziv: "",
    dolzina: "",
    sirina: "",
    materialId: "",
    razrezTm: "",
    brusenjeTm: "",
    izrezi: { luknja: 0, poglobitev: 0, inlinePoglobitev: 0, izrez: 0 },
  };
}

function prazenNalog() {
  return {
    id: Date.now(),
    stevilka: "",
    datum: new Date().toISOString().slice(0, 10),
    stranka: { ime: "", telefon: "", naslov: "" },
    sprejel: "",
    status: "ponudba",
    kosi: [prazenKos()],
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
  const [pogled, setPogled] = useState("seznam"); // seznam | obrazec | podrobnosti | cenik
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
        setCenik(c && c.materiali ? c : null);
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
      {/* HEADER */}
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
              nal.ponudbenaCena = izr.zDdv;
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
            setObrazec({ ...nal, _urejanje: true });
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
            shraniNaloge(
              nalogi.map((x) => (x.id === nal.id ? { ...x, placano: !x.placano } : x))
            );
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

      {/* GUMB NOV NALOG */}
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
  const filtrirani =
    filter === "vsi" ? nalogi : nalogi.filter((x) => x.status === filter);

  return (
    <div className="p-3">
      {/* PREGLED PO FAZAH */}
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
        <button
          onClick={() => setFilter("vsi")}
          className="text-xs text-red-600 mb-2 underline"
        >
          Prikaži vse
        </button>
      )}

      {filtrirani.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          Ni nalogov. Dodaj prvega z gumbom +
        </div>
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
                  {eur(izr.zDdv)}
                  {nal.placano && <span className="text-green-600 ml-1">✓</span>}
                </span>
              </div>
              {nal.datumMontaze && nal.status !== "zakljuceno" && (
                <div className="text-xs text-red-600 mt-1">
                  Montaža: {nal.datumMontaze}
                </div>
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
  const izr = izracunNaloga(nal, cenik);

  function nastaviKos(i, polje, vrednost) {
    const kosi = nal.kosi.map((k, j) => (j === i ? { ...k, [polje]: vrednost } : k));
    setNal({ ...nal, kosi });
  }

  function nastaviIzrez(i, tip, vrednost) {
    const kosi = nal.kosi.map((k, j) =>
      j === i ? { ...k, izrezi: { ...k.izrezi, [tip]: vrednost } } : k
    );
    setNal({ ...nal, kosi });
  }

  const inp =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";

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
            onChange={(e) =>
              setNal({ ...nal, stranka: { ...nal.stranka, ime: e.target.value } })
            }
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

      {/* KOSI */}
      {nal.kosi.map((kos, i) => {
        const ik = izracunKosa(kos, cenik);
        return (
          <div key={i} className="bg-white rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">Kos {i + 1}</div>
              {nal.kosi.length > 1 && (
                <button
                  onClick={() =>
                    setNal({ ...nal, kosi: nal.kosi.filter((_, j) => j !== i) })
                  }
                  className="text-red-600 text-xs"
                >
                  Odstrani
                </button>
              )}
            </div>
            <div>
              <label className={lbl}>Naziv (npr. Pult ob steni, Otok ...)</label>
              <input
                className={inp}
                value={kos.naziv}
                onChange={(e) => nastaviKos(i, "naziv", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lbl}>Dolžina (cm)</label>
                <input
                  className={inp}
                  inputMode="decimal"
                  value={kos.dolzina}
                  onChange={(e) => nastaviKos(i, "dolzina", e.target.value)}
                />
              </div>
              <div>
                <label className={lbl}>Širina (cm)</label>
                <input
                  className={inp}
                  inputMode="decimal"
                  value={kos.sirina}
                  onChange={(e) => nastaviKos(i, "sirina", e.target.value)}
                />
              </div>
              <div>
                <label className={lbl}>Material</label>
                <select
                  className={inp}
                  value={kos.materialId}
                  onChange={(e) => nastaviKos(i, "materialId", e.target.value)}
                >
                  <option value="">—</option>
                  {cenik.materiali.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.naziv}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Razrez (tm)</label>
                <input
                  className={inp}
                  inputMode="decimal"
                  value={kos.razrezTm}
                  onChange={(e) => nastaviKos(i, "razrezTm", e.target.value)}
                />
              </div>
              <div>
                <label className={lbl}>Brušenje (tm)</label>
                <input
                  className={inp}
                  inputMode="decimal"
                  value={kos.brusenjeTm}
                  onChange={(e) => nastaviKos(i, "brusenjeTm", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {IZREZI_TIPI.map((t) => (
                <div key={t.id}>
                  <label className={lbl}>{t.naziv} (kpl)</label>
                  <input
                    className={inp}
                    inputMode="numeric"
                    value={kos.izrezi?.[t.id] ?? 0}
                    onChange={(e) => nastaviIzrez(i, t.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="text-right text-sm text-gray-600">
              {ik.povrsina > 0 && (
                <span className="mr-2">{ik.povrsina.toFixed(2)} m²</span>
              )}
              <span className="font-semibold">{eur(ik.skupaj)}</span>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => setNal({ ...nal, kosi: [...nal.kosi, prazenKos()] })}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2 text-sm text-gray-500"
      >
        + Dodaj kos
      </button>

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
          <span>Osnova</span>
          <span>{eur(izr.osnova)}</span>
        </div>
        {izr.popust > 0 && (
          <div className="flex justify-between text-red-400">
            <span>Popust ({nal.popust}%)</span>
            <span>−{eur(izr.popust)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>DDV 22%</span>
          <span>{eur(izr.ddv)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-1">
          <span>SKUPAJ</span>
          <span>{eur(izr.zDdv)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={preklici}
          className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold"
        >
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
          <span className={`text-white text-xs px-3 py-1 rounded-full ${s.barva}`}>
            {s.naziv}
          </span>
        </div>
        <div className="text-sm">
          <div className="font-semibold">{nalog.stranka?.ime}</div>
          {nalog.stranka?.telefon && <div>{nalog.stranka.telefon}</div>}
          {nalog.stranka?.naslov && <div className="text-gray-600">{nalog.stranka.naslov}</div>}
        </div>
        {nalog.sprejel && (
          <div className="text-xs text-gray-500">Sprejel: {nalog.sprejel}</div>
        )}
        {nalog.dxf && (
          <div className="text-xs text-gray-500">DXF: {nalog.dxf}</div>
        )}
        {nalog.datumMontaze && (
          <div className="text-sm text-red-600 font-semibold">
            Montaža: {nalog.datumMontaze}
          </div>
        )}
        {nalog.opombe && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            {nalog.opombe}
          </div>
        )}
      </div>

      {/* KOSI */}
      {(nalog.kosi || []).map((kos, i) => {
        const ik = izracunKosa(kos, cenik);
        const mat = cenik.materiali.find((m) => m.id === kos.materialId);
        return (
          <div key={i} className="bg-white rounded-xl p-3 text-sm space-y-1">
            <div className="font-semibold">
              {kos.naziv || `Kos ${i + 1}`}{" "}
              <span className="text-gray-400 font-normal">
                {kos.dolzina}×{kos.sirina} cm{mat ? ` · ${mat.naziv}` : ""}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Material ({ik.povrsina.toFixed(2)} m²)</span>
              <span>{eur(ik.cenaMaterial)}</span>
            </div>
            {ik.cenaRazrez > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Razrez ({kos.razrezTm} tm)</span>
                <span>{eur(ik.cenaRazrez)}</span>
              </div>
            )}
            {ik.cenaBrusenje > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Brušenje ({kos.brusenjeTm} tm)</span>
                <span>{eur(ik.cenaBrusenje)}</span>
              </div>
            )}
            {IZREZI_TIPI.map((t) =>
              n(kos.izrezi?.[t.id]) > 0 ? (
                <div key={t.id} className="flex justify-between text-gray-600">
                  <span>
                    {t.naziv} × {kos.izrezi[t.id]}
                  </span>
                  <span>{eur(n(kos.izrezi[t.id]) * n(cenik.izrezi[t.id]))}</span>
                </div>
              ) : null
            )}
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Skupaj kos</span>
              <span>{eur(ik.skupaj)}</span>
            </div>
          </div>
        );
      })}

      {/* CENA */}
      <div className="bg-black text-white rounded-xl p-3 text-sm space-y-1">
        {nalog.ponudbenaCena != null && (
          <div className="flex justify-between text-gray-400">
            <span>Ponudbena cena</span>
            <span>{eur(nalog.ponudbenaCena)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base">
          <span>Končna cena (z DDV)</span>
          <span>{eur(izr.zDdv)}</span>
        </div>
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
          <div className="text-sm font-semibold">
            Naslednja faza: {naslednji.naziv}
          </div>
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

  const inp =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-right";

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">
        ← Nazaj
      </button>
      <h2 className="font-bold text-lg">Cenik pultov</h2>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Materiali (€/m²)</div>
        {c.materiali.map((m, i) => (
          <div key={m.id} className="flex gap-2 items-center">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={m.naziv}
              onChange={(e) => {
                const materiali = c.materiali.map((x, j) =>
                  j === i ? { ...x, naziv: e.target.value } : x
                );
                setC({ ...c, materiali });
              }}
            />
            <input
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
              inputMode="decimal"
              value={m.cenaM2}
              onChange={(e) => {
                const materiali = c.materiali.map((x, j) =>
                  j === i ? { ...x, cenaM2: e.target.value } : x
                );
                setC({ ...c, materiali });
              }}
            />
            <button
              onClick={() =>
                setC({ ...c, materiali: c.materiali.filter((_, j) => j !== i) })
              }
              className="text-red-600 text-lg px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setC({
              ...c,
              materiali: [
                ...c.materiali,
                { id: "mat" + Date.now(), naziv: "", cenaM2: "" },
              ],
            })
          }
          className="text-sm text-red-600"
        >
          + Dodaj material
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Storitve</div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <span className="text-sm">Razrez (€/tm)</span>
          <input
            className={inp}
            inputMode="decimal"
            value={c.razrezTm}
            onChange={(e) => setC({ ...c, razrezTm: e.target.value })}
          />
          <span className="text-sm">Brušenje (€/tm)</span>
          <input
            className={inp}
            inputMode="decimal"
            value={c.brusenjeTm}
            onChange={(e) => setC({ ...c, brusenjeTm: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Izrezi (€/kpl)</div>
        <div className="grid grid-cols-2 gap-2 items-center">
          {IZREZI_TIPI.map((t) => (
            <FragmentVrstica
              key={t.id}
              naziv={t.naziv}
              vrednost={c.izrezi[t.id]}
              nastavi={(v) => setC({ ...c, izrezi: { ...c.izrezi, [t.id]: v } })}
              inp={inp}
            />
          ))}
        </div>
      </div>

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

function FragmentVrstica({ naziv, vrednost, nastavi, inp }) {
  return (
    <>
      <span className="text-sm">{naziv}</span>
      <input
        className={inp}
        inputMode="decimal"
        value={vrednost}
        onChange={(e) => nastavi(e.target.value)}
      />
    </>
  );
}
