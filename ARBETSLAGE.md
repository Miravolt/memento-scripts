# Arbetsläge

**Var arbetet står just nu.** Uppdateras vid varje leverans, före push.
Läses tillsammans med `CLAUDE.md` av den som kommer in i arbetet — eller av en
chatt som tappat minnet.

Fas: **parity** — samma beteende som förr, men med alla script i git.
Optimering och utseende kommer efter, se `CLAUDE.md` del 6.

---

## Klart

- Alla script extraherade ur de fyra `.mlt2`-filerna och avdubblade till åtta
  moduler. `LoggWriter` finns numera på ett ställe.
- Repot uppsatt: `github.com/Miravolt/memento-scripts`, publikt, med
  sekretesskontroll före push och `push.cmd` för hela kedjan.
- Byggstämpel + `Version`-action, så man ser i appen vilket bygge som körs och
  om en enskild modul är cachad.
- 202 tester gröna mot Memento-simulatorn, laddade i alfabetisk ordning.
- Åtta buggar rättade, var och en med `REGRESSION`-test. Historiken, `Nyckel`
  som länkfält, den döda `actionText`/`cleanLog`-koden, halvtomma fältarbeten
  från importen, tappade `Mobilnummer 2` / `Lev.punkt`, koordinatstatus,
  anteckning på fel datum, `---` klistrat i texten.
- Dialogerna flyttade ur knappscripten till `avslutaMedDialog()` /
  `skapaMedDialog()`. Båda stubbarna är en rad.
- `memento/KOPIERING.md` täcker både de åtta länkfälten och
  script-permissions per bibliotek och per enhet.
- **Offline-cachningen verifierad.** `Version` kördes i flygplansläge på telefon
  och fungerade som vanligt — modulerna finns lokalt. Det var den enda risken
  som kunde ha sänkt hela arkitekturen. Samtidigt bekräftades att *ingen* enhet
  hämtar om av sig själv, och att Mementos strukturuppdatering inte rör
  JavaScript-biblioteken.
- **Fältinventering.** `memento/FALT.md` genereras ur templaterna och är facit
  för vilka fält som finns och av vilken typ. `tools/kontroll.js` varnar för
  fältnamn i koden som inte står där.
- **Historiken visas som text** i fältarbetet: en rad per besök med datum,
  anledning till avslut och åtgärder, plus kommentaren på egen rad.

## Kvar innan parity kan kallas verifierad

Den fullständiga listan står i **[memento/TESTPLAN.md](memento/TESTPLAN.md)** —
den är facit, och resultaten skrivs in där. Nedan är bara ordningen att göra
det i. Punkt 4 är den som avgör.

1. **Uppsättning i appen.** `Fältarbete` är nästan klar. Kvar:
   **Anläggningar** och **Import Fältarbete** — `Moduler` (Shared),
   enradsstubbar, `Version`-action. Se `memento/UPPSATTNING.md`.
2. **Ersätt de två stubbar som nyss blev enradare** —
   `Spara ändringar och avsluta Fältarbete` och `Nytt Fältarbete`.
3. **Radera de fyra gamla scripten** enligt `memento/BORTTAGET.md`.
4. **Kör hela `TESTPLAN.md`** — importflödet, fältarbetets livscykel,
   historiken, cache/offline, spridning över enheter och bibliotek. Skriv in
   resultaten i filen.
5. **Kontrollera att driftbiblioteken är orörda** — `KOPIERING.md`, avsnittet
   *Efter omkopplingen*. Gör den kontrollen **först** av allt i punkt 4–5.
6. **Sätt Library permission** i varje bibliotek, på varje enhet.
7. ~~**Flygplanslägestest på telefon.**~~ Klart — modulerna finns lokalt.
   Kvar av det: kör `Version` en gång **med** täckning på varje ny enhet innan
   den går ut i fält, så att cachen är fylld.

## Avvikelser från testkörningen (31 aug)

Hela `TESTPLAN.md` avsnitt 0–3 är körd. Avsnitt 4 och 5 återstår. Fem fynd,
rangordnade. **A1 blockerar — den ändrar arkitekturen, inte bara koden.**

**A1 — LÖST i koden, kvar i appen. `Historiska Fältarbeten` i Fältarbete kan
inte finnas.**
*Beslut 31 aug: anläggningen är facit; fältarbetet får en textsammanfattning.
Arkivbibliotek utreds separat — det kräver att bildöverföring visar sig
fungera. Kvar att göra i appen: lägg till fältet `Tidigare fältarbeten` i
Fältarbete och ta bort dess `Historiska Fältarbeten`.*
Ett `Link to entry`-fält kan inte peka på sitt eget bibliotek; Memento erbjuder
inte det egna biblioteket i listan. Ett fältarbete kan alltså inte länka till
andra fältarbeten. Detta förklarar i efterhand varför fältet i drift pekade på
ett gammalt *test*-Fältarbete: det var inte ett slarvfel utan det enda sättet
att få fältet att acceptera ett mål alls — och därmed också varför historiken
aldrig fungerade. Kräver ett arkitekturbeslut, se nedan. Anläggningens
`Historiska Fältarbeten` fungerar som det ska; historiken FINNS, den går bara
inte att spegla in i fältarbetet med ett länkfält.

