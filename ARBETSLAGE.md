# Arbetsläge

**Var arbetet står just nu.** Uppdateras vid varje leverans, före push.
Läses tillsammans med `CLAUDE.md` av den som kommer in i arbetet — eller av en
chatt som tappat minnet.

Fas: **mot drift.** Kravet är **minst lika bra som förr** — inte identiskt
beteende. Förbättringar får följa med. Se `CLAUDE.md` del 6.

Vad som ska provas: [`memento/TESTPLAN.md`](memento/TESTPLAN.md).
Vad som krävs innan driftbiblioteken rörs, och i vilken ordning:
[`memento/DRIFTSATTNING.md`](memento/DRIFTSATTNING.md).

---

## HÄRNÄST — läs det här först

Sex saker återstår. Ungefär en halvdags arbete plus ägarens timme.

**1. Radera `Historiska Fältarbeten` i Fältarbete Copy.** Enda länkfältet som
fortfarande pekar utanför kopieuppsättningen. *Två minuter.*

**2. Reproducera A3 och A4.** Se *Avvikelser* längre ner — de är de enda öppna
felen. A3: ett fältarbete utan koppling, **sparat**, sedan knappen. A4: dyker
`Firmware Status` upp i loggen vid nästa sparning? *En kvart.*

**3. Generalrepetition.** Kör hela `DRIFTSATTNING.md` **Del B** mot kopiorna,
från B0 till B4. Det är den enda repetition som betyder något, och den avslöjar
vad som är otydligt i körschemat innan ägaren läser det. Glöm inte **B2b**,
torrkörningen av `Återställ historik` — se att siffrorna ser rimliga ut mot 706
anläggningar. *En till två timmar.*

**4. Rätta körschemat** utifrån allt du snubblade på i punkt 3. Det ägaren
snubblar på i skarpt läge är det du snubblade på i kopian.

**5. Skicka underlaget till ägaren och boka tiden.** `DRIFTSATTNING.md` Del B,
`memento/UPPSATTNING.md` och `memento/KOPIERING.md`. Säg att det tar 30–60
minuter, att datan inte rörs, och att det är en engångsinsats.

**6. Ägaren kör Del B.** Du är anträffbar under tiden.

Efter det är det driftsatt. `TESTPLAN.md` är genomgången, länkkartan är utredd,
och ingen dataflytt behövs.

---

## Klart

- Alla script extraherade ur de fyra `.mlt2`-filerna och avdubblade till åtta
  moduler. `LoggWriter` finns numera på ett ställe.
- Repot uppsatt: `github.com/Miravolt/memento-scripts`, publikt, med
  sekretesskontroll före push och `push.cmd` för hela kedjan.
- Byggstämpel + `Version`-action, så man ser i appen vilket bygge som körs och
  om en enskild modul är cachad.
- 279 tester gröna mot Memento-simulatorn, laddade i alfabetisk ordning.
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
- **Historiken visas som text** i fältarbetet: ett block per order med datum
  och anledning i rubriken, åtgärder och kommentarer under.
- **`Återställ historik`-action.** Bygger upp `Historiska Fältarbeten` och
  `Aktivt Fältarbete` från varje fältarbetes egen `Koppling till anläggning`.
  Torrkörning som standard; lägger bara till länkar, tar aldrig bort någon.
  Engångskörning vid driftsättningen, se `DRIFTSATTNING.md` B2b.
- **Varning för gammalt bygge.** `MV.byggVarning()` räknar byggets ålder ur
  byggstämpeln — **utan nätverk** — och hakar på en rad i kvittensen efter
  skapa och avsluta när den passerat `byggVarningDagar` (30 som standard, 0 =
  av). Åldern syns också i `Version`. Fungerar i flygplansläge och kan aldrig
  blockera något.
- **`Granska`-action.** Räknar posterna i en uppsättning och listar varje länk
  som pekar ut ur den. Kom till för att två kontroller i `TESTPLAN.md` avsnitt
  5 inte gick att göra för hand med hundratals poster. Läser bara.
- **Testplanen körd i sin helhet.** Avsnitt 4 klart: hela varvet från telefonen,
  i alla tre biblioteken, och skapa-på-telefon-avsluta-på-desktop. Offline
  fungerar i varje bibliotek, med riktiga flöden och inte bara `Version`.

## Kvar innan det går att köra i drift

Ordningen att göra det i. Den fullständiga listan står i `TESTPLAN.md`
(fungerar det?) och `DRIFTSATTNING.md` (vågar vi?). Punkt 4 är den som avgör.

1. **Uppsättning i appen.** `Fältarbete` är nästan klar. Kvar:
   **Anläggningar** och **Import Fältarbete** — `Moduler` (Shared),
   enradsstubbar, `Version`-action. Se `memento/UPPSATTNING.md`.
