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

## Vad detta är, och varför

All logik i biblioteken ligger idag som kod inklistrad i varje script, i varje
bibliotek, på varje enhet. Den koden flyttas till ett gemensamt ställe, och
scripten i appen krymper till en rad som anropar den.

Vinsten: en rättelse behöver därefter göras på **ett** ställe i stället för i
varje bibliotek.

**Detta är en engångsinsats.** Efter den här körningen sker kodändringar
utanför biblioteken.

**Nästan ingenting rör datan.** Inga entries skapas eller raderas, och inga
fältvärden skrivs om. Ett undantag: **B6**, som lägger tillbaka länkarna mellan
anläggningar och deras avslutade fältarbeten. Den körs som torrkörning först och
visar vad den skulle göra innan något skrivs, och den *lägger bara till* länkar
— aldrig tar bort. Det är också därför B0 kräver en kopia med data.

Räkna med **30–60 minuter**. Avbryt hellre mitt i än gissa — se *Om något ser
fel ut* sist.

***

## Så här är biblioteksavsnitten uppbyggda

B1 till B4 är ett bibliotek var, och alla fyra har **samma åtta steg i samma
ordning**. Ordningen följer appen: först strukturredigeraren, sedan
Automation-dialogen uppifrån och ner, och sist raderingarna.

| <br /> | Steg                         | Var i appen                                |
| ------ | ---------------------------- | ------------------------------------------ |
| 1      | Fält och länkfält            | *Edit library → Fields*                    |
| 2      | Knappfält                    | *Edit library → Fields*, i kortets ordning |
| 3      | `Moduler`                    | *Automation → Shared*                      |
| 4      | Triggers                     | *Automation → Triggers*                    |
| 5      | Actions                      | *Automation → Actions*                     |
| 6      | Permissions                  | *Automation → Permissions*, längst ner     |
| 7      | Radera de gamla scripten     | *Automation*                               |
| 8      | Kontroll innan du går vidare | `Version`                                  |

**Ett bibliotek klart i taget.** Gå inte vidare till nästa förrän steg 8 stämmer.

Ett undantag från appens ordning: `Moduler` ligger under *Shared*, alltså
nederst i Automation-listan, men görs **först**. Inget annat script fungerar
innan modulerna finns.

### Triggrarna finns redan

**Skapa inga nya triggrar.** Var och en finns redan i biblioteket — uppgiften är
att öppna den och byta ut scriptets innehåll mot enradaren. Skapas en ny ligger
den gamla koden kvar och körs parallellt.

Triggrarna står här under **sitt namn i appen**. Namnen är Mementos egna och
beskriver händelsen, inte vad scriptet gör.

`Event`-panelen har **två** val: först händelsen, sedan när i förloppet. Båda
anges nedan som `Händelse` → `Fas`. Stämmer de med det som redan står där ska
ingenting ändras — bara scriptet.

### Modullistan är densamma i alla bibliotek

**Listan står utskriven på plats i varje biblioteks steg 3** — du behöver inte
bläddra tillbaka hit. Det här är bara bakgrunden till varför den ser ut som den
gör.

Nio moduler, samma nio överallt. Att bocka i alla i alla bibliotek är avsiktligt:
en modul för mycket kostar ingenting, medan tre olika listor att hålla isär
kostar varje gång något ändras.

`moment.min.js` ligger alltid **överst**, före våra, eftersom den är Mementos
egen och intern i appen. Våra åtta sorteras i bokstavsordning under den och
heter alla `mv-*` eller `fa-*`.

**Bocka bara i dem på** **`Moduler`.** Bibliotek som bockas i på ett *Shared*-script
blir tillgängliga för alla script i biblioteket. Bockas de i på fler ställen
läses varje fil in flera gånger, och `Version` börjar rapportera 16 eller 24
moduler i stället för 8.

***

## B0. Säkerhetskopia

**Görs först. Utan den finns ingen väg tillbaka.**

Två kopior, som skyddar mot olika saker. Ta båda.

