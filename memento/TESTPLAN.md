# Testplan — fungerar allt minst lika bra som förr?

Målet är **minst lika bra som förr**: inget som fungerade får ha blivit sämre,
nu med all kod i git. Beteendet behöver alltså inte vara identiskt med
startpunkten — en avvikelse kan vara en förbättring. Är den det, flytta den till
tabellen *Avsiktliga skillnader* nedan i stället för att rätta tillbaka.

När listan är genomgången: `DRIFTSATTNING.md` för vägen till skarp drift.

**Kör allt i testbiblioteken.** Läs `KOPIERING.md` först om de är kopierade —
pekar ett länkfält fel skriver testet i driftdata.

## Så används listan

Skriv resultatet direkt i den här filen — `[x]` för godkänt, en rad text för
avvikelse. Den är versionshanterad, så nästa gång går det att se vad som
faktiskt prövades och inte bara att "det testades".

**Rätta ingenting i appen under körningen.** Anteckna och gå vidare. Ändrar man
mitt i vet man efteråt inte vilket beteende som testades.

***

## Avsiktliga skillnader mot förr

Dessa är **inte** fel. Rapportera dem inte som avvikelser — de är beslutade och
ligger med i `CLAUDE.md` del 5.

| Nu                                                                       | Förr                       |
| ------------------------------------------------------------------------ | -------------------------- |
| Ett tomt fält i fältarbetet raderar **inte** anläggningens ifyllda värde | Tomt skrev över            |
| Koordinaten skrivs tillbaka till anläggningen vid avslut                 | Skrevs inte tillbaka       |
| Anläggningens koordinat vinner över importens när båda finns             | Fanns ingen tydlig regel   |
| Åtgärder och kommentarer hamnar i anläggningens logg vid avslut          | Hände inte alls (död kod)  |
| `Nyckel` följer med till nya fältarbeten                                 | Tappades tyst              |
| Anteckning hamnar under valt `Logg Datum`                                | Hamnade under dagens datum |
| Dialogtexterna kommer ur modulen                                         | Låg i knappscripten        |

***

## 0. Förutsättningar

Utan dessa mäter resten ingenting.

* [x] Uppsättningen klar i alla tre biblioteken enligt `UPPSATTNING.md`

* [x] De fyra gamla scripten raderade enligt `BORTTAGET.md`
  *(kritiskt: ligger* *`LoggWriter`* *kvar samtidigt som modulen körs kan samma
  händelse loggas två gånger — shimen gör att båda fungerar)*

* [x] Länkfälten ompekade enligt `KOPIERING.md`, alla åtta

* [x] `Library permission` satt i varje bibliotek, på den enhet du testar från

* [x] Modulerna uppdaterade för hand i `Moduler`, i varje bibliotek

* [x] `Version` visar **8 moduler**, ingen rad märkt `AVVIKER`, och byggtiden är
  den `push.cmd` skrev ut

* [x] Antal entries antecknat i **driftbiblioteken** före testet:
  Fältarbete \_740\_ Anläggning \_670\_

***

## 1. Importflödet

Använd en importfil med minst tre rader: en som matchar en befintlig anläggning,
en helt ny, och en med koordinat men där anläggningen saknar koordinat.

* [x] `Hitta befintliga` — matchar rätt anläggningar, `Befintlig` länkas

* [x] Rader utan träff markeras som nya, inte tysta

* [x] `Lägg upp` på **befintlig** anläggning → nytt fältarbete, ingen ny anläggning

* [x] `Lägg upp` på **ny** rad → anläggning skapas *och* fältarbete startas

* [x] Sammanfattningsdialogen räknar rätt antal upplagda/hoppade

* [x] Kör `Lägg upp` **en andra gång** på samma rader → inga dubbletter skapas

### Fält som förr tappades

* [x] `Mobilnummer 2` hamnar i `Tfn. 2` (Tfn. 2 följer med när ny anläggning skapas. Inga nya kundupgifter följer med till befintlig anläggning. Kundens upgifter kan ändras mellan gångerna. Behöver en dialog för att godkänna att det ändras med datum det senast ändrades. Måste gå att avbryta för att kolla så det stämmer och sedan försöka igen)

* [x] `Lev.punkt(1)` → `Nätstation` (Var fältet tomt i befintlig och fylldes inte i vid uppläggning. Nätbolagen kan koppla om i nätet så dessa kan ändras mellan anläggningar. Logga vid ändring)

* [x] `Lev.punkt(2)` → `Leveranspunkt` (Samma som Lev.punkt(1))

