"use client";

import { useState, useEffect } from "react";

const ADMIN_PIN = "1991";

const ZAPOSLENI_PROIZVODNJA = ["Luka", "Miha", "Rok", "Mersad", "Patrik"];
const ZAPOSLENI_SPREJEM = ["Luka", "Miha", "Jože", "Timea", "Žan", "Žiga"];

const STATUSI = [
  { id: "sprejeto", naziv: "Sprejeto", barva: "bg-gray-500" },
  { id: "izdelavi", naziv: "V izdelavi", barva: "bg-orange-500" },
  { id: "pripravljeno", naziv: "Pripravljeno", barva: "bg-sky-500" },
  { id: "prevzeto", naziv: "Prevzeto", barva: "bg-blue-800" },
];

const TIPI_KOMPONENT = ["Temelji", "Robniki", "Pokrivalne", "Podstavek", "Deska PP", "Napisne", "Slepe", "Deske", "Ostalo"];
const POLIRANJE_MOZNOSTI = ["Levo", "Spredaj", "Zadaj", "Desno"];

function praznaKomponenta() {
  return { id: Date.now() + Math.random(), tip: "Temelji", kolicina: "1", dolzina: "", sirina: "", debelina: "", obdelava: "", poliranje: [] };
}

function prazenSpomenik() {
  return {
    id: Date.now(),
    stevilka: "",
    vrsta: "narocilo",
    datum: new Date().toISOString().slice(0, 10),
    stranka: { ime: "", telefon: "", email: "" },
    lokacija: "",
    montaza: "",
    podiranje: false,
    material: "",
    luckaVaza: "",
    crke: "",
    zarnaNisa: "",
    dodatki: "",
    svecnik: false,
    treger: false,
    cena: "",
    komponente: [praznaKomponenta()],
    sprejel: "",
    status: "sprejeto",
    opombe: "",
    slika: null,
    zgodovina: [],
    placano: "Ne",
  };
}

function eur(x) {
  const v = parseFloat(String(x).replace(",", "."));
  if (isNaN(v)) return "—";
  return v.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function novaStevilka(spomeniki, vrsta) {
  const predpona = vrsta === "ponudba" ? "PO" : "SP";
  const leto = new Date().getFullYear();
  const letos = spomeniki.filter((x) => (x.stevilka || "").includes(`${predpona}-${leto}`)).length;
  return `${predpona}-${leto}-${String(letos + 1).padStart(3, "0")}`;
}

function datotekaVBase64(file) {
  return new Promise((resolve, reject) => {
    const bralnik = new FileReader();
    bralnik.onload = () => resolve({ ime: file.name, tip: file.type, podatki: bralnik.result });
    bralnik.onerror = reject;
    bralnik.readAsDataURL(file);
  });
}

const MAX_DATOTEKA_MB = 4;

async function obravnavajSliko(event, nastavi, kljucPredpona) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > MAX_DATOTEKA_MB * 1024 * 1024) {
    alert(`Datoteka je prevelika (max ${MAX_DATOTEKA_MB} MB).`);
    event.target.value = "";
    return;
  }
  try {
    const rezultat = await datotekaVBase64(file);
    const kljuc = `${kljucPredpona}-${Date.now()}`;
    const res = await fetch("/api/priloge-spomeniki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kljuc, podatki: rezultat }),
    });
    if (!res.ok) {
      alert("Shranjevanje slike ni uspelo (morda je prevelika).");
      event.target.value = "";
      return;
    }
    nastavi({ ime: rezultat.ime, tip: rezultat.tip, kljuc });
  } catch (e) {
    alert("Napaka pri nalaganju slike.");
  }
  event.target.value = "";
}