**a) En full kopia med data — görs i Android-appen.**

Detta är den kopia som kan rädda dig om något går fel. **B6** skriver länkar
mellan entries, och en strukturkopia hade inte kunnat lägga tillbaka dem.
Kopiering går bara att göra från Android; desktop kan det inte.

* [x] Långtryck på biblioteket → *Kopiera* → **struktur med data**, för vart och
  ett av de fyra biblioteken, med dagens datum i namnet

* [x] Kontrollera att kopiorna har lika många poster som originalen

**b) En template-export — desktop eller telefon.**

Template-exporten är struktur och script, ingen data. Den är den snabba vägen
tillbaka om en strukturändring blir fel. Den ersätter inte a).

* [x] För vart och ett av de fyra biblioteken: *Library menu → Export →
  Template*, med dagens datum i filnamnet

* [x] Kontrollera att alla fyra filer finns och är större än noll byte

***

## B1. Fältarbete

### 1. Fält och länkfält

> **Länkfälten är det farligaste i hela dokumentet.** De binder mot bibliotekets
> *id*, inte dess namn — ett fält kan alltså peka på ett helt annat bibliotek än
> det som står i fältets namn. Pekar ett av dem fel skrivs data på fel ställe,
> utan felmeddelande. Kontrollera vart och ett.

* [x] Lägg till ett fält som heter **`Tidigare fältarbeten`**, typ **Rich text**,
  på en egen flik

  Här skrivs sammanfattningen av anläggningens tidigare ärenden när ett nytt
  fältarbete skapas — det är så fältpersonalen ser vad som gjorts förut.
  **Steget är ett krav, inte en valmöjlighet.** Saknas fältet hamnar texten i
  `Logg` i stället; det är en nödutgång så att inget går förlorat, inte ett
  alternativ.

* [x] **`Koppling till anläggning`** → pekar på **Anläggningar** i samma
  uppsättning

* [x] **`Nyckel`** och **`Lookup`** → pekar på **Nyckelregister** i samma
  uppsättning

* [x] **`Historiska Fältarbeten`**, om det finns kvar: lämna det som det är

  Koden använder det inte längre, och det kan ändå inte fungera — ett
  länkfält kan inte peka på sitt eget bibliotek, så ett fältarbete kan aldrig
  länka till andra fältarbeten. Att den gamla pekaren ligger kvar är ofarligt.

### 2. Knappfält

**Knappfältens kod når man genom att redigera strukturen och öppna fältet** —
den ligger inte i Automation-dialogen som de andra scripten.

I kortets ordning, uppifrån och ner. Byt ut koden i vart och ett.

* [x] **`Lägg till datum i kommentar`**

  ```js
  MV.Anteckning.laggTillDatumIKommentar();
  ```

* [x] **`Spara anteckning`**

  ```js
  MV.Anteckning.spara();
  ```

* [x] **`Hämta anteckning för valt datum`**

  ```js
  MV.Anteckning.hamta();
  ```

* [x] **`Spara ändringar och avsluta Fältarbete`**

  ```js
  MV.Faltarbete.avslutaMedDialog();
  ```

### 3. Automation → Shared → `Moduler`

* [x] *Automation* → *Script* → nytt **Shared**-script, döp det `Moduler`

* [x] Panelen **JavaScript Libraries** → penn-ikonen → **+ Add URL** →
  **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`

* [x] Bocka i dessa nio. `moment.min.js` ligger **överst** — den är Mementos
  egen; våra åtta står i bokstavsordning under den.

  * [x] `moment.min.js`

  * [x] `fa-anteckning.js`

  * [x] `fa-faltarbete.js`

  * [x] `fa-firmware.js`

  * [x] `fa-import.js`

  * [x] `mv-core.js`

  * [x] `mv-db.js`

  * [x] `mv-format.js`

  * [x] `mv-logg.js`

* [x] Koden i scriptet ska vara **tom**. Spara.

* [x] Kontrollera att det bara finns **ett** script som heter `Moduler`

  *Appen hindrar inte två script med samma namn. Två* *`Moduler`* *laddar varje
  modul två gånger.*

### 4. Automation → Triggers

* [x] **`Updating a field - Before saving the entry - Update Firmware Status`**
  — `Updating a field` → `Before saving the entry`

  ```js
  MV.Firmware.syncStatus();
  ```

* [x] **`Updating an entry - Before saving the entry`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Faltarbete.loggaAndringar();
  ```