* [x] Det nya fältarbetet är **inte halvtomt** — gå igenom att fälten från
  anläggningen faktiskt följt med, inte bara de första (Det som fylldes i följde med)

* [x] `Nyckel` är länkad på fältarbetet, inte tom

### Koordinater

* [x] Anläggning **utan** koordinat + importrad **med** → importens används

* [x] Anläggning **med** koordinat + importrad med annan → anläggningens vinner

* [x] Koordinatstatus sätts rätt i båda fallen
  *(fältet lästes förr tillbaka som null direkt efter skrivning)*

***

## 2. Fältarbetets livscykel

Kör hela varvet på en och samma anläggning, i ordning.

* [x] `Nytt Fältarbete` från anläggningen → fältarbete skapas och länkas som
  `Aktivt Fältarbete`

* [x] Fälten från anläggningen är ifyllda i fältarbetet

* [x] `Skapad` och `Status Fältarbete` satta

* [x] Ändra några fält och spara → ändringslogg skrivs, en rad per fält, med
  gamla och nya värdet

* [x] Kryssrutefält loggas oberoende av i vilken ordning du kryssade

* [x] `Logg Datum` sätts till dagens datum när kortet öppnas

* [x] Spara anteckning på ett **annat** `Logg Datum` än idag → hamnar under det
  valda datumet

* [x] Hämta anteckning för valt datum → ger tillbaka samma text

* [x] Två anteckningar samma dag → avdelare mellan dem, och `---` klistrar sig
  inte ihop med texten efter

* [x] `Lägg till datum i kommentar` fungerar

* [x] Ändra `Firmware` → `Firmware Status` och `Firmware uppgraderades` följer med (Firmware status loggas inte)

### Avslut

* [x] Avsluta utan att kryssa i det som krävs → begriplig dialog, inget låses

* [x] Avsluta utan koppling till anläggning → begriplig dialog, ingen krasch (Kunde avsluta trots att koppling saknades, inga fel rapporterades)

* [x] Avsluta korrekt → fältarbetet låses, `Datum för avslut` sätts

* [x] Ändringarna har skrivits till **anläggningen**

* [x] **Åtgärder och kommentarer finns i anläggningens logg** *(hände inte förr)*

* [x] Ett fält du lämnade **tomt** i fältarbetet har **inte** raderat
  anläggningens värde

* [x] Koordinaten är skriven till anläggningen

* [x] Avsluta ett redan avslutat fältarbete → dialogen om att det är låst

### Historiken — buggen som gav upphov till allt

* [x] Skapa ett **andra** fältarbete på samma anläggning (Skriptet som körs från Anläggningar "Nytt fältarbete" skapar nytt fältarbete men misslyckas att koppla det nya fältarbetet till pågående länken. Inga fel visas)

* [x] Det första ligger i `Historiska Fältarbeten` (Här har vi ett problem. Inget länkas till till historiska under det nya fältarbetet. Jag hittade att det inte går att välja sitt eget bibliotek. Så ett entry kan inte länka till andra entries i samma bibliotek. Vi behöver hitta en lösning på detta. Hade från början tänkt att ha ett arkiv som var identiskt med Fältarbete biblioteket så att allt gick att kopiera över utan problem. Började testa detta men hade problem att kopiera över bilder och fick det aldrig att fungera. Fick sedan instruktionen att beställaren ville ha allt i ett bibliotek så där är vi nu)

* [x] Det första är **inte** längre `Aktivt Fältarbete` (Det första tas bort vid avslut av fältarbetet)

* [x] Skapa ett **tredje** → båda de tidigare finns i historiken (Båda finns i historiken på anläggningen men historik i fältarbetet fungerar inte enligt ovan beskrivning)

* [x] Öppna historikposterna: pekar de på **testbiblioteket**?

***

## 3. Version, cache och offline

Här prövas två teorier. Skriv in svaret — de står som obesvarade i
`ARBETSLAGE.md`.

* [x] Pusha en ofarlig ändring. Kör `Version` **utan** att uppdatera modullistan
  → visar gammal byggtid (bekräftar att inget sker av sig själv) (Testade att köra version innan senaste pushen och då visades gamla byggtiden. Hade gått flera dagar sedan förra. Pushade ändring och i desktop så hämtades nya versionen automatiskt när jag körde Version. Inget hämtades automatiskt när jag testade samma på Android.)

* [x] Uppdatera modullistan i `Moduler` → `Version` visar den nya byggtiden

