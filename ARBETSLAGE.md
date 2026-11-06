# Arbetsläge

**Var arbetet står just nu.** Uppdateras vid varje leverans, före push.
Läses tillsammans med `CLAUDE.md` av den som kommer in i arbetet — eller av en
chatt som tappat minnet.

Fas: **mot drift.** Kravet är **minst lika bra som förr** — inte identiskt
beteende. Förbättringar får följa med. Se `CLAUDE.md` del 6.

Vad som ska provas: [`memento/TESTPLAN.md`](memento/TESTPLAN.md).
Vad ägaren gör i appen, steg för steg:
[`memento/KORSCHEMA.md`](memento/KORSCHEMA.md). Förberedelserna före det:
[`memento/DRIFTSATTNING.md`](memento/DRIFTSATTNING.md).

---

## HÄRNÄST — läs det här först

*Avsnitt i `ARBETSLAGE.md`, inte en egen fil. Det är här arbetet börjar varje
gång, och det som hänvisas till som "HÄRNÄST".*

**Läge 6 nov 2026: ingenting är driftsatt, och det är goda nyheter.** Ägaren
har fått `memento/KORSCHEMA.md` men har inte hunnit börja — inget steg är kört.
Projektet har legat stilla sedan 23 sep eftersom båda haft annat.

Att ingenting är igång betyder att **alla ändringar kan komma in före
driftsättningen i stället för efter**, och det gäller i synnerhet sådant som
rör strukturen. Se punkt 3.

**Senaste push: 23 sep, `Bryt ut körschemat till memento/KORSCHEMA.md`**
(c7823cc). Verifierat genom att `.git/refs/heads/main` och
`.git/refs/remotes/origin/main` pekar på samma commit, och att arbetsfilerna är
nyare än båda.

I pushen ingår bilder i logg och historik samt utbrytningen av körschemat.
**Opushat på disken** ligger:

* A5 — importen uppdaterar befintliga anläggningar efter godkännande
* `Tjänstenr` som krav vid import, med spärr mot anläggning utan `Tjänst`
* Invariant I11 (en uppgift bor på ett ställe) + `kontrolleraDubbelDokumentation()`
* Invariant I12 (dialogknappar) + mocken sparar knapparnas callbacks
* Sammanslagningen av de två Planerat-listorna
* `Bruten i kabelskåp` som omstart, och `Mätare bytt` som nollställare

399 tester gröna, alla fyra kontroller rena i det läge som ligger på disken.

**1. ~~Prova A5-dialogen i appen.~~ KLART 6 nov — grönt.**
Två anläggningar, åtta ändringar, Avbryt skrev ingenting. I12 höll i appen.
Två rättelser gjordes efteråt, båda hittade i skärmbilderna och båda låsta med
`REGRESSION`-test: pilen `→` renderades som `?` i dialogen, och blanktecken i
ändarna räknades som en ändring. **De två ligger opushade** — pusha dem, och
hämta om modulerna i kopian en sista gång för att se pilen som `->`.

*Det ursprungliga provet står kvar nedan för den som vill köra om det.*

**~~Prova A5-dialogen i appen.~~ Detta var spärren före push.**
Det är enda stället i kodbasen där en dialog fattar ett beslut, och Mementos
dialoger körs asynkront med knappkoden möjligen i en ny instans (I12). Koden är
skriven för det, men det är inte provat i appen. Gör det i en kopia:

* Tryck **ja** → det som stod i rutan blir också skrivet
* Stäng rutan utan att välja → anläggningen är orörd
* Kvittensen efter ja syns — den är ett `message()`, inte en ruta, eftersom
  det är omätt om en dialog kan visas ovanpå en annan

Står det sig: pusha. Står det sig inte: säg vad som hände, det är rättbart.

**2. Pusha.** `push.cmd` kör stämpel → kontroll → tester → sekretess → commit.

**3. Bestäm vad mer som ska med INNAN ägaren börjar.**
Allt under *Planerat* i `ARBETSFLODE.md` som bara är modulkod kan läggas till
när som helst, även efter driftsättningen — det går ut med nästa modulhämtning.

Men det som kräver ett **nytt fält, ett nytt script eller en ny rättighet**
måste in i `KORSCHEMA.md` innan ägaren kör, annars kostar det en hel ny runda
hos hen. Just nu är det gratis. Berörda punkter: 2 (omstartsräknaren som
heltalsfält i stället för loggrad), 3 (rikare `Lookup` via ett JS-fält i
Nyckelregister) och 6 (versionskontrollen, som behöver `Network`).