* [x] **`Updating an entry - Before saving the entry - Update Firmware Status`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Firmware.syncStatus();
  ```

  *De två ovan har samma Event och samma fas. Skilj dem åt på namnet: bara
  den här slutar med* *`- Update Firmware Status`.*

* [x] **`Set Logg Datum`**
  — `Updating an entry` → `Opening an Entry Edit card`

  ```js
  MV.Logg.setDatum();
  ```

### 5. Automation → Actions

* [x] **`Version`** — ny, typ **Library action**

  ```js
  MV.ui.info("Version", MV.about());
  ```

### 6. Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

Saknas en rättighet kastar Memento en `PermissionError` och scriptet avbryts.
Det är den vanligaste orsaken till att ett script "inte gör något". Bibliotek
som inget script rör — arkiv, kartbibliotek och liknande — lämnas obockade.

* [x] **Library permission** → **Fältarbete**, **Anläggningar**,
  **Nyckelregister** — samma uppsättning, alla tre

* [x] *Read files*, *Write files* och *Network* ska vara **obockade**

### 7. Radera de gamla scripten

Ordningen spelar ingen roll: `appendToLog()` och `updateFirmwareStatus()` finns
kvar som shims i modulerna, så inget slutar fungera mitt i.

* [x] Shared: **`LoggWriter`** — ligger nu i `mv-logg.js`

* [x] Shared: **`FirmwareSync`** — ligger nu i `fa-firmware.js`

* [x] Action: **`Flyttad till knapp - - Spara ändringar och avsluta Fältarbete`**
  — avstängd dubblett, flyttad till knappfältet

### 8. Kontroll innan du går vidare

* [x] Kör **`Version`** → **8 moduler**, samma byggtid på alla

  *Säger den 16 eller 24 är modulerna ibockade på fler än ett script. Säger
  den att någon modul AVVIKER har appen en cachad version.*

* [x] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom** — modulerna ska bara vara ibockade på
  `Moduler`

* [x] Öppna ett entry → kortet ser normalt ut

* [x] Ändra ett fält och spara → ändringen hamnar i `Logg`

***

## B2. Anläggningar

### 1. Fält och länkfält

Inga nya fält behövs här — bara kontroll av att länkfälten pekar rätt. Samma
varning som i B1 gäller: de binder mot bibliotekets *id*, inte dess namn.

* [ ] **`Aktivt Fältarbete`** och **`Historiska Fältarbeten`** → pekar på
  **Fältarbete** i samma uppsättning

* [ ] **`Nyckel`** → pekar på **Nyckelregister** i samma uppsättning

### 2. Knappfält

I kortets ordning.

* [ ] **`Spara anteckning`**

  ```js
  MV.Anteckning.spara();
  ```

* [ ] **`Hämta anteckning för valt datum`**

  ```js
  MV.Anteckning.hamta();
  ```

### 3. Automation → Shared → `Moduler`

* [ ] *Automation* → *Script* → nytt **Shared**-script, döp det `Moduler`

* [ ] Panelen **JavaScript Libraries** → penn-ikonen → **+ Add URL** →
  **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`

* [ ] Bocka i dessa nio. `moment.min.js` ligger **överst** — den är Mementos
  egen; våra åtta står i bokstavsordning under den.

  * [ ] `moment.min.js`

  * [ ] `fa-anteckning.js`

  * [ ] `fa-faltarbete.js`

  * [ ] `fa-firmware.js`

  * [ ] `fa-import.js`

  * [ ] `mv-core.js`

  * [ ] `mv-db.js`

  * [ ] `mv-format.js`

  * [ ] `mv-logg.js`

