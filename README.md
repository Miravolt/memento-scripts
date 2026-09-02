# Memento Fältarbete — script

Delad JavaScript-kod för Memento Database-biblioteken **Fältarbete**,
**Anläggningar**, **Import Fältarbete** och **Nyckelregister**.

All logik bor här, i git. Memento hämtar modulerna direkt från repot via
script-editorns GitHub-koppling. Script inne i Memento krymper till en rad som
anropar en funktion. En ändring pushad hit gäller **alla** bibliotek och **alla**
enheter — ingen copy-paste. Den slår däremot inte igenom av sig själv: varje
enhet måste hämta om modulerna en gång, se *Vardagen*.

Ny med GitHub? Läs **[GITHUB.md](GITHUB.md)** först.
Var arbetet står just nu: **[ARBETSLAGE.md](ARBETSLAGE.md)**.
Hur verksamheten faktiskt fungerar: **[ARBETSFLODE.md](ARBETSFLODE.md)**.
Vad som ändrats och varför: **[CHANGELOG.md](CHANGELOG.md)**.
Regler och invarianter för den som — människa eller AI — ändrar i koden:
**[CLAUDE.md](CLAUDE.md)**.

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
  fa-faltarbete.js   skapa / ändringslogga / avsluta ett fältarbete, dialogtexter
  fa-import.js       importflödet: hitta befintliga, lägg upp

memento/             Vad som står i respektive script inne i Memento.
  <Bibliotek>/       Versionshanterat så att git speglar appens innehåll.
    shared/Config.js valfria avvikelser som gäller hela biblioteket
  FALT.md            genererad fältinventering — vad som finns, och av vilken typ
  UPPSATTNING.md     checklista för uppsättningen i appen
  TESTPLAN.md        vad som ska provas i appen
  DRIFTSATTNING.md   vad som krävs innan driftbiblioteken rörs, i ordning
  KOPIERING.md       vad som måste pekas om när bibliotek kopieras
  BORTTAGET.md       Script som ska raderas i appen

CLAUDE.md            regler, invarianter och Memento-sanningar som inte får
                     glömmas. Läses först av den som kommer in i arbetet.
ARBETSLAGE.md        var arbetet står, vad som är kvar, beslutslogg
ARBETSFLODE.md       arbetsflödet, statusvärdenas betydelse, planerat
CHANGELOG.md         vad som ändrats, och varför
tools/test.js        node tools/test.js — tester mot en Memento-simulator
tools/mock.js        simulatorn
tools/kontroll.js    invariantkontroll: ES5, laddningsordning, döda referenser
tools/stamp.js       skriver byggstämpeln i modulerna
tools/mementools.py  extract / inject / diff / fields för .mlt2-templates
                     (triggers, actions, shared, knappfält OCH JavaScript-fält)
tools/push.ps1       stämpla, kontrollera, testa, sekretess, commit + push
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

## Laddningsordning — och varför den inte går att styra

**Memento laddar JavaScript-biblioteken i alfabetisk ordning**, inte i den
ordning man bockar i dem. `fa-anteckning.js` körs alltså före `mv-core.js`,
trots att den bygger på `MV`.

Det upptäcktes den hårda vägen: byggstämpeln anropade `MV.stamp()`, en funktion
i `mv-core.js`, och första körningen gav

```
TypeError: Cannot find function stamp in object [object Object].
  (.../fa-anteckning.js#112)
```

Konsekvensen är en regel som gäller **all** kod här:

> Ingen modul får förutsätta att en annan redan är laddad.

Praktiskt betyder det två saker:

1. **Skriv aldrig `MV.nagot = { ... }` rakt av.** Det raderar vad en tidigare
   laddad modul lagt dit. Använd `MV.nagot = MV.nagot || {}` och
   `if (!MV.nagot.nyckel) MV.nagot.nyckel = ...`. `mv-core.js` skulle annars
   radera `MV.config.faltarbete`, eftersom den laddas efter `fa-faltarbete.js`.
