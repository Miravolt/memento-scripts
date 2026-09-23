# Körschema — scripten flyttas till ett gemensamt ställe

Det här dokumentet är hela arbetet, i den ordning det ska göras. Följ det
uppifrån och ner. Du behöver inget annat dokument.

Under körningen finns `<kontaktperson>` anträffbar på `<telefon>`.

***

## Vad detta är, och varför

All logik i biblioteken ligger idag som kod inklistrad i varje script, i varje
bibliotek, på varje enhet. Den koden flyttas till ett gemensamt ställe, och
scripten i appen krymper till en rad som anropar den.

Vinsten: en rättelse behöver därefter göras på **ett** ställe i stället för i
varje bibliotek.

**Detta är en engångsinsats.** Efter den här körningen sker kodändringar utanför
biblioteken.

**Nästan ingenting rör datan.** Inga entries skapas eller raderas, och inga
fältvärden skrivs om. Ett undantag: **steg 7**, som lägger tillbaka länkarna
mellan anläggningar och deras avslutade fältarbeten. Den körs som torrkörning
först och visar vad den *skulle* göra innan något skrivs, och den *lägger bara
till* länkar — aldrig tar bort. Det är också därför steg 1 kräver en kopia med
data.

Räkna med **30–60 minuter**. Avbryt hellre mitt i än gissa — se *Om något ser
fel ut* sist.

### Det du behöver

* Du måste vara **ägare** till biblioteken. Script-sidan och dess
  uppdateringsknapp når ingen annan.

* En **Android-telefon** till säkerhetskopian i steg 1. Desktop kan inte kopiera
  ett bibliotek.

* Internet under körningen. Modulerna hämtas en gång per enhet och ligger sedan
  kvar i appen, så offline-arbete fungerar efteråt.

* Allt görs **i appen**. Inga externa verktyg, ingen kommandorad, ingenting att
  installera.

***

## Så här är biblioteksstegen uppbyggda

Steg 2 till 4 är ett bibliotek var, och alla tre har **samma åtta delsteg i
samma ordning**. Ordningen följer appen: först strukturredigeraren, sedan
Automation-dialogen uppifrån och ner, och sist raderingarna.

| Delsteg | Vad                          | Var i appen                                |
| ------- | ---------------------------- | ------------------------------------------ |
| .1      | Fält och länkfält            | *Edit library → Fields*                    |
| .2      | Knappfält                    | *Edit library → Fields*, i kortets ordning |
| .3      | `Moduler`                    | *Automation → Shared*                      |
| .4      | Triggers                     | *Automation → Triggers*                    |
| .5      | Actions                      | *Automation → Actions*                     |
| .6      | Permissions                  | *Automation → Permissions*, längst ner     |
| .7      | Radera de gamla scripten     | *Automation*                               |
| .8      | Kontroll innan du går vidare | `Version`                                  |

**Ett bibliotek klart i taget.** Gå inte vidare till nästa förrän delsteg .8
stämmer.

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

**Listan står utskriven på plats i varje biblioteks delsteg .3** — du behöver
inte bläddra tillbaka hit. Det här är bara bakgrunden till varför den ser ut som
den gör.

Nio moduler, samma nio överallt. Att bocka i alla i alla bibliotek är
avsiktligt: en modul för mycket kostar ingenting, medan tre olika listor att
hålla isär kostar varje gång något ändras.

`moment.min.js` ligger alltid **överst**, före våra, eftersom den är Mementos
egen och intern i appen. Våra åtta sorteras i bokstavsordning under den och
heter alla `mv-*` eller `fa-*`.

**Bocka bara i dem på** **`Moduler`.** Bibliotek som bockas i på ett
*Shared*-script blir tillgängliga för alla script i biblioteket. Bockas de i på
fler ställen läses varje fil in flera gånger, och `Version` börjar rapportera 16
eller 24 moduler i stället för 8.

***

# Steg 1. Säkerhetskopia

**Görs först. Utan den finns ingen väg tillbaka.**

Två kopior, som skyddar mot olika saker. Ta båda.

**a) En full kopia med data — görs i Android-appen.**

Detta är den kopia som kan rädda dig om något går fel. **Steg 7** skriver länkar
mellan entries, och en strukturkopia hade inte kunnat lägga tillbaka dem.
Kopiering går bara att göra från Android; desktop kan det inte.

* [ ] Långtryck på biblioteket → *Kopiera* → **struktur med data**, för vart och
  ett av de fyra biblioteken, med dagens datum i namnet

* [ ] Kontrollera att kopiorna har lika många poster som originalen

**b) En template-export — desktop eller telefon.**

Template-exporten är struktur och script, ingen data. Den är den snabba vägen
tillbaka om en strukturändring blir fel. Den ersätter inte a).

