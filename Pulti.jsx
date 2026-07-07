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

// Privzeti cenik — prenešen iz obstoječega Excel cenika ("ROSA BETA" list kot osnova)
const PRIVZETI_CENIK = {
  materiali: [
    { id: "rosa-beta", naziv: "Rosa Beta", tip: "m2", cena2cm: 120, cena3cm: 155 },
    { id: "giandone", naziv: "Giandone", tip: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "bianco-sardo", naziv: "Bianco Sardo", tip: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "azul-tragal", naziv: "Azul Tragal", tip: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "rosa-porino", naziv: "Rosa Porino", tip: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "juporama-columbo", naziv: "Juporama Columbo", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "multicolor", naziv: "Multicolor", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "nero-inpala", naziv: "Nero Inpala", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "wiscont-white", naziv: "Wiscont White", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "tonalit", naziv: "Tonalit", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "steel-gray", naziv: "Steel Gray", tip: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "iwory-brown", naziv: "Iwory Brown", tip: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "siwakashi", naziv: "Siwakashi", tip: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "paradiso", naziv: "Paradiso", tip: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "black-galaxi", naziv: "Black Galaxi", tip: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "jet-black", naziv: "Jet Black", tip: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "nero-soluto", naziv: "Nero Soluto", tip: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "keramika", naziv: "Keramika 1.5cm", tip: "plosca", cenaPlosca: 900 },
  ],
  storitve: [
    { id: "luknja-10-20", naziv: "Luknja fi 10-20mm", enota: "KOM", cena: 12 },
    { id: "luknja-25-35", naziv: "Luknja fi 25-35mm", enota: "KOM", cena: 15 },
    { id: "luknja-40-60", naziv: "Luknja fi 40-60mm", enota: "KOM", cena: 20 },
    { id: "luknja-100-150", naziv: "Luknja fi 100-150mm", enota: "KOM", cena: 30 },
    { id: "luknja-60-85", naziv: "Luknja fi 60-85mm", enota: "KOM", cena: 25 },
    { id: "izrez-nasadno-korito", naziv: "Izrez za nasadno korito", enota: "KOM", cena: 65 },
    { id: "izrez-vticnica-nasadno", naziv: "Izrez za vtičnico nasadno", enota: "KOM", cena: 38 },
    { id: "izrez-steklokeramika-nasadno", naziv: "Izrez za steklokeramiko nasadno", enota: "KOM", cena: 75 },
    { id: "izrez-podpultno-korito-poliran", naziv: "Izrez podpultnega korita s poliranim izrezom", enota: "KOM", cena: 130 },
    { id: "izrez-steklokeramika-inline", naziv: "Izrez steklokeramike inline", enota: "KOM", cena: 250 },
    { id: "pomivalno-korito-inline", naziv: "Pomivalno korito inline", enota: "KOM", cena: 250 },
    { id: "vticnica-inline", naziv: "Vtičnica inline", enota: "KOM", cena: 130 },
    { id: "odcejevalnik-40", naziv: "Izdelava odcejevalnika do dolžine 40cm", enota: "KOM", cena: 390 },
    { id: "poglobljene-odcejevalne-crte", naziv: "Izdelava poglobljenih odcejevalnih črt", enota: "KOM", cena: 230 },
    { id: "armiranje", naziv: "Armiranje pultov", enota: "TM", cena: 35 },
    { id: "izrez-vogala", naziv: "Izrez vogala", enota: "KOM", cena: 30 },
    { id: "impregnacija", naziv: "Impregnacija", enota: "KOS", cena: 25 },
    { id: "montaza-korita", naziv: "Montaža korita", enota: "KOM", cena: 30 },
    { id: "montaza-steklokeramike", naziv: "Montaža steklokeramike", enota: "KOM", cena: 50 },
    { id: "montaza-vticnice", naziv: "Montaža vtičnice", enota: "KOM", cena: 25 },
    { id: "izrez-led-trak", naziv: "Izrez za LED trak", enota: "TM", cena: 15 },
    { id: "rez-45-do-8", naziv: "Rez pod kotom 45° z lepljenjem do 8cm", enota: "TM", cena: 80 },
    { id: "rez-45-do-10", naziv: "Rez pod kotom 45° z lepljenjem do 10cm", enota: "TM", cena: 110 },
    { id: "poliranje-c-rob", naziv: "Poliranje C rob", enota: "TM", cena: 40 },
    { id: "poliranje-klasicno", naziv: "Poliranje klasično", enota: "TM", cena: 10 },
    { id: "dvostransko-poliranje", naziv: "Dvostransko poliranje", enota: "M2", cena: 150 },
    { id: "poliranje-spodnji-rob", naziv: "Poliranje do 5cm spodnjega roba", enota: "TM", cena: 30 },
    { id: "montaza-kuhinje", naziv: "Montaža kuhinje", enota: "KOS", cena: 500 },
    { id: "tezja-montaza-kuhinje", naziv: "Težja montaža kuhinje", enota: "KOS", cena: 700 },
  ],
};