* [ ] Koden i scriptet ska vara **tom**. Spara.

* [ ] Kontrollera att det bara finns **ett** script som heter `Moduler`

  *Appen hindrar inte två script med samma namn. Två* *`Moduler`* *laddar varje
  modul två gånger.*

### 4. Automation → Triggers

* [ ] **`Set Logg Datum`**
  — `Opening an Entry View card`, i fasen **före** kortet visas

  ```js
  MV.Logg.setDatum();
  ```

  *Anläggningars* *`Set Logg Datum`* *har ett annat Event än Fältarbetes med
  samma namn. Det är avsiktligt.*

### 5. Automation → Actions

* [ ] **`Nytt Fältarbete`** — finns redan, typ **Entry action**

  ```js
  MV.Faltarbete.skapaMedDialog(entry(), {
      loggText: "Nytt fältarbete skapat från anläggningen."
  });
  ```

* [ ] **`Version`** — ny, typ **Library action**

  ```js
  MV.ui.info("Version", MV.about());
  ```

* [ ] **`Granska`** — ny, typ **Library action**. Valfri men rekommenderad.

  ```js
  MV.Faltarbete.granskaMedDialog();
  ```

  Räknar posterna och letar efter länkar som pekar ut ur uppsättningen — det
  som inte går att kontrollera för hand med hundratals anläggningar. Läser
  bara, skriver aldrig.

* [ ] **`Återställ historik`** — ny, typ **Library action**. Används i **B6**.

  ```js
  MV.Faltarbete.aterstallHistorikMedDialog();
  ```

### 6. Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

Saknas en rättighet kastar Memento en `PermissionError` och scriptet avbryts.
Det är den vanligaste orsaken till att ett script "inte gör något". Bibliotek
som inget script rör — arkiv, kartbibliotek och liknande — lämnas obockade.

* [ ] **Library permission** → **Anläggningar**, **Fältarbete**,
  **Nyckelregister**

* [ ] *Read files*, *Write files* och *Network* obockade

### 7. Radera de gamla scripten

* [ ] Shared: **`Shared_LoggWriter`** — identisk kopia av `LoggWriter`, ligger nu
  i `mv-logg.js`

### 8. Kontroll innan du går vidare

* [ ] Kör **`Version`** → **8 moduler**, samma byggtid

* [ ] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom** — modulerna ska bara vara ibockade på
  `Moduler`

* [ ] Kör **`Granska`** → den ska svara med siffror, inte med ett fel

  *Går den inte alls: kontrollera Library permission innan du letar vidare.*

***

## B3. Import Fältarbete

### 1. Fält och länkfält

* [ ] **`Befintlig`** → pekar på **Anläggningar** i samma uppsättning

### 2. Knappfält

Inga.

### 3. Automation → Shared → `Moduler`

* [ ] *Automation* → *Script* → nytt **Shared**-script, döp det `Moduler`

* [ ] Panelen **JavaScript Libraries** → penn-ikonen → **+ Add URL** →
  **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`

* [ ] Bocka i dessa nio. `moment.min.js` ligger **överst** — den är Mementos
  egen; våra åtta står i bokstavsordning under den.

  * [ ] `moment.min.js`

  * [ ] `fa-anteckning.js`

  * [ ] `fa-faltarbete.js`

  * [ ] `fa-firmware.js`

  * [ ] `fa-import.js`

  * [ ] `mv-core.js`

  * [ ] `mv-db.js`

  * [ ] `mv-format.js`

  * [ ] `mv-logg.js`

* [ ] Koden i scriptet ska vara **tom**. Spara.

* [ ] Kontrollera att det bara finns **ett** script som heter `Moduler`

  *Appen hindrar inte två script med samma namn. Två* *`Moduler`* *laddar varje
  modul två gånger.*

### 4. Automation → Triggers

* [ ] **`Lägg in koordinater`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Import.satKoordinatStatus();
  ```