* [ ] För vart och ett av de fyra biblioteken: *Library menu → Export →
  Template*, med dagens datum i filnamnet

* [ ] Kontrollera att alla fyra filer finns och är större än noll byte

***

# Steg 2. Fältarbete

## 2.1 Fält och länkfält

> **Länkfälten är det farligaste i hela dokumentet.** De binder mot bibliotekets
> *id*, inte dess namn — ett fält kan alltså peka på ett helt annat bibliotek än
> det som står i fältets namn. Pekar ett av dem fel skrivs data på fel ställe,
> utan felmeddelande. Kontrollera vart och ett.

* [ ] Lägg till ett fält som heter **`Tidigare fältarbeten`**, typ **Rich text**,
  på en egen flik

  Här skrivs sammanfattningen av anläggningens tidigare ärenden när ett nytt
  fältarbete skapas — det är så fältpersonalen ser vad som gjorts förut, och om
  de gamla ärendena har bilder. **Steget är ett krav, inte en valmöjlighet.**
  Saknas fältet hamnar texten i `Logg` i stället; det är en nödutgång så att
  inget går förlorat, inte ett alternativ.

* [ ] **`Koppling till anläggning`** → pekar på **Anläggningar**

  Det här fältet ska **inte** pekas om. Kontrollera bara att det stämmer. Det är
  ur de här kopplingarna som steg 7 bygger historiken, och att peka om ett
  länkfält kastar allt som ligger i det.

* [ ] **`Nyckel`** och **`Lookup`** → pekar på **Nyckelregister**

* [ ] **`Historiska Fältarbeten`**, om det finns kvar: lämna det som det är

  Koden använder det inte längre, och det kan ändå inte fungera — ett länkfält
  kan inte peka på sitt eget bibliotek, så ett fältarbete kan aldrig länka till
  andra fältarbeten. Att den gamla pekaren ligger kvar är ofarligt.

## 2.2 Knappfält

**Knappfältens kod når man genom att redigera strukturen och öppna fältet** —
den ligger inte i Automation-dialogen som de andra scripten.

I kortets ordning, uppifrån och ner. Byt ut koden i vart och ett.

* [ ] **`Lägg till datum i kommentar`**

  ```js
  MV.Anteckning.laggTillDatumIKommentar();
  ```

* [ ] **`Spara anteckning`**

  ```js
  MV.Anteckning.spara();
  ```

* [ ] **`Hämta anteckning för valt datum`**

  ```js
  MV.Anteckning.hamta();
  ```

* [ ] **`Spara ändringar och avsluta Fältarbete`**

  ```js
  MV.Faltarbete.avslutaMedDialog();
  ```

## 2.3 Automation → Shared → `Moduler`

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

## 2.4 Automation → Triggers

* [ ] **`Updating a field - Before saving the entry - Update Firmware Status`**
  — `Updating a field` → `Before saving the entry`

  ```js
  MV.Firmware.syncStatus();
  ```

* [ ] **`Updating an entry - Before saving the entry`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Faltarbete.loggaAndringar();
  ```

* [ ] **`Updating an entry - Before saving the entry - Update Firmware Status`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Firmware.syncStatus();
  ```

  *De två ovan har samma Event och samma fas. Skilj dem åt på namnet: bara
  den här slutar med* *`- Update Firmware Status`.*

* [ ] **`Set Logg Datum`**
  — `Updating an entry` → `Opening an Entry Edit card`

  ```js
  MV.Logg.setDatum();
  ```

## 2.5 Automation → Actions

* [ ] **`Version`** — ny, typ **Library action**

  ```js
  MV.ui.info("Version", MV.about());
  ```

## 2.6 Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

Saknas en rättighet kastar Memento en `PermissionError` och scriptet avbryts.
Det är den vanligaste orsaken till att ett script "inte gör något". Bibliotek
som inget script rör — arkiv, kartbibliotek och liknande — lämnas obockade.

* [ ] **Library permission** → **Fältarbete**, **Anläggningar**,
  **Nyckelregister** — alla tre

* [ ] *Read files*, *Write files* och *Network* ska vara **obockade**

## 2.7 Radera de gamla scripten

Ordningen spelar ingen roll: `appendToLog()` och `updateFirmwareStatus()` finns
kvar som shims i modulerna, så inget slutar fungera mitt i.

* [ ] Shared: **`LoggWriter`** — ligger nu i `mv-logg.js`

* [ ] Shared: **`FirmwareSync`** — ligger nu i `fa-firmware.js`

* [ ] Action: **`Flyttad till knapp - - Spara ändringar och avsluta Fältarbete`**
  — avstängd dubblett, flyttad till knappfältet

## 2.8 Kontroll innan du går vidare

