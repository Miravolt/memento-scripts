# Driftsättning

Det här dokumentet är i två delar, för att arbetet delas mellan två personer:

- **Del A — förberedelserna.** Görs av den som byggt scripten, i egna kopior av
  biblioteken. Inget av detta rör driften.
- **Del B — körschemat.** Görs av den som **äger** driftbiblioteken. Del B är
  skriven för att kunna följas av någon som inte varit med i arbetet.

Del B kan inte påbörjas förrän Del A är avbockad.

---

# Del A — förberedelser i kopiorna

## A1. En sluten kopieuppsättning

Kopiera alla bibliotek som ingår: **Anläggningar, Fältarbete, Import
Fältarbete, Nyckelregister**. Ge dem alla **exakt samma suffix**, t.ex.
`Anläggningar <Kund> Copy 2026-09-09`.

Suffixet är inte kosmetik. Koden härleder vilken uppsättning den arbetar i ur
namnet på det bibliotek den körs i, så lika suffix håller kopiorna för sig
själva. Blandade suffix gör att en körning i kopian kan nå driften.

- [ ] Alla fyra kopior har samma suffix
- [ ] Exportera dem som `.mlt2` och kör:

      python tools/mementools.py links "Raw"

- [ ] **Varje länkfält pekar på en kopia**, inte på ett driftbibliotek

> En kopia ärver länkfältens mål från originalet, alltså driften. De måste
> pekas om för hand — och kontrolleras med verktyget, inte med minnet. Att gå
> igenom dem för hand och tro att man tagit alla är precis så det blev fel från
> början.

## A2. Mät hur driften ser ut — utan att röra den

En kopia bevarar länkarna som de var i driften. Det är enda sättet att se
driftens tillstånd utan rättigheter i den.

- [ ] Gör en **ny, orörd** kopia av driftens Anläggningar. Peka inte om något.
- [ ] Exportera dess entries till CSV med fälten `Anl. adress`, `Tjänst`,
      `Aktivt Fältarbete`, `Historiska Fältarbeten`
- [ ] Kontrollera vad `Historiska Fältarbeten` innehåller

**Är kolumnen tom överallt** har historiklänkningen aldrig fungerat — då ligger
ingen data fel, och det räcker att peka om.

**Innehåller den poster** ligger de i ett annat bibliotek än driftens
Fältarbete. Då krävs ett beslut om dataflytt innan Del B påbörjas.

> Mät på en **ny** kopia. Har man redan pekat om länkfälten i en kopia är
> spåren av vad som var länkat borta där — ompekning kastar länkarna.

### Utfall 9 sep 2026 — fall B

| | |
|---|---|
| Anläggningar i driften | 706 |
| …med en historiklänk | **30** |
| …vars länk pekar in i det gamla testbiblioteket | **30 av 30** |
| …med ett aktivt fältarbete | 11 |
| …vars aktiva länk pekar fel | **0** |

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

- [ ] Del B genomförd i kopiorna, från början till slut
- [ ] Ett helt ärende: skapa → ändra → avsluta → nytt ärende med historik
- [ ] `TESTPLAN.md` genomgången, avvikelser antingen rättade eller medvetet
      accepterade

## A4. Underlag till ägaren

- [ ] Den här filen, `memento/UPPSATTNING.md` (all scriptkod att klistra in)
      och `memento/KOPIERING.md` (rättigheter per bibliotek)
- [ ] En tid avtalad, och en person som är anträffbar under körningen

---

# Del B — körschema för den som äger biblioteken

## Vad detta är, och varför

All logik i biblioteken ligger idag som kod inklistrad i varje script, i varje
bibliotek, på varje enhet. Den koden flyttas till ett gemensamt ställe, och
scripten i appen krymper till en rad som anropar den.

Vinsten: en rättelse behöver därefter göras på **ett** ställe i stället för i
varje bibliotek, och den når alla enheter utan att någon rör appen.

**Detta är en engångsinsats.** Efter den här körningen sker kodändringar
utanför biblioteken och kräver inga rättigheter i dem. Det är bara själva
uppsättningen som kräver dig.

**Datan rörs inte.** Inga entries skapas, ändras eller raderas i något steg
nedan. Allt handlar om struktur och script.

Räkna med **30–60 minuter**. Avbryt hellre mitt i än gissa — se *Om något ser
fel ut* sist.

---

## B0. Säkerhetskopia

**Görs först. Utan den finns ingen väg tillbaka.**