* [x] **Starta om appen på desktop** utan att uppdatera modullistan.
  Ny byggtid? \_ (Uppdaterades inte automatiskt denna gång. Memento kanske kollar om det finns ny version periodiskt?)

* [x] **Starta om appen på Android** utan att uppdatera modullistan.
  Ny byggtid? \_ (Står kvar på samma som innan, uppdaterar inte automatiskt)

> Teori A (min): desktop cachar i minnet per appsession, Android på disk.
> Förutsäger: desktop **ja**, Android **nej**.
>
> Teori B (Jimmys): modulen skrivs till disk vid **första körningen** och läses
> därefter därifrån. Förklarar samma sak som A, men mer sparsamt — det behövs
> ingen skillnad mellan plattformarna, bara en cache som fylls vid körning.
>
> Så skiljer man dem åt:
>
> * [ ] Uppdatera modullistan i `Moduler`, men **kör inget script**. Starta om
>   appen och kör `Version`. Enligt **B** ska den nya versionen vara borta
>   (den hann aldrig köras, alltså aldrig sparas). Enligt **A** ska Android
>   ha den kvar.
>
> * [ ] Uppdatera modullistan, **kör** **`Version`** **en gång**, starta om appen och kör
>   `Version` igen. Båda teorierna säger att den nya versionen finns kvar på
>   Android.
>
> Utfall: \_\_\_\_\_\_  Vilken teori står sig: \_\_\_\_\_\_ (Det verkar som att Memento hämtar senaste versionen så fort man trycker på uppdatera knappen för de importerade biblioteken och sparar dessa till disk även om inget skript körs. Det samma gäller för både android och desktop)

* [x] Flygplansläge på telefon: kör `Version` → 8 moduler, ingen som avviker
  *(gjort — bygge 08:51, alla åtta rapporterade)*

* [x] Flygplansläge: kör ett **riktigt** flöde, inte bara `Version` — spara en
  anteckning, ändra fält och spara, avsluta ett fältarbete

* [x] Flygplansläge i **varje** bibliotek, inte bara Fältarbete

* [ ] Ny/nollställd enhet: sätt upp och kör `Version` **med** täckning en gång,
  sedan flygplansläge → fungerar det? (Har ingen ny eller nollställd enhet)

***

## 4. Enhets- och biblioteksspridning

Detta är där "det fungerade hos mig" brukar visa sig.

* [x] Hela varvet i avsnitt 2 en gång **från telefonen**, inte bara desktop

* [x] Samma varv i biblioteket **Anläggningar** och **Import Fältarbete**, inte
  bara Fältarbete

* [x] Skapa på telefonen, avsluta på desktop → allt hänger med

* [ ] Ta bort `Library permission` till Anläggningar i Fältarbete och avsluta ett
  fältarbete. Blir felet begripligt? *(valfritt, men det är bra att veta hur
  symptomet ser ut innan det händer i skarpt läge — sätt tillbaka efteråt)*

***

## 5. Driften orörd

Görs **först** av allt i punkt 1–4 om något känns osäkert, och en gång till på
slutet.

* [x] Antal entries i driftbiblioteken oförändrat mot noteringen i avsnitt 0 (Inte samma men väntat. Driftbiblioteken har används och nya har tillkommit sedan räkningen)

* [ ] Ingen driftanläggning har fått en ny historikpost *(för många poster för
  hand — kör i stället `Granska`-actionen i Anläggningar. Den listar varje länk
  som pekar ut ur uppsättningen, vilket är exakt det symptomet.)*

* [ ] Inget driftfältarbete har ändrad `Logg` *(samma sak: kör
  `MV.Faltarbete.granskaMedDialog({ andradeEfter: "ÅÅÅÅ-MM-DD" })` med datumet
  då testkörningarna började. Poster rörda efter det listas.)*

***

## Klar när

Alla rutor ovan är ibockade, eller har en antecknad avvikelse som är
**medvetet accepterad** — antingen för att den är ofarlig, eller för att den är
en förbättring. Då, och först då, går det vidare till `DRIFTSATTNING.md`.

Avvikelser som hittas ska bli:

1. En rad i `CHANGELOG.md`
2. Ett test märkt `REGRESSION` i `tools/test.js` **innan** rättningen skrivs
3. Om det visar sig vara avsiktligt beteende: ett test märkt `AVSIKT` i stället,
   och en rad i tabellen *Avsiktliga skillnader* här ovan

## Resultat

| Datum  | Vem    | Avsnitt | Utfall |
| ------ | ------ | ------- | ------ |
| <br /> | <br /> | <br />  | <br /> |