* [ ] Kör **`Version`** → **8 moduler**, samma byggtid på alla

  *Säger den 16 eller 24 är modulerna ibockade på fler än ett script. Säger
  den att någon modul AVVIKER har appen en cachad version.*

* [ ] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom** — modulerna ska bara vara ibockade på
  `Moduler`

* [ ] Öppna ett entry → kortet ser normalt ut

* [ ] Ändra ett fält och spara → ändringen hamnar i `Logg`

***

# Steg 3. Anläggningar

## 3.1 Fält och länkfält

Inga nya fält behövs här. Samma varning som i 2.1 gäller: länkfälten binder mot
bibliotekets *id*, inte dess namn.

* [ ] **`Aktivt Fältarbete`** → pekar på **Fältarbete**

* [ ] **`Historiska Fältarbeten`** → pekar på **Fältarbete**

  Det här är **det enda fält som faktiskt ska pekas om**. Idag pekar det på ett
  gammalt bibliotek. De trettio länkar som finns i det försvinner när fältet
  pekas om — det är känt och avsiktligt: steg 7 bygger upp historiken igen, den
  här gången för alla anläggningar i stället för trettio. Ingen data går
  förlorad, bara länkarna, och de gamla posterna finns redan som riktiga
  fältarbeten i driften.

* [ ] **`Nyckel`** → pekar på **Nyckelregister**

## 3.2 Knappfält

I kortets ordning.

* [ ] **`Spara anteckning`**

  ```js
  MV.Anteckning.spara();
  ```

* [ ] **`Hämta anteckning för valt datum`**

  ```js
  MV.Anteckning.hamta();
  ```

## 3.3 Automation → Shared → `Moduler`

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

## 3.4 Automation → Triggers

* [ ] **`Set Logg Datum`**
  — `Opening an Entry View card`, i fasen **före** kortet visas

  ```js
  MV.Logg.setDatum();
  ```

  *Anläggningars* *`Set Logg Datum`* *har ett annat Event än Fältarbetes med
  samma namn. Det är avsiktligt.*

## 3.5 Automation → Actions

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

* [ ] **`Granska`** — ny, typ **Library action**

  ```js
  MV.Faltarbete.granskaMedDialog();
  ```

  Räknar posterna och letar efter länkar som pekar ut ur uppsättningen — det
  som inte går att kontrollera för hand med hundratals anläggningar. Läser
  bara, skriver aldrig. Den används i steg 7 och är inte valfri där.

* [ ] **`Återställ historik`** — ny, typ **Library action**. Används i steg 7.

  ```js
  MV.Faltarbete.aterstallHistorikMedDialog();
  ```

## 3.6 Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

* [ ] **Library permission** → **Anläggningar**, **Fältarbete**,
  **Nyckelregister**

* [ ] *Read files*, *Write files* och *Network* obockade

## 3.7 Radera de gamla scripten

* [ ] Shared: **`Shared_LoggWriter`** — identisk kopia av `LoggWriter`, ligger nu
  i `mv-logg.js`

## 3.8 Kontroll innan du går vidare

* [ ] Kör **`Version`** → **8 moduler**, samma byggtid

* [ ] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom**

* [ ] Kör **`Granska`** → den ska svara med siffror, inte med ett fel

  *Går den inte alls: kontrollera Library permission innan du letar vidare.*

* [ ] Anteckna siffrorna. De behövs i steg 7.

***

# Steg 4. Import Fältarbete

## 4.1 Fält och länkfält

* [ ] **`Befintlig`** → pekar på **Anläggningar**

## 4.2 Knappfält

Inga.

## 4.3 Automation → Shared → `Moduler`

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

## 4.4 Automation → Triggers

* [ ] **`Lägg in koordinater`**
  — `Updating an entry` → `Before saving the entry`

  ```js
  MV.Import.satKoordinatStatus();
  ```

## 4.5 Automation → Actions

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

## 4.6 Automation → Permissions

Panelen sitter **längst ner** i script-listan, under *Logs*.

Import behöver **alla fyra** eftersom `Lägg upp` skapar anläggningen, därefter
fältarbetet, och länkar in nyckeln.

* [ ] **Library permission** → Import Fältarbete, Anläggningar, Fältarbete,
  Nyckelregister

* [ ] *Read files*, *Write files* och *Network* obockade

## 4.7 Radera de gamla scripten

Inga.

## 4.8 Kontroll innan du går vidare

* [ ] Kör **`Version`** → **8 moduler**, samma byggtid

* [ ] Öppna **varje** script i biblioteket och kontrollera att panelen
  *JavaScript Libraries* är **tom**

  *Det räcker att en enda modul ligger kvar på ett enskilt script för att
  räkningen ska bli fel. Har* *`Version`* *sagt 8 är det redan bevisat, men det
  här steget hittar en modul som är ibockad men ännu inte hunnit störa.*

