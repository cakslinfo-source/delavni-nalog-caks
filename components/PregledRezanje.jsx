"use client";

import { useState, useMemo } from "react";
import { prenesiPDF } from "../lib/pdf-ponudba";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MESECI = ["januar", "februar", "marec", "april", "maj", "junij", "julij", "avgust", "september", "oktober", "november", "december"];
const MODULI = ["Police", "Pulti", "Spomenik"];

const st = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const f2 = (x) => (Number(x) || 0).toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Kpi({ naziv, vrednost, enota, opomba }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3">
      <div className="text-xs text-stone-500">{naziv}</div>
      <div className="text-3xl font-bold tabular-nums mt-0.5 text-stone-900">
        {vrednost} <span className="text-base font-medium text-stone-500">{enota}</span>
      </div>
      {opomba && <div className="text-xs text-stone-400 mt-0.5">{opomba}</div>}
    </div>
  );
}

// Seštevek vseh kosov: m², tekoči metri (dolžine) in dolžina rezov (obseg) po materialu in po mesecu.
export default function PregledRezanje({ postavke }) {
  const [moduli, setModuli] = useState(["Police", "Pulti", "Spomenik"]);
  const [samoIzdelano, setSamoIzdelano] = useState(true);

  const zastarel = postavke.length > 0 && postavke.every((x) => !("kosi" in x));
  const r = useMemo(() => {
    const narocila = postavke.filter((x) => !x.ponudba);
    const izbrana = narocila.filter((x) => moduli.includes(x.modul) && (!samoIzdelano || x.stolpec !== "sprejeto"));
    const poMaterialu = {};
    const poMesecu = {};
    const skupaj = { kosov: 0, m2: 0, m: 0, rez: 0, naloga: 0 };
    izbrana.forEach((n) => {
      const kosi = Array.isArray(n.kosi) ? n.kosi : [];
      if (!kosi.length) return;
      skupaj.naloga += 1;
      const d = n.datum ? new Date(n.datum) : null;
      const mesecKljuc = d && !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "brez";
      kosi.forEach((k) => {
        const dolzina = st(k.dolzina);
        const sirina = st(k.sirina);
        const kol = st(k.kolicina) || 1;
        if (!dolzina || !sirina) return;
        const m2 = (dolzina * sirina) / 10000 * kol;
        const m = (dolzina / 100) * kol;
        const rez = (2 * (dolzina + sirina) / 100) * kol;
        const imeMat = (k.material || n.material || "").split(",")[0].trim() || "Brez materiala";
        const kljucMat = imeMat.toLowerCase();
        const a = (poMaterialu[kljucMat] = poMaterialu[kljucMat] || { naziv: imeMat, kosov: 0, m2: 0, m: 0, rez: 0 });
        const b = (poMesecu[mesecKljuc] = poMesecu[mesecKljuc] || { kljuc: mesecKljuc, kosov: 0, m2: 0, m: 0, rez: 0 });
        [a, b, skupaj].forEach((o) => { o.kosov += kol; o.m2 += m2; o.m += m; o.rez += rez; });
      });
    });
    const materiali = Object.values(poMaterialu).sort((x, y) => y.m2 - x.m2);
    const meseci = Object.values(poMesecu)
      .sort((x, y) => (x.kljuc < y.kljuc ? -1 : 1))
      .map((o) => {
        if (o.kljuc === "brez") return { ...o, naziv: "Brez datuma" };
        const [l, m] = o.kljuc.split("-");
        return { ...o, naziv: `${MESECI[parseInt(m, 10) - 1]} ${l}`, kratko: `${MESECI[parseInt(m, 10) - 1].slice(0, 3)} ${l.slice(2)}` };
      });
    return { materiali, meseci, skupaj };
  }, [postavke, moduli, samoIzdelano]);

  const [delam, setDelam] = useState(false);
  async function prenesi() {
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const th = "text-align:right;padding:5px 8px 7px;border-bottom:2px solid #44403c;font-size:11px;color:#57534e;";
    const td = "text-align:right;padding:5px 8px;border-bottom:1px solid #e7e5e4;";
    const tabela = (prvi, vrstice) =>
      `<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr>` +
      `<th style="${th}text-align:left;">${prvi}</th><th style="${th}">Kosov</th><th style="${th}">m²</th><th style="${th}">Tekoči m</th><th style="${th}">Dolžina rezov m</th></tr></thead><tbody>` +
      vrstice
        .map((x) => `<tr><td style="${td}text-align:left;${x.krepko ? "font-weight:700;" : ""}">${esc(x.naziv)}</td><td style="${td}${x.krepko ? "font-weight:700;" : ""}">${x.kosov}</td><td style="${td}font-weight:700;">${f2(x.m2)}</td><td style="${td}${x.krepko ? "font-weight:700;" : ""}">${f2(x.m)}</td><td style="${td}${x.krepko ? "font-weight:700;" : ""}">${f2(x.rez)}</td></tr>`)
        .join("") +
      `</tbody></table>`;
    const skupajVrstica = { naziv: "SKUPAJ", ...r.skupaj, krepko: true };
    const danes = new Date();
    const html =
      `<div style="width:794px;box-sizing:border-box;padding:36px 40px;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">` +
      `<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #dc2626;padding-bottom:8px;">` +
      `<div><div style="font-size:20px;font-weight:700;line-height:1.3;">Rezanje skupaj</div><div style="font-size:12px;color:#57534e;margin-top:3px;">Kamnoseštvo Čakš · vsi meseci skupaj</div></div>` +
      `<div style="font-size:11px;color:#57534e;text-align:right;">Izpis: ${danes.toLocaleDateString("sl-SI")} ${danes.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" })}</div></div>` +
      `<p style="font-size:11px;color:#57534e;margin:8px 0 14px;">Moduli: ${esc(moduli.join(", ") || "—")} · ${samoIzdelano ? "samo že razrezano (brez »Sprejeto«)" : "vsa naročila"} · brez ponudb</p>` +
      `<table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 -8px 16px;"><tr>` +
      [["Površina", f2(r.skupaj.m2) + " m²"], ["Tekoči metri", f2(r.skupaj.m) + " m"], ["Dolžina rezov", f2(r.skupaj.rez) + " m"], ["Kosov / naročil", r.skupaj.kosov + " / " + r.skupaj.naloga]]
        .map(([n, v]) => `<td style="border:1px solid #d6d3d1;border-radius:8px;padding:8px 10px;"><div style="font-size:10px;color:#78716c;">${n}</div><div style="font-size:17px;font-weight:700;">${v}</div></td>`)
        .join("") +
      `</tr></table>` +
      `<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Po materialu</div>` +
      tabela("Material", [...r.materiali, skupajVrstica]) +
      `<div style="font-size:14px;font-weight:700;margin:18px 0 4px;">Po mesecih</div>` +
      tabela("Mesec", [...r.meseci.map((m) => ({ ...m, naziv: m.naziv.charAt(0).toUpperCase() + m.naziv.slice(1) })), skupajVrstica]) +
      `<p style="font-size:10px;color:#78716c;margin-top:14px;">m² = dolžina × širina × količina (pri poševnih policah večja širina). Tekoči m = vsota dolžin kosov. Dolžina rezov = obseg kosov, 2 × (dolžina + širina). Mesec je po datumu naročila.</p>` +
      `</div>`;
    setDelam(true);
    await prenesiPDF(html, `rezanje-skupaj-${danes.toISOString().slice(0, 10)}.pdf`);
    setDelam(false);
  }

  function preklopi(m) {
    setModuli((t) => (t.includes(m) ? t.filter((x) => x !== m) : [...t, m]));
  }

  const celica = "px-3 py-2 text-right tabular-nums";
  return (
    <div className="space-y-4 mt-1 flex-1">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs text-stone-500">Moduli:</span>
        {MODULI.map((m) => (
          <button
            key={m}
            onClick={() => preklopi(m)}
            className={`text-xs px-3 py-1.5 rounded-full border ${moduli.includes(m) ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-300"}`}
          >
            {m}
          </button>
        ))}
        <span className="mx-1 text-stone-300">|</span>
        <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
          <input type="checkbox" checked={samoIzdelano} onChange={(e) => setSamoIzdelano(e.target.checked)} />
          Samo že razrezano: naročila v izdelavi ali dlje (brez »Sprejeto«)
        </label>
        <button
          onClick={prenesi}
          disabled={delam}
          className="ml-auto text-sm bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg"
        >
          {delam ? "Pripravljam PDF…" : "⬇ Prenesi PDF"}
        </button>
      </div>

      {zastarel && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 text-sm">
          Podatki o merah kosov se ne naložijo, ker na GitHubu še ni nove datoteke <b>components/Pregled.jsx</b>. Naloži jo (iz mape Rezanje-skupaj) in počakaj 1–2 minuti.
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi naziv="Skupaj površina" vrednost={f2(r.skupaj.m2)} enota="m²" opomba={`${r.skupaj.kosov} kosov · ${r.skupaj.naloga} naročil`} />
        <Kpi naziv="Skupaj tekoči metri" vrednost={f2(r.skupaj.m)} enota="m" opomba="vsota dolžin vseh kosov" />
        <Kpi naziv="Dolžina rezov (obseg)" vrednost={f2(r.skupaj.rez)} enota="m" opomba="obseg vseh kosov, 2 × (dolžina + širina)" />
        <Kpi naziv="Različnih materialov" vrednost={r.materiali.length} enota="" opomba="v vseh mesecih skupaj" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="text-sm font-semibold text-stone-800 mb-0.5">Po materialu — vsi meseci skupaj</div>
        <div className="text-xs text-stone-400 mb-2">Razvrščeno po površini.</div>
        {r.materiali.length === 0 ? (
          <div className="text-sm text-stone-400 py-6 text-center">Ni podatkov o merah kosov.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-stone-500 border-b border-stone-200">
                  <th className="px-3 py-2 text-left font-medium">Material</th>
                  <th className="px-3 py-2 text-right font-medium">Kosov</th>
                  <th className="px-3 py-2 text-right font-medium">m²</th>
                  <th className="px-3 py-2 text-right font-medium">Tekoči m</th>
                  <th className="px-3 py-2 text-right font-medium">Dolžina rezov m</th>
                </tr>
              </thead>
              <tbody>
                {r.materiali.map((m) => (
                  <tr key={m.naziv} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-medium text-stone-800">{m.naziv}</td>
                    <td className={celica}>{m.kosov}</td>
                    <td className={`${celica} font-semibold`}>{f2(m.m2)}</td>
                    <td className={celica}>{f2(m.m)}</td>
                    <td className={celica}>{f2(m.rez)}</td>
                  </tr>
                ))}
                <tr className="bg-stone-50 font-bold">
                  <td className="px-3 py-2">SKUPAJ</td>
                  <td className={celica}>{r.skupaj.kosov}</td>
                  <td className={celica}>{f2(r.skupaj.m2)}</td>
                  <td className={celica}>{f2(r.skupaj.m)}</td>
                  <td className={celica}>{f2(r.skupaj.rez)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="text-sm font-semibold text-stone-800 mb-0.5">Po mesecih</div>
        <div className="text-xs text-stone-400 mb-2">Po datumu naročila. m² na mesec:</div>
        {r.meseci.length === 0 ? (
          <div className="text-sm text-stone-400 py-6 text-center">Ni podatkov.</div>
        ) : (
          <>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.meseci.map((m) => ({ ...m, m2: Math.round(m.m2 * 100) / 100 }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="kratko" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${f2(v)} m²`, "Površina"]} labelFormatter={(l, p) => (p && p[0] ? p[0].payload.naziv : l)} />
                  <Bar dataKey="m2" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-stone-500 border-b border-stone-200">
                    <th className="px-3 py-2 text-left font-medium">Mesec</th>
                    <th className="px-3 py-2 text-right font-medium">Kosov</th>
                    <th className="px-3 py-2 text-right font-medium">m²</th>
                    <th className="px-3 py-2 text-right font-medium">Tekoči m</th>
                    <th className="px-3 py-2 text-right font-medium">Dolžina rezov m</th>
                  </tr>
                </thead>
                <tbody>
                  {r.meseci.map((m) => (
                    <tr key={m.kljuc} className="border-b border-stone-100">
                      <td className="px-3 py-2 capitalize">{m.naziv}</td>
                      <td className={celica}>{m.kosov}</td>
                      <td className={`${celica} font-semibold`}>{f2(m.m2)}</td>
                      <td className={celica}>{f2(m.m)}</td>
                      <td className={celica}>{f2(m.rez)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-stone-400 pb-4">
        Seštete so mere vseh kosov po vseh naročilih (brez ponudb): Police (dolžina × širina × količina), Pulti (kosi) in Spomeniki (komponente). Pri poševnih policah je upoštevana večja širina. Mere so v cm, rezultat v m² in m.
      </p>
    </div>
  );
}
