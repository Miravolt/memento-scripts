# CLAUDE.md — läs detta först, varje gång

Instruktioner till en AI-assistent som arbetar i det här repot. Filen finns för
att en chatt kan tappa minnet mitt i arbetet (kontexten komprimeras), och för
att samma misstag inte ska behöva göras två gånger.

**Om du är en assistent som just kommit in i det här arbetet: läs, i denna
ordning, innan du ändrar något.**

1. `CLAUDE.md` — den här filen. Regler och invarianter.
2. `ARBETSLAGE.md` — var arbetet står just nu, och vad som är nästa steg.
3. `README.md` — arkitekturen.
4. `ARBETSFLODE.md` — vad verksamheten faktiskt gör. Läs innan du föreslår
   något som ändrar beteende.
5. `memento/KOPIERING.md` — fällorna i appen (länkfält, permissions).

Först därefter koden. Att läsa en modul och gissa resten har kostat oss tid
förr.

---

## Del 1 — Sanningar om Memento som inte får glömmas

Var och en av dessa är dyrköpt. De syns inte i koden, och de går inte att
härleda — de är uppmätta i appen.

| Sanning | Följd |
|---|---|
| **Memento laddar JS-bibliotek i ALFABETISK ordning**, inte i den ordning man bockar i dem | `fa-*` laddas före `mv-core.js`. Ingen modul får förutsätta att en annan är laddad. Se invariant I1. |
| **Rhino 1.7.15 = ES5** | Ingen `let`/`const`, inga arrow functions, inga template literals, inget `Object.assign`, inget `Array.includes`, inget `for...of`. Invariant I2. |
| **Bibliotek ibockade på ett *Shared*-script blir tillgängliga för alla script i biblioteket** | Därför finns `Moduler` som Shared script — ett ställe per bibliotek. Verifierat på både Android och desktop. |
| **Desktop-appen cachar hämtade moduler i minnet hela app-sessionen** | `Run` hämtar inte om. Refresh-ikonen i script-editorn, eller omstart, krävs. *Detta har två gånger sett ut som en Android/desktop-skillnad — det är det inte.* |
| **`Link to entry`- och `Lookup`-fält binder mot bibliotekets ID, inte namnet** | En kopia pekar fortfarande på originalet. `mv-db.js` namnmekanik hjälper INTE här. Se `memento/KOPIERING.md`. |
| **Script-permissions synkroniseras inte mellan enheter** | Måste sättas per bibliotek *och* per telefon/dator. Ser identiskt ut i `Version` på båda. |
| **Ett kartfält som just skrivits läses tillbaka som null i samma körning** | Därför sätts koordinatstatus från källvärdet, inte från fältet. Reproduceras i mocken av flaggan `LAZY_MAP`. |
| **Entries direkt från `create()`, `find()` eller ett länkfält är inte fullt skrivbara** | Hämta om med `findById()`. Det är hela poängen med `mv-db.js`. Mockens flagga `COLD_CREATE`. |

Hittar du en ny sådan sanning: **skriv in den i tabellen i samma veva som du
använder den.** Inte efteråt.

---

## Del 2 — Invarianter. Bryts de går något sönder tyst

**I1 — Allt på toppnivå ska vara additivt och deklarativt.**
Alfabetisk laddning betyder att en modul kan köras före den den bygger på.

```js
MV.config = MV.config || {};                       // ja
if (!MV.config.fields) MV.config.fields = { ... };  // ja
MV.config = { fields: { ... } };                    // NEJ — raderar
MV.stamp("mv-core");                                // NEJ — anrop på toppnivå
```

Anropa aldrig en annan moduls funktion på toppnivå. Definiera bara; anropen
sker vid körning, när allt är inläst. Byggstämpeln skriver därför direkt i
arrayen i stället för att anropa en funktion.

**I2 — ES5. Ingen modernare syntax, någonsin.** `tools/kontroll.js` stoppar det.

**I3 — Repot är publikt. Inga kundnamn, personnamn eller adresser.**
Kundnamnet härleds vid körning ur biblioteksnamnet (`MV.db.affix()`), så det
behöver aldrig stå i koden. `.forbjudna-ord` är gitignorerad och kontrolleras
före varje push. *Detta kom till efter att ett kundnamn nådde ett publikt repo
via README — Jimmy hittade det, inte jag.*

