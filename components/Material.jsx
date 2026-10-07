"use client";

import { useState, useEffect, useRef } from "react";

const ADMIN_PIN = "1991";
const BAZNI_URL = "https://delavni-nalog-caks.vercel.app";

const STATUSI = [
  { id: "zaloga", naziv: "Na zalogi" },
  { id: "rezervirano", naziv: "Rezervirano" },
  { id: "porabljeno", naziv: "Porabljeno" },
];

const STATUS_BARVE = {
  zaloga: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rezervirano: "bg-amber-100 text-amber-800 border-amber-300",
  porabljeno: "bg-stone-200 text-stone-600 border-stone-300",
};

const KARTICA_OBROBA = {
  zaloga: "border-emerald-200",
  rezervirano: "border-amber-300",
  porabljeno: "border-stone-200 opacity-70",
};

const VRSTE = {
  plosca: { naziv: "Plošča", mnozina: "Cele plošče", ikona: "🪨", predpona: "PL", oblike: ["plošča", "plošči", "plošče", "plošč"] },
  kos: { naziv: "Kos", mnozina: "Kosi", ikona: "🧩", predpona: "KS", oblike: ["kos", "kosa", "kosi", "kosov"] },
};

const OBDELAVE = ["Poliran", "Žgan", "Krtačen", "Peskan", "Mat (honed)", "Brušen", "Surov", "Antik"];

const PRIVZETI_MATERIALI = [
  "Rosa Beta", "Giandone", "Bianco Sardo", "Azul Tragal", "Rosa Porino",
  "Umetni marmor bela z piko", "Umetni marmor bela z liso", "Juparana Columbo", "Multicolor",
  "Nero Impala", "Wiscont White", "Tonalit", "Steel Gray", "Ivory Brown", "Siwakashi",
  "Paradiso", "Black Galaxy", "Nero Assoluto", "Jet Black",
];

const VELIKOSTI_NALEPKE = {
  "100x60": { w: 100, h: 60, qr: 26, naziv: "100 × 60 mm" },
  "100x100": { w: 100, h: 100, qr: 34, naziv: "100 × 100 mm" },
  A6: { w: 105, h: 148, qr: 42, naziv: "A6 (105 × 148 mm)" },
};

// ===================== ČISTA LOGIKA (brez React-a, preizkušena) =====================

