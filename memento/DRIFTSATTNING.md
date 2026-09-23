# Driftsättning

Det här dokumentet är i två delar, för att arbetet delas mellan två personer:

* **Del A — förberedelserna.** Görs av den som byggt scripten, i egna kopior av
  biblioteken. Inget av detta rör driften.

* **Del B — körschemat.** Görs av den som **äger** driftbiblioteken. Del B är
  skriven för att kunna följas av någon som inte varit med i arbetet.

Del B kan inte påbörjas förrän Del A är avbockad.

***

# Del A — förberedelser i kopiorna

> **Ägaren ska aldrig läsa Del A.** Den görs av den som byggt scripten, i egna
> kopior, och är den enda del där verktyg utanför Memento förekommer —
> `.mlt2`-export och ett Python-script. **Del B innehåller ingenting sådant:**
> allt där görs i appen, inklusive säkerhetskopian, som är en vanlig
> template-export ur biblioteksmenyn. Skicka bara Del B vidare.
>
> **A1 och A2 är dessutom redan gjorda** (9 sep 2026) — kopiorna finns,
> länkarna är ompekade och driftens tillstånd är uppmätt. Kvar av Del A är
> **A3, generalrepetitionen.** Börja där.

## A1. En sluten kopieuppsättning — KLAR 9 sep 2026

Kopiera alla bibliotek som ingår: **Anläggningar, Fältarbete, Import
Fältarbete, Nyckelregister**. Ge dem alla **exakt samma suffix**, t.ex.
`Anläggningar <Kund> Copy 2026-09-09`.

**Kopieringen görs i Android-appen** — långtryck på biblioteket, *Kopiera*, och
välj struktur eller struktur med data. Det är enda sättet; desktop kan inte
kopiera ett bibliotek.

Suffixet är inte kosmetik. Koden härleder vilken uppsättning den arbetar i ur
namnet på det bibliotek den körs i, så lika suffix håller kopiorna för sig
själva. Blandade suffix gör att en körning i kopian kan nå driften.

* [x] Alla fyra kopior har samma suffix

* [x] Exportera dem som `.mlt2` och kontrollera länkmålen med:

  ```
  python tools/mementools.py links "Raw"
  ```

* [x] **Varje länkfält pekar på en kopia**, inte på ett driftbibliotek

> En kopia ärver länkfältens mål från originalet, alltså driften. De måste
> pekas om för hand — och kontrolleras med verktyget, inte med minnet. Att gå
> igenom dem för hand och tro att man tagit alla är precis så det blev fel från
> början.
>
> **Verktyget är en genväg, inte ett krav.** Det läser åtta länkfält på en
> sekund i stället för att man klickar sig igenom strukturen åtta gånger. Går
> det inte att köra — och det gör det inte hos ägaren — så gör Del B steg **B1**
> exakt samma kontroll för hand, fält för fält. Ingenting i Del B kräver
> `.mlt2`, Python eller något annat utanför appen.

## A2. Mät hur driften ser ut — utan att röra den — KLAR 9 sep 2026

En kopia bevarar länkarna som de var i driften. Det är enda sättet att se
driftens tillstånd utan rättigheter i den.

* [ ] Gör en **ny, orörd** kopia av driftens Anläggningar. Peka inte om något.

* [ ] Exportera dess entries till CSV med fälten `Anl. adress`, `Tjänst`,
  `Aktivt Fältarbete`, `Historiska Fältarbeten`

* [ ] Kontrollera vad `Historiska Fältarbeten` innehåller

**Är kolumnen tom överallt** har historiklänkningen aldrig fungerat — då ligger
ingen data fel, och det räcker att peka om.

**Innehåller den poster** ligger de i ett annat bibliotek än driftens
Fältarbete. Då krävs ett beslut om dataflytt innan Del B påbörjas.

> Mät på en **ny** kopia. Har man redan pekat om länkfälten i en kopia är
> spåren av vad som var länkat borta där — ompekning kastar länkarna.

### Utfall 9 sep 2026 — fall B

| <br />                                          | <br />       |
| ----------------------------------------------- | ------------ |
| Anläggningar i driften                          | 706          |
| …med en historiklänk                            | **30**       |
| …vars länk pekar in i det gamla testbiblioteket | **30 av 30** |
| …med ett aktivt fältarbete                      | 11           |
| …vars aktiva länk pekar fel                     | **0**        |

