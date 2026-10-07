"use client";

// ===================== INVENTURA =====================
// Pregled vseh plošč (in kosov), ki jih imamo na zalogi — po materialu in debelini, po kosih in po m².
// Podatki so v modulu Material (ista zaloga, isti strežnik): vsaka plošča je tam vpisana enkrat,
// Inventura jih samo sešteje. Nove plošče se lahko vpišejo kar tukaj (gumb "Dodaj plošče") —
// zapišejo se v zalogo Materiala, zato so takoj vidne tudi tam (QR nalepka, rezervacije, rezanje).

import { useState, useEffect, useRef } from "react";

// ===================== NASTAVITVE =====================

const OBDELAVE = ["Poliran", "Žgan", "Krtačen", "Peskan", "Mat (honed)", "Brušen", "Surov", "Antik"];

const PRIVZETI_MATERIALI = [
  "Rosa Beta", "Giandone", "Bianco Sardo", "Azul Tragal", "Rosa Porino",
  "Umetni marmor bela z piko", "Umetni marmor bela z liso", "Juparana Columbo", "Multicolor",
  "Nero Impala", "Wiscont White", "Tonalit", "Steel Gray", "Ivory Brown", "Siwakashi",
  "Paradiso", "Black Galaxy", "Nero Assoluto", "Jet Black",
];

const VRSTE = {
  plosca: { naziv: "Plošča", ikona: "🪨", predpona: "PL", oblike: ["plošča", "plošči", "plošče", "plošč"] },
  kos: { naziv: "Kos", ikona: "🧩", predpona: "KS", oblike: ["kos", "kosa", "kosi", "kosov"] },
};

const OBLIKE_KOS = ["kos", "kosa", "kosi", "kosov"];

const FILTRI = [
  { id: "plosca", naziv: "Cele plošče", ikona: "🪨" },
  { id: "kos", naziv: "Kosi", ikona: "🧩" },
  { id: "vse", naziv: "Vse", ikona: "📋" },
];

const NASLOVI_SKUPAJ = {
  plosca: "Cele plošče — skupaj",
  kos: "Kosi — skupaj",
  vse: "Plošče in kosi — skupaj",
};

// ===================== ČISTA LOGIKA (brez React-a, preizkušena) =====================

