# Memento Fältarbete — script

Delad JavaScript-kod för Memento Database-biblioteken **Fältarbete**,
**Anläggningar**, **Import Fältarbete** och **Nyckelregister**.

All logik bor här, i git. Memento hämtar modulerna direkt från repot via
script-editorns GitHub-koppling. Script inne i Memento krymper till en rad som
anropar en funktion. En ändring pushad hit slår igenom i **alla** bibliotek och
på **alla** enheter — ingen copy-paste.

Ny med GitHub? Läs **[GITHUB.md](GITHUB.md)** först.
Vad som ändrats och varför: **[CHANGELOG.md](CHANGELOG.md)**.

---

## Struktur

```
Generell grund — återanvändbar i vilket Memento-projekt som helst:
  mv-core.js         MV-namespace, konfiguration, text/HTML, dialoger, version
  mv-format.js       läsa och jämföra fältvärden av alla typer
  mv-db.js           skrivbara entries, säkra länkar, biblioteksnamn
  mv-logg.js         datumindelad HTML-logg

Fältarbetesprojektet:
  fa-anteckning.js   knappflödet spara/hämta anteckning
  fa-firmware.js     Firmware -> Firmware Status
  fa-faltarbete.js   skapa / ändringslogga / avsluta ett fältarbete
  fa-import.js       importflödet: hitta befintliga, lägg upp

memento/             Vad som står i respektive script inne i Memento.
  <Bibliotek>/       Versionshanterat så att git speglar appens innehåll.
  UPPSATTNING.md     checklista för uppsättningen i appen
  BORTTAGET.md       Script som ska raderas i appen

CHANGELOG.md         vad som ändrats, och varför
tools/test.js        node tools/test.js — tester mot en Memento-simulator
tools/mock.js        simulatorn
tools/stamp.js       skriver byggstämpeln i modulerna
tools/mementools.py  extract / inject / diff för .mlt2-templates
tools/push.ps1       stämpla, testa, sekretesskontrollera, commit + push
push.cmd             dubbelklicka för att pusha
.forbjudna-ord.exempel  mall för ord som aldrig får bli publika
```

**Namnprefixen är avsiktliga.** `mv-` är Miravolts generella grund; `fa-` hör
till fältarbetesprojektet. Nästa projekt får sitt eget prefix.

Modulerna ligger med flit i repots **rot**. Memento listar bara filer på
rotnivån när man lägger till repo-kopplingen — undermappar syns inte i
*Repositories*-fliken. Prefixet är därför det enda som håller roten läsbar när
fler projekt tillkommer.

**Prefixen — inte separata repon — är den organiserande principen.** Memento
klarar flera repon samtidigt (*Add GitHub Repository* kan användas flera
gånger), så en uppdelning är tekniskt möjlig. Men den köper förvånansvärt
lite och kostar konkret:

- Testsviten är **en enhet som spänner över båda lagren**. `fa-faltarbete`
  kan inte testas utan `mv-core` inläst. Delas repona måste antingen
  grundmodulerna dupliceras, git submodules införas, eller
  integrationstäckningen offras.
- Verktygslådan (`test.js`, `mock.js`, `stamp.js`, `push.ps1`,
  `mementools.py`) skulle behöva finnas på två ställen — inklusive
  sekretesskontrollen, som blir värdelös om ett av repona saknar den.
- Två push-flöden att hålla i synk i stället för ett.

Dela alltså bara om ett framtida projekt har en genuint annan livscykel eller
publik — exempelvis en kundspecifik del som måste vara privat. Fler filer i
roten är inte i sig ett skäl.

**Inga kundnamn i repot.** Varken biblioteks- eller fältnamn nämner någon kund.
Kundnamnet är suffixet i biblioteksnamnen inne i Memento och härleds vid körning
— se *Biblioteksnamn* nedan. Repot avslöjar därmed en datamodell för
elmätaruppdrag, men inte vem den är byggd för. `push.cmd` kontrollerar det före
varje push.

