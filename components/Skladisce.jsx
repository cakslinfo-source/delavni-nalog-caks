
"use client";

import { useState, useEffect } from "react";

const ADMIN_PIN = "1991";

const PRIVZETE_KATEGORIJE = [
  "Epoxiji",
  "Šajbe",
  "Brusi",
  "Lepila",
  "Premazi",
  "Barvice",
  "Svedri",
  "Rezkarji",
  "Diamantno orodje",
  "Silikon",
  "Vpenjala / sesalne prijemalke",
  "Distančniki / podložke",
  "Kit za popravila",
  "Zaščitna oprema",
  "Čistila",
  "Ostalo",
];

const ENOTE = ["kos", "L", "kg", "paket", "m", "komplet"];

function prazenArtikel() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kategorija: PRIVZETE_KATEGORIJE[0],
    naziv: "",
    kolicina: "",
    enota: "kos",
    opozorilnaKolicina: "",
    opombe: "",
  };
}

function prenesiVarnostnoKopijoSkladisce(artikli) {
  const danes = new Date().toISOString().slice(0, 10);
  const vsebina = JSON.stringify(artikli, null, 2);
  const blob = new Blob([vsebina], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `varnostna-kopija-skladisce-${danes}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function obnoviIzDatotekeSkladisce(event, shraniSeznam) {
  const datoteka = event.target.files && event.target.files[0];
  if (!datoteka) return;
  const bralnik = new FileReader();
  bralnik.onload = async (e) => {
    try {
      const podatki = JSON.parse(e.target.result);
      if (!Array.isArray(podatki)) {
        alert("Datoteka ni veljavna varnostna kopija (pričakovan je seznam artiklov).");
        return;
      }
      const potrdi = window.confirm(
        `Ali res želiš obnoviti podatke iz te datoteke? Vsebuje ${podatki.length} artiklov in bo PREPISALA trenutni seznam. Tega dejanja ni mogoče razveljaviti.`
      );
      if (potrdi) {
        await shraniSeznam(podatki);
        alert("Podatki so bili uspešno obnovljeni.");
      }
    } catch (err) {
      alert("Napaka pri branju datoteke — preveri, da je to prava .json varnostna kopija.");
    }
  };
  bralnik.readAsText(datoteka);
  event.target.value = "";
}

function jeNizkaZaloga(artikel) {
  const k = parseFloat(String(artikel.kolicina).replace(",", "."));
  const o = parseFloat(String(artikel.opozorilnaKolicina).replace(",", "."));
  if (isNaN(k) || isNaN(o)) return false;
  return k <= o;
}

export default function Skladisce() {
  const [artikli, setArtikli] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [zadnjaVerzija, setZadnjaVerzija] = useState(0);
  const [pogled, setPogled] = useState("seznam");
  const [obrazec, setObrazec] = useState(null);
  const [izbranaKategorija, setIzbranaKategorija] = useState("vse");
  const [iskanje, setIskanje] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/skladisce", { cache: "no-store" })
      .then((r) => {
        setZadnjaVerzija(Number(r.headers.get("X-Verzija")) || 0);
        return r.json();
      })
      .then((p) => setArtikli(Array.isArray(p) ? p : []))
      .catch(() => setNapaka("Napaka pri nalaganju podatkov."))
      .finally(() => setNalaganje(false));
  }, []);

  async function shraniSeznam(noviSeznam, pricakovanaVerzija) {
    setArtikli(noviSeznam);
    try {
      const res = await fetch("/api/skladisce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam: noviSeznam, pricakovanaVerzija }),
      });
      const odgovor = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setNapaka("Nekdo drug je medtem spremenil podatke. Stran se je osvežila – preveri in poskusi znova.");
        const svezRes = await fetch("/api/skladisce", { cache: "no-store" });
        const sveziPodatki = await svezRes.json();
        if (Array.isArray(sveziPodatki)) setArtikli(sveziPodatki);
        setZadnjaVerzija(Number(svezRes.headers.get("X-Verzija")) || 0);
        return false;
      } else if (!res.ok) {
        setNapaka(`Shranjevanje ni uspelo (${res.status}). ${odgovor.napaka || ""}`.trim());
        return false;
      } else {
        setNapaka("");
        if (odgovor.verzija !== undefined) setZadnjaVerzija(odgovor.verzija);
        return true;
      }
    } catch (e) {
      setNapaka("Napaka pri shranjevanju. Preveri povezavo.");
      return false;
    }
  }

  async function posodobiArtikle(transformFn) {
    let osnova = artikli;
    let verzija = zadnjaVerzija;
    try {
      const res = await fetch("/api/skladisce", { cache: "no-store" });
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

  const nizkaZaloga = artikli.filter(jeNizkaZaloga);

  const kategorije = [...new Set([...PRIVZETE_KATEGORIJE, ...artikli.map((a) => a.kategorija).filter(Boolean)])];

  const filtrirani = artikli.filter((a) => {
    const ujemaKategorija = izbranaKategorija === "vse" || a.kategorija === izbranaKategorija;
    const ujemaIskanje = (a.naziv || "").toLowerCase().includes(iskanje.toLowerCase());
    return ujemaKategorija && ujemaIskanje;
  });

  if (nalaganje)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
        Nalagam …
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 flex-wrap gap-2">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Skladišče</span>
          </div>
          <div className="text-xs text-gray-400">Zaloga materiala in orodja</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Police</a>
          <a href="/pulti" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Pulti</a>
          <a href="/spomeniki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Spomeniki</a>
          <a href="/sestanki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Sestanki</a>
          <button
            onClick={() => { window.location.href = window.location.pathname + "?osvezeno=" + Date.now(); }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            ⟳ Osveži
          </button>
          <button
            onClick={() => { if (vprasajPin()) setPogled("admin"); }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            🔒 Admin
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
          {nizkaZaloga.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-red-800 uppercase mb-2">⚠️ Zaloga pri koncu — treba naročiti ({nizkaZaloga.length})</p>
              <div className="space-y-1">
                {nizkaZaloga.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-800">{a.naziv} <span className="text-red-500">({a.kategorija})</span></span>
                    <span className="text-red-700 font-semibold">
                      {a.kolicina} {a.enota} <span className="text-red-400">(opozorilo pri {a.opozorilnaKolicina})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-2">
            <input
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
              placeholder="Išči artikel…"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
            <button
              onClick={() => setIzbranaKategorija("vse")}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${
                izbranaKategorija === "vse" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              Vse ({artikli.length})
            </button>
            {kategorije.map((kat) => {
              const stevilo = artikli.filter((a) => a.kategorija === kat).length;
              if (stevilo === 0) return null;
              return (
                <button
                  key={kat}
                  onClick={() => setIzbranaKategorija(kat)}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${
                    izbranaKategorija === kat ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {kat} ({stevilo})
                </button>
              );
            })}
          </div>

          {filtrirani.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              {artikli.length === 0 ? "Skladišče je prazno. Dodaj prvi artikel z gumbom +" : "Ni artiklov, ki bi ustrezali iskanju."}
            </div>
          )}

          <div className="space-y-2">
            {filtrirani.map((a) => {
              const nizka = jeNizkaZaloga(a);
              return (
                <div
                  key={a.id}
                  onClick={() => { setObrazec({ ...a, _urejanje: true }); setPogled("obrazec"); }}
                  className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer border-2 ${nizka ? "border-red-400" : "border-transparent"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{a.naziv}</div>
                      <div className="text-xs text-gray-500">{a.kategorija}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const trenutna = parseFloat(String(a.kolicina).replace(",", ".")) || 0;
                          posodobiArtikle((os) => os.map((x) => (x.id === a.id ? { ...x, kolicina: String(Math.max(0, trenutna - 1)) } : x)));
                        }}
                        className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className={`text-sm font-semibold min-w-[50px] text-center ${nizka ? "text-red-600" : "text-gray-800"}`}>
                        {a.kolicina || 0} {a.enota}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const trenutna = parseFloat(String(a.kolicina).replace(",", ".")) || 0;
                          posodobiArtikle((os) => os.map((x) => (x.id === a.id ? { ...x, kolicina: String(trenutna + 1) } : x)));
                        }}
                        className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {nizka && (
                    <div className="text-xs text-red-600 font-medium mt-1">⚠️ Zaloga pri koncu — naroči</div>
                  )}
                  {a.opombe && <div className="text-xs text-gray-400 mt-1">{a.opombe}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pogled === "obrazec" && obrazec && (
        <div className="p-3 space-y-4">
          <h2 className="font-bold text-lg">{obrazec._urejanje ? "Urejanje artikla" : "Nov artikel"}</h2>
          <div className="bg-white rounded-xl p-3 space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kategorija</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={obrazec.kategorija}
                onChange={(e) => setObrazec({ ...obrazec, kategorija: e.target.value })}
              >
                {kategorije.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Naziv artikla *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={obrazec.naziv}
                onChange={(e) => setObrazec({ ...obrazec, naziv: e.target.value })}
                placeholder="npr. Epoxi lepilo bela 250ml"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Trenutna količina</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  inputMode="decimal"
                  value={obrazec.kolicina}
                  onChange={(e) => setObrazec({ ...obrazec, kolicina: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Enota</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  value={obrazec.enota}
                  onChange={(e) => setObrazec({ ...obrazec, enota: e.target.value })}
                >
                  {ENOTE.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Opozori, ko zaloga pade na (ali pod)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                inputMode="decimal"
                value={obrazec.opozorilnaKolicina}
                onChange={(e) => setObrazec({ ...obrazec, opozorilnaKolicina: e.target.value })}
                placeholder="npr. 3"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Opombe (dobavitelj, šifra ipd.)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                rows={2}
                value={obrazec.opombe}
                onChange={(e) => setObrazec({ ...obrazec, opombe: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setObrazec(null); setPogled("seznam"); }}
              className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold"
            >
              Prekliči
            </button>
            <button
              onClick={async () => {
                if (!obrazec.naziv.trim()) {
                  alert("Vnesi naziv artikla.");
                  return;
                }
                const { _urejanje, ...cist } = obrazec;
                if (_urejanje) {
                  await posodobiArtikle((os) => os.map((x) => (x.id === cist.id ? cist : x)));
                } else {
                  await posodobiArtikle((os) => [cist, ...os]);
                }
                setObrazec(null);
                setPogled("seznam");
              }}
              className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold"
            >
              Shrani
            </button>
          </div>

          {obrazec._urejanje && (
            <button
              onClick={async () => {
                if (!vprasajPin()) return;
                if (!confirm(`Res izbrišem artikel "${obrazec.naziv}"?`)) return;
                await posodobiArtikle((os) => os.filter((x) => x.id !== obrazec.id));
                setObrazec(null);
                setPogled("seznam");
              }}
              className="w-full bg-red-100 text-red-600 rounded-xl py-3 font-semibold"
            >
              Izbriši artikel
            </button>
          )}
        </div>
      )}

      {pogled === "admin" && (
        <div className="p-3 space-y-3">
          <button onClick={() => setPogled("seznam")} className="text-sm text-gray-500">← Nazaj</button>
          <h2 className="font-bold text-lg">Admin — Skladišče</h2>
          <div className="bg-white rounded-xl p-3 space-y-2">
            <div className="font-semibold text-sm">Varnostna kopija artiklov</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => prenesiVarnostnoKopijoSkladisce(artikli)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ⬇ Prenesi kopijo zdaj
              </button>
              <label className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                📄 Obnovi iz datoteke
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => obnoviIzDatotekeSkladisce(e, (podatki) => posodobiArtikle(() => podatki))}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">Priporočamo ročni prenos vsake toliko časa, za vsak slučaj.</p>
          </div>
        </div>
      )}

      {pogled === "seznam" && (
        <button
          onClick={() => { setObrazec(prazenArtikel()); setPogled("obrazec"); }}
          className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center"
        >
          +
        </button>
      )}
    </div>
  );
}
