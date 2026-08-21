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

## Kvar innan parity kan kallas verifierad

Ordnad. Punkt 4 är den som avgör.

1. **Uppsättning i appen.** `Fältarbete` är nästan klar. Kvar:
   **Anläggningar** och **Import Fältarbete** — `Moduler` (Shared),
   enradsstubbar, `Version`-action. Se `memento/UPPSATTNING.md`.
2. **Ersätt de två stubbar som nyss blev enradare** —
   `Spara ändringar och avsluta Fältarbete` och `Nytt Fältarbete`.
3. **Radera de fyra gamla scripten** enligt `memento/BORTTAGET.md`.
4. **Kör ett helt varv i testbiblioteken:** import → hitta befintliga → lägg
   upp → fältarbete → avsluta → nytt fältarbete. Kontrollera att historiken
   följer med, att åtgärder och kommentarer når anläggningens logg, och att
   koordinaten skrivs tillbaka.
5. **Kontrollera att driftbiblioteken är orörda** — `KOPIERING.md`, avsnittet
   *Efter omkopplingen*. Gör den kontrollen **först** av allt i punkt 4–5.
6. **Sätt Library permission** i varje bibliotek, på varje enhet.
7. **Flygplanslägestest på telefon.** Den enskilda sak som kan sänka hela
   upplägget: hämtas modulerna offline, eller inte? Görs innan något annat
   byggs vidare.

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

## Öppna frågor

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
