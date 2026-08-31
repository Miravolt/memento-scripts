# Testplan — är vi tillbaka där vi var?

Målet med den här listan är **paritet**: allt som fungerade förr fungerar igen,
nu med all kod i git. Först när den är genomgången börjar vi med förbättringar
(`ARBETSFLODE.md`, *Planerat*).

**Kör allt i testbiblioteken.** Läs `KOPIERING.md` först om de är kopierade —
pekar ett länkfält fel skriver testet i driftdata.

## Så används listan

Skriv resultatet direkt i den här filen — `[x]` för godkänt, en rad text för
avvikelse. Den är versionshanterad, så nästa gång går det att se vad som
faktiskt prövades och inte bara att "det testades".

**Rätta ingenting i appen under körningen.** Anteckna och gå vidare. Ändrar man
mitt i vet man efteråt inte vilket beteende som testades.

---

## Avsiktliga skillnader mot förr

Dessa är **inte** fel. Rapportera dem inte som avvikelser — de är beslutade och
ligger med i `CLAUDE.md` del 5.

| Nu | Förr |
|---|---|
| Ett tomt fält i fältarbetet raderar **inte** anläggningens ifyllda värde | Tomt skrev över |
| Koordinaten skrivs tillbaka till anläggningen vid avslut | Skrevs inte tillbaka |
| Anläggningens koordinat vinner över importens när båda finns | Fanns ingen tydlig regel |
| Åtgärder och kommentarer hamnar i anläggningens logg vid avslut | Hände inte alls (död kod) |
| `Nyckel` följer med till nya fältarbeten | Tappades tyst |
| Anteckning hamnar under valt `Logg Datum` | Hamnade under dagens datum |
| Dialogtexterna kommer ur modulen | Låg i knappscripten |

---

## 0. Förutsättningar

Utan dessa mäter resten ingenting.

- [ ] Uppsättningen klar i alla tre biblioteken enligt `UPPSATTNING.md`
- [ ] De fyra gamla scripten raderade enligt `BORTTAGET.md`
      *(kritiskt: ligger `LoggWriter` kvar samtidigt som modulen körs kan samma
      händelse loggas två gånger — shimen gör att båda fungerar)*
- [ ] Länkfälten ompekade enligt `KOPIERING.md`, alla åtta
- [ ] `Library permission` satt i varje bibliotek, på den enhet du testar från
- [ ] Modulerna uppdaterade för hand i `Moduler`, i varje bibliotek
- [ ] `Version` visar **8 moduler**, ingen rad märkt `AVVIKER`, och byggtiden är
      den `push.cmd` skrev ut
- [ ] Antal entries antecknat i **driftbiblioteken** före testet:
      Fältarbete ______ Anläggningar ______

---

## 1. Importflödet

Använd en importfil med minst tre rader: en som matchar en befintlig anläggning,
en helt ny, och en med koordinat men där anläggningen saknar koordinat.

- [ ] `Hitta befintliga` — matchar rätt anläggningar, `Befintlig` länkas
- [ ] Rader utan träff markeras som nya, inte tysta
- [ ] `Lägg upp` på **befintlig** anläggning → nytt fältarbete, ingen ny anläggning
- [ ] `Lägg upp` på **ny** rad → anläggning skapas *och* fältarbete startas
- [ ] Sammanfattningsdialogen räknar rätt antal upplagda/hoppade
- [ ] Kör `Lägg upp` **en andra gång** på samma rader → inga dubbletter skapas

### Fält som förr tappades

- [ ] `Mobilnummer 2` hamnar i `Tfn. 2`
- [ ] `Lev.punkt(1)` → `Nätstation`
- [ ] `Lev.punkt(2)` → `Leveranspunkt`
- [ ] Det nya fältarbetet är **inte halvtomt** — gå igenom att fälten från
      anläggningen faktiskt följt med, inte bara de första
- [ ] `Nyckel` är länkad på fältarbetet, inte tom

### Koordinater

- [ ] Anläggning **utan** koordinat + importrad **med** → importens används
- [ ] Anläggning **med** koordinat + importrad med annan → anläggningens vinner
- [ ] Koordinatstatus sätts rätt i båda fallen
      *(fältet lästes förr tillbaka som null direkt efter skrivning)*

---

## 2. Fältarbetets livscykel

Kör hela varvet på en och samma anläggning, i ordning.

- [ ] `Nytt Fältarbete` från anläggningen → fältarbete skapas och länkas som
      `Aktivt Fältarbete`
- [ ] Fälten från anläggningen är ifyllda i fältarbetet
- [ ] `Skapad` och `Status Fältarbete` satta
- [ ] Ändra några fält och spara → ändringslogg skrivs, en rad per fält, med
      gamla och nya värdet
- [ ] Kryssrutefält loggas oberoende av i vilken ordning du kryssade
- [ ] `Logg Datum` sätts till dagens datum när kortet öppnas
- [ ] Spara anteckning på ett **annat** `Logg Datum` än idag → hamnar under det
      valda datumet
- [ ] Hämta anteckning för valt datum → ger tillbaka samma text
- [ ] Två anteckningar samma dag → avdelare mellan dem, och `---` klistrar sig
      inte ihop med texten efter