Repot är `github.com/Miravolt/memento-scripts`.

---

## Beroenden mellan modulerna

Ordningen i script-editorns bibliotekslista spelar roll. Ta bara med det ett
script behöver, men håll ordningen:

```
moment.min.js
mv-core.js          <- alltid, allt annat bygger på MV
mv-format.js        <- före mv-db och fa-faltarbete
mv-db.js
mv-logg.js
fa-anteckning.js    <- kräver mv-logg
fa-firmware.js
fa-faltarbete.js    <- kräver mv-format, mv-db, mv-logg
fa-import.js        <- kräver fa-faltarbete
```

Varje stub under `memento/` har sin egen lista i huvudet. Följ den.

---

## Engångsuppsättning i Memento

Följ **[memento/UPPSATTNING.md](memento/UPPSATTNING.md)** — en ordnad checklista
med exakt vilka moduler som ska bockas i för varje script, och vad som ska stå i
det.

Kort version: lägg till repot via *Add URL* → *Add GitHub Repository*, bocka i
modulerna per script, ersätt script-innehållet med stubben, och radera till sist
de gamla scripten enligt [memento/BORTTAGET.md](memento/BORTTAGET.md).

Repot måste vara publikt för att Memento ska kunna läsa filerna.

---

## Biblioteksnamn

Ett biblioteksnamn består av tre delar:

```
[prefix] BASNAMN [suffix]
 "Test "  "Fältarbete"  " Kraft AB"
```

Prefixet skiljer **test från drift**. Suffixet skiljer **kund från kund**. Koden
känner bara till basnamnen — prefix och suffix härleds vid körning ur namnet på
det bibliotek scriptet körs i:

| Scriptet körs i | Slår upp `Anläggningar` som |
|---|---|
| `Test Fältarbete Kraft AB` | `Test Anläggningar Kraft AB` |
| `Fältarbete Kraft AB` | `Anläggningar Kraft AB` |
| `Fältarbete Elnät Syd` | `Anläggningar Elnät Syd` |
| `Fältarbete` | `Anläggningar` |

Följden är att varje uppsättning bibliotek bara hittar sina egna. En testkörning
kan inte skriva i driftdata, och en kunds bibliotek kan inte nå en annan kunds.
**Ingen kod behöver ändras för en ny kund** — det räcker att biblioteken döps
konsekvent. Och inget kundnamn finns i repot.

### Namnkonventionen

Döp biblioteken `[Test ]<Basnamn> <Kund>` — t.ex. `Test Anläggningar Kraft AB`
och `Anläggningar Kraft AB`. Basnamnen ligger i `MV.config.libBaseNames`:

```
Anläggningar
Fältarbete
Import Fältarbete
Nyckelregister
```

Längsta matchning vinner, så `Import Fältarbete Kraft AB` tolkas rätt och inte
som prefixet `Import ` på basnamnet `Fältarbete`.

### Under övergången

Har inte alla bibliotek döpts om än hittas de ändå: uppslaget provar först
`prefix + basnamn + suffix`, sedan `prefix + basnamn`. Du kan alltså byta namn
ett bibliotek i taget. **Prefixet släpps aldrig** — annars hade en testkörning
kunnat nå driftbiblioteken.

### Override

```js
MV.config.libPrefix = "";           // tvinga drift
MV.config.libSuffix = " Kraft AB"; // tvinga en viss kund
MV.config.libPrefix = null;         // standard: härled automatiskt
```

En framtvingad override är exakt — den letar inte upp något annat i smyg.

---

## Koordinaternas väg genom systemet

Principen: **den mest exakta koordinaten vinner, och den bor i anläggningen.**
Importfilens koordinat är grov; en fälttekniker på plats vet bättre.

