"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Hammer, Plus, Search, X, Phone, Mail, Calendar, ChevronRight, Trash2, Pencil, Check, ListPlus, FileText, Printer, Ruler, Lock, Unlock, Download, RefreshCw, Save } from "lucide-react";

const STATUSI = ["Sprejeto", "V izdelavi", "Pripravljeno", "Prevzeto"];
const DELAVCI = ["Luka", "Miha", "Rok", "Mersad", "Patrik"];
const ODDAL_NAROCILO = ["Luka", "Miha", "Jože", "Timea", "Žan", "Žiga"];
const CAKS_LOGO = "data:image/png;base64,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";
const STATUS_BARVE = {
  "Sprejeto": "bg-stone-200 text-stone-700 border-stone-300",
  "V izdelavi": "bg-orange-100 text-orange-800 border-orange-300",
  "Pripravljeno": "bg-sky-100 text-sky-800 border-sky-300",
  "Prevzeto": "bg-blue-200 text-blue-900 border-blue-500",
};
const KARTICA_BARVE = {
  "Sprejeto": "bg-stone-100 border-2 border-stone-300 hover:border-stone-400",
  "V izdelavi": "bg-orange-50 border-2 border-orange-400 hover:border-orange-500",
  "Pripravljeno": "bg-sky-50 border-2 border-sky-300 hover:border-sky-400",
  "Prevzeto": "bg-blue-100 border-2 border-blue-600 hover:border-blue-700",
};
const STATUS_HEX = {
  "Sprejeto": "#a8a29e",
  "V izdelavi": "#f97316",
  "Pripravljeno": "#0ea5e9",
  "Prevzeto": "#1e40af",
};

function novaPostavka() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    naziv: "",
    material: "",
    dolzina: "",
    sirina: "",
    debelina: "",
    kolicina: "1",
    cena: "",
    popust: "",
  };
}

function prazenObrazec() {
  return {
    stranka: "",
    telefon: "",
    email: "",
    opis: "",
    rok: "",
    rokUra: "",
    cena: "",
    status: "Sprejeto",
    opombe: "",
    oddal: "",
    tip: "",
    utori: "",
    placano: "Ne",
    popustSkupaj: "",
    vrsta: "narocilo",
    veljavnostPonudbe: "",
    slikaNarocila: null,
    dxfDatoteka: null,
    postavke: [novaPostavka()],
  };
}

function praznoStevilo(predpona = "DN") {
  const d = new Date();
  return `${predpona}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-`;
}

const CENIK = {
  "Rosa Beta": {
    materiali: ["Rosa Beta"],
    brackets: [
      { min: 1, max: 15, cena2: 12.30, cena3: 16.20 },
      { min: 16, max: 20, cena2: 16.40, cena3: 21.60 },
      { min: 21, max: 25, cena2: 20.50, cena3: 27.00 },
      { min: 26, max: 30, cena2: 24.60, cena3: 32.40 },
      { min: 31, max: 35, cena2: 28.70, cena3: 37.80 },
      { min: 36, max: 40, cena2: 32.80, cena3: 43.20 },
      { min: 41, max: 45, cena2: 36.90, cena3: 48.60 },
      { min: 46, max: 50, cena2: 41.00, cena3: 54.00 },
    ],
  },
  "Giandone, Bianco Sardo, Azul Tragal, Rosa Porino, Umetni marmor": {
    materiali: ["Giandone", "Bianco Sardo", "Azul Tragal", "Rosa Porino", "Umetni marmor bela z piko", "Umetni marmor bela z liso"],
    brackets: [
      { min: 1, max: 15, cena2: 16.05, cena3: 19.20 },
      { min: 16, max: 20, cena2: 21.40, cena3: 25.60 },
      { min: 21, max: 25, cena2: 26.75, cena3: 32.00 },
      { min: 26, max: 30, cena2: 32.10, cena3: 38.40 },
      { min: 31, max: 35, cena2: 37.45, cena3: 44.80 },
      { min: 36, max: 40, cena2: 42.80, cena3: 51.20 },
      { min: 41, max: 45, cena2: 48.15, cena3: 57.60 },
      { min: 46, max: 50, cena2: 53.50, cena3: 64.00 },
    ],
  },
  "Juparana Columbo, Multicolor, Nero Impala, Wiscont White, Tonalit, Steel Gray": {
    materiali: ["Juparana Columbo", "Multicolor", "Nero Impala", "Wiscont White", "Tonalit", "Steel Gray"],
    brackets: [
      { min: 1, max: 15, cena2: 23.35, cena3: 27.00 },
      { min: 16, max: 20, cena2: 29.80, cena3: 36.00 },
      { min: 21, max: 25, cena2: 37.25, cena3: 45.00 },
      { min: 26, max: 30, cena2: 44.70, cena3: 54.00 },
      { min: 31, max: 35, cena2: 52.15, cena3: 63.00 },
      { min: 36, max: 40, cena2: 59.60, cena3: 72.00 },
      { min: 41, max: 45, cena2: 67.05, cena3: 81.00 },
      { min: 46, max: 50, cena2: 74.50, cena3: 90.00 },
    ],
  },
  "Ivory Brown, Siwakashi, Paradiso": {
    materiali: ["Ivory Brown", "Siwakashi", "Paradiso"],
    brackets: [
      { min: 1, max: 15, cena2: 30.00, cena3: 33.75 },
      { min: 16, max: 20, cena2: 40.00, cena3: 45.00 },
      { min: 21, max: 25, cena2: 50.00, cena3: 56.25 },
      { min: 26, max: 30, cena2: 60.00, cena3: 67.50 },
      { min: 31, max: 35, cena2: 70.00, cena3: 78.75 },
      { min: 36, max: 40, cena2: 80.00, cena3: 90.00 },
      { min: 41, max: 45, cena2: 90.00, cena3: 101.25 },
      { min: 46, max: 50, cena2: 100.00, cena3: 112.50 },
    ],
  },
  "Black Galaxy, Nero Assoluto, Jet Black": {
    materiali: ["Black Galaxy", "Nero Assoluto", "Jet Black"],
    brackets: [
      { min: 1, max: 15, cena2: 33.00, cena3: 38.25 },
      { min: 16, max: 20, cena2: 44.00, cena3: 51.00 },
      { min: 21, max: 25, cena2: 55.00, cena3: 63.75 },
      { min: 26, max: 30, cena2: 66.00, cena3: 76.50 },
      { min: 31, max: 35, cena2: 77.00, cena3: 89.25 },
      { min: 36, max: 40, cena2: 88.00, cena3: 102.00 },
      { min: 41, max: 45, cena2: 99.00, cena3: 114.75 },
      { min: 46, max: 50, cena2: 110.00, cena3: 127.50 },
    ],
  },
};

const MATERIALI_SEZNAM = Object.values(CENIK).flatMap((s) => s.materiali);

function najdiSkupinoMateriala(material) {
  if (!material) return null;
  const m = material.trim().toLowerCase();
  for (const podatki of Object.values(CENIK)) {
    if (podatki.materiali.some((ime) => ime.toLowerCase() === m)) return podatki;
  }
  return null;
}

function izracunajCenoPostavke(p) {
  const skupina = najdiSkupinoMateriala(p.material);
  if (!skupina) return null;
  const sirina = parseFloat(String(p.sirina).replace(",", "."));
  if (!sirina || sirina <= 0 || sirina > 50) return null;
  const sirinaZaokrozena = Math.ceil(sirina - 1e-9);
  const bracket = skupina.brackets.find((b) => sirinaZaokrozena >= b.min && sirinaZaokrozena <= b.max);
  if (!bracket) return null;
  const debelina = Math.round(parseFloat(String(p.debelina).replace(",", ".")));
  if (debelina !== 2 && debelina !== 3) return null;
  const cenaZaM = debelina === 2 ? bracket.cena2 : bracket.cena3;
  const dolzina = parseFloat(String(p.dolzina).replace(",", "."));
  const kolicina = parseFloat(String(p.kolicina).replace(",", ".")) || 1;
  if (!dolzina || dolzina <= 0) return null;
  const dolzinaM = (dolzina / 100) * kolicina;
  let cena = dolzinaM * cenaZaM;
  const popust = parseFloat(String(p.popust).replace(",", "."));
  if (popust && popust > 0) {
    cena = cena * (1 - popust / 100);
  }
  return Math.round(cena * 100) / 100;
}

function m2Postavke(p) {
  const d = parseFloat(String(p.dolzina).replace(",", "."));
  const s = parseFloat(String(p.sirina).replace(",", "."));
  const k = parseFloat(String(p.kolicina).replace(",", ".")) || 1;
  if (!d || !s) return 0;
  return (d * s / 10000) * k;
}

function jeZamujen(nalog) {
  if (!nalog.rok || nalog.status === "Prevzeto") return false;
  const danes = new Date();
  danes.setHours(0, 0, 0, 0);
  const rok = new Date(nalog.rok);
  return rok < danes;
}

function ponedeljekTedna(datumStr) {
  const d = new Date(datumStr);
  const dan = d.getDay();
  const razlika = (dan === 0 ? -6 : 1) - dan;
  const ponedeljek = new Date(d);
  ponedeljek.setDate(d.getDate() + razlika);
  return ponedeljek.toISOString().slice(0, 10);
}

function kljucObdobja(datumVnosa, obdobje) {
  if (!datumVnosa) return null;
  if (obdobje === "dan") return datumVnosa.slice(0, 10);
  if (obdobje === "teden") return ponedeljekTedna(datumVnosa);
  if (obdobje === "mesec") return datumVnosa.slice(0, 7);
  return datumVnosa.slice(0, 4);
}

function nazivObdobja(kljuc, obdobje) {
  if (obdobje === "dan") {
    return new Date(kljuc).toLocaleDateString("sl-SI", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" });
  }
  if (obdobje === "teden") {
    return "Teden od " + new Date(kljuc).toLocaleDateString("sl-SI");
  }
  if (obdobje === "mesec") {
    return new Date(kljuc + "-01").toLocaleDateString("sl-SI", { month: "long", year: "numeric" });
  }
  return kljuc;
}

function izracunajPorocilo(nalogi, obdobje) {
  const dnevneVsote = {};
  nalogi.forEach((n) => {
    const cena = parseFloat(String(n.cena).replace(",", "."));
    if (!cena || isNaN(cena) || !n.datumVnosa) return;
    const dan = n.datumVnosa.slice(0, 10);
    dnevneVsote[dan] = (dnevneVsote[dan] || 0) + cena;
  });

  if (obdobje === "teden" || obdobje === "mesec") {
    const danesObj = new Date();
    danesObj.setHours(0, 0, 0, 0);
    let dnevi = [];
    if (obdobje === "teden") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(danesObj);
        d.setDate(d.getDate() - i);
        dnevi.push(d);
      }
    } else {
      const prviDanMeseca = new Date(danesObj.getFullYear(), danesObj.getMonth(), 1);
      const zadnjiDanMeseca = new Date(danesObj.getFullYear(), danesObj.getMonth() + 1, 0);
      for (let d = new Date(prviDanMeseca); d <= zadnjiDanMeseca; d.setDate(d.getDate() + 1)) {
        dnevi.push(new Date(d));
      }
    }
    return dnevi.map((d) => {
      const kljuc = d.toISOString().slice(0, 10);
      return {
        kljuc,
        naziv: d.toLocaleDateString("sl-SI", { weekday: "short", day: "numeric", month: "numeric" }),
        vsota: dnevneVsote[kljuc] || 0,
      };
    });
  }

  const skupine = {};
  nalogi.forEach((n) => {
    const cena = parseFloat(String(n.cena).replace(",", "."));
    if (!cena || isNaN(cena) || !n.datumVnosa) return;
    const kljuc = kljucObdobja(n.datumVnosa, obdobje);
    if (!kljuc) return;
    skupine[kljuc] = (skupine[kljuc] || 0) + cena;
  });
  return Object.entries(skupine)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([kljuc, vsota]) => ({ kljuc, naziv: nazivObdobja(kljuc, obdobje), vsota }));
}

function obvestiloMailto(nalog) {
  const zadeva = `Vaše naročilo ${nalog.stevilka || ""} je pripravljeno`;
  const besedilo =
    `Pozdravljeni ${nalog.stranka},\n\n` +
    `obveščamo vas, da je vaše naročilo v Kamnoseštvu Čakš (${nalog.stevilka || ""} – ${nalog.opis || ""}) pripravljeno za prevzem.\n\n` +
    `Prevzamete ga lahko vsak dan od 7.00 do 15.00 ali po dogovoru na številki 031 235 146.\n\n` +
    `Lep pozdrav,\nKamnoseštvo Čakš`;
  return `mailto:${nalog.email}?subject=${encodeURIComponent(zadeva)}&body=${encodeURIComponent(besedilo)}`;
}

function obvestiloSMS(nalog) {
  const stevilkaCista = (nalog.telefon || "").replace(/[^0-9+]/g, "");
  const besedilo =
    `Pozdravljeni ${nalog.stranka}, vaše naročilo (${nalog.stevilka || ""}) v Kamnoseštvu Čakš je pripravljeno za prevzem. Odprto vsak dan 7.00-15.00 ali po dogovoru na 031 235 146. Lep pozdrav, Kamnoseštvo Čakš`;
  const jeIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const locilo = jeIOS ? "&" : "?";
  return `sms:${stevilkaCista}${locilo}body=${encodeURIComponent(besedilo)}`;
}