// ===================== IZRAČUNI =====================

function n(x) {
  const v = parseFloat(String(x).replace(",", "."));
  return isNaN(v) ? 0 : v;
}

function najdiMaterial(cenik, materialId) {
  return cenik.materiali.find((m) => m.id === materialId) || null;
}

function skupnaKvadratura(kosi) {
  return (kosi || []).reduce((s, k) => s + (n(k.dolzina) * n(k.sirina)) / 10000, 0);
}

function izracunMateriala(nalog, cenik) {
  const material = najdiMaterial(cenik, nalog.materialId);
  if (!material) return { m2: 0, cena: 0, naziv: "" };
  if (material.tip === "plosca") {
    return { steviloPlosc: n(nalog.steviloPlosc), cena: n(nalog.steviloPlosc) * n(material.cenaPlosca), naziv: material.naziv };
  }
  const m2 = skupnaKvadratura(nalog.kosi);
  const cenaM2 = nalog.debelina === "3" ? material.cena3cm : material.cena2cm;
  return { m2, cena: m2 * n(cenaM2), naziv: material.naziv };
}

function izracunStoritev(nalog, cenik) {
  return cenik.storitve.map((s) => {
    const kolicina = n(nalog.storitve?.[s.id]);
    return { ...s, kolicina, skupaj: kolicina * n(s.cena) };
  });
}

function izracunNaloga(nalog, cenik) {
  const materialRes = izracunMateriala(nalog, cenik);
  const storitveRes = izracunStoritev(nalog, cenik);
  const storitveSkupaj = storitveRes.reduce((s, x) => s + x.skupaj, 0);
  const osnova = materialRes.cena + storitveSkupaj;
  const popust = osnova * (n(nalog.popust) / 100);
  const brezDdv = osnova - popust;
  const ddv = brezDdv * DDV;
  return {
    material: materialRes,
    storitve: storitveRes,
    storitveSkupaj,
    osnova,
    popust,
    brezDdv,
    ddv,
    zDdv: brezDdv + ddv,
  };
}

