import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KLJUC = "cenik-pulti";

// Privzeti cenik — prenesen iz Excela CENIKI_PULTI.xlsx
const PRIVZETI_CENIK = {
  materiali: [
    { id: "rosaBeta", naziv: "ROSA BETA", enota: "m2", cena2cm: 120, cena3cm: 155 },
    { id: "giandone", naziv: "GIANDONE", enota: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "biancoSardo", naziv: "BIANCO SARDO", enota: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "azulTragal", naziv: "AZUL TRAGAL", enota: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "rosaPorino", naziv: "ROSA PORINO", enota: "m2", cena2cm: 150, cena3cm: 195 },
    { id: "juporamaColumbo", naziv: "JUPORAMA COLUMBO", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "multicolor", naziv: "MULTICOLOR", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "neroInpala", naziv: "NERO INPALA", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "wiscontWhite", naziv: "WISCONT WHITE", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "tonalit", naziv: "TONALIT", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "steelGray", naziv: "STEEL GRAY", enota: "m2", cena2cm: 195, cena3cm: 250 },
    { id: "iworyBrown", naziv: "IWORY BROWN", enota: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "siwakashi", naziv: "SIWAKASHI", enota: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "paradiso", naziv: "PARADISO", enota: "m2", cena2cm: 290, cena3cm: 370 },
    { id: "blackGalaxi", naziv: "BLACK GALAXI", enota: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "jetBlack", naziv: "JET BLACK", enota: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "neroSoluto", naziv: "NERO SOLUTO", enota: "m2", cena2cm: 320, cena3cm: 410 },
    { id: "keramika", naziv: "KERAMIKA", enota: "plosca", cenaPlosca: 900 },
  ],
  storitve: [
    { id: "luknja1020", naziv: "Luknja FI 10-20 mm", cena: 12, enota: "KOM", skupina: "Luknje" },
    { id: "luknja2535", naziv: "Luknja FI 25-35 mm", cena: 15, enota: "KOM", skupina: "Luknje" },
    { id: "luknja4060", naziv: "Luknja FI 40-60 mm", cena: 20, enota: "KOM", skupina: "Luknje" },
    { id: "luknja6085", naziv: "Luknja FI 60-85 mm", cena: 25, enota: "KOM", skupina: "Luknje" },
    { id: "luknja100150", naziv: "Luknja FI 100-150 mm", cena: 30, enota: "KOM", skupina: "Luknje" },
    { id: "izrezNasadnoKorito", naziv: "Izrez za nasadno korito", cena: 65, enota: "KOM", skupina: "Izrezi" },
    { id: "izrezVticnicaNasadno", naziv: "Izrez za vtičnico nasadno", cena: 38, enota: "KOM", skupina: "Izrezi" },
    { id: "izrezSteklokeramikaNasadno", naziv: "Izrez za steklokeramiko nasadno", cena: 75, enota: "KOM", skupina: "Izrezi" },
    { id: "izrezPodpultno", naziv: "Izrez podpultnega korita s poliranim izrezom", cena: 150, enota: "KOM", skupina: "Izrezi" },
    { id: "izrezVogala", naziv: "Izrez vogala", cena: 30, enota: "KOM", skupina: "Izrezi" },
    { id: "izrezLed", naziv: "Izrez za LED trak", cena: 15, enota: "TM", skupina: "Izrezi" },
    { id: "izrezSteklokeramikaInline", naziv: "Izrez steklokeramike inline", cena: 300, enota: "KOM", skupina: "Inline" },
    { id: "koritoInline", naziv: "Pomivalno korito inline", cena: 250, enota: "KOM", skupina: "Inline" },
    { id: "vticnicaInline", naziv: "Vtičnica inline", cena: 130, enota: "KOM", skupina: "Inline" },
    { id: "odcejevalnik", naziv: "Izdelava odcejevalnika do dolžine 40 cm", cena: 390, enota: "KOM", skupina: "Inline" },
    { id: "odcejevalneCrte", naziv: "Izdelava poglobljenih odcejevalnih črt", cena: 230, enota: "KOM", skupina: "Inline" },
    { id: "armiranje", naziv: "Armiranje pultov", cena: 35, enota: "TM", skupina: "Obdelava" },
    { id: "impregnacija", naziv: "Impregnacija", cena: 25, enota: "KOS", skupina: "Obdelava" },
    { id: "rez45do8", naziv: "Rez pod kotom 45° z lepljenjem do 8 cm", cena: 80, enota: "TM", skupina: "Obdelava" },
    { id: "rez45do10", naziv: "Rez pod kotom 45° z lepljenjem do 10 cm", cena: 110, enota: "TM", skupina: "Obdelava" },
    { id: "poliranjeKlasicno", naziv: "Poliranje klasično", cena: 10, enota: "TM", skupina: "Poliranje" },
    { id: "poliranjeC", naziv: "Poliranje C rob", cena: 40, enota: "TM", skupina: "Poliranje" },
    { id: "poliranjeSpodnjiRob", naziv: "Poliranje do 5 cm spodnjega roba", cena: 30, enota: "TM", skupina: "Poliranje" },
    { id: "dvostranskoPoliranje", naziv: "Dvostransko poliranje", cena: 150, enota: "M2", skupina: "Poliranje" },
    { id: "montazaKorita", naziv: "Montaža korita", cena: 40, enota: "KOM", skupina: "Montaža" },
    { id: "montazaSteklokeramike", naziv: "Montaža steklokeramike", cena: 65, enota: "KOM", skupina: "Montaža" },
    { id: "montazaVticnice", naziv: "Montaža vtičnice", cena: 25, enota: "KOM", skupina: "Montaža" },
    { id: "montazaKuhinje", naziv: "Montaža kuhinje", cena: 500, enota: "KOS", skupina: "Montaža" },
    { id: "tezjaMontazaKuhinje", naziv: "Težja montaža kuhinje", cena: 700, enota: "KOS", skupina: "Montaža" },
  ],
};

export async function GET() {
  try {
    const podatki = await redis.get(KLJUC);
    // Če je v bazi še stara oblika cenika (brez storitev), vrni novi privzeti cenik
    if (podatki && Array.isArray(podatki.storitve) && Array.isArray(podatki.materiali)) {
      return Response.json(podatki);
    }
    return Response.json(PRIVZETI_CENIK);
  } catch (e) {
    console.error("Napaka pri branju cenika:", e);
    return Response.json({ napaka: "Napaka pri branju cenika." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const novCenik = await request.json();
    await redis.set(KLJUC, novCenik);
    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri shranjevanju cenika:", e);
    return Response.json({ napaka: "Napaka pri shranjevanju cenika." }, { status: 500 });
  }
}