### 5. Automation → Actions

* [ ] **`Hitta befintliga`** — finns redan, typ **Library action**

  ```js
  MV.Import.hittaBefintliga();
  ```

* [ ] **`Lägg upp`** — finns redan, typ **Library action**

  ```js
  MV.Import.laggUpp();
  ```

* [ ] **`Version`** — ny, typ **Library action**

  ```js
  MV.ui.info("Version", MV.about());
  ```

### 6. Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

Saknas en rättighet kastar Memento en `PermissionError` och scriptet avbryts.
Det är den vanligaste orsaken till att ett script "inte gör något". Bibliotek
som inget script rör — arkiv, kartbibliotek och liknande — lämnas obockade.

Import behöver **alla fyra** eftersom `Lägg upp` skapar anläggningen, därefter
fältarbetet, och länkar in nyckeln.

* [ ] **Library permission** → Import Fältarbete, Anläggningar, Fältarbete,
  Nyckelregister

* [ ] *Read files*, *Write files* och *Network* obockade

### 7. Radera de gamla scripten

Inga.

### 8. Kontroll innan du går vidare

* [ ] Kör **`Version`** → **8 moduler**, samma byggtid

* [ ] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom** — modulerna ska bara vara ibockade på
  `Moduler`

  *Det räcker att en enda modul ligger kvar på ett enskilt script för att
  räkningen ska bli fel. Har* *`Version`* *sagt 8 är det redan bevisat, men det
  här steget hittar en modul som är ibockad men ännu inte hunnit störa.*

***

## B4. Nyckelregister

Inga script, inga triggrar, inga knappfält, inga rättigheter.

* [ ] Kontrollera bara att de andra bibliotekens `Nyckel`-fält pekar hit, och
  inte på ett Nyckelregister i en annan uppsättning

***

## B5. Varje enhet

Två saker synkroniseras **inte** mellan enheter och måste göras på varje telefon
och varje dator som används.

En enhet som missas slutar fungera tyst medan de andra fungerar. Det är den
svåraste felkällan i hela upplägget, eftersom allt ser rätt ut tills någon
faktiskt kör något just där — gå igenom enheterna en och en och bocka av.

* [ ] **Script-permissions** godkänns — varje användare får frågan första gången
  scripten körs på sin enhet

* [ ] I `Moduler`: klicka **uppdateringsknappen** vid bibliotekslistan

  *Desktop: den runda pilen ovanför listan. Android: längst ner till höger
  under listan.*

* [ ] Kör **`Version`** med täckning och kontrollera att byggtiden stämmer med
  de andra enheterna

  *Körningen fyller också cachen, så att enheten fungerar offline efteråt.*

> **Uppdateringsknappen sitter på script-sidan, och den når bara den som äger
> biblioteket.** En vanlig användare kan alltså inte hämta in nya moduler själv,
> och ingen enhet gör det av sig själv heller. Vid den här uppsättningen är det
> inget problem — det är du som äger biblioteken. Men **varje framtida
> kodändring kan kräva att du gör om B5 på de berörda enheterna.**

***

## B6. Återställ historiken — engångskörning

Anläggningarnas `Historiska Fältarbeten` var bundet till ett gammalt bibliotek.
Följden: av 706 anläggningar har 30 en historik, och den pekar fel. De övriga 676
har ingen alls — deras avslutade ärenden finns, men kunde aldrig länkas in.

Nu när fältet pekar rätt går historiken att bygga upp igen. Varje fältarbete vet
själv vilken anläggning det hör till, så inget behöver skrivas in för hand.

**Görs i Anläggningar, efter B1 till B5.**

### Före

* [ ] Kör **`Granska`** och anteckna siffrorna: antal anläggningar, antal
  fältarbeten

* [ ] Anteckna hur många anläggningar som har en historik idag

### Torrkörning

Funktionen **lägger bara till** länkar. Den tar aldrig bort någon, och den rör
inga fältvärden. Körs den två gånger händer ingenting den andra gången.

