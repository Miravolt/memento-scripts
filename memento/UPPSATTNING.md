# Uppsättning i Memento — checklista

Ordnad lista över vad som ska göras i appen. Gör ett bibliotek färdigt i taget.

**Bocka av under vägen.** Går något sönder mitt i är det ingen katastrof:
`appendToLog()` och `updateFirmwareStatus()` finns kvar som shims i modulerna,
så script som ännu inte migrerats fortsätter fungera.

---

## 0. En gång per bibliotek

1. Öppna **Automation** → välj ett script → panelen **JavaScript Libraries**
   till höger → penn-ikonen.
2. **+ Add URL** → **Add GitHub Repository** →
   `https://github.com/Miravolt/memento-scripts`
3. Repot dyker upp som en trädnod med alla moduler under sig.

Kopplingen läggs till **per script**, så modulerna måste bockas i för varje
script enligt tabellerna nedan. Repot behöver bara läggas till en gång per
bibliotek; därefter finns trädet där.

**Ordningen spelar ingen roll.** Memento laddar biblioteken alfabetiskt oavsett
i vilken ordning man bockar i dem — modulerna är byggda för att tåla det. Bocka
bara i rätt uppsättning.

---




## Fältarbete

### Version  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-firmware.js`, `fa-faltarbete.js`

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`

Script:

```js
MV.Anteckning.hamta();
```

### Lagg till datum i kommentar  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`

Script:

```js
MV.Anteckning.laggTillDatumIKommentar();
```

### Spara andringar och avsluta Faltarbete  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`

Script:

```js
(flera rader — se filen)
```

### Spara anteckning  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`

Script:

```js
MV.Anteckning.spara();
```

### Set Logg Datum  
*Trigger: MODIFY_ENTRY*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`

Script:

```js
MV.Logg.setDatum();
```

### Update Firmware Status (MODIFY_ENTRY)  
*Trigger: MODIFY_ENTRY*

Bocka i: `moment.min.js`, `mv-core.js`, `fa-firmware.js`

Script:

```js
MV.Firmware.syncStatus();
```

### Updating an entry - Before saving the entry  
*Trigger: MODIFY_ENTRY*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`

Script:

```js
MV.Faltarbete.loggaAndringar();
```

### Update Firmware Status (MODIFY_FIELD)  
*Trigger: MODIFY_FIELD*

Bocka i: `moment.min.js`, `mv-core.js`, `fa-firmware.js`

Script:

```js
MV.Firmware.syncStatus();
```


## Anläggningar

### Nytt Faltarbete  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`

Script:

```js
(flera rader — se filen)
```

### Version  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-anteckning.js`, `fa-faltarbete.js`

Script:

```js
MV.ui.info("Version", MV.about());
```

### Hamta anteckning for valt datum  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`

Script:

```js
MV.Anteckning.hamta();
```

### Spara anteckning  
*Knappfält (ft_button)*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`, `fa-anteckning.js`

Script:

```js
MV.Anteckning.spara();
```

### Set Logg Datum  
*Trigger: OPEN_ENTRY_CARD*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-logg.js`

Script:

```js
MV.Logg.setDatum();
```


## Import Fältarbete

### Hitta befintliga  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`

Script:

```js
MV.Import.hittaBefintliga();
```

### Lagg upp  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`

Script:

```js
MV.Import.laggUpp();
```

### Version  
*Action*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`

Script:

```js
MV.ui.info("Version", MV.about());
```

### Lagg in koordinater  
*Trigger: MODIFY_ENTRY*

Bocka i: `moment.min.js`, `mv-core.js`, `mv-format.js`, `mv-db.js`, `mv-logg.js`, `fa-faltarbete.js`, `fa-import.js`

Script:

```js
MV.Import.satKoordinatStatus();
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