Berörda poster i det gamla biblioteket: **31 stycken**, på 29 adresser. Alla har
`Logg`, 29 har `Åtgärder`, 29 är avslutade, **2 har bilder**.

Tolkning: `Aktivt Fältarbete` är friskt och pekar in i driftens Fältarbete.
`Historiska Fältarbeten` gör det inte — och kan inte göra det, eftersom fältet
är bundet till det gamla biblioteket. Att exakt de 30 äldsta anläggningarna har
historik tyder på att driftens Anläggningar en gång skapades genom att kopiera
det gamla testbiblioteket, med länkarna intakta. De 676 anläggningar som
tillkommit sedan dess har aldrig fått någon historik alls — deras avslutade
fältarbeten finns i driftens Fältarbete men kunde aldrig länkas.

### Ingen dataflytt behövs

Jämförelse mot en export ur driftens Fältarbete: **alla 36 posterna i det gamla
biblioteket har en exakt motsvarighet i driften** — samma `Tjänst` och samma
`Skapad` ned till minuten. Det gamla biblioteket är alltså en **dubblett**, inte
ett gömställe för data som saknas någon annanstans.

Det betyder att de 30 historiklänkarna pekar på kopior av poster som redan
finns där de ska. Pekas fältet om försvinner länkarna, men ingenting går
förlorat — och historiken byggs upp igen på nästa steg, den här gången för
**alla** 706 anläggningarna och inte bara de 30.

Det gamla biblioteket kan därefter arkiveras eller raderas. Vänta med det tills
återuppbyggnaden är verifierad.

## A3. Generalrepetition

Kör hela **Del B mot kopiorna**. Samma datamängd, samma historik, samma
egenheter som skarpt läge. Går det igenom där är driftsättningen mekanik.

* [ ] Del B genomförd i kopiorna, från början till slut

* [ ] Ett helt ärende: skapa → ändra → avsluta → nytt ärende med historik

* [ ] `TESTPLAN.md` genomgången, avvikelser antingen rättade eller medvetet
  accepterade

## A4. Underlag till ägaren

* [ ] **Den här filen, Del B.** Den är komplett — all scriptkod, alla
  rättigheter och alla raderingar står på plats i den. Ägaren behöver inget
  annat dokument.

* [ ] `memento/KOPIERING.md` **bara om** något ska kopieras eller döpas om.
  Vid en vanlig driftsättning behövs den inte.

* [ ] En tid avtalad, och en person som är anträffbar under körningen

***

# Del B — körschema för den som äger biblioteken

**Del B ligger i en egen fil: [`KORSCHEMA.md`](KORSCHEMA.md).**

Den är skriven för att skickas vidare som den är. Den nämner inte Del A, inte
kopiorna och inte repetitionen — allt den innehåller görs i appen, i drift.

Ändra aldrig körschemat här. Filen är enda källan, så att ägaren och den här
planen inte kan säga olika saker.

Vad som står i den, i ordning:

| Steg | Vad                                                  |
| ---- | ---------------------------------------------------- |
| 1    | Säkerhetskopia — full datakopia och template-export  |
| 2    | Fältarbete, åtta delsteg                             |
| 3    | Anläggningar, åtta delsteg                           |
| 4    | Import Fältarbete, åtta delsteg                      |
| 5    | Nyckelregister — bara en kontroll                    |
| 6    | Varje enhet                                          |
| 7    | Återställ historiken — torrkörning, sedan skarpt     |
| 8    | Ett riktigt ärende, hela vägen                       |

Sedan *Om något ser fel ut* och *Efteråt*.

Numreringen är ny. Det som hette B0–B7 under repetitionen heter nu steg 1–8, och
de åtta delstegen i ett biblioteksavsnitt skrivs som 2.1, 2.2 och så vidare.
Gamla anteckningar med B-nummer pekar alltså ett steg fel — B1 är steg 2.

Två saker som stod i repetitionsversionen är **medvetet borttagna**, eftersom de
bara gäller en kopia och hade förvirrat i drift:

* Avsnittet om varför torrkörningens siffror kan se tomma ut i en kopia. I
  driften är `Koppling till anläggning` intakt.

* Repetitionens egna mätvärden. Ägaren får sina egna ur `Granska`.

Kvar finns däremot varningen om att `Historiska Fältarbeten` är det enda fält
som ska pekas om, och vad som händer med de trettio länkarna när det görs.

Innan filen skickas: fyll i kontaktperson och telefon på rad 6.