**4. Fyll i kontaktuppgifterna om filen skickas igen.** Rad 6 i `KORSCHEMA.md`
har `<kontaktperson>` och `<telefon>` som platshållare. De står med flit tomma
i repot — det är publikt.

**Numreringen i körschemat är ny** sedan utbrytningen: B0–B7 heter steg 1–8, och
delstegen skrivs 2.1, 2.2 och så vidare. Gamla anteckningar med B-nummer pekar
ett steg fel — B1 är steg 2.

När ägaren är igenom är det driftsatt. `TESTPLAN.md` är genomgången, länkkartan
är utredd, och ingen dataflytt behövs.

---

## Klart

- Alla script extraherade ur de fyra `.mlt2`-filerna och avdubblade till åtta
  moduler. `LoggWriter` finns numera på ett ställe.
- Repot uppsatt: `github.com/Miravolt/memento-scripts`, publikt, med
  sekretesskontroll före push och `push.cmd` för hela kedjan.
- Byggstämpel + `Version`-action, så man ser i appen vilket bygge som körs och
  om en enskild modul är cachad.
- 399 tester gröna mot Memento-simulatorn, laddade i alfabetisk ordning.
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
  Engångskörning vid driftsättningen, se `KORSCHEMA.md` steg 7.
- **Byggets ålder syns i `Version`.** `MV.byggAlderDagar()` räknar den ur
  byggstämpeln, utan nätverk. Den *varning* som kan hakas på kvittensen efter
  skapa och avsluta finns kvar i koden men är **avstängd som standard**
  (`byggVarningDagar = 0`) — ålder är inte samma sak som inaktuell, och ett
  larm som nästan alltid har fel blir avstängt av användaren, varefter även
  det riktiga larmet är borta. Låst med ett `AVSIKT`-test. Sätts på per
  bibliotek när det finns skäl, t.ex. en period efter en rättning man vet ska
  ut.
- **`Granska`-action.** Räknar posterna i en uppsättning och listar varje länk
  som pekar ut ur den. Kom till för att två kontroller i `TESTPLAN.md` avsnitt
  5 inte gick att göra för hand med hundratals poster. Läser bara.
- **Testplanen körd i sin helhet.** Avsnitt 4 klart: hela varvet från telefonen,
  i alla tre biblioteken, och skapa-på-telefon-avsluta-på-desktop. Offline
  fungerar i varje bibliotek, med riktiga flöden och inte bara `Version`.

## Kvar innan det går att köra i drift

**Den ordnade listan står i avsnittet *HÄRNÄST* högst upp i den här filen. Det
här avsnittet finns bara för att visa vad som redan är avklarat, så att det
inte görs om.**

Två listor som inte höll ihop var det som gjorde det svårt att se var arbetet
stod. Nu är *HÄRNÄST* den enda.

| Vad | Läge |
|---|---|
| Kör hela `TESTPLAN.md` | **Klart.** Kvar ur den: A3 och A4, se *Avvikelser*. |
| Mät driftens tillstånd via en orörd kopia | **Klart** 9 sep. Se *Länkkartan*. Ingen dataflytt behövs. |
| Flygplanslägestest | **Klart** — riktiga flöden i varje bibliotek, 8 moduler i cachen. |
| Uppsättning i appen: fält, knappfält, `Moduler`, triggrar, actioner | Ingår i `KORSCHEMA.md`, delsteg .1–.5 i varje biblioteksavsnitt. |
| Radera de gamla scripten | Ingår i `KORSCHEMA.md`, delsteg .7 i varje biblioteksavsnitt. |
| Library permission per bibliotek och enhet | Ingår i `KORSCHEMA.md`, delsteg .6 i varje biblioteksavsnitt, plus steg 6. |
| Kör `Version` med täckning på varje ny enhet innan den går ut i fält | Ingår i `KORSCHEMA.md`, steg 6. Fyller cachen. |

## Avvikelser från testkörningen

Hela `TESTPLAN.md` är körd. A1 är löst i koden och A2 är gjord synlig.
**A3 och A4 stängdes 11 sep** — A3 var inget fel, A4 var det och är rättat.
**A5 stängdes 23 sep** och är byggd.

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

