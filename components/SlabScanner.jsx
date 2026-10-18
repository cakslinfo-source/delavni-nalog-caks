"use client";

// ===================== SLAB SCANNER (faza A+B) =====================
// Naložiš fotografijo plošče ali ostanka, z miško poklikaš po robu in dobiš natančen obris (poligon).
// Obris je poljubne oblike (ne le pravokotnik): točke lahko premikaš, dodajaš in brišeš.
// Merilo je za zdaj ročno (dve točki na sliki + znana razdalja). Prava kalibracija z oznakami pride v fazi D.
// Ta datoteka NE spreminja skladišča, nalogov ali nestinga — samostojen modul na naslovu /scanner.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------- geometrija ----------
function ploscina(t) {
  let s = 0;
  for (let i = 0; i < t.length; i++) {
    const a = t[i], b = t[(i + 1) % t.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
function obsega(t) {
  let s = 0;
  for (let i = 0; i < t.length; i++) {
    const a = t[i], b = t[(i + 1) % t.length];
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}
function okvir(t) {
  const xs = t.map((p) => p.x), ys = t.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
// najmanjši (zasukani) pravokotnik, ki obda obris — za "A × B" podatek
function najmanjsiPravokotnik(t) {
  let naj = null;
  for (let i = 0; i < t.length; i++) {
    const a = t[i], b = t[(i + 1) % t.length];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const c = Math.cos(-ang), s = Math.sin(-ang);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of t) {
      const x = p.x * c - p.y * s, y = p.x * s + p.y * c;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const w = x1 - x0, h = y1 - y0;
    if (!naj || w * h < naj.w * naj.h) naj = { w, h };
  }
  return naj ? { a: Math.max(naj.w, naj.h), b: Math.min(naj.w, naj.h) } : { a: 0, b: 0 };
}
function razdaljaDoDaljice(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  let u = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
  u = Math.max(0, Math.min(1, u));
  return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
}
const fmt = (x, d = 0) => (Number.isFinite(x) ? x.toLocaleString("sl-SI", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–");

export default function SlabScanner() {
  const [slika, setSlika] = useState(null); // { url, w, h, ime }
  const [tocke, setTocke] = useState([]);
  const [zaprt, setZaprt] = useState(false);
  const [izbrana, setIzbrana] = useState(null);
  const [nacin, setNacin] = useState("obris"); // obris | merilo | meritev
  const [pogled, setPogled] = useState({ x: 0, y: 0, w: 1000 });
  const [okno, setOkno] = useState({ w: 800, h: 600 });
  const [merilo, setMerilo] = useState(null); // { a, b, mm, mmPx }
  const [meriloTocke, setMeriloTocke] = useState([]);
  const [meriloMm, setMeriloMm] = useState("");
  const [meritev, setMeritev] = useState([]);
  const [prikaz, setPrikaz] = useState("obris"); // obris | brez
  const [napaka, setNapaka] = useState("");
  const [vsiPodatki, setVsiPodatki] = useState(false);

  const svgRef = useRef(null);
  const okvirRef = useRef(null);
  const interakcija = useRef(null);
  const stanje = useRef({});
  stanje.current = { slika, tocke, zaprt, nacin, pogled, okno, meriloTocke, meritev };

  // velikost območja
  useEffect(() => {
    const el = okvirRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOkno({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) }));
    ro.observe(el);
    setOkno({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) });
    return () => ro.disconnect();
  }, []);

  const visina = pogled.w * (okno.h / okno.w);
  const k = pogled.w / okno.w; // slikovnih točk na zaslonsko točko

  const vSliko = useCallback((cx, cy) => {
    const r = svgRef.current.getBoundingClientRect();
    const p = stanje.current.pogled;
    const o = stanje.current.okno;
    return { x: p.x + ((cx - r.left) / r.width) * p.w, y: p.y + ((cy - r.top) / r.height) * (p.w * (o.h / o.w)) };
  }, []);

  const prilagodi = useCallback((s, o) => {
    const sl = s || stanje.current.slika;
    const ok = o || stanje.current.okno;
    if (!sl) return;
    const w = Math.max(sl.w, sl.h * (ok.w / ok.h)) * 1.04;
    const h = w * (ok.h / ok.w);
    setPogled({ x: (sl.w - w) / 2, y: (sl.h - h) / 2, w });
  }, []);

  function naloziDatoteko(f) {
    if (!f) return;
    setNapaka("");
    if (!/^image\//.test(f.type)) { setNapaka("To ni slika. Izberi fotografijo (JPEG)."); return; }
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      if (slika && slika.url) URL.revokeObjectURL(slika.url);
      const s = { url, w: im.naturalWidth, h: im.naturalHeight, ime: f.name };
      setSlika(s); setTocke([]); setZaprt(false); setIzbrana(null); setMerilo(null); setMeriloTocke([]); setMeritev([]); setNacin("obris"); setPrikaz("obris");
      prilagodi(s, stanje.current.okno);
    };
    im.onerror = () => { setNapaka("Slike ni mogoče odpreti."); URL.revokeObjectURL(url); };
    im.src = url;
  }

  // ---------- zoom ----------
  function zoomOkoli(cx, cy, faktor) {
    setPogled((p) => {
      const o = stanje.current.okno;
      const r = svgRef.current.getBoundingClientRect();
      const sl = stanje.current.slika;
      const minW = 20; // največja povečava
      const maxW = sl ? Math.max(sl.w, sl.h) * 4 : 10000;
      const nw = Math.max(minW, Math.min(maxW, p.w * faktor));
      const fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
      const px = p.x + fx * p.w, py = p.y + fy * (p.w * (o.h / o.w));
      return { x: px - fx * nw, y: py - fy * (nw * (o.h / o.w)), w: nw };
    });
  }
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const f = (e) => { e.preventDefault(); zoomOkoli(e.clientX, e.clientY, e.deltaY > 0 ? 1.18 : 1 / 1.18); };
    el.addEventListener("wheel", f, { passive: false });
    return () => el.removeEventListener("wheel", f);
  }, [slika]);
  function zoomSredina(faktor) {
    const r = svgRef.current.getBoundingClientRect();
    zoomOkoli(r.left + r.width / 2, r.top + r.height / 2, faktor);
  }
  function enaProti(razmerje) { // 1 slikovna točka = razmerje zaslonskih točk
    const r = svgRef.current.getBoundingClientRect();
    const sred = vSliko(r.left + r.width / 2, r.top + r.height / 2);
    const w = okno.w / razmerje;
    setPogled({ x: sred.x - w / 2, y: sred.y - (w * (okno.h / okno.w)) / 2, w });
  }

  // ---------- miška / prst ----------
  function prag() { return 9 * (stanje.current.pogled.w / stanje.current.okno.w); }

  function najdiTocko(p) {
    const { tocke: t } = stanje.current;
    const pr = prag();
    let naj = -1, d = pr;
    t.forEach((q, i) => { const dd = Math.hypot(q.x - p.x, q.y - p.y); if (dd <= d) { d = dd; naj = i; } });
    return naj;
  }
  function najdiRob(p) {
    const { tocke: t, zaprt: z } = stanje.current;
    if (!z || t.length < 3) return -1;
    const pr = prag();
    let naj = -1, d = pr;
    for (let i = 0; i < t.length; i++) {
      const dd = razdaljaDoDaljice(p, t[i], t[(i + 1) % t.length]);
      if (dd <= d) { d = dd; naj = i; }
    }
    return naj;
  }

  function onDown(e) {
    if (!stanje.current.slika) return;
    if (e.button === 2) return;
    const p = vSliko(e.clientX, e.clientY);
    const st = stanje.current;
    let cilj = { vrsta: "ozadje" };
    if (st.nacin === "obris") {
      const i = najdiTocko(p);
      if (i >= 0) cilj = { vrsta: "tocka", i };
      else {
        const r = najdiRob(p);
        if (r >= 0) cilj = { vrsta: "rob", i: r };
      }
    }
    interakcija.current = { cilj, x0: e.clientX, y0: e.clientY, pogled0: st.pogled, premaknjeno: false, id: e.pointerId };
    const move = (ev) => {
      const ia = interakcija.current;
      if (!ia) return;
      const dx = ev.clientX - ia.x0, dy = ev.clientY - ia.y0;
      if (!ia.premaknjeno && Math.hypot(dx, dy) < 4) return;
      ia.premaknjeno = true;
      if (ia.cilj.vrsta === "tocka") {
        const q = vSliko(ev.clientX, ev.clientY);
        setTocke((t) => t.map((a, i) => (i === ia.cilj.i ? { x: q.x, y: q.y } : a)));
        setIzbrana(ia.cilj.i);
      } else if (ia.cilj.vrsta === "rob") {
        // povlečenje roba vstavi novo točko in jo premika
        const q = vSliko(ev.clientX, ev.clientY);
        const pos = ia.cilj.i + 1;
        setTocke((t) => { const n = t.slice(); n.splice(pos, 0, { x: q.x, y: q.y }); return n; });
        interakcija.current = { ...ia, cilj: { vrsta: "tocka", i: pos } };
        setIzbrana(pos);
      } else {
        const o = stanje.current.okno;
        const sk = ia.pogled0.w / o.w;
        setPogled({ x: ia.pogled0.x - dx * sk, y: ia.pogled0.y - dy * sk, w: ia.pogled0.w });
      }
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const ia = interakcija.current;
      interakcija.current = null;
      if (!ia || ia.premaknjeno) return;
      klik(vSliko(ev.clientX, ev.clientY), ia.cilj);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  function klik(p, cilj) {
    const st = stanje.current;
    if (st.nacin === "merilo") {
      setMeriloTocke((m) => (m.length >= 2 ? [p] : [...m, p]));
      return;
    }
    if (st.nacin === "meritev") {
      setMeritev((m) => (m.length >= 2 ? [p] : [...m, p]));
      return;
    }
    // obris
    if (cilj.vrsta === "tocka") {
      if (!st.zaprt && cilj.i === 0 && st.tocke.length >= 3) { setZaprt(true); setIzbrana(null); return; }
      setIzbrana(cilj.i);
      return;
    }
    if (cilj.vrsta === "rob") {
      const pos = cilj.i + 1;
      setTocke((t) => { const n = t.slice(); n.splice(pos, 0, { x: p.x, y: p.y }); return n; });
      setIzbrana(pos);
      return;
    }
    if (!st.zaprt) {
      setTocke((t) => [...t, { x: p.x, y: p.y }]);
      setIzbrana(st.tocke.length);
    } else setIzbrana(null);
  }

  function izbrisiTocko(i) {
    setTocke((t) => {
      const n = t.filter((_, j) => j !== i);
      if (n.length < 3) setZaprt(false);
      return n;
    });
    setIzbrana(null);
  }
  function razveljavi() {
    if (zaprt) { setZaprt(false); return; }
    setTocke((t) => t.slice(0, -1));
    setIzbrana(null);
  }

  // tipke
  useEffect(() => {
    const f = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && stanje.current.izbranaTipka != null) { e.preventDefault(); izbrisiTocko(stanje.current.izbranaTipka); }
      else if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); razveljavi(); }
      else if (e.key === "Enter" && !stanje.current.zaprt && stanje.current.tocke.length >= 3) setZaprt(true);
      else if (e.key === "Escape") { setIzbrana(null); setMeriloTocke([]); setMeritev([]); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  stanje.current.izbranaTipka = izbrana;

  // ---------- izračuni ----------
  const mmPx = merilo ? merilo.mmPx : null;
  const rezultat = useMemo(() => {
    if (!zaprt || tocke.length < 3) return null;
    const pl = ploscina(tocke);
    const ok = okvir(tocke);
    const mp = najmanjsiPravokotnik(tocke);
    const f = mmPx || 1;
    return {
      povrsinaPx: pl,
      povrsinaM2: mmPx ? (pl * f * f) / 1e6 : null,
      obsegMm: obsega(tocke) * f,
      okvirW: ok.w * f, okvirH: ok.h * f,
      pravA: mp.a * f, pravB: mp.b * f,
      ok,
    };
  }, [tocke, zaprt, mmPx]);

  function potrdiMerilo() {
    const mm = parseFloat(String(meriloMm).replace(",", "."));
    if (meriloTocke.length < 2) { setNapaka("Najprej na sliki označi dve točki, katerih razdaljo poznaš."); return; }
    if (!(mm > 0)) { setNapaka("Vpiši razdaljo v milimetrih."); return; }
    const d = Math.hypot(meriloTocke[1].x - meriloTocke[0].x, meriloTocke[1].y - meriloTocke[0].y);
    if (d < 1) { setNapaka("Točki sta preblizu."); return; }
    setNapaka("");
    setMerilo({ a: meriloTocke[0], b: meriloTocke[1], mm, mmPx: mm / d });
    setNacin("obris");
  }

  // koordinate v mm: izhodišče zgoraj levo od okvirja obrisa
  function tockeMm() {
    if (!rezultat) return [];
    const f = mmPx || 1;
    return tocke.map((p) => ({ x: +((p.x - rezultat.ok.x0) * f).toFixed(2), y: +((p.y - rezultat.ok.y0) * f).toFixed(2) }));
  }
  function prenesi(blob, ime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ime;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function osnovaIme() { return (slika?.ime || "plosca").replace(/\.[^.]+$/, ""); }
  function prenesiObris() {
    const podatki = {
      verzija: 1,
      datoteka: slika.ime,
      enota: mmPx ? "mm" : "slikovne točke (merilo ni nastavljeno)",
      merilo: merilo ? { mmNaTocko: merilo.mmPx, referenca_mm: merilo.mm, opozorilo: "Ročno merilo z dvema točkama, brez popravka perspektive in leče." } : null,
      tocke: tockeMm(),
      povrsina_m2: rezultat.povrsinaM2,
      pravokotnik_mm: { a: +rezultat.pravA.toFixed(1), b: +rezultat.pravB.toFixed(1) },
    };
    prenesi(new Blob([JSON.stringify(podatki, null, 2)], { type: "application/json" }), `obris-${osnovaIme()}.json`);
  }
  async function prenesiPng() {
    try {
      const im = new Image();
      im.src = slika.url;
      await im.decode();
      const { x0, y0, w, h } = rezultat.ok;
      const cw = Math.max(1, Math.round(w)), ch = Math.max(1, Math.round(h));
      const maxStran = 8000;
      const sk = Math.min(1, maxStran / Math.max(cw, ch));
      const c = document.createElement("canvas");
      c.width = Math.round(cw * sk); c.height = Math.round(ch * sk);
      const g = c.getContext("2d");
      g.scale(sk, sk);
      g.beginPath();
      tocke.forEach((p, i) => (i ? g.lineTo(p.x - x0, p.y - y0) : g.moveTo(p.x - x0, p.y - y0)));
      g.closePath();
      g.clip();
      g.drawImage(im, -x0, -y0);
      c.toBlob((b) => b ? prenesi(b, `plosca-${osnovaIme()}.png`) : setNapaka("PNG ni bilo mogoče ustvariti."), "image/png");
    } catch (e) {
      setNapaka("PNG ni bilo mogoče ustvariti: " + (e.message || e));
    }
  }
  function pocisti() {
    if (tocke.length && !confirm("Izbrišem celoten obris?")) return;
    setTocke([]); setZaprt(false); setIzbrana(null);
  }

  // ---------- risanje ----------
  const sw = (n) => n * k; // debelina v zaslonskih točkah
  const polyPath = tocke.length ? "M" + tocke.map((p) => `${p.x},${p.y}`).join("L") + (zaprt ? "Z" : "") : "";
  const maskaPath = zaprt && slika ? `M0,0H${slika.w}V${slika.h}H0Z` + polyPath : "";
  const oznaka = (a, b) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return mmPx ? `${fmt(d * mmPx, 1)} mm` : `${fmt(d, 0)} točk`;
  };

  const kursor = !slika ? "default" : nacin === "obris" ? "crosshair" : "crosshair";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      <header className="bg-stone-900 text-white px-4 py-3 flex flex-wrap items-center gap-3">
        <a href="/" className="text-sm text-stone-300 hover:text-white">← Nazaj</a>
        <h1 className="font-semibold">📷 Slab Scanner</h1>
        <span className="text-xs text-stone-400">faza A+B · obris plošče z miško</span>
        <div className="ml-auto flex gap-2">
          <label className="text-sm px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-stone-900 font-medium cursor-pointer">
            {slika ? "Druga fotografija" : "Naloži fotografijo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { naloziDatoteko(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* platno */}
        <div className="flex-1 flex flex-col min-h-[55vh] lg:min-h-0">
          <div className="bg-white border-b border-stone-200 px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
            {[["obris", "✏️ Obris"], ["merilo", "📏 Merilo"], ["meritev", "↔ Meritev"]].map(([id, ime]) => (
              <button key={id} onClick={() => { setNacin(id); setNapaka(""); }} disabled={!slika}
                className={`px-3 py-1.5 rounded-lg border ${nacin === id ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-300"} disabled:opacity-40`}>
                {ime}
              </button>
            ))}
            <span className="w-px h-6 bg-stone-300 mx-1" />
            <button onClick={() => zoomSredina(1 / 1.5)} disabled={!slika} className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40">＋</button>
            <button onClick={() => zoomSredina(1.5)} disabled={!slika} className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40">－</button>
            <button onClick={() => prilagodi()} disabled={!slika} className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40">Cela slika</button>
            <button onClick={() => enaProti(1)} disabled={!slika} className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40">100 %</button>
            <span className="w-px h-6 bg-stone-300 mx-1" />
            <button onClick={razveljavi} disabled={!tocke.length} className="px-3 py-1.5 rounded-lg border border-stone-300 disabled:opacity-40">↶ Razveljavi</button>
            {!zaprt && tocke.length >= 3 && (
              <button onClick={() => { setZaprt(true); setIzbrana(null); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">✓ Zapri obris</button>
            )}
            {izbrana != null && (
              <button onClick={() => izbrisiTocko(izbrana)} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700">🗑 Izbriši točko</button>
            )}
            {zaprt && (
              <button onClick={() => setPrikaz(prikaz === "obris" ? "brez" : "obris")} className="px-3 py-1.5 rounded-lg border border-stone-300">
                {prikaz === "obris" ? "Prikaži brez ozadja" : "Prikaži z ozadjem"}
              </button>
            )}
          </div>

          <div ref={okvirRef} className="relative flex-1 bg-stone-300 overflow-hidden select-none touch-none" style={{ minHeight: 320 }}>
            {!slika && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); naloziDatoteko(e.dataTransfer.files?.[0]); }}>
                <div className="text-stone-600 max-w-sm">
                  <div className="text-5xl mb-3">🪨</div>
                  <div className="font-medium mb-1">Naloži fotografijo plošče ali ostanka</div>
                  <div className="text-sm mb-4">Povleci sliko sem ali pritisni gumb zgoraj desno. Nato s klikanjem po robu kamna določi obris.</div>
                </div>
              </div>
            )}
            {slika && (
              <svg ref={svgRef} width="100%" height="100%" viewBox={`${pogled.x} ${pogled.y} ${pogled.w} ${visina}`}
                preserveAspectRatio="none" style={{ cursor: kursor, display: "block", width: "100%", height: "100%" }}
                onPointerDown={onDown} onContextMenu={(e) => {
                  e.preventDefault();
                  const i = najdiTocko(vSliko(e.clientX, e.clientY));
                  if (i >= 0) izbrisiTocko(i);
                }}>
                <defs>
                  <pattern id="sahovnica" width={sw(16)} height={sw(16)} patternUnits="userSpaceOnUse">
                    <rect width={sw(16)} height={sw(16)} fill="#e7e5e4" />
                    <rect width={sw(8)} height={sw(8)} fill="#d6d3d1" />
                    <rect x={sw(8)} y={sw(8)} width={sw(8)} height={sw(8)} fill="#d6d3d1" />
                  </pattern>
                  {zaprt && <clipPath id="obrisClip"><path d={polyPath} /></clipPath>}
                </defs>
                {zaprt && prikaz === "brez" ? (
                  <>
                    <rect x={0} y={0} width={slika.w} height={slika.h} fill="url(#sahovnica)" />
                    <image href={slika.url} x={0} y={0} width={slika.w} height={slika.h} clipPath="url(#obrisClip)" />
                    <path d={polyPath} fill="none" stroke="#10b981" strokeWidth={sw(1.5)} />
                  </>
                ) : (
                  <>
                    <image href={slika.url} x={0} y={0} width={slika.w} height={slika.h} />
                    {zaprt && <path d={maskaPath} fill="rgba(0,0,0,0.45)" fillRule="evenodd" />}
                    {tocke.length > 1 && (
                      <path d={polyPath} fill={zaprt ? "rgba(16,185,129,0.12)" : "none"} stroke="#fff" strokeWidth={sw(4)} strokeLinejoin="round" opacity={0.7} />
                    )}
                    {tocke.length > 1 && (
                      <path d={polyPath} fill="none" stroke={zaprt ? "#10b981" : "#f59e0b"} strokeWidth={sw(2)} strokeLinejoin="round" />
                    )}
                  </>
                )}

                {/* točke obrisa */}
                {prikaz !== "brez" && tocke.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={sw(izbrana === i ? 7 : i === 0 && !zaprt ? 7 : 5)}
                      fill={izbrana === i ? "#ef4444" : i === 0 ? "#2563eb" : "#fff"} stroke="#111" strokeWidth={sw(1.5)} />
                  </g>
                ))}

                {/* merilo */}
                {meriloTocke.length > 0 && (
                  <g>
                    {meriloTocke.length === 2 && <line x1={meriloTocke[0].x} y1={meriloTocke[0].y} x2={meriloTocke[1].x} y2={meriloTocke[1].y} stroke="#a855f7" strokeWidth={sw(2)} />}
                    {meriloTocke.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={sw(5)} fill="#a855f7" stroke="#fff" strokeWidth={sw(1.5)} />)}
                  </g>
                )}
                {merilo && nacin !== "merilo" && prikaz !== "brez" && (
                  <g opacity={0.8}>
                    <line x1={merilo.a.x} y1={merilo.a.y} x2={merilo.b.x} y2={merilo.b.y} stroke="#a855f7" strokeWidth={sw(1.5)} strokeDasharray={`${sw(6)} ${sw(4)}`} />
                  </g>
                )}
                {/* meritev */}
                {meritev.length > 0 && (
                  <g>
                    {meritev.length === 2 && <line x1={meritev[0].x} y1={meritev[0].y} x2={meritev[1].x} y2={meritev[1].y} stroke="#0ea5e9" strokeWidth={sw(2)} />}
                    {meritev.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={sw(5)} fill="#0ea5e9" stroke="#fff" strokeWidth={sw(1.5)} />)}
                    {meritev.length === 2 && (
                      <text x={(meritev[0].x + meritev[1].x) / 2} y={(meritev[0].y + meritev[1].y) / 2 - sw(8)} fontSize={sw(15)} fontWeight="bold" textAnchor="middle" fill="#fff" stroke="#0369a1" strokeWidth={sw(4)} paintOrder="stroke">
                        {oznaka(meritev[0], meritev[1])}
                      </text>
                    )}
                  </g>
                )}
              </svg>
            )}
            {slika && (
              <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
                {slika.w}×{slika.h} točk · povečava {fmt((okno.w / pogled.w) * 100, 0)} %
              </div>
            )}
          </div>
        </div>

        {/* stranska plošča */}
        <aside className="lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-stone-200 p-4 space-y-4 overflow-y-auto">
          {napaka && <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg p-2">{napaka}</div>}

          {!slika && <p className="text-sm text-stone-600">Naloži fotografijo, da začneš.</p>}

          {slika && nacin === "obris" && (
            <div className="text-sm text-stone-700 space-y-1">
              <div className="font-semibold">✏️ Obris</div>
              {!zaprt ? (
                <ul className="list-disc pl-5 space-y-0.5 text-stone-600">
                  <li>Klikaj <b>po robu kamna</b>, točko za točko.</li>
                  <li>Zaključi s klikom na <b>modro prvo točko</b> ali s tipko Enter.</li>
                  <li>Kolesce miške = povečava, vlečenje ozadja = premik slike.</li>
                  <li>Bolj ko je rob nepravilen, več točk postavi.</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-0.5 text-stone-600">
                  <li><b>Povleci točko</b>, da jo premakneš.</li>
                  <li><b>Povleci ali klikni rob</b>, da dodaš točko.</li>
                  <li><b>Desni klik</b> na točko (ali Delete) jo izbriše.</li>
                </ul>
              )}
              <div className="text-stone-500">Točk: {tocke.length}</div>
              {tocke.length > 0 && <button onClick={pocisti} className="text-xs text-red-700 underline">Začni znova</button>}
            </div>
          )}

          {slika && nacin === "merilo" && (
            <div className="text-sm space-y-2">
              <div className="font-semibold">📏 Merilo (začasno, ročno)</div>
              <p className="text-stone-600">Na sliki označi <b>dve točki, katerih razdaljo poznaš</b> (npr. dva konca merilne letve, položene ob ploščo), in vpiši razdaljo.</p>
              <div className="text-stone-500">Označeno točk: {meriloTocke.length}/2</div>
              <div className="flex gap-2 items-center">
                <input value={meriloMm} onChange={(e) => setMeriloMm(e.target.value)} inputMode="decimal" placeholder="razdalja v mm"
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2" />
                <span className="text-stone-500">mm</span>
              </div>
              <button onClick={potrdiMerilo} className="w-full px-3 py-2 rounded-lg bg-stone-900 text-white">Uporabi merilo</button>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Opozorilo: to je preprosto merilo z eno razdaljo. Ne popravi perspektive, leče ali debeline plošče, zato je natančno le približno. Prava kalibracija z oznakami (cilj ±2 mm) pride v fazi D.
              </p>
            </div>
          )}

          {slika && nacin === "meritev" && (
            <div className="text-sm space-y-1">
              <div className="font-semibold">↔ Meritev razdalje</div>
              <p className="text-stone-600">Klikni dve točki na sliki; vmes se izpiše razdalja{mmPx ? " v mm" : " v točkah (merilo še ni nastavljeno)"}.</p>
              {meritev.length === 2 && <div className="text-lg font-semibold">{oznaka(meritev[0], meritev[1])}</div>}
            </div>
          )}

          {slika && (
            <div className="border-t border-stone-200 pt-3 text-sm space-y-2">
              <div className="font-semibold">Rezultat</div>
              {!rezultat ? (
                <p className="text-stone-500">Obris še ni zaprt. Postavi vsaj 3 točke in jih zaključi.</p>
              ) : (
                <>
                  {!mmPx && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">Merilo ni nastavljeno — mere so v slikovnih točkah. V načinu »Merilo« določi razdaljo.</p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <dt className="text-stone-500">Površina</dt>
                    <dd className="font-semibold text-right">{mmPx ? `${fmt(rezultat.povrsinaM2, 3)} m²` : `${fmt(rezultat.povrsinaPx, 0)} točk²`}</dd>
                    <dt className="text-stone-500">Najmanjši pravokotnik</dt>
                    <dd className="font-semibold text-right">{fmt(rezultat.pravA, mmPx ? 0 : 0)} × {fmt(rezultat.pravB, 0)} {mmPx ? "mm" : "točk"}</dd>
                    <dt className="text-stone-500">Vodoravno × navpično</dt>
                    <dd className="text-right">{fmt(rezultat.okvirW, 0)} × {fmt(rezultat.okvirH, 0)}</dd>
                    <dt className="text-stone-500">Obseg</dt>
                    <dd className="text-right">{fmt(rezultat.obsegMm, 0)} {mmPx ? "mm" : "točk"}</dd>
                    <dt className="text-stone-500">Točk obrisa</dt>
                    <dd className="text-right">{tocke.length}</dd>
                  </dl>
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={prenesiPng} className="px-3 py-2 rounded-lg border border-stone-300">⬇ Plošča brez ozadja (PNG)</button>
                    <button onClick={prenesiObris} className="px-3 py-2 rounded-lg border border-stone-300">⬇ Obris v {mmPx ? "mm" : "točkah"} (JSON)</button>
                    <button onClick={() => setVsiPodatki(!vsiPodatki)} className="text-xs underline text-stone-600 text-left">{vsiPodatki ? "Skrij koordinate" : "Pokaži koordinate točk"}</button>
                  </div>
                  {vsiPodatki && (
                    <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-stone-50 text-stone-500"><tr><th className="p-1 text-left">#</th><th className="p-1 text-right">x</th><th className="p-1 text-right">y</th></tr></thead>
                        <tbody>{tockeMm().map((p, i) => (<tr key={i} className="border-t border-stone-100"><td className="p-1">{i + 1}</td><td className="p-1 text-right">{p.x}</td><td className="p-1 text-right">{p.y}</td></tr>))}</tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {slika && (
            <p className="text-xs text-stone-400 border-t border-stone-100 pt-2">
              Shranjevanje v skladišče in povezava z nestingom pridejo v naslednjih fazah. Datoteka: {slika.ime}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