**I4 — Testerna laddar modulerna i alfabetisk ordning. Sortera inte om listan.**
Den ordningen är själva testet av I1. Står i en kommentar i `tools/test.js`
också, men värt att upprepa.

**I5 — Byter en fil namn, eller tillkommer en: fyra ställen ska uppdateras.**
`tools/test.js`, `memento/UPPSATTNING.md`, `memento/<bibliotek>/shared/Moduler.js`
och `README.md`. `tools/kontroll.js` kontrollerar att de är i synk. *Detta är
misstaget där fyra döda `mv-*.js` pushades: jag döpte om filerna i min egen
kopia och glömde att bryggan inte kan radera filer hos Jimmy.* Första gången
kontrollen kördes på riktigt hittade den femton kvarglömda `mv-`-referenser i
`memento/`-stubbarna från samma omdöpning — de hade rättats i arbetskopian men
aldrig skrivits till disk. Regeln räckte inte; kontrollen gjorde det.

**I6 — Ett existerande beteende ändras inte utan att Jimmy sagt ja.**
Även när det ser ut som en bugg. Koordinatprioriteringen "rättade" jag åt fel
håll en gång; det var ett verksamhetsbeslut, inte ett kodbeslut. Sådant
beteende låses med ett test märkt `AVSIKT`, så nästa förbättring inte river det.

**I7 — Buggrättningar får ett test märkt `REGRESSION`.** Ingen rättning är
klar utan ett test som fallerar om buggen återinförs.

**I8 — Påstå aldrig en orsak som inte är bevisad.**
Skriv "detta förklarar symptomet" eller "detta är skydd, inte bevisad
rättning". *Jag utpekade en gång kalla `create()`-entries som orsaken till att
historiken försvann; den verkliga orsaken var länkfält som pekade på ett gammalt
testbibliotek. Fel diagnos, rätt symptom, och en kod­ändring som såg ut som en
lösning.* Se kommentarhuvudet i `mv-db.js` för hur det ska formuleras.

---

## Del 3 — Arbetssätt

### Innan du säger att något är klart

```
node tools/stamp.js --check     # stämplar aktuella och hash stämmer
node tools/kontroll.js          # invarianterna I1, I2, I5 + döda referenser
node tools/test.js              # alla tester gröna
```

Alla tre. Sedan, och först då:

1. Skriv filerna till Jimmys disk via bryggan (`device_commit_files`). *En fil
   som bara finns i containern finns inte.* Containern töms när sessionen dör.
2. Leverera dem också med `SendUserFile` så de syns i chatten.
3. **Ge honom ett commit-meddelande.** Han har uttryckligen bett om det, varje
   gång något är pushfärdigt. Kort, imperativ svenska, en rad.
4. Uppdatera `ARBETSLAGE.md` och `CHANGELOG.md` i samma leverans.

### Bryggan har två begränsningar som har bitit oss

- **Den kan inte radera filer hos Jimmy.** Döps en fil om måste han köra
  `git rm` själv — säg till uttryckligen, annars pushas den döda filen med.
- **Containern och hans disk är två olika filsystem.** Redigerar du i
  containern har det inte hänt hos honom förrän du skrivit över bryggan.

### Aldrig scriptad sök-och-ersätt utan att först verifiera träffen

*Jag förstörde `tools/test.js` en gång — 5,3 miljoner rader — med ett
Python-script som räknade ut `end < start`, fick en tom söksträng, och
`s.replace("", new)` sköt in text mellan varje tecken.* Filen räddades bara
för att den fanns kvar på Jimmys disk.

Använd `Edit` med exakt sträng. Skriver du ändå ett script: hävda antalet
träffar först, och avbryt om det inte stämmer.

### Ton och språk

Svenska, i kod, kommentarer, dokumentation och chatt. Koncist. Jimmy är ny på
git men läser kod utan problem och hittar mina fel — ta hans invändningar på
allvar i stället för att försvara valet. *Han hade rätt om de 30 raderna
dialogkod i knappscriptet; mitt lagerargument höll inte.*

Kommentarer förklarar **varför**, inte vad. Modulhuvudena i `mv-db.js` och
`mv-core.js` är måttstocken.

---

## Del 4 — Vad ligger var

Ändra inte den här strukturen utan att uppdatera listan.