function sklStevilo(v) {
  if (typeof v === "object" && v !== null) return 0;
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function sklNorm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Besedilo, ki ga je varno izpisati (nikoli objekt, ki bi ob izrisu sesul stran).
function tekst(v) {
  return v === null || v === undefined || typeof v === "object" ? "" : String(v);
}

function povrsinaM2(a) {
  const d = sklStevilo(a && a.dolzina);
  const s = sklStevilo(a && a.sirina);
  const m2 = d > 0 && s > 0 ? (d * s) / 10000 : 0;
  return Number.isFinite(m2) ? m2 : 0;
}

// Plošča je "pri nas", dokler ni porabljena (na zalogi ali rezervirana za nalog).
function jePriNas(a) {
  return !!a && (a.status === "zaloga" || a.status === "rezervirano");
}

// Slovenski sklon po številu: 1 kos, 2 kosa, 3-4 kosi, 5+ kosov.
function beseda(n, oblike) {
  const m = Math.abs(n) % 100;
  if (m === 1) return oblike[0];
  if (m === 2) return oblike[1];
  if (m === 3 || m === 4) return oblike[2];
  return oblike[3];
}

function m2Besedilo(x) {
  return (Number(x) || 0).toFixed(2);
}

// 2 -> "2", 2.5 -> "2.5", 1.25 -> "1.25"
function prikaziStevilo(x) {
  return String(Number((Number(x) || 0).toFixed(2)));
}

function ustvariId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function naslednjaKoda(seznam, vrsta) {
  const pred = VRSTE[vrsta].predpona + "-";
  let max = 0;
  (seznam || []).forEach((a) => {
    if (a && a.vrsta === vrsta && typeof a.koda === "string" && a.koda.startsWith(pred)) {
      const n = parseInt(a.koda.slice(pred.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return pred + String(max + 1).padStart(4, "0");
}

// Isto iskanje kot v Materialu (koda, material, lokacija, obdelava, opombe, nalog, mere).
function ujemaIskanje(a, q) {
  if (!String(q || "").trim()) return true;
  const niz = sklNorm(
    `${tekst(a.koda)} ${tekst(a.material)} ${tekst(a.lokacija)} ${tekst(a.obdelava)} ${tekst(a.opombe)} ${tekst(a.nalog)} ${tekst(a.dolzina)}x${tekst(a.sirina)}x${tekst(a.debelina)}`
  );
  return sklNorm(q)
    .split(" ")
    .every((b) => niz.includes(b));
}

function kljucDebeline(d) {
  return d > 0 ? String(Math.round(d * 100)) : "0";
}

function oznakaDebeline(d) {
  return d > 0 ? `${prikaziStevilo(d)} cm` : "debelina ni vpisana";
}

function opisMer(a) {
  const d = sklStevilo(a && a.dolzina);
  const s = sklStevilo(a && a.sirina);
  return d > 0 && s > 0 ? `${prikaziStevilo(d)} × ${prikaziStevilo(s)} cm` : "mere niso vpisane";
}

function znesek() {
  return { kosov: 0, m2: 0, rezervirano: { kosov: 0, m2: 0 } };
}

function pristej(z, m2, rezervirano) {
  z.kosov += 1;
  z.m2 += m2;
  if (rezervirano) {
    z.rezervirano.kosov += 1;
    z.rezervirano.m2 += m2;
  }
}

const primerjajBesedilo = (a, b) => String(a).localeCompare(String(b), "sl", { sensitivity: "base", numeric: true });

// Sešteje plošče (ali kose) po materialu in debelini.
// Vrne { materiali: [{ kljuc, ime, kosov, m2, rezervirano, debeline: [{ kljuc, debelina, oznaka, kosov, m2, rezervirano, artikli }] }], skupaj }
function sestaviInventuro(artikli, opcije) {
  const o = opcije || {};
  const vrsta = o.vrsta === "kos" || o.vrsta === "vse" ? o.vrsta : "plosca";
  const iskanje = o.iskanje || "";
  const materiali = new Map();
  const skupaj = znesek();
  (Array.isArray(artikli) ? artikli : []).forEach((a) => {
    if (!a || typeof a !== "object" || !jePriNas(a)) return;
    if (vrsta !== "vse" && a.vrsta !== vrsta) return;
    if (!ujemaIskanje(a, iskanje)) return;
    const m2 = povrsinaM2(a);
    const rezervirano = a.status === "rezervirano";
    const ime = tekst(a.material).trim() || "Brez imena";
    const km = sklNorm(ime);
    let m = materiali.get(km);
    if (!m) {
      m = { kljuc: km, ime, ...znesek(), debeline: new Map() };
      materiali.set(km, m);
    }
    const d = sklStevilo(a.debelina);
    const kd = kljucDebeline(d);
    let g = m.debeline.get(kd);
    if (!g) {
      g = { kljuc: `${km}|${kd}`, debelina: d > 0 ? Math.round(d * 100) / 100 : 0, oznaka: oznakaDebeline(d), ...znesek(), artikli: [] };
      m.debeline.set(kd, g);
    }
    pristej(skupaj, m2, rezervirano);
    pristej(m, m2, rezervirano);
    pristej(g, m2, rezervirano);
    g.artikli.push(a);
  });
  const rezultat = Array.from(materiali.values()).map((m) => {
    const debeline = Array.from(m.debeline.values()).sort((x, y) => {
      if (x.debelina === 0 && y.debelina !== 0) return 1;
      if (y.debelina === 0 && x.debelina !== 0) return -1;
      return x.debelina - y.debelina;
    });
    debeline.forEach((g) => g.artikli.sort((x, y) => primerjajBesedilo(tekst(x.koda), tekst(y.koda))));
    return { ...m, debeline };
  });
  rezultat.sort((x, y) => primerjajBesedilo(x.ime, y.ime));
  return { materiali: rezultat, skupaj };
}

// Število kosov in m² po vrstah (neodvisno od iskanja) — za številke na gumbih.
function stevilaPoVrstah(artikli) {
  const r = { plosca: znesek(), kos: znesek(), vse: znesek() };
  (Array.isArray(artikli) ? artikli : []).forEach((a) => {
    if (!a || typeof a !== "object" || !jePriNas(a)) return;
    const m2 = povrsinaM2(a);
    const rezervirano = a.status === "rezervirano";
    pristej(r.vse, m2, rezervirano);
    if (a.vrsta === "plosca") pristej(r.plosca, m2, rezervirano);
    else if (a.vrsta === "kos") pristej(r.kos, m2, rezervirano);
  });
  return r;
}

// Vrstice za CSV (Excel s slovenskimi nastavitvami: ločilo ; in decimalna vejica).
function vrsticeCSV(rezultat) {
  const st = (x) => m2Besedilo(x).replace(".", ",");
  const glave = ["Material", "Debelina (cm)", "Kosov", "m²", "Od tega rezervirano (kosov)", "Od tega rezervirano (m²)"];
  const vrstice = [];
  rezultat.materiali.forEach((m) =>
    m.debeline.forEach((d) =>
      vrstice.push([m.ime, d.debelina > 0 ? prikaziStevilo(d.debelina).replace(".", ",") : "", d.kosov, st(d.m2), d.rezervirano.kosov, st(d.rezervirano.m2)])
    )
  );
  vrstice.push(["SKUPAJ", "", rezultat.skupaj.kosov, st(rezultat.skupaj.m2), rezultat.skupaj.rezervirano.kosov, st(rezultat.skupaj.rezervirano.m2)]);
  return [glave, ...vrstice];
}

function besediloCSV(vrstice) {
  const ubezi = (v) => {
    let s = String(v ?? "");
    if (typeof v === "string" && /^[=+\-@]/.test(s)) s = "'" + s; // varovalka pred formulami v Excelu
    return s.includes(";") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return vrstice.map((r) => r.map(ubezi).join(";")).join("\r\n");
}

function prazenVnos(vrsta) {
  return { vrsta, material: "", dolzina: "", sirina: "", debelina: "", steviloKosov: "1", obdelava: "", lokacija: "" };
}

// ===================== STRAN =====================

export default function Inventura() {
  const [artikli, setArtikli] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napakaNalaganja, setNapakaNalaganja] = useState("");
  const [sporocilo, setSporocilo] = useState("");
  const [vrsta, setVrsta] = useState("plosca");
  const [iskanje, setIskanje] = useState("");
  const [odprte, setOdprte] = useState({});
  const [tisk, setTisk] = useState(null); // { podrobno } med tiskanjem
  const [obrazecOdprt, setObrazecOdprt] = useState(false);
  const [f, setF] = useState(() => prazenVnos("plosca"));
  const [napakaObrazca, setNapakaObrazca] = useState("");
  const [shranjujem, setShranjujem] = useState(false);
  const [predlogiMaterialov, setPredlogiMaterialov] = useState(PRIVZETI_MATERIALI);

  const verzijaRef = useRef(0);
  const zasedenoRef = useRef(false);
  const dolzinaRef = useRef(null);

  async function nalozi() {
    try {
      const res = await fetch("/api/material", { cache: "no-store" });
      const p = await res.json();
      if (!res.ok || !Array.isArray(p)) return false;
      verzijaRef.current = Number(res.headers.get("X-Verzija")) || 0;
      setArtikli(p);
      setNapakaNalaganja("");
      return true;
    } catch (e) {
      return false;
    }
  }

  useEffect(() => {
    let ziv = true;
    (async () => {
      const uspeh = await nalozi();
      if (!ziv) return;
      if (!uspeh) setNapakaNalaganja("Podatkov o zalogi ni bilo mogoče naložiti. Preveri povezavo in poskusi znova.");
      setNalaganje(false);
    })();

    // Imena materialov iz cenikov (da se ujemajo z imeni v delovnih nalogih) — samo predlogi pri vnosu.
    (async () => {
      try {
        const imena = [...PRIVZETI_MATERIALI];
        try {
          const c = await fetch("/api/cenik-police", { cache: "no-store" }).then((r) => r.json());
          if (c && typeof c === "object") {
            Object.values(c).forEach((g) => (g && Array.isArray(g.materiali) ? g.materiali.forEach((m) => imena.push(m)) : null));
          }
        } catch (e) {}
        try {
          const c = await fetch("/api/cenik-pulti", { cache: "no-store" }).then((r) => r.json());
          if (c && Array.isArray(c.materiali)) c.materiali.forEach((m) => (m && m.naziv ? imena.push(m.naziv) : null));
        } catch (e) {}
        const videni = new Set();
        const cisti = imena.filter((i) => {
          const k = sklNorm(i);
          if (!k || videni.has(k)) return false;
          videni.add(k);
          return typeof i === "string";
        });
        if (ziv) setPredlogiMaterialov(cisti);
      } catch (e) {}
    })();
    return () => {
      ziv = false;
    };
  }, []);

  if (nalaganje) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Nalagam …</div>;
  }

  // ---------- izračuni ----------
  const rezultat = sestaviInventuro(artikli, { vrsta, iskanje });
  const stevila = stevilaPoVrstah(artikli);
  const vsiKljuci = rezultat.materiali.flatMap((m) => m.debeline.map((d) => d.kljuc));
  const iskanjeAktivno = iskanje.trim() !== "";
  const jeOdprta = (k) => (tisk ? !!tisk.podrobno : odprte[k] !== undefined ? !!odprte[k] : iskanjeAktivno);
  const predlogiMaterialovVsi = (() => {
    const videni = new Set();
    return [...predlogiMaterialov, ...artikli.map((a) => tekst(a && a.material).trim())].filter((m) => {
      const k = sklNorm(m);
      if (!k || videni.has(k)) return false;
      videni.add(k);
      return true;
    });
  })();
  const predlogiLokacij = Array.from(new Set(artikli.map((a) => tekst(a && a.lokacija).trim()).filter(Boolean))).sort(primerjajBesedilo);
  const drugaVrsta = vrsta === "plosca" ? "kos" : vrsta === "kos" ? "plosca" : null;
  const drugo = drugaVrsta ? stevila[drugaVrsta] : null;

  const m2Ene = povrsinaM2({ dolzina: f.dolzina, sirina: f.sirina });
  const stKosov = parseInt(String(f.steviloKosov).trim(), 10);

  // ---------- dejanja ----------
  function preklopi(k) {
    setOdprte((o) => ({ ...o, [k]: !jeOdprta(k) }));
  }

  function razsiriVse(odprto) {
    const o = {};
    vsiKljuci.forEach((k) => (o[k] = odprto));
    setOdprte(o);
  }

  function nastavi(polje, vrednost) {
    setF((p) => ({ ...p, [polje]: vrednost }));
  }

  function preklopiObrazec() {
    if (obrazecOdprt) {
      setObrazecOdprt(false);
      return;
    }
    setNapakaObrazca("");
    setSporocilo("");
    setF((p) => ({ ...p, vrsta: vrsta === "kos" ? "kos" : "plosca" }));
    setObrazecOdprt(true);
  }

  async function dodaj() {
    if (zasedenoRef.current) return;
    setSporocilo("");
    setNapakaObrazca("");
    const material = tekst(f.material).trim();
    const d = sklStevilo(f.dolzina);
    const s = sklStevilo(f.sirina);
    const deb = sklStevilo(f.debelina);
    const n = parseInt(String(f.steviloKosov).trim(), 10);
    const manjka = [];
    if (!material) manjka.push("ime materiala");
    if (!(d > 0)) manjka.push("dolžino");
    if (!(s > 0)) manjka.push("širino");
    if (!(deb > 0)) manjka.push("debelino");
    if (!(n >= 1)) manjka.push("število kosov");
    if (manjka.length) {
      setNapakaObrazca(`Vpiši še: ${manjka.join(", ")}.`);
      return;
    }
    if (n > 50) {
      setNapakaObrazca("Naenkrat lahko dodaš največ 50 kosov. Za več ponovi vnos.");
      return;
    }
    if (f.vrsta === "plosca" && (d < 30 || s < 30)) {
      if (!confirm(`Mere so v centimetrih. Res je plošča ${prikaziStevilo(d)} × ${prikaziStevilo(s)} cm?`)) return;
    }
    if (n >= 10) {
      if (!confirm(`Dodam ${n} × ${material}, ${prikaziStevilo(d)} × ${prikaziStevilo(s)} cm (skupaj ${m2Besedilo((n * d * s) / 10000)} m²)?`)) return;
    }

    zasedenoRef.current = true;
    setShranjujem(true);
    try {
      // 1) najnovejše stanje zaloge (nikoli ne pišemo na podlagi neznanega seznama)
      let sveze;
      let verzija;
      try {
        const res = await fetch("/api/material", { cache: "no-store" });
        const p = await res.json();
        if (!res.ok || !Array.isArray(p)) throw new Error("neveljaven odgovor");
        sveze = p;
        verzija = Number(res.headers.get("X-Verzija")) || 0;
      } catch (e) {
        setNapakaObrazca("Najnovejšega stanja zaloge ni bilo mogoče prebrati, zato ni bilo nič dodano. Preveri povezavo in poskusi znova.");
        return;
      }

      // 2) nove plošče/kosi — enaka oblika kot v modulu Material
      const zdaj = new Date().toISOString();
      const novi = [];
      for (let i = 0; i < n; i++) {
        novi.push({
          id: ustvariId(),
          vrsta: f.vrsta,
          material,
          dolzina: tekst(f.dolzina).trim(),
          sirina: tekst(f.sirina).trim(),
          debelina: tekst(f.debelina).trim(),
          obdelava: tekst(f.obdelava).trim(),
          cenaM2: "",
          lokacija: tekst(f.lokacija).trim(),
          opombe: "",
          slika: null,
          izvorId: "",
          izvorKoda: "",
          koda: naslednjaKoda([...novi, ...sveze], f.vrsta),
          status: "zaloga",
          nalog: "",
          datumVnosa: zdaj,
          zgodovina: [{ status: "zaloga", datum: zdaj, nalog: "" }],
        });
      }
      const seznam = [...novi, ...sveze];

      // 3) shranjevanje z nadzorom različice (če je medtem kdo spremenil zalogo, strežnik zavrne)
      let res;
      try {
        res = await fetch("/api/material", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seznam, pricakovanaVerzija: verzija }),
        });
      } catch (e) {
        setNapakaObrazca("Napaka pri shranjevanju. Preveri povezavo in poglej, ali so plošče že v seznamu, preden poskusiš znova.");
        return;
      }
      const odgovor = await res.json().catch(() => ({}));
      if (res.status === 409) {
        await nalozi();
        setNapakaObrazca(
          odgovor.zastarelaAplikacija
            ? "Aplikacija na tej napravi je zastarela. Osveži stran (F5)."
            : "Nekdo drug je medtem spremenil zalogo. Seznam je osvežen na najnovejše stanje — preveri in poskusi znova."
        );
        return;
      }
      if (!res.ok) {
        setNapakaObrazca(`Shranjevanje ni uspelo (${res.status}). ${tekst(odgovor.napaka)}`.trim());
        return;
      }

      verzijaRef.current = odgovor.verzija !== undefined ? Number(odgovor.verzija) || 0 : verzijaRef.current;
      setArtikli(seznam);
      const kode = n === 1 ? novi[0].koda : `${novi[0].koda} – ${novi[n - 1].koda}`;
      setSporocilo(
        `Dodano: ${n} ${beseda(n, VRSTE[f.vrsta].oblike)} ${material} ${prikaziStevilo(d)} × ${prikaziStevilo(s)} cm (${kode}) · skupaj ${m2Besedilo((n * d * s) / 10000)} m². Vpisano je tudi v modulu Material.`
      );
      // pokaži rezultat: ustrezna vrsta, brez iskanja, odprta skupina z novimi kosi
      if (vrsta !== "vse" && vrsta !== f.vrsta) setVrsta(f.vrsta);
      setIskanje("");
      setOdprte((o) => ({ ...o, [`${sklNorm(material)}|${kljucDebeline(deb)}`]: true }));
      setF((p) => ({ ...p, dolzina: "", sirina: "", steviloKosov: "1" }));
      setTimeout(() => {
        try {
          if (dolzinaRef.current) dolzinaRef.current.focus();
        } catch (e) {}
      }, 0);
    } finally {
      zasedenoRef.current = false;
      setShranjujem(false);
    }
  }

  function natisni(podrobno) {
    setTisk({ podrobno });
    const konec = () => setTisk(null);
    window.addEventListener("afterprint", konec, { once: true });
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        konec();
      }
    }, 80);
    setTimeout(konec, 20000);
  }

  function izvoziCSV() {
    const csv = besediloCSV(vrsticeCSV(rezultat));
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    const kaj = vrsta === "plosca" ? "plosc" : vrsta === "kos" ? "kosov" : "zaloge";
    el.download = `inventura-${kaj}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    // povezave na datoteko ne sprostimo takoj — nekateri brskalniki (Safari na iPhonu) prenos začnejo šele malo kasneje
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-base bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";
  const navGumb = "text-xs bg-gray-800 px-3 py-2 rounded-lg";
  const nazivFiltra = (FILTRI.find((x) => x.id === vrsta) || FILTRI[0]).naziv;
  const danes = new Date().toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-100 pb-24 inv-koren">
      <style>{`
        .inv-natis-naslov { display: none; }
        @media print {
          @page { size: A4; margin: 12mm; }
          .inv-glava, .inv-orodja, .inv-obrazec, .inv-sporocilo, .inv-filtri, .inv-brez-tiska { display: none !important; }
          .inv-koren { background: #fff !important; min-height: 0 !important; padding: 0 !important; }
          .inv-natis-naslov { display: block !important; margin: 0 0 8px 0; }
          .inv-kartica { box-shadow: none !important; border: 1px solid #888 !important; break-inside: avoid; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 flex-wrap gap-2 inv-glava">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Inventura</span>
          </div>
          <div className="text-xs text-gray-400">Plošče, ki jih imamo — po kosih in po m²</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/" className={navGumb}>Police</a>
          <a href="/pulti" className={navGumb}>Pulti</a>
          <a href="/spomeniki" className={navGumb}>Spomeniki</a>
          <a href="/sestanki" className={navGumb}>Sestanki</a>
          <a href="/material" className={navGumb}>🪨 Material</a>
          <a href="/skladisce" className={navGumb}>📦 Skladišče</a>
          <button
            onClick={() => {
              window.location.href = window.location.pathname + "?osvezeno=" + Date.now();
            }}
            className={navGumb}
          >
            ⟳ Osveži
          </button>
        </div>
      </div>

      {napakaNalaganja && (
        <div className="bg-red-600 text-white text-sm px-4 py-3 flex items-center justify-between gap-3 inv-glava" role="alert">
          <span>{napakaNalaganja}</span>
          <button
            onClick={async () => {
              const uspeh = await nalozi();
              if (!uspeh) setNapakaNalaganja("Podatkov o zalogi še vedno ni mogoče naložiti. Preveri povezavo in poskusi znova.");
            }}
            className="bg-white text-red-700 font-semibold rounded-lg px-3 py-1.5 shrink-0"
          >
            Poskusi znova
          </button>
        </div>
      )}

      {!napakaNalaganja && (
      <div className="max-w-3xl mx-auto p-3 space-y-3">
        <div className="inv-natis-naslov">
          <div style={{ fontSize: 18, fontWeight: 700 }}>Kamnoseštvo Čakš — Inventura: {NASLOVI_SKUPAJ[vrsta].replace(" — skupaj", "").toLowerCase()}</div>
          <div style={{ fontSize: 12 }}>
            Stanje na dan {danes}
            {iskanjeAktivno ? ` · filter: »${iskanje.trim()}«` : ""}
          </div>
        </div>

        {/* Vrsta: plošče / kosi / vse */}
        <div className="grid grid-cols-3 gap-2 inv-filtri">
          {FILTRI.map((x) => {
            const aktiven = vrsta === x.id;
            const st = stevila[x.id];
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => setVrsta(x.id)}
                aria-pressed={aktiven}
                className={`rounded-xl py-2.5 px-2 text-center border-2 transition-colors ${
                  aktiven ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                <div className="text-xl leading-none">{x.ikona}</div>
                <div className="font-bold text-sm mt-1">{x.naziv}</div>
                <div className={`text-xs ${aktiven ? "text-gray-300" : "text-gray-500"}`}>
                  {st.kosov} {beseda(st.kosov, OBLIKE_KOS)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skupaj */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 inv-kartica" data-skupaj>
          <div className="text-xs uppercase tracking-wide text-gray-500">{NASLOVI_SKUPAJ[vrsta]}</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <div className="text-3xl font-extrabold leading-none" data-skupaj-kosov>{rezultat.skupaj.kosov}</div>
              <div className="text-xs text-gray-500 mt-1">{beseda(rezultat.skupaj.kosov, OBLIKE_KOS)}</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold leading-none" data-skupaj-m2>{m2Besedilo(rezultat.skupaj.m2)}</div>
              <div className="text-xs text-gray-500 mt-1">m²</div>
            </div>
          </div>
          {rezultat.skupaj.rezervirano.kosov > 0 && (
            <div className="text-xs text-amber-700 mt-2">
              od tega rezervirano za naloge: {rezultat.skupaj.rezervirano.kosov} {beseda(rezultat.skupaj.rezervirano.kosov, OBLIKE_KOS)} · {m2Besedilo(rezultat.skupaj.rezervirano.m2)} m²
            </div>
          )}
          {drugo && drugo.kosov > 0 && (
            <div className="text-xs text-gray-500 mt-2 inv-brez-tiska">
              {drugaVrsta === "kos" ? "Kosi niso všteti" : "Cele plošče niso vštete"}: {drugo.kosov} {beseda(drugo.kosov, OBLIKE_KOS)} · {m2Besedilo(drugo.m2)} m².{" "}
              <button type="button" onClick={() => setVrsta(drugaVrsta)} className="underline text-red-600">
                Pokaži
              </button>
            </div>
          )}
        </div>

        {/* Orodja */}
        <div className="flex flex-wrap gap-2 inv-orodja">
          <button
            type="button"
            onClick={preklopiObrazec}
            aria-expanded={obrazecOdprt}
            className="bg-red-600 text-white text-sm font-bold rounded-lg px-4 py-2.5"
          >
            {obrazecOdprt ? "✕ Zapri vnos" : "+ Dodaj plošče"}
          </button>
          <input
            type="search"
            value={iskanje}
            onChange={(e) => setIskanje(e.target.value)}
            placeholder="Išči material, lokacijo"
            aria-label="Iskanje"
            className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-base bg-white"
          />
        </div>

        {sporocilo && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm rounded-lg px-3 py-2 inv-sporocilo" role="status" data-sporocilo>
            {sporocilo}
          </div>
        )}

        {/* Vnos novih plošč */}
        {obrazecOdprt && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dodaj();
            }}
            className="bg-white rounded-xl border-2 border-red-200 p-3 space-y-3 inv-obrazec"
            data-obrazec
          >
            <div className="font-bold">Vnos v zalogo</div>
            <div className="grid grid-cols-2 gap-2">
              {["plosca", "kos"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => nastavi("vrsta", v)}
                  aria-pressed={f.vrsta === v}
                  className={`rounded-lg py-2 text-sm font-semibold border-2 ${
                    f.vrsta === v ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {VRSTE[v].ikona} {VRSTE[v].naziv}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="inv-material" className={lbl}>Material</label>
              <input
                id="inv-material"
                list="inv-predlogi-materialov"
                value={f.material}
                onChange={(e) => nastavi("material", e.target.value)}
                className={inp}
                placeholder="npr. Rosa Beta"
                autoComplete="off"
              />
              <datalist id="inv-predlogi-materialov">
                {predlogiMaterialovVsi.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="inv-dolzina" className={lbl}>Dolžina (cm)</label>
                <input id="inv-dolzina" ref={dolzinaRef} value={f.dolzina} onChange={(e) => nastavi("dolzina", e.target.value)} className={inp} inputMode="decimal" />
              </div>
              <div>
                <label htmlFor="inv-sirina" className={lbl}>Širina (cm)</label>
                <input id="inv-sirina" value={f.sirina} onChange={(e) => nastavi("sirina", e.target.value)} className={inp} inputMode="decimal" />
              </div>
              <div>
                <label htmlFor="inv-debelina" className={lbl}>Debelina (cm)</label>
                <input id="inv-debelina" value={f.debelina} onChange={(e) => nastavi("debelina", e.target.value)} className={inp} inputMode="decimal" />
              </div>
              <div>
                <label htmlFor="inv-kosov" className={lbl}>Število kosov (enakih)</label>
                <input id="inv-kosov" value={f.steviloKosov} onChange={(e) => nastavi("steviloKosov", e.target.value)} className={inp} inputMode="numeric" />
              </div>
              <div>
                <label htmlFor="inv-obdelava" className={lbl}>Obdelava (neobvezno)</label>
                <select id="inv-obdelava" value={f.obdelava} onChange={(e) => nastavi("obdelava", e.target.value)} className={inp}>
                  <option value="">— brez —</option>
                  {OBDELAVE.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-lokacija" className={lbl}>Lokacija (neobvezno)</label>
                <input
                  id="inv-lokacija"
                  list="inv-predlogi-lokacij"
                  value={f.lokacija}
                  onChange={(e) => nastavi("lokacija", e.target.value)}
                  className={inp}
                  placeholder="npr. Regal A / 2"
                  autoComplete="off"
                />
                <datalist id="inv-predlogi-lokacij">
                  {predlogiLokacij.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
            </div>
            {m2Ene > 0 && (
              <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2" data-predogled>
                Površina: <b>{m2Besedilo(m2Ene)} m²</b>
                {stKosov > 1 ? (
                  <>
                    {" "}· skupaj {stKosov} × {m2Besedilo(m2Ene)} = <b>{m2Besedilo(stKosov * m2Ene)} m²</b>
                  </>
                ) : null}
              </div>
            )}
            {napakaObrazca && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert" data-napaka-obrazca>
                {napakaObrazca}
              </div>
            )}
            <button
              type="submit"
              disabled={shranjujem}
              className="w-full bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg py-3 text-base"
            >
              {shranjujem ? "Shranjujem …" : "Dodaj v zalogo"}
            </button>
          </form>
        )}

        {/* Seznam po materialu in debelini */}
        {rezultat.materiali.length > 0 && (
          <div className="flex items-center justify-between inv-orodja">
            <div className="text-sm font-semibold text-gray-700">Po materialu in debelini</div>
            <div className="flex gap-3 text-xs">
              <button type="button" onClick={() => razsiriVse(true)} className="underline text-gray-600">Razširi vse</button>
              <button type="button" onClick={() => razsiriVse(false)} className="underline text-gray-600">Skrči vse</button>
            </div>
          </div>
        )}

        {rezultat.materiali.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-600 inv-kartica" data-prazno>
            {iskanjeAktivno ? (
              <>Nič ne ustreza iskanju »{iskanje.trim()}«.</>
            ) : vrsta === "plosca" ? (
              <>V Materialu še ni vpisane nobene cele plošče. Vpiši jih z gumbom »Dodaj plošče«.</>
            ) : vrsta === "kos" ? (
              <>Na zalogi ni nobenega kosa.</>
            ) : (
              <>Zaloga je prazna.</>
            )}
          </div>
        )}

        {rezultat.materiali.map((m) => (
          <div key={m.kljuc} className="bg-white rounded-xl border border-gray-200 overflow-hidden inv-kartica" data-material={m.ime}>
            <div className="px-3 py-2 flex items-start justify-between gap-3 bg-gray-50">
              <div className="font-bold text-gray-900 break-words min-w-0">{m.ime}</div>
              <div className="text-right shrink-0">
                <div className="font-bold">
                  {m.kosov} {beseda(m.kosov, OBLIKE_KOS)}
                </div>
                <div className="text-xs text-gray-600">{m2Besedilo(m.m2)} m²</div>
              </div>
            </div>
            {m.debeline.map((g) => {
              const odprta = jeOdprta(g.kljuc);
              return (
                <div key={g.kljuc} className="border-t border-gray-100" data-skupina={g.kljuc}>
                  <button
                    type="button"
                    onClick={() => preklopi(g.kljuc)}
                    aria-expanded={odprta}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-3 inv-brez-tiska" aria-hidden="true">{odprta ? "▾" : "▸"}</span>
                      <b>{g.oznaka}</b>
                    </span>
                    <span className="text-sm text-right">
                      <b>{g.kosov}</b> {beseda(g.kosov, OBLIKE_KOS)} · <b>{m2Besedilo(g.m2)} m²</b>
                    </span>
                  </button>
                  {odprta && (
                    <ul className="bg-gray-50/60">
                      {g.artikli.map((a, i) => (
                        <li key={tekst(a.id) || `i${i}`} className="border-t border-gray-100">
                          <a
                            href={`/material?id=${encodeURIComponent(tekst(a.id))}&ogled=1`}
                            className="flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-100"
                          >
                            <div className="min-w-0">
                              <div>
                                <b>{tekst(a.koda) || "brez kode"}</b> · {opisMer(a)}
                                {tekst(a.obdelava) ? ` · ${tekst(a.obdelava)}` : ""}
                              </div>
                              <div className="text-xs text-gray-500 truncate">📍 {tekst(a.lokacija) || "lokacija ni vpisana"}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div>{m2Besedilo(povrsinaM2(a))} m²</div>
                              {a.status === "rezervirano" && (
                                <div className="text-[11px] text-amber-700">
                                  Rezervirano{tekst(a.nalog) ? ` · ${tekst(a.nalog)}` : ""}
                                </div>
                              )}
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Tisk in izvoz */}
        {rezultat.materiali.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 inv-orodja">
            <div className="text-xs text-gray-500 mb-2">Tisk in izvoz (velja za prikazano: {nazivFiltra.toLowerCase()}{iskanjeAktivno ? ", z iskanjem" : ""})</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => natisni(false)} className="text-sm bg-gray-800 text-white rounded-lg px-3 py-2">
                🖨 Natisni povzetek
              </button>
              <button type="button" onClick={() => natisni(true)} className="text-sm bg-gray-800 text-white rounded-lg px-3 py-2">
                🖨 Natisni s seznamom plošč
              </button>
              <button type="button" onClick={izvoziCSV} className="text-sm bg-gray-800 text-white rounded-lg px-3 py-2">
                ⬇ Izvozi CSV (Excel)
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
