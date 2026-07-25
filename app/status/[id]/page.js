"use client";

import { useState, useEffect } from "react";

const STATUS_BARVE_POLICE = {
  Sprejeto: "bg-stone-200 text-stone-700",
  "V izdelavi": "bg-orange-100 text-orange-800",
  Pripravljeno: "bg-sky-100 text-sky-800",
  Prevzeto: "bg-blue-200 text-blue-900",
};

const STATUS_NAZIV_PULTI = {
  ponudba: "Ponudba",
  izmera: "Izmera",
  cad: "Priprava CAD",
  razrez: "Razrez",
  izrezi: "Obdelava izrezov",
  brusenje: "Brušenje",
  montaza: "Montaža",
  zakljuceno: "Zaključeno",
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
        const [nalogiRes, pultiRes, spomenikiRes] = await Promise.all([
          fetch("/api/nalogi", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/pulti", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
          fetch("/api/spomeniki", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
        ]);

        const nalog = Array.isArray(nalogiRes) ? nalogiRes.find((n) => String(n.id) === String(id)) : null;
        if (nalog) {
          setRezultat({
            vrsta: "Police",
            stevilka: nalog.stevilka,
            status: nalog.status,
            naziv: nalog.status,
            barva: STATUS_BARVE_POLICE[nalog.status] || "bg-stone-200 text-stone-700",
            rok: nalog.rok,
          });
          setNalaganje(false);
          return;
        }

        const pult = Array.isArray(pultiRes) ? pultiRes.find((p) => String(p.id) === String(id)) : null;
        if (pult) {
          setRezultat({
            vrsta: "Pulti",
            stevilka: pult.stevilka,
            status: pult.status,
            naziv: STATUS_NAZIV_PULTI[pult.status] || pult.status,
            barva: "bg-sky-100 text-sky-800",
            rok: pult.datumMontaze,
          });
          setNalaganje(false);
          return;
        }

        const spomenik = Array.isArray(spomenikiRes) ? spomenikiRes.find((s) => String(s.id) === String(id)) : null;
        if (spomenik) {
          setRezultat({
            vrsta: "Spomenik",
            stevilka: spomenik.stevilka,
            status: spomenik.status,
            naziv: STATUS_NAZIV_SPOMENIKI[spomenik.status] || spomenik.status,
            barva: "bg-sky-100 text-sky-800",
            rok: spomenik.montaza,
          });
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