- [ ] `Lägg till datum i kommentar` fungerar
- [ ] Ändra `Firmware` → `Firmware Status` och `Firmware uppgraderades` följer med

### Avslut

- [ ] Avsluta utan att kryssa i det som krävs → begriplig dialog, inget låses
- [ ] Avsluta utan koppling till anläggning → begriplig dialog, ingen krasch
- [ ] Avsluta korrekt → fältarbetet låses, `Datum för avslut` sätts
- [ ] Ändringarna har skrivits till **anläggningen**
- [ ] **Åtgärder och kommentarer finns i anläggningens logg** *(hände inte förr)*
- [ ] Ett fält du lämnade **tomt** i fältarbetet har **inte** raderat
      anläggningens värde
- [ ] Koordinaten är skriven till anläggningen
- [ ] Avsluta ett redan avslutat fältarbete → dialogen om att det är låst

### Historiken — buggen som gav upphov till allt

- [ ] Skapa ett **andra** fältarbete på samma anläggning
- [ ] Det första ligger i `Historiska Fältarbeten`
- [ ] Det första är **inte** längre `Aktivt Fältarbete`
- [ ] Skapa ett **tredje** → båda de tidigare finns i historiken
- [ ] Öppna historikposterna: pekar de på **testbiblioteket**?

---

## 3. Version, cache och offline

Här prövas två teorier. Skriv in svaret — de står som obesvarade i
`ARBETSLAGE.md`.

- [ ] Pusha en ofarlig ändring. Kör `Version` **utan** att uppdatera modullistan
      → visar gammal byggtid (bekräftar att inget sker av sig själv)
- [ ] Uppdatera modullistan i `Moduler` → `Version` visar den nya byggtiden
- [ ] **Starta om appen på desktop** utan att uppdatera modullistan.
      Ny byggtid? ______
- [ ] **Starta om appen på Android** utan att uppdatera modullistan.
      Ny byggtid? ______

> Teori A (min): desktop cachar i minnet per appsession, Android på disk.
> Förutsäger: desktop **ja**, Android **nej**.
>
> Teori B (Jimmys): modulen skrivs till disk vid **första körningen** och läses
> därefter därifrån. Förklarar samma sak som A, men mer sparsamt — det behövs
> ingen skillnad mellan plattformarna, bara en cache som fylls vid körning.
>
> Så skiljer man dem åt:
>
> - [ ] Uppdatera modullistan i `Moduler`, men **kör inget script**. Starta om
>       appen och kör `Version`. Enligt **B** ska den nya versionen vara borta
>       (den hann aldrig köras, alltså aldrig sparas). Enligt **A** ska Android
>       ha den kvar.
> - [ ] Uppdatera modullistan, **kör `Version` en gång**, starta om appen och kör
>       `Version` igen. Båda teorierna säger att den nya versionen finns kvar på
>       Android.
>
> Utfall: ______  Vilken teori står sig: ______

- [x] Flygplansläge på telefon: kör `Version` → 8 moduler, ingen som avviker
      *(gjort — bygge 08:51, alla åtta rapporterade)*
- [ ] Flygplansläge: kör ett **riktigt** flöde, inte bara `Version` — spara en
      anteckning, ändra fält och spara, avsluta ett fältarbete
- [ ] Flygplansläge i **varje** bibliotek, inte bara Fältarbete
- [ ] Ny/nollställd enhet: sätt upp och kör `Version` **med** täckning en gång,
      sedan flygplansläge → fungerar det?

---

## 4. Enhets- och biblioteksspridning

Detta är där "det fungerade hos mig" brukar visa sig.

- [ ] Hela varvet i avsnitt 2 en gång **från telefonen**, inte bara desktop
- [ ] Samma varv i biblioteket **Anläggningar** och **Import Fältarbete**, inte
      bara Fältarbete
- [ ] Skapa på telefonen, avsluta på desktop → allt hänger med
- [ ] Ta bort `Library permission` till Anläggningar i Fältarbete och avsluta ett
      fältarbete. Blir felet begripligt? *(valfritt, men det är bra att veta hur
      symptomet ser ut innan det händer i skarpt läge — sätt tillbaka efteråt)*

---

## 5. Driften orörd

Görs **först** av allt i punkt 1–4 om något känns osäkert, och en gång till på
slutet.

- [ ] Antal entries i driftbiblioteken oförändrat mot noteringen i avsnitt 0
- [ ] Ingen driftanläggning har fått en ny historikpost
- [ ] Inget driftfältarbete har ändrad `Logg`

---

## Klar när

Alla rutor ovan är ibockade, eller har en antecknad avvikelse som är
**medvetet accepterad**. Då — och först då — är paritet nådd, och `ARBETSLAGE.md`
byter fas från *parity* till *förbättring*.

Avvikelser som hittas ska bli:

1. En rad i `CHANGELOG.md`
2. Ett test märkt `REGRESSION` i `tools/test.js` **innan** rättningen skrivs
3. Om det visar sig vara avsiktligt beteende: ett test märkt `AVSIKT` i stället,
   och en rad i tabellen *Avsiktliga skillnader* här ovan

## Resultat

| Datum | Vem | Avsnitt | Utfall |
|---|---|---|---|
| | | | |