2. **Ersätt de två stubbar som nyss blev enradare** —
   `Spara ändringar och avsluta Fältarbete` och `Nytt Fältarbete`.
3. **Radera de fyra gamla scripten** enligt `memento/BORTTAGET.md`.
4. ~~**Kör hela `TESTPLAN.md`**~~ — körd. Kvar av den: **A3** (reproducera
   avslut utan koppling med känt utgångsläge) och **A4** (`Firmware Status` i
   ändringsloggen).
5. **Mät driftens tillstånd via en ny, orörd kopia.** `DRIFTSATTNING.md` A2 —
   CSV-export av kopians Anläggningar, kolumnen `Historiska Fältarbeten`.
   Tom kolumn = ingen data ligger fel. `Granska` går **inte** att köra i
   driften; en action är en strukturändring.
6. **Generalrepetition**: kör hela Del B mot kopiorna.
7. **Sätt Library permission** i varje bibliotek, på varje enhet.
8. ~~**Flygplanslägestest**~~ — klart, riktiga flöden i varje bibliotek. Kvar:
   kör `Version` en gång **med** täckning på varje ny enhet innan den går ut i
   fält, så att cachen är fylld.
9. **Driftsättning** enligt `DRIFTSATTNING.md` — backup först, sedan struktur,
   script, enheter, och ett skarpt ärende hela vägen.

## Avvikelser från testkörningen

Hela `TESTPLAN.md` är körd. A1 är löst i koden, A2 är gjord synlig, A5 är
parkerad som önskemål. **Kvar att reda ut: A3 och A4.**

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
har dialogen, men fältarbetet gick ändå att avsluta utan varning.

*Jimmy 2 sep: knappen trycktes, efter att två rutor kryssats i. Osäkert om
entryt sparades emellan.* Det är en ledtråd men inte ett svar — `avsluta()`
läser fältvärdena ur entryt, så osparade kryss kan ge koden ett annat tillstånd
än det man ser på skärmen. Det förklarar dock inte varför kopplingskontrollen
inte slog till. **Reproduceras med känt utgångsläge:** ett fältarbete utan
`Koppling till anläggning`, sparat, sedan knappen. Kontrollera också att
knappfältet verkligen innehåller enradsstubben och inte gammal kod.

**A4 — `Firmware Status` ändringsloggas inte.**
Fältet ligger i `TRACK_FIELDS`, så listan är inte problemet. *Hypotes:* både
`MV.Firmware.syncStatus()` och `MV.Faltarbete.loggaAndringar()` körs på
`MODIFY_ENTRY`, och diffen tas innan firmwarestatus hunnit skrivas.

**A5 — Importen uppdaterar inte befintliga anläggningar.**
Kunduppgifter, `Nätstation` och `Leveranspunkt` följer bara med när anläggningen
är ny. Detta fungerade inte förr heller, så inget har blivit sämre — men
verksamheten behöver det: nätbolagen kopplar om i nätet och kunduppgifter
ändras. Önskemål: dialog som visar vad som skulle ändras och när det senast
ändrades, med möjlighet att avbryta, samt loggning av ändringen. Parkeras som
punkt 7 under *Planerat*.

## Länkkartan 9 sep — uppmätt, inte gissat

`mementools.py links` på kopiorna av driften plus det gamla testbiblioteket:

| Bibliotek | Fält | Pekar på |
|---|---|---|
| Anläggningar Copy | `Aktivt Fältarbete` | Fältarbete Copy — rätt |
| Anläggningar Copy | `Nyckel` | Nyckelregister Copy — rätt |
| Anläggningar Copy | **`Historiska Fältarbeten`** | **Gammal test Fältarbete** |
| Fältarbete Copy | `Koppling till anläggning` | Anläggningar Copy — rätt |
| Fältarbete Copy | **`Nyckel`** och **`Lookup`** | **ett Nyckelregister utanför uppsättningen** |
| Fältarbete Copy | **`Historiska Fältarbeten`** | **Gammal test Fältarbete** |
| Import Fältarbete Copy | `Befintlig` | Anläggningar Copy — rätt |

**Tre fält missades vid ompekningen.** Kopiorna ärvde dem från driften, så
driften har med all sannolikhet exakt samma tre fel. `Nyckel`/`Lookup` i
Fältarbete pekar dessutom på samma id som testuppsättningen gjorde i augusti —
alltså ett delat eller skarpt Nyckelregister, inte kopians.

