"use client";

import { useEffect, useState } from "react";

// Način za predstavitev: admin z enim gumbom vse številke na zaslonu spremeni v *.
// Podatki se NE spremenijo — zamenja se samo prikaz na tem zaslonu.
const KLJUC = "skrij-stevilke";
const IMA_STEVKO = /[0-9]/;

export default function SkrijStevilke() {
  const [admin, setAdmin] = useState(false);
  const [skrito, setSkrito] = useState(false);
  const [javnaStran, setJavnaStran] = useState(true);

  useEffect(() => {
    const pot = window.location.pathname;
    setJavnaStran(/^\/(prijava|status|ponudba)(\/|$)/.test(pot));
    const preberi = () => {
      try {
        setAdmin(localStorage.getItem("admin-odklenjen") === "da");
        setSkrito(localStorage.getItem(KLJUC) === "da");
      } catch (e) {}
    };
    preberi();
    const t = setInterval(preberi, 1500);
    window.addEventListener("focus", preberi);
    return () => { clearInterval(t); window.removeEventListener("focus", preberi); };
  }, []);

  useEffect(() => {
    if (!skrito || javnaStran) return;
    const izvirniki = new Map(); // besedilno vozlišče -> { izvirnik, maska }
    const polja = new Set();

    const jeIzvzeto = (vozlisce) => {
      const el = vozlisce.parentElement;
      return !el || el.closest("[data-brez-maske],script,style,noscript");
    };
    const zakrij = (vozlisce) => {
      const besedilo = vozlisce.nodeValue;
      const zapis = izvirniki.get(vozlisce);
      if (zapis && zapis.maska === besedilo) return;
      if (!besedilo || !IMA_STEVKO.test(besedilo) || jeIzvzeto(vozlisce)) {
        if (zapis) izvirniki.delete(vozlisce);
        return;
      }
      const maska = besedilo.replace(/[0-9]/g, "*");
      izvirniki.set(vozlisce, { izvirnik: besedilo, maska });
      vozlisce.nodeValue = maska;
    };
    const obdelaj = (koren) => {
      if (!koren) return;
      if (koren.nodeType === 3) { zakrij(koren); return; }
      if (koren.nodeType !== 1) return;
      const sprehod = document.createTreeWalker(koren, NodeFilter.SHOW_TEXT);
      const seznam = [];
      while (sprehod.nextNode()) seznam.push(sprehod.currentNode);
      seznam.forEach(zakrij);
    };
    const obdelajPolja = () => {
      document.querySelectorAll("input, textarea").forEach((p) => {
        const tip = (p.getAttribute("type") || "text").toLowerCase();
        if (["checkbox", "radio", "file", "button", "submit", "range", "color", "hidden"].includes(tip)) return;
        if (p.closest("[data-brez-maske]")) return;
        const samoStevilke = /^[\s0-9.,:€%+\-/x×]*[0-9][\s0-9.,:€%+\-/x×]*$/.test(p.value || "");
        const casovno = ["date", "time", "datetime-local", "month", "number"].includes(tip);
        if (samoStevilke || (casovno && p.value)) {
          if (!polja.has(p)) {
            polja.add(p);
            p.dataset.prejBarva = p.style.color || "";
            p.dataset.prejVarnost = p.style.webkitTextSecurity || "";
          }
          p.style.webkitTextSecurity = "disc";
          if (casovno) p.style.color = "transparent";
        } else if (polja.has(p)) {
          p.style.webkitTextSecurity = p.dataset.prejVarnost || "";
          p.style.color = p.dataset.prejBarva || "";
          polja.delete(p);
        }
      });
    };

    obdelaj(document.body);
    obdelajPolja();
    const opazovalec = new MutationObserver((spremembe) => {
      spremembe.forEach((s) => {
        if (s.type === "characterData") zakrij(s.target);
        else s.addedNodes.forEach(obdelaj);
      });
    });
    opazovalec.observe(document.body, { childList: true, subtree: true, characterData: true });
    const t = setInterval(obdelajPolja, 500);
    document.addEventListener("input", obdelajPolja, true);

    return () => {
      opazovalec.disconnect();
      clearInterval(t);
      document.removeEventListener("input", obdelajPolja, true);
      izvirniki.forEach((zapis, vozlisce) => {
        if (vozlisce.nodeValue === zapis.maska) vozlisce.nodeValue = zapis.izvirnik;
      });
      polja.forEach((p) => {
        p.style.webkitTextSecurity = p.dataset.prejVarnost || "";
        p.style.color = p.dataset.prejBarva || "";
      });
    };
  }, [skrito, javnaStran]);

  if (javnaStran || (!admin && !skrito)) return null;

  function preklopi() {
    if (skrito && !admin) {
      alert("Številke lahko spet prikaže samo admin. Odkleni admin način v Policah.");
      return;
    }
    const novo = !skrito;
    try { localStorage.setItem(KLJUC, novo ? "da" : "ne"); } catch (e) {}
    setSkrito(novo);
  }

  return (
    <button
      data-brez-maske
      onClick={preklopi}
      title={skrito ? "Številke so skrite — klikni za prikaz" : "Skrij vse številke (za predstavitev programa)"}
      className="print:hidden"
      style={{
        position: "fixed", left: 12, bottom: 12, zIndex: 9999,
        background: skrito ? "#dc2626" : "#1c1917", color: "#fff",
        border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999,
        padding: "8px 14px", fontSize: 12, fontWeight: 600,
        boxShadow: "0 4px 14px rgba(0,0,0,0.3)", cursor: "pointer", opacity: 0.92,
      }}
    >
      {skrito ? "🙈 Številke skrite — pokaži" : "👁 Skrij številke"}
    </button>
  );
}