**A3 — INGET FEL. Kontrollen fungerar.**
*Reproducerad 11 sep med känt utgångsläge, i två bibliotek oberoende av
varandra, med samma resultat:* nytt fältarbete utan `Koppling till anläggning`,
sparat, `Läser i CM` och `Avslutad` ikryssade, sedan knappen → meddelande om att
anläggning saknas, och **ingenting sparades**. Det är precis det avsedda
beteendet.

Den ursprungliga observationen 2 sep kom med all sannolikhet av att entryt inte
var sparat när knappen trycktes. `avsluta()` läser fältvärdena ur entryt, så
osparade kryss ger koden ett annat tillstånd än det som syns på skärmen. Ingen
kodändring gjord — det fanns inget att rätta.

**A4 — RÄTTAT 11 sep. `Firmware Status` ändringsloggades inte.**
*Reproducerad i två bibliotek: `Firmware` ändrad från `Välj` till `Uppgraderad`,
sparat, ingen rad i loggen.*

**Orsak, nu bevisad av testet.** `Firmware Status` sätts av en egen trigger, och
Memento garanterar ingen ordning mellan triggrar. Kör den efter
`loggaAndringar()` ser diffen det gamla värdet — och eftersom det nya värdet
ändå hinner sparas ser *nästa* diff ingen skillnad alls. Ändringen blir därmed
permanent osynlig, inte bara försenad ett varv. Det förklarar varför den aldrig
dök upp, hur många gånger man än sparade.

**Rättning.** `loggaAndringar()` anropar `MV.Firmware.syncStatus(e)` innan
diffen tas. Har den andra triggern redan kört returnerar den `false` och
ingenting händer, så resultatet blir detsamma oavsett ordning. Låst med tre
`REGRESSION`-tester som fallerar om anropet tas bort.

**A5 — RÄTTAD 23 sep. Importen uppdaterar nu befintliga anläggningar.**
*Kunduppgifter, `Nätstation` och `Leveranspunkt` följde bara med när
anläggningen var ny. Fanns den redan tappades de tyst — det enda som skrevs var
en saknad koordinat. Detta fungerade inte förr heller, så det bröt inte mot
paritetskravet, men verksamheten behöver det: nätbolagen kopplar om i nätet och
kunduppgifter ändras.*
`MV.Import.laggUpp()` föreslår numera ändringarna i en dialog innan något
skrivs, och skriver bara efter ett ja. Sju fält får uppdateras: `Kund`,
`Tfn. 1`, `Tfn. 2`, `Mätarplacering`, `Nätstation`, `Leveranspunkt` och
`Mätarnummer`. `Anl. adress` och `Tjänst` är med flit utelämnade — adressen kan
vara rättad på plats, och `Tjänst` är nyckeln matchningen bygger på. Tomt i
importfilen raderar aldrig. Ändringen loggas i anläggningen med `(importen)`
som källa. **Kräver ingenting nytt i appen** — inget fält, ingen action, ingen
rättighet — så den går ut med nästa modulhämtning.
**Låg fel i planeringen.** Den beskrevs som "punkt 7 under *Planerat*", men
punkt 7 i `ARBETSFLODE.md` var template-paketet. Ägaren hade bett om det här
i samband med driftsättningen och det föll mellan stolarna i två veckor. Det
var anledningen till invariant I11.

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

**Beslut 9 sep: ägaren utför ändringarna**, med `KORSCHEMA.md` som
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

**Listan står i `ARBETSFLODE.md` under *Planerat*, och bara där.**

Här stod länge en egen uppräkning av samma saker. De två höll ihop till punkt 6
och numrerade sedan om åt olika håll, så "punkt 7" betydde importen på ett
ställe och template-paketet på det andra. Den som läste fel fil fick fel svar.
Det är samma fel som två gånger tidigare — `UPPSATTNING.md` mot Del B,
och de två att-göra-listorna i den här filen. Se invariant I11 i `CLAUDE.md`.

Kort om vad som ligger där, som orientering — **inte** som en lista att
underhålla:

<!-- speglar: ARBETSFLODE.md#Planerat (9 punkter) -->

