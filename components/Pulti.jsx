"use client";

import { useState, useEffect, useRef } from "react";

// ===================== NASTAVITVE =====================

const ADMIN_PIN = "1991";

const ZAPOSLENI_PROIZVODNJA = ["Luka", "Miha", "Rok", "Mersad", "Patrik"];
const ZAPOSLENI_SPREJEM = ["Luka", "Miha", "Jože", "Timea", "Žan", "Žiga"];

const STATUSI = [
  { id: "sprejeto", naziv: "Sprejeto", barva: "bg-gray-500" },
  { id: "izdelavi", naziv: "V izdelavi", barva: "bg-orange-500" },
  { id: "pripravljeno", naziv: "Pripravljeno", barva: "bg-sky-500" },
  { id: "prevzeto", naziv: "Prevzeto", barva: "bg-blue-800" },
];

// Preslikava starih statusov (pred poenotenjem s Policami) v nove.
function normalizirajStatusPulti(status) {
  if (["sprejeto", "izdelavi", "pripravljeno", "prevzeto"].includes(status)) return status;
  if (["ponudba", "izmera", "cad"].includes(status)) return "sprejeto";
  if (["razrez", "izrezi", "brusenje"].includes(status)) return "izdelavi";
  if (status === "montaza") return "pripravljeno";
  if (status === "zakljuceno") return "prevzeto";
  return "sprejeto";
}

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
  if (!material) return { m2: 0, cena: 0, naziv: "", m2_2cm: 0, cena_2cm: 0, m2_3cm: 0, cena_3cm: 0 };
  if (material.tip === "plosca") {
    return {
      steviloPlosc: n(nalog.steviloPlosc),
      cena: n(nalog.steviloPlosc) * n(material.cenaPlosca),
      naziv: material.naziv,
      m2_2cm: 0,
      cena_2cm: 0,
      m2_3cm: 0,
      cena_3cm: 0,
    };
  }
  let m2_2cm = 0;
  let m2_3cm = 0;
  let cenaPoKosih = 0;
  (nalog.kosi || []).forEach((k) => {
    if (k.nacinCene === "kos") {
      cenaPoKosih += n(k.cenaKos);
      return;
    }
    const m2Kosa = (n(k.dolzina) * n(k.sirina)) / 10000;
    if (!m2Kosa) return;
    if (String(k.debelina) === "3") m2_3cm += m2Kosa;
    else m2_2cm += m2Kosa;
  });
  const cena_2cm = m2_2cm * n(material.cena2cm);
  const cena_3cm = m2_3cm * n(material.cena3cm);
  return {
    m2: m2_2cm + m2_3cm,
    cena: cena_2cm + cena_3cm + cenaPoKosih,
    naziv: material.naziv,
    m2_2cm,
    cena_2cm,
    m2_3cm,
    cena_3cm,
    cena_kos: cenaPoKosih,
  };
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