**A2 — TYSTNADEN ÅTGÄRDAD, orsaken kvar. `Nytt Fältarbete` från Anläggningar
länkar inte `Aktivt Fältarbete`.**
*`skapa()` läser nu tillbaka båda länkarna och returnerar `varningar`, och
dialogen visar dem. Nästa gång det inträffar får du veta det på plats i stället
för veckor senare. Varför länkningen misslyckas är fortfarande obevisat.*
Fältarbetet skapas, men kopplingen till anläggningens `Aktivt Fältarbete` blir
inte gjord, och inget fel visas. `skapa()` anropar `MV.db.linkOnce()` utan att
kontrollera returvärdet — därför tystnaden. *Hypotes, obevisad:* `skapa()` skriver
på ett omhämtat entry (`MV.db.reload`), och när målet är det bibliotek scriptet
självt körs i kan det öppna kortets kopia skriva över länken vid spara.
Importflödet, där anläggningen ligger i ett annat bibliotek, fungerar.

**A3 — Avslut utan koppling till anläggning stoppas inte.**
`avsluta()` har kontrollen (`reason: "ingen-koppling"`) och `avslutaMedDialog()`
har dialogen, men fältarbetet gick ändå att avsluta utan varning. Måste
reproduceras: trycktes knappen, eller sattes kryssen för hand? Knappfältet kan
fortfarande innehålla gammal kod — stubbytet är punkt 2 i listan ovan.

**A4 — `Firmware Status` ändringsloggas inte.**
Fältet ligger i `TRACK_FIELDS`, så listan är inte problemet. *Hypotes:* både
`MV.Firmware.syncStatus()` och `MV.Faltarbete.loggaAndringar()` körs på
`MODIFY_ENTRY`, och diffen tas innan firmwarestatus hunnit skrivas.

**A5 — Importen uppdaterar inte befintliga anläggningar.**
Kunduppgifter, `Nätstation` och `Leveranspunkt` följer bara med när anläggningen
är ny. Detta fungerade inte förr heller, så det bryter inte pariteten — men
verksamheten behöver det: nätbolagen kopplar om i nätet och kunduppgifter
ändras. Önskemål: dialog som visar vad som skulle ändras och när det senast
ändrades, med möjlighet att avbryta, samt loggning av ändringen. Parkeras som
punkt 7 under *Planerat*.

## Parkerat till efter parity

Specificerat i `ARBETSFLODE.md` under *Planerat*. Bygg inte i förtid.

1. `Nytt fältarbete krävs` — ska kunna avsluta utan de andra kryssen, troligen
   med en dialog som erbjuder att skapa nästa fältarbete.
2. Omstartsräkning. `Terminal omstartad` räknas, `Terminal bytt` nollställer —
   **obekräftat om `Mätare bytt` också nollställer.** Fråga innan du bygger.
3. Rikare `Lookup` — mer än nyckelnumret i statusraden, via ett JS-fält i
   Nyckelregister.
4. PDF → CSV för importen.
5. Widgets och utseende.
6. Varning när enheten kör en gammal version — `senaste.json` + `http()`, aldrig
   i en trigger. Tre saker måste mätas först, se `ARBETSFLODE.md`.
7. Importen ska kunna uppdatera **befintliga** anläggningar — kunduppgifter,
   `Nätstation`, `Leveranspunkt` — med en dialog som visar vad som skulle
   ändras och när det senast ändrades, går att avbryta, och loggar ändringen.
8. Arkivbibliotek för avslutade fältarbeten. Skulle ge äkta länkar från ett
   fältarbete till tidigare ärenden, vilket inte går inom ett bibliotek.
   **Utred först om bilder går att föra över** — det var där det fastnade förra
   gången. Beställaren har sagt att allt ska ligga i ett bibliotek, så det
   kräver också ett omtag med dem.

## Öppna frågor

- **Varför hämtade desktop om en gång, av sig själv?** Vid ett tillfälle visade
  `Version` den nya byggtiden på desktop utan att modullistan uppdaterats — men
  vid en senare omstart hände det inte. Mekanismen är okänd (periodisk kontroll?).
  Lita aldrig på den: uppdatera för hand. I övrigt är cachefrågan besvarad, se
  `TESTPLAN.md` avsnitt 3.
- Nollställer `Mätare bytt` omstartsräknaren? (punkt 2 ovan)
- Behöver `Config`-scriptet finnas i alla bibliotek, eller bara där något
  faktiskt avviker? Står som *VALFRI* i `UPPSATTNING.md` tills det avgjorts.
- Testbiblioteken innehåller riktiga data från avslutade jobb. Ska de tömmas
  innan varvet i punkt 4, eller är det tvärtom värdefullt att köra mot dem?

---

## Beslutslogg

Bara det som ändrat riktning. Fastslagna beslut med motivering står i
`CLAUDE.md` del 5; buggarnas historia i `CHANGELOG.md` under *Bakgrund*.

| När | Vad | Varför |
|---|---|---|
| 2026-08 | Ett repo nu, prefix i stället för delade repon | Enklare så länge allt versioneras ihop; prefixen gör delningen billig sen. |
| 2026-08 | Repot återskapat från noll efter att ett kundnamn pushats | Historik går inte att städa trovärdigt i ett publikt repo. Sekretesskontrollen kom till samtidigt. |
| 2026-08 | Koordinatprioriteringen vänd tillbaka | Jimmys verksamhetsbeslut: anläggningens korrigerade koordinat vinner. |
| 2026-08 | Testerna laddar alfabetiskt | Efter `TypeError: Cannot find function stamp` — appens laddningsordning måste vara testets. |
| 2026-08 | Diagnosen av historikbuggen korrigerad | Länkfält pekade på ett gammalt testbibliotek. Omhämtningen behålls som skydd, inte som bevisad rättning. |
| 2026-08 | Dialoger ur knappscripten | Jimmys invändning; texterna hör i git. |