function SlikaPregled({ referenca }) {
  const [podatkiURL, setPodatkiURL] = useState(null);
  const [nalaga, setNalaga] = useState(true);

  useEffect(() => {
    let odjava = false;
    setNalaga(true);
    fetch(`/api/priloge-spomeniki?kljuc=${encodeURIComponent(referenca.kljuc)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => {
        if (!odjava && p && p.podatki) setPodatkiURL(p.podatki);
      })
      .finally(() => {
        if (!odjava) setNalaga(false);
      });
    return () => { odjava = true; };
  }, [referenca.kljuc]);

  if (nalaga) return <p className="text-xs text-stone-400">Nalagam sliko …</p>;
  if (!podatkiURL) return <p className="text-xs text-stone-400">Slike ni bilo mogoče naložiti.</p>;
  return <img src={podatkiURL} alt={referenca.ime} className="max-h-64 rounded-lg border border-stone-200 mx-auto" />;
}

export default function Spomeniki() {
  const [spomeniki, setSpomeniki] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [pogled, setPogled] = useState("seznam");
  const [filter, setFilter] = useState("vsi");
  const [obrazec, setObrazec] = useState(null);
  const [izbran, setIzbran] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [iskanje, setIskanje] = useState("");
  const [zadnjaVerzija, setZadnjaVerzija] = useState(0);
  const [shranjujem, setShranjujem] = useState(false);
  const [potrditevShranjeno, setPotrditevShranjeno] = useState(false);

  useEffect(() => {
    fetch("/api/spomeniki", { cache: "no-store" })
      .then((r) => {
        setZadnjaVerzija(Number(r.headers.get("X-Verzija")) || 0);
        return r.json();
      })
      .then((p) => setSpomeniki(Array.isArray(p) ? p : []))
      .catch(() => setNapaka("Napaka pri nalaganju podatkov."))
      .finally(() => setNalaganje(false));
  }, []);

  useEffect(() => {
    function opozoriPredOdhodom(e) {
      if (pogled === "obrazec") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    }
    window.addEventListener("beforeunload", opozoriPredOdhodom);
    return () => window.removeEventListener("beforeunload", opozoriPredOdhodom);
  }, [pogled]);

  async function shraniSeznam(noviSeznam, pricakovanaVerzija) {
    setSpomeniki(noviSeznam);
    setShranjujem(true);
    let uspeh = false;
    try {
      const res = await fetch("/api/spomeniki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam: noviSeznam, pricakovanaVerzija }),
      });
      const odgovor = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setNapaka(
          odgovor.zastarelaAplikacija
            ? "Aplikacija na tej napravi je zastarela. Osveži stran in poskusi znova."
            : "Nekdo drug je medtem spremenil podatke. Stran se je osvežila – preveri in poskusi znova."
        );
        try {
          const svezRes = await fetch("/api/spomeniki", { cache: "no-store" });
          const sveziPodatki = await svezRes.json();
          if (Array.isArray(sveziPodatki)) setSpomeniki(sveziPodatki);
          setZadnjaVerzija(Number(svezRes.headers.get("X-Verzija")) || 0);
        } catch (e2) {}
      } else if (!res.ok) {
        setNapaka(`Shranjevanje ni uspelo (${res.status}). ${odgovor.napaka || ""}`.trim());
      } else {
        setNapaka("");
        if (odgovor.verzija !== undefined) setZadnjaVerzija(odgovor.verzija);
        uspeh = true;
      }
    } catch (e) {
      setNapaka("Napaka pri shranjevanju. Preveri povezavo.");
    } finally {
      setShranjujem(false);
    }
    return uspeh;
  }

  async function posodobiSpomenike(transformFn) {
    let osnova = spomeniki;
    let verzija = zadnjaVerzija;
    try {
      const res = await fetch("/api/spomeniki", { cache: "no-store" });
      const sveze = await res.json();
      verzija = Number(res.headers.get("X-Verzija")) || 0;
      if (Array.isArray(sveze)) osnova = sveze;
    } catch (e) {}
    const novi = transformFn(osnova);
    return await shraniSeznam(novi, verzija);
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

  const filtrirani = spomeniki.filter((n) => {
    const ujemaFilter = filter === "vsi" || n.status === filter;
    const iskalniNiz = `${n.stranka?.ime || ""} ${n.lokacija || ""} ${n.stevilka || ""}`.toLowerCase();
    return ujemaFilter && iskalniNiz.includes(iskanje.toLowerCase());
  });

  if (nalaganje)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
        Nalagam ...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Spomeniki</span>
          </div>
          <div className="text-xs text-gray-400">Naročila za spomenike</div>
        </div>
        <div className="flex gap-2">
          <a href="/" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Police</a>
          <a href="/sestanki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Sestanki</a>
          <button
            onClick={() => { window.location.href = window.location.pathname + "?osvezeno=" + Date.now(); }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            ⟳ Osveži
          </button>
        </div>
      </div>

      {napaka && (
        <div className="bg-red-600 text-white text-sm px-4 py-2 cursor-pointer" onClick={() => setNapaka("")}>
          {napaka} (tapni za zapiranje)
        </div>
      )}

      {pogled === "seznam" && (
        <div className="p-3">
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {STATUSI.map((s) => {
              const st = spomeniki.filter((x) => x.status === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setFilter(filter === s.id ? "vsi" : s.id)}
                  className={`rounded-lg p-2 text-center text-white ${s.barva} ${filter === s.id ? "ring-2 ring-black" : ""}`}
                >
                  <div className="text-lg font-bold leading-none">{st}</div>
                  <div className="text-[9px] leading-tight mt-1">{s.naziv}</div>
                </button>
              );
            })}
          </div>
          {filter !== "vsi" && (
            <button onClick={() => setFilter("vsi")} className="text-xs text-red-600 mb-2 underline">
              Prikaži vse
            </button>
          )}
          <input
            value={iskanje}
            onChange={(e) => setIskanje(e.target.value)}
            placeholder="Išči po stranki, lokaciji, številki…"
            className="w-full px-3 py-2.5 mb-3 rounded-lg border border-gray-300 bg-white text-sm"
          />
          {filtrirani.length === 0 ? (
            <div className="text-center text-gray-400 py-12">Ni nalogov. Dodaj prvega z gumbom +</div>
          ) : (
            <div className="space-y-2">
              {filtrirani.map((n) => {
                const s = STATUSI.find((x) => x.id === n.status) || STATUSI[0];
                return (
                  <div
                    key={n.id}
                    onClick={() => { setIzbran(n.id); setPogled("podrobnosti"); }}
                    className="bg-white rounded-xl p-3 shadow-sm cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{n.stevilka}</div>
                        <div className="text-sm text-gray-600">{n.stranka?.ime}</div>
                        {n.lokacija && <div className="text-xs text-gray-400">{n.lokacija}</div>}
                      </div>
                      <span className={`text-white text-xs px-2 py-1 rounded-full ${n.vrsta === "ponudba" ? "bg-blue-600" : s.barva}`}>
                        {n.vrsta === "ponudba" ? "Ponudba" : s.naziv}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-2 text-sm">
                      <span className="text-gray-400">{n.montaza ? `Montaža: ${new Date(n.montaza).toLocaleDateString("sl-SI")}` : n.datum}</span>
                      <span className="font-semibold">
                        {eur(n.cena)}
                        {n.placano === "Da" && <span className="text-green-600 ml-1">✓</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {pogled === "obrazec" && (
        <Obrazec
          zacetni={obrazec}
          preklici={() => setPogled(obrazec && obrazec._urejanje ? "podrobnosti" : "seznam")}
          shranjujem={shranjujem}
          shrani={async (nal) => {
            let novId = null;
            let uspeh;
            if (nal._urejanje) {
              const { _urejanje, ...cist } = nal;
              uspeh = await posodobiSpomenike((os) => os.map((x) => (x.id === nal.id ? cist : x)));
              novId = nal.id;
            } else {
              uspeh = await posodobiSpomenike((os) => {
                const nov = {
                  ...nal,
                  stevilka: novaStevilka(os, nal.vrsta),
                  zgodovina: [{ status: nal.status, datum: new Date().toISOString(), kdo: nal.sprejel || "" }],
                };
                novId = nov.id;
                return [nov, ...os];
              });
            }
            setIzbran(novId);
            setPogled("podrobnosti");
            if (uspeh) {
              setPotrditevShranjeno(true);
              setTimeout(() => setPotrditevShranjeno(false), 3000);
            }
          }}
        />
      )}

      {pogled === "podrobnosti" && (
        <Podrobnosti
          nalog={spomeniki.find((x) => x.id === izbran)}
          potrditevShranjeno={potrditevShranjeno}
          nazaj={() => setPogled("seznam")}
          uredi={(nal) => { setObrazec({ ...nal, _urejanje: true }); setPogled("obrazec"); }}
          spremeniStatus={(nal, novStatus, kdo) => {
            posodobiSpomenike((os) =>
              os.map((x) =>
                x.id === nal.id
                  ? { ...x, status: novStatus, zgodovina: [...(x.zgodovina || []), { status: novStatus, datum: new Date().toISOString(), kdo: kdo || "" }] }
                  : x
              )
            );
          }}
          preklopiPlacano={(nal) => {
            posodobiSpomenike((os) => os.map((x) => (x.id === nal.id ? { ...x, placano: x.placano === "Da" ? "Ne" : "Da" } : x)));
          }}
          izbrisi={(nal) => {
            if (!vprasajPin()) return;
            if (!confirm(`Res izbrišem nalog ${nal.stevilka}?`)) return;
            posodobiSpomenike((os) => os.filter((x) => x.id !== nal.id));
            setPogled("seznam");
          }}
          natisni={(nal) => { setIzbran(nal.id); setPogled("tiskanje"); }}
          pretvoriVNarocilo={(nal) => {
            if (!confirm(`Ponudbo ${nal.stevilka} pretvorim v pravo naročilo? Dobi novo številko.`)) return;
            posodobiSpomenike((os) => {
              const novaStev = novaStevilka(os, "narocilo");
              return os.map((x) =>
                x.id === nal.id
                  ? {
                      ...x,
                      vrsta: "narocilo",
                      stevilka: novaStev,
                      status: "sprejeto",
                      zgodovina: [...(x.zgodovina || []), { status: "sprejeto", datum: new Date().toISOString(), kdo: "" }],
                    }
                  : x
              );
            });
          }}
        />
      )}

      {pogled === "tiskanje" && (
        <TiskDelovniList
          nalog={spomeniki.find((x) => x.id === izbran)}
          nazaj={() => setPogled("podrobnosti")}
        />
      )}

      {pogled === "seznam" && (
        <button
          onClick={() => { setObrazec(prazenSpomenik()); setPogled("obrazec"); }}
          className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center"
        >
          +
        </button>
      )}
    </div>
  );
}

function DaNeGumb({ vrednost, onChange, label }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 text-sm py-2 rounded-lg border ${vrednost ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-300"}`}
        >
          DA
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 text-sm py-2 rounded-lg border ${!vrednost ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-600 border-gray-300"}`}
        >
          NE
        </button>
      </div>
    </div>
  );
}

function Obrazec({ zacetni, shrani, preklici, shranjujem }) {
  const [nal, setNal] = useState(zacetni);
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";

  function nastaviKomponento(i, polje, vrednost) {
    const komponente = nal.komponente.map((k, j) => (j === i ? { ...k, [polje]: vrednost } : k));
    setNal({ ...nal, komponente });
  }

  function preklopiPoliranje(i, stran) {
    const k = nal.komponente[i];
    const nova = k.poliranje.includes(stran) ? k.poliranje.filter((p) => p !== stran) : [...k.poliranje, stran];
    nastaviKomponento(i, "poliranje", nova);
  }

  return (
    <div className="p-3 space-y-4">
      <h2 className="font-bold text-lg">{nal._urejanje ? `Urejanje ${nal.stevilka}` : "Nov vnos — spomenik"}</h2>

      {!nal._urejanje && (
        <div className="bg-white rounded-xl p-3">
          <label className="text-xs text-gray-500 mb-1 block">Vrsta vnosa</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNal({ ...nal, vrsta: "ponudba" })}
              className={`flex-1 text-sm py-2 rounded-lg border ${nal.vrsta === "ponudba" ? "bg-blue-600 text-white border-blue-600 font-medium" : "bg-white text-gray-600 border-gray-300"}`}
            >
              Ponudba
            </button>
            <button
              type="button"
              onClick={() => setNal({ ...nal, vrsta: "narocilo" })}
              className={`flex-1 text-sm py-2 rounded-lg border ${nal.vrsta === "narocilo" ? "bg-red-600 text-white border-red-600 font-medium" : "bg-white text-gray-600 border-gray-300"}`}
            >
              Naročilo
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Stranka</div>
        <div>
          <label className={lbl}>Ime in priimek *</label>
          <input className={inp} value={nal.stranka.ime} onChange={(e) => setNal({ ...nal, stranka: { ...nal.stranka, ime: e.target.value } })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Telefon</label>
            <input className={inp} value={nal.stranka.telefon} onChange={(e) => setNal({ ...nal, stranka: { ...nal.stranka, telefon: e.target.value } })} />
          </div>
          <div>
            <label className={lbl}>E-mail</label>
            <input type="email" className={inp} value={nal.stranka.email} onChange={(e) => setNal({ ...nal, stranka: { ...nal.stranka, email: e.target.value } })} />
          </div>
        </div>
        <div>
          <label className={lbl}>Lokacija (pokopališče)</label>
          <input className={inp} value={nal.lokacija} onChange={(e) => setNal({ ...nal, lokacija: e.target.value })} placeholder="npr. Pokopališče Slovenske Konjice, vrsta 4, št. 12" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Sprejel</label>
            <select className={inp} value={nal.sprejel} onChange={(e) => setNal({ ...nal, sprejel: e.target.value })}>
              <option value="">— izberi —</option>
              {ZAPOSLENI_SPREJEM.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Datum sprejema</label>
            <input type="date" className={inp} value={nal.datum} onChange={(e) => setNal({ ...nal, datum: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-3">
        <div className="font-semibold text-sm">Osnovni podatki</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Material</label>
            <input className={inp} value={nal.material} onChange={(e) => setNal({ ...nal, material: e.target.value })} placeholder="npr. Črni granit" />
          </div>
          <div>
            <label className={lbl}>Montaža (datum)</label>
            <input type="date" className={inp} value={nal.montaza} onChange={(e) => setNal({ ...nal, montaza: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Lučka / vaza</label>
            <input className={inp} value={nal.luckaVaza} onChange={(e) => setNal({ ...nal, luckaVaza: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Žarna niša</label>
            <input className={inp} value={nal.zarnaNisa} onChange={(e) => setNal({ ...nal, zarnaNisa: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={lbl}>Črke</label>
          <div className="flex gap-2">
            {["", "Zlate", "Srebrne"].map((c) => (
              <button
                key={c || "ni"}
                type="button"
                onClick={() => setNal({ ...nal, crke: c })}
                className={`flex-1 text-sm py-2 rounded-lg border ${nal.crke === c ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-300"}`}
              >
                {c || "Ni izbrano"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DaNeGumb label="Podiranje starega spomenika" vrednost={nal.podiranje} onChange={(v) => setNal({ ...nal, podiranje: v })} />
          <DaNeGumb label="Svečnik" vrednost={nal.svecnik} onChange={(v) => setNal({ ...nal, svecnik: v })} />
          <DaNeGumb label="Treger" vrednost={nal.treger} onChange={(v) => setNal({ ...nal, treger: v })} />
        </div>
        <div>
          <label className={lbl}>Dodatki / opombe k naročilu</label>
          <textarea className={inp} rows={2} value={nal.dodatki} onChange={(e) => setNal({ ...nal, dodatki: e.target.value })} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-3">
        <div className="font-semibold text-sm">Kosi (mere in obdelava za vsak kos posebej)</div>
        {nal.komponente.map((k, i) => {
          const zaporedjeVTipu = nal.komponente.slice(0, i + 1).filter((x) => x.tip === k.tip).length;
          return (
          <div key={k.id} className="border border-gray-200 rounded-lg p-2.5 space-y-2">
            <div className="text-xs font-semibold text-red-600 uppercase">
              {k.tip} {zaporedjeVTipu > 1 || nal.komponente.filter((x) => x.tip === k.tip).length > 1 ? `#${zaporedjeVTipu}` : ""}
            </div>
            <div className="flex items-center gap-2">
              <select
                className={`${inp} flex-1`}
                value={k.tip}
                onChange={(e) => nastaviKomponento(i, "tip", e.target.value)}
              >
                {TIPI_KOMPONENT.map((t) => <option key={t}>{t}</option>)}
              </select>
              {nal.komponente.length > 1 && (
                <button
                  onClick={() => setNal({ ...nal, komponente: nal.komponente.filter((_, j) => j !== i) })}
                  className="text-red-600 text-lg px-1"
                >
                  ×
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className={lbl}>Količina (kos)</label>
                <input className={inp} inputMode="numeric" value={k.kolicina} onChange={(e) => nastaviKomponento(i, "kolicina", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Dolžina (cm)</label>
                <input className={inp} inputMode="decimal" value={k.dolzina} onChange={(e) => nastaviKomponento(i, "dolzina", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Širina (cm)</label>
                <input className={inp} inputMode="decimal" value={k.sirina} onChange={(e) => nastaviKomponento(i, "sirina", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Deb. (cm)</label>
                <input className={inp} inputMode="decimal" value={k.debelina} onChange={(e) => nastaviKomponento(i, "debelina", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lbl}>Obdelava</label>
              <input className={inp} value={k.obdelava} onChange={(e) => nastaviKomponento(i, "obdelava", e.target.value)} placeholder="npr. poliran rob" />
            </div>
            <div>
              <label className={lbl}>Poliranje</label>
              <div className="flex flex-wrap gap-1.5">
                {POLIRANJE_MOZNOSTI.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => preklopiPoliranje(i, p)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      k.poliranje.includes(p) ? "bg-red-600 text-white border-red-600 font-medium" : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          );
        })}
        <button
          onClick={() => setNal({ ...nal, komponente: [...nal.komponente, praznaKomponenta()] })}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2 text-sm text-gray-500"
        >
          + Dodaj kos
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div>
          <label className={lbl}>Cena (€)</label>
          <input className={inp} inputMode="decimal" value={nal.cena} onChange={(e) => setNal({ ...nal, cena: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Slika / skica</label>
          {nal.slika ? (
            <div className="bg-gray-100 rounded-lg p-2">
              <SlikaPregled referenca={nal.slika} />
              <button type="button" onClick={() => setNal({ ...nal, slika: null })} className="text-red-600 text-xs mt-2 block mx-auto">
                Odstrani sliko
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => obravnavajSliko(e, (rez) => setNal({ ...nal, slika: rez }), `spomenik-${nal.id}`)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-200 file:text-gray-700 file:text-sm"
            />
          )}
        </div>
        <div>
          <label className={lbl}>Opombe</label>
          <textarea className={inp} rows={2} value={nal.opombe} onChange={(e) => setNal({ ...nal, opombe: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={preklici} className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold">Prekliči</button>
        <button
          disabled={shranjujem}
          onClick={() => {
            if (!nal.stranka.ime.trim()) { alert("Vnesi ime stranke."); return; }
            shrani(nal);
          }}
          className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {shranjujem ? "Shranjujem …" : "Shrani nalog"}
        </button>
      </div>
    </div>
  );
}

function izvoziDonatoniCSVSpomenik(nalog) {
  const komponente = (nalog.komponente || []).filter((k) => k.dolzina || k.sirina || k.debelina);
  const glave = ["Numero", "Larghezza", "Altezza", "Nome", "Spessore"];
  const ubezi = (val) => {
    const s = String(val ?? "");
    if (s.includes(";") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const prveTriCrkeStranke = (nalog.stranka?.ime || "").trim().slice(0, 3).toUpperCase();
  const stTipa = {};
  const vrstice = komponente.map((k) => {
    stTipa[k.tip] = (stTipa[k.tip] || 0) + 1;
    const zaporedje = stTipa[k.tip];
    const mm = (v) => {
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? "" : n * 10;
    };
    const skupnoPoTipu = komponente.filter((x) => x.tip === k.tip).length;
    const imeKosa = `${k.tip}${skupnoPoTipu > 1 ? ` ${zaporedje}` : ""}`;
    const dolzinaMM = mm(k.dolzina);
    const sirinaMM = mm(k.sirina);
    return [
      k.kolicina || "1",
      dolzinaMM,
      sirinaMM,
      `${prveTriCrkeStranke} ${imeKosa} ${dolzinaMM}x${sirinaMM}`,
      mm(k.debelina),
    ];
  });
  const csv = [glave, ...vrstice].map((r) => r.map(ubezi).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const strankaVarno = (nalog.stranka?.ime || "").replace(/[\\/:*?"<>|]/g, "").trim();
  a.download = `csv donatoni ${nalog.stevilka || "spomenik"}${strankaVarno ? " " + strankaVarno : ""}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function prenesiHTMLDokumentSpomenik(selector, naslov, imeDatoteke) {
  const el = document.querySelector(selector);
  if (!el) {
    alert("Ni bilo mogoče najti vsebine za izpis.");
    return;
  }
  const html =
    "<!DOCTYPE html><html lang=\"sl\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<title>" + naslov + "</title>" +
    "<script src=\"https://cdn.tailwindcss.com\"></script>" +
    "<style>body{font-family:system-ui,sans-serif;background:#f5f5f4;margin:0;padding:24px;}" +
    ".navodilo{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;max-width:800px;margin-left:auto;margin-right:auto;}" +
    ".ovoj{max-width:800px;margin:0 auto;}" +
    "@media print { .navodilo{ display:none !important; } body{ background:#fff !important; padding:0 !important; } .ovoj{ max-width:100% !important; } }" +
    "</style></head><body>" +
    "<div class=\"navodilo\">To je prenesena datoteka za tiskanje. Uporabi Ctrl+P (Cmd+P na Mac) ali meni brskalnika &rarr; Natisni / Shrani kot PDF.</div>" +
    "<div class=\"ovoj\">" + el.outerHTML + "</div>" +
    "</body></html>";
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = imeDatoteke;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function TiskDelovniList({ nalog, nazaj }) {
  if (!nalog) return <div className="p-4">Nalog ne obstaja. <button onClick={nazaj} className="text-red-600 underline">Nazaj</button></div>;

  const komponenteZaPrikaz = (nalog.komponente || []).filter((k) => k.dolzina || k.sirina || k.debelina || k.obdelava);
  const stTipa = {};
  const oznacene = komponenteZaPrikaz.map((k) => {
    stTipa[k.tip] = (stTipa[k.tip] || 0) + 1;
    return { ...k, zaporedje: stTipa[k.tip] };
  });
  const skupnoPoTipu = {};
  komponenteZaPrikaz.forEach((k) => { skupnoPoTipu[k.tip] = (skupnoPoTipu[k.tip] || 0) + 1; });

  return (
    <div className="p-3 space-y-3">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .spomenik-list, .spomenik-list * { visibility: visible; }
          .spomenik-list { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .spomenik-brez-tiska { display: none !important; }
        }
      `}</style>

      <div className="spomenik-brez-tiska flex flex-wrap gap-2">
        <button
          onClick={() => prenesiHTMLDokumentSpomenik(".spomenik-list", `Delovni list ${nalog.stevilka || ""}`, `delovni-list-${nalog.stevilka || "spomenik"}${nalog.stranka?.ime ? " " + nalog.stranka.ime : ""}.html`)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          Prenesi / natisni datoteko
        </button>
        <button onClick={nazaj} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100">
          Nazaj
        </button>
      </div>

      <div className="spomenik-list bg-white rounded-xl p-4 sm:p-6 border border-gray-200 text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <div className="font-bold text-lg">ČAKŠ <span className="text-red-600">· Spomenik</span></div>
          <div className="text-sm uppercase font-semibold text-gray-600">Delovni list</div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-gray-200 pb-2 mb-2">
          <div><span className="text-xs text-gray-400 uppercase mr-1">Stranka:</span><span className="font-semibold">{nalog.stranka?.ime}</span></div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Lokacija:</span>{nalog.lokacija || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Montaža:</span>{nalog.montaza ? new Date(nalog.montaza).toLocaleDateString("sl-SI") : "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Podiranje:</span>{nalog.podiranje ? "DA" : "NE"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Material:</span>{nalog.material || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Lučka/vaza:</span>{nalog.luckaVaza || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Črke:</span>{nalog.crke || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Žarna niša:</span>{nalog.zarnaNisa || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Dodatki:</span>{nalog.dodatki || "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Svečnik:</span>{nalog.svecnik ? "DA" : "NE"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Treger:</span>{nalog.treger ? "DA" : "NE"}</div>
        </div>

        {oznacene.length > 0 && (
          <table className="w-full border-collapse mt-2">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b-2 border-gray-300">
                <th className="py-1 pr-2">Kos</th>
                <th className="py-1 pr-2">Kol.</th>
                <th className="py-1 pr-2">Dolžina</th>
                <th className="py-1 pr-2">Širina</th>
                <th className="py-1 pr-2">Deb.</th>
                <th className="py-1 pr-2">Obdelava</th>
                <th className="py-1 pr-2">Poliranje</th>
              </tr>
            </thead>
            <tbody>
              {oznacene.map((k) => (
                <tr key={k.id} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 font-medium">{k.tip}{skupnoPoTipu[k.tip] > 1 ? ` #${k.zaporedje}` : ""}</td>
                  <td className="py-1.5 pr-2">{k.kolicina || "1"}</td>
                  <td className="py-1.5 pr-2">{k.dolzina || "–"}</td>
                  <td className="py-1.5 pr-2">{k.sirina || "–"}</td>
                  <td className="py-1.5 pr-2">{k.debelina || "–"}</td>
                  <td className="py-1.5 pr-2">{k.obdelava || "–"}</td>
                  <td className="py-1.5 pr-2 text-xs text-gray-500">{k.poliranje?.join(", ") || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {nalog.opombe && (
          <p className="mt-3 pt-2 border-t border-gray-200"><span className="text-xs text-gray-400 uppercase mr-1">Opombe:</span>{nalog.opombe}</p>
        )}

        <p className="text-xs text-gray-500 mt-4 pt-2 border-t border-gray-200">
          Kamnoseštvo Čakš · 031 235 146
        </p>
      </div>
    </div>
  );
}

function Podrobnosti({ nalog, potrditevShranjeno, nazaj, uredi, spremeniStatus, preklopiPlacano, izbrisi, natisni, pretvoriVNarocilo }) {
  const [kdoOpravil, setKdoOpravil] = useState("");
  if (!nalog)
    return (
      <div className="p-4">
        Nalog ne obstaja. <button onClick={nazaj} className="text-red-600 underline">Nazaj</button>
      </div>
    );

  const s = STATUSI.find((x) => x.id === nalog.status) || STATUSI[0];
  const idx = STATUSI.findIndex((x) => x.id === nalog.status);
  const naslednji = idx < STATUSI.length - 1 ? STATUSI[idx + 1] : null;
  const komponenteZaPrikaz = (nalog.komponente || []).filter((k) => k.dolzina || k.sirina || k.debelina || k.obdelava);

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">← Nazaj na seznam</button>

      {potrditevShranjeno && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg px-4 py-2.5">
          ✓ Shranjeno na strežnik.
        </div>
      )}

      {nalog.vrsta === "ponudba" && (
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 space-y-2">
          <div className="text-sm text-blue-800 font-medium">To je ponudba, še ni pravo naročilo.</div>
          <button
            onClick={() => pretvoriVNarocilo(nalog)}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold"
          >
            Pretvori v naročilo
          </button>
        </div>
      )}

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
          {nalog.stranka?.email && <div className="text-gray-600">{nalog.stranka.email}</div>}
          {nalog.lokacija && <div className="text-gray-600 mt-1">📍 {nalog.lokacija}</div>}
        </div>
        {nalog.sprejel && <div className="text-xs text-gray-500">Sprejel: {nalog.sprejel}</div>}
      </div>

      <div className="bg-white rounded-xl p-3 text-sm space-y-1">
        <div className="font-semibold mb-1">Podatki</div>
        {nalog.material && <div><span className="text-gray-400">Material: </span>{nalog.material}</div>}
        {nalog.montaza && <div><span className="text-gray-400">Montaža: </span><span className="font-semibold text-red-600">{new Date(nalog.montaza).toLocaleDateString("sl-SI")}</span></div>}
        {nalog.luckaVaza && <div><span className="text-gray-400">Lučka/vaza: </span>{nalog.luckaVaza}</div>}
        {nalog.crke && <div><span className="text-gray-400">Črke: </span>{nalog.crke}</div>}
        {nalog.zarnaNisa && <div><span className="text-gray-400">Žarna niša: </span>{nalog.zarnaNisa}</div>}
        <div className="flex gap-4 pt-1">
          <span className={nalog.podiranje ? "text-red-600 font-medium" : "text-gray-400"}>Podiranje: {nalog.podiranje ? "DA" : "NE"}</span>
          <span className={nalog.svecnik ? "text-red-600 font-medium" : "text-gray-400"}>Svečnik: {nalog.svecnik ? "DA" : "NE"}</span>
          <span className={nalog.treger ? "text-red-600 font-medium" : "text-gray-400"}>Treger: {nalog.treger ? "DA" : "NE"}</span>
        </div>
        {nalog.dodatki && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">{nalog.dodatki}</div>
        )}
      </div>

      {komponenteZaPrikaz.length > 0 && (
        <div className="bg-white rounded-xl p-3 text-sm space-y-2">
          <div className="font-semibold mb-1">Kosi</div>
          {komponenteZaPrikaz.map((k) => (
            <div key={k.id} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
              <div className="font-medium">{k.tip} {k.kolicina && k.kolicina !== "1" ? `× ${k.kolicina}` : ""}</div>
              <div className="text-gray-600">
                {k.dolzina || "–"} × {k.sirina || "–"} × {k.debelina || "–"} cm
                {k.obdelava && ` · ${k.obdelava}`}
              </div>
              {k.poliranje?.length > 0 && <div className="text-xs text-gray-400">Poliranje: {k.poliranje.join(", ")}</div>}
            </div>
          ))}
        </div>
      )}

      {nalog.slika && (
        <div className="bg-white rounded-xl p-3">
          <div className="font-semibold text-sm mb-2">Slika / skica</div>
          <SlikaPregled referenca={nalog.slika} />
        </div>
      )}

      {nalog.opombe && (
        <div className="bg-white rounded-xl p-3 text-sm bg-yellow-50 border border-yellow-200">{nalog.opombe}</div>
      )}

      <div className="bg-black text-white rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between font-bold text-base">
          <span>Cena</span>
          <span>{eur(nalog.cena)}</span>
        </div>
        <button
          onClick={() => preklopiPlacano(nalog)}
          className={`w-full mt-2 rounded-lg py-2 text-sm font-semibold ${nalog.placano === "Da" ? "bg-green-600" : "bg-gray-700"}`}
        >
          {nalog.placano === "Da" ? "✓ Plačano" : "Označi kot plačano"}
        </button>
      </div>

      {naslednji && nalog.vrsta !== "ponudba" && (
        <div className="bg-white rounded-xl p-3 space-y-2">
          <div className="text-sm font-semibold">Naslednja faza: {naslednji.naziv}</div>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={kdoOpravil} onChange={(e) => setKdoOpravil(e.target.value)}>
            <option value="">Kdo opravi? (neobvezno)</option>
            {ZAPOSLENI_PROIZVODNJA.map((z) => <option key={z}>{z}</option>)}
          </select>
          <button
            onClick={() => { spremeniStatus(nalog, naslednji.id, kdoOpravil); setKdoOpravil(""); }}
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

      <button onClick={() => natisni(nalog)} className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold">
        🖨 Natisni delovni list
      </button>

      <button onClick={() => izvoziDonatoniCSVSpomenik(nalog)} className="w-full bg-stone-700 text-white rounded-xl py-3 font-semibold">
        ⬇ CSV Donatoni
      </button>

      <div className="flex gap-2">
        <button onClick={() => uredi(nalog)} className="flex-1 bg-gray-800 text-white rounded-xl py-3 font-semibold">Uredi</button>
        <button onClick={() => izbrisi(nalog)} className="flex-1 bg-red-100 text-red-600 rounded-xl py-3 font-semibold">Izbriši</button>
      </div>
    </div>
  );
}