2. **Anropa aldrig en funktion ur en annan modul på toppnivå.** Definiera bara.
   Anropen sker vid körning, då allt är inläst. Byggstämpeln skriver därför
   direkt i `MV.build.moduler` i stället för att anropa en funktion.

Testsviten laddar modulerna i **alfabetisk ordning** just för att köra under
appens villkor — se kommentaren i `tools/test.js`. Sorterar man om listan
"logiskt" försvinner den täckningen.

### Vilka moduler behöver vilka

Ordningen spelar alltså ingen roll, men beroendena finns:

| Modul | Bygger på |
|---|---|
| `mv-core.js` | — |
| `mv-format.js` | `mv-core` |
| `mv-db.js` | `mv-core`, `mv-format` |
| `mv-logg.js` | `mv-core` |
| `fa-anteckning.js` | `mv-core`, `mv-logg` |
| `fa-firmware.js` | `mv-core` |
| `fa-faltarbete.js` | `mv-core`, `mv-format`, `mv-db`, `mv-logg` |
| `fa-import.js` | allt ovan + `fa-faltarbete` |

Bocka i det ett script behöver — varje stub under `memento/` listar sitt eget
behov. Saknas en modul upptäcks det först vid körning, som ett
`TypeError` på det första anropet.

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

## Rena funktioner och knappversioner

Varje flöde finns i två skepnader:

| Funktion | Gör | Visar |
|---|---|---|
| `MV.Faltarbete.avsluta()` | arbetet | inget, returnerar `{ ok, reason }` |
| `MV.Faltarbete.avslutaMedDialog()` | anropar `avsluta()` | rätt dialog för varje `reason` |
| `MV.Faltarbete.skapa()` | arbetet | inget |
| `MV.Faltarbete.skapaMedDialog()` | anropar `skapa()` | dialog |

Scripten i appen anropar `...MedDialog()` och blir **en rad**. De rena
funktionerna finns kvar för batchkörningar och för testerna, som inte vill ha
dialogfönster.

Dialogtexterna ligger i `MV.Faltarbete.TEXTER` — alltså i git, inte i appen. Ska
ett bibliotek formulera sig annorlunda går de att skriva över i bibliotekets
`Config`-script:

```js
MV.Faltarbete.TEXTER.last.text = "...";
```

Tidigare låg de trettio raderna dialoghantering direkt i knappscriptet. Det var
ett misstag: texterna hörde till koden och borde ha versionshanterats med den
från början, och `fa-import.js` gjorde redan sin egen UI via `MV.ui.summary()` —
så konventionen var inkonsekvent. Ett test kontrollerar att `skapa()` och
`avsluta()` fortfarande inte visar något.

---

## Shared scripts — vad de är kvar till

Ett **Shared script** i Memento körs för varje script i biblioteket, efter att
JavaScript-biblioteken lästs in men före scriptets egen kod. Det är alltså ett
sätt att dela kod — men bara **inom ett bibliotek**.

Det är precis därför `LoggWriter` fanns i två exemplar, ett per bibliotek, och
hann glida isär. Repot löser fallet *mellan* bibliotek; Shared kunde aldrig
göra det.

Kvar har Shared **två** roller som repot inte kan ta.

### 1. Bära bibliotekslistan

Bibliotek som är ibockade på ett Shared script blir tillgängliga för **alla**
script i biblioteket. Verifierat på både Android och desktop — anropskedjan
`evaluateCommons -> evaluateLibraries` i desktoploggen visar det svart på vitt.

`memento/<Bibliotek>/shared/Moduler.js` är ett tomt Shared script vars enda
syfte är att bära listan. Ett ställe per bibliotek i stället för på arton
script, och nya script fungerar direkt.

