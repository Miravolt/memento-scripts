# Uppsättning i Memento — checklista

Ordnad lista över vad som ska göras i appen. Gör ett bibliotek färdigt i taget.

> **Har biblioteken kopierats?** Läs [KOPIERING.md](KOPIERING.md) först.
> Länkfält binder mot bibliotekets **ID**, inte dess namn, så en kopia pekar
> fortfarande på originalet. Åtta fält behöver pekas om, annars kan en
> testkörning skriva i driftdata. Där står också vilka **Library permission**
> varje bibliotek behöver — de synkroniseras inte mellan enheter och måste
> sättas om på varje telefon och dator.

> **Nytt fält i Fältarbete: `Tidigare fältarbeten`** (Rich text, skrivskyddat
> för användaren om det går). Här skrivs sammanfattningen av anläggningens
> tidigare ärenden när ett fältarbete skapas. Saknas fältet hamnar texten i
> `Logg` i stället, så inget går förlorat — men då syns den inte lika tydligt.
>
> **Fältet `Historiska Fältarbeten` i Fältarbete ska tas bort.** Det kan inte
> fungera: ett länkfält kan inte peka på sitt eget bibliotek. Anläggningens
> `Historiska Fältarbeten` är facit och ska vara kvar.

**Bocka av under vägen.** Går något sönder mitt i är det ingen katastrof:
`appendToLog()` och `updateFirmwareStatus()` finns kvar som shims i modulerna,
så script som ännu inte migrerats fortsätter fungera.

---

## 0. En gång per bibliotek — Moduler-scriptet

Modulerna behöver **inte** bockas i på varje script. Bibliotek som är ibockade
på ett **Shared script** blir tillgängliga för alla script i biblioteket
— verifierat på både Android och desktop.

1. **Automation** → **Script** → nytt **Shared**-script, döp det `Moduler`.
2. Panelen **JavaScript Libraries** → penn-ikonen → **+ Add URL** →
   **Add GitHub Repository** → `https://github.com/Miravolt/memento-scripts`
3. Bocka i modulerna enligt `shared/Moduler.js` för det biblioteket.
4. Koden i scriptet kan vara tom. Spara.

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

---







## Fältarbete

### Moduler  
*Shared script*

**Bocka i dessa moduler här** — det är detta scripts enda syfte:

`moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-firmware.js`, `fa-faltarbete.js`

Script:

```js

```

### Config  — VALFRI, hoppa över  
*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Set Logg Datum  
*Trigger: MODIFY_ENTRY*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Logg.setDatum();
```

### Update Firmware Status (MODIFY_ENTRY)  
*Trigger: MODIFY_ENTRY*

Beroende av: `moment.min.js`, `mv-core.js`, `fa-firmware.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Firmware.syncStatus();
```

### Update Firmware Status (MODIFY_FIELD)  
*Trigger: MODIFY_FIELD*

Beroende av: `moment.min.js`, `mv-core.js`, `fa-firmware.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Firmware.syncStatus();
```

### Updating an entry - Before saving the entry  
*Trigger: MODIFY_ENTRY*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.loggaAndringar();
```

### Version  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-firmware.js`, `fa-faltarbete.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.hamta();
```

### Lagg till datum i kommentar  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.laggTillDatumIKommentar();
```

### Spara andringar och avsluta Faltarbete  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.avslutaMedDialog();
```

### Spara anteckning  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.spara();
```


## Anläggningar

### Moduler  
*Shared script*

**Bocka i dessa moduler här** — det är detta scripts enda syfte:

`moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-faltarbete.js`

Script:

```js

```

### Config  — VALFRI, hoppa över  
*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Set Logg Datum  
*Trigger: OPEN_ENTRY_CARD*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Logg.setDatum();
```

### Nytt Faltarbete  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Faltarbete.skapaMedDialog(entry(), {
    loggText: "Nytt fältarbete skapat från anläggningen."
});
```

### Version  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-faltarbete.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.hamta();
```

### Spara anteckning  
*Knappfält (ft_button)*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Anteckning.spara();
```


## Import Fältarbete

### Moduler  
*Shared script*

**Bocka i dessa moduler här** — det är detta scripts enda syfte:

`moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`

Script:

```js

```

### Config  — VALFRI, hoppa över  
*Shared script*

Behövs inte i normalfallet. Lägg bara till den om något i just detta bibliotek avviker — se filen för vad som går att sätta.

### Lagg in koordinater  
*Trigger: MODIFY_ENTRY*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.satKoordinatStatus();
```

### Hitta befintliga  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.hittaBefintliga();
```

### Lagg upp  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.Import.laggUpp();
```

### Version  
*Action*

Beroende av: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`  
*(bockas inte i här — `Moduler` bär listan. Står med som dokumentation av vad scriptet behöver.)*

Script:

```js
MV.ui.info("Version", MV.about());
```


---

## Valfritt: Config som Shared script

Behöver ett bibliotek avvika — annat fältnamn, framtvingat prefix eller suffix,
en beteendeflagga — lägg `shared/Config.js` som ett **Shared script** i det
biblioteket. Det körs för varje script där, så avvikelsen sätts en gång i
stället för i varje script.

Hoppa över detta om inget avviker, vilket är normalfallet.

---

## Sista steget: ta bort de gamla

Först när allt ovan är på plats och testat:

Se [BORTTAGET.md](BORTTAGET.md) — fyra script ska raderas i appen.

---

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
