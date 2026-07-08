"use client";

import { useState, useEffect } from "react";

const ADMIN_PIN = "1991";

const TIPI_IZMERE = ["Spomenik", "Stopnice", "Napis", "Police", "Kuhinja", "Pokrivalne plošče", "Ostalo"];

function prazenSestanek() {
  return {
    id: Date.now(),
    stranka: { ime: "", telefon: "", email: "", lokacija: "" },
    tipIzmere: "",
    opisOstalo: "",
    datum: new Date().toISOString().slice(0, 10),
    ura: "09:00",
    opombe: "",
    opravljeno: false,
  };
}

function nazivIzmere(s) {
  return s.tipIzmere === "Ostalo" ? (s.opisOstalo || "Ostalo") : s.tipIzmere || "—";
}

function dveStevilki(n) {
  return String(n).padStart(2, "0");
}

function icsCas(d) {
  return (
    d.getUTCFullYear() +
    dveStevilki(d.getUTCMonth() + 1) +
    dveStevilki(d.getUTCDate()) +
    "T" +
    dveStevilki(d.getUTCHours()) +
    dveStevilki(d.getUTCMinutes()) +
    "00Z"
  );
}

function prenesiICS(sestanek) {
  const zacetek = new Date(`${sestanek.datum}T${sestanek.ura || "09:00"}:00`);
  const konec = new Date(zacetek.getTime() + 60 * 60 * 1000);
  const zdaj = new Date();
  const vsebina = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kamnosestvo Caks//Sestanki//SL",
    "BEGIN:VEVENT",
    `UID:${sestanek.id}@caks-sestanki`,
    `DTSTAMP:${icsCas(zdaj)}`,
    `DTSTART:${icsCas(zacetek)}`,
    `DTEND:${icsCas(konec)}`,
    `SUMMARY:${nazivIzmere(sestanek)} — ${sestanek.stranka.ime}`,
    `LOCATION:${(sestanek.stranka.lokacija || "").replace(/\n/g, " ")}`,
    `DESCRIPTION:${(
      `Stranka: ${sestanek.stranka.ime}\\nTelefon: ${sestanek.stranka.telefon || "—"}\\n` +
      (sestanek.opombe ? `Opombe: ${sestanek.opombe}` : "")
    ).replace(/\n/g, "\\n")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Opomnik na sestanek",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([vsebina], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sestanek-${sestanek.stranka.ime || "izmera"}-${sestanek.datum}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Sestanki() {
  const [sestanki, setSestanki] = useState([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [pogled, setPogled] = useState("seznam");
  const [obrazec, setObrazec] = useState(null);
  const [izbran, setIzbran] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [izbranDan, setIzbranDan] = useState(null);
  const [prikazMeseca, setPrikazMeseca] = useState(() => {
    const d = new Date();
    return { leto: d.getFullYear(), mesec: d.getMonth() };
  });

  useEffect(() => {
    fetch("/api/sestanki")
      .then((r) => r.json())
      .then((p) => setSestanki(Array.isArray(p) ? p : []))
      .catch(() => setNapaka("Napaka pri nalaganju podatkov."))
      .finally(() => setNalaganje(false));
  }, []);

  async function shrani(novi) {
    setSestanki(novi);
    try {
      const r = await fetch("/api/sestanki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novi),
      });
      if (!r.ok) throw new Error();
    } catch {
      setNapaka("Napaka pri shranjevanju! Preveri povezavo.");
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

  const razvrsceni = [...sestanki].sort((a, b) =>
    `${a.datum}T${a.ura}`.localeCompare(`${b.datum}T${b.ura}`)
  );
  const danes = new Date().toISOString().slice(0, 10);
  const prihajajoci = razvrsceni.filter((s) => s.datum >= danes && !s.opravljeno);
  const pretekli = razvrsceni.filter((s) => s.datum < danes || s.opravljeno);

  if (nalaganje)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
        Nalagam ...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <div className="font-bold text-lg leading-tight">
            ČAKŠ <span className="text-red-500">· Sestanki/Izmere</span>
          </div>
          <div className="text-xs text-gray-400">Terminski koledar in izmere na terenu</div>
        </div>
        <div className="flex gap-2">
          <a href="/" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            Police
          </a>
          <a href="/pulti" className="text-xs bg-gray-800 px-3 py-2 rounded-lg">
            Pulti
          </a>
        </div>
      </div>

      {napaka && (
        <div className="bg-red-600 text-white text-sm px-4 py-2 cursor-pointer" onClick={() => setNapaka("")}>
          {napaka} (tapni za zapiranje)
        </div>
      )}

      <div className="flex gap-2 px-3 pt-3">
        <button
          onClick={() => setPogled("seznam")}
          className={`flex-1 text-sm py-2 rounded-lg font-medium ${
            pogled === "seznam" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-300"
          }`}
        >
          Seznam
        </button>
        <button
          onClick={() => setPogled("koledar")}
          className={`flex-1 text-sm py-2 rounded-lg font-medium ${
            pogled === "koledar" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-300"
          }`}
        >
          Koledar
        </button>
      </div>

      {pogled === "seznam" && (
        <div className="p-3 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Prihajajoči ({prihajajoci.length})</div>
            {prihajajoci.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-200">
                Ni prihajajočih sestankov.
              </div>
            ) : (
              <div className="space-y-2">
                {prihajajoci.map((s) => (
                  <SestanekKartica key={s.id} s={s} onClick={() => { setIzbran(s.id); setPogled("podrobnosti"); }} />
                ))}
              </div>
            )}
          </div>
          {pretekli.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Pretekli / opravljeni</div>
              <div className="space-y-2 opacity-60">
                {pretekli.slice(0, 10).map((s) => (
                  <SestanekKartica key={s.id} s={s} onClick={() => { setIzbran(s.id); setPogled("podrobnosti"); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pogled === "koledar" && (
        <KoledarPogled
          sestanki={sestanki}
          prikazMeseca={prikazMeseca}
          setPrikazMeseca={setPrikazMeseca}
          izbranDan={izbranDan}
          setIzbranDan={setIzbranDan}
          odpri={(s) => { setIzbran(s.id); setPogled("podrobnosti"); }}
        />
      )}

      {pogled === "obrazec" && (
        <Obrazec
          zacetni={obrazec}
          preklici={() => setPogled(obrazec && obrazec._urejanje ? "podrobnosti" : "seznam")}
          shrani={(s) => {
            let novi;
            if (s._urejanje) {
              delete s._urejanje;
              novi = sestanki.map((x) => (x.id === s.id ? s : x));
            } else {
              novi = [s, ...sestanki];
            }
            shrani(novi);
            setIzbran(s.id);
            setPogled("podrobnosti");
          }}
        />
      )}

      {pogled === "podrobnosti" && (
        <Podrobnosti
          sestanek={sestanki.find((x) => x.id === izbran)}
          nazaj={() => setPogled("seznam")}
          uredi={(s) => { setObrazec({ ...s, _urejanje: true }); setPogled("obrazec"); }}
          preklopiOpravljeno={(s) => {
            shrani(sestanki.map((x) => (x.id === s.id ? { ...x, opravljeno: !x.opravljeno } : x)));
          }}
          izbrisi={(s) => {
            if (!vprasajPin()) return;
            if (!confirm(`Res izbrišem sestanek s stranko ${s.stranka.ime}?`)) return;
            shrani(sestanki.filter((x) => x.id !== s.id));
            setPogled("seznam");
          }}
        />
      )}

      {pogled === "seznam" && (
        <button
          onClick={() => { setObrazec(prazenSestanek()); setPogled("obrazec"); }}
          className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 text-3xl shadow-lg flex items-center justify-center"
        >
          +
        </button>
      )}
    </div>
  );
}

function SestanekKartica({ s, onClick }) {
  const jePretekel = s.datum < new Date().toISOString().slice(0, 10);
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer border-l-4 ${
        s.opravljeno ? "border-emerald-500" : jePretekel ? "border-red-400" : "border-blue-500"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold">{s.stranka.ime}</div>
          <div className="text-sm text-gray-600">{nazivIzmere(s)}</div>
          {s.stranka.lokacija && <div className="text-xs text-gray-400">{s.stranka.lokacija}</div>}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{new Date(s.datum).toLocaleDateString("sl-SI")}</div>
          <div className="text-xs text-gray-500">{s.ura}</div>
        </div>
      </div>
      {s.opravljeno && <div className="text-xs text-emerald-600 font-medium mt-1">✓ Opravljeno</div>}
    </div>
  );
}

function KoledarPogled({ sestanki, prikazMeseca, setPrikazMeseca, izbranDan, setIzbranDan, odpri }) {
  const { leto, mesec } = prikazMeseca;
  const prviDan = new Date(leto, mesec, 1);
  const steviloDni = new Date(leto, mesec + 1, 0).getDate();
  const zacetniOdmik = (prviDan.getDay() + 6) % 7;

  const poDnevih = {};
  sestanki.forEach((s) => {
    poDnevih[s.datum] = (poDnevih[s.datum] || 0) + 1;
  });

  const celice = [];
  for (let i = 0; i < zacetniOdmik; i++) celice.push(null);
  for (let dan = 1; dan <= steviloDni; dan++) celice.push(dan);

  const imenaMesecev = ["Januar", "Februar", "Marec", "April", "Maj", "Junij", "Julij", "Avgust", "September", "Oktober", "November", "December"];

  function datumNiza(dan) {
    return `${leto}-${dveStevilki(mesec + 1)}-${dveStevilki(dan)}`;
  }

  const sestankiIzbranegaDne = izbranDan ? sestanki.filter((s) => s.datum === izbranDan) : [];

  return (
    <div className="p-3 space-y-3">
      <div className="bg-white rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPrikazMeseca((p) => (p.mesec === 0 ? { leto: p.leto - 1, mesec: 11 } : { ...p, mesec: p.mesec - 1 }))}
            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600"
          >
            ←
          </button>
          <div className="font-semibold">{imenaMesecev[mesec]} {leto}</div>
          <button
            onClick={() => setPrikazMeseca((p) => (p.mesec === 11 ? { leto: p.leto + 1, mesec: 0 } : { ...p, mesec: p.mesec + 1 }))}
            className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
          {["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celice.map((dan, i) => {
            if (dan === null) return <div key={i} />;
            const dStr = datumNiza(dan);
            const steviloSestankov = poDnevih[dStr] || 0;
            const jeIzbran = izbranDan === dStr;
            const jeDanes = dStr === new Date().toISOString().slice(0, 10);
            return (
              <button
                key={i}
                onClick={() => setIzbranDan(jeIzbran ? null : dStr)}
                className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative ${
                  jeIzbran ? "bg-red-600 text-white" : jeDanes ? "bg-gray-200 font-bold" : "hover:bg-gray-100"
                }`}
              >
                {dan}
                {steviloSestankov > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${jeIzbran ? "bg-white" : "bg-red-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {izbranDan && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            {new Date(izbranDan).toLocaleDateString("sl-SI", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {sestankiIzbranegaDne.length === 0 ? (
            <div className="text-center text-gray-400 py-6 bg-white rounded-xl border border-gray-200 text-sm">
              Ni sestankov ta dan.
            </div>
          ) : (
            <div className="space-y-2">
              {sestankiIzbranegaDne
                .sort((a, b) => a.ura.localeCompare(b.ura))
                .map((s) => (
                  <SestanekKartica key={s.id} s={s} onClick={() => odpri(s)} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Obrazec({ zacetni, shrani, preklici }) {
  const [s, setS] = useState(zacetni);
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white";
  const lbl = "text-xs text-gray-500 mb-1 block";

  return (
    <div className="p-3 space-y-4">
      <h2 className="font-bold text-lg">{s._urejanje ? "Urejanje sestanka" : "Nov sestanek / izmera"}</h2>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Stranka</div>
        <div>
          <label className={lbl}>Ime stranke *</label>
          <input
            className={inp}
            value={s.stranka.ime}
            onChange={(e) => setS({ ...s, stranka: { ...s.stranka, ime: e.target.value } })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Telefon</label>
            <input
              className={inp}
              value={s.stranka.telefon}
              onChange={(e) => setS({ ...s, stranka: { ...s.stranka, telefon: e.target.value } })}
            />
          </div>
          <div>
            <label className={lbl}>E-mail</label>
            <input
              type="email"
              className={inp}
              value={s.stranka.email}
              onChange={(e) => setS({ ...s, stranka: { ...s.stranka, email: e.target.value } })}
            />
          </div>
        </div>
        <div>
          <label className={lbl}>Lokacija (naslov izmere)</label>
          <input
            className={inp}
            value={s.stranka.lokacija}
            onChange={(e) => setS({ ...s, stranka: { ...s.stranka, lokacija: e.target.value } })}
            placeholder="npr. Slovenske Konjice, Mestni trg 5"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Opis izmere</div>
        <div className="flex flex-wrap gap-2">
          {TIPI_IZMERE.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setS({ ...s, tipIzmere: t })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s.tipIzmere === t
                  ? "bg-red-600 text-white border-red-600 font-medium"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {s.tipIzmere === "Ostalo" && (
          <input
            className={inp}
            value={s.opisOstalo}
            onChange={(e) => setS({ ...s, opisOstalo: e.target.value })}
            placeholder="Opiši, za kaj gre"
          />
        )}
      </div>

      <div className="bg-white rounded-xl p-3 space-y-2">
        <div className="font-semibold text-sm">Termin</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Datum</label>
            <input
              type="date"
              className={inp}
              value={s.datum}
              onChange={(e) => setS({ ...s, datum: e.target.value })}
            />
          </div>
          <div>
            <label className={lbl}>Ura</label>
            <input
              type="time"
              className={inp}
              value={s.ura}
              onChange={(e) => setS({ ...s, ura: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={lbl}>Opombe</label>
          <textarea
            className={inp}
            rows={2}
            value={s.opombe}
            onChange={(e) => setS({ ...s, opombe: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={preklici} className="flex-1 bg-gray-200 rounded-xl py-3 font-semibold">
          Prekliči
        </button>
        <button
          onClick={() => {
            if (!s.stranka.ime.trim()) {
              alert("Vnesi ime stranke.");
              return;
            }
            if (!s.datum) {
              alert("Izberi datum.");
              return;
            }
            shrani(s);
          }}
          className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold"
        >
          Shrani
        </button>
      </div>
    </div>
  );
}

function Podrobnosti({ sestanek, nazaj, uredi, preklopiOpravljeno, izbrisi }) {
  if (!sestanek)
    return (
      <div className="p-4">
        Sestanek ne obstaja.{" "}
        <button onClick={nazaj} className="text-red-600 underline">Nazaj</button>
      </div>
    );

  return (
    <div className="p-3 space-y-3">
      <button onClick={nazaj} className="text-sm text-gray-500">← Nazaj na seznam</button>

      <div className="bg-white rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-lg">{sestanek.stranka.ime}</div>
            <div className="text-sm text-gray-600">{nazivIzmere(sestanek)}</div>
          </div>
          {sestanek.opravljeno && (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">
              Opravljeno
            </span>
          )}
        </div>
        <div className="text-sm space-y-1 mt-2">
          <div>
            <span className="text-gray-400">Termin: </span>
            <span className="font-semibold">{new Date(sestanek.datum).toLocaleDateString("sl-SI")} ob {sestanek.ura}</span>
          </div>
          {sestanek.stranka.telefon && (
            <div><span className="text-gray-400">Telefon: </span>{sestanek.stranka.telefon}</div>
          )}
          {sestanek.stranka.email && (
            <div><span className="text-gray-400">E-mail: </span>{sestanek.stranka.email}</div>
          )}
          {sestanek.stranka.lokacija && (
            <div><span className="text-gray-400">Lokacija: </span>{sestanek.stranka.lokacija}</div>
          )}
        </div>
        {sestanek.opombe && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
            {sestanek.opombe}
          </div>
        )}
      </div>

      <button
        onClick={() => prenesiICS(sestanek)}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold"
      >
        📅 Dodaj v telefonski koledar (.ics)
      </button>
      <p className="text-xs text-gray-500 -mt-2 px-1">
        Prenese datoteko, ki jo odpreš na telefonu — samodejno se doda v tvoj Google/Apple koledar z opomnikom 30 min prej.
      </p>

      <button
        onClick={() => preklopiOpravljeno(sestanek)}
        className={`w-full rounded-xl py-3 font-semibold ${
          sestanek.opravljeno ? "bg-gray-200 text-gray-700" : "bg-emerald-600 text-white"
        }`}
      >
        {sestanek.opravljeno ? "Označi kot neopravljeno" : "✓ Označi kot opravljeno"}
      </button>

      <div className="flex gap-2">
        <button onClick={() => uredi(sestanek)} className="flex-1 bg-gray-800 text-white rounded-xl py-3 font-semibold">
          Uredi
        </button>
        <button onClick={() => izbrisi(sestanek)} className="flex-1 bg-red-100 text-red-600 rounded-xl py-3 font-semibold">
          Izbriši
        </button>
      </div>
    </div>
  );
}
