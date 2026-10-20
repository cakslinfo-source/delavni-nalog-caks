"use client";

import { useEffect, useState } from "react";

const SKRIJ = {
  police: ["/"],
  pulti: ["/pulti"],
  spomeniki: ["/spomeniki"],
  material: ["/material"],
  skener: ["/scanner"],
  inventura: ["/inventura"],
  skladisce: ["/skladisce"],
  sestanki: ["/sestanki"],
  pregled: ["/pregled"],
};

// Majhen trak spodaj levo: kdo je prijavljen, odjava, (admin) upravljanje oseb.
// Poskrbi tudi, da se uporabniku ne prikažejo menijske povezave do delov, ki jih ne sme videti,
// in da admin funkcije (cene, plačila, brisanje) dobijo samo tisti z dovoljenjem.
export default function SejaTrak() {
  const [jaz, setJaz] = useState(null);

  useEffect(() => {
    const pot = window.location.pathname;
    if (pot === "/prijava" || pot.startsWith("/status/")) return;
    let preklican = false;
    fetch("/api/jaz", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (preklican || !j) return;
        setJaz(j);
        try {
          if (j.adminFunkcije) {
            // ob novi prijavi se admin funkcije odklenejo (kasneje jih gumb 🔒 lahko zaklene)
            if (localStorage.getItem("seja-iat") !== String(j.seja)) {
              localStorage.setItem("admin-odklenjen", "da");
              localStorage.setItem("seja-iat", String(j.seja));
            }
          } else {
            localStorage.setItem("seja-iat", String(j.seja));
            localStorage.removeItem("admin-odklenjen");
            // koda admina ne sme odkleniti tega uporabnika
            const staro = Storage.prototype.setItem;
            Storage.prototype.setItem = function (k, v) {
              if (k === "admin-odklenjen" && v === "da") {
                window.setTimeout(() => window.location.reload(), 50);
                return;
              }
              return staro.call(this, k, v);
            };
          }
        } catch (e) {}
        const skriti = [];
        Object.keys(SKRIJ).forEach((m) => {
          if (!j.moduli.includes(m)) SKRIJ[m].forEach((h) => skriti.push(`a[href="${h}"]`));
        });
        if (skriti.length) {
          const st = document.createElement("style");
          st.textContent = skriti.join(",") + "{display:none !important}";
          document.head.appendChild(st);
        }
      })
      .catch(() => {});
    return () => {
      preklican = true;
    };
  }, []);

  async function odjava() {
    try {
      await fetch("/api/prijava", { method: "DELETE" });
    } catch (e) {}
    try {
      localStorage.removeItem("admin-odklenjen");
      localStorage.removeItem("seja-iat");
    } catch (e) {}
    window.location.href = "/prijava";
  }

  if (!jaz) return null;
  return (
    <div className="print:hidden fixed bottom-1 left-1 z-[60] flex items-center gap-2 rounded-full bg-black/75 text-white text-[11px] px-3 py-1 shadow">
      <span>👤 {jaz.prikaz}</span>
      {jaz.admin && (
        <a href="/uporabniki" className="underline text-amber-300">
          Osebe{jaz.zacetnoGeslo ? " ⚠" : ""}
        </a>
      )}
      <button onClick={odjava} className="underline">
        Odjava
      </button>
    </div>
  );
}
