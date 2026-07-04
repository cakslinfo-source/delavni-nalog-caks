# Delovni nalogi — Kamnoseštvo Čakš

Program za vodenje delovnih nalogov, dobavnic in razrezov. Ta različica teče kot
navadna spletna stran (Next.js), objavljena prek Vercel, s podatki shranjenimi
v Upstash Redis (isti sistem, kot ga uporabljate pri vaši aplikaciji za evidenco ur).

## Korak 1 — GitHub

1. Pojdi na https://github.com in se prijavi (ali ustvari račun, če ga nimaš).
2. Klikni **"New repository"**.
   - Ime: `delovni-nalogi-caks` (ali kar koli želiš)
   - Nastavi na **Private** (priporočeno, saj gre za interno orodje)
   - NE dodajaj README/gitignore (to imamo že pripravljeno)
   - Klikni **"Create repository"**
3. Na svoj računalnik prenesi vso to mapo (`delovni-nalogi-app`), nato v terminalu
   (Command Prompt / Terminal), znotraj te mape, poženi:

   ```
   git init
   git add .
   git commit -m "Prva objava"
   git branch -M main
   git remote add origin https://github.com/TVOJE-UPORABNISKO-IME/delovni-nalogi-caks.git
   git push -u origin main
   ```

   (Namesto zgornje povezave uporabi tisto, ki jo GitHub prikaže po ustvarjanju repozitorija.)

   Če nimaš nameščenega Git-a, ga prenesi tukaj: https://git-scm.com/downloads
   Alternativa brez terminala: na GitHub strani repozitorija klikni
   **"uploading an existing file"** in povleci vse datoteke iz te mape vanj.

## Korak 2 — Upstash Redis (baza podatkov)

1. Pojdi na https://upstash.com in se prijavi (lahko kar z GitHub računom).
2. Klikni **"Create Database"**.
   - Ime: `delovni-nalogi`
   - Regija: izberi tisto, ki je najbližje Sloveniji (npr. Frankfurt / eu-west)
   - Način: **Regional** (ne "Global", ni potrebno)
3. Ko je baza ustvarjena, poišči zavihek **"REST API"**.
4. Skopiraj dve vrednosti:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   (Ti dve vrednosti boš potreboval v naslednjem koraku — nikomur ju ne pošiljaj.)

## Korak 3 — Vercel (objava strani)

1. Pojdi na https://vercel.com in se prijavi z **istim GitHub računom** kot zgoraj.
2. Klikni **"Add New..." → "Project"**.
3. Poišči in izberi repozitorij `delovni-nalogi-caks`, ki si ga ustvaril → **"Import"**.
4. Preden klikneš "Deploy", razširi razdelek **"Environment Variables"** in dodaj:
   - `UPSTASH_REDIS_REST_URL` = (vrednost iz Upstash)
   - `UPSTASH_REDIS_REST_TOKEN` = (vrednost iz Upstash)
5. Klikni **"Deploy"**. Počakaj ~1 minuto.
6. Ko je gotovo, dobiš pravo povezavo, npr. `https://delovni-nalogi-caks.vercel.app`

To je zdaj **prava, stalna spletna stran** — brez Claude peskovnika, brez omejitev
pri tiskanju/PDF/e-pošti/CSV. Vsi zaposleni odprejo isto povezavo in vidijo isti
skupni seznam naročil.

## Korak 4 — Dodaj na zaslon telefona/računalnika

Enako kot prej:
- **Telefon**: odpri povezavo v Safari/Chrome → "Dodaj na začetni zaslon"
- **Računalnik (Chrome)**: tri pikice → "Shrani in deli" → "Namesti stran kot aplikacijo"

## Posodabljanje kasneje

Ko boš (ali jaz zate) kdaj spremenil kodo, samo ponovno poženeš:
```
git add .
git commit -m "Opis spremembe"
git push
```
Vercel samodejno zazna spremembo in v ~1 minuti objavi posodobljeno različico —
brez ponovnega "Publish" gumba, brez zmede s starimi verzijami.

## Admin koda

Privzeta koda za admin dostop (cene, poročila) je **1991** — nastavljena je v
`components/DelovniNalogi.jsx`, v vrstici `const ADMIN_PIN = "1991";`. Če jo želiš
spremeniti, poišči to vrstico in zamenjaj številko.