Det gamla testbibliotekets id är `TJiQ*(5HBQhuny:HEhw]`, exakt det id båda
`Historiska Fältarbeten` pekade på redan i augustiexporten. Att driften pekar
dit är därmed bevisat, inte antaget. Sannolik förklaring: driftbiblioteken
skapades genom att kopiera det gamla testparet, och ärvde pekaren.

### De 36 posterna i det gamla biblioteket

Ur CSV-exporten: **inte skräpdata.** `Tjänst`, `Anl. adress`, `Kund`,
`Mätarnummer`, `Status Fältarbete`, `Skapad` och `Logg` är ifyllda i alla 36.
30 av 36 är avslutade. Två namngivna tekniker. Allt utfört mellan **24 februari
och 2 mars 2026** — en dryg vecka av riktigt fältarbete.

Alla 36 har `Koppling till anläggning` satt, och den pekar på *Gammal test
Anläggningar*. De hör alltså ihop med ett gammalt test**par**, och är inte
driftposter som hamnat fel. Strukturen är identisk med driftens Fältarbete:
81 fält i båda, samma namn, samma typer — en dataflytt vore alltså tekniskt
möjlig, om den visar sig behövas.

**Mätningen 9 sep gav fall B.** Av driftens 706 anläggningar har 30 en
historiklänk, och **alla 30 pekar in i det gamla biblioteket** — 31 poster på 29
adresser. `Aktivt Fältarbete` är däremot friskt: 11 anläggningar har ett aktivt
fältarbete och inget av dem ligger fel.

Sannolik förklaring: driftens Anläggningar skapades genom att kopiera det gamla
testbiblioteket, med länkarna intakta. De 676 som tillkommit sedan dess har
aldrig fått historik — deras avslutade fältarbeten finns i driftens Fältarbete
men kunde aldrig länkas dit, eftersom fältet är bundet till det gamla.

**Löst 9 sep: ingen dataflytt behövs.** Alla 36 posterna i det gamla
biblioteket har en exakt motsvarighet i driftens Fältarbete — samma `Tjänst` och
samma `Skapad` ned till minuten. Det gamla biblioteket är en dubblett, inte ett
gömställe. Historiken byggs i stället upp från `Koppling till anläggning` med
`MV.Faltarbete.aterstallHistorik()`, och då får **alla 706** anläggningar sin
historik — inte bara de 30.

## Rättigheter i driften — förutsättningen som saknades

**Jimmy äger inte driftbiblioteken.** Han har rättighet att kopiera dem, men
inte att ändra struktur, inte att lägga till script, och inte ens att se
strukturen utan att först ta en kopia.

Det gör att stora delar av driftsättningen inte kan utföras av honom:
fältet `Tidigare fältarbeten`, ompekning av länkfält, `Moduler`, enradsstubbarna
och `Version` är alla strukturändringar. `Granska` likaså — en action *är* en
strukturändring, så den kan inte köras i driften.

**Beslut 9 sep: ägaren utför ändringarna**, med `DRIFTSATTNING.md` Del B som
körschema. Den delen är därför omskriven för en läsare som inte varit med i
arbetet — explicit, med kontrollpunkter och en stoppregel. Del A är det Jimmy
förbereder i kopiorna.

En sak mildrar begränsningen: koden slutade använda historiklänkfältet, så det
behöver varken pekas om eller tas bort — att den gamla pekaren ligger kvar är
ofarligt (Jimmy 9 sep). Fältet **`Tidigare fältarbeten` är däremot ett krav**;
att sammanfattningen annars hamnar i `Logg` är en nödutgång, inte ett
alternativ. Uppsättningen av `Moduler` och stubbarna går inte att komma runt.

Värt att ta med till kunden: **detta är en engångsinsats.** Efter uppsättningen
sker kodändringar utanför biblioteken och kräver inga rättigheter i dem. Det är
just därför arkitekturen ser ut som den gör.

## Parkerat till efter driftsättning

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
  `TESTPLAN.md` avsnitt 3 — och bekräftad en gång till 11 sep: en ändrad modul
  med ny hash hämtades inte om av sig själv inom testets tidsrymd.
- **Var ska versionsmarkören bo?** M1 och M2 är besvarade och båda föll — ingen
  schemaläggning på desktop, och `lib().notes` finns inte. Kvar står ett vanligt
  entry som bärare; öppet är vilket bibliotek det ska ligga i. Se
  `ARBETSFLODE.md` punkt 6. Behövs inte före driftsättning.
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
| 2026-09 | Kravet: minst lika bra som förr, inte identiskt beteende | Förbättringar ska kunna följa med i stället för att vänta. |
| 2026-09 | Ägaren utför driftsättningen | Jimmy saknar rättigheter i driftbiblioteken. `DRIFTSATTNING.md` Del B skriven för någon utan förkunskap. |