- [ ] För vart och ett av de fyra biblioteken: *Library menu → Export →
      Template*. Spara filen med dagens datum i namnet.
- [ ] Kontrollera att alla fyra filer finns och är större än noll byte

En template-export innehåller **struktur och script, inte data**. Går något
sönder i strukturen går den att lägga tillbaka. Det är också därför inget steg
nedan får röra entries.

---

## B1. Strukturändringar

Ett bibliotek i taget. Öppna ett entry efteråt och se att kortet ser normalt ut.

### Fältarbete

- [ ] Lägg till ett fält som heter **`Tidigare fältarbeten`**, typ **Rich text**

      **Detta steg är ett krav, inte en valmöjlighet.** Här skrivs en
      sammanfattning av anläggningens tidigare ärenden när ett nytt fältarbete
      skapas — det är så fältpersonalen ser vad som gjorts förut. Lägg det på
      en egen flik.

      Saknas fältet hamnar texten i `Logg` i stället. Det är en nödutgång så
      att inget går förlorat, inte ett alternativ: i loggen blandas den med
      allt annat och fyller inte sitt syfte.

- [ ] Kontrollera fältet **`Koppling till anläggning`** → ska peka på
      **Anläggningar** i samma uppsättning
- [ ] Kontrollera **`Nyckel`** och **`Lookup`** → ska peka på
      **Nyckelregister** i samma uppsättning
- [ ] Fältet **`Historiska Fältarbeten`** kan lämnas som det är.
      *Koden använder det inte längre, och det kan ändå inte fungera: ett
      länkfält kan inte peka på sitt eget bibliotek, så ett fältarbete kan
      aldrig länka till andra fältarbeten. Att den gamla pekaren ligger kvar
      är ofarligt.*

### Anläggningar

- [ ] **`Aktivt Fältarbete`** och **`Historiska Fältarbeten`** → ska peka på
      **Fältarbete** i samma uppsättning
- [ ] **`Nyckel`** → **Nyckelregister** i samma uppsättning

### Import Fältarbete

- [ ] **`Befintlig`** → **Anläggningar** i samma uppsättning

### Nyckelregister

Inget att göra.

> **Länkfälten är det farligaste i hela dokumentet.** De binder mot
> bibliotekets *id*, inte dess namn — ett fält kan alltså peka på ett helt
> annat bibliotek än det som står i fältets namn. Pekar ett av dem fel skrivs
> data på fel ställe, utan felmeddelande. Kontrollera vart och ett.

---

## B2. Script

Ordningen spelar roll: `Moduler` måste finnas innan de andra scripten byts.

Gör detta i **Fältarbete**, **Anläggningar** och **Import Fältarbete**.
Nyckelregister har inga script.

### a) Moduler-scriptet