***

# Steg 5. Nyckelregister

Biblioteket får inga script, inga triggrar, inga knappfält och inga rättigheter.
Det enda som behövs är en kontroll, och den tar en halv minut.

* [ ] Kontrollera att de andra bibliotekens `Nyckel`-fält pekar hit, och inte på
  ett Nyckelregister i en annan uppsättning

***

# Steg 6. Varje enhet

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
> kodändring kan kräva att du gör om steg 6 på de berörda enheterna.**

***

# Steg 7. Återställ historiken — engångskörning

Anläggningarnas `Historiska Fältarbeten` var bundet till ett gammalt bibliotek.
Följden: av 706 anläggningar har 30 en historik, och den pekar fel. De övriga 676
har ingen alls — deras avslutade ärenden finns, men kunde aldrig länkas in.
*(Uppmätt i en kopia av Anläggningar 9 sep 2026.)*

Nu när fältet pekar rätt går historiken att bygga upp igen. Varje fältarbete vet
själv vilken anläggning det hör till, så inget behöver skrivas in för hand.

**Görs i Anläggningar, efter steg 1 till 6.**

## 7.1 Före

* [ ] Kör **`Granska`** och anteckna siffrorna: antal anläggningar, antal
  fältarbeten

* [ ] Anteckna hur många anläggningar som har en historik idag

## 7.2 Torrkörning

Funktionen **lägger bara till** länkar. Den tar aldrig bort någon, och den rör
inga fältvärden. Körs den två gånger händer ingenting den andra gången.

* [ ] Kör **`Återställ historik`**. Standardläget är torrkörning — den
  rapporterar vad den *skulle* göra och skriver ingenting.

Rapportens rader, ord för ord som de står på skärmen, och vad var och en ska
vara för att vara rimlig:

| Raden i rapporten                | Ska motsvara                      |
| -------------------------------- | --------------------------------- |
| `Genomgångna fältarbeten`        | samma siffra som `Granska` gav    |
| `Redan rätt länkade`             | de som redan är länkade           |
| `Skulle läggas till i historiken` | antalet **avslutade** fältarbeten |
| `Skulle sättas som aktivt`       | antalet **pågående** fältarbeten  |
| `Utan koppling till anläggning`  | **noll eller nära noll**          |
| `Koppling till okänd anläggning` | **noll**                          |

Rapporten avslutas med `Stämmer detta? Kör om med { skarpt: true }.` Gå igenom
de fyra frågorna nedan innan du gör det.

* [ ] **Står det något om att länkningar MISSLYCKADES — stanna och säg till.**
  Den raden visas bara när det faktiskt hänt något. Gå inte vidare.

* [ ] **Är `Utan koppling till anläggning` lika med antalet fältarbeten —
  stanna.** Då finns inga kopplingar alls, och det är aldrig normalt i drift.
  Rapporten säger det själv med en OBS-rad. Kör inte skarpt; säg till.

* [ ] Är den siffran liten men inte noll: det är enstaka fältarbeten som saknar
  `Koppling till anläggning`. De går inte att länka, och det är inget fel i
  scriptet — men det är värt att veta varför de finns.

* [ ] Är `Koppling till okänd anläggning` större än noll: kopplingen finns men
  anläggningen gick inte att hämta. Det är ett länkfält som pekar fel, eller en
  rättighet som saknas — inte tom data. Stanna och säg till.

## 7.3 Skarp körning

* [ ] Ändra raden i scriptet till:

  ```js
  MV.Faltarbete.aterstallHistorikMedDialog({ skarpt: true });
  ```

* [ ] Kör igen. Rapporten ska nu visa samma siffror som torrkörningen, men som
  utfört.

## 7.4 Efter

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

# Steg 8. Ett riktigt ärende

Välj **en** anläggning som har tidigare ärenden och följ den hela vägen.

* [ ] Kör `Nytt Fältarbete` → ett fältarbete skapas, och anläggningens
  `Aktivt Fältarbete` pekar på det

* [ ] `Tidigare fältarbeten` visar de gamla ärendena, och säger vilka av dem som
  har bilder

* [ ] Ändra ett fält och spara → ändringen hamnar i `Logg`

* [ ] Ändra `Firmware` och spara → `Firmware Status` hamnar i `Logg`

* [ ] Lägg till en bild och spara → `Logg` säger att bilden tillkommit

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
3. Står det något om **permission** i felet: det är delsteg .6 i det
   biblioteket. Det är den vanligaste orsaken.
4. Är strukturen trasig: importera template-filen från **steg 1 b)** igen.
5. Är datan trasig: kopian från **steg 1 a)** har den som den såg ut före.
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
