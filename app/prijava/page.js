"use client";

import { useState } from "react";

export default function Prijava() {
  const [ime, setIme] = useState("");
  const [geslo, setGeslo] = useState("");
  const [napaka, setNapaka] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("napaka") === "dostop"
        ? "Nimaš dostopa do nobenega dela programa. Obrni se na admina."
        : "";
    } catch (e) {
      return "";
    }
  });
  const [caka, setCaka] = useState(false);

  async function vstopi() {
    if (!ime || !geslo || caka) return;
    setCaka(true);
    setNapaka("");
    try {
      const r = await fetch("/api/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ime, geslo }),
      });
      if (r.ok) {
        let cilj = "/";
        try {
          const n = new URLSearchParams(window.location.search).get("naprej");
          if (n && n.startsWith("/") && !n.startsWith("//")) cilj = n;
        } catch (e) {}
        window.location.href = cilj;
        return;
      }
      setNapaka("Napačno uporabniško ime ali geslo.");
      setGeslo("");
    } catch (e) {
      setNapaka("Napaka pri povezavi. Poskusi znova.");
    }
    setCaka(false);
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
        <div className="text-4xl text-center mb-2">🔒</div>
        <h1 className="text-lg font-bold text-center text-stone-900">
          ČAKŠ <span className="text-red-600">· Delovni nalogi</span>
        </h1>
        <p className="text-sm text-stone-600 text-center mt-1 mb-4">Vpiši uporabniško ime in geslo.</p>
        <input
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          autoFocus
          value={ime}
          onChange={(e) => { setIme(e.target.value); setNapaka(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") vstopi(); }}
          placeholder="Uporabniško ime"
          className="w-full border border-stone-300 rounded-lg px-4 py-3 text-lg"
        />
        <input
          type="password"
          autoComplete="current-password"
          value={geslo}
          onChange={(e) => { setGeslo(e.target.value); setNapaka(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") vstopi(); }}
          placeholder="Geslo"
          className="w-full border border-stone-300 rounded-lg px-4 py-3 text-lg mt-2"
        />
        {napaka && <p className="text-red-600 text-sm text-center mt-2">{napaka}</p>}
        <button
          onClick={vstopi}
          disabled={caka}
          className="w-full mt-4 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold rounded-lg py-3"
        >
          {caka ? "Preverjam …" : "Vstopi"}
        </button>
        <p className="text-[11px] text-stone-400 text-center mt-3">Prijava velja 7 dni.</p>
      </div>
    </div>
  );
}