| # | Vad | Blockerad av |
|---|---|---|
| 1 | `Nytt fältarbete krävs` ska göra något | inget — kan byggas |
| 2 | Omstartsräkning | inget — nollställningsregeln bekräftad 23 sep |
| 3 | Rikare `Lookup` via ett JS-fält i Nyckelregister | omätt om JS-fält når modulerna |
| 4 | PDF → CSV | behöver se hur PDF:erna ser ut |
| 5 | Widgets och utseende | ospecificerat |
| 6 | Varning när enheten kör en gammal version | steg 1 är obeblockerat, se `ARBETSFLODE.md` |
| 7 | Bilder i logg och historik | **byggt 23 sep** |
| 8 | Arkivbibliotek | bildöverföring + omtag med beställaren |
| 9 | Template-paket för nästa kund | vänta tills driftsättningen står |

Importen som uppdaterar **befintliga** anläggningar (avvikelse A5) låg här som
punkt 7 och är **byggd 23 sep**. Se *Avvikelser* nedan.

## Öppna frågor

- **Vad var det 3.11.0 tog sönder?** Ägaren körde en period på desktop 3.11.0
  och hans befintliga script slutade fungera; de kom tillbaka med 3.11.1
  (6 nov 2026). Symptomet är inte utrett av oss — vi vet bara att det hände
  och att det gick över. Det spelar roll om det var något vi lutar oss mot.
  **Fråga hur det yttrade sig** nästa gång ni ändå pratar: vägrade scripten
  köra, kastade de fel, eller gjorde de fel sak? Det kostar en fråga och kan
  spara en felsökning.

- **Varför hämtade desktop om en gång, av sig själv?** Vid ett tillfälle visade
  `Version` den nya byggtiden på desktop utan att modullistan uppdaterats — men
  vid en senare omstart hände det inte. Mekanismen är okänd (periodisk kontroll?).
  Lita aldrig på den: uppdatera för hand. I övrigt är cachefrågan besvarad, se
  `TESTPLAN.md` avsnitt 3 — och bekräftad en gång till 11 sep: en ändrad modul
  med ny hash hämtades inte om av sig själv inom testets tidsrymd.
- **Hur får en vanlig användare in ny kod?** Uppdateringsknappen sitter på
  script-sidan, som bara ägaren kommer åt (Jimmy 11 sep). En fälttekniker
  uppdaterar alltså varken automatiskt eller manuellt. Tre saker behöver mätas,
  men **inget av dem hindrar driftsättningen** — vid uppsättningen är det
  ägaren som kör, och en ny enhet hämtar modulerna när biblioteket läggs till:
  1. Får en enhet modulerna automatiskt första gången biblioteket läggs till?
     (Troligt — så har varje ny enhet hittills fått dem — men inte prövat med
     ett icke-ägarkonto.)
  2. Når ägarens uppdatering de andra enheterna, eller bara den egen?
     Cachen är uppmätt som per enhet, vilket talar emot. Men desktop hämtade
     om en gång av sig själv, och den mekanismen är fortfarande okänd.
  3. Finns det en rättighetsnivå under ägare som ändå ser script-sidan?
  Faller allt detta blir konsekvensen att varje kodändring efter driftsättning
  kräver att ägaren gör en runda på enheterna. Det gör byggåldersvarningen mer
  värd, inte mindre: användaren kan då åtminstone *se* att koden är gammal och
  säga till.
- **Var ska versionsmarkören bo?** M1 och M2 är besvarade och båda föll — ingen
  schemaläggning på desktop, och `lib().notes` finns inte. **Ny kandidat sedan
  6 nov:** `http().download()` kom i desktop 3.11.0 och kan enligt changelogen
  spara filen direkt i ett **filfält på ett entry**, vilket synkar. Det skulle
  ta bort både den manuella stämplingen och nätverksberoendet på telefonerna.
  Fyra mätningar krävs först (M9–M12). Annars står ett vanligt entry kvar som
  bärare. Se `ARBETSFLODE.md` punkt 6. Behövs inte före driftsättning.
- ~~Nollställer `Mätare bytt` omstartsräknaren?~~ **Besvarad 23 sep: ja.** Det
  sitter alltid en ny kommunikationsmodul på en ny mätare, så både
  `Mätare bytt` och `Terminal bytt` nollställer. Räknaren mäter hur väl den
  nuvarande modulen fungerar sedan den blev ny. Infört i `ARBETSFLODE.md`
  punkt 2.
- Behöver `Config`-scriptet finnas i alla bibliotek, eller bara där något
  faktiskt avviker? Nämns inte i Del B alls — läggs bara till om något visar sig avvika.
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
| 2026-09 | Ägaren utför driftsättningen | Jimmy saknar rättigheter i driftbiblioteken. `KORSCHEMA.md` skriven för någon utan förkunskap. |
