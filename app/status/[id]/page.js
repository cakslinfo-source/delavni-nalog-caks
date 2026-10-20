"use client";

import { useState, useEffect } from "react";

const STATUS_BARVE_POLICE = {
  Sprejeto: "bg-stone-200 text-stone-700",
  "V izdelavi": "bg-orange-100 text-orange-800",
  Pripravljeno: "bg-sky-100 text-sky-800",
  Prevzeto: "bg-blue-200 text-blue-900",
};

const STATUS_NAZIV_PULTI = {
  sprejeto: "Sprejeto",
  izdelavi: "V izdelavi",
  pripravljeno: "Pripravljeno",
  prevzeto: "Prevzeto",
  // stari statusi (pred poenotenjem)
  ponudba: "Sprejeto",
  izmera: "Sprejeto",
  cad: "Sprejeto",
  razrez: "V izdelavi",
  izrezi: "V izdelavi",
  brusenje: "V izdelavi",
  montaza: "Pripravljeno",
  zakljuceno: "Prevzeto",
};

const STATUS_NAZIV_SPOMENIKI = {
  sprejeto: "Sprejeto",
  izdelavi: "V izdelavi",
  pripravljeno: "Pripravljeno",
  prevzeto: "Prevzeto",
};

export default function StatusNarocila({ params }) {
  const { id } = params;
  const [rezultat, setRezultat] = useState(null);
  const [nalaganje, setNalaganje] = useState(true);

  useEffect(() => {
    async function poisci() {
      try {
        const odgovor = await fetch(`/api/status/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (odgovor.ok) {
          const d = await odgovor.json();
          if (d.vrsta === "Police") {
            setRezultat({
              vrsta: "Police",
              stevilka: d.stevilka,
              status: d.status,
              naziv: d.status,
              barva: STATUS_BARVE_POLICE[d.status] || "bg-stone-200 text-stone-700",
              rok: d.rok,
            });
          } else {
            setRezultat({
              vrsta: d.vrsta,
              stevilka: d.stevilka,
              status: d.status,
              naziv: (d.vrsta === "Pulti" ? STATUS_NAZIV_PULTI : STATUS_NAZIV_SPOMENIKI)[d.status] || d.status,
              barva: "bg-sky-100 text-sky-800",
              rok: d.rok,
            });
          }
          setNalaganje(false);
          return;
        }

        setRezultat(null);
      } catch (e) {
        setRezultat(null);
      } finally {
        setNalaganje(false);
      }
    }
    poisci();
  }, [id]);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 max-w-sm w-full text-center">
        <div className="font-bold text-lg mb-1">
          ČAKŠ <span className="text-red-600">· Status naročila</span>
        </div>
        <div className="text-xs text-stone-400 mb-5">Kamnoseštvo Čakš</div>

        {nalaganje && <p className="text-stone-500">Nalagam …</p>}

        {!nalaganje && !rezultat && (
          <p className="text-stone-500">Naročila ni bilo mogoče najti. Preveri povezavo ali pokliči na 031 235 146.</p>
        )}

        {!nalaganje && rezultat && (
          <div className="space-y-3">
            <div className="text-xs text-stone-400 uppercase">{rezultat.vrsta} · {rezultat.stevilka}</div>
            <div className={`inline-block px-4 py-2 rounded-full font-semibold ${rezultat.barva}`}>
              {rezultat.naziv}
            </div>
            {rezultat.rok && (
              <div className="text-sm text-stone-500 pt-2">
                Predviden rok: <span className="font-medium text-stone-700">{new Date(rezultat.rok).toLocaleDateString("sl-SI")}</span>
              </div>
            )}
            <div className="text-xs text-stone-400 pt-4 border-t border-stone-100">
              Za vprašanja: 031 235 146
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
