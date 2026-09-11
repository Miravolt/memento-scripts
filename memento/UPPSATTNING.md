# Uppsättning i Memento — checklista

Ordnad lista över vad som ska göras i appen. Gör ett bibliotek färdigt i taget.

> **Har biblioteken kopierats?** Läs [KOPIERING.md](KOPIERING.md) först.
> Länkfält binder mot bibliotekets **ID**, inte dess namn, så en kopia pekar
> fortfarande på originalet. Åtta fält behöver pekas om, annars kan en
> testkörning skriva i driftdata. Där står också vilka **Library permission**
> varje bibliotek behöver — de synkroniseras inte mellan enheter och måste
> sättas om på varje telefon och dator.

> **Nytt fält i Fältarbete:** **`Tidigare fältarbeten`** (Rich text, skrivskyddat
> för användaren om det går). Här skrivs sammanfattningen av anläggningens
> tidigare ärenden när ett fältarbete skapas. Saknas fältet hamnar texten i
> `Logg` i stället, så inget går förlorat — men då syns den inte lika tydligt.
>
> **Fältet** **`Historiska Fältarbeten`** **i Fältarbete ska tas bort.** Det kan inte
> fungera: ett länkfält kan inte peka på sitt eget bibliotek. Anläggningens
> `Historiska Fältarbeten` är facit och ska vara kvar.

**Bocka av under vägen.** Går något sönder mitt i är det ingen katastrof:
`appendToLog()` och `updateFirmwareStatus()` finns kvar som shims i modulerna,
så script som ännu inte migrerats fortsätter fungera.

***

## Läs detta först: skapa inga nya triggrar

**Varje trigger nedan finns redan i biblioteket.** Uppgiften är att öppna den
och **byta ut scriptets innehåll** mot enradaren — inte att skapa en ny. Skapas
en ny ligger den gamla koden kvar och körs parallellt, och då gör två script
samma sak med olika versioner.

Triggrarna listas här under **sitt namn i appen**, som du hittar dem i vänstra
listan under *Triggers*. Namnen är Mementos egna och beskriver händelsen, inte
vad scriptet gör — därför ser de inte ut som man väntar sig.

**`Event`-panelen har två val, inte ett.** Först händelsen, sedan när i
förloppet den ska köra:

| Övre listan — händelsen | Nedre listan — när |
| --- | --- |
| `Creating an entry` | `Opening an Entry Edit card` |
| `Updating an entry` | `Before saving the entry` |
| `Updating a field` | `After saving the entry` |
| `Opening an Entry View card` | |
| *m.fl.* | |

Varje trigger nedan anger båda, skrivna som `Händelse` → `Fas`. Stämmer de med
det som redan står i panelen ska ingenting ändras där — bara scriptet.

Står Event och fas utskrivna går det förstås att skapa en trigger från grunden
om den mot förmodan saknas. Men leta först i listan efter ett annat namn än du
väntade dig; det är precis så en dubblett uppstår.

***

## 0. En gång per bibliotek — Moduler-scriptet

Modulerna behöver **inte** bockas i på varje script. Bibliotek som är ibockade
på ett **Shared script** blir tillgängliga för alla script i biblioteket
— verifierat på både Android och desktop.