function sklStevilo(v) {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function sklNorm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Ali kos (kos.dolzina × kos.sirina) vsebuje zahtevani kos d × s? Dovoli tudi obrnjeno (zasukano) prileganje.
function sklPrileganje(kos, d, s) {
  const kd = sklStevilo(kos.dolzina);
  const ks = sklStevilo(kos.sirina);
  const e = 0.001;
  if (kd + e >= d && ks + e >= s) return { ok: true, obrnjeno: false };
  if (kd + e >= s && ks + e >= d) return { ok: true, obrnjeno: true };
  return { ok: false, obrnjeno: false };
}

// Poišče artikle iz skladišča, ki ustrezajo zahtevi { material, debelina, dolzina, sirina } (v cm).
// Najprej gredo tisti z najmanj odpadka (najmanjši še zadosten kos).
// nalogStevilka: kosi, rezervirani za ta nalog, se še vedno štejejo kot ustrezni.
function sklPoisciKose(seznam, zahteva, nalogStevilka, vkljuciPlosce) {
  const mat = sklNorm(zahteva.material);
  const d = sklStevilo(zahteva.dolzina);
  const s = sklStevilo(zahteva.sirina);
  const deb = sklStevilo(zahteva.debelina);
  if (d <= 0 || s <= 0) return [];
  return (seznam || [])
    .filter((k) => {
      if (k.vrsta !== "kos" && !(vkljuciPlosce && k.vrsta === "plosca")) return false;
      const prost = k.status === "zaloga" || (k.status === "rezervirano" && nalogStevilka && sklNorm(k.nalog) === sklNorm(nalogStevilka));
      if (!prost) return false;
      if (mat && sklNorm(k.material) !== mat) return false;
      if (deb > 0 && Math.abs(sklStevilo(k.debelina) - deb) > 0.05) return false;
      return sklPrileganje(k, d, s).ok;
    })
    .map((k) => ({
      kos: k,
      obrnjeno: sklPrileganje(k, d, s).obrnjeno,
      odpadek: sklStevilo(k.dolzina) * sklStevilo(k.sirina) - d * s,
    }))
    .sort((a, b) => a.odpadek - b.odpadek);
}

// ===================== CENA ZA m² IZ CENIKA POLIC (preizkušena) =====================
// Cenik polic je zapisan v € na tekoči meter po širinskih razredih (1–15 cm … 96–100 cm), posebej za debelino 2 in 3 cm.
// Cena za m² = cena najširšega razreda (96–100 cm, torej 1 m širine), preračunana na 1 m: pri širini 1 m je €/m enak €/m².
// Material se išče enako kot pri policah (prva skupina, kjer je naveden), debelina se zaokroži na 2 ali 3 cm.
// Če na strežniku cenik še ni shranjen (prazen), velja privzeti cenik — enak kot pri policah.
const PRIVZETI_CENIK_POLICE_ZA_M2 = {
  "Rosa Beta": { materiali: ["Rosa Beta"], brackets: [{ min: 96, max: 100, cena2: 82, cena3: 108 }] },
  "Giandone, Bianco Sardo, Azul Tragal, Rosa Porino, Umetni marmor": {
    materiali: ["Giandone", "Bianco Sardo", "Azul Tragal", "Rosa Porino", "Umetni marmor bela z piko", "Umetni marmor bela z liso"],
    brackets: [{ min: 96, max: 100, cena2: 107, cena3: 128 }],
  },
  "Juparana Columbo, Multicolor, Nero Impala, Wiscont White, Tonalit, Steel Gray": {
    materiali: ["Juparana Columbo", "Multicolor", "Nero Impala", "Wiscont White", "Tonalit", "Steel Gray"],
    brackets: [{ min: 96, max: 100, cena2: 149, cena3: 180 }],
  },
  "Ivory Brown, Siwakashi, Paradiso": {
    materiali: ["Ivory Brown", "Siwakashi", "Paradiso"],
    brackets: [{ min: 96, max: 100, cena2: 200, cena3: 225 }],
  },
  "Black Galaxy, Nero Assoluto, Jet Black": {
    materiali: ["Black Galaxy", "Nero Assoluto", "Jet Black"],
    brackets: [{ min: 96, max: 100, cena2: 220, cena3: 255 }],
  },
};

const predpomnilnikIndeksaCenika = new WeakMap();

// ime materiala (normalizirano) -> skupina cenika; če je material v več skupinah, velja prva (kot pri policah)
function indeksCenika(cenik) {
  if (!cenik || typeof cenik !== "object" || Array.isArray(cenik)) return null;
  let indeks = predpomnilnikIndeksaCenika.get(cenik);
  if (!indeks) {
    indeks = new Map();
    Object.entries(cenik).forEach(([ime, skupina]) => {
      if (!skupina || !Array.isArray(skupina.materiali)) return;
      const razredi = Array.isArray(skupina.brackets) ? skupina.brackets : [];
      skupina.materiali.forEach((m) => {
        const k = sklNorm(m);
        if (k && !indeks.has(k)) indeks.set(k, { ime, razredi });
      });
    });
    predpomnilnikIndeksaCenika.set(cenik, indeks);
  }
  return indeks;
}

// Vrne { cena, skupina, debelina } ali { cena: 0, razlog }.
// razlog: ni-cenika | ni-materiala | ni-debeline | material-ni-v-ceniku | debelina-ni-v-ceniku | cena-ni-vpisana
function poisciCenoIzCenika(material, debelina, cenik) {
  try {
    const indeks = indeksCenika(cenik);
    if (!indeks) return { cena: 0, razlog: "ni-cenika" };
    const k = sklNorm(material);
    if (!k) return { cena: 0, razlog: "ni-materiala" };
    const d = sklStevilo(debelina);
    if (!(d > 0)) return { cena: 0, razlog: "ni-debeline" };
    const skupina = indeks.get(k);
    if (!skupina) return { cena: 0, razlog: "material-ni-v-ceniku" };
    const deb = Math.round(d);
    if (deb !== 2 && deb !== 3) return { cena: 0, razlog: "debelina-ni-v-ceniku" };
    let najsirsi = null;
    skupina.razredi.forEach((b) => {
      if (!b) return;
      const max = sklStevilo(b.max);
      const cenaNaM = sklStevilo(deb === 2 ? b.cena2 : b.cena3);
      if (max > 0 && cenaNaM > 0 && (!najsirsi || max > najsirsi.max)) najsirsi = { max, cenaNaM };
    });
    if (!najsirsi) return { cena: 0, razlog: "cena-ni-vpisana" };
    return { cena: Math.round((najsirsi.cenaNaM / (najsirsi.max / 100)) * 100) / 100, skupina: skupina.ime, debelina: deb };
  } catch (e) {
    return { cena: 0, razlog: "ni-cenika" };
  }
}

// Cena za m² artikla: ročno vpisana cena ima prednost, sicer se vzame cena iz cenika polic.
// Vrne { cena, vir } — vir: "rocno" | "cenik" | "ni" (pri "ni" je v razlog vzrok).
function cenaM2Artikla(a, cenik) {
  const rocna = sklStevilo(a && a.cenaM2);
  if (rocna > 0) return { cena: rocna, vir: "rocno" };
  const c = poisciCenoIzCenika(a && a.material, a && a.debelina, cenik);
  return c.cena > 0 ? { cena: c.cena, vir: "cenik", skupina: c.skupina, debelina: c.debelina } : { cena: 0, vir: "ni", razlog: c.razlog };
}

const RAZLOGI_BREZ_CENE = {
  "ni-cenika": "Cenik polic se še nalaga ali ni dosegljiv — cene ni mogoče določiti samodejno.",
  "ni-materiala": "Vpiši material in debelino — cena za m² se potem določi sama iz cenika polic.",
  "ni-debeline": "Vpiši še debelino — cena za m² se potem določi sama iz cenika polic.",
  "material-ni-v-ceniku": "Tega materiala ni v ceniku polic — vpiši ceno ročno (ali material dodaj v cenik).",
  "debelina-ni-v-ceniku": "Cenik polic ima ceno samo za debelino 2 in 3 cm — za to debelino vpiši ceno ročno.",
  "cena-ni-vpisana": "V ceniku polic za ta material in debelino ni vpisane cene — vpiši ceno ročno.",
};

// ===================== POMOŽNE FUNKCIJE =====================

function povrsinaM2(a) {
  return (sklStevilo(a.dolzina) * sklStevilo(a.sirina)) / 10000;
}

function vrednostEur(a, cenik) {
  return povrsinaM2(a) * cenaM2Artikla(a, cenik).cena;
}

// Kratek zapis cene na kartici v seznamu: " · 82.00 €/m²" ali prazno.
function opisCeneNaKartici(a, cenik) {
  const c = cenaM2Artikla(a, cenik);
  return c.cena > 0 ? ` · ${eur(c.cena)}/m²` : "";
}

function eur(x) {
  return (Number(x) || 0).toFixed(2) + " €";
}

function ustvariId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Slovenski sklon po številu: 1 kos, 2 kosa, 3-4 kosi, 5+ kosov.
function beseda(n, oblike) {
  const m = Math.abs(n) % 100;
  if (m === 1) return oblike[0];
  if (m === 2) return oblike[1];
  if (m === 3 || m === 4) return oblike[2];
  return oblike[3];
}

function naslednjaKoda(seznam, vrsta) {
  const pred = VRSTE[vrsta].predpona + "-";
  let max = 0;
  (seznam || []).forEach((a) => {
    if (a.vrsta === vrsta && typeof a.koda === "string" && a.koda.startsWith(pred)) {
      const n = parseInt(a.koda.slice(pred.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return pred + String(max + 1).padStart(4, "0");
}

// Od najmanjšega do največjega: najprej po površini, nato po dolžini, širini in kodi.
function primerjajVelikost(a, b) {
  const pa = povrsinaM2(a);
  const pb = povrsinaM2(b);
  if (Math.abs(pa - pb) > 1e-9) return pa - pb;
  const da = sklStevilo(a.dolzina);
  const db = sklStevilo(b.dolzina);
  if (da !== db) return da - db;
  const sa = sklStevilo(a.sirina);
  const sb = sklStevilo(b.sirina);
  if (sa !== sb) return sa - sb;
  return String(a.koda || "").localeCompare(String(b.koda || ""));
}

// Razvrsti po imenu materiala (ali lokaciji); znotraj skupine VEDNO od najmanjšega do največjega.
function razvrstiVSkupine(seznam, nacin) {
  const skupine = new Map();
  seznam.forEach((a) => {
    const surovo = nacin === "lokacija" ? a.lokacija : a.material;
    const ime = String(surovo || "").trim() || (nacin === "lokacija" ? "Brez lokacije" : "Brez imena");
    const kljuc = sklNorm(ime);
    if (!skupine.has(kljuc)) skupine.set(kljuc, { ime, artikli: [] });
    skupine.get(kljuc).artikli.push(a);
  });
  const rezultat = Array.from(skupine.values());
  rezultat.forEach((s) => {
    if (nacin === "lokacija") {
      s.artikli.sort(
        (a, b) => sklNorm(a.material).localeCompare(sklNorm(b.material), "sl") || primerjajVelikost(a, b)
      );
    } else {
      s.artikli.sort(primerjajVelikost);
    }
    s.m2 = s.artikli.reduce((v, a) => v + povrsinaM2(a), 0);
  });
  rezultat.sort((a, b) => {
    const aPrazno = a.ime === "Brez lokacije" || a.ime === "Brez imena";
    const bPrazno = b.ime === "Brez lokacije" || b.ime === "Brez imena";
    if (aPrazno !== bPrazno) return aPrazno ? 1 : -1;
    return a.ime.localeCompare(b.ime, "sl");
  });
  return rezultat;
}

function ujemaIskanje(a, q) {
  if (!String(q || "").trim()) return true;
  const niz = sklNorm(
    `${a.koda} ${a.material} ${a.lokacija} ${a.obdelava} ${a.opombe} ${a.nalog} ${a.dolzina}x${a.sirina}x${a.debelina}`
  );
  return sklNorm(q)
    .split(" ")
    .every((b) => niz.includes(b));
}

function urlArtikla(id) {
  return `${BAZNI_URL}/material?id=${encodeURIComponent(id)}`;
}

function qrUrl(data, velikost) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${velikost}x${velikost}&margin=0&data=${encodeURIComponent(data)}`;
}

// ===================== NALOGI (za izbiro in prikaz številke naloga) =====================

let predpomnilnikNalogov = null;

// Prebere naloge iz vseh treh modulov, da lahko številko naloga izbereš s seznama (brez tipkarskih napak).
async function naloziNaloge() {
  if (predpomnilnikNalogov && Date.now() - predpomnilnikNalogov.cas < 60000) return predpomnilnikNalogov.seznam;
  const preberi = (url) =>
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => (Array.isArray(p) ? p : []))
      .catch(() => []);
  const [police, pulti, spomeniki] = await Promise.all([preberi("/api/nalogi"), preberi("/api/pulti"), preberi("/api/spomeniki")]);
  const jeKoncan = (st) => /prevz|zakljuc/.test(sklNorm(st));
  const seznam = [];
  police.forEach((n) => {
    if (n && n.stevilka) seznam.push({ modul: "Police", id: n.id, stevilka: n.stevilka, stranka: n.stranka || "", opis: n.opis || "", koncan: jeKoncan(n.status) });
  });
  pulti.forEach((n) => {
    if (n && n.stevilka) seznam.push({ modul: "Pulti", id: n.id, stevilka: n.stevilka, stranka: (n.stranka && n.stranka.ime) || "", opis: "Pult", koncan: jeKoncan(n.status) });
  });
  spomeniki.forEach((n) => {
    if (n && n.stevilka) seznam.push({ modul: "Spomeniki", id: n.id, stevilka: n.stevilka, stranka: (n.stranka && n.stranka.ime) || "", opis: n.material || "Spomenik", koncan: jeKoncan(n.status) });
  });
  // odprti nalogi najprej, nato najnovejši
  seznam.sort((a, b) => (a.koncan === b.koncan ? String(b.stevilka).localeCompare(String(a.stevilka)) : a.koncan ? 1 : -1));
  predpomnilnikNalogov = { cas: Date.now(), seznam };
  return seznam;
}

function povezavaNaloga(n) {
  const pot = n.modul === "Pulti" ? "/pulti" : n.modul === "Spomeniki" ? "/spomeniki" : "/";
  return `${pot}?nalog=${encodeURIComponent(n.id)}`;
}

function prazenArtikel(vrsta) {
  return {
    id: ustvariId(),
    vrsta,
    material: "",
    dolzina: "",
    sirina: "",
    debelina: "",
    obdelava: "",
    cenaM2: "",
    lokacija: "",
    opombe: "",
    slika: null,
    steviloKopij: "1",
    izvorId: "",
    izvorKoda: "",
    oznaciIzvorPorabljen: false,
    novaSlika: null,
    odstraniSliko: false,
  };
}

// ===================== SLIKE =====================

function preberiDatoteko(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function naloziElementSlike(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Zmanjša sliko (da ne obremenjuje baze in omrežja) in jo vrne kot JPEG data URL.
async function zmanjsajSliko(file, maxStran, kakovost) {
  const src = await preberiDatoteko(file);
  const img = await naloziElementSlike(src);
  const razmerje = Math.min(1, maxStran / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * razmerje));
  const h = Math.max(1, Math.round(img.height * razmerje));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", kakovost);
}

async function naloziSlikoNaStreznik(kljuc, dataUrl) {
  const res = await fetch("/api/priloge-material", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kljuc, podatki: { tip: "image/jpeg", podatki: dataUrl } }),
  });
  if (!res.ok) throw new Error("Nalaganje slike ni uspelo");
}

const predpomnilnikSlik = new Map();

function SlikaArtikla({ kljuc, className, alt, lazy }) {
  const [src, setSrc] = useState(kljuc ? predpomnilnikSlik.get(kljuc) || null : null);
  const [napaka, setNapaka] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!kljuc || src) return undefined;
    let preklicano = false;
    let opazovalec = null;
    const naloziZdaj = () => {
      fetch(`/api/priloge-material?kljuc=${encodeURIComponent(kljuc)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (preklicano) return;
          if (d && d.podatki) {
            predpomnilnikSlik.set(kljuc, d.podatki);
            setSrc(d.podatki);
          } else {
            setNapaka(true);
          }
        })
        .catch(() => {
          if (!preklicano) setNapaka(true);
        });
    };
    if (lazy && typeof IntersectionObserver !== "undefined" && ref.current) {
      opazovalec = new IntersectionObserver(
        (vnosi) => {
          if (vnosi.some((v) => v.isIntersecting)) {
            if (opazovalec) opazovalec.disconnect();
            naloziZdaj();
          }
        },
        { rootMargin: "200px" }
      );
      opazovalec.observe(ref.current);
    } else {
      naloziZdaj();
    }
    return () => {
      preklicano = true;
      if (opazovalec) opazovalec.disconnect();
    };
  }, [kljuc]);

  if (src) return <img src={src} alt={alt || ""} className={className} />;
  return (
    <div ref={ref} className={`${className || ""} bg-stone-200 flex items-center justify-center text-stone-400 text-xs`}>
      {napaka ? "⚠" : "…"}
    </div>
  );
}

// ===================== GLAVNA KOMPONENTA =====================

export default function Material() {
  const [artikli, setArtikli] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [shranjujem, setShranjujem] = useState(false);
  const [zavihek, setZavihek] = useState("plosca");
  const [pogled, setPogled] = useState("seznam");
  const [obrazec, setObrazec] = useState(null);
  const [izbranId, setIzbranId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("zaloga");
  const [iskanje, setIskanje] = useState("");
  const [grupiranje, setGrupiranje] = useState("material");
  const [admin, setAdmin] = useState(false);
  const [predlogiMaterialov, setPredlogiMaterialov] = useState(PRIVZETI_MATERIALI);
  const [odpriIskalnik, setOdpriIskalnik] = useState(false);
  const [mera, setMera] = useState({ material: "", debelina: "", dolzina: "", sirina: "", vkljuciPlosce: false });
  const [dialogStatus, setDialogStatus] = useState(null); // { a, status } — okno za izbiro naloga
  const [qrVprasanje, setQrVprasanje] = useState(false); // vprašanje "si ga porabil?" po skeniranju QR kode
  const [cenikPolice, setCenikPolice] = useState(null); // cenik polic (iz njega se samodejno določi cena za m²); null = še ni naložen

  const artikliRef = useRef([]);
  const verzijaRef = useRef(0);
  const vrstaShranjevanjRef = useRef(Promise.resolve());

  function nastaviArtikle(novi) {
    artikliRef.current = novi;
    setArtikli(novi);
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/material", { cache: "no-store" });
        verzijaRef.current = Number(res.headers.get("X-Verzija")) || 0;
        const p = await res.json();
        const seznam = Array.isArray(p) ? p : [];
        nastaviArtikle(seznam);

        // Povezava iz QR kode: /material?id=...
        try {
          const iskaniParametri = new URLSearchParams(window.location.search);
          const id = iskaniParametri.get("id");
          if (id) {
            const najden = seznam.find((a) => String(a.id) === String(id));
            if (najden) {
              setZavihek(najden.vrsta === "kos" ? "kos" : "plosca");
              setIzbranId(najden.id);
              setPogled("podrobnosti");
              // Skeniran kos je rezerviran za nalog -> vprašamo, ali je bil porabljen za ta nalog.
              // (Povezava iz Inventure vsebuje &ogled=1 — tam samo pregledujemo, zato vprašanja ne postavimo.)
              if (najden.status === "rezervirano" && !iskaniParametri.get("ogled")) setQrVprasanje(true);
            } else {
              setNapaka("Artikla s to kodo ni več v skladišču (morda je bil izbrisan).");
            }
          }
        } catch (e2) {}
      } catch (e) {
        setNapaka("Napaka pri nalaganju podatkov.");
      } finally {
        setNalaganje(false);
      }
    })();

    // Imena materialov iz cenikov (za samodejno dopolnjevanje — da se imena ujemajo z delovnimi nalogi).
    (async () => {
      try {
        const imena = [...PRIVZETI_MATERIALI];
        try {
          const c = await fetch("/api/cenik-police", { cache: "no-store" }).then((r) => r.json());
          if (c && typeof c === "object") {
            Object.values(c).forEach((g) => (g && Array.isArray(g.materiali) ? g.materiali.forEach((m) => imena.push(m)) : null));
          }
          // Cena za m² se določi iz cenika polic. Prazen odgovor = cenik še ni bil shranjen -> velja privzeti (kot pri policah).
          if (c && typeof c === "object" && !Array.isArray(c) && !c.napaka) {
            setCenikPolice(Object.keys(c).length > 0 ? c : PRIVZETI_CENIK_POLICE_ZA_M2);
          }
        } catch (e) {}
        try {
          const c = await fetch("/api/cenik-pulti", { cache: "no-store" }).then((r) => r.json());
          if (c && Array.isArray(c.materiali)) c.materiali.forEach((m) => (m && m.naziv ? imena.push(m.naziv) : null));
        } catch (e) {}
        const videni = new Set();
        setPredlogiMaterialov(
          imena.filter((i) => {
            const k = sklNorm(i);
            if (!k || videni.has(k)) return false;
            videni.add(k);
            return true;
          })
        );
      } catch (e) {}
    })();
  }, []);

  async function shraniSeznam(noviSeznam, pricakovanaVerzija) {
    nastaviArtikle(noviSeznam);
    setShranjujem(true);
    try {
      const res = await fetch("/api/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam: noviSeznam, pricakovanaVerzija }),
      });
      const odgovor = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setNapaka(
          odgovor.zastarelaAplikacija
            ? "Aplikacija na tej napravi je zastarela. Osveži stran (F5)."
            : "Nekdo drug je medtem spremenil zalogo. Stran se je osvežila na najnovejše stanje – preveri in poskusi znova."
        );
        try {
          const sv = await fetch("/api/material", { cache: "no-store" });
          const p = await sv.json();
          if (Array.isArray(p)) nastaviArtikle(p);
          verzijaRef.current = Number(sv.headers.get("X-Verzija")) || 0;
        } catch (e2) {}
        return false;
      }
      if (!res.ok) {
        setNapaka(`Shranjevanje ni uspelo (${res.status}). ${odgovor.napaka || ""}`.trim());
        return false;
      }
      setNapaka("");
      if (odgovor.verzija !== undefined) verzijaRef.current = odgovor.verzija;
      return true;
    } catch (e) {
      setNapaka("Napaka pri shranjevanju. Preveri povezavo.");
      return false;
    } finally {
      setShranjujem(false);
    }
  }

  // Vsa shranjevanja gredo po vrsti (hitri kliki se ne prepisujejo) in vsako najprej prebere najnovejše stanje.
  async function posodobiArtikle(transformFn) {
    const prejsnje = vrstaShranjevanjRef.current;
    let sprosti;
    vrstaShranjevanjRef.current = new Promise((r) => {
      sprosti = r;
    });
    try {
      await prejsnje;
      let osnova = artikliRef.current;
      let verzija = verzijaRef.current;
      try {
        const res = await fetch("/api/material", { cache: "no-store" });
        const sveze = await res.json();
        verzija = Number(res.headers.get("X-Verzija")) || 0;
        if (Array.isArray(sveze)) osnova = sveze;
      } catch (e) {}
      const novi = transformFn(osnova);
      if (!novi) return false;
      return await shraniSeznam(novi, verzija);
    } finally {
      sprosti();
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

  function pocistiNeuporabljeneSlike(kljuci) {
    const uporabljeni = new Set();
    artikliRef.current.forEach((x) => {
      if (x.slika) {
        uporabljeni.add(x.slika.kljuc);
        uporabljeni.add(x.slika.kljucMini);
      }
    });
    Array.from(new Set(kljuci.filter(Boolean)))
      .filter((k) => !uporabljeni.has(k))
      .forEach((k) => {
        fetch(`/api/priloge-material?kljuc=${encodeURIComponent(k)}`, { method: "DELETE" }).catch(() => {});
      });
  }

  async function shraniIzObrazca(f) {
    const napake = [];
    if (!String(f.material || "").trim()) napake.push("ime materiala");
    if (!(sklStevilo(f.dolzina) > 0)) napake.push("dolžino");
    if (!(sklStevilo(f.sirina) > 0)) napake.push("širino");
    if (!(sklStevilo(f.debelina) > 0)) napake.push("debelino");
    if (napake.length) {
      alert(`Vpiši še: ${napake.join(", ")}.`);
      return;
    }

    setShranjujem(true);
    try {
      let slikaRef = f.slika || null;
      const stariKljuci = [];
      if (f.novaSlika) {
        const baza = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        try {
          await naloziSlikoNaStreznik(`${baza}-full`, f.novaSlika.full);
          await naloziSlikoNaStreznik(`${baza}-mini`, f.novaSlika.mini);
        } catch (e) {
          alert("Slike ni bilo mogoče naložiti. Poskusi znova (ali shrani brez slike).");
          return;
        }
        if (f.slika) stariKljuci.push(f.slika.kljuc, f.slika.kljucMini);
        slikaRef = { ime: f.novaSlika.ime, tip: "image/jpeg", kljuc: `${baza}-full`, kljucMini: `${baza}-mini` };
      } else if (f.odstraniSliko) {
        if (f.slika) stariKljuci.push(f.slika.kljuc, f.slika.kljucMini);
        slikaRef = null;
      }

      const { _urejanje, novaSlika, odstraniSliko, steviloKopij, oznaciIzvorPorabljen, ...cist } = f;
      cist.slika = slikaRef;
      cist.material = String(cist.material).trim();
      cist.lokacija = String(cist.lokacija || "").trim();
      cist.obdelava = String(cist.obdelava || "").trim();

      const zdaj = new Date().toISOString();
      let uspeh;
      let idZaOdpiranje = null;

      if (_urejanje) {
        uspeh = await posodobiArtikle((os) => os.map((x) => (x.id === cist.id ? { ...x, ...cist } : x)));
        idZaOdpiranje = cist.id;
      } else {
        const n = Math.max(1, Math.min(50, parseInt(steviloKopij, 10) || 1));
        const idji = Array.from({ length: n }, () => ustvariId());
        uspeh = await posodobiArtikle((os) => {
          const novi = [];
          for (let i = 0; i < n; i++) {
            const koda = naslednjaKoda([...os, ...novi], cist.vrsta);
            novi.push({
              ...cist,
              id: idji[i],
              koda,
              status: "zaloga",
              nalog: "",
              datumVnosa: zdaj,
              zgodovina: [{ status: "zaloga", datum: zdaj, nalog: "" }],
            });
          }
          let ostali = os;
          if (oznaciIzvorPorabljen && cist.izvorId) {
            ostali = os.map((x) =>
              x.id === cist.izvorId && x.status !== "porabljeno"
                ? {
                    ...x,
                    status: "porabljeno",
                    porabljenoDatum: zdaj,
                    zgodovina: [...(x.zgodovina || []), { status: "porabljeno", datum: zdaj, nalog: x.nalog || "" }],
                  }
                : x
            );
          }
          return [...novi, ...ostali];
        });
        idZaOdpiranje = n === 1 ? idji[0] : null;
      }

      if (!uspeh) return;
      pocistiNeuporabljeneSlike(stariKljuci);
      setZavihek(cist.vrsta);
      setObrazec(null);
      if (idZaOdpiranje) {
        setIzbranId(idZaOdpiranje);
        setPogled("podrobnosti");
      } else {
        setPogled("seznam");
      }
    } finally {
      setShranjujem(false);
    }
  }

  // Rezervacija in poraba zahtevata številko naloga -> odpre se okno, kjer nalog izbereš s seznama.
  function nastaviStatus(a, status) {
    if (a.status === status) return;
    if (status === "rezervirano" || status === "porabljeno") {
      setDialogStatus({ a, status });
      return;
    }
    izvediStatus(a, status, "");
  }

  function izvediStatus(a, status, nalog) {
    const zdaj = new Date().toISOString();
    return posodobiArtikle((os) =>
      os.map((x) =>
        x.id === a.id
          ? {
              ...x,
              status,
              nalog,
              porabljenoDatum: status === "porabljeno" ? zdaj : "",
              zgodovina: [...(x.zgodovina || []), { status, datum: zdaj, nalog }],
            }
          : x
      )
    );
  }

  function spremeniLokacijo(a, lokacija) {
    const nova = String(lokacija || "").trim();
    posodobiArtikle((os) => os.map((x) => (x.id === a.id ? { ...x, lokacija: nova } : x)));
  }

  // Izbriše ročno vpisano ceno za m² -> artikel odslej uporablja ceno iz cenika polic.
  function ceneIzCenika(a) {
    posodobiArtikle((os) => os.map((x) => (x.id === a.id ? { ...x, cenaM2: "" } : x)));
  }

  async function izbrisiArtikel(a) {
    if (!vprasajPin()) return;
    if (!confirm(`Res izbrišem ${a.koda} (${a.material})?`)) return;
    const kljuci = a.slika ? [a.slika.kljuc, a.slika.kljucMini] : [];
    const uspeh = await posodobiArtikle((os) => os.filter((x) => x.id !== a.id));
    if (uspeh) {
      pocistiNeuporabljeneSlike(kljuci);
      setIzbranId(null);
      setPogled("seznam");
    }
  }

  function odpriNovo() {
    setObrazec(prazenArtikel(zavihek));
    setPogled("obrazec");
  }

  function odpriUrejanje(a) {
    setObrazec({ ...a, steviloKopij: "1", novaSlika: null, odstraniSliko: false, _urejanje: true });
    setPogled("obrazec");
  }

  function odpriOstanek(a) {
    setObrazec({
      ...prazenArtikel("kos"),
      material: a.material,
      debelina: a.debelina,
      obdelava: a.obdelava,
      cenaM2: a.cenaM2,
      lokacija: a.lokacija,
      izvorId: a.id,
      izvorKoda: a.koda,
      oznaciIzvorPorabljen: a.status !== "porabljeno",
    });
    setZavihek("kos");
    setPogled("obrazec");
  }

  function prenesiVarnostnoKopijo() {
    const blob = new Blob([JSON.stringify(artikli, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `varnostna-kopija-material-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function obnoviIzDatoteke(event) {
    const datoteka = event.target.files && event.target.files[0];
    if (!datoteka) return;
    const bralnik = new FileReader();
    bralnik.onload = async (e) => {
      try {
        const podatki = JSON.parse(e.target.result);
        if (!Array.isArray(podatki)) {
          alert("Datoteka ni veljavna varnostna kopija (pričakovan je seznam).");
          return;
        }
        if (window.confirm(`Obnovim ${podatki.length} vnosov? To PREPIŠE trenutno zalogo in je ni mogoče razveljaviti.`)) {
          const ok = await posodobiArtikle(() => podatki);
          if (ok) alert("Podatki so bili obnovljeni.");
        }
      } catch (err) {
        alert("Napaka pri branju datoteke — preveri, da je to prava .json varnostna kopija.");
      }
    };
    bralnik.readAsText(datoteka);
    event.target.value = "";
  }

  function izvoziCSV() {
    const glave = ["Koda", "Vrsta", "Material", "Dolžina (cm)", "Širina (cm)", "Debelina (cm)", "Obdelava", "Cena €/m²", "m²", "Vrednost €", "Lokacija", "Status", "Nalog", "Opombe", "Datum vnosa"];
    const ubezi = (v) => {
      const s = String(v ?? "");
      return s.includes(";") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const vrstice = artikli.map((a) => [
      a.koda,
      VRSTE[a.vrsta] ? VRSTE[a.vrsta].naziv : a.vrsta,
      a.material,
      a.dolzina,
      a.sirina,
      a.debelina,
      a.obdelava,
      cenaM2Artikla(a, cenikPolice).cena > 0 ? cenaM2Artikla(a, cenikPolice).cena.toFixed(2) : "",
      povrsinaM2(a).toFixed(2),
      vrednostEur(a, cenikPolice).toFixed(2),
      a.lokacija,
      (STATUSI.find((s) => s.id === a.status) || {}).naziv || a.status,
      a.nalog,
      a.opombe,
      (a.datumVnosa || "").slice(0, 10),
    ]);
    const csv = [glave, ...vrstice].map((r) => r.map(ubezi).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `zaloga-materiala-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    URL.revokeObjectURL(url);
  }

  if (nalaganje) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Nalagam …</div>;
  }

  const izbran = artikli.find((a) => a.id === izbranId) || null;
  const predlogiLokacij = Array.from(new Set(artikli.map((a) => String(a.lokacija || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "sl")
  );
  const predlogiMaterialovVsi = (() => {
    const videni = new Set();
    return [...predlogiMaterialov, ...artikli.map((a) => a.material)].filter((m) => {
      const k = sklNorm(m);
      if (!k || videni.has(k)) return false;
      videni.add(k);
      return true;
    });
  })();

  const vTabu = artikli.filter((a) => a.vrsta === zavihek);
  const stevilaStatusov = {
    zaloga: vTabu.filter((a) => a.status === "zaloga").length,
    rezervirano: vTabu.filter((a) => a.status === "rezervirano").length,
    porabljeno: vTabu.filter((a) => a.status === "porabljeno").length,
  };
  const prikazani = vTabu.filter((a) => (filterStatus === "vsi" || a.status === filterStatus) && ujemaIskanje(a, iskanje));
  const skupine = razvrstiVSkupine(prikazani, grupiranje);
  const skupajM2 = prikazani.reduce((v, a) => v + povrsinaM2(a), 0);
  const skupajVrednost = prikazani.reduce((v, a) => v + vrednostEur(a, cenikPolice), 0);
  const naZalogiPlosc = artikli.filter((a) => a.vrsta === "plosca" && a.status === "zaloga").length;
  const naZalogiKosov = artikli.filter((a) => a.vrsta === "kos" && a.status === "zaloga").length;

  const rezultatiMere = odpriIskalnik
    ? sklPoisciKose(artikli, mera, "", mera.vkljuciPlosce)
    : [];

  return (
    <div className="min-h-screen bg-gray-100 pb-24 material-koren">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 flex-wrap gap-2 material-glava">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Material</span>
          </div>
          <div className="text-xs text-gray-400">Cele plošče in kosi — kaj imamo na zalogi</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Police</a>
          <a href="/pulti" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Pulti</a>
          <a href="/spomeniki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Spomeniki</a>
          <a href="/sestanki" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">Sestanki</a>
          <a href="/inventura" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">📋 Inventura</a>
          <a href="/skladisce" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">📦 Orodje</a>
          <button
            onClick={() => {
              window.location.href = window.location.pathname + "?osvezeno=" + Date.now();
            }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            ⟳ Osveži
          </button>
          <button
            onClick={() => {
              if (vprasajPin()) setPogled("admin");
            }}
            className="text-xs bg-gray-800 px-3 py-2 rounded-lg"
          >
            🔒 Admin
          </button>
        </div>
      </div>

      {napaka && (
        <div className="bg-red-600 text-white text-sm px-4 py-2 cursor-pointer material-glava" onClick={() => setNapaka("")}>
          {napaka} (tapni za zapiranje)
        </div>
      )}

      {dialogStatus && (
        <NalogDialog
          naslov={dialogStatus.status === "rezervirano" ? `Rezerviraj ${dialogStatus.a.koda}` : `${dialogStatus.a.koda} je porabljen`}
          podnaslov={
            dialogStatus.status === "rezervirano"
              ? "Izberi delovni nalog, za katerega ta kos rezerviraš."
              : "Izberi delovni nalog, za katerega si ga porabil (neobvezno)."
          }
          privzeto={dialogStatus.a.nalog || ""}
          obvezno={dialogStatus.status === "rezervirano"}
          potrdiBesedilo={dialogStatus.status === "rezervirano" ? "Rezerviraj" : "Označi kot porabljen"}
          onPreklici={() => setDialogStatus(null)}
          onPotrdi={(nalog) => {
            const d = dialogStatus;
            setDialogStatus(null);
            izvediStatus(d.a, d.status, nalog);
          }}
        />
      )}

      {pogled === "podrobnosti" && izbran && qrVprasanje && izbran.status === "rezervirano" && (
        <RezervacijaVprasanje
          a={izbran}
          onPorabljeno={() => {
            setQrVprasanje(false);
            izvediStatus(izbran, "porabljeno", izbran.nalog || "");
          }}
          onSprosti={() => {
            setQrVprasanje(false);
            izvediStatus(izbran, "zaloga", "");
          }}
          onZapri={() => setQrVprasanje(false)}
        />
      )}

      {pogled === "seznam" && (
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {["plosca", "kos"].map((v) => {
              const aktiven = zavihek === v;
              const stevilo = v === "plosca" ? naZalogiPlosc : naZalogiKosov;
              return (
                <button
                  key={v}
                  onClick={() => {
                    setZavihek(v);
                    setFilterStatus("zaloga");
                    setIskanje("");
                  }}
                  className={`rounded-xl py-3 px-2 text-center border-2 transition-colors ${
                    aktiven ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  <div className="text-2xl leading-none">{VRSTE[v].ikona}</div>
                  <div className="font-bold text-sm mt-1">{VRSTE[v].mnozina}</div>
                  <div className={`text-xs ${aktiven ? "text-gray-300" : "text-gray-500"}`}>
                    {stevilo} na zalogi
                  </div>
                </button>
              );
            })}
          </div>

          {zavihek === "kos" && (
            <div className="bg-white rounded-xl p-3 mb-3 border border-emerald-200">
              <button
                onClick={() => setOdpriIskalnik(!odpriIskalnik)}
                className="w-full flex items-center justify-between text-sm font-semibold text-emerald-800"
              >
                <span>🔎 Poišči kos za določeno mero</span>
                <span>{odpriIskalnik ? "▲" : "▼"}</span>
              </button>
              {odpriIskalnik && (
                <div className="mt-2 space-y-2">
                  <input
                    list="seznam-materialov-iskanje"
                    value={mera.material}
                    onChange={(e) => setMera({ ...mera, material: e.target.value })}
                    placeholder="Material (neobvezno)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                  <datalist id="seznam-materialov-iskanje">
                    {predlogiMaterialovVsi.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={mera.dolzina}
                      onChange={(e) => setMera({ ...mera, dolzina: e.target.value })}
                      placeholder="Dolžina cm"
                      inputMode="decimal"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      value={mera.sirina}
                      onChange={(e) => setMera({ ...mera, sirina: e.target.value })}
                      placeholder="Širina cm"
                      inputMode="decimal"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <input
                      value={mera.debelina}
                      onChange={(e) => setMera({ ...mera, debelina: e.target.value })}
                      placeholder="Debelina cm"
                      inputMode="decimal"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={mera.vkljuciPlosce}
                      onChange={(e) => setMera({ ...mera, vkljuciPlosce: e.target.checked })}
                    />
                    Vključi tudi cele plošče
                  </label>
                  {sklStevilo(mera.dolzina) > 0 && sklStevilo(mera.sirina) > 0 ? (
                    rezultatiMere.length === 0 ? (
                      <div className="text-sm text-gray-500">Ni ustreznega kosa na zalogi.</div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-xs text-emerald-700 font-semibold">
                          Ustreza {rezultatiMere.length} {beseda(rezultatiMere.length, VRSTE.kos.oblike)} (najmanjši zadosten najprej):
                        </div>
                        {rezultatiMere.map((r) => (
                          <button
                            key={r.kos.id}
                            onClick={() => {
                              setZavihek(r.kos.vrsta);
                              setIzbranId(r.kos.id);
                              setPogled("podrobnosti");
                            }}
                            className="w-full text-left bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="font-bold">{r.kos.koda}</span> · {r.kos.material} · {r.kos.dolzina} × {r.kos.sirina} × {r.kos.debelina} cm
                            {r.obrnjeno ? " (zasukano)" : ""}
                            <div className="text-xs text-gray-600">📍 {r.kos.lokacija || "lokacija ni vpisana"}</div>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-gray-400">Vpiši vsaj dolžino in širino, ki jo potrebuješ.</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-2">
            {STATUSI.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatus === s.id
                    ? STATUS_BARVE[s.id] + " font-medium ring-1 ring-inset ring-current"
                    : "bg-white text-stone-500 border-stone-300 hover:border-stone-500"
                }`}
              >
                {s.naziv} <span className="opacity-60">({stevilaStatusov[s.id]})</span>
              </button>
            ))}
            <button
              onClick={() => setFilterStatus("vsi")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === "vsi"
                  ? "bg-stone-700 text-white border-stone-700 font-medium"
                  : "bg-white text-stone-500 border-stone-300 hover:border-stone-500"
              }`}
            >
              Vsi
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
              placeholder="Išči po materialu, kodi, lokaciji …"
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm"
            />
            <select
              value={grupiranje}
              onChange={(e) => setGrupiranje(e.target.value)}
              className="px-2 py-2 rounded-lg border border-gray-300 bg-white text-xs"
            >
              <option value="material">Po materialu</option>
              <option value="lokacija">Po lokaciji</option>
            </select>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
            <span>
              {prikazani.length} {beseda(prikazani.length, VRSTE[zavihek].oblike)} · {skupajM2.toFixed(2)} m²
              {admin ? ` · ${eur(skupajVrednost)}` : ""}
            </span>
            <span>od najmanjšega do največjega</span>
          </div>

          {skupine.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              {vTabu.length === 0
                ? `Še ni vnosov. Dodaj prvi${zavihek === "plosca" ? "o ploščo" : " kos"} z gumbom +`
                : "Ni vnosov, ki bi ustrezali filtru."}
            </div>
          )}

          {skupine.map((s) => (
            <div key={s.ime} className="mb-2">
              <div className="flex items-baseline justify-between mt-4 mb-1.5 px-1">
                <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">{s.ime}</h3>
                <span className="text-xs text-gray-500">
                  {s.artikli.length} {beseda(s.artikli.length, VRSTE[zavihek].oblike)} · {s.m2.toFixed(2)} m²
                </span>
              </div>
              <div className="space-y-2">
                {s.artikli.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setIzbranId(a.id);
                      setPogled("podrobnosti");
                    }}
                    className={`bg-white rounded-xl p-2.5 shadow-sm cursor-pointer border-2 flex gap-3 items-center ${
                      KARTICA_OBROBA[a.status] || "border-transparent"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl">
                      {a.slika && a.slika.kljucMini ? (
                        <SlikaArtikla key={a.slika.kljucMini} kljuc={a.slika.kljucMini} lazy className="w-full h-full object-cover" alt={a.material} />
                      ) : (
                        <span>{VRSTE[a.vrsta] ? VRSTE[a.vrsta].ikona : "🪨"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{a.koda}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_BARVE[a.status] || STATUS_BARVE.zaloga}`}>
                          {(STATUSI.find((x) => x.id === a.status) || STATUSI[0]).naziv}
                        </span>
                      </div>
                      <div className="text-base font-semibold leading-tight">
                        {a.dolzina} × {a.sirina} × {a.debelina} cm
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {a.obdelava ? `${a.obdelava} · ` : ""}
                        {povrsinaM2(a).toFixed(2)} m²
                        {opisCeneNaKartici(a, cenikPolice)}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        📍 {a.lokacija || "lokacija ni vpisana"}
                        {a.nalog ? ` · ${a.nalog}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pogled === "obrazec" && obrazec && (
        <ObrazecArtikla
          zacetni={obrazec}
          cenik={cenikPolice}
          predlogiMaterialov={predlogiMaterialovVsi}
          predlogiLokacij={predlogiLokacij}
          shranjujem={shranjujem}
          onShrani={shraniIzObrazca}
          onPreklici={() => {
            setObrazec(null);
            setPogled(obrazec._urejanje && izbranId ? "podrobnosti" : "seznam");
          }}
        />
      )}

      {pogled === "podrobnosti" && !izbran && (
        <div className="p-3 space-y-3">
          <div className="bg-white rounded-xl p-4 text-center text-gray-500">Tega vnosa ni (morda je bil izbrisan).</div>
          <button onClick={() => setPogled("seznam")} className="w-full bg-gray-200 rounded-xl py-3 font-semibold">
            ← Nazaj na seznam
          </button>
        </div>
      )}

      {pogled === "podrobnosti" && izbran && (
        <PodrobnostiArtikla
          a={izbran}
          admin={admin}
          cenik={cenikPolice}
          onCenaIzCenika={() => ceneIzCenika(izbran)}
          onNazaj={() => setPogled("seznam")}
          onUredi={() => odpriUrejanje(izbran)}
          onStatus={(s) => nastaviStatus(izbran, s)}
          onPorabljeno={() => izvediStatus(izbran, "porabljeno", izbran.nalog || "")}
          onSprosti={() => izvediStatus(izbran, "zaloga", "")}
          onLokacija={(l) => spremeniLokacijo(izbran, l)}
          onNalepka={() => setPogled("nalepka")}
          onOstanek={() => odpriOstanek(izbran)}
          onIzbrisi={() => izbrisiArtikel(izbran)}
          predlogiLokacij={predlogiLokacij}
        />
      )}

      {pogled === "nalepka" && izbran && <NalepkaArtikla a={izbran} cenik={cenikPolice} onNazaj={() => setPogled("podrobnosti")} />}

      {pogled === "admin" && (
        <div className="p-3 space-y-3">
          <button onClick={() => setPogled("seznam")} className="text-sm text-gray-500">← Nazaj</button>
          <h2 className="font-bold text-lg">Admin — Material</h2>

          <div className="bg-white rounded-xl p-3">
            <div className="font-semibold text-sm mb-1">Vrednost zaloge (samo "Na zalogi")</div>
            <p className="text-[11px] text-gray-500 mb-2">
              Cena za m² se določi sama iz cenika polic (po materialu in debelini). Ročno vpisana cena pri artiklu ima prednost.
            </p>
            {(() => {
              const poMaterialu = new Map();
              artikli
                .filter((a) => a.status === "zaloga")
                .forEach((a) => {
                  const k = sklNorm(a.material);
                  if (!poMaterialu.has(k)) poMaterialu.set(k, { ime: a.material, n: 0, m2: 0, eur: 0 });
                  const p = poMaterialu.get(k);
                  p.n += 1;
                  p.m2 += povrsinaM2(a);
                  p.eur += vrednostEur(a, cenikPolice);
                });
              const vrstice = Array.from(poMaterialu.values()).sort((a, b) => a.ime.localeCompare(b.ime, "sl"));
              const skupajEur = vrstice.reduce((v, x) => v + x.eur, 0);
              const skupajPovrsina = vrstice.reduce((v, x) => v + x.m2, 0);
              // Artikli, pri katerih cene ni bilo mogoče določiti (material ni v ceniku polic, debelina ni 2 ali 3 cm …).
              const brezCene = cenikPolice
                ? artikli.filter((a) => a.status === "zaloga" && cenaM2Artikla(a, cenikPolice).cena <= 0)
                : [];
              return vrstice.length === 0 ? (
                <div className="text-sm text-gray-500">Zaloga je prazna.</div>
              ) : (
                <div className="text-sm">
                  {vrstice.map((x) => (
                    <div key={x.ime} className="flex justify-between py-0.5 border-b border-gray-100">
                      <span>{x.ime} <span className="text-gray-400">({x.n})</span></span>
                      <span className="text-gray-700">{x.m2.toFixed(2)} m² · {eur(x.eur)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold">
                    <span>Skupaj</span>
                    <span>{skupajPovrsina.toFixed(2)} m² · {eur(skupajEur)}</span>
                  </div>
                  {brezCene.length > 0 && (
                    <p className="text-xs text-amber-700 mt-2">
                      Brez cene za m² ({brezCene.length}): {brezCene.slice(0, 8).map((a) => a.koda).join(", ")}
                      {brezCene.length > 8 ? " …" : ""}. Materiala ni v ceniku polic ali debelina ni 2 ali 3 cm — pri artiklu vpiši ceno ročno.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-xl p-3 space-y-2">
            <div className="font-semibold text-sm">Izvoz in varnostna kopija</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={izvoziCSV} className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700">
                ⬇ Izvozi celotno zalogo (CSV)
              </button>
              <button onClick={prenesiVarnostnoKopijo} className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700">
                ⬇ Prenesi varnostno kopijo
              </button>
              <label className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 cursor-pointer">
                📄 Obnovi iz datoteke
                <input type="file" accept="application/json" className="hidden" onChange={obnoviIzDatoteke} />
              </label>
            </div>
            <p className="text-xs text-gray-500">Slike so shranjene ločeno; varnostna kopija vsebuje podatke o plošči/kosu in povezave na slike.</p>
          </div>
        </div>
      )}

      {pogled === "seznam" && (
        <button
          onClick={odpriNovo}
          className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center"
          title={zavihek === "plosca" ? "Dodaj ploščo" : "Dodaj kos"}
        >
          +
        </button>
      )}
    </div>
  );
}

// ===================== OBRAZEC =====================

function ObrazecArtikla({ zacetni, cenik, predlogiMaterialov, predlogiLokacij, shranjujem, onShrani, onPreklici }) {
  const [f, setF] = useState(zacetni);
  const [pripravljamSliko, setPripravljamSliko] = useState(false);
  const jeUrejanje = !!f._urejanje;
  const vrsta = VRSTE[f.vrsta] || VRSTE.plosca;
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";
  const polje = (ime) => ({
    value: f[ime] ?? "",
    onChange: (e) => {
      const v = e.target.value;
      setF((p) => ({ ...p, [ime]: v }));
    },
  });
  const m2 = (sklStevilo(f.dolzina) * sklStevilo(f.sirina)) / 10000;
  // Cena za m²: kar je vpisano ročno, sicer samodejno iz cenika polic (po materialu in debelini).
  const izCenika = poisciCenoIzCenika(f.material, f.debelina, cenik);
  const rocnaCena = sklStevilo(f.cenaM2);
  const veljavnaCena = rocnaCena > 0 ? rocnaCena : izCenika.cena;
  const vrednost = m2 * veljavnaCena;
  const imaSliko = f.novaSlika || (f.slika && !f.odstraniSliko);

  async function izberiSliko(e) {
    const vnos = e.target;
    const datoteka = vnos.files && vnos.files[0];
    if (!datoteka) return;
    setPripravljamSliko(true);
    try {
      const full = await zmanjsajSliko(datoteka, 1200, 0.72);
      const mini = await zmanjsajSliko(datoteka, 240, 0.6);
      setF((p) => ({ ...p, novaSlika: { ime: datoteka.name, full, mini }, odstraniSliko: false }));
    } catch (err) {
      alert("Slike ni bilo mogoče prebrati. Poskusi z drugo sliko.");
    } finally {
      setPripravljamSliko(false);
      vnos.value = "";
    }
  }

  return (
    <div className="p-3 space-y-4">
      <h2 className="font-bold text-lg">
        {jeUrejanje ? `Urejanje ${f.koda}` : f.izvorId ? `Nov ostanek (kos) iz ${f.izvorKoda}` : `Nov vnos: ${vrsta.naziv.toLowerCase()}`}
      </h2>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div>
          <label className={lbl}>Ime materiala *</label>
          <input {...polje("material")} list="seznam-materialov-obrazec" className={inp} placeholder="npr. Rosa Beta" />
          <datalist id="seznam-materialov-obrazec">
            {predlogiMaterialov.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <p className="text-[11px] text-gray-400 mt-1">Izberi iz seznama — ime se mora ujemati z imenom v delovnem nalogu, da te aplikacija opozori na ustrezen kos.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={lbl}>Dolžina (cm) *</label>
            <input {...polje("dolzina")} className={inp} inputMode="decimal" />
          </div>
          <div>
            <label className={lbl}>Širina (cm) *</label>
            <input {...polje("sirina")} className={inp} inputMode="decimal" />
          </div>
          <div>
            <label className={lbl}>Debelina (cm) *</label>
            <input {...polje("debelina")} className={inp} inputMode="decimal" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Obdelava</label>
            <input {...polje("obdelava")} list="seznam-obdelav" className={inp} placeholder="npr. Poliran" />
            <datalist id="seznam-obdelav">
              {OBDELAVE.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={lbl}>Cena za m² (€)</label>
            <input
              {...polje("cenaM2")}
              className={inp}
              inputMode="decimal"
              placeholder={izCenika.cena > 0 ? `samodejno ${izCenika.cena.toFixed(2)}` : "samodejno"}
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-500 -mt-1" data-cena-pojasnilo>
          {rocnaCena > 0 ? (
            izCenika.cena > 0 && Math.abs(izCenika.cena - rocnaCena) > 0.004 ? (
              <>
                Ročno vpisana cena. Cenik polic: <b>{eur(izCenika.cena)}/m²</b> ({izCenika.debelina} cm).{" "}
                <button type="button" onClick={() => setF((p) => ({ ...p, cenaM2: "" }))} className="underline text-red-600">
                  Uporabi ceno iz cenika
                </button>
              </>
            ) : izCenika.cena > 0 ? (
              "Ročno vpisana cena (enaka ceniku polic)."
            ) : (
              "Ročno vpisana cena."
            )
          ) : izCenika.cena > 0 ? (
            <>
              Samodejno iz cenika polic: <b>{eur(izCenika.cena)}/m²</b> ({String(f.material || "").trim()}, {izCenika.debelina} cm). Pusti prazno ali vpiši svojo ceno.
            </>
          ) : (
            RAZLOGI_BREZ_CENE[izCenika.razlog] || ""
          )}
        </p>

        {m2 > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            Površina: <b>{m2.toFixed(2)} m²</b>
            {veljavnaCena > 0 ? <> · Vrednost: <b>{eur(vrednost)}</b></> : null}
          </div>
        )}

        <div>
          <label className={lbl}>Lokacija (kje se nahaja)</label>
          <input {...polje("lokacija")} list="seznam-lokacij" className={inp} placeholder="npr. Regal B2, Hala 1 levo" />
          <datalist id="seznam-lokacij">
            {predlogiLokacij.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={lbl}>Opombe</label>
          <textarea {...polje("opombe")} rows={2} className={inp} placeholder="npr. poškodba na robu, dobavitelj …" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Slika {vrsta.naziv.toLowerCase() === "plošča" ? "plošče" : "kosa"}</div>
        {imaSliko && (
          <div className="rounded-lg overflow-hidden bg-stone-100 max-w-xs">
            {f.novaSlika ? (
              <img src={f.novaSlika.mini} alt="Predogled" className="w-full object-cover" />
            ) : (
              <SlikaArtikla key={f.slika.kljucMini} kljuc={f.slika.kljucMini} className="w-full h-40 object-cover" alt="Slika" />
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 cursor-pointer">
            {pripravljamSliko ? "Pripravljam …" : imaSliko ? "📷 Zamenjaj sliko" : "📷 Dodaj sliko / posnemi"}
            <input type="file" accept="image/*" className="hidden" onChange={izberiSliko} disabled={pripravljamSliko} />
          </label>
          {imaSliko && (
            <button
              type="button"
              onClick={() => setF((p) => ({ ...p, novaSlika: null, odstraniSliko: true }))}
              className="text-xs text-red-600 underline"
            >
              Odstrani sliko
            </button>
          )}
        </div>
      </div>

      {!jeUrejanje && (
        <div className="bg-white rounded-xl p-3 space-y-2">
          {f.izvorId && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!f.oznaciIzvorPorabljen}
                onChange={(e) => setF((p) => ({ ...p, oznaciIzvorPorabljen: e.target.checked }))}
              />
              Izvorni vnos ({f.izvorKoda}) označi kot porabljen
            </label>
          )}
          <div>
            <label className={lbl}>Koliko enakih vnosov ustvarim? (npr. 5 enakih plošč)</label>
            <input {...polje("steviloKopij")} className={inp} inputMode="numeric" />
            <p className="text-[11px] text-gray-400 mt-1">Vsak vnos dobi svojo kodo in svojo QR nalepko.</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onPreklici} className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold">
          Prekliči
        </button>
        <button
          onClick={() => onShrani(f)}
          disabled={shranjujem || pripravljamSliko}
          className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
        >
          {shranjujem ? "Shranjujem …" : "Shrani"}
        </button>
      </div>
    </div>
  );
}

// ===================== PODROBNOSTI =====================

function PodrobnostiArtikla({ a, admin, cenik, onCenaIzCenika, onNazaj, onUredi, onStatus, onPorabljeno, onSprosti, onLokacija, onNalepka, onOstanek, onIzbrisi, predlogiLokacij }) {
  const [lokacija, setLokacija] = useState(a.lokacija || "");
  useEffect(() => {
    setLokacija(a.lokacija || "");
  }, [a.id, a.lokacija]);

  const vrsta = VRSTE[a.vrsta] || VRSTE.plosca;
  const m2 = povrsinaM2(a);
  const cena = cenaM2Artikla(a, cenik);
  // Če je cena vpisana ročno in se razlikuje od cenika polic, ponudimo vrnitev na ceno iz cenika.
  const ceniku = cena.vir === "rocno" ? poisciCenoIzCenika(a.material, a.debelina, cenik) : null;
  const rocnaDrugacna = !!ceniku && ceniku.cena > 0 && Math.abs(ceniku.cena - cena.cena) > 0.004;
  const vrstica = (oznaka, vrednost) =>
    vrednost || vrednost === 0 ? (
      <div className="flex justify-between gap-3 py-1 border-b border-gray-100 text-sm">
        <span className="text-gray-500">{oznaka}</span>
        <span className="font-medium text-right">{vrednost}</span>
      </div>
    ) : null;

  return (
    <div className="p-3 space-y-3">
      <button onClick={onNazaj} className="text-sm text-gray-500">← Nazaj na seznam</button>

      {a.status === "rezervirano" && <RezervacijaTrak a={a} onPorabljeno={onPorabljeno} onSprosti={onSprosti} />}

      <div className="bg-white rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-gray-400 uppercase">{vrsta.naziv}</div>
            <div className="text-xl font-bold">{a.koda}</div>
            <div className="text-lg font-semibold">{a.material}</div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BARVE[a.status] || STATUS_BARVE.zaloga}`}>
            {(STATUSI.find((x) => x.id === a.status) || STATUSI[0]).naziv}
          </span>
        </div>

        {a.slika && a.slika.kljuc && (
          <div className="rounded-lg overflow-hidden bg-stone-100">
            <SlikaArtikla key={a.slika.kljuc} kljuc={a.slika.kljuc} className="w-full max-h-80 object-contain" alt={a.material} />
          </div>
        )}

        <div className="text-2xl font-bold">
          {a.dolzina} × {a.sirina} × {a.debelina} <span className="text-base font-semibold text-gray-500">cm</span>
        </div>

        <div>
          {vrstica("Površina", `${m2.toFixed(2)} m²`)}
          {vrstica("Obdelava", a.obdelava)}
          {cena.cena > 0 && vrstica("Cena za m²", `${eur(cena.cena)} · ${cena.vir === "cenik" ? "iz cenika polic" : "vpisana ročno"}`)}
          {cena.cena > 0 && vrstica("Vrednost", eur(m2 * cena.cena))}
          {rocnaDrugacna && (
            <div className="flex justify-between items-center gap-3 py-1 border-b border-gray-100 text-xs text-gray-500">
              <span>Cenik polic: {eur(ceniku.cena)}/m² ({ceniku.debelina} cm)</span>
              <button type="button" onClick={onCenaIzCenika} className="underline text-red-600 font-medium">
                Uporabi ceno iz cenika
              </button>
            </div>
          )}
          {cena.cena <= 0 && cena.razlog && cena.razlog !== "ni-cenika" && (
            <div className="py-1 border-b border-gray-100 text-xs text-amber-700">⚠ Cena za m² ni določena. {RAZLOGI_BREZ_CENE[cena.razlog]}</div>
          )}
          {a.nalog ? vrstica(a.status === "rezervirano" ? "Rezervirano za" : "Povezan nalog", a.nalog) : null}
          {a.izvorKoda ? vrstica("Ostanek iz", a.izvorKoda) : null}
          {a.opombe ? vrstica("Opombe", a.opombe) : null}
          {a.datumVnosa ? vrstica("Vneseno", new Date(a.datumVnosa).toLocaleDateString("sl-SI")) : null}
          {a.porabljenoDatum ? vrstica("Porabljeno", new Date(a.porabljenoDatum).toLocaleDateString("sl-SI")) : null}
        </div>
        {a.nalog ? <NalogPovezava stevilka={a.nalog} /> : null}
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">Status</div>
        <div className="flex flex-wrap gap-2">
          {STATUSI.map((s) => (
            <button
              key={s.id}
              onClick={() => onStatus(s.id)}
              className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                a.status === s.id ? STATUS_BARVE[s.id] + " font-semibold" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              {s.naziv}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold">📍 Lokacija</div>
        <div className="flex gap-2">
          <input
            value={lokacija}
            onChange={(e) => setLokacija(e.target.value)}
            list="seznam-lokacij-podrobnosti"
            placeholder="Kje se nahaja?"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <datalist id="seznam-lokacij-podrobnosti">
            {predlogiLokacij.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <button
            onClick={() => onLokacija(lokacija)}
            disabled={lokacija.trim() === String(a.lokacija || "").trim()}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-40"
          >
            Shrani
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 flex items-center gap-4">
        <img src={qrUrl(urlArtikla(a.id), 160)} alt="QR koda" width={112} height={112} className="shrink-0" />
        <div className="text-xs text-gray-500">
          <div className="font-semibold text-gray-700 text-sm mb-1">QR koda</div>
          Skeniraj jo s telefonom — odpre se ta vnos, kjer lahko takoj spremeniš status (npr. porabljeno) ali lokacijo.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onNalepka} className="bg-black text-white rounded-xl py-3 font-semibold text-sm">
          🏷 Natisni nalepko
        </button>
        <button onClick={onUredi} className="bg-white border border-gray-300 rounded-xl py-3 font-semibold text-sm">
          ✏️ Uredi
        </button>
        <button onClick={onOstanek} className="bg-white border border-gray-300 rounded-xl py-3 font-semibold text-sm col-span-2">
          ✂ Dodaj ostanek (kos) iz tega vnosa
        </button>
      </div>

      {(a.zgodovina || []).length > 0 && (
        <div className="bg-white rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <div className="font-semibold text-gray-700 text-sm mb-1">Zgodovina</div>
          {a.zgodovina.map((z, i) => (
            <div key={i}>
              {new Date(z.datum).toLocaleDateString("sl-SI")}{" "}
              {new Date(z.datum).toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" })} —{" "}
              {(STATUSI.find((x) => x.id === z.status) || { naziv: z.status }).naziv}
              {z.nalog ? ` (${z.nalog})` : ""}
            </div>
          ))}
        </div>
      )}

      <button onClick={onIzbrisi} className="w-full bg-red-100 text-red-600 rounded-xl py-3 font-semibold text-sm">
        Izbriši vnos {admin ? "" : "(zahteva PIN)"}
      </button>
    </div>
  );
}

// ===================== NALEPKA =====================

function NalepkaArtikla({ a, cenik, onNazaj }) {
  const [velikost, setVelikost] = useState("100x60");
  const [zSliko, setZSliko] = useState(false);
  const v = VELIKOSTI_NALEPKE[velikost];
  const vrsta = VRSTE[a.vrsta] || VRSTE.plosca;
  const m2 = povrsinaM2(a);
  const cenaNalepke = cenaM2Artikla(a, cenik).cena;
  const pokaziSliko = zSliko && v.h >= 100 && a.slika && a.slika.kljucMini;

  return (
    <div className="p-3 space-y-3">
      <style>{`
        @media print {
          @page { size: ${v.w}mm ${v.h}mm; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .nalepka-tisk, .nalepka-tisk * { visibility: visible !important; }
          .nalepka-tisk { position: fixed !important; left: 0 !important; top: 0 !important; margin: 0 !important; border: none !important; }
          .nalepka-orodja, .material-glava { display: none !important; }
          .material-koren { min-height: 0 !important; height: 0 !important; padding: 0 !important; overflow: hidden !important; background: none !important; }
        }
      `}</style>

      <div className="nalepka-orodja space-y-2">
        <button onClick={onNazaj} className="text-sm text-gray-500">← Nazaj</button>
        <div className="bg-white rounded-xl p-3 space-y-2">
          <div className="text-sm font-semibold">Nalepka za {a.koda}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={velikost}
              onChange={(e) => setVelikost(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {Object.entries(VELIKOSTI_NALEPKE).map(([k, x]) => (
                <option key={k} value={k}>{x.naziv}</option>
              ))}
            </select>
            {a.slika && a.slika.kljucMini && v.h >= 100 && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={zSliko} onChange={(e) => setZSliko(e.target.checked)} /> Z sliko
              </label>
            )}
            <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold">
              🖨 Natisni (Ctrl+P)
            </button>
          </div>
          <p className="text-xs text-gray-500">
            V oknu za tiskanje izberi velikost papirja/nalepke, ki ustreza izbrani velikosti. Tiska se samo nalepka. Lahko shraniš tudi kot PDF.
          </p>
        </div>
      </div>

      <div className="overflow-auto">
        <div
          className="nalepka-tisk"
          style={{
            width: `${v.w}mm`,
            height: `${v.h}mm`,
            padding: "3mm",
            boxSizing: "border-box",
            background: "#fff",
            color: "#000",
            border: "1px solid #888",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, Helvetica, sans-serif",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: "3mm", alignItems: "flex-start" }}>
            <img
              src={qrUrl(urlArtikla(a.id), 300)}
              alt="QR"
              style={{ width: `${v.qr}mm`, height: `${v.qr}mm`, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: "0.04em" }}>
                {vrsta.naziv.toUpperCase()} · {a.koda}
              </div>
              <div style={{ fontSize: v.h >= 100 ? "17pt" : "14pt", fontWeight: 800, lineHeight: 1.1, wordBreak: "break-word" }}>
                {a.material}
              </div>
              <div style={{ fontSize: v.h >= 100 ? "15pt" : "12.5pt", fontWeight: 700, marginTop: "1mm" }}>
                {a.dolzina} × {a.sirina} × {a.debelina} cm
              </div>
            </div>
          </div>

          <div style={{ fontSize: "9.5pt", marginTop: "2.5mm", lineHeight: 1.4 }}>
            {a.obdelava ? (
              <div>
                Obdelava: <b>{a.obdelava}</b>
              </div>
            ) : null}
            <div>
              Površina: <b>{m2.toFixed(2)} m²</b>
              {cenaNalepke > 0 ? (
                <>
                  {" "}· Cena: <b>{eur(cenaNalepke)}/m²</b>
                </>
              ) : null}
            </div>
            <div>
              Lokacija: <b>{a.lokacija || "—"}</b>
            </div>
            {a.opombe ? <div style={{ fontSize: "8pt", color: "#333" }}>{a.opombe}</div> : null}
          </div>

          {pokaziSliko ? (
            <div style={{ marginTop: "2mm", flex: 1, minHeight: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SlikaArtikla key={a.slika.kljucMini} kljuc={a.slika.kljucMini} className="" alt="" />
            </div>
          ) : null}

          <div style={{ marginTop: "auto", fontSize: "7pt", color: "#444" }}>Kamnoseštvo Čakš · 031 235 146</div>
        </div>
      </div>
    </div>
  );
}

// ===================== IZBIRA NALOGA, VPRAŠANJE PO SKENIRANJU =====================

function NalogDialog({ naslov, podnaslov, privzeto, obvezno, potrdiBesedilo, onPotrdi, onPreklici }) {
  const [vrednost, setVrednost] = useState(privzeto || "");
  const [nalogi, setNalogi] = useState([]);

  useEffect(() => {
    let preklicano = false;
    naloziNaloge().then((s) => {
      if (!preklicano) setNalogi(s);
    });
    return () => {
      preklicano = true;
    };
  }, []);

  const najden = nalogi.find((n) => sklNorm(n.stevilka) === sklNorm(vrednost)) || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="font-bold text-lg">{naslov}</div>
        {podnaslov && <div className="text-sm text-gray-600">{podnaslov}</div>}
        <input
          list="seznam-nalogov"
          value={vrednost}
          onChange={(e) => setVrednost(e.target.value)}
          placeholder="Številka naloga (npr. DN-202610-123)"
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
        />
        <datalist id="seznam-nalogov">
          {nalogi.slice(0, 300).map((n) => (
            <option key={`${n.modul}-${n.id}`} value={n.stevilka} label={`${n.stranka}${n.opis ? " — " + n.opis : ""}${n.koncan ? " (prevzeto)" : ""}`} />
          ))}
        </datalist>
        {najden ? (
          <div className="text-xs text-emerald-700">
            ✓ {najden.modul}: {najden.stranka}
            {najden.opis ? ` — ${najden.opis}` : ""}
            {najden.koncan ? " (nalog je že prevzet)" : ""}
          </div>
        ) : String(vrednost).trim() ? (
          <div className="text-xs text-amber-700">Te številke ni med nalogi. Preveri jo, preden potrdiš.</div>
        ) : (
          <div className="text-xs text-gray-400">Začni tipkati ali izberi s seznama.</div>
        )}
        <div className="flex gap-2">
          <button onClick={onPreklici} className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold">
            Prekliči
          </button>
          <button
            onClick={() => {
              if (obvezno && !String(vrednost).trim()) {
                alert("Vpiši ali izberi številko naloga.");
                return;
              }
              // če nalog obstaja, shranimo njegovo točno številko (popravi male/velike črke in presledke)
              onPotrdi(najden ? najden.stevilka : String(vrednost).trim());
            }}
            className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold"
          >
            {potrdiBesedilo}
          </button>
        </div>
      </div>
    </div>
  );
}

// Po skeniranju QR kode rezerviranega kosa: "Si ga porabil za ta nalog?"
function RezervacijaVprasanje({ a, onPorabljeno, onSprosti, onZapri }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let preklicano = false;
    naloziNaloge().then((s) => {
      if (!preklicano) setInfo(s.find((n) => sklNorm(n.stevilka) === sklNorm(a.nalog)) || null);
    });
    return () => {
      preklicano = true;
    };
  }, [a.nalog]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md p-4 space-y-3 border-2 border-amber-400">
        <div className="text-xs font-semibold text-amber-700 uppercase">
          🧩 {a.koda} · {a.material} · {a.dolzina} × {a.sirina} × {a.debelina} cm
        </div>
        <div>
          <div className="text-sm text-gray-500">Ta kos je rezerviran za nalog</div>
          <div className="text-2xl font-bold">{a.nalog || "(številka ni vpisana)"}</div>
          {info && (
            <div className="text-sm text-gray-700">
              {info.stranka}
              {info.opis ? ` — ${info.opis}` : ""} <span className="text-gray-400">({info.modul})</span>
              {info.koncan ? <span className="text-amber-700"> · nalog je že prevzet</span> : null}
            </div>
          )}
        </div>
        <div className="text-lg font-semibold">Si ga porabil za ta nalog?</div>
        <div className="space-y-2">
          <button onClick={onPorabljeno} className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-semibold text-base">
            ✅ Da, porabljen za ta nalog
          </button>
          <button onClick={onZapri} className="w-full bg-gray-200 rounded-xl py-3 font-semibold">
            Ne, še ni porabljen
          </button>
          <button onClick={onSprosti} className="w-full bg-white border border-gray-300 rounded-xl py-2.5 text-sm font-medium">
            ↩ Sprosti rezervacijo (vrni na zalogo)
          </button>
        </div>
      </div>
    </div>
  );
}

// Kompaktna vrstica v podrobnostih rezerviranega kosa.
function RezervacijaTrak({ a, onPorabljeno, onSprosti }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 space-y-2">
      <div className="text-sm text-amber-900">
        🧩 Rezerviran za nalog <b>{a.nalog || "(številka ni vpisana)"}</b>
      </div>
      <div className="flex gap-2">
        <button onClick={onPorabljeno} className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold">
          ✅ Porabljen za ta nalog
        </button>
        <button onClick={onSprosti} className="flex-1 bg-white border border-gray-300 rounded-lg py-2 text-sm font-medium">
          ↩ Sprosti
        </button>
      </div>
    </div>
  );
}

// Povezava do naloga, s katerim je kos povezan (rezervacija ali poraba).
function NalogPovezava({ stevilka }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let preklicano = false;
    naloziNaloge().then((s) => {
      if (!preklicano) setInfo(s.find((n) => sklNorm(n.stevilka) === sklNorm(stevilka)) || null);
    });
    return () => {
      preklicano = true;
    };
  }, [stevilka]);
  if (!info) return null;
  return (
    <a href={povezavaNaloga(info)} className="block text-sm text-blue-700 underline">
      Odpri nalog {info.stevilka} ({info.stranka}) →
    </a>
  );
}