* [ ] Kör **`Återställ historik`**. Standardläget är torrkörning — den rapporterar
  vad den *skulle* göra och skriver ingenting.

Rapporten ska stämma med detta för att vara rimlig:

| Rapporten säger               | Ska ungefär motsvara              |
| ----------------------------- | --------------------------------- |
| antal fältarbeten             | samma siffra som `Granska` gav    |
| historiklänkar att lägga till | antalet **avslutade** fältarbeten |
| aktiva länkar att lägga till  | antalet **pågående** fältarbeten  |
| redan OK                      | de som redan är länkade           |
| utan koppling                 | ska vara **noll eller nära noll** |
| misslyckade                   | ska vara **noll**                 |

* [ ] **Är "misslyckade" större än noll — stanna och säg till.** Gå inte vidare.

* [ ] Är "utan koppling" oväntat stort: det är fältarbeten som saknar
  `Koppling till anläggning`. De går inte att länka, och det är inte ett fel
  i scriptet — men det är värt att veta varför de finns.

### Skarp körning

* [ ] Ändra raden i scriptet till:

  ```js
  MV.Faltarbete.aterstallHistorikMedDialog({ skarpt: true });
  ```

* [ ] Kör igen. Rapporten ska nu visa samma siffror som torrkörningen, men som
  utfört.

### Efter

* [ ] Öppna tre eller fyra anläggningar som du vet har haft ärenden → historiken
  finns där

* [ ] Öppna en anläggning med ett pågående ärende → `Aktivt Fältarbete` pekar rätt

* [ ] Kör **`Granska`** igen → inga länkar pekar ut ur uppsättningen

* [ ] **Ändra tillbaka scriptet** till torrkörningsraden, så att en oavsiktlig
  körning i framtiden inte skriver något:

  ```js
  MV.Faltarbete.aterstallHistorikMedDialog();
  ```

***

## B7. Ett riktigt ärende

Välj **en** anläggning som har tidigare ärenden och följ den hela vägen.

* [ ] Kör `Nytt Fältarbete` → ett fältarbete skapas, och anläggningens
  `Aktivt Fältarbete` pekar på det

* [ ] `Tidigare fältarbeten` visar de gamla ärendena

* [ ] Ändra ett fält och spara → ändringen hamnar i `Logg`

* [ ] Ändra `Firmware` och spara → `Firmware Status` hamnar i `Logg`

* [ ] Avsluta ärendet → anläggningen uppdateras, ärendet låses och hamnar i
  anläggningens historik

**Sista frågan, och den enda som avgör: har något blivit sämre än förut?**

Är svaret nej är driftsättningen godkänd.

***

## Om något ser fel ut

1. **Sluta.** Rör inga fler bibliotek.
2. Ett script som går fel kastar ett felmeddelande och avbryter — det brukar
   inte hinna göra skada. Kontrollera i stället **datan**: har något entry fått
   fel värden, eller skapats där det inte hör hemma?
3. Står det något om **permission** i felet: det är steg 6 i det biblioteket.
   Det är den vanligaste orsaken.
4. Är strukturen trasig: importera template-filen från **B0 b)** igen.
5. Är datan trasig: kopian från **B0 a)** har den som den såg ut före.
6. Är ett script trasigt: klistra tillbaka den gamla koden. Den finns sparad.
7. Vill du snabbt stänga av allt: ta bort modulerna ur `Moduler`. Då slutar
   enradsscripten fungera med ett tydligt fel i stället för att göra fel sak.

Koden som hämtas utifrån kan inte göra något i sig — den kör ingenting förrän
ett script i biblioteket anropar den.

***

## Efteråt

* [ ] Ny template-export av alla fyra bibliotek, sparad som "efter"-läge

* [ ] Bestäm **vem som får ändra strukturen framöver**. Kodändringar sker utanför
  biblioteken och kräver ingen behörighet — men ett nytt fält eller ett nytt
  script gör det, och då behövs den här rundan igen.