1. **Automation** → **Script** → nytt **Shared**-script, döp det `Moduler`.
2. Panelen **JavaScript Libraries** → penn-ikonen → **+ Add URL** →
   **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`
3. Bocka i modulerna enligt `shared/Moduler.js` för det biblioteket.
4. Koden i scriptet kan vara tom. Spara.

> **`moment.min.js`** **kommer inte från vårt repo.** Den är Mementos egen
> inbyggda modul och ligger i standardlistan, inte under
> `Miravolt/memento-scripts`. Den ska bockas i här precis som de andra — den
> står först i varje modullista nedan — men leta inte efter den bland våra
> filer. Alla våra moduler heter `mv-*` eller `fa-*`.
>
> Det räcker att bocka i den i `Moduler`; inget enskilt script behöver den
> ibockad separat. Samma regel som för resten av listan.

**Ordningen spelar ingen roll.** Memento laddar biblioteken alfabetiskt oavsett
i vilken ordning man bockar i dem — modulerna är byggda för att tåla det.

**Efter varje push måste modulerna hämtas om för hand** — i det här scriptet,
med uppdateringsknappen vid bibliotekslistan. Ingen enhet gör det av sig själv,
och Mementos strukturuppdatering rör inte JavaScript-biblioteken. På Android
ligger knappen längst ner till höger under listan. Kör `Version` efteråt och
jämför byggtiden med den `push.cmd` skrev ut.

Modullistorna i avsnitten nedan står kvar som **dokumentation** av vad varje
script faktiskt beror på. Du behöver inte bocka i dem script för script, men
listan visar varför en modul inte får plockas bort ur `Moduler`.

Lägger du till en ny modul i repot: bocka i den i `Moduler`, annars syns den
inte för något script. `Version` räknar modulerna, så avvikelsen upptäcks där.

***

## Fältarbete

### Moduler

*Shared script*

**Bocka i dessa här** — det är detta scripts enda syfte. **Samma lista i
alla tre biblioteken**, så det bara finns en att hålla reda på:

* [x] `moment.min.js` — **Mementos egen modul, inte vår.** Den ligger i
  standardlistan, inte under `Miravolt/memento-scripts`. Lätt att missa.

* [x] `mv-core.js`

* [x] `mv-db.js`

* [x] `mv-format.js`

* [x] `mv-logg.js`

* [x] `fa-anteckning.js`

* [x] `fa-faltarbete.js`

* [x] `fa-firmware.js`

* [x] `fa-import.js`

Nio rader att bocka i. `Version` ska sedan rapportera **8 moduler** — moment
räknas inte, den är inte vår och stämplar sig inte.

Script:

```js
```

### Config  — VALFRI, hoppa över

*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Set Logg Datum

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Updating an entry` → `Opening an Entry Edit card`

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Logg.setDatum();
```

### Updating an entry - Before saving the entry - Update Firmware Status

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Updating an entry` → `Before saving the entry`

Beroende av: `moment.min.js`, `mv-core.js`, `fa-firmware.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Firmware.syncStatus();
```

### Updating a field - Before saving the entry - Update Firmware Status

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Updating a field` → `Before saving the entry`

Beroende av: `moment.min.js`, `mv-core.js`, `fa-firmware.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Firmware.syncStatus();
```

### Updating an entry - Before saving the entry

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Updating an entry` → `Before saving the entry`

*Två triggrar i Fältarbete har samma Event och samma fas. Skilj dem åt på
namnet: den här heter bara `Updating an entry - Before saving the entry`, den
andra slutar med `- Update Firmware Status`.*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-firmware.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.loggaAndringar();
```

### Version

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-firmware.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.hamta();
```

### Lagg till datum i kommentar

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.laggTillDatumIKommentar();
```

### Spara andringar och avsluta Faltarbete

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.avslutaMedDialog();
```

### Spara anteckning

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.spara();
```

## Anläggningar

### Moduler

*Shared script*

**Bocka i dessa här** — det är detta scripts enda syfte. **Samma lista i
alla tre biblioteken**, så det bara finns en att hålla reda på:

* [ ] `moment.min.js` — **Mementos egen modul, inte vår.** Den ligger i
  standardlistan, inte under `Miravolt/memento-scripts`. Lätt att missa.

* [ ] `mv-core.js`

* [ ] `mv-db.js`

* [ ] `mv-format.js`

* [ ] `mv-logg.js`

* [ ] `fa-anteckning.js`

* [ ] `fa-faltarbete.js`

* [ ] `fa-firmware.js`

* [ ] `fa-import.js`

Nio rader att bocka i. `Version` ska sedan rapportera **8 moduler** — moment
räknas inte, den är inte vår och stämplar sig inte.

Script:

```js
```

### Config  — VALFRI, hoppa över

*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Set Logg Datum

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Opening an Entry View card`, i fasen **före** kortet visas