```
mv-*.js              generell grund, kundneutral, återanvändbar
  mv-core.js         MV-namnrymden, config, text/HTML, dialoger, MV.about()
  mv-format.js       läsa och jämföra fältvärden av alla Memento-typer
  mv-db.js           bibliotek- och entry-åtkomst, namnhärledning, länkning
  mv-logg.js         datumindelad HTML-logg i ett Rich text-fält

fa-*.js              projektet fältarbete
  fa-faltarbete.js   skapa / logga ändringar / avsluta
  fa-import.js       importfilen -> anläggning + fältarbete
  fa-anteckning.js   anteckningsfältet
  fa-firmware.js     firmwarestatus

tools/
  test.js            202 tester. REGRESSION = buggen får inte tillbaka.
                     AVSIKT = beteendet är beslutat, riv det inte.
  mock.js            Memento-simulator. Flaggorna COLD_CREATE och LAZY_MAP
                     återskapar appens egenheter med flit.
  kontroll.js        invariantkontroll — I1, I2, I5, döda doc-referenser
  stamp.js           byggstämplar; --check verifierar hash mot innehåll
  mementools.py      extract / inject / diff för .mlt2-filer
  push.ps1           git-check -> stämpel -> kontroll -> tester ->
                     sekretess -> visa diff -> commit + push

memento/             det som ska göras i appen, inte kod som körs
  UPPSATTNING.md     checklista + all scriptkod att klistra in
  KOPIERING.md       länkfält och permissions efter en kopiering
  BORTTAGET.md       script som ska raderas i appen
  <Bibliotek>/       stubbar per bibliotek

ARBETSLAGE.md        var arbetet står. Uppdateras varje leverans.
CHANGELOG.md         vad som ändrats, plus "Bakgrund" med buggarnas historia
ARBETSFLODE.md       verksamhetens flöde, statusvärden, planerat
GITHUB.md            git för nybörjare
README.md            arkitektur
```

`.mlt2` bär script på **tre** ställen — `triggers`,
`templates[i].json_options.script.script` (knappfält, är en JSON-sträng inuti
JSON) och `templates[i].cnt[].s.expr` (JavaScript-fält, med egen `libs`-array).
Missar man ett hittar man bara 3 av 5 script, vilket har hänt.

---

## Del 5 — Beslut som står fast

Ändra inte dessa på eget initiativ. De är avvägda, och några av dem ser
felaktiga ut utan sin motivering.

| Beslut | Varför |
|---|---|
| Ett repo, `memento-scripts`, prefix `mv-` / `fa-` | Delade repon kostar mer än de ger så länge allt versioneras ihop. Prefixen gör en framtida delning enkel. |
| Repot är publikt | Memento kräver det för att kunna hämta modulerna. Därav I3. |
| Kundnamn som *suffix* i biblioteksnamnet, härlett vid körning | Ny kund kräver ingen kodändring, och repot innehåller inga kundnamn. |
| Prefixet släpps aldrig i `MV.db.lib()` | Annars kan en testkörning nå driftbiblioteken. |
| Knappscript är en rad; dialogtexterna bor i modulen | Texterna hör i git. `MV.Faltarbete.TEXTER` går att skriva över per bibliotek. |
| `tillatTomningVidAvslut = false` som standard | Ett tomt fält i fältarbetet ska inte radera anläggningens ifyllda värde. |
| Anläggningens koordinat vinner över importens; avslut skriver tillbaka | Verksamhetsbeslut från Jimmy. Låst med `AVSIKT`-test. |
| Shims (`appendToLog`, `updateFirmwareStatus`) behålls | Icke-migrerade script i appen ska fortsätta fungera under omställningen. |
| `Läser i CM` och `Åter till nätägare` behandlas som ömsesidigt uteslutande | Uppmätt: 678 fältarbeten i drift, noll med båda. |

---

## Del 6 — Är parity nått?

Ordningen är bestämd: **först samma beteende som förr, men med alla script i
git. Sedan optimering och utseende.** Föreslå inte widgets, dialoger eller
förfining innan `ARBETSLAGE.md` säger att parity är verifierad. Det som ändå
är värt att göra sedan står under *Planerat* i `ARBETSFLODE.md` — parkera nya
idéer där i stället för att bygga dem.