| Steg | Vad som händer |
|---|---|
| `Hitta befintliga` matchar en anläggning **med** koordinat | Anläggningens koordinat **skriver över** importradens — den är rättad på plats |
| `Hitta befintliga` matchar en anläggning **utan** koordinat | Importradens behålls på raden |
| `Lägg upp`, anläggningen saknar koordinat | Anläggningen **får** importradens, innan fältarbetet skapas |
| `Lägg upp`, anläggningen har koordinat | Rörs inte |
| `Lägg upp` skapar en **ny** anläggning | Får importradens koordinat |
| Fältarbete skapas | Kopierar anläggningens koordinat |
| **Fältarbete avslutas** | Fältarbetets koordinat **skrivs till anläggningen** — har teknikern rättat den på plats gäller den framåt |

Nettoeffekten är att koordinaten blir bättre för varje besök, och att nästa
ärende alltid startar från det senast kända läget. Varje rad i tabellen har ett
eget test märkt `AVSIKT`, så beteendet inte råkar vändas vid en framtida städning.

### Tömningsskydd

Ett **tomt** fält i fältarbetet raderar inte längre anläggningens ifyllda värde
vid avslut. Ett tomt fält betyder "inte ifyllt", inte "radera" — annars räcker
det att någon råkar rensa ett fält på telefonen för att uppgiften ska försvinna
ur anläggningen, och ett blankat kundnamn eller en borttagen koordinat syns inte
förrän någon letar efter dem.

Detta är en **beteendeförändring** mot originalkoden, där fältarbetet alltid
vann. Återgå med:

```js
MV.config.faltarbete.tillatTomningVidAvslut = true;
```

---

## Vardagen

```
1. Ändra en mv-*.js
2. Dubbelklicka push.cmd   (tester, sekretesskontroll, commit, push)
3. Memento hämtar nya versionen
```

`push.cmd` vägrar pusha om testerna failar, eller om något ord ur
`.forbjudna-ord` dyker upp i en fil eller ett filnamn. Den listan är
gitignorerad — kopiera `.forbjudna-ord.exempel` och fyll i era termer.

Steg 3 är värt att verifiera första gången: kontrollera hur din version cachar
biblioteken, och — viktigast för fältarbete — att modulerna finns lokalt när
telefonen saknar täckning. **Testa i flygplansläge innan detta går ut på en
fältenhet.**

Ändrar du undantagsvis ett script direkt i desktop-appen: exportera biblioteket
som `.mlt2`, kör `python tools/mementools.py diff` och kopiera ändringen in i git.

---

## Vilken version körs?

Varje modul avslutas med en byggstämpel som `tools/stamp.js` skriver om vid
varje push — samma byggtid för alla moduler, plus en hash per fil:

```js
// byggstämpel — skrivs av tools/stamp.js
MV.stamp("mv-core", "2026-08-20 14:32", "a1b2c3d");
```

I Memento finns en **Version**-action per bibliotek som visar `MV.about()`:

```
Bygge:   2026-08-20 14:32
Moduler: 8

mv-core        a1b2c3d
mv-format      ec8e92e
fa-faltarbete  9f8e7d6  <- AVVIKER: 2026-08-14 09:10
...
```

Det svarar på två frågor som annars är svåra att besvara ute i fält:

**Har min ändring kommit hela vägen hit?** Jämför byggtiden i appen med den i
git (`git log -1` eller titta i filen på GitHub).

**Har Memento cachat en gammal version av EN modul?** Då rapporterar just den
modulen en äldre byggtid än de andra, och raden flaggas `AVVIKER`. Utan
stämpeln är det nästan omöjligt att upptäcka — koden ser rätt ut i git, allt
verkar uppdaterat, men en modul beter sig som förr.

### Fördröjningen efter en push

*Add GitHub Repository* expanderar repot till enskilda
`raw.githubusercontent.com`-URL:er — det syns i bibliotekslistan. De URL:erna
levereras via CDN och cachas några minuter, så en push är inte omedelbart
synlig för Memento även när allt är rätt. Ser du gammal byggtid direkt efter en
push: vänta några minuter och kontrollera igen innan du börjar felsöka.