*Anläggningars `Set Logg Datum` har ett annat Event än Fältarbetes med samma
namn. Det är avsiktligt.*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Logg.setDatum();
```

### Nytt Faltarbete

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.skapaMedDialog(entry(), {
    loggText: "Nytt fältarbete skapat från anläggningen."
});
```

### Version

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.hamta();
```

### Spara anteckning

*Knappfält (ft\_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.spara();
```

### Aterstall historik  — ENGÅNGSKÖRNING vid driftsättning

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Bygger upp `Historiska Fältarbeten` och `Aktivt Fältarbete` från varje fältarbetes egen `Koppling till anläggning`. Körs **efter** att länkfältet pekats om. Lägger bara till länkar — tar aldrig bort någon. Standardläget är torrkörning.

Script:

```js
MV.Faltarbete.aterstallHistorikMedDialog();
```

Skarp körning, när torrkörningens rapport stämmer:

```js
MV.Faltarbete.aterstallHistorikMedDialog({ skarpt: true });
```

### Granska  — VALFRI men rekommenderad

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Räknar posterna och letar efter länkar som pekar ut ur uppsättningen — det som inte går att kontrollera för hand med hundratals anläggningar. Läser bara.

Script:

```js
MV.Faltarbete.granskaMedDialog();
```

## Import Fältarbete

### Moduler

*Shared script*

**Bocka i dessa här** — det är detta scripts enda syfte. **Samma lista i
alla tre biblioteken**, så det bara finns en att hålla reda på:

* [ ] `moment.min.js` — **Mementos egen modul, inte vår.** Den ligger i
  standardlistan, inte under `Miravolt/memento-scripts`. Lätt att missa.

* [ ] `mv-core.js`

* [ ] `mv-db.js`

* [ ] `mv-format.js`

* [ ] `mv-logg.js`

* [ ] `fa-anteckning.js`

* [ ] `fa-faltarbete.js`

* [ ] `fa-firmware.js`

* [ ] `fa-import.js`

Nio rader att bocka i. `Version` ska sedan rapportera **8 moduler** — moment
räknas inte, den är inte vår och stämplar sig inte.

Script:

```js
```

### Config  — VALFRI, hoppa över

*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Lägg in koordinater

*Trigger — **finns redan**, byt bara ut scriptet.*\
**Event:** `Updating an entry` → `Before saving the entry`

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.satKoordinatStatus();
```

### Hitta befintliga

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.hittaBefintliga();
```

### Lagg upp

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.laggUpp();
```

### Version

*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`\
*(bockas inte i här —* *`Moduler`* *bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```

***

## Valfritt: Config som Shared script

Behöver ett bibliotek avvika — annat fältnamn, framtvingat prefix eller suffix,
en beteendeflagga — lägg `shared/Config.js` som ett **Shared script** i det
biblioteket. Det körs för varje script där, så avvikelsen sätts en gång i
stället för i varje script.

Hoppa över detta om inget avviker, vilket är normalfallet.

***

## Sista steget: ta bort de gamla

Först när allt ovan är på plats och testat:

Se [BORTTAGET.md](BORTTAGET.md) — fyra script ska raderas i appen.

***

## Verifiera

1. Kör **Version**-actionen i varje bibliotek. Byggtiden ska matcha den i git,
   och ingen modul ska flaggas `AVVIKER`.
   Direkt efter en push kan byggtiden vara några minuter gammal —
   `raw.githubusercontent.com` cachas via CDN. Vänta och kolla igen.
2. Kör igenom hela varvet i testbiblioteken:
   import → hitta befintliga → lägg upp → fältarbete → avsluta → nytt fältarbete.
   Kontrollera särskilt att **historiken syns i det nya fältarbetet** — det var
   den ursprungliga buggen.
3. **Flygplansläge på en telefon.** Fungerar scripten utan täckning? Det är det
   enda som kan sänka hela arkitekturen, och det måste vara klart innan detta
   går ut på en fältenhet.

