"use client";

import { useState, useEffect, useRef } from "react";

const fmt = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const dat = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("sl-SI");
};

export default function PodpisPonudbe({ params }) {
  const { token } = params;
  const [p, setP] = useState(null);
  const [napakaStrani, setNapakaStrani] = useState("");
  const [ime, setIme] = useState("");
  const [strinjam, setStrinjam] = useState(false);
  const [imaPodpis, setImaPodpis] = useState(false);
  const [napaka, setNapaka] = useState("");
  const [posiljam, setPosiljam] = useState(false);
  const [koncano, setKoncano] = useState(null);
  const platno = useRef(null);
  const riše = useRef(false);

  useEffect(() => {
    fetch(`/api/ponudba/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.napaka || "Povezava ni veljavna.");
        setP(j);
        if (j.podpisano) setKoncano(j.podpisano);
      })
      .catch((e) => setNapakaStrani(e.message));
  }, [token]);

  // priprava platna za podpis (ostro tudi na telefonu)
  useEffect(() => {
    const c = platno.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, [p, koncano]);

  function tocka(e) {
    const r = platno.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function zacni(e) {
    e.preventDefault();
    riše.current = true;
    platno.current.setPointerCapture?.(e.pointerId);
    const t = tocka(e);
    const ctx = platno.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + 0.01, t.y + 0.01);
    ctx.stroke();
    setImaPodpis(true);
  }
  function premakni(e) {
    if (!riše.current) return;
    e.preventDefault();
    const t = tocka(e);
    const ctx = platno.current.getContext("2d");
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
  }
  function konec() {
    riše.current = false;
  }
  function pocisti() {
    const c = platno.current;
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    setImaPodpis(false);
  }

  function slikaPodpisa() {
    // pomanjšan PNG (največ 500 px široko), da je zapis majhen
    const c = platno.current;
    const razmerje = Math.min(1, 500 / c.width);
    const m = document.createElement("canvas");
    m.width = Math.round(c.width * razmerje);
    m.height = Math.round(c.height * razmerje);
    const mctx = m.getContext("2d");
    mctx.fillStyle = "#fff";
    mctx.fillRect(0, 0, m.width, m.height);
    mctx.drawImage(c, 0, 0, m.width, m.height);
    return m.toDataURL("image/png");
  }

  async function podpisi() {
    setNapaka("");
    if (!ime.trim()) return setNapaka("Vpiši ime in priimek.");
    if (!imaPodpis) return setNapaka("Podpiši se v okvir.");
    if (!strinjam) return setNapaka("Potrdi, da se strinjaš.");
    setPosiljam(true);
    try {
      const r = await fetch(`/api/ponudba/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ime: ime.trim(), podpis: slikaPodpisa(), potrjujem: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNapaka(j.napaka || "Podpisovanje ni uspelo. Poskusi znova.");
        setPosiljam(false);
        return;
      }
      setKoncano({ ime: ime.trim(), datum: j.datum });
    } catch (e) {
      setNapaka("Napaka pri povezavi. Poskusi znova.");
    }
    setPosiljam(false);
  }

  const okvir = "min-h-screen bg-stone-100 flex items-start justify-center p-3 sm:p-6";

  if (napakaStrani)
    return (
      <div className={okvir}>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 max-w-md w-full text-center mt-10">
          <div className="font-bold text-lg mb-2">ČAKŠ <span className="text-red-600">· Ponudba</span></div>
          <p className="text-stone-600">{napakaStrani}</p>
          <p className="text-stone-400 text-sm mt-3">Za pomoč nas pokličite na 031 235 146.</p>
        </div>
      </div>
    );
  if (!p)
    return (
      <div className={okvir}>
        <p className="text-stone-500 mt-20">Nalagam …</p>
      </div>
    );

  return (
    <div className={okvir}>
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-7 max-w-2xl w-full">
        <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-4">
          <div className="font-bold text-lg">ČAKŠ <span className="text-red-600">· Kamnoseštvo</span></div>
          <div className="text-xs text-stone-500">031 235 146</div>
        </div>

        <h1 className="text-lg font-bold">{p.jePonudba ? "Ponudba" : "Naročilo"} {p.stevilka}</h1>
        <div className="text-sm text-stone-600 mt-1 space-y-0.5">
          <div>Stranka: <b>{p.stranka}</b></div>
          {p.objekt && <div>Objekt: <b>{p.objekt}</b></div>}
          {p.opis && <div>Opis: {p.opis}</div>}
          {p.veljavnost && <div>Ponudba velja do: <b>{dat(p.veljavnost)}</b></div>}
          {p.rok && <div>Predviden rok izdelave: <b>{dat(p.rok)}</b></div>}
        </div>

        {p.postavke.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-1">Police (preglejte vse mere)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-stone-500 border-b-2 border-stone-300">
                    <th className="py-1.5 pr-2">#</th>
                    <th className="py-1.5 pr-2">Naziv</th>
                    <th className="py-1.5 pr-2">Material</th>
                    <th className="py-1.5 pr-2">Mere v cm (dolžina × širina × debelina)</th>
                    <th className="py-1.5">Kos.</th>
                  </tr>
                </thead>
                <tbody>
                  {p.postavke.map((x, i) => (
                    <tr key={i} className="border-b border-stone-100 align-top">
                      <td className="py-1.5 pr-2 text-stone-400">{i + 1}</td>
                      <td className="py-1.5 pr-2">{x.naziv || "—"}</td>
                      <td className="py-1.5 pr-2">{x.material || "—"}</td>
                      <td className="py-1.5 pr-2 font-medium">
                        {x.dolzina || "–"} × {x.poseven ? `L:${x.sirinaLevo || "–"} / D:${x.sirinaDesno || "–"}` : x.sirina || "–"} × {x.debelina || "–"}
                        {x.vecKosov && <div className="text-xs text-amber-700 font-normal">sestavljeno iz {x.steviloKosov || 2} kosov</div>}
                      </td>
                      <td className="py-1.5">{x.kolicina}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {p.neto > 0 && (
          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
            {p.popust > 0 && <div className="flex justify-between"><span>Cena brez DDV</span><span>{fmt(p.neto)}</span></div>}
            {p.popust > 0 && <div className="flex justify-between text-stone-600"><span>Popust {p.popust} %</span><span>−{fmt(p.neto - p.netoPoPopustu)}</span></div>}
            <div className="flex justify-between"><span>Skupaj brez DDV</span><span className="font-semibold">{fmt(p.netoPoPopustu)}</span></div>
            <div className="flex justify-between text-stone-600"><span>DDV 22 %</span><span>{fmt(p.bruto - p.netoPoPopustu)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-stone-300 mt-1 pt-1"><span>Skupaj z DDV</span><span>{fmt(p.bruto)}</span></div>
          </div>
        )}

        <div className="mt-5 text-sm">
          <div className="font-semibold mb-1">Pogoji</div>
          <ol className="list-decimal ml-5 space-y-1 text-stone-700">
            <li>Police se izdelajo natanko po merah, skicah in navodilih, ki jih je posredovala stranka.</li>
            <li>Stranka ob pregledu ponudbe sama preveri vse mere, količine, material in izvedbo. S podpisom potrjuje, da so vsi podatki pravilni.</li>
            <li>Če so mere ali skice napisane ali narisane neberljivo (na primer ročno), Kamnoseštvo Čakš ne odgovarja za netočnosti, ki nastanejo zaradi napačno prebranih podatkov.</li>
            <li>Stranka je dolžna ob prevzemu prešteti vse police in preveriti količino ter stanje.</li>
            <li>Poznejših reklamacij in manjkov ne upoštevamo.</li>
            <li>Kamnoseštvo Čakš odgovarja za police samo do prevzema. Kaj se z njimi dogaja po prevzemu (prevoz, nalaganje, vgradnja, uporaba), ni naša odgovornost.</li>
          </ol>
        </div>

        {koncano ? (
          <div className="mt-6 bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-center">
            <div className="text-2xl">✅</div>
            <div className="font-semibold text-emerald-800">Ponudba je podpisana</div>
            <div className="text-sm text-emerald-700 mt-1">
              {koncano.ime} · {koncano.datum ? new Date(koncano.datum).toLocaleString("sl-SI") : ""}
            </div>
            <div className="text-xs text-stone-500 mt-2">Hvala. Kamnoseštvo Čakš se vam bo oglasilo glede izdelave.</div>
          </div>
        ) : (
          <div className="mt-6">
            <label className="block text-sm font-semibold mb-1" htmlFor="ime">Ime in priimek</label>
            <input
              id="ime"
              value={ime}
              onChange={(e) => { setIme(e.target.value); setNapaka(""); }}
              autoComplete="name"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-base"
              placeholder="Vpišite ime in priimek"
            />

            <div className="flex items-center justify-between mt-4 mb-1">
              <span className="text-sm font-semibold">Podpis (s prstom ali miško)</span>
              <button type="button" onClick={pocisti} className="text-xs text-stone-500 underline">Počisti</button>
            </div>
            <canvas
              ref={platno}
              onPointerDown={zacni}
              onPointerMove={premakni}
              onPointerUp={konec}
              onPointerCancel={konec}
              onPointerLeave={konec}
              className="w-full border-2 border-dashed border-stone-400 rounded-lg bg-white"
              style={{ height: 160, touchAction: "none" }}
            />

            <label className="flex items-start gap-2 mt-4 text-sm">
              <input type="checkbox" checked={strinjam} onChange={(e) => { setStrinjam(e.target.checked); setNapaka(""); }} className="mt-1" />
              <span>Preveril/a sem vse mere in podatke, preberem pogoje in ponudbo sprejemam.</span>
            </label>

            {napaka && <p className="text-red-600 text-sm mt-3">{napaka}</p>}
            <button
              onClick={podpisi}
              disabled={posiljam}
              className="w-full mt-4 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-base"
            >
              {posiljam ? "Pošiljam …" : "Podpiši in sprejmi ponudbo"}
            </button>
          </div>
        )}
        <div className="text-[11px] text-stone-400 mt-5 text-center">Kamnoseštvo Čakš · 031 235 146</div>
      </div>
    </div>
  );
}