function besediloPonudbe(nalog) {
  const neto = parseFloat(String(nalog.cena).replace(",", ".")) || 0;
  const popust = parseFloat(String(nalog.popustSkupaj).replace(",", ".")) || 0;
  const netoPoPopustu = neto * (1 - popust / 100);
  const bruto = netoPoPopustu * 1.22;
  const veljavnost = nalog.veljavnostPonudbe
    ? `Ponudba velja do ${new Date(nalog.veljavnostPonudbe).toLocaleDateString("sl-SI")}.`
    : "";
  return (
    `Pozdravljeni ${nalog.stranka},\n\n` +
    `pošiljamo vam ponudbo ${nalog.stevilka || ""} za: ${nalog.opis || ""}.\n\n` +
    `Skupna vrednost: ${netoPoPopustu.toFixed(2)} € (z DDV: ${bruto.toFixed(2)} €).\n` +
    (veljavnost ? `${veljavnost}\n\n` : "\n") +
    `Za vsa vprašanja smo dosegljivi na 031 235 146.\n\n` +
    `Lep pozdrav,\nKamnoseštvo Čakš`
  );
}

function ponudbaMailto(nalog) {
  const zadeva = `Ponudba ${nalog.stevilka || ""} — Kamnoseštvo Čakš`;
  return `mailto:${nalog.email}?subject=${encodeURIComponent(zadeva)}&body=${encodeURIComponent(besediloPonudbe(nalog))}`;
}

const COMPANY_EMAIL = "kamnosestvo.caks@siol.net";
// ZAČASNO: Resend brez preverjene domene (caks.si) lahko pošilja samo na ta prijavni e-mail.
// Ko bo domena caks.si preverjena pri Resendu, spremeni to nazaj na `nalog.email`, da dobavnice
// hodijo neposredno na e-mail stranke.
const ZACASNI_PREJEMNIK_DOBAVNIC = "caksl.info@gmail.com";

function dobavnicaMailto(nalog) {
  const zadeva = `Dobavnica ${nalog.stevilka || ""} — podpisana — Kamnoseštvo Čakš`;
  const besedilo =
    `Pozdravljeni,\n\n` +
    `v prilogi pošiljamo podpisano dobavnico ${nalog.stevilka || ""} za naročilo (${nalog.opis || ""}).\n` +
    `Blago je prevzel: ${nalog.podpisIme || nalog.prevzel || nalog.stranka}${nalog.podpisDatum ? `, dne ${new Date(nalog.podpisDatum).toLocaleString("sl-SI")}` : ""}.\n\n` +
    `POMEMBNO: datoteka z dobavnico se je pravkar prenesla na ta računalnik/telefon — pred pošiljanjem jo ročno pripni k temu sporočilu.\n\n` +
    `Lep pozdrav,\nKamnoseštvo Čakš\n031 235 146`;
  const prejemnik = nalog.email || "";
  return `mailto:${prejemnik}?subject=${encodeURIComponent(zadeva)}&body=${encodeURIComponent(besedilo)}`;
}

function ponudbaSMS(nalog) {
  const stevilkaCista = (nalog.telefon || "").replace(/[^0-9+]/g, "");
  const jeIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const locilo = jeIOS ? "&" : "?";
  return `sms:${stevilkaCista}${locilo}body=${encodeURIComponent(besediloPonudbe(nalog))}`;
}

function izracunajRazredePolic(nalog) {
  const postavke = (nalog.postavke || []).filter((p) => p.naziv || p.material || p.dolzina);
  const skupine = {};

  postavke.forEach((p) => {
    const skupinaPodatki = najdiSkupinoMateriala(p.material);
    const sirina = parseFloat(String(p.sirina).replace(",", "."));
    const dolzina = parseFloat(String(p.dolzina).replace(",", "."));
    const kolicina = parseFloat(String(p.kolicina).replace(",", ".")) || 1;
    const debelina = Math.round(parseFloat(String(p.debelina).replace(",", ".")));
    if (!sirina || sirina <= 0 || !dolzina || dolzina <= 0) return;

    let oznakaRazreda, materialIme;
    if (skupinaPodatki) {
      const sirinaZaokrozena = Math.ceil(sirina - 1e-9);
      const bracket = skupinaPodatki.brackets.find((b) => sirinaZaokrozena >= b.min && sirinaZaokrozena <= b.max);
      oznakaRazreda = bracket ? `${bracket.min}-${bracket.max} cm` : "izven cenika";
      materialIme = p.material;
    } else {
      oznakaRazreda = "ni v ceniku";
      materialIme = p.material || "—";
    }
    const debelinaOznaka = debelina ? `${debelina} cm` : "—";
    const kljuc = `${materialIme}|${oznakaRazreda}|${debelinaOznaka}`;

    if (!skupine[kljuc]) {
      skupine[kljuc] = {
        material: materialIme,
        razred: oznakaRazreda,
        debelina: debelinaOznaka,
        tekociMetri: 0,
        stevilo: 0,
      };
    }
    skupine[kljuc].tekociMetri += (dolzina / 100) * kolicina;
    skupine[kljuc].stevilo += kolicina;
  });

  return Object.values(skupine).sort((a, b) => a.material.localeCompare(b.material, "sl"));
}