Priset är att beroendena blir osynliga där de används. Därför står listorna
kvar i varje stubs huvud — som dokumentation av vad scriptet faktiskt behöver.
Och läggs en ny modul till i repot måste den bockas i i `Moduler`, annars syns
den inte för något script. **Version-actionen räknar modulerna**, så den
avvikelsen upptäcks där.

### 2. Avvikelser som gäller hela biblioteket

Fältnamn som skiljer sig, ett framtvingat prefix eller suffix, en
beteendeflagga. Sätts de i ett Shared script gäller de varje script i
biblioteket, utan att upprepas.

`memento/<Bibliotek>/shared/Config.js` är en färdig mall för det, med
exempelrader bortkommenterade. **Den behövs inte i normalfallet** — biblioteks-
och kundnamn härleds automatiskt och fältnamnen stämmer redan. Lägg in den när
något faktiskt avviker.

Vad som däremot **inte** hör i ett Shared script längre är logik. All kod som
mer än ett script använder ska ligga i en modul i repot, annars är vi tillbaka
i kopiorna.

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

Följden är att varje uppsättning bibliotek bara hittar sina egna. **Ingen kod
behöver ändras för en ny kund** — det räcker att biblioteken döps konsekvent.
Och inget kundnamn finns i repot.

> **Namnen räcker inte hela vägen.** `Link to entry`- och `Lookup`-fält binder
> mot bibliotekets **ID**, inte dess namn. En kopierad uppsättning pekar därför
> fortfarande på originalet, och det kan ingen kod rätta — bindningen ligger i
> bibliotekets struktur. Se [memento/KOPIERING.md](memento/KOPIERING.md) för de
> åtta fält som måste pekas om.

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
1. Ändra en mv-*.js eller fa-*.js
2. Dubbelklicka push.cmd   (stämpel, kontroll, tester, sekretess, push)
3. Tvinga Memento att hämta om — appen gör det INTE av sig själv
4. Kör Version och kontrollera att byggtiden stämmer
```

`push.cmd` vägrar pusha om testerna failar, om en invariant är bruten, eller om
något ord ur `.forbjudna-ord` dyker upp i en fil eller ett filnamn. Den listan
är gitignorerad — kopiera `.forbjudna-ord.exempel` och fyll i era termer.

**Steg 3 är ett manuellt moment, inte en väntan.** Memento återanvänder det den
redan laddat, hela appens körning. I varje bibliotek och på varje enhet:
*Automation → Script → `Moduler` →* uppdateringsikonen (den runda pilen) ovanför
modullistan. Sedan `Version`, och jämför byggtiden med den `push.cmd` skrev ut.
Stämmer den inte: se *Desktop-appen cachar modulerna* och *Fördröjningen efter
en push* nedan.

Att modulerna dessutom finns lokalt när telefonen saknar täckning är inte
verifierat. **Testa i flygplansläge innan detta går ut på en fältenhet.**

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

### Ingen enhet hämtar om av sig själv

Detta gäller **både desktop och Android**, och det är den enskilt viktigaste
driftsdetaljen i hela upplägget.

Desktop hämtar en modul en gång per appsession och återanvänder den sedan —
`Run` hämtar **inte** om. Loggen visar `Begin download script from url` vid
första körningen, och därefter inga fler nedladdningsrader trots nya körningar.

Android behåller sin version ännu envisare: en telefon har körts vidare på ett
bygge som var flera timmar gammalt, trots att appen under tiden tagit emot och
tillämpat en **strukturuppdatering** för biblioteket. Det är värt att lägga på
minnet: *Mementos egen synkronisering av bibliotekets struktur rör inte
JavaScript-biblioteken.* Att man fått notisen "strukturen har uppdaterats"
säger ingenting om vilken kod som körs.

Efter en push, på **varje** enhet och i **varje** bibliotek:

1. Öppna *Automation → Script →* **`Moduler`** — det är där bibliotekslistan
   för hela biblioteket bor — och klicka **uppdateringsknappen** vid listan i
   *JavaScript Libraries*. På desktop är det den runda pilen ovanför listan; på
   Android ligger den längst ner till höger under bibliotekslistan.
2. Kör `Version` och kontrollera byggtiden mot den `push.cmd` skrev ut.
3. Stämmer den inte: vänta några minuter (CDN, se nedan) och försök igen.

**Obekräftat:** om en omstart av appen räcker i stället för steg 1. På desktop
tömmer omstarten minnescachen och borde göra det. På Android är det tvärtom
troligt att den *inte* gör det — se nedan.

### Hur cachen fungerar — två teorier, ingen bevisad

- **A: olika mekanism per plattform.** Desktop cachar i minnet per appsession;
  Android på disk, permanent tills man uppdaterar manuellt.
- **B: cachen fylls vid första körningen.** Modulen skrivs till disk när den
  faktiskt körs, och läses därefter därifrån — på båda plattformarna.

B är sparsammare: den behöver ingen skillnad mellan plattformarna för att
förklara samma observationer. Båda förklarar varför telefonen satt kvar på ett
gammalt bygge i timmar, och varför modulerna finns offline. Båda förklarar också
varför "Android fungerade, desktop inte" en gång såg ut som en plattformsskillnad
— det var det inte, det var en cache.

Teorierna går att skilja åt, och `memento/TESTPLAN.md` avsnitt 3 beskriver hur:
uppdatera modullistan men **kör ingenting**, starta om, och se om den nya
versionen finns kvar. Enligt B ska den vara borta. Skriv in utfallet där, och
skriv om det här avsnittet när svaret finns.

### Offline fungerar — modulerna finns lokalt

`Version` har körts i **flygplansläge på telefon** och rapporterade alla **8**
moduler, ingen avvikande. Hela uppsättningen fanns alltså i den lokala cachen —
inte bara några enstaka moduler. Det var den enda risken som kunde ha sänkt hela
arkitekturen, och den är därmed i praktiken avskriven.

Vad testet inte visar: hur en **ny** enhet, eller ett nytt bibliotek, beter sig
första gången — den måste rimligen ha nät en gång för att fylla cachen. Sätt
därför upp och kör `Version` en gång med täckning innan en enhet går ut i fält.

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

`extract` och `inject` är exakta inverser — verifierat mot alla fyra templates,
inklusive JavaScript-fältens uttryck.

**Script göms på tre ställen i en `.mlt2`,** och det tredje är lätt att missa:

| Var | Vad |
|---|---|
| `triggers` | triggers, actions och shared scripts |
| `templates[i].json_options.script.script` | knappfält (`ft_button`) |
| `templates[i].cnt[].s.expr` | **JavaScript-fält** (`ft_script`) |

Det sista upptäcktes först efter att verktyget varit i bruk ett tag — fem
JavaScript-fält i Fältarbete låg ospårade. De var alla triviala alias
(`field('Anl. adress')`), så inget gick förlorat, men luckan var verklig. Samma
plats bär också fältets egen `libs`-lista.

Kräver bara Python 3, inga beroenden.

---

## Kvar att ta ställning till

- **`Nytt fältarbete krävs` och omstartsräkningen** — specificerade under
  *Planerat* i [ARBETSFLODE.md](ARBETSFLODE.md). Väntar på att pariteten är
  verifierad.
- **Offline-cachning av GitHub-modulerna** — testa i flygplansläge innan detta
  går ut på en fältenhet. Det är det enda som kan sänka arkitekturen.
- **Dubbelkodningen** i den avstängda action-dubbletten är inte Mementos
  generella teckenhantering — det aktiva knappscriptet i *samma* fil har noll
  korrupta tecken. Det är alltså specifikt för det scriptet, troligen från en
  inklistring. Eftersom det ändå ska bort spelar det ingen roll, men det betyder
  att svenska tecken i sig är ofarliga.
