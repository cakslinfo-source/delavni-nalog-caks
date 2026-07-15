
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request) {
  try {
    const { na, zadeva, besedilo, imeDatoteke, vsebinaDatoteke } = await request.json();

    if (!na) {
      return Response.json({ napaka: "Stranka nima vnesenega e-mail naslova." }, { status: 400 });
    }

    const apiKljuc = process.env.RESEND_API_KEY;
    if (!apiKljuc) {
      return Response.json(
        { napaka: "E-poštni servis še ni nastavljen (manjka RESEND_API_KEY v Vercel nastavitvah)." },
        { status: 500 }
      );
    }

    const base64Vsebina = Buffer.from(vsebinaDatoteke, "utf-8").toString("base64");

    const odgovor = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKljuc}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kamnoseštvo Čakš <onboarding@resend.dev>",
        to: [na],
        subject: zadeva,
        text: besedilo,
        attachments: [{ filename: imeDatoteke, content: base64Vsebina }],
      }),
    });

    if (!odgovor.ok) {
      const podrobnosti = await odgovor.text();
      console.error("Resend napaka:", podrobnosti);
      return Response.json({ napaka: "Pošiljanje e-pošte ni uspelo.", podrobnosti }, { status: 500 });
    }

    return Response.json({ uspeh: true });
  } catch (e) {
    console.error("Napaka pri pošiljanju e-pošte:", e);
    return Response.json({ napaka: "Napaka pri pošiljanju e-pošte.", podrobnosti: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