function izvoziDonatoniCSV(nalog) {
  const postavke = (nalog.postavke || []).filter((p) => p.naziv || p.material || p.dolzina);
  const glave = ["Numero", "Larghezza", "Altezza", "Nome", "Spessore"];
  const ubezi = (val) => {
    const s = String(val ?? "");
    if (s.includes(";") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const prveTriCrkeStranke = (nalog.stranka || "").trim().slice(0, 3).toUpperCase();
  const vrstice = postavke.map((p, idx) => {
    const mm = (v) => {
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? "" : n * 10;
    };
    const imePolice = p.naziv && p.naziv.trim() ? p.naziv.trim() : `Polica ${idx + 1}`;
    const dolzinaMM = mm(p.dolzina);
    const sirinaMM = mm(p.sirina);
    return [
      p.kolicina || "1",
      dolzinaMM,
      sirinaMM,
      `${prveTriCrkeStranke} ${imePolice} ${dolzinaMM}x${sirinaMM}`,
      mm(p.debelina),
    ];
  });
  const csv = [glave, ...vrstice].map((r) => r.map(ubezi).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const strankaVarno = (nalog.stranka || "").replace(/[\\/:*?"<>|]/g, "").trim();
  a.download = `csv donatoni ${nalog.stevilka || "nalog"}${strankaVarno ? " " + strankaVarno : ""}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function prenesiVarnostnoKopijo(nalogi) {
  const danes = new Date().toISOString().slice(0, 10);
  const vsebina = JSON.stringify(nalogi, null, 2);
  const blob = new Blob([vsebina], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `varnostna-kopija-delovni-nalogi-${danes}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function obnoviIzDatoteke(event, shraniNalogi) {
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
        await shraniNalogi(podatki);
        alert("Podatki so bili uspešno obnovljeni.");
      }
    } catch (err) {
      alert("Napaka pri branju datoteke — preveri, da je to prava .json varnostna kopija.");
    }
  };
  bralnik.readAsText(datoteka);
  event.target.value = "";
}

function strankaZaIme(nalog) {
  return (nalog.stranka || "").replace(/[\\/:*?"<>|]/g, "").trim();
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

async function obravnavajNalozenoDatoteko(event, nastavi, kljucPredpona) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > MAX_DATOTEKA_MB * 1024 * 1024) {
    alert(`Datoteka je prevelika (max ${MAX_DATOTEKA_MB} MB). Poskusi manjšo/stisnjeno datoteko.`);
    event.target.value = "";
    return;
  }
  try {
    const rezultat = await datotekaVBase64(file);
    const kljuc = `${kljucPredpona}-${Date.now()}`;
    const res = await fetch("/api/priloge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kljuc, podatki: rezultat }),
    });
    if (!res.ok) {
      alert("Shranjevanje datoteke ni uspelo (morda je prevelika). Poskusi manjšo datoteko.");
      event.target.value = "";
      return;
    }
    // V nalog shranimo samo majhno referenco (ime, tip, kljuc), ne cele datoteke —
    // s tem glavni seznam naročil ne naraste prek dovoljene velikosti pri shranjevanju.
    nastavi({ ime: rezultat.ime, tip: rezultat.tip, kljuc });
  } catch (e) {
    alert("Napaka pri nalaganju datoteke.");
  }
  event.target.value = "";
}

function PrilogaPregled({ referenca, slikaRazred }) {
  const [podatkiURL, setPodatkiURL] = useState(null);
  const [nalaga, setNalaga] = useState(true);

  useEffect(() => {
    let odjava = false;
    setNalaga(true);
    fetch(`/api/priloge?kljuc=${encodeURIComponent(referenca.kljuc)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => {
        if (!odjava && p && p.podatki) setPodatkiURL(p.podatki);
      })
      .finally(() => {
        if (!odjava) setNalaga(false);
      });
    return () => { odjava = true; };
  }, [referenca.kljuc]);

  if (nalaga) return <p className="text-xs text-stone-400">Nalagam prilogo …</p>;
  if (!podatkiURL) return <p className="text-xs text-stone-400">Priloge ni bilo mogoče naložiti.</p>;

  const jeSlika = referenca.tip && referenca.tip.startsWith("image/");
  return jeSlika ? (
    <img src={podatkiURL} alt={referenca.ime} className={slikaRazred || "max-h-64 rounded-lg border border-stone-200 mx-auto"} />
  ) : (
    <a href={podatkiURL} download={referenca.ime} className="text-sm text-red-700 underline block">
      ⬇ Prenesi {referenca.ime}
    </a>
  );
}

function zgradiHTMLDokument(selector, naslov) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return (
    "<!DOCTYPE html><html lang=\"sl\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<title>" + naslov + "</title>" +
    "<script src=\"https://cdn.tailwindcss.com\"></script>" +
    "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">" +
    "<link href=\"https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">" +
    "<style>" +
    "body{font-family:'Inter',system-ui,sans-serif;background:#f5f5f4;margin:0;padding:24px;}" +
    ".carved{font-family:'Oswald',sans-serif;letter-spacing:0.04em;}" +
    ".navodilo{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;max-width:800px;margin-left:auto;margin-right:auto;}" +
    ".ovoj{max-width:800px;margin:0 auto;}" +
    "@media print { .navodilo{ display:none !important; } body{ background:#fff !important; padding:0 !important; } .ovoj{ max-width:100% !important; } }" +
    "</style></head><body>" +
    "<div class=\"navodilo\">To je prenesena datoteka za tiskanje. Uporabi Ctrl+P (Cmd+P na Mac) ali meni brskalnika &rarr; Natisni / Shrani kot PDF.</div>" +
    "<div class=\"ovoj\">" + el.outerHTML + "</div>" +
    "</body></html>"
  );
}

function prenesiHTMLDokument(selector, naslov, imeDatoteke) {
  const html = zgradiHTMLDokument(selector, naslov);
  if (!html) {
    alert("Ni bilo mogoče najti vsebine za izpis.");
    return;
  }
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

async function posljiDokumentPoMailu(selector, naslov, imeDatoteke, na, zadeva, besedilo) {
  const html = zgradiHTMLDokument(selector, naslov);
  if (!html) {
    alert("Ni bilo mogoče najti vsebine za pošiljanje.");
    return false;
  }
  if (!na) {
    alert("Stranka nima vnesenega e-mail naslova.");
    return false;
  }
  try {
    const res = await fetch("/api/posljidobavnico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ na, zadeva, besedilo, imeDatoteke, vsebinaDatoteke: html }),
    });
    const odgovor = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`Pošiljanje ni uspelo (${res.status}): ${odgovor.napaka || ""}\n${odgovor.podrobnosti || ""}`);
      return false;
    }
    return true;
  } catch (e) {
    alert("Napaka pri pošiljanju e-pošte. Preveri povezavo.");
    return false;
  }
}

const ADMIN_PIN = "1991";

export default function DelovniNalogi() {
  const [nalogi, setNalogi] = useState([]);
  const [naloziLoading, setNaloziLoading] = useState(true);
  const [zadnjaVerzija, setZadnjaVerzija] = useState(0);
  const [potrditevShranjeno, setPotrditevShranjeno] = useState(false);
  const [napaka, setNapaka] = useState("");
  const [pogled, setPogled] = useState("seznam");
  const [aktivniId, setAktivniId] = useState(null);
  const [obrazec, setObrazec] = useState(prazenObrazec());
  const [iskanje, setIskanje] = useState("");
  const [filterStatusi, setFilterStatusi] = useState([]);
  const [pokaziSamoRacune, setPokaziSamoRacune] = useState(false);
  const [shranjujem, setShranjujem] = useState(false);
  const [adminOdklenjen, setAdminOdklenjen] = useState(false);
  const [pokaziPinVnos, setPokaziPinVnos] = useState(false);
  const [pinVnos, setPinVnos] = useState("");
  const [pinNapaka, setPinNapaka] = useState("");
  const [izbranaStranka, setIzbranaStranka] = useState(null);

  const [rocniMaterial, setRocniMaterial] = useState({});

  const [pultiPodatki, setPultiPodatki] = useState([]);
  const [spomenikiPodatki, setSpomenikiPodatki] = useState([]);

  async function nalozizPultiInSpomenike() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/pulti", { cache: "no-store" }),
        fetch("/api/spomeniki", { cache: "no-store" }),
      ]);
      const [pulti, spomeniki] = await Promise.all([pRes.json(), sRes.json()]);
      setPultiPodatki(Array.isArray(pulti) ? pulti : []);
      setSpomenikiPodatki(Array.isArray(spomeniki) ? spomeniki : []);
    } catch (e) {}
  }

  async function preklopiPlacanoPulti(id) {
    const noviSeznam = pultiPodatki.map((p) => (p.id === id ? { ...p, placano: !p.placano } : p));
    setPultiPodatki(noviSeznam);
    try {
      await fetch("/api/pulti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noviSeznam),
      });
    } catch (e) {}
  }

  async function preklopiPlacanoSpomenik(id) {
    const noviSeznam = spomenikiPodatki.map((s) => (s.id === id ? { ...s, placano: s.placano === "Da" ? "Ne" : "Da" } : s));
    setSpomenikiPodatki(noviSeznam);
    try {
      await fetch("/api/spomeniki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam: noviSeznam }),
      });
    } catch (e) {}
  }

  useEffect(() => {
    // Naloži polne podatke iz Pultov in Spomenikov (za skupno vrednost IN skupen seznam neplačanih).
    nalozizPultiInSpomenike();
  }, []);

  useEffect(() => {
    try {
      const shranjeno = localStorage.getItem("admin-odklenjen");
      if (shranjeno === "da") setAdminOdklenjen(true);
    } catch (e) {
      // localStorage ni na voljo
    }
  }, []);

  // Opozori uporabnika, če poskuša zapreti/osvežiti stran, medtem ko ureja nalog,
  // ki ga še ni shranil na strežnik — prepreči nehoteno izgubo vnesenih podatkov.
  useEffect(() => {
    function opozoriPredOdhodom(e) {
      if (pogled === "nov") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    }
    window.addEventListener("beforeunload", opozoriPredOdhodom);
    return () => window.removeEventListener("beforeunload", opozoriPredOdhodom);
  }, [pogled]);

  function potrdiPin() {
    if (pinVnos === ADMIN_PIN) {
      setAdminOdklenjen(true);
      setPokaziPinVnos(false);
      setPinVnos("");
      setPinNapaka("");
      try { localStorage.setItem("admin-odklenjen", "da"); } catch (e) {}
    } else {
      setPinNapaka("Napačna koda.");
    }
  }

  function zapriAdmin() {
    setAdminOdklenjen(false);
    try { localStorage.setItem("admin-odklenjen", "ne"); } catch (e) {}
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/nalogi", { cache: "no-store" });
        const podatki = await res.json();
        setZadnjaVerzija(Number(res.headers.get("X-Verzija")) || 0);
        if (Array.isArray(podatki)) {
          const popravljeni = podatki.map((n) => ({
            ...n,
            postavke: Array.isArray(n.postavke) && n.postavke.length ? n.postavke : [novaPostavka()],
          }));
          setNalogi(popravljeni);
        }
      } catch (e) {
        setNalogi([]);
      } finally {
        setNaloziLoading(false);
      }
    })();
  }, []);

  async function shraniNalogi(noviSeznam, pricakovanaVerzija) {
    setNalogi(noviSeznam);
    setShranjujem(true);
    let uspeh = false;
    try {
      const res = await fetch("/api/nalogi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam: noviSeznam, pricakovanaVerzija }),
      });
      const odgovor = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setNapaka(
          odgovor.zastarelaAplikacija
            ? "Aplikacija na tej napravi je zastarela. Stran se je osvežila – preveri stanje in poskusi znova."
            : "Nekdo drug je medtem spremenil podatke. Stran se je osvežila na najnovejše stanje – preveri in poskusi znova."
        );
        try {
          const svezRes = await fetch("/api/nalogi", { cache: "no-store" });
          const sveziPodatki = await svezRes.json();
          if (Array.isArray(sveziPodatki)) {
            setNalogi(
              sveziPodatki.map((n) => ({
                ...n,
                postavke: Array.isArray(n.postavke) && n.postavke.length ? n.postavke : [novaPostavka()],
              }))
            );
          }
          setZadnjaVerzija(Number(svezRes.headers.get("X-Verzija")) || 0);
        } catch (e2) {}
      } else if (!res.ok) {
        setNapaka(
          `Shranjevanje ni uspelo (${res.status}). ${odgovor.napaka || ""} ${odgovor.podrobnosti || ""}`.trim()
        );
      } else {
        setNapaka("");
        if (odgovor.verzija !== undefined) setZadnjaVerzija(odgovor.verzija);
        uspeh = true;
      }
    } catch (e) {
      setNapaka("Napaka pri shranjevanju. Preveri povezavo in poskusi znova.");
    } finally {
      setShranjujem(false);
    }
    return uspeh;
  }

  // Varno spreminjanje: najprej osveži najnovejše stanje in verzijo iz baze (v primeru, da je
  // bilo med tem spremenjeno na drugi napravi), šele nato vanj vnese lokalno spremembo in
  // shrani z navedbo pričakovane verzije — če se medtem kdo drug shrani prvi, strežnik zavrne.
  async function posodobiNaloge(transformFn) {
    let osnova = nalogi;
    let verzija = zadnjaVerzija;
    try {
      const res = await fetch("/api/nalogi", { cache: "no-store" });
      const sveze = await res.json();
      verzija = Number(res.headers.get("X-Verzija")) || 0;
      if (Array.isArray(sveze)) {
        osnova = sveze.map((n) => ({
          ...n,
          postavke: Array.isArray(n.postavke) && n.postavke.length ? n.postavke : [novaPostavka()],
        }));
      }
    } catch (e) {
      // če osveževanje ne uspe, nadaljujemo z lokalnim stanjem kot rezervo
    }
    const novi = transformFn(osnova);
    return await shraniNalogi(novi, verzija);
  }

  async function pociistiVelikePriloge() {
    setNapaka("");
    try {
      const res = await fetch("/api/nalogi", { cache: "no-store" });
      const trenutni = await res.json();
      const verzija = Number(res.headers.get("X-Verzija")) || 0;
      if (!Array.isArray(trenutni)) {
        alert("Ni bilo mogoče prebrati podatkov.");
        return;
      }
      let steviloPocisceno = 0;
      const novi = [];
      for (const n of trenutni) {
        const posodobljen = { ...n };
        for (const polje of ["slikaNarocila", "dxfDatoteka"]) {
          const vrednost = posodobljen[polje];
          // Star format ima podatke (base64) neposredno v naročilu — to je vzrok napake 413.
          if (vrednost && vrednost.podatki && !vrednost.kljuc) {
            const kljuc = `nalog-${n.id}-${polje}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            try {
              const rp = await fetch("/api/priloge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kljuc, podatki: vrednost }),
              });
              if (rp.ok) {
                posodobljen[polje] = { ime: vrednost.ime, tip: vrednost.tip, kljuc };
                steviloPocisceno++;
              }
            } catch (e) {}
          }
        }
        novi.push(posodobljen);
      }
      if (steviloPocisceno > 0) {
        const uspeh = await shraniNalogi(novi, verzija);
        if (uspeh) {
          alert(`Počiščenih ${steviloPocisceno} starih prilog. Shranjevanje bi zdaj moralo znova delovati.`);
        } else {
          alert("Priloge so bile prenesene, a shranjevanje seznama je še vedno spodletelo. Sporoči Claudu.");
        }
      } else {
        alert("Ni bilo najdenih starih (prevelikih) prilog. Vzrok napake 413 je verjetno drugje.");
      }
    } catch (e) {
      alert("Napaka pri čiščenju prilog.");
    }
  }

  function odpriNov() {
    setObrazec(prazenObrazec());
    setAktivniId(null);
    setPogled("nov");
  }

  function odpriNovoPonudbo() {
    setObrazec({ ...prazenObrazec(), vrsta: "ponudba" });
    setAktivniId(null);
    setPogled("nov");
  }

  function odpriUredi(nalog) {
    setObrazec({
      ...nalog,
      email: nalog.email || "",
      utori: nalog.utori || "",
      placano: nalog.placano || "Ne",
      popustSkupaj: nalog.popustSkupaj || "",
      rokUra: nalog.rokUra || "",
      veljavnostPonudbe: nalog.veljavnostPonudbe || "",
      slikaNarocila: nalog.slikaNarocila || null,
      dxfDatoteka: nalog.dxfDatoteka || null,
      postavke: nalog.postavke.length ? nalog.postavke : [novaPostavka()],
    });
    setAktivniId(nalog.id);
    setPogled("nov");
  }

  function odpriPodrobnosti(id) {
    setAktivniId(id);
    setPogled("podrobnosti");
  }

  function dodajPostavko() {
    setObrazec({ ...obrazec, postavke: [...obrazec.postavke, novaPostavka()] });
  }

  function dodajVecPostavk(stevilo) {
    const nove = Array.from({ length: stevilo }, () => novaPostavka());
    setObrazec({ ...obrazec, postavke: [...obrazec.postavke, ...nove] });
  }

  function vsotaPostavk(postavke) {
    const v = postavke.reduce((vsota, p) => {
      const c = parseFloat(String(p.cena).replace(",", "."));
      return vsota + (isNaN(c) ? 0 : c);
    }, 0);
    return v > 0 ? v.toFixed(2) : "";
  }

  function posodobiPostavko(id, polje, vrednost) {
    const posodobljenePostavke = obrazec.postavke.map((p) => {
      if (p.id !== id) return p;
      const posodobljena = { ...p, [polje]: vrednost };
      if (["material", "dolzina", "sirina", "debelina", "kolicina", "popust"].includes(polje)) {
        const izracunana = izracunajCenoPostavke(posodobljena);
        if (izracunana !== null) posodobljena.cena = String(izracunana);
      }
      return posodobljena;
    });
    setObrazec({
      ...obrazec,
      postavke: posodobljenePostavke,
      cena: vsotaPostavk(posodobljenePostavke),
    });
  }

  function izbrisiPostavko(id) {
    const posodobljenePostavke = obrazec.postavke.filter((p) => p.id !== id);
    setObrazec({
      ...obrazec,
      postavke: posodobljenePostavke,
      cena: vsotaPostavk(posodobljenePostavke),
    });
  }

  async function shraniObrazec() {
    if (!obrazec.stranka.trim() || !obrazec.opis.trim()) {
      setNapaka("Vnesi vsaj ime stranke in opis dela.");
      return;
    }
    setNapaka("");
    const ocisceniPostavki = obrazec.postavke.filter(
      (p) => p.naziv.trim() || p.material.trim() || p.dolzina || p.sirina || p.debelina
    );
    const obrazecZaShranjevanje = { ...obrazec, postavke: ocisceniPostavki.length ? ocisceniPostavki : [novaPostavka()] };

    if (aktivniId) {
      const uspeh = await posodobiNaloge((os) => os.map((n) => (n.id === aktivniId ? { ...obrazecZaShranjevanje, id: aktivniId } : n)));
      setAktivniId(aktivniId);
      setPogled("podrobnosti");
      if (uspeh) {
        setPotrditevShranjeno(true);
        setTimeout(() => setPotrditevShranjeno(false), 3000);
      }
    } else {
      let novId = null;
      const uspeh = await posodobiNaloge((os) => {
        const predpona = obrazec.vrsta === "ponudba" ? "PO" : "DN";
        const stevilkaIndex = os.filter((n) => (n.vrsta || "narocilo") === (obrazec.vrsta || "narocilo")).length + 1;
        const novNalog = {
          ...obrazecZaShranjevanje,
          id: `${Date.now()}`,
          stevilka: `${praznoStevilo(predpona)}${String(stevilkaIndex).padStart(3, "0")}`,
          datumVnosa: new Date().toISOString(),
        };
        novId = novNalog.id;
        return [novNalog, ...os];
      });
      setAktivniId(novId);
      setPogled("podrobnosti");
      if (uspeh) {
        setPotrditevShranjeno(true);
        setTimeout(() => setPotrditevShranjeno(false), 3000);
      }
    }
  }

  async function pretvoriVDelovniNalog(id) {
    const nalog = nalogi.find((n) => n.id === id);
    if (!nalog) return;
    const potrdi = window.confirm(`Ali želiš ponudbo ${nalog.stevilka} pretvoriti v pravi delovni nalog? Dobila bo novo številko delovnega naloga.`);
    if (!potrdi) return;
    await posodobiNaloge((os) => {
      const stevilkaIndex = os.filter((n) => (n.vrsta || "narocilo") === "narocilo").length + 1;
      const novaStevilka = `${praznoStevilo("DN")}${String(stevilkaIndex).padStart(3, "0")}`;
      return os.map((n) => (n.id === id ? { ...n, vrsta: "narocilo", stevilka: novaStevilka, status: "Sprejeto" } : n));
    });
  }

  async function izbrisiNalog(id) {
    await posodobiNaloge((os) => os.filter((n) => n.id !== id));
    setPogled("seznam");
  }

  async function spremeniStatus(id, status) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, status } : n)));
  }

  async function spremeniPlacano(id, placano) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, placano } : n)));
  }

  async function spremeniRacun(id, racun) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, racun } : n)));
  }

  async function shraniPrevzel(id, prevzel) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, prevzel } : n)));
  }

  async function shraniIzvajalca(id, izvajalec) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, izvajalec } : n)));
  }

  async function shraniOddal(id, oddal) {
    await posodobiNaloge((os) => os.map((n) => (n.id === id ? { ...n, oddal } : n)));
  }

  const aktivniNalog = nalogi.find((n) => n.id === aktivniId);

  const podatkiGrafa = STATUSI.map((s) => ({
    name: s,
    value: nalogi.filter((n) => n.status === s).length,
  })).filter((d) => d.value > 0);

  const skupnaVrednostVseh = nalogi.reduce((v, n) => {
    const c = parseFloat(String(n.cena).replace(",", "."));
    return v + (isNaN(c) ? 0 : c);
  }, 0);

  const steviloVarno = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };
  const vrednostPultiSpomeniki =
    pultiPodatki.reduce((v, p) => v + steviloVarno(p.ponudbenaCena), 0) +
    spomenikiPodatki.reduce((v, s) => v + steviloVarno(s.cena), 0);
  const neplacaniPulti = pultiPodatki.filter((p) => !p.placano);
  const neplacaniSpomeniki = spomenikiPodatki.filter((s) => s.placano !== "Da");

  const edinstveneStranke = [...new Set(nalogi.map((n) => n.stranka).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "sl")
  );

  function najdiPodatkeStranke(imeStranke) {
    const ujemanja = nalogi
      .filter((n) => n.stranka === imeStranke && (n.telefon || n.email))
      .sort((a, b) => (b.datumVnosa || "").localeCompare(a.datumVnosa || ""));
    return ujemanja.length ? { telefon: ujemanja[0].telefon || "", email: ujemanja[0].email || "" } : null;
  }


  const filtrirani = nalogi.filter((n) => {
    const ujemaIskanje =
      n.stranka.toLowerCase().includes(iskanje.toLowerCase()) ||
      n.opis.toLowerCase().includes(iskanje.toLowerCase()) ||
      (n.stevilka || "").toLowerCase().includes(iskanje.toLowerCase());
    const ujemaStatus = filterStatusi.length === 0 || filterStatusi.includes(n.status);
    const ujemaRacun = !pokaziSamoRacune || n.racun === "poslati";
    return ujemaIskanje && ujemaStatus && ujemaRacun;
  });

  const steviloZaPoslatiRacun = nalogi.filter((n) => n.racun === "poslati").length;

  const skupajM2Obrazec = obrazec.postavke.reduce((vsota, p) => vsota + m2Postavke(p), 0);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .carved {
          font-family: 'Oswald', sans-serif;
          letter-spacing: 0.04em;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.15);
        }
        .chisel-line {
          background-image: repeating-linear-gradient(135deg, transparent, transparent 7px, rgba(0,0,0,0.04) 7px, rgba(0,0,0,0.04) 8px);
        }
        .postavka-input {
          width: 100%;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #d6d3d1;
          font-size: 13px;
          background: white;
        }
        .postavka-input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245,158,11,0.25);
        }
        @media (min-width: 640px) {
          .postavka-row {
            grid-template-columns: 2fr 1.6fr 1fr 1fr 1fr 0.8fr auto;
          }
        }
      `}</style>

      <header className="bg-black text-stone-100 chisel-line">
        <div className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-11 rounded bg-white flex items-center justify-center border border-stone-700 px-1.5 py-1">
              <img src={CAKS_LOGO} alt="Čakš logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="carved text-2xl uppercase tracking-wide text-stone-50">Delovni nalogi</h1>
              <p className="text-stone-400 text-xs">Kamnoseštvo Čakš</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/pulti"
              className="text-stone-400 hover:text-white text-xs border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors"
            >
              Pulti
            </a>
            <a
              href="/sestanki"
              className="text-stone-400 hover:text-white text-xs border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors"
            >
              Sestanki/Izmere
            </a>
            <a
              href="/spomeniki"
              className="text-stone-400 hover:text-white text-xs border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors"
            >
              Spomeniki
            </a>
            <button
              onClick={() => {
                window.location.href = window.location.pathname + "?osvezeno=" + Date.now();
              }}
              className="text-stone-400 hover:text-white text-xs border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors flex items-center gap-1"
              title="Osveži aplikacijo — prenese najnovejšo različico in podatke"
            >
              <RefreshCw size={13} /> Osveži
            </button>
            {adminOdklenjen ? (
              <button
                onClick={zapriAdmin}
                className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors"
                title="Admin odklenjen — klikni za zaklep"
              >
                <Unlock size={14} /> Admin
              </button>
            ) : (
              <button
                onClick={() => { setPokaziPinVnos(!pokaziPinVnos); setPinNapaka(""); }}
                className="text-stone-400 hover:text-white text-xs flex items-center gap-1 border border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-800 transition-colors"
                title="Odkleni admin"
              >
                <Lock size={14} />
              </button>
            )}
            {pogled !== "seznam" && (
              <button
                onClick={() => setPogled("seznam")}
                className="text-stone-300 hover:text-white text-sm flex items-center gap-1 border border-stone-700 rounded px-3 py-1.5 hover:bg-stone-800 transition-colors"
              >
                <X size={16} /> Zapri
              </button>
            )}
          </div>
        </div>
        {pokaziPinVnos && !adminOdklenjen && (
          <div className="max-w-4xl mx-auto px-5 pb-4 -mt-2">
            <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={pinVnos}
                onChange={(e) => setPinVnos(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") potrdiPin(); }}
                placeholder="Vnesi admin kodo"
                className="flex-1 px-2.5 py-1.5 rounded bg-stone-900 border border-stone-600 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              <button
                onClick={potrdiPin}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
              >
                Odkleni
              </button>
            </div>
            {pinNapaka && <p className="text-red-400 text-xs mt-1.5">{pinNapaka}</p>}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6 pb-24">
        {napaka && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {napaka}
          </div>
        )}

        {naloziLoading && (
          <div className="text-center text-stone-500 py-16">Nalagam naloge…</div>
        )}

        {!naloziLoading && pogled === "seznam" && (
          <div>
            {adminOdklenjen && nalogi.length > 0 && (
              <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase mb-1 flex items-center gap-1.5">
                      <Unlock size={12} /> Skupna vrednost vseh naročil
                    </p>
                    <p className="text-2xl font-bold text-white">{(skupnaVrednostVseh + vrednostPultiSpomeniki).toFixed(2)} €</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Police: {skupnaVrednostVseh.toFixed(2)} € · Pulti + Spomeniki: {vrednostPultiSpomeniki.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-700 pt-3">
                  {(() => {
                    const skupajVse = nalogi.reduce((v, n) => {
                      const c = parseFloat(String(n.cena).replace(",", "."));
                      return v + (isNaN(c) ? 0 : c);
                    }, 0);
                    const skupajPlacano = nalogi.reduce((v, n) => {
                      if ((n.placano || "Ne") !== "Da") return v;
                      const c = parseFloat(String(n.cena).replace(",", "."));
                      return v + (isNaN(c) ? 0 : c);
                    }, 0);
                    const skupajNeplacano = skupajVse - skupajPlacano;
                    const podatkiPlacil = [
                      { naziv: "Skupaj", vsota: skupajVse, barva: "#7f1d1d" },
                      { naziv: "Plačano", vsota: skupajPlacano, barva: "#10b981" },
                      { naziv: "Neplačano", vsota: skupajNeplacano, barva: "#facc15" },
                    ];
                    return (
                      <div style={{ width: "100%", height: 120 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={podatkiPlacil} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#44403c" vertical={false} />
                            <XAxis dataKey="naziv" tick={{ fill: "#a8a29e", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#a8a29e", fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8 }}
                              labelStyle={{ color: "#fff" }}
                              formatter={(value) => [`${value.toFixed(2)} €`, "Vsota"]}
                            />
                            <Bar dataKey="vsota" radius={[4, 4, 0, 0]}>
                              {podatkiPlacil.map((entry) => (
                                <Cell key={entry.naziv} fill={entry.barva} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const neplacana = nalogi.filter((n) => (n.placano || "Ne") !== "Da");
                  const skupajNeplacano = neplacana.reduce((v, n) => {
                    const c = parseFloat(String(n.cena).replace(",", "."));
                    return v + (isNaN(c) ? 0 : c);
                  }, 0);
                  return (
                    <div className="border-t border-stone-700 pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-stone-400 uppercase">Neplačana delovna naročila</p>
                        <span className="text-sm font-semibold text-red-400">{skupajNeplacano.toFixed(2)} €</span>
                      </div>
                      {neplacana.length === 0 ? (
                        <p className="text-xs text-stone-500">Vse je plačano. 🎉</p>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {neplacana.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => odpriPodrobnosti(n.id)}
                              className="w-full flex items-center justify-between text-sm py-1.5 border-b border-stone-800 hover:bg-stone-800 px-1 rounded transition-colors text-left"
                            >
                              <span className="text-stone-300 truncate">{n.stevilka} · {n.stranka}</span>
                              <span className="font-semibold text-red-400 shrink-0 ml-2">{n.cena ? `${n.cena} €` : "brez cene"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(neplacaniPulti.length > 0 || neplacaniSpomeniki.length > 0) && (
                  <div className="border-t border-stone-700 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-stone-400 uppercase">Neplačano — Pulti in Spomeniki</p>
                      <span className="text-sm font-semibold text-red-400">
                        {(
                          neplacaniPulti.reduce((v, p) => v + steviloVarno(p.ponudbenaCena), 0) +
                          neplacaniSpomeniki.reduce((v, s) => v + steviloVarno(s.cena), 0)
                        ).toFixed(2)} €
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {neplacaniPulti.map((p) => (
                        <div key={`pulti-${p.id}`} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-800 px-1">
                          <span className="text-stone-300 truncate">
                            <span className="text-blue-400 text-xs mr-1">[Pulti]</span>
                            {p.stevilka} · {p.stranka?.ime}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-semibold text-red-400">{p.ponudbenaCena ? `${steviloVarno(p.ponudbenaCena).toFixed(2)} €` : "brez cene"}</span>
                            <button
                              onClick={() => preklopiPlacanoPulti(p.id)}
                              className="text-xs px-2 py-1 rounded bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
                            >
                              Označi plačano
                            </button>
                          </div>
                        </div>
                      ))}
                      {neplacaniSpomeniki.map((s) => (
                        <div key={`spomenik-${s.id}`} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-800 px-1">
                          <span className="text-stone-300 truncate">
                            <span className="text-purple-400 text-xs mr-1">[Spomenik]</span>
                            {s.stevilka} · {s.stranka?.ime}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-semibold text-red-400">{s.cena ? `${steviloVarno(s.cena).toFixed(2)} €` : "brez cene"}</span>
                            <button
                              onClick={() => preklopiPlacanoSpomenik(s.id)}
                              className="text-xs px-2 py-1 rounded bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
                            >
                              Označi plačano
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPogled("stranke")}
                  className="mt-3 w-full text-sm text-center px-3 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  Pregled po strankah →
                </button>

                <div className="border-t border-stone-700 pt-3 mt-3">
                  <p className="text-xs font-medium text-stone-400 uppercase mb-2">Varnostna kopija</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => prenesiVarnostnoKopijo(nalogi)}
                      className="text-sm px-3 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                    >
                      <Download size={14} /> Prenesi kopijo zdaj
                    </button>
                    <label className="text-sm px-3 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer">
                      <FileText size={14} /> Obnovi iz datoteke
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => obnoviIzDatoteke(e, shraniNalogi)}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    Samodejna varnostna kopija se shrani vsak dan ob 3h zjutraj. Priporočamo tudi ročni prenos vsake toliko časa.
                  </p>
                </div>

                <div className="border-t border-stone-700 pt-3 mt-3">
                  <p className="text-xs font-medium text-stone-400 uppercase mb-2">Popravilo napake pri shranjevanju</p>
                  <button
                    onClick={pociistiVelikePriloge}
                    className="text-sm px-3 py-2 rounded-lg border border-amber-600 text-amber-400 hover:bg-amber-950 transition-colors w-full"
                  >
                    🧹 Počisti velike/stare priloge (popravi napako 413)
                  </button>
                  <p className="text-xs text-stone-500 mt-2">
                    Uporabi, če shranjevanje javlja napako "413" — poišče stara naročila s slikami/DXF, shranjenimi na starejši način, in jih popravi.
                  </p>
                </div>
              </div>
            )}

            {nalogi.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-medium text-stone-500 uppercase mb-1">Stanje naročil</p>
                <div className="flex items-center">
                  <div style={{ width: "140px", height: "140px" }} className="shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={podatkiGrafa}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={2}
                        >
                          {podatkiGrafa.map((d) => (
                            <Cell key={d.name} fill={STATUS_HEX[d.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-2">
                    {podatkiGrafa.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_HEX[d.name] }} />
                        <span className="text-stone-600">{d.name}</span>
                        <span className="font-semibold text-stone-800">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={iskanje}
                  onChange={(e) => setIskanje(e.target.value)}
                  placeholder="Išči po stranki, opisu, številki…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              <button
                onClick={() => setFilterStatusi([])}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatusi.length === 0
                    ? "bg-stone-700 text-white border-stone-700 font-medium"
                    : "bg-white text-stone-500 border-stone-300 hover:border-stone-500"
                }`}
              >
                Vsi
              </button>
              {STATUSI.map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setFilterStatusi((prej) =>
                      prej.includes(s) ? prej.filter((x) => x !== s) : [...prej, s]
                    )
                  }
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    filterStatusi.includes(s)
                      ? STATUS_BARVE[s] + " font-medium ring-1 ring-inset ring-current"
                      : "bg-white text-stone-500 border-stone-300 hover:border-stone-500"
                  }`}
                >
                  {s}
                </button>
              ))}
              {steviloZaPoslatiRacun > 0 && (
                <button
                  onClick={() => setPokaziSamoRacune((v) => !v)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${
                    pokaziSamoRacune
                      ? "bg-yellow-400 text-yellow-950 border-yellow-500 font-medium ring-1 ring-inset ring-current"
                      : "bg-yellow-50 text-yellow-800 border-yellow-300 hover:border-yellow-500"
                  }`}
                >
                  <Mail size={12} /> Pošlji račun ({steviloZaPoslatiRacun})
                </button>
              )}
            </div>

            {filtrirani.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-stone-300 rounded-xl bg-white/50">
                <Hammer size={28} className="mx-auto text-stone-400 mb-3" />
                <p className="text-stone-500 text-sm">
                  {nalogi.length === 0
                    ? "Ni še nobenega delovnega naloga. Dodaj prvega."
                    : "Ni naročil, ki bi ustrezala iskanju."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtrirani.map((n) => {
                  const steviloPostavk = (n.postavke || []).filter(p => p.naziv || p.material || p.dolzina).length;
                  const zamujen = jeZamujen(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => odpriPodrobnosti(n.id)}
                      className={`w-full text-left rounded-xl px-4 py-3.5 hover:shadow-sm transition-all flex items-center justify-between gap-3 ${
                        n.racun === "poslati"
                          ? "bg-yellow-200 border-2 border-yellow-500 hover:border-yellow-600"
                          : n.racun === "poslan"
                          ? "bg-emerald-200 border-2 border-emerald-500 hover:border-emerald-600"
                          : zamujen
                          ? "bg-red-50 border-2 border-red-400 hover:border-red-500"
                          : KARTICA_BARVE[n.status] || "bg-white border border-stone-200 hover:border-red-400"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-stone-400">{n.stevilka}</span>
                          {n.vrsta === "ponudba" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                              Ponudba
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BARVE[n.status]}`}>
                            {n.status}
                          </span>
                          {steviloPostavk > 0 && (
                            <span className="text-xs text-stone-400">· {steviloPostavk} postavk</span>
                          )}
                          {zamujen && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-medium">
                              Zamujeno
                            </span>
                          )}
                          {n.racun === "poslati" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 font-medium">
                              Račun za poslati
                            </span>
                          )}
                          {n.racun === "poslan" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium">
                              Račun poslan
                            </span>
                          )}
                          {(n.placano || "Ne") === "Da" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Plačano
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                              Ne plačano
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-stone-800 truncate">{n.stranka}</div>
                        <div className="text-sm text-stone-500 truncate">{n.opis}</div>
                      </div>
                      <ChevronRight size={18} className="text-stone-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {pogled === "stranke" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="carved text-lg uppercase text-stone-700">Stranke</h2>
              <button
                onClick={() => setPogled("seznam")}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                ← Nazaj na seznam
              </button>
            </div>
            {edinstveneStranke.length === 0 ? (
              <p className="text-sm text-stone-500">Ni še nobene stranke.</p>
            ) : (
              <div className="space-y-2">
                {edinstveneStranke.map((stranka) => {
                  const naroceilaStranke = nalogi.filter((n) => n.stranka === stranka);
                  const odprta = naroceilaStranke.filter((n) => (n.placano || "Ne") !== "Da");
                  const odprtaVsota = odprta.reduce((v, n) => {
                    const c = parseFloat(String(n.cena).replace(",", "."));
                    return v + (isNaN(c) ? 0 : c);
                  }, 0);
                  return (
                    <button
                      key={stranka}
                      onClick={() => { setIzbranaStranka(stranka); setPogled("strankaDetalji"); }}
                      className="w-full text-left bg-white border border-stone-200 rounded-xl px-4 py-3.5 hover:border-red-400 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-800 truncate">{stranka}</div>
                        <div className="text-sm text-stone-500">
                          {naroceilaStranke.length} naročil
                          {adminOdklenjen && odprta.length > 0 && (
                            <span className="text-red-600 font-medium"> · {odprta.length} odprtih ({odprtaVsota.toFixed(2)} €)</span>
                          )}
                          {adminOdklenjen && odprta.length === 0 && (
                            <span className="text-emerald-600 font-medium"> · vse plačano</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-stone-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {pogled === "strankaDetalji" && izbranaStranka && (() => {
          const naroceilaStranke = nalogi.filter((n) => n.stranka === izbranaStranka);
          const neplacana = naroceilaStranke.filter((n) => (n.placano || "Ne") !== "Da");
          const skupajNeplacano = neplacana.reduce((v, n) => {
            const c = parseFloat(String(n.cena).replace(",", "."));
            return v + (isNaN(c) ? 0 : c);
          }, 0);
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="carved text-lg uppercase text-stone-700">{izbranaStranka}</h2>
                <button
                  onClick={() => setPogled("stranke")}
                  className="text-sm text-stone-500 hover:text-stone-700"
                >
                  ← Nazaj na stranke
                </button>
              </div>

              {adminOdklenjen && (
                <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <span className="text-sm text-stone-300">Skupaj neplačano ({neplacana.length} naročil)</span>
                  <span className="text-xl font-bold text-red-400">{skupajNeplacano.toFixed(2)} €</span>
                </div>
              )}

              {neplacana.length === 0 ? (
                <p className="text-sm text-emerald-600">Vse je plačano. 🎉</p>
              ) : (
                <div className="space-y-2">
                  {neplacana.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => odpriPodrobnosti(n.id)}
                      className="w-full text-left bg-white border border-stone-200 rounded-xl px-4 py-3.5 hover:border-red-400 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-stone-400">{n.stevilka}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BARVE[n.status]}`}>
                            {n.status}
                          </span>
                        </div>
                        <div className="text-sm text-stone-600 truncate">{n.opis}</div>
                      </div>
                      {adminOdklenjen && (
                        <span className="font-semibold text-red-600 shrink-0">{n.cena ? `${n.cena} €` : "brez cene"}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {pogled === "nov" && (
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h2 className="carved text-lg uppercase text-stone-700 mb-4">
              {aktivniId
                ? (obrazec.vrsta === "ponudba" ? "Uredi ponudbo" : "Uredi nalog")
                : (obrazec.vrsta === "ponudba" ? "Nova ponudba" : "Nov delovni nalog")}
            </h2>

            <div className="bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 mb-5">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Kdo je oddal naročilo</label>
              <div className="flex flex-wrap gap-2">
                {ODDAL_NAROCILO.map((ime) => (
                  <button
                    key={ime}
                    type="button"
                    onClick={() => setObrazec({ ...obrazec, oddal: ime })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      obrazec.oddal === ime
                        ? "bg-stone-700 text-white border-stone-700 font-medium"
                        : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
                    }`}
                  >
                    {ime}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 mb-5">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Police</label>
              <div className="flex flex-wrap items-center gap-2">
                {["Zunanje", "Notranje"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setObrazec({ ...obrazec, tip: obrazec.tip === t ? "" : t })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      obrazec.tip === t
                        ? "bg-stone-700 text-white border-stone-700 font-medium"
                        : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <Ruler size={14} className="text-stone-400 shrink-0" />
                  <input
                    value={obrazec.utori}
                    onChange={(e) => setObrazec({ ...obrazec, utori: e.target.value })}
                    placeholder="Utori: cm od roba"
                    inputMode="decimal"
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-1">Stranka *</label>
                <input
                  value={obrazec.stranka}
                  onChange={(e) => {
                    const ime = e.target.value;
                    const podatki = najdiPodatkeStranke(ime);
                    setObrazec({
                      ...obrazec,
                      stranka: ime,
                      telefon: podatki && !obrazec.telefon ? podatki.telefon : obrazec.telefon,
                      email: podatki && !obrazec.email ? podatki.email : obrazec.email,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="Ime in priimek / podjetje"
                  list="seznam-strank"
                  autoComplete="off"
                />
                <datalist id="seznam-strank">
                  {edinstveneStranke.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Telefon</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={obrazec.telefon}
                  onChange={(e) => setObrazec({ ...obrazec, telefon: e.target.value.replace(/[^0-9 ]/g, "") })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="041 123 456"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">E-mail</label>
                <input
                  type="email"
                  value={obrazec.email}
                  onChange={(e) => setObrazec({ ...obrazec, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="stranka@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Rok izvedbe</label>
                <input
                  type="date"
                  value={obrazec.rok}
                  onChange={(e) => setObrazec({ ...obrazec, rok: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Ura prevzema</label>
                <input
                  type="time"
                  value={obrazec.rokUra}
                  onChange={(e) => setObrazec({ ...obrazec, rokUra: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              {obrazec.vrsta === "ponudba" && (
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Ponudba velja do</label>
                  <input
                    type="date"
                    value={obrazec.veljavnostPonudbe}
                    onChange={(e) => setObrazec({ ...obrazec, veljavnostPonudbe: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-1">Opis dela *</label>
                <textarea
                  value={obrazec.opis}
                  onChange={(e) => setObrazec({ ...obrazec, opis: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="npr. izdelava in montaža polic, kuhinjski pult…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Skupna cena – neto (€, samodejno iz postavk)</label>
                <input
                  inputMode="decimal"
                  value={obrazec.cena}
                  onChange={(e) => setObrazec({ ...obrazec, cena: e.target.value.replace(/[^0-9.,]/g, "") })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="npr. 1250"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Popust na skupno ceno (%)</label>
                <input
                  inputMode="decimal"
                  value={obrazec.popustSkupaj}
                  onChange={(e) => setObrazec({ ...obrazec, popustSkupaj: e.target.value.replace(/[^0-9.,]/g, "") })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  placeholder="npr. 10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Neto po popustu (€)</label>
                <div className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700">
                  {(() => {
                    const neto = parseFloat(String(obrazec.cena).replace(",", "."));
                    if (!neto || isNaN(neto)) return "—";
                    const popust = parseFloat(String(obrazec.popustSkupaj).replace(",", ".")) || 0;
                    const netoPoPopustu = neto * (1 - popust / 100);
                    return `${netoPoPopustu.toFixed(2)} €`;
                  })()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Skupna cena – bruto (z 22% DDV)</label>
                <div className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700">
                  {(() => {
                    const neto = parseFloat(String(obrazec.cena).replace(",", "."));
                    if (!neto || isNaN(neto)) return "—";
                    const popust = parseFloat(String(obrazec.popustSkupaj).replace(",", ".")) || 0;
                    const netoPoPopustu = neto * (1 - popust / 100);
                    return `${(netoPoPopustu * 1.22).toFixed(2)} €`;
                  })()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
                <select
                  value={obrazec.status}
                  onChange={(e) => setObrazec({ ...obrazec, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  {STATUSI.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="carved text-sm uppercase text-stone-600">Postavke (mere kosov)</h3>
                <span className="text-xs text-stone-400">
                  {obrazec.postavke.length} kosov{skupajM2Obrazec > 0 ? ` · ${skupajM2Obrazec.toFixed(2)} m²` : ""}
                </span>
              </div>

              <div
                className="hidden sm:grid gap-2 px-1 mb-1.5 text-xs font-medium text-stone-400 uppercase tracking-wide"
                style={{ gridTemplateColumns: "2fr 1.6fr 1fr 1fr 1fr 0.8fr auto" }}
              >
                <span>Naziv / pozicija</span>
                <span>Material</span>
                <span>Dolžina (cm)</span>
                <span>Širina (cm)</span>
                <span>Debelina (cm)</span>
                <span>Kos.</span>
                <span></span>
              </div>

              <div className="space-y-2">
                {obrazec.postavke.map((p, idx) => (
                  <div key={p.id} className="bg-stone-50 sm:bg-transparent rounded-lg p-2 sm:p-0">
                  <div
                    className="postavka-row grid grid-cols-2 gap-2 items-center"
                  >
                    <input
                      className="postavka-input col-span-2 sm:col-span-1"
                      value={p.naziv}
                      onChange={(e) => posodobiPostavko(p.id, "naziv", e.target.value)}
                      placeholder={`Polica ${idx + 1}`}
                    />
                    {rocniMaterial[p.id] || (p.material && !MATERIALI_SEZNAM.includes(p.material)) ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          className="postavka-input"
                          value={p.material}
                          onChange={(e) => posodobiPostavko(p.id, "material", e.target.value)}
                          placeholder="Material (ročni vnos)"
                        />
                        <button
                          type="button"
                          onClick={() => { setRocniMaterial({ ...rocniMaterial, [p.id]: false }); posodobiPostavko(p.id, "material", ""); }}
                          className="text-[11px] text-stone-400 underline text-left"
                        >
                          ← Izberi iz cenika
                        </button>
                      </div>
                    ) : (
                      <select
                        className="postavka-input"
                        value={p.material}
                        onChange={(e) => {
                          if (e.target.value === "__rocno__") {
                            setRocniMaterial({ ...rocniMaterial, [p.id]: true });
                            posodobiPostavko(p.id, "material", "");
                          } else {
                            posodobiPostavko(p.id, "material", e.target.value);
                          }
                        }}
                      >
                        <option value="">Izberi material…</option>
                        {Object.entries(CENIK).map(([skupina, podatki]) => (
                          <optgroup key={skupina} label={skupina}>
                            {podatki.materiali.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__rocno__">Drugo (ročni vnos)…</option>
                      </select>
                    )}
                    <input
                      className="postavka-input"
                      value={p.dolzina}
                      onChange={(e) => posodobiPostavko(p.id, "dolzina", e.target.value)}
                      placeholder="dolžina"
                      inputMode="decimal"
                    />
                    <input
                      className="postavka-input"
                      value={p.sirina}
                      onChange={(e) => posodobiPostavko(p.id, "sirina", e.target.value)}
                      placeholder="širina"
                      inputMode="decimal"
                    />
                    <input
                      className="postavka-input"
                      value={p.debelina}
                      onChange={(e) => posodobiPostavko(p.id, "debelina", e.target.value)}
                      placeholder="debelina"
                      inputMode="decimal"
                    />
                    <input
                      className="postavka-input"
                      value={p.kolicina}
                      onChange={(e) => posodobiPostavko(p.id, "kolicina", e.target.value)}
                      placeholder="1"
                      inputMode="decimal"
                    />
                    <button
                      onClick={() => izbrisiPostavko(p.id)}
                      className="text-stone-400 hover:text-red-600 transition-colors justify-self-end sm:justify-self-center"
                      aria-label="Izbriši postavko"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pl-0.5">
                    <span className="text-xs text-stone-400">Cena postavke (€, samodejno):</span>
                    <input
                      className="postavka-input"
                      style={{ width: "110px" }}
                      value={p.cena}
                      onChange={(e) => posodobiPostavko(p.id, "cena", e.target.value.replace(/[^0-9.,]/g, ""))}
                      placeholder="0"
                      inputMode="decimal"
                    />
                    <span className="text-xs text-stone-400 ml-2">Popust (%):</span>
                    <input
                      className="postavka-input"
                      style={{ width: "70px" }}
                      value={p.popust || ""}
                      onChange={(e) => posodobiPostavko(p.id, "popust", e.target.value.replace(/[^0-9.,]/g, ""))}
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </div>
                  </div>
                ))}
              </div>


              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={dodajPostavko}
                  className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Dodaj postavko
                </button>
                <button
                  onClick={() => dodajVecPostavk(5)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <ListPlus size={14} /> Dodaj 5 vrstic
                </button>
                <button
                  onClick={() => dodajVecPostavk(20)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <ListPlus size={14} /> Dodaj 20 vrstic
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 mt-4">
              <label className="block text-xs font-medium text-stone-500 mb-1">Opombe</label>
              <textarea
                value={obrazec.opombe}
                onChange={(e) => setObrazec({ ...obrazec, opombe: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                placeholder="dodatne informacije…"
              />
            </div>

            <div className="border-t border-stone-200 pt-4 mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Slika naročila (npr. iz e-pošte stranke)</label>
                {obrazec.slikaNarocila ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-2">
                    <PrilogaPregled referenca={obrazec.slikaNarocila} slikaRazred="max-h-40 rounded-lg mx-auto" />
                    <button
                      type="button"
                      onClick={() => setObrazec({ ...obrazec, slikaNarocila: null })}
                      className="text-red-600 text-xs mt-2 block mx-auto"
                    >
                      Odstrani sliko
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => obravnavajNalozenoDatoteko(e, (rez) => setObrazec({ ...obrazec, slikaNarocila: rez }), `nalog-${aktivniId || "nov"}-slika`)}
                    className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-700 file:text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">DXF datoteka (za prenos na mašine)</label>
                {obrazec.dxfDatoteka ? (
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm">
                    <span className="truncate text-stone-700">📎 {obrazec.dxfDatoteka.ime}</span>
                    <button
                      type="button"
                      onClick={() => setObrazec({ ...obrazec, dxfDatoteka: null })}
                      className="text-red-600 text-xs ml-2 shrink-0"
                    >
                      Odstrani
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept=".dxf,.dwg"
                    onChange={(e) => obravnavajNalozenoDatoteko(e, (rez) => setObrazec({ ...obrazec, dxfDatoteka: rez }), `nalog-${aktivniId || "nov"}-dxf`)}
                    className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-stone-200 file:text-stone-700 file:text-sm"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={shraniObrazec}
                disabled={shranjujem}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={16} /> {shranjujem ? "Shranjujem na strežnik…" : "Shrani nalog"}
              </button>
              <button
                onClick={() => setPogled(aktivniId ? "podrobnosti" : "seznam")}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Prekliči
              </button>
            </div>
          </div>
        )}

        {pogled === "podrobnosti" && aktivniNalog && (
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            {potrditevShranjeno && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
                <Check size={16} /> Shranjeno na strežnik — nalog je varno na spletu.
              </div>
            )}
            <div className="bg-stone-100 border border-stone-300 rounded-lg px-4 py-3 mb-4">
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Kdo je oddal naročilo</label>
              <div className="flex flex-wrap gap-2">
                {ODDAL_NAROCILO.map((ime) => (
                  <button
                    key={ime}
                    onClick={() => shraniOddal(aktivniNalog.id, ime)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      aktivniNalog.oddal === ime
                        ? "bg-stone-700 text-white border-stone-700 font-medium"
                        : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
                    }`}
                  >
                    {ime}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-stone-400">{aktivniNalog.stevilka}</span>
                <h2 className="carved text-xl uppercase text-stone-800">{aktivniNalog.stranka}</h2>
              </div>
              <div className="flex items-center gap-2">
                {aktivniNalog.vrsta === "ponudba" && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                    Ponudba
                  </span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_BARVE[aktivniNalog.status]}`}>
                  {aktivniNalog.status}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <Vrstica label="Opis dela" vrednost={aktivniNalog.opis} />
              <Vrstica
                label="Cena"
                vrednost={
                  aktivniNalog.cena
                    ? (() => {
                        const neto = parseFloat(String(aktivniNalog.cena).replace(",", "."));
                        const popust = parseFloat(String(aktivniNalog.popustSkupaj).replace(",", ".")) || 0;
                        const netoPoPopustu = neto * (1 - popust / 100);
                        const bruto = netoPoPopustu * 1.22;
                        return popust > 0
                          ? `${neto.toFixed(2)} € neto · popust ${popust}% · ${netoPoPopustu.toFixed(2)} € po popustu · ${bruto.toFixed(2)} € bruto (22% DDV)`
                          : `${neto.toFixed(2)} € neto · ${bruto.toFixed(2)} € bruto (22% DDV)`;
                      })()
                    : ""
                }
              />
              {aktivniNalog.rok && (
                <Vrstica
                  label="Rok izvedbe"
                  vrednost={
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-stone-400" />
                      <span className={jeZamujen(aktivniNalog) ? "text-red-600 font-semibold" : ""}>
                        {new Date(aktivniNalog.rok).toLocaleDateString("sl-SI")}
                        {aktivniNalog.rokUra ? ` ob ${aktivniNalog.rokUra}` : ""}
                      </span>
                      {jeZamujen(aktivniNalog) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-medium">
                          Zamujeno
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {aktivniNalog.telefon && (
                <Vrstica
                  label="Telefon"
                  vrednost={
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="text-stone-400" />
                      {aktivniNalog.telefon}
                    </span>
                  }
                />
              )}
              {aktivniNalog.email && (
                <Vrstica
                  label="E-mail"
                  vrednost={
                    <a
                      href={`mailto:${aktivniNalog.email}`}
                      className="flex items-center gap-1.5 text-red-700 hover:underline"
                    >
                      <Mail size={14} className="text-stone-400" />
                      {aktivniNalog.email}
                    </a>
                  }
                />
              )}
              <Vrstica label="Opombe" vrednost={aktivniNalog.opombe} />
              <Vrstica label="Police" vrednost={aktivniNalog.tip} />
              <Vrstica label="Utori od roba" vrednost={aktivniNalog.utori ? `${aktivniNalog.utori} cm` : ""} />
              <Vrstica label="Izvaja" vrednost={aktivniNalog.izvajalec} />
              <Vrstica label="Prevzel" vrednost={aktivniNalog.prevzel} />
            </div>

            {(aktivniNalog.slikaNarocila || aktivniNalog.dxfDatoteka) && (
              <div className="mt-5 pt-4 border-t border-stone-100 grid sm:grid-cols-2 gap-4">
                {aktivniNalog.slikaNarocila && (
                  <div>
                    <h3 className="carved text-sm uppercase text-stone-600 mb-2">Slika naročila</h3>
                    <PrilogaPregled referenca={aktivniNalog.slikaNarocila} slikaRazred="max-h-64 rounded-lg border border-stone-200 mx-auto" />
                  </div>
                )}
                {aktivniNalog.dxfDatoteka && (
                  <div>
                    <h3 className="carved text-sm uppercase text-stone-600 mb-2">DXF datoteka</h3>
                    <PrilogaPregled referenca={aktivniNalog.dxfDatoteka} />
                  </div>
                )}
              </div>
            )}

            {aktivniNalog.postavke && aktivniNalog.postavke.some(p => p.naziv || p.material || p.dolzina) && (
              <div className="mt-5 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="carved text-sm uppercase text-stone-600">Postavke</h3>
                  <span className="text-xs text-stone-400">
                    {(() => {
                      const skupaj = aktivniNalog.postavke.reduce((v, p) => v + m2Postavke(p), 0);
                      return skupaj > 0 ? `Skupaj ${skupaj.toFixed(2)} m²` : "";
                    })()}
                  </span>
                </div>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm" style={{ minWidth: "480px" }}>
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b border-stone-200">
                        <th className="font-medium py-1.5 px-2">#</th>
                        <th className="font-medium py-1.5 px-2">Naziv</th>
                        <th className="font-medium py-1.5 px-2">Material</th>
                        <th className="font-medium py-1.5 px-2">D × Š × Deb. (cm)</th>
                        <th className="font-medium py-1.5 px-2">Kos.</th>
                        <th className="font-medium py-1.5 px-2">Cena (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aktivniNalog.postavke
                        .filter(p => p.naziv || p.material || p.dolzina)
                        .map((p, idx) => (
                          <tr key={p.id} className="border-b border-stone-50">
                            <td className="py-1.5 px-2 text-stone-400">{idx + 1}</td>
                            <td className="py-1.5 px-2 text-stone-700">{p.naziv || "—"}</td>
                            <td className="py-1.5 px-2 text-stone-600">{p.material || "—"}</td>
                            <td className="py-1.5 px-2 text-stone-600">
                              {p.dolzina || "–"} × {p.sirina || "–"} × {p.debelina || "–"}
                            </td>
                            <td className="py-1.5 px-2 text-stone-600">{p.kolicina || "1"}</td>
                            <td className="py-1.5 px-2 text-stone-600">{p.cena ? `${p.cena} €` : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {aktivniNalog.status === "Pripravljeno" && (aktivniNalog.email || aktivniNalog.telefon) && (
              <div className="mt-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <Mail size={16} />
                  <span>Naročilo je pripravljeno — obvesti stranko.</span>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {aktivniNalog.email && (
                    <a
                      href={obvestiloMailto(aktivniNalog)}
                      className="bg-red-500 hover:bg-red-400 text-stone-900 text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      Pošlji e-mail
                    </a>
                  )}
                  {aktivniNalog.telefon && (
                    <a
                      href={obvestiloSMS(aktivniNalog)}
                      className="bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      Pošlji SMS
                    </a>
                  )}
                </div>
              </div>
            )}
            {aktivniNalog.status === "Pripravljeno" && !aktivniNalog.email && !aktivniNalog.telefon && (
              <div className="mt-5 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-500">
                Naročilo je pripravljeno. Za pošiljanje obvestila dodaj e-mail ali telefon stranke (uredi nalog).
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-stone-100">
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Spremeni status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSI.map((s) => (
                  <button
                    key={s}
                    onClick={() => spremeniStatus(aktivniNalog.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      aktivniNalog.status === s
                        ? STATUS_BARVE[s]
                        : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100">
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Plačilo</label>
              <div className="flex flex-wrap gap-2">
                {["Da", "Ne"].map((p) => (
                  <button
                    key={p}
                    onClick={() => spremeniPlacano(aktivniNalog.id, p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      (aktivniNalog.placano || "Ne") === p
                        ? p === "Da"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-red-100 text-red-800 border-red-300"
                        : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {p === "Da" ? "Plačano" : "Ne plačano"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100">
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Račun</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => spremeniRacun(aktivniNalog.id, "poslati")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    aktivniNalog.racun === "poslati"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-400 font-medium"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  Pošlji račun
                </button>
                <button
                  onClick={() => spremeniRacun(aktivniNalog.id, "poslan")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    aktivniNalog.racun === "poslan"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  Račun poslan
                </button>
              </div>
            </div>

            {aktivniNalog.status === "V izdelavi" && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <label className="block text-xs font-medium text-red-800 mb-1.5">Kdo je prevzel naročilo</label>
                <div className="flex flex-wrap gap-2">
                  {DELAVCI.map((ime) => (
                    <button
                      key={ime}
                      onClick={() => shraniIzvajalca(aktivniNalog.id, ime)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        aktivniNalog.izvajalec === ime
                          ? "bg-red-500 text-stone-900 border-red-500 font-medium"
                          : "bg-white text-stone-600 border-stone-300 hover:border-red-400"
                      }`}
                    >
                      {ime}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aktivniNalog.status === "Prevzeto" && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <label className="block text-xs font-medium text-emerald-800 mb-1.5">Kdo je prevzel</label>
                <input
                  defaultValue={aktivniNalog.prevzel || ""}
                  onBlur={(e) => shraniPrevzel(aktivniNalog.id, e.target.value)}
                  placeholder="Ime in priimek prevzemnika"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            )}

            {aktivniNalog.vrsta === "ponudba" && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm text-blue-800">To je ponudba — še ni pravi delovni nalog.</span>
                <button
                  onClick={() => pretvoriVDelovniNalog(aktivniNalog.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
                >
                  Pretvori v delovni nalog
                </button>
              </div>
            )}

            {aktivniNalog.vrsta === "ponudba" && (aktivniNalog.email || aktivniNalog.telefon) && (
              <div className="mt-4 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm text-stone-600">Pošlji ponudbo stranki v predogled:</span>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {aktivniNalog.email && (
                    <a
                      href={ponudbaMailto(aktivniNalog)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      Pošlji e-mail
                    </a>
                  )}
                  {aktivniNalog.telefon && (
                    <a
                      href={ponudbaSMS(aktivniNalog)}
                      className="bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      Pošlji SMS
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-5">
              {aktivniNalog.vrsta === "ponudba" ? (
                <button
                  onClick={() => setPogled("tiskPonudbe")}
                  className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
                >
                  <Printer size={15} /> Natisni ponudbo
                </button>
              ) : (
                <>
                  <button
                    onClick={() => izvoziDonatoniCSV(aktivniNalog)}
                    className="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors flex items-center gap-2"
                  >
                    <Download size={15} /> CSV Donatoni
                  </button>
                  <button
                    onClick={() => setPogled("izracunPolic")}
                    className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
                  >
                    <Ruler size={15} /> Izračun polic
                  </button>
                  <button
                    onClick={() => setPogled("tisk")}
                    className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
                  >
                    <Printer size={15} /> Natisni delovni nalog
                  </button>
                  <button
                    onClick={() => setPogled("dobavnica")}
                    className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    <FileText size={15} /> Izdaj dobavnico
                  </button>
                </>
              )}
              <button
                onClick={() => odpriUredi(aktivniNalog)}
                className="bg-stone-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors flex items-center gap-2"
              >
                <Pencil size={15} /> Uredi
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Ali res želiš izbrisati ${aktivniNalog.vrsta === "ponudba" ? "ponudbo" : "delovni nalog"} ${aktivniNalog.stevilka || ""} (${aktivniNalog.stranka})? Tega dejanja ni mogoče razveljaviti.`)) {
                    izbrisiNalog(aktivniNalog.id);
                  }
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 size={15} /> Izbriši
              </button>
            </div>
          </div>
        )}

        {pogled === "dobavnica" && aktivniNalog && (
          <Dobavnica
            nalog={aktivniNalog}
            onZapri={() => setPogled("podrobnosti")}
            shraniPodpis={(podpisDataURL, imePodpisnika) =>
              posodobiNaloge((os) =>
                os.map((n) =>
                  n.id === aktivniNalog.id
                    ? { ...n, podpisPrevzemnika: podpisDataURL, podpisIme: imePodpisnika, podpisDatum: new Date().toISOString() }
                    : n
                )
              )
            }
          />
        )}

        {pogled === "tisk" && aktivniNalog && (
          <TiskNaloga nalog={aktivniNalog} onZapri={() => setPogled("podrobnosti")} />
        )}

        {pogled === "tiskPonudbe" && aktivniNalog && (
          <TiskPonudbe nalog={aktivniNalog} onZapri={() => setPogled("podrobnosti")} />
        )}

        {pogled === "izracunPolic" && aktivniNalog && (
          <IzracunPolic nalog={aktivniNalog} onZapri={() => setPogled("podrobnosti")} />
        )}
      </main>

      {pogled === "seznam" && !naloziLoading && (
        <>
          <button
            onClick={odpriNovoPonudbo}
            className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full pl-4 pr-5 h-14 shadow-lg flex items-center gap-2 transition-colors"
            aria-label="Izdelaj ponudbo"
          >
            <Plus size={22} />
            <span className="text-sm font-medium whitespace-nowrap">Izdelaj ponudbo</span>
          </button>
          <button
            onClick={odpriNov}
            className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-400 text-stone-900 rounded-full pl-4 pr-5 h-14 shadow-lg flex items-center gap-2 transition-colors"
            aria-label="Izdelaj delovni list"
          >
            <Plus size={22} />
            <span className="text-sm font-medium whitespace-nowrap">Izdelaj delovni list</span>
          </button>
        </>
      )}
    </div>
  );
}

function TiskNaloga({ nalog, onZapri }) {
  const postavkeZaPrikaz = (nalog.postavke || []).filter(
    (p) => p.naziv || p.material || p.dolzina
  );
  const skupajM2 = postavkeZaPrikaz.reduce((v, p) => v + m2Postavke(p), 0);
  const danes = new Date().toLocaleDateString("sl-SI");

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .tisk-list, .tisk-list * { visibility: visible; }
          .tisk-list { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .tisk-brez { display: none !important; }
        }
      `}</style>

      <div className="tisk-brez flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => prenesiHTMLDokument(".tisk-list", `Delovni nalog ${nalog.stevilka || ""}`, `delovni-nalog-${nalog.stevilka || "nalog"}${strankaZaIme(nalog) ? " " + strankaZaIme(nalog) : ""}.html`)}
          className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <FileText size={15} /> Prenesi datoteko
        </button>
        <button
          onClick={onZapri}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Nazaj
        </button>
      </div>

      <div className="tisk-list bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b-2 border-stone-800 pb-2 mb-3">
          <img
            src={CAKS_LOGO}
            alt="Čakš logo"
            className="h-8 w-auto object-contain shrink-0"
          />
          <p className="carved text-sm uppercase text-stone-700 shrink-0">Delovni nalog</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-2 text-sm border-b border-stone-200 pb-2">
          <span><span className="text-xs text-stone-400 uppercase mr-1">Št.</span><span className="font-semibold text-stone-800">{nalog.stevilka}</span></span>
          <span><span className="text-xs text-stone-400 uppercase mr-1">Naročnik</span><span className="font-semibold text-stone-800">{nalog.stranka}</span></span>
          {nalog.oddal && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Oddal</span><span className="text-stone-700">{nalog.oddal}</span></span>
          )}
          {nalog.rok && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Do kdaj pripravljeno</span><span className="font-semibold text-red-700">{new Date(nalog.rok).toLocaleDateString("sl-SI")}{nalog.rokUra ? ` ob ${nalog.rokUra}` : ""}</span></span>
          )}
          {nalog.tip && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Police</span><span className="font-semibold text-stone-800">{nalog.tip}</span></span>
          )}
          {nalog.utori && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Utori od roba</span><span className="font-semibold text-stone-800">{nalog.utori} cm</span></span>
          )}
        </div>

        {nalog.opis && (
          <div className="mb-3 pb-2 border-b border-stone-200">
            <span className="text-xs text-stone-400 uppercase mr-1">Opis dela</span>
            <span className="text-sm text-stone-700">{nalog.opis}</span>
          </div>
        )}

        {postavkeZaPrikaz.length > 0 && (
          <div className="mb-3">
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "36%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-stone-300 text-left text-xs uppercase text-stone-500">
                  <th className="py-2 pr-1 overflow-hidden">#</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Naziv</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Material</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200 normal-case overflow-hidden truncate">Mere (cm)</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200 whitespace-nowrap">Kos.</th>
                </tr>
              </thead>
              <tbody>
                {postavkeZaPrikaz.map((p, idx) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="py-2 pr-1 text-xs text-stone-400 align-top overflow-hidden">{idx + 1}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-700 align-top">{p.naziv || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top">{p.material || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-800 align-top overflow-hidden">
                      {p.dolzina || "–"} × {p.sirina || "–"} × {p.debelina || "–"}
                    </td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top whitespace-nowrap">{p.kolicina || "1"}</td>
                  </tr>
                ))}
              </tbody>
              {skupajM2 > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3" className="pt-2 text-right text-xs font-medium text-stone-500">
                      Skupaj
                    </td>
                    <td className="pt-2 text-sm font-semibold text-stone-800" colSpan="2">{skupajM2.toFixed(2)} m²</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {nalog.opombe && (
          <p className="text-sm text-stone-700">
            <span className="text-xs font-medium text-stone-400 uppercase mr-1">Opombe:</span>
            {nalog.opombe}
          </p>
        )}
      </div>
    </div>
  );
}

function TiskPonudbe({ nalog, onZapri }) {
  const postavkeZaPrikaz = (nalog.postavke || []).filter(
    (p) => p.naziv || p.material || p.dolzina
  );
  const skupajM2 = postavkeZaPrikaz.reduce((v, p) => v + m2Postavke(p), 0);
  const danes = new Date().toLocaleDateString("sl-SI");
  const neto = parseFloat(String(nalog.cena).replace(",", ".")) || 0;
  const popust = parseFloat(String(nalog.popustSkupaj).replace(",", ".")) || 0;
  const netoPoPopustu = neto * (1 - popust / 100);
  const bruto = netoPoPopustu * 1.22;

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ponudba-list, .ponudba-list * { visibility: visible; }
          .ponudba-list { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .ponudba-brez { display: none !important; }
        }
      `}</style>

      <div className="ponudba-brez flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => prenesiHTMLDokument(".ponudba-list", `Ponudba ${nalog.stevilka || ""}`, `ponudba-${nalog.stevilka || "nalog"}${strankaZaIme(nalog) ? " " + strankaZaIme(nalog) : ""}.html`)}
          className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <FileText size={15} /> Prenesi datoteko
        </button>
        <button
          onClick={onZapri}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Nazaj
        </button>
      </div>

      <div className="ponudba-list bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b-2 border-stone-800 pb-2 mb-3">
          <img src={CAKS_LOGO} alt="Čakš logo" className="h-8 w-auto object-contain shrink-0" />
          <p className="carved text-sm uppercase text-stone-700 shrink-0">Ponudba</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-3 text-sm border-b border-stone-200 pb-2">
          <span><span className="text-xs text-stone-400 uppercase mr-1">Št.</span><span className="font-semibold text-stone-800">{nalog.stevilka}</span></span>
          <span><span className="text-xs text-stone-400 uppercase mr-1">Stranka</span><span className="font-semibold text-stone-800">{nalog.stranka}</span></span>
          {nalog.telefon && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Tel</span><span className="text-stone-700">{nalog.telefon}</span></span>
          )}
          {nalog.email && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">E-mail</span><span className="text-stone-700">{nalog.email}</span></span>
          )}
          <span><span className="text-xs text-stone-400 uppercase mr-1">Datum</span><span className="text-stone-700">{danes}</span></span>
          {nalog.veljavnostPonudbe && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Velja do</span><span className="font-semibold text-blue-700">{new Date(nalog.veljavnostPonudbe).toLocaleDateString("sl-SI")}</span></span>
          )}
        </div>

        {nalog.opis && (
          <div className="mb-3 pb-2 border-b border-stone-200">
            <span className="text-xs text-stone-400 uppercase mr-1">Opis dela</span>
            <span className="text-sm text-stone-700">{nalog.opis}</span>
          </div>
        )}

        {postavkeZaPrikaz.length > 0 && (
          <div className="overflow-x-auto mb-3">
            <table className="w-full border-collapse table-fixed" style={{ minWidth: "560px" }}>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-stone-300 text-left text-xs uppercase text-stone-500">
                  <th className="py-2 pr-1">#</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Naziv</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Material</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200 normal-case">Mere (cm)</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Kos.</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Popust</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Cena (€)</th>
                </tr>
              </thead>
              <tbody>
                {postavkeZaPrikaz.map((p, idx) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="py-2 pr-1 text-xs text-stone-400 align-top">{idx + 1}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-700 align-top">{p.naziv || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top">{p.material || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-800 align-top whitespace-nowrap">
                      {p.dolzina || "–"} × {p.sirina || "–"} × {p.debelina || "–"}
                    </td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top">{p.kolicina || "1"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top">{p.popust ? `${p.popust}%` : "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs font-semibold text-stone-800 align-top">{p.cena ? `${p.cena} €` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              {skupajM2 > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5" className="pt-2 text-right text-xs font-medium text-stone-500">
                      Skupaj m²
                    </td>
                    <td colSpan="2" className="pt-2 text-sm font-semibold text-stone-800">{skupajM2.toFixed(2)} m²</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {nalog.cena && (
          <div className="mb-3 pt-2 border-t-2 border-stone-200 flex flex-col items-end gap-0.5 text-sm">
            <span className="text-stone-600">Skupna cena neto: <span className="font-semibold text-stone-800">{neto.toFixed(2)} €</span></span>
            {popust > 0 && (
              <span className="text-stone-600">Popust: <span className="font-semibold text-stone-800">{popust}%</span> → <span className="font-semibold text-stone-800">{netoPoPopustu.toFixed(2)} €</span></span>
            )}
            <span className="text-stone-800 font-bold text-base">Skupna cena z DDV (22%): {bruto.toFixed(2)} €</span>
          </div>
        )}

        {nalog.opombe && (
          <p className="text-sm text-stone-700 mb-2">
            <span className="text-xs font-medium text-stone-400 uppercase mr-1">Opombe:</span>
            {nalog.opombe}
          </p>
        )}

        {nalog.veljavnostPonudbe && (
          <p className="text-xs text-stone-500 mt-3 pt-2 border-t border-stone-200">
            Ta ponudba velja do {new Date(nalog.veljavnostPonudbe).toLocaleDateString("sl-SI")}. Cene so informativne narave in se lahko spremenijo po tem datumu.
          </p>
        )}
      </div>
    </div>
  );
}

function IzracunPolic({ nalog, onZapri }) {
  const razredi = izracunajRazredePolic(nalog);
  const skupajTM = razredi.reduce((v, r) => v + r.tekociMetri, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => prenesiHTMLDokument(".izracun-polic-list", `Izračun polic ${nalog.stevilka || ""}`, `izracun-polic-${nalog.stevilka || "nalog"}${strankaZaIme(nalog) ? " " + strankaZaIme(nalog) : ""}.html`)}
          className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <FileText size={15} /> Prenesi datoteko
        </button>
        <button
          onClick={onZapri}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Nazaj
        </button>
      </div>

      <div className="izracun-polic-list bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 border-b-2 border-stone-800 pb-2 mb-4">
          <img src={CAKS_LOGO} alt="Čakš logo" className="h-8 w-auto object-contain shrink-0" />
          <div className="text-right">
            <p className="carved text-sm uppercase text-stone-700">Izračun polic — tekoči metri</p>
            <p className="text-xs text-stone-500">Št. {nalog.stevilka} · {nalog.stranka}</p>
          </div>
        </div>

      {razredi.length === 0 ? (
        <p className="text-sm text-stone-500">Ni postavk za izračun.</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm" style={{ minWidth: "480px" }}>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-400 border-b-2 border-stone-200">
                  <th className="font-medium py-2 px-2">Material</th>
                  <th className="font-medium py-2 px-2">Širinski razred</th>
                  <th className="font-medium py-2 px-2">Debelina</th>
                  <th className="font-medium py-2 px-2">Kos.</th>
                  <th className="font-medium py-2 px-2">Skupaj tekočih metrov</th>
                </tr>
              </thead>
              <tbody>
                {razredi.map((r, idx) => (
                  <tr key={idx} className="border-b border-stone-100">
                    <td className="py-2 px-2 text-stone-700">{r.material}</td>
                    <td className="py-2 px-2 text-stone-600">{r.razred}</td>
                    <td className="py-2 px-2 text-stone-600">{r.debelina}</td>
                    <td className="py-2 px-2 text-stone-600">{r.stevilo}</td>
                    <td className="py-2 px-2 font-semibold text-stone-800">{r.tekociMetri.toFixed(2)} tm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-stone-200">
            <span className="text-sm text-stone-500">Skupaj vseh tekočih metrov</span>
            <span className="text-lg font-bold text-red-600">{skupajTM.toFixed(2)} tm</span>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function Vrstica({ label, vrednost }) {
  if (!vrednost) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <span className="text-stone-400 text-xs font-medium sm:w-28 shrink-0 sm:pt-0.5 mb-0.5 sm:mb-0">{label}</span>
      <span className="text-stone-700">{vrednost}</span>
    </div>
  );
}

function Dobavnica({ nalog, onZapri, shraniPodpis }) {
  const postavkeZaPrikaz = (nalog.postavke || []).filter(
    (p) => p.naziv || p.material || p.dolzina
  );
  const skupajM2 = postavkeZaPrikaz.reduce((v, p) => v + m2Postavke(p), 0);
  const danes = new Date().toLocaleDateString("sl-SI");
  const [podpisovanje, setPodpisovanje] = useState(false);
  const [posiljam, setPosiljam] = useState(false);

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .dobavnica-list, .dobavnica-list * { visibility: visible; }
          .dobavnica-list { position: absolute; top: 0; left: 0; width: 100%; padding: 0; margin: 0; }
          .dobavnica-brez-tiska { display: none !important; }
        }
      `}</style>

      <div className="dobavnica-brez-tiska flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => prenesiHTMLDokument(".dobavnica-list", `Dobavnica ${nalog.stevilka || ""}`, `dobavnica-${nalog.stevilka || "nalog"}${strankaZaIme(nalog) ? " " + strankaZaIme(nalog) : ""}.html`)}
          className="bg-stone-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <FileText size={15} /> Prenesi datoteko
        </button>
        <button
          onClick={onZapri}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Nazaj
        </button>
      </div>

      <div className="dobavnica-list bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b-2 border-stone-800 pb-2 mb-3">
          <img
            src={CAKS_LOGO}
            alt="Čakš logo"
            className="h-8 w-auto object-contain shrink-0"
          />
          <p className="carved text-sm uppercase text-stone-700 shrink-0">Dobavnica</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-2 text-sm border-b border-stone-200 pb-2">
          <span><span className="text-xs text-stone-400 uppercase mr-1">Št.</span><span className="font-semibold text-stone-800">{nalog.stevilka}</span></span>
          <span><span className="text-xs text-stone-400 uppercase mr-1">Kupec</span><span className="font-semibold text-stone-800">{nalog.stranka}</span></span>
          {nalog.telefon && (
            <span><span className="text-xs text-stone-400 uppercase mr-1">Tel</span><span className="text-stone-700">{nalog.telefon}</span></span>
          )}
          <span><span className="text-xs text-stone-400 uppercase mr-1">Datum</span><span className="text-stone-700">{danes}</span></span>
        </div>

        {postavkeZaPrikaz.length > 0 && (
          <div className="mb-3">
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "36%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-stone-300 text-left text-xs uppercase text-stone-500">
                  <th className="py-2 pr-1 overflow-hidden">#</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Naziv</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200">Material</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200 normal-case overflow-hidden truncate">Mere (cm)</th>
                  <th className="py-2 pr-1 pl-2 border-l border-stone-200 whitespace-nowrap">Kos.</th>
                </tr>
              </thead>
              <tbody>
                {postavkeZaPrikaz.map((p, idx) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="py-2 pr-1 text-xs text-stone-400 align-top overflow-hidden">{idx + 1}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-700 align-top">{p.naziv || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top">{p.material || "—"}</td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-800 align-top overflow-hidden">
                      {p.dolzina || "–"} × {p.sirina || "–"} × {p.debelina || "–"}
                    </td>
                    <td className="py-2 pr-1 pl-2 border-l border-stone-100 text-xs text-stone-600 align-top whitespace-nowrap">{p.kolicina || "1"}</td>
                  </tr>
                ))}
              </tbody>
              {skupajM2 > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3" className="pt-2 text-right text-xs font-medium text-stone-500">
                      Skupaj
                    </td>
                    <td className="pt-2 text-sm font-semibold text-stone-800" colSpan="2">{skupajM2.toFixed(2)} m²</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {nalog.prevzel && (
          <p className="text-sm text-stone-600 mb-2">Blago prevzel: {nalog.prevzel}</p>
        )}

        {nalog.opombe && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-4">
            <span className="text-xs text-stone-400 uppercase block mb-0.5">Opombe</span>
            {nalog.opombe}
          </div>
        )}

        {nalog.podpisPrevzemnika ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-8 mt-6 pt-2">
            <div className="border-t border-stone-400 pt-2 text-center text-xs text-stone-500">
              Podpis dobavitelja
            </div>
            <div className="text-center">
              <img src={nalog.podpisPrevzemnika} alt="Podpis prevzemnika" className="h-16 mx-auto object-contain" />
              <div className="border-t border-stone-400 pt-1 text-xs text-stone-500">
                Podpis prevzemnika{nalog.podpisIme ? ` — ${nalog.podpisIme}` : ""}
              </div>
              {nalog.podpisDatum && (
                <div className="dobavnica-brez-tiska text-[10px] text-stone-400 mt-0.5">
                  Podpisano {new Date(nalog.podpisDatum).toLocaleString("sl-SI")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-8 mt-8 pt-2">
              <div className="border-t border-stone-400 pt-2 text-center text-xs text-stone-500">
                Podpis dobavitelja
              </div>
              <div className="border-t border-stone-400 pt-2 text-center text-xs text-stone-500">
                Podpis prevzemnika
              </div>
            </div>
            <button
              onClick={() => setPodpisovanje(true)}
              className="dobavnica-brez-tiska w-full mt-4 bg-red-600 hover:bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              ✍️ Podpiši elektronsko (prevzemnik)
            </button>
          </>
        )}
      </div>

      {nalog.podpisPrevzemnika && (
        <button
          disabled={posiljam}
          onClick={async () => {
            setPosiljam(true);
            const zadeva = `Dobavnica ${nalog.stevilka || ""} — podpisana — Kamnoseštvo Čakš (${nalog.stranka})`;
            const besedilo =
              `Pozdravljeni,\n\n` +
              `v prilogi pošiljamo podpisano dobavnico ${nalog.stevilka || ""} za naročilo (${nalog.opis || ""}).\n` +
              `Stranka: ${nalog.stranka}${nalog.email ? ` (${nalog.email})` : ""}\n` +
              `Blago je prevzel: ${nalog.podpisIme || nalog.prevzel || nalog.stranka}${nalog.podpisDatum ? `, dne ${new Date(nalog.podpisDatum).toLocaleString("sl-SI")}` : ""}.\n\n` +
              `Lep pozdrav,\nKamnoseštvo Čakš\n031 235 146`;
            const uspeh = await posljiDokumentPoMailu(
              ".dobavnica-list",
              `Dobavnica ${nalog.stevilka || ""}`,
              `dobavnica-${nalog.stevilka || "nalog"}${strankaZaIme(nalog) ? " " + strankaZaIme(nalog) : ""}.html`,
              ZACASNI_PREJEMNIK_DOBAVNIC,
              zadeva,
              besedilo
            );
            setPosiljam(false);
            if (uspeh) alert(`Dobavnica je bila poslana na ${ZACASNI_PREJEMNIK_DOBAVNIC} (začasno, dokler domena ni preverjena).`);
          }}
          className="dobavnica-brez-tiska w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Mail size={15} /> {posiljam ? "Pošiljam …" : "Pošlji na mail"}
        </button>
      )}

      {podpisovanje && (
        <PodpisniPad
          zacetnoIme={nalog.prevzel || nalog.stranka || ""}
          onPreklici={() => setPodpisovanje(false)}
          onShrani={(podpisDataURL, ime) => {
            shraniPodpis(podpisDataURL, ime);
            setPodpisovanje(false);
          }}
        />
      )}
    </div>
  );
}

function PodpisniPad({ zacetnoIme, onPreklici, onShrani }) {
  const platnoRef = useRef(null);
  const risemRef = useRef(false);
  const zadnjaTockaRef = useRef(null);
  const [prazno, setPrazno] = useState(true);
  const [ime, setIme] = useState(zacetnoIme);

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
    ctx.strokeStyle = "#1c1917";
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
        <h3 className="carved text-base uppercase text-stone-700 mb-3">Elektronski podpis prevzemnika</h3>
        <input
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          placeholder="Ime in priimek prevzemnika"
          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/40"
        />
        <p className="text-xs text-stone-500 mb-1.5">Podpiši s prstom ali miško v spodnje polje:</p>
        <canvas
          ref={platnoRef}
          className="w-full border-2 border-dashed border-stone-300 rounded-lg touch-none"
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
            className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 border border-stone-300 hover:bg-stone-50"
          >
            Počisti
          </button>
          <button
            onClick={onPreklici}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
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
              const podatkiPodpisa = platnoRef.current.toDataURL("image/png");
              onShrani(podatkiPodpisa, ime.trim());
            }}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500"
          >
            Shrani podpis
          </button>
        </div>
      </div>
    </div>
  );
}