function prenesiVarnostnoKopijoPulti(nalogi) {
  const danes = new Date().toISOString().slice(0, 10);
  const vsebina = JSON.stringify(nalogi, null, 2);
  const blob = new Blob([vsebina], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `varnostna-kopija-pulti-${danes}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function obnoviIzDatotekePulti(event, shraniNaloge) {
  const datoteka = event.target.files && event.target.files[0];
  if (!datoteka) return;
  const bralnik = new FileReader();
  bralnik.onload = async (e) => {
    try {
      const podatki = JSON.parse(e.target.result);
      if (!Array.isArray(podatki)) {
        alert("Datoteka ni veljavna varnostna kopija (pričakovan je seznam naročil).");
        return;
      }
      const potrdi = window.confirm(
        `Ali res želiš obnoviti podatke iz te datoteke? Vsebuje ${podatki.length} naročil in bo PREPISALA trenutni seznam. Tega dejanja ni mogoče razveljaviti.`
      );
      if (potrdi) {
        await shraniNaloge(podatki);
        alert("Podatki so bili uspešno obnovljeni.");
      }
    } catch (err) {
      alert("Napaka pri branju datoteke — preveri, da je to prava .json varnostna kopija.");
    }
  };
  bralnik.readAsText(datoteka);
  event.target.value = "";
}

function eur(x) {
  return (
    (x || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " €"
  );
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

async function obravnavajNalozenoDatoteko(event, nastavi) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > MAX_DATOTEKA_MB * 1024 * 1024) {
    alert(`Datoteka je prevelika (max ${MAX_DATOTEKA_MB} MB). Poskusi manjšo/stisnjeno datoteko.`);
    event.target.value = "";
    return;
  }
  try {
    const rezultat = await datotekaVBase64(file);
    nastavi(rezultat);
  } catch (e) {
    alert("Napaka pri nalaganju datoteke.");
  }
  event.target.value = "";
}

function besediloPonudbePulti(nalog, izr) {
  return (
    `Pozdravljeni ${nalog.stranka?.ime || ""},\n\n` +
    `pošiljamo vam ponudbo ${nalog.stevilka || ""} za izdelavo pulta.\n\n` +
    `Skupna vrednost: ${izr.zDdv.toFixed(2)} € (z DDV).\n\n` +
    `Za vsa vprašanja smo dosegljivi na 031 235 146.\n\n` +
    `Lep pozdrav,\nKamnoseštvo Čakš`
  );
}

function ponudbaPultiMailto(nalog, izr) {
  const zadeva = `Ponudba ${nalog.stevilka || ""} — Kamnoseštvo Čakš`;
  return `mailto:${nalog.stranka?.email || ""}?subject=${encodeURIComponent(zadeva)}&body=${encodeURIComponent(besediloPonudbePulti(nalog, izr))}`;
}

function ponudbaPultiSMS(nalog, izr) {
  const stevilkaCista = (nalog.stranka?.telefon || "").replace(/[^0-9+]/g, "");
  const jeIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const locilo = jeIOS ? "&" : "?";
  return `sms:${stevilkaCista}${locilo}body=${encodeURIComponent(besediloPonudbePulti(nalog, izr))}`;
}

function prenesiHTMLDokumentPulti(selector, naslov, imeDatoteke) {
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

function prazenKos() {
  return { naziv: "", dolzina: "", sirina: "", debelina: "2", nacinCene: "m2", cenaKos: "" };
}

function prazenNalog() {
  return {
    id: Date.now(),
    stevilka: "",
    datum: new Date().toISOString().slice(0, 10),
    stranka: { ime: "", telefon: "", email: "", naslov: "" },
    sprejel: "",
    status: "sprejeto",
    materialId: "",
    debelina: "2",
    steviloPlosc: "",
    kosi: [prazenKos()],
    storitve: {},
    popust: "",
    ponudbenaCena: null,
    dxf: "",
    steklokeramika: "",
    korito: "",
    ostaliIzrezi: "",
    dxfDatoteka: null,
    skica: null,
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
  const [strankeBaza, setStrankeBaza] = useState([]);
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
        setNalogi((Array.isArray(p) ? p : []).map((x) => ({ ...x, status: normalizirajStatusPulti(x.status) })));

        // Če je v povezavi (npr. iz QR kode na delovnem listu) naveden ?nalog=ID,
        // samodejno odpremo pregled tega naloga.
        try {
          const parametri = new URLSearchParams(window.location.search);
          const idIzPovezave = parametri.get("nalog");
          if (idIzPovezave && Array.isArray(p) && p.some((x) => String(x.id) === String(idIzPovezave))) {
            const najden = p.find((x) => String(x.id) === String(idIzPovezave));
            setIzbran(najden.id);
            setPogled("podrobnosti");
          }
        } catch (e2) {}
        const veljaven = c && Array.isArray(c.materiali) && Array.isArray(c.storitve);
        setCenik(veljaven ? c : PRIVZETI_CENIK);
      })
      .catch(() => setNapaka("Napaka pri nalaganju podatkov."))
      .finally(() => setNalaganje(false));

    // Skupna baza strank iz Delovnih nalogov (Police) — za samodokončanje pri vnosu.
    fetch("/api/nalogi", { cache: "no-store" })
      .then((r) => r.json())
      .then((podatki) => {
        if (!Array.isArray(podatki)) return;
        const seznam = {};
        podatki.forEach((n) => {
          if (n.stranka && !seznam[n.stranka]) {
            seznam[n.stranka] = { ime: n.stranka, telefon: n.telefon || "", email: n.email || "" };
          }
        });
        setStrankeBaza(Object.values(seznam));
      })
      .catch(() => {});
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
          <a href="/sestanki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            Sestanki
          </a>
          <a href="/spomeniki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            Spomeniki
          </a>
          <a href="/pregled" target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            📺 Pregled
          </a>
          <button
            onClick={() => {
              window.location.href = window.location.pathname + "?osvezeno=" + Date.now();
            }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
            title="Osveži aplikacijo"
          >
            ⟳ Osveži
          </button>
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
          strankeBaza={strankeBaza}
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
                { status: nal.status || "sprejeto", datum: new Date().toISOString(), kdo: nal.sprejel || "" },
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
          natisni={(nal) => {
            setIzbran(nal.id);
            setPogled("tiskPonudbe");
          }}
          natisniDelovniList={(nal) => {
            setIzbran(nal.id);
            setPogled("tiskDelovniList");
          }}
          odpriDobavnico={(nal) => {
            setIzbran(nal.id);
            setPogled("dobavnica");
          }}
        />
      )}

      {pogled === "tiskPonudbe" && (
        <TiskPonudbePulti
          nalog={nalogi.find((x) => x.id === izbran)}
          cenik={cenik}
          nazaj={() => setPogled("podrobnosti")}
        />
      )}

      {pogled === "tiskDelovniList" && (
        <TiskDelovnegaListaPulti
          nalog={nalogi.find((x) => x.id === izbran)}
          cenik={cenik}
          nazaj={() => setPogled("podrobnosti")}
        />
      )}

      {pogled === "dobavnica" && (
        <DobavnicaPulti
          nalog={nalogi.find((x) => x.id === izbran)}
          nazaj={() => setPogled("podrobnosti")}
          shraniPodpis={(nal, podatkiPodpisa, ime) => {
            shraniNaloge(
              nalogi.map((x) =>
                x.id === nal.id
                  ? { ...x, podpisPrevzemnika: podatkiPodpisa, podpisIme: ime, podpisDatum: new Date().toISOString() }
                  : x
              )
            );
          }}
        />
      )}

      {pogled === "cenik" && (
        <CenikAdmin cenik={cenik} shrani={shraniCenik} nazaj={() => setPogled("seznam")} nalogi={nalogi} shraniNaloge={shraniNaloge} />
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
              {nal.datumMontaze && nal.status !== "prevzeto" && (
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

function Obrazec({ zacetni, cenik, shrani, preklici, strankeBaza }) {
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
            onChange={(e) => {
              const ime = e.target.value;
              const najdena = (strankeBaza || []).find((s) => s.ime.toLowerCase() === ime.toLowerCase());
              setNal({
                ...nal,
                stranka: {
                  ...nal.stranka,
                  ime,
                  telefon: najdena && !nal.stranka.telefon ? najdena.telefon : nal.stranka.telefon,
                  email: najdena && !nal.stranka.email ? najdena.email : nal.stranka.email,
                },
              });
            }}
            list="seznam-strank-pulti"
            autoComplete="off"
          />
          <datalist id="seznam-strank-pulti">
            {(strankeBaza || []).map((s) => (
              <option key={s.ime} value={s.ime} />
            ))}
          </datalist>
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
            <label className={lbl}>E-mail</label>
            <input
              type="email"
              className={inp}
              value={nal.stranka.email}
              onChange={(e) =>
                setNal({ ...nal, stranka: { ...nal.stranka, email: e.target.value } })
              }
              placeholder="stranka@example.com"
            />
          </div>
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
          <div className="text-sm text-gray-600 space-y-0.5 bg-gray-50 rounded-lg p-2">
            <div>Debelina se izbere pri vsakem kosu posebej (spodaj).</div>
            {izr.material.m2_2cm > 0 && (
              <div>2 cm: <span className="font-semibold text-black">{izr.material.m2_2cm.toFixed(2)} m²</span> = {eur(izr.material.cena_2cm)}</div>
            )}
            {izr.material.m2_3cm > 0 && (
              <div>3 cm: <span className="font-semibold text-black">{izr.material.m2_3cm.toFixed(2)} m²</span> = {eur(izr.material.cena_3cm)}</div>
            )}
            {izr.material.cena_kos > 0 && (
              <div>Kosi s fiksno ceno: <span className="font-semibold text-black">{eur(izr.material.cena_kos)}</span></div>
            )}
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
          <div key={i} className="border border-gray-200 rounded-lg p-2.5 space-y-2">
            <div className="flex gap-2 items-center">
              <input
                className={`${inp} flex-1 min-w-[140px]`}
                placeholder={`Kos ${i + 1} (npr. Pult ob steni)`}
                value={kos.naziv}
                onChange={(e) => nastaviKos(i, "naziv", e.target.value)}
              />
              {nal.kosi.length > 1 && (
                <button
                  onClick={() => setNal({ ...nal, kosi: nal.kosi.filter((_, j) => j !== i) })}
                  className="text-red-600 text-lg px-1 shrink-0"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => nastaviKos(i, "nacinCene", "m2")}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  (kos.nacinCene || "m2") === "m2" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                Cena po m²
              </button>
              <button
                type="button"
                onClick={() => nastaviKos(i, "nacinCene", "kos")}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  kos.nacinCene === "kos" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                Fiksna cena za kos
              </button>
            </div>
            {kos.nacinCene === "kos" ? (
              <input
                className={inp}
                placeholder="Cena za ta kos (€)"
                inputMode="decimal"
                value={kos.cenaKos}
                onChange={(e) => nastaviKos(i, "cenaKos", e.target.value)}
              />
            ) : (
              <div className="flex gap-2">
                <input
                  className={`${inp} flex-1`}
                  placeholder="Dolž. (cm)"
                  inputMode="decimal"
                  value={kos.dolzina}
                  onChange={(e) => nastaviKos(i, "dolzina", e.target.value)}
                />
                <input
                  className={`${inp} flex-1`}
                  placeholder="Šir. (cm)"
                  inputMode="decimal"
                  value={kos.sirina}
                  onChange={(e) => nastaviKos(i, "sirina", e.target.value)}
                />
                <select
                  className={`${inp} w-24 shrink-0`}
                  value={kos.debelina || "2"}
                  onChange={(e) => nastaviKos(i, "debelina", e.target.value)}
                >
                  <option value="2">2 cm</option>
                  <option value="3">3 cm</option>
                </select>
              </div>
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
              <div className="px-3 pb-2 divide-y divide-gray-100">
                {skupina.ids.map((id) => {
                  const s = cenik.storitve.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 py-2">
                      <span className="text-xs text-gray-600 shrink-0">
                        {s.naziv} <span className="text-gray-400">({eur(s.cena)}/{s.enota})</span>
                      </span>
                      <span className="flex-1 border-b border-dotted border-gray-300 translate-y-[-2px]" />
                      <input
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right shrink-0"
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

      {/* IZREZI - PODROBNOSTI */}
      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Izrezi — podrobnosti (znamka, model, mere)</div>
        <div>
          <label className={lbl}>Steklokeramika</label>
          <input
            className={inp}
            value={nal.steklokeramika}
            onChange={(e) => setNal({ ...nal, steklokeramika: e.target.value })}
            placeholder="npr. Bora Pura 796x519"
          />
        </div>
        <div>
          <label className={lbl}>Korito</label>
          <input
            className={inp}
            value={nal.korito}
            onChange={(e) => setNal({ ...nal, korito: e.target.value })}
            placeholder="npr. Alveus 490x390"
          />
        </div>
        <div>
          <label className={lbl}>Ostali izrezi</label>
          <textarea
            className={inp}
            rows={2}
            value={nal.ostaliIzrezi}
            onChange={(e) => setNal({ ...nal, ostaliIzrezi: e.target.value })}
            placeholder="npr. vtičnica, luknja za armaturo ..."
          />
        </div>
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
          <label className={lbl}>Nalozi DXF datoteko (za prenos na mašine)</label>
          {nal.dxfDatoteka ? (
            <div className="flex items-center justify-between bg-stone-100 rounded-lg px-3 py-2 text-sm">
              <span className="truncate text-stone-700">📎 {nal.dxfDatoteka.ime}</span>
              <button
                type="button"
                onClick={() => setNal({ ...nal, dxfDatoteka: null })}
                className="text-red-600 text-xs ml-2 shrink-0"
              >
                Odstrani
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".dxf,.dwg"
              onChange={(e) => obravnavajNalozenoDatoteko(e, (rez) => setNal({ ...nal, dxfDatoteka: rez }))}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-700 file:text-sm"
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Skica / delovni list z izmere (slika ali PDF)</label>
          {nal.skica ? (
            <div className="bg-stone-100 rounded-lg p-2">
              {nal.skica.tip && nal.skica.tip.startsWith("image/") ? (
                <img src={nal.skica.podatki} alt="Skica" className="max-h-64 rounded-lg mx-auto" />
              ) : (
                <div className="flex items-center justify-between text-sm px-2 py-1">
                  <span className="truncate text-stone-700">📄 {nal.skica.ime}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setNal({ ...nal, skica: null })}
                className="text-red-600 text-xs mt-2 block mx-auto"
              >
                Odstrani skico
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => obravnavajNalozenoDatoteko(e, (rez) => setNal({ ...nal, skica: rez }))}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-700 file:text-sm"
            />
          )}
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
          <>
            <div className="flex justify-between text-red-400">
              <span>Popust ({nal.popust}%)</span>
              <span>−{eur(izr.popust)}</span>
            </div>
            <div className="flex justify-between">
              <span>Osnova po popustu</span>
              <span>{eur(izr.brezDdv)}</span>
            </div>
          </>
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

            // Validacijska opozorila — ne blokirajo, samo opozorijo na verjetne napake.
            const opozorila = [];
            if (!nal.materialId) {
              opozorila.push("• Material ni izbran.");
            }
            (nal.kosi || []).forEach((k, i) => {
              const oznaka = k.naziv || `Kos ${i + 1}`;
              if (k.nacinCene === "kos") {
                if (!n(k.cenaKos)) opozorila.push(`• ${oznaka}: fiksna cena ni vpisana.`);
              } else {
                if ((k.naziv || k.dolzina || k.sirina) && (!n(k.dolzina) || !n(k.sirina))) {
                  opozorila.push(`• ${oznaka}: manjka dolžina ali širina.`);
                }
                if (n(k.dolzina) > 400 || n(k.sirina) > 400) {
                  opozorila.push(`• ${oznaka}: mera nad 400 cm — preveri, ali je pravilna.`);
                }
              }
            });
            if (izr.zDdv <= 0) {
              opozorila.push("• Skupna cena je 0 € — preveri material, mere ali storitve.");
            }
            if (opozorila.length > 0) {
              const nadaljuj = window.confirm(
                "Opozorila pred shranjevanjem:\n\n" + opozorila.join("\n") + "\n\nAli vseeno shranim?"
              );
              if (!nadaljuj) return;
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

function Podrobnosti({ nalog, cenik, nazaj, uredi, spremeniStatus, preklopiPlacano, izbrisi, natisni, natisniDelovniList, odpriDobavnico }) {
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
          {nalog.stranka?.email && <div className="text-gray-600">{nalog.stranka.email}</div>}
          {nalog.stranka?.naslov && <div className="text-gray-600">{nalog.stranka.naslov}</div>}
        </div>
        {nalog.sprejel && (
          <div className="text-xs text-gray-500">Sprejel: {nalog.sprejel}</div>
        )}
        {(nalog.steklokeramika || nalog.korito || nalog.ostaliIzrezi) && (
          <div className="text-sm bg-gray-50 rounded-lg p-2 space-y-0.5">
            {nalog.steklokeramika && <div><span className="text-gray-400">Steklokeramika: </span>{nalog.steklokeramika}</div>}
            {nalog.korito && <div><span className="text-gray-400">Korito: </span>{nalog.korito}</div>}
            {nalog.ostaliIzrezi && <div><span className="text-gray-400">Ostali izrezi: </span>{nalog.ostaliIzrezi}</div>}
          </div>
        )}
        {nalog.dxf && <div className="text-xs text-gray-500">DXF: {nalog.dxf}</div>}
        {nalog.dxfDatoteka && (
          <a
            href={nalog.dxfDatoteka.podatki}
            download={nalog.dxfDatoteka.ime}
            className="text-xs text-blue-600 underline block"
          >
            📎 Prenesi DXF datoteko ({nalog.dxfDatoteka.ime})
          </a>
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

      {nalog.skica && (
        <div className="bg-white rounded-xl p-3">
          <div className="font-semibold text-sm mb-2">Skica / delovni list z izmere</div>
          {nalog.skica.tip && nalog.skica.tip.startsWith("image/") ? (
            <img src={nalog.skica.podatki} alt="Skica" className="max-h-80 rounded-lg mx-auto" />
          ) : (
            <a
              href={nalog.skica.podatki}
              download={nalog.skica.ime}
              className="text-sm text-blue-600 underline"
            >
              📄 Prenesi {nalog.skica.ime}
            </a>
          )}
        </div>
      )}

      {/* MATERIAL */}
      <div className="bg-white rounded-xl p-3 text-sm space-y-1">
        <div className="font-semibold">
          {material ? material.naziv : "Material ni izbran"}
        </div>
        {material?.tip === "m2" ? (
          <>
            {izr.material.m2_2cm > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>2 cm ({izr.material.m2_2cm.toFixed(2)} m²)</span>
                <span>{eur(izr.material.cena_2cm)}</span>
              </div>
            )}
            {izr.material.m2_3cm > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>3 cm ({izr.material.m2_3cm.toFixed(2)} m²)</span>
                <span>{eur(izr.material.cena_3cm)}</span>
              </div>
            )}
            {izr.material.cena_kos > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Kosi s fiksno ceno</span>
                <span>{eur(izr.material.cena_kos)}</span>
              </div>
            )}
          </>
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
              <span>
                {kos.nacinCene === "kos"
                  ? `Fiksna cena: ${eur(n(kos.cenaKos))}`
                  : `${kos.dolzina || "–"} × ${kos.sirina || "–"}${kos.debelina ? ` × ${kos.debelina}` : ""} cm`}
              </span>
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

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Spremeni status</div>
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
        <div className="flex flex-wrap gap-2">
          {STATUSI.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                spremeniStatus(nalog, st.id, kdoOpravil);
                setKdoOpravil("");
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                nalog.status === st.id
                  ? `${st.barva} text-white border-transparent font-medium`
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {st.naziv}
            </button>
          ))}
        </div>
      </div>

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

      {(nalog.stranka?.email || nalog.stranka?.telefon) && (
        <div className="bg-white rounded-xl p-3 space-y-2">
          <div className="text-sm font-semibold">Pošlji ponudbo stranki</div>
          <div className="flex flex-wrap gap-2">
            {nalog.stranka?.email && (
              <a
                href={ponudbaPultiMailto(nalog, izr)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
              >
                Pošlji e-mail
              </a>
            )}
            {nalog.stranka?.telefon && (
              <a
                href={ponudbaPultiSMS(nalog, izr)}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
              >
                Pošlji SMS
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => natisni(nalog)} className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold">
          Natisni ponudbo
        </button>
        <button onClick={() => natisniDelovniList(nalog)} className="flex-1 bg-stone-700 text-white rounded-xl py-3 font-semibold">
          Natisni delovni list
        </button>
      </div>
      <button onClick={() => odpriDobavnico(nalog)} className="w-full bg-emerald-700 text-white rounded-xl py-3 font-semibold">
        📄 Dobavnica {nalog.podpisPrevzemnika ? "✓ (podpisana)" : "+ e-podpis"}
      </button>

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

function TiskDelovnegaListaPulti({ nalog, cenik, nazaj }) {
  if (!nalog) return <div className="p-4">Nalog ne obstaja. <button onClick={nazaj} className="text-red-600 underline">Nazaj</button></div>;

  const material = najdiMaterial(cenik, nalog.materialId);
  const materialIzracun = izracunMateriala(nalog, cenik);
  const kosiZaPrikaz = (nalog.kosi || []).filter((k) => k.naziv || k.dolzina || k.sirina);
  const storitveZUporabo = izracunStoritev(nalog, cenik).filter((s) => s.kolicina > 0);
  const danes = new Date().toLocaleDateString("sl-SI");
  const strankaVarno = (nalog.stranka?.ime || "").replace(/[\\/:*?"<>|]/g, "").trim();

  return (
    <div className="p-3 space-y-3">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .delovni-list-pulti, .delovni-list-pulti * { visibility: visible; }
          .delovni-list-pulti { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .delovni-list-pulti-brez { display: none !important; }
        }
      `}</style>

      <div className="delovni-list-pulti-brez flex flex-wrap gap-2">
        <button
          onClick={() => prenesiHTMLDokumentPulti(".delovni-list-pulti", `Delovni list ${nalog.stevilka || ""}`, `delovni-list-${nalog.stevilka || "pult"}${strankaVarno ? " " + strankaVarno : ""}.html`)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          Prenesi / natisni datoteko
        </button>
        <button onClick={nazaj} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100">
          Nazaj
        </button>
      </div>

      <div className="delovni-list-pulti bg-white rounded-xl p-4 sm:p-6 border border-gray-200 text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <div className="font-bold text-lg">ČAKŠ <span className="text-red-600">· Pulti</span></div>
          <div className="flex items-center gap-3">
            <div className="text-sm uppercase font-semibold text-gray-600">Delovni list</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://delavni-nalog-caks.vercel.app/pulti?nalog=${nalog.id}`)}`}
              alt="QR koda za odpiranje naloga"
              width={70}
              height={70}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-gray-200 pb-2 mb-2">
          <div><span className="text-xs text-gray-400 uppercase mr-1">Št.:</span><span className="font-semibold">{nalog.stevilka}</span></div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Stranka:</span><span className="font-semibold">{nalog.stranka?.ime}</span></div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Datum:</span>{danes}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Montaža:</span>{nalog.datumMontaze ? new Date(nalog.datumMontaze).toLocaleDateString("sl-SI") : "—"}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Material:</span>{material ? material.naziv : "—"}</div>
          <div></div>
          {material?.tip === "m2" && (
            <div className="col-span-2 space-y-0.5">
              {materialIzracun.m2_2cm > 0 && (
                <div>
                  <span className="text-xs text-gray-400 uppercase mr-1">2 cm:</span>
                  {materialIzracun.m2_2cm.toFixed(2)} m²
                  <span className="text-xs text-gray-400 uppercase mx-1">=</span>
                  <span className="font-semibold">{eur(materialIzracun.cena_2cm)}</span>
                </div>
              )}
              {materialIzracun.m2_3cm > 0 && (
                <div>
                  <span className="text-xs text-gray-400 uppercase mr-1">3 cm:</span>
                  {materialIzracun.m2_3cm.toFixed(2)} m²
                  <span className="text-xs text-gray-400 uppercase mx-1">=</span>
                  <span className="font-semibold">{eur(materialIzracun.cena_3cm)}</span>
                </div>
              )}
              {materialIzracun.cena_kos > 0 && (
                <div>
                  <span className="text-xs text-gray-400 uppercase mr-1">Kosi s fiksno ceno:</span>
                  <span className="font-semibold">{eur(materialIzracun.cena_kos)}</span>
                </div>
              )}
            </div>
          )}
          {material?.tip === "plosca" && (
            <div className="col-span-2">
              <span className="text-xs text-gray-400 uppercase mr-1">Št. plošč:</span>
              {nalog.steviloPlosc || 0}
              <span className="text-xs text-gray-400 uppercase mx-1">· Cena materiala:</span>
              <span className="font-semibold">{eur(materialIzracun.cena)}</span>
            </div>
          )}
        </div>

        {kosiZaPrikaz.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Kosi</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                  <th className="py-1">Naziv</th>
                  <th className="py-1">Dolžina</th>
                  <th className="py-1">Širina</th>
                  <th className="py-1">Debelina</th>
                </tr>
              </thead>
              <tbody>
                {kosiZaPrikaz.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{k.naziv || `Kos ${i + 1}`}</td>
                    <td className="py-1">{k.nacinCene === "kos" ? `Fiksna cena: ${eur(n(k.cenaKos))}` : k.dolzina || "–"}</td>
                    <td className="py-1">{k.nacinCene === "kos" ? "—" : k.sirina || "–"}</td>
                    <td className="py-1">{k.nacinCene === "kos" ? "—" : k.debelina || nalog.debelina || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {storitveZUporabo.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Storitve</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {storitveZUporabo.map((s) => (
                <li key={s.id}>{s.naziv} × {s.kolicina} {s.enota} — <span className="font-medium">{eur(s.skupaj)}</span></li>
              ))}
            </ul>
          </div>
        )}

        {(nalog.steklokeramika || nalog.korito || nalog.ostaliIzrezi) && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Izrezi — podrobnosti</div>
            {nalog.steklokeramika && <p><span className="text-xs text-gray-400 uppercase mr-1">Steklokeramika:</span>{nalog.steklokeramika}</p>}
            {nalog.korito && <p><span className="text-xs text-gray-400 uppercase mr-1">Korito:</span>{nalog.korito}</p>}
            {nalog.ostaliIzrezi && <p><span className="text-xs text-gray-400 uppercase mr-1">Ostalo:</span>{nalog.ostaliIzrezi}</p>}
          </div>
        )}

        {nalog.dxf && <p className="mb-1"><span className="text-xs text-gray-400 uppercase mr-1">DXF:</span>{nalog.dxf}</p>}

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

function TiskPonudbePulti({ nalog, cenik, nazaj }) {
  if (!nalog) return <div className="p-4">Nalog ne obstaja. <button onClick={nazaj} className="text-red-600 underline">Nazaj</button></div>;

  const izr = izracunNaloga(nalog, cenik);
  const material = najdiMaterial(cenik, nalog.materialId);
  const storitveZUporabo = izr.storitve.filter((s) => s.kolicina > 0);
  const danes = new Date().toLocaleDateString("sl-SI");
  const strankaVarno = (nalog.stranka?.ime || "").replace(/[\\/:*?"<>|]/g, "").trim();

  return (
    <div className="p-3 space-y-3">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ponudba-pulti-list, .ponudba-pulti-list * { visibility: visible; }
          .ponudba-pulti-list { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .ponudba-pulti-brez { display: none !important; }
        }
      `}</style>

      <div className="ponudba-pulti-brez flex flex-wrap gap-2">
        <button
          onClick={() => prenesiHTMLDokumentPulti(".ponudba-pulti-list", `Ponudba ${nalog.stevilka || ""}`, `ponudba-pult-${nalog.stevilka || "nalog"}${strankaVarno ? " " + strankaVarno : ""}.html`)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          Prenesi datoteko
        </button>
        <button onClick={nazaj} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100">
          Nazaj
        </button>
      </div>

      <div className="ponudba-pulti-list bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <div className="font-bold text-lg">ČAKŠ <span className="text-red-600">· Pulti</span></div>
          <div className="flex items-center gap-3">
            <div className="text-sm uppercase font-semibold text-gray-600">Ponudba</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://delavni-nalog-caks.vercel.app/status/${nalog.id}`)}`}
              alt="QR koda za status"
              width={70}
              height={70}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm border-b border-gray-200 pb-2 mb-3">
          <span><span className="text-xs text-gray-400 uppercase mr-1">Št.</span><span className="font-semibold">{nalog.stevilka}</span></span>
          <span><span className="text-xs text-gray-400 uppercase mr-1">Stranka</span><span className="font-semibold">{nalog.stranka?.ime}</span></span>
          {nalog.stranka?.telefon && <span><span className="text-xs text-gray-400 uppercase mr-1">Tel</span>{nalog.stranka.telefon}</span>}
          {nalog.stranka?.email && <span><span className="text-xs text-gray-400 uppercase mr-1">E-mail</span>{nalog.stranka.email}</span>}
          {nalog.stranka?.naslov && <span><span className="text-xs text-gray-400 uppercase mr-1">Naslov</span>{nalog.stranka.naslov}</span>}
          <span><span className="text-xs text-gray-400 uppercase mr-1">Datum</span>{danes}</span>
          {nalog.datumMontaze && <span><span className="text-xs text-gray-400 uppercase mr-1">Predviden datum montaže</span><span className="font-semibold text-red-600">{nalog.datumMontaze}</span></span>}
        </div>

        <div className="mb-3 pb-2 border-b border-gray-200 text-sm">
          <span className="text-xs text-gray-400 uppercase mr-1">Material</span>
          <span className="font-semibold">{material ? material.naziv : "—"}</span>
          {material?.tip === "plosca" && ` · ${nalog.steviloPlosc || 0} plošč`}
          {material?.tip === "m2" && (
            <div className="mt-0.5">
              {izr.material.m2_2cm > 0 && <div>2 cm: {izr.material.m2_2cm.toFixed(2)} m² = {eur(izr.material.cena_2cm)}</div>}
              {izr.material.m2_3cm > 0 && <div>3 cm: {izr.material.m2_3cm.toFixed(2)} m² = {eur(izr.material.cena_3cm)}</div>}
              {izr.material.cena_kos > 0 && <div>Kosi s fiksno ceno: {eur(izr.material.cena_kos)}</div>}
            </div>
          )}
        </div>

        {(nalog.kosi || []).some((k) => k.naziv || k.dolzina || k.sirina) && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Kosi</div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                  <th className="py-1">Naziv</th>
                  <th className="py-1">Mere (cm)</th>
                  <th className="py-1">Deb.</th>
                </tr>
              </thead>
              <tbody>
                {nalog.kosi.map((k, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{k.naziv || `Kos ${i + 1}`}</td>
                    <td className="py-1">{k.nacinCene === "kos" ? `Fiksna cena: ${eur(n(k.cenaKos))}` : `${k.dolzina || "–"} × ${k.sirina || "–"}`}</td>
                    <td className="py-1">{k.nacinCene === "kos" ? "—" : `${k.debelina || "2"} cm`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {storitveZUporabo.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Storitve</div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                  <th className="py-1">Postavka</th>
                  <th className="py-1">Kol.</th>
                  <th className="py-1 text-right">Cena</th>
                </tr>
              </thead>
              <tbody>
                {storitveZUporabo.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-1">{s.naziv}</td>
                    <td className="py-1">{s.kolicina} {s.enota}</td>
                    <td className="py-1 text-right">{eur(s.skupaj)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-end gap-0.5 text-sm border-t-2 border-gray-200 pt-2 mb-2">
          <span>Material: <span className="font-semibold">{eur(izr.material.cena)}</span></span>
          <span>Storitve: <span className="font-semibold">{eur(izr.storitveSkupaj)}</span></span>
          {izr.popust > 0 && <span>Popust ({nalog.popust}%): <span className="font-semibold">−{eur(izr.popust)}</span></span>}
          {izr.popust > 0 && <span>Osnova po popustu: <span className="font-semibold">{eur(izr.brezDdv)}</span></span>}
          <span>DDV 22%: <span className="font-semibold">{eur(izr.ddv)}</span></span>
          <span className="text-base font-bold">Skupaj z DDV: {eur(izr.zDdv)}</span>
        </div>

        {nalog.opombe && (
          <p className="text-sm mt-2"><span className="text-xs text-gray-400 uppercase mr-1">Opombe:</span>{nalog.opombe}</p>
        )}

        <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
          Za vsa vprašanja smo dosegljivi na 031 235 146. Cene so informativne narave.
        </p>
      </div>
    </div>
  );
}

function CenikAdmin({ cenik, shrani, nazaj, nalogi, shraniNaloge }) {
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
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Cenik pultov</h2>
        <button
          onClick={() => {
            if (confirm("Ali res želiš prepisati trenutni cenik z novim, privzetim cenikom (iz Excela)? Trenutne ročne spremembe bodo izgubljene.")) {
              setC(JSON.parse(JSON.stringify(PRIVZETI_CENIK)));
            }
          }}
          className="text-xs bg-red-600 text-white px-3 py-2 rounded-lg"
        >
          Ponastavi na privzeti cenik
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Varnostna kopija naročil</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => prenesiVarnostnoKopijoPulti(nalogi)}
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ⬇ Prenesi kopijo zdaj
          </button>
          <label className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            📄 Obnovi iz datoteke
            <input type="file" accept="application/json" className="hidden" onChange={(e) => obnoviIzDatotekePulti(e, shraniNaloge)} />
          </label>
        </div>
        <p className="text-xs text-gray-500">Priporočamo ročni prenos vsake toliko časa, za vsak slučaj.</p>
      </div>

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

// ===================== E-PODPIS =====================

function PodpisniPadPulti({ zacetnoIme, onPreklici, onShrani }) {
  const platnoRef = useRef(null);
  const risemRef = useRef(false);
  const zadnjaTockaRef = useRef(null);
  const [prazno, setPrazno] = useState(true);
  const [ime, setIme] = useState(zacetnoIme || "");

  useEffect(() => {
    const platno = platnoRef.current;
    if (!platno) return;
    const ctx = platno.getContext("2d");
    const razmerje = window.devicePixelRatio || 1;
    const sirina = platno.clientWidth;
    const visina = platno.clientHeight;
    platno.width = sirina * razmerje;
    platno.height = visina * razmerje;
    ctx.scale(razmerje, razmerje);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  function tockaIzDogodka(e) {
    const platno = platnoRef.current;
    const rect = platno.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function zacniRisanje(e) {
    e.preventDefault();
    risemRef.current = true;
    zadnjaTockaRef.current = tockaIzDogodka(e);
  }

  function risi(e) {
    if (!risemRef.current) return;
    e.preventDefault();
    const ctx = platnoRef.current.getContext("2d");
    const tocka = tockaIzDogodka(e);
    ctx.beginPath();
    ctx.moveTo(zadnjaTockaRef.current.x, zadnjaTockaRef.current.y);
    ctx.lineTo(tocka.x, tocka.y);
    ctx.stroke();
    zadnjaTockaRef.current = tocka;
    if (prazno) setPrazno(false);
  }

  function koncajRisanje() {
    risemRef.current = false;
  }

  function pocisti() {
    const platno = platnoRef.current;
    const ctx = platno.getContext("2d");
    ctx.clearRect(0, 0, platno.width, platno.height);
    setPrazno(true);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md">
        <h3 className="font-bold text-base mb-3">Elektronski podpis prevzemnika</h3>
        <input
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          placeholder="Ime in priimek prevzemnika"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-3"
        />
        <p className="text-xs text-gray-500 mb-1.5">Podpiši s prstom ali miško v spodnje polje:</p>
        <canvas
          ref={platnoRef}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg touch-none"
          style={{ height: "160px" }}
          onMouseDown={zacniRisanje}
          onMouseMove={risi}
          onMouseUp={koncajRisanje}
          onMouseLeave={koncajRisanje}
          onTouchStart={zacniRisanje}
          onTouchMove={risi}
          onTouchEnd={koncajRisanje}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={pocisti}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300"
          >
            Počisti
          </button>
          <button
            onClick={onPreklici}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600"
          >
            Prekliči
          </button>
          <button
            onClick={() => {
              if (prazno) {
                alert("Prosim, najprej se podpiši.");
                return;
              }
              if (!ime.trim()) {
                alert("Vnesi ime prevzemnika.");
                return;
              }
              onShrani(platnoRef.current.toDataURL("image/png"), ime.trim());
            }}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white"
          >
            Shrani podpis
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== DOBAVNICA =====================

function DobavnicaPulti({ nalog, nazaj, shraniPodpis }) {
  const [podpisovanje, setPodpisovanje] = useState(false);
  if (!nalog) return <div className="p-4">Nalog ne obstaja. <button onClick={nazaj} className="text-red-600 underline">Nazaj</button></div>;

  const danes = new Date().toLocaleDateString("sl-SI");
  const strankaVarno = (nalog.stranka?.ime || "").replace(/[\\/:*?"<>|]/g, "").trim();
  const kosiZaPrikaz = (nalog.kosi || []).filter((k) => k.naziv || k.dolzina || k.sirina || k.cenaKos);

  return (
    <div className="p-3 space-y-3">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .dobavnica-pulti, .dobavnica-pulti * { visibility: visible; }
          .dobavnica-pulti { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .dobavnica-pulti-brez { display: none !important; }
        }
      `}</style>

      <div className="dobavnica-pulti-brez flex flex-wrap gap-2">
        <button
          onClick={() => prenesiHTMLDokumentPulti(".dobavnica-pulti", `Dobavnica ${nalog.stevilka || ""}`, `dobavnica-${nalog.stevilka || "pult"}${strankaVarno ? " " + strankaVarno : ""}.html`)}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          Prenesi / natisni datoteko
        </button>
        {!nalog.podpisPrevzemnika && (
          <button
            onClick={() => setPodpisovanje(true)}
            className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            ✍ Podpiši prevzem
          </button>
        )}
        <button onClick={nazaj} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100">
          Nazaj
        </button>
      </div>

      <div className="dobavnica-pulti bg-white rounded-xl p-4 sm:p-6 border border-gray-200 text-sm">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <div className="font-bold text-lg">ČAKŠ <span className="text-red-600">· Pulti</span></div>
          <div className="flex items-center gap-3">
            <div className="text-sm uppercase font-semibold text-gray-600">Dobavnica</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://delavni-nalog-caks.vercel.app/status/${nalog.id}`)}`}
              alt="QR koda za status"
              width={70}
              height={70}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-gray-200 pb-2 mb-3">
          <div><span className="text-xs text-gray-400 uppercase mr-1">Št.:</span><span className="font-semibold">{nalog.stevilka}</span></div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Datum:</span>{danes}</div>
          <div><span className="text-xs text-gray-400 uppercase mr-1">Kupec:</span><span className="font-semibold">{nalog.stranka?.ime}</span></div>
          {nalog.stranka?.telefon && <div><span className="text-xs text-gray-400 uppercase mr-1">Tel:</span>{nalog.stranka.telefon}</div>}
        </div>

        {kosiZaPrikaz.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 uppercase mb-1">Dobavljeno</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {kosiZaPrikaz.map((k, i) => (
                <li key={i}>
                  {k.naziv || `Kos ${i + 1}`}
                  {k.nacinCene !== "kos" && k.dolzina && k.sirina ? ` — ${k.dolzina} × ${k.sirina} × ${k.debelina || "2"} cm` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {nalog.opombe && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
            <span className="text-xs text-gray-400 uppercase block mb-0.5">Opombe</span>
            {nalog.opombe}
          </div>
        )}

        {nalog.podpisPrevzemnika ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-8 mt-6 pt-2">
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Blago izdal</p>
              <div className="border-b border-gray-400 h-12" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Blago prevzel: {nalog.podpisIme}</p>
              <img src={nalog.podpisPrevzemnika} alt="Podpis prevzemnika" className="h-14 object-contain" />
              <p className="text-[10px] text-gray-400">Podpisano: {nalog.podpisDatum ? new Date(nalog.podpisDatum).toLocaleString("sl-SI") : ""}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-8 mt-6 pt-2">
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Blago izdal</p>
              <div className="border-b border-gray-400 h-12" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Blago prevzel (podpis)</p>
              <div className="border-b border-gray-400 h-12" />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 pt-2 border-t border-gray-200">
          Kamnoseštvo Čakš · 031 235 146
        </p>
      </div>

      {podpisovanje && (
        <PodpisniPadPulti
          zacetnoIme={nalog.stranka?.ime || ""}
          onPreklici={() => setPodpisovanje(false)}
          onShrani={(podatkiPodpisa, ime) => {
            shraniPodpis(nalog, podatkiPodpisa, ime);
            setPodpisovanje(false);
          }}
        />
      )}
    </div>
  );
}