Det är också själva poängen med stämpeln — den gör fördröjningen observerbar
i stället för att du gissar.

Hashen ändras bara när koden faktiskt gjort det, så byggtiden kan flyttas fram
utan att hashen rör sig. `node tools/stamp.js --check` verifierar att stämplarna
matchar innehållet; `push.cmd` stämplar automatiskt före varje commit.

Bocka i **alla** moduler biblioteket använder i Version-actionen — annars
rapporterar den bara om de få som är ibockade.

---

## Skrivregler

Mementos JS-motor är **Rhino 1.7.15**. Modulerna hålls i ES5 så att de fungerar
oavsett var de körs:

- `var`, aldrig `let` / `const`
- `function () {}`, aldrig `=>`
- strängkonkatenering, aldrig template literals
- inget `Object.assign`, inget spread, ingen destrukturering
- `Object.keys`, `Array.prototype.forEach/map/filter` går bra

Modulerna definierar bara funktioner och konstanter — ingen kod som körs vid
inläsning, eftersom de laddas i varje script. `entry()` finns inte i alla
sammanhang, så funktionerna tar entry som argument med `entry()` som fallback.

Shims för de gamla namnen (`appendToLog`, `updateFirmwareStatus`) finns kvar, så
script som inte migrerats ännu fortsätter fungera. Ta bort shimarna när inget
anropar dem längre.

---

## Testerna

```
node tools/test.js
```

`tools/mock.js` simulerar entry, library, moment, dialog och ui. Den efterliknar
med flit två av Mementos egenheter, eftersom det är dem `mv-db.js` finns för att
hantera:

- **`COLD_CREATE`** — objektet `create()` returnerar är "kallt": `link()`
  tystnar och `field()` ser bara det man angav vid create
- **`LAZY_MAP`** — ett kartfält som just satts läses tillbaka som `null` i samma
  körning

Sätt flaggorna till `false` i mock.js för att se att testerna verkligen fångar
dem. Tester märkta `REGRESSION` failar om motsvarande bugg återinförs — verifierat.

Lägg till ett test när du hittar en bugg, innan du rättar den.

---

## tools/mementools.py

Verktyg för `.mlt2`-templates. En `.mlt2` är JSON där script ligger inbäddade
som strängar i strängar — svårt att versionshantera och omöjligt att diffa.

```bash
# Plocka ut script till .js-filer + skriv template utan kod
python tools/mementools.py extract "Raw" "Extraherade scripts" "Templates utan script"

# Vad har ändrats i appen sedan senaste commit?
python tools/mementools.py diff "Raw" "Extraherade scripts"

# Bygg ihop kompletta .mlt2-filer igen
python tools/mementools.py inject "Templates utan script" "Extraherade scripts" "Build"
```

`extract` och `inject` är exakta inverser — verifierat mot alla fyra templates.
Kräver bara Python 3, inga beroenden.

---

## Kvar att ta ställning till

- **Offline-cachning av GitHub-modulerna** — testa i flygplansläge innan detta
  går ut på en fältenhet. Det är det enda som kan sänka arkitekturen.
- **Nyckelregister-biblioteket** innehåller inga script alls. Avsiktligt?
- **Fältet `Lookup`** i Fältarbete pekar på ett bibliotek som inte finns bland de
  fyra exporterade templaterna (`libraryId: @[gC<Cjv3mgqUnDOPJQz`). Värt att
  kontrollera att det inte är en bruten referens.
- **Dubbelkodningen** i den avstängda action-dubbletten är inte Mementos
  generella teckenhantering — det aktiva knappscriptet i *samma* fil har noll
  korrupta tecken. Det är alltså specifikt för det scriptet, troligen från en
  inklistring. Eftersom det ändå ska bort spelar det ingen roll, men det betyder
  att svenska tecken i sig är ofarliga.
