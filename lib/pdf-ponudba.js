// Skupna pomoč za izdelavo PDF-ja ponudbe v brskalniku in pošiljanje po e-pošti s PDF v priponki.
// Uporablja jo modul Pulti. (Police imajo enako kodo v DelovniNalogi.jsx.)

export const ZACASNI_PREJEMNIK = "caksl.info@gmail.com";

export async function htmlVPDF(htmlVsebina) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const okvir = document.createElement("iframe");
  okvir.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1200px;border:0;";
  document.body.appendChild(okvir);
  try {
    const d = okvir.contentDocument;
    d.open();
    d.write(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">${htmlVsebina}</body></html>`);
    d.close();
    await new Promise((r) => setTimeout(r, 300));
    const platno = await html2canvas(d.body.firstElementChild, { scale: 2, backgroundColor: "#ffffff", useCORS: true, windowWidth: 794 });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const sirinaStrani = 210;
    const pxNaStran = Math.floor((platno.width * 297) / 210);
    let y = 0;
    let stran = 0;
    while (y < platno.height - 2) {
      const rez = Math.min(pxNaStran, platno.height - y);
      const kos = document.createElement("canvas");
      kos.width = platno.width;
      kos.height = rez;
      kos.getContext("2d").drawImage(platno, 0, y, platno.width, rez, 0, 0, platno.width, rez);
      if (stran > 0) pdf.addPage();
      pdf.addImage(kos.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, sirinaStrani, (rez * sirinaStrani) / platno.width);
      y += rez;
      stran++;
    }
    const bajti = new Uint8Array(pdf.output("arraybuffer"));
    let bin = "";
    for (let i = 0; i < bajti.length; i += 0x8000) bin += String.fromCharCode.apply(null, bajti.subarray(i, i + 0x8000));
    return { base64: btoa(bin), blob: new Blob([bajti], { type: "application/pdf" }) };
  } finally {
    document.body.removeChild(okvir);
  }
}

export async function prenesiPDF(htmlVsebina, imeDatoteke) {
  try {
    const { blob } = await htmlVPDF(htmlVsebina);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = imeDatoteke;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (e) {
    alert("PDF ni bilo mogoče ustvariti: " + (e && e.message ? e.message : e));
    return false;
  }
}

// Pošlje PDF v priponki. Če Resend še ne sme pošiljati neposredno strankam (domena ni preverjena),
// ponudi pošiljanje nanj, da PDF preposlješ ročno.
export async function posljiPDF({ htmlVsebina, imeDatoteke, na, zadeva, besedilo, stranka }) {
  let pdf;
  try {
    pdf = await htmlVPDF(htmlVsebina);
  } catch (e) {
    alert("PDF ni bilo mogoče ustvariti: " + (e && e.message ? e.message : e));
    return false;
  }
  const poslji = async (komu, predpona) => {
    const res = await fetch("/api/posljidobavnico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        na: komu,
        zadeva: predpona ? `${zadeva} (za ${stranka || ""})` : zadeva,
        besedilo: (predpona || "") + besedilo,
        imeDatoteke,
        vsebinaBase64: pdf.base64,
      }),
    });
    const odg = await res.json().catch(() => ({}));
    return { ok: res.ok, odg };
  };
  try {
    const r = await poslji(na, "");
    if (r.ok) {
      alert(`Ponudba s PDF je bila poslana na ${na}.`);
      return true;
    }
    const omejitev = /own email|verify a domain|testing emails|not allowed/i.test(JSON.stringify(r.odg));
    if (omejitev && window.confirm(`Pošiljanje neposredno stranki še ni omogočeno (domena ni preverjena pri Resendu).\n\nAli naj ponudbo s PDF pošljem na ${ZACASNI_PREJEMNIK}, da jo preposlješ stranki (${na})?`)) {
      const r2 = await poslji(ZACASNI_PREJEMNIK, `[PREPOSLJI STRANKI: ${na}]\n\n`);
      if (r2.ok) {
        alert(`Ponudba s PDF je bila poslana na ${ZACASNI_PREJEMNIK}. Preposlji jo stranki.`);
        return true;
      }
      alert(`Pošiljanje ni uspelo: ${r2.odg.napaka || ""}\n${r2.odg.podrobnosti || ""}`);
      return false;
    }
    if (!omejitev) alert(`Pošiljanje ni uspelo: ${r.odg.napaka || ""}\n${r.odg.podrobnosti || ""}`);
    return false;
  } catch (e) {
    alert("Napaka pri pošiljanju e-pošte. Preveri povezavo.");
    return false;
  }
}