function eur(x) {
  return (
    (x || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " €"
  );
}

function prazenKos() {
  return { naziv: "", dolzina: "", sirina: "" };
}

function prazenNalog() {
  return {
    id: Date.now(),
    stevilka: "",
    datum: new Date().toISOString().slice(0, 10),
    stranka: { ime: "", telefon: "", naslov: "" },
    sprejel: "",
    status: "ponudba",
    materialId: "",
    debelina: "2",
    steviloPlosc: "",
    kosi: [prazenKos()],
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
        setCenik(c && c.materiali ? c : PRIVZETI_CENIK);
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
  const [odpreteSkupine, setOdpreteSkupine] = useState({});
  const izr = izracunNaloga(nal, cenik);
  const material = najdiMaterial(cenik, nal.materialId);

  function nastaviKos(i, polje, vrednost) {
    const kosi = nal.kosi.map((k, j) => (j === i ? { ...k, [polje]: vrednost } : k));
    setNal({ ...nal, kosi });
  }

  function nastaviStoritev(id, vrednost) {
    setNal({ ...nal, storitve: { ...nal.storitve, [id]: vrednost } });
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";

  // Skupine storitev za pregledno prikazovanje
  const skupine = [
    { naziv: "Luknje", ids: ["luknja-10-20", "luknja-25-35", "luknja-40-60", "luknja-100-150", "luknja-60-85"] },
    { naziv: "Izrezi", ids: ["izrez-nasadno-korito", "izrez-vticnica-nasadno", "izrez-steklokeramika-nasadno", "izrez-podpultno-korito-poliran", "izrez-steklokeramika-inline", "pomivalno-korito-inline", "vticnica-inline", "izrez-vogala", "izrez-led-trak"] },
    { naziv: "Odcejevalniki in armiranje", ids: ["odcejevalnik-40", "poglobljene-odcejevalne-crte", "armiranje"] },
    { naziv: "Rezi in poliranje", ids: ["rez-45-do-8", "rez-45-do-10", "poliranje-c-rob", "poliranje-klasicno", "dvostransko-poliranje", "poliranje-spodnji-rob"] },
    { naziv: "Montaža in ostalo", ids: ["impregnacija", "montaza-korita", "montaza-steklokeramike", "montaza-vticnice", "montaza-kuhinje", "tezja-montaza-kuhinje"] },
  ];

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

      {/* MATERIAL */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Material</div>
        <select
          className={inp}
          value={nal.materialId}
          onChange={(e) => setNal({ ...nal, materialId: e.target.value })}
        >
          <option value="">— izberi material —</option>
          {cenik.materiali.map((m) => (
            <option key={m.id} value={m.id}>
              {m.naziv} {m.tip === "plosca" ? `(${eur(m.cenaPlosca)}/plošča)` : `(${eur(m.cena2cm)}/${eur(m.cena3cm)} m²)`}
            </option>
          ))}
        </select>

        {material && material.tip === "m2" && (
          <div className="grid grid-cols-2 gap-2 items-center">
            <div>
              <label className={lbl}>Debelina</label>
              <select
                className={inp}
                value={nal.debelina}
                onChange={(e) => setNal({ ...nal, debelina: e.target.value })}
              >
                <option value="2">2 cm</option>
                <option value="3">3 cm</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 pt-4">
              Skupna kvadratura: <span className="font-semibold text-black">{skupnaKvadratura(nal.kosi).toFixed(2)} m²</span>
            </div>
          </div>
        )}

        {material && material.tip === "plosca" && (
          <div>
            <label className={lbl}>Število plošč</label>
            <input
              className={inp}
              inputMode="numeric"
              value={nal.steviloPlosc}
              onChange={(e) => setNal({ ...nal, steviloPlosc: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* KOSI (mere, opisno / za razrez) */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Kosi (mere za razrez)</div>
        {nal.kosi.map((kos, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className={`${inp} flex-1`}
              placeholder={`Kos ${i + 1} (npr. Pult ob steni)`}
              value={kos.naziv}
              onChange={(e) => nastaviKos(i, "naziv", e.target.value)}
            />
            <input
              className={`${inp} w-20`}
              placeholder="Dolž."
              inputMode="decimal"
              value={kos.dolzina}
              onChange={(e) => nastaviKos(i, "dolzina", e.target.value)}
            />
            <input
              className={`${inp} w-20`}
              placeholder="Šir."
              inputMode="decimal"
              value={kos.sirina}
              onChange={(e) => nastaviKos(i, "sirina", e.target.value)}
            />
            {nal.kosi.length > 1 && (
              <button
                onClick={() => setNal({ ...nal, kosi: nal.kosi.filter((_, j) => j !== i) })}
                className="text-red-600 text-lg px-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setNal({ ...nal, kosi: [...nal.kosi, prazenKos()] })}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2 text-sm text-gray-500"
        >
          + Dodaj kos
        </button>
      </div>

      {/* STORITVE */}
      <div className="bg-white rounded-xl p-3 space-y-3">
        <div className="font-semibold text-sm">Dodatne storitve</div>
        {skupine.map((skupina) => (
          <div key={skupina.naziv} className="border border-gray-200 rounded-lg">
            <button
              onClick={() =>
                setOdpreteSkupine({ ...odpreteSkupine, [skupina.naziv]: !odpreteSkupine[skupina.naziv] })
              }
              className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium text-gray-700"
            >
              {skupina.naziv}
              <span className="text-gray-400">{odpreteSkupine[skupina.naziv] ? "▲" : "▼"}</span>
            </button>
            {odpreteSkupine[skupina.naziv] && (
              <div className="px-3 pb-3 space-y-2">
                {skupina.ids.map((id) => {
                  const s = cenik.storitve.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="flex-1 text-xs text-gray-600">
                        {s.naziv} <span className="text-gray-400">({eur(s.cena)}/{s.enota})</span>
                      </span>
                      <input
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right"
                        inputMode="decimal"
                        placeholder="0"
                        value={nal.storitve?.[id] || ""}
                        onChange={(e) => nastaviStoritev(id, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
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
          <span>Material {izr.material.naziv && `(${izr.material.naziv})`}</span>
          <span>{eur(izr.material.cena)}</span>
        </div>
        <div className="flex justify-between">
          <span>Storitve</span>
          <span>{eur(izr.storitveSkupaj)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-700 pt-1">
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
  const material = najdiMaterial(cenik, nalog.materialId);
  const storitveZUporabo = izr.storitve.filter((s) => s.kolicina > 0);

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
        {nalog.dxf && <div className="text-xs text-gray-500">DXF: {nalog.dxf}</div>}
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

      {/* MATERIAL */}
      <div className="bg-white rounded-xl p-3 text-sm space-y-1">
        <div className="font-semibold">
          {material ? material.naziv : "Material ni izbran"}
          {material?.tip === "m2" && ` · ${nalog.debelina}cm`}
        </div>
        {material?.tip === "m2" ? (
          <div className="flex justify-between text-gray-600">
            <span>Kvadratura ({skupnaKvadratura(nalog.kosi).toFixed(2)} m²)</span>
            <span>{eur(izr.material.cena)}</span>
          </div>
        ) : material?.tip === "plosca" ? (
          <div className="flex justify-between text-gray-600">
            <span>Število plošč ({nalog.steviloPlosc || 0})</span>
            <span>{eur(izr.material.cena)}</span>
          </div>
        ) : null}
      </div>

      {/* KOSI */}
      {(nalog.kosi || []).some((k) => k.naziv || k.dolzina || k.sirina) && (
        <div className="bg-white rounded-xl p-3 text-sm space-y-1">
          <div className="font-semibold mb-1">Kosi</div>
          {nalog.kosi.map((kos, i) => (
            <div key={i} className="flex justify-between text-gray-600">
              <span>{kos.naziv || `Kos ${i + 1}`}</span>
              <span>{kos.dolzina || "–"} × {kos.sirina || "–"} cm</span>
            </div>
          ))}
        </div>
      )}

      {/* STORITVE */}
      {storitveZUporabo.length > 0 && (
        <div className="bg-white rounded-xl p-3 text-sm space-y-1">
          <div className="font-semibold mb-1">Storitve</div>
          {storitveZUporabo.map((s) => (
            <div key={s.id} className="flex justify-between text-gray-600">
              <span>{s.naziv} × {s.kolicina}</span>
              <span>{eur(s.skupaj)}</span>
            </div>
          ))}
        </div>
      )}

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

      {(nalog.zgodovina || []).length > 0 && (
        <div className="bg-white rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <div className="font-semibold text-gray-700 text-sm mb-1">Zgodovina</div>
          {nalog.zgodovina.map((z, i) => {
            const zs = STATUSI.find((x) => x.id === z.status);
            return (
              <div key={i}>
                {new Date(z.datum).toLocaleDateString("sl-SI")}{" "}
                {new Date(z.datum).toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" })}{" "}
                — {zs ? zs.naziv : z.status}
                {z.kdo && ` (${z.kdo})`}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => uredi(nalog)} className="flex-1 bg-gray-800 text-white rounded-xl py-3 font-semibold">
          Uredi
        </button>
        <button onClick={() => izbrisi(nalog)} className="flex-1 bg-red-100 text-red-600 rounded-xl py-3 font-semibold">
          Izbriši
        </button>
      </div>
    </div>
  );
}

// ===================== CENIK (ADMIN) =====================

function CenikAdmin({ cenik, shrani, nazaj }) {
  const [c, setC] = useState(JSON.parse(JSON.stringify(cenik)));

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-right";

  function posodobiMaterial(i, polje, vrednost) {
    const materiali = c.materiali.map((m, j) => (j === i ? { ...m, [polje]: vrednost } : m));
    setC({ ...c, materiali });
  }

  function posodobiStoritev(i, polje, vrednost) {
    const storitve = c.storitve.map((s, j) => (j === i ? { ...s, [polje]: vrednost } : s));
    setC({ ...c, storitve });
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">
        ← Nazaj
      </button>
      <h2 className="font-bold text-lg">Cenik pultov</h2>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Materiali</div>
        {c.materiali.map((m, i) => (
          <div key={m.id} className="flex gap-2 items-center flex-wrap">
            <input
              className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={m.naziv}
              onChange={(e) => posodobiMaterial(i, "naziv", e.target.value)}
            />
            {m.tip === "plosca" ? (
              <input
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                inputMode="decimal"
                value={m.cenaPlosca}
                placeholder="€/plošča"
                onChange={(e) => posodobiMaterial(i, "cenaPlosca", e.target.value)}
              />
            ) : (
              <>
                <input
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                  inputMode="decimal"
                  value={m.cena2cm}
                  placeholder="€/m² 2cm"
                  onChange={(e) => posodobiMaterial(i, "cena2cm", e.target.value)}
                />
                <input
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                  inputMode="decimal"
                  value={m.cena3cm}
                  placeholder="€/m² 3cm"
                  onChange={(e) => posodobiMaterial(i, "cena3cm", e.target.value)}
                />
              </>
            )}
            <button
              onClick={() => setC({ ...c, materiali: c.materiali.filter((_, j) => j !== i) })}
              className="text-red-600 text-lg px-1"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={() =>
              setC({
                ...c,
                materiali: [...c.materiali, { id: "mat" + Date.now(), naziv: "", tip: "m2", cena2cm: "", cena3cm: "" }],
              })
            }
            className="text-sm text-red-600"
          >
            + Dodaj material (m²)
          </button>
          <button
            onClick={() =>
              setC({
                ...c,
                materiali: [...c.materiali, { id: "mat" + Date.now(), naziv: "", tip: "plosca", cenaPlosca: "" }],
              })
            }
            className="text-sm text-red-600"
          >
            + Dodaj material (plošča)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Storitve</div>
        {c.storitve.map((s, i) => (
          <div key={s.id} className="flex gap-2 items-center">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={s.naziv}
              onChange={(e) => posodobiStoritev(i, "naziv", e.target.value)}
            />
            <select
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm"
              value={s.enota}
              onChange={(e) => posodobiStoritev(i, "enota", e.target.value)}
            >
              <option>KOM</option>
              <option>TM</option>
              <option>M2</option>
              <option>KOS</option>
            </select>
            <input
              className={inp + " w-20"}
              inputMode="decimal"
              value={s.cena}
              onChange={(e) => posodobiStoritev(i, "cena", e.target.value)}
            />
            <button
              onClick={() => setC({ ...c, storitve: c.storitve.filter((_, j) => j !== i) })}
              className="text-red-600 text-lg px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            setC({ ...c, storitve: [...c.storitve, { id: "storitev" + Date.now(), naziv: "", enota: "KOM", cena: "" }] })
          }
          className="text-sm text-red-600"
        >
          + Dodaj storitev
        </button>
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