- [ ] **Automation → Script → nytt Shared-script**, döp det **`Moduler`**
- [ ] I panelen **JavaScript Libraries**: penn-ikonen → **+ Add URL** →
      **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`
- [ ] Bocka i de moduler som `memento/UPPSATTNING.md` anger för just det
      biblioteket
- [ ] Koden i scriptet ska vara **tom**. Spara.

Ordningen man bockar i dem spelar ingen roll — appen laddar dem alfabetiskt
oavsett, och koden är byggd för det.

### b) Rättigheter

- [ ] **Permissions → Library permission**: bocka i de bibliotek som
      `memento/KOPIERING.md` anger för just det biblioteket

Utan detta får scripten inte läsa i de andra biblioteken, och felen som uppstår
ser inte ut som rättighetsfel — de ser ut som att biblioteket inte finns.

### c) Byt scripten mot enradarna

- [ ] Ersätt innehållet i varje script med raden som står i
      `memento/UPPSATTNING.md` för det scriptet
- [ ] Lägg till en action som heter **`Version`** med raden som står där

### d) Kontroll innan du går vidare

- [ ] Kör **`Version`**. Den ska visa **8 moduler** och ingen rad märkt
      `AVVIKER`

Visar den färre moduler är något inte ibockat i `Moduler`. Visar den `AVVIKER`
har appen en gammal kopia av en modul — klicka uppdateringsknappen vid
bibliotekslistan i `Moduler` och kör igen.

### e) Radera de gamla scripten

**Sist.** De står listade i `memento/BORTTAGET.md`.

Under tiden fungerar både gammalt och nytt. Men ligger det gamla
`LoggWriter`-scriptet kvar samtidigt som den nya koden körs kan samma händelse
loggas två gånger — stanna inte i det läget längre än nödvändigt.

---

## B2b. Återställ historiken — engångskörning

Anläggningarnas `Historiska Fältarbeten` var bundet till ett gammalt bibliotek.
Följden: av 706 anläggningar har 30 en historik, och den pekar fel. De övriga
676 har ingen alls — deras avslutade ärenden finns, men kunde aldrig länkas in.

Nu när fältet pekar rätt går historiken att bygga upp igen. Varje fältarbete vet
själv vilken anläggning det hör till, så inget behöver skrivas in för hand.

**Görs i Anläggningar, efter B1 och B2.**

- [ ] Kör actionen **`Återställ historik`**. Den gör en **torrkörning** och
      rapporterar vad den *skulle* göra — den skriver ingenting.
- [ ] Läs rapporten. Rimliga siffror? Ungefär lika många historiklänkar som det
      finns avslutade fältarbeten, och lika många aktiva som det finns pågående.
- [ ] Stämmer det: ändra raden i scriptet till
      `MV.Faltarbete.aterstallHistorikMedDialog({ skarpt: true });` och kör igen
- [ ] Öppna några anläggningar och kontrollera att historiken ser rätt ut

Funktionen **lägger bara till** länkar. Den tar aldrig bort någon, och den rör
inga fältvärden. Kör man den två gånger händer ingenting den andra gången.

Rapporterar den *misslyckade länkningar* — säg till innan du går vidare.

---

## B3. Varje enhet

Två saker synkroniseras **inte** mellan enheter och måste göras på varje
telefon och varje dator som används:

- [ ] **Library permission** enligt B2b
- [ ] I `Moduler`: klicka **uppdateringsknappen** vid bibliotekslistan
      *(desktop: den runda pilen ovanför listan. Android: längst ner till höger
      under listan.)*
- [ ] Kör **`Version`** och kontrollera att byggtiden stämmer med de andra
      enheterna

En enhet som missas slutar fungera tyst medan de andra fungerar. Det är den
svåraste felkällan i hela upplägget, eftersom allt ser rätt ut tills någon
faktiskt kör något just där.

> **Uppdateringsknappen sitter på script-sidan, och den når bara den som äger
> biblioteket.** En vanlig användare kan alltså inte hämta in nya moduler
> själv, och ingen enhet gör det av sig själv heller. Vid den här
> uppsättningen är det inget problem — det är du som äger biblioteken och gör
> det här steget. Men det betyder att **varje framtida kodändring kan kräva
> att du gör om B3 på de berörda enheterna**. Räkna med det när ni planerar
> rättningar, och säg till användarna att höra av sig om `Version` visar att
> bygget är gammalt.

---

## B4. Ett riktigt ärende

Välj **en** anläggning som har tidigare ärenden och följ den hela vägen.

- [ ] Kör `Nytt Fältarbete` → ett fältarbete skapas, och anläggningens
      `Aktivt Fältarbete` pekar på det
- [ ] `Tidigare fältarbeten` visar de gamla ärendena
- [ ] Ändra ett fält och spara → ändringen hamnar i `Logg`
- [ ] Avsluta ärendet → anläggningen uppdateras, ärendet låses och hamnar i
      anläggningens historik

**Sista frågan, och den enda som avgör: har något blivit sämre än förut?**

Är svaret nej är driftsättningen godkänd.

---

## Om något ser fel ut

1. **Sluta.** Rör inga fler bibliotek.
2. Ett script som går fel kastar ett felmeddelande och avbryter — det brukar
   inte hinna göra skada. Kontrollera i stället **datan**: har något entry
   fått fel värden, eller skapats där det inte hör hemma?
3. Är strukturen trasig: importera template-filen från **B0** igen.
4. Är ett script trasigt: klistra tillbaka den gamla koden. Den finns sparad.
5. Vill du snabbt stänga av allt: ta bort modulerna ur `Moduler`. Då slutar
   enradsscripten fungera med ett tydligt fel i stället för att göra fel sak.

Koden som hämtas utifrån kan inte göra något i sig — den kör ingenting förrän
ett script i biblioteket anropar den.

---

## Efteråt

- [ ] Ny template-export av alla fyra bibliotek, sparad som "efter"-läge
- [ ] Bestäm **vem som får ändra strukturen framöver**. Kodändringar sker
      utanför biblioteken och kräver ingen behörighet — men ett nytt fält
      eller ett nytt script gör det, och då behövs den här rundan igen.
