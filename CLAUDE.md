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
| **En ny version av Memento kan sluta köra script som fungerade dagen innan** | Desktop **3.11.0 stoppade ägarens befintliga script**; de började fungera igen först med 3.11.1, som kom strax efter (ägaren via Jimmy, 6 nov 2026 — rapporterat, symptomet inte utrett av oss). Både Jimmy och ägaren installerar alltid senaste version, och Android uppdaterar sig självt. **Plattformen under oss är alltså rörlig och kan gå sönder utan att vi rört något.** Två följder: slutar allt fungera samtidigt i alla bibliotek är appversionen första misstänkta, inte vår kod — och ju mer välbeprövad syntax vi håller oss till, desto mindre yta har vi mot sådana regressioner. Det är numera huvudskälet till I2. |
| **Motorn klarar nästan hela ES6 — gränsen går på ett absurt smalt ställe** | Uppmätt på desktop 3.11.1 den 6 nov 2026: `let`, `const`, pilfunktioner, template literals, spread och `for...of` **parsas alla**. Det enda som fälls är **`const` i ett for-huvud** — `for (const v of arr)` ger `syntax error` i `Parser.forLoopInit`, medan `for (var v of arr)` går igenom och `const` som vanlig sats också gör det. Raden hette tidigare "Rhino 1.7.15 = ES5"; det var fel och hade aldrig mätts. Vi använder ändå inget av det — se I2, där skälet numera är driftrisk och inte motorgräns. |
| **Bibliotek ibockade på ett *Shared*-script blir tillgängliga för alla script i biblioteket** | Därför finns `Moduler` som Shared script — ett ställe per bibliotek. Verifierat på både Android och desktop. |
| **Ingen enhet hämtar om moduler av sig själv — varken desktop eller Android** | En push slår igenom först när man klickar uppdateringsknappen i `Moduler`-scriptet, per bibliotek och per enhet. Skriv aldrig att en push "når enheterna" av sig själv; det gör den inte. *Detta har två gånger sett ut som en Android/desktop-skillnad — det är det inte.* |
| **Bara bibliotekets ägare kommer åt script-sidan — och därmed uppdateringsknappen** | Jimmys observation 11 sep. En vanlig användare har alltså inget känt sätt att tvinga fram nya moduler på sin egen enhet. Kombinerat med raden ovan betyder det att en fälttekniker varken uppdaterar automatiskt *eller* manuellt. Skriv aldrig en text som säger åt användaren att "uppdatera modullistan" — se `MV.config.byggVarningAtgard`. Vad som *händer* när ägaren uppdaterar på sin enhet, och om det når andras, är omätt. |
| **Mementos strukturuppdatering rör inte JavaScript-biblioteken** | En telefon har tagit emot och tillämpat en strukturuppdatering och ändå fortsatt köra ett flera timmar gammalt bygge. Notisen "strukturen har uppdaterats" säger ingenting om vilken kod som körs. |
| **Modulerna finns lokalt och fungerar offline** | `Version` har körts i flygplansläge på telefon och rapporterade alla **8** moduler, ingen avvikande — hela uppsättningen fanns alltså i cachen. Detta var den enda risken som kunde ha sänkt hela arkitekturen. Obesvarat: om cachen fylls vid nedladdningen eller vid **första körningen** av modulen. Se `memento/TESTPLAN.md` avsnitt 3. |
| **Ett `Link to entry`-fält kan inte peka på sitt eget bibliotek** | Ett entry kan alltså inte länka till andra entries i samma bibliotek — Memento erbjuder inte det egna biblioteket i mållistan, och wikin skriver "a link to an entry or to entries in **another** library". Observerat i appen 31 aug. Detta förklarar varför `Historiska Fältarbeten` i drift pekade på ett gammalt test-Fältarbete: det var det enda målet fältet kunde få. |
| **`Link to entry`- och `Lookup`-fält binder mot bibliotekets ID, inte namnet** | En kopia pekar fortfarande på originalet. `mv-db.js` namnmekanik hjälper INTE här. Se `memento/KOPIERING.md`. |
| **Script-permissions deklareras i strukturen men godkänns per enhet** | Ägaren bockar i vilka rättigheter scripten begär; **varje användare får en fråga första gången scripten körs på sin enhet** och godkänner då (Jimmy 11 sep). En ny rättighet kostar alltså en dialogruta per enhet, inte en expedition i inställningarna — och den är *inte* ägarlåst, till skillnad från själva script-sidan. Det gör `Network` och fil billigare att lägga till än vi trodde. Godkännandet synkas inte; ser identiskt ut i `Version` på båda plattformarna. |
| **`http().get()` används synkront** — `var r = http().get(url)` — och kräver `Network`-permission | Scriptet står still tills svaret kommer. Aldrig i en trigger: det blockerar varje sparning när täckningen saknas. Dokumentationen säger dessutom "must be executed asynchronously in the last Phase of an Event" utan att förklara vad det betyder. |
| **Ett kartfält som just skrivits läses tillbaka som null i samma körning** | Därför sätts koordinatstatus från källvärdet, inte från fältet. Reproduceras i mocken av flaggan `LAZY_MAP`. |
| **`lib()` returnerar samma objekt vid varje anrop i en körning** | Uppmätt 11 sep: `lib() === lib()` är `true`. Följden är en fälla — sätter man en egenskap på det (`lib().notes = x`) skapas en vanlig JS-egenskap i minnet, och nästa `lib().notes` läser tillbaka den. Det *ser* ut som att skrivningen nådde databasen. Den gjorde det inte. Läs alltid tillbaka i en **ny körning** innan du tror på en skrivning. |
| **`for (var k in lib())` ger noll nycklar** | Bibliotek och entries är Java-objekt bakom en Rhino-brygga, inte JS-objekt. Egenskaper går att läsa men inte räkna upp. En tom nyckellista är alltså *inget bevis* för att en egenskap saknas — man måste fråga efter den vid namn. |
| **Att peka om ett länkfält raderar alla länkar i det** | Uppmätt två gånger. En kopia med data behåller länkarna — men i samma stund som fältets målbibliotek ändras är de borta, för alla poster. Följden för en generalrepetition: kopior vars länkfält pekats om har **all fältdata kvar men inga kopplingar mellan poster**. `Återställ historik` rapporterade därför 786 fältarbeten och 786 utan koppling 23 sep, vilket läste som *inget att göra* men betydde *ingenting att arbeta med*. |
| **Ett bibliotek går bara att kopiera från Android-appen** | Långtryck på biblioteket → *Kopiera* → struktur, eller struktur med data. Desktop kan det inte (Jimmy 11 sep). Varje gång ett dokument säger "gör en kopia" är det alltså ett telefonsteg, oavsett var resten av arbetet sker. |
| **Android och desktop har olika strukturvyer** | *Edit library* på telefonen har bara MAIN, FIELDS, AGGREGATION, AUTOFILL och NOTES. Desktop har därtill Relations, **Connectors**, Advanced options, Entry Appearance och Calendar. Uppmätt 11 sep. Antag aldrig att något man ser i desktopstrukturen går att nå från telefonen. |
| **Script kan skriva filer på enheten — men filen är lokal** | `file(namn)` med läs/skriv-permission; på Android måste användaren dessutom peka ut en mapp i behörighetsdialogen. Bra som cache, **värdelöst som spridningsväg**: en fil på Jimmys dator når aldrig en telefon. Det finns bara två kanaler ut till enheterna — Mementos datasynk (ett entry) och nätet. |
| **Att FÅNGA ett fel från Memento kan i sig krascha scriptet** | Saknas `Library permission` kastar appen en `PermissionError`. Rhino kan inte bygga catch-scopet för en felklass den inte känner till och dör med `No enum constant ...NativeErrors.PermissionError` — en Java-stacktrace i loggen i stället för Mementos egen rättighetsdialog. *Uppmätt 15 sep 2026: `Återställ historik` kördes utan rättighet till Fältarbete och kraschade i sitt eget `catch`.* Se invariant I10. |
| **Två Shared-script kan heta exakt samma sak** | Appen hindrar det inte. Två `Moduler` i samma bibliotek laddar varje modul två gånger; `Version` rapporterade 16 i stället för 8. Uppmätt i Import Fältarbete 15 sep. Byggstämpeln är den enda satsen på toppnivå som inte är idempotent, så det är räkningen som avslöjar det — `MV.about()` pekar numera ut dubbletterna. |
| **Java-åtkomsten är blockerad** | `lib().getClass()` kastar. Ingen reflektion, inga `Packages.*`, inget `java.io`. Följden är att **det dokumenterade API:t är hela API:t** — det finns inget sätt att ta reda på vad som egentligen finns. Står en egenskap inte i dokumentationen och svarar `undefined` är frågan avgjord; leta inte vidare. |
| **En dialogs knappkod körs asynkront, och kan köras som en NY instans av scriptet** | Jimmys erfarenhet av Mementos dialoger, 23 sep. Två följder: `show()` kan returnera direkt, så allt som ska hända måste ligga i knappens callback och inget efter anropet — och callbacken kan sakna den anropande körningens variabler, så den får inte bära med sig entry-handtag, listor eller opts. Skriv den som ett anrop som hämtar sitt eget underlag på nytt. Se invariant I12 och `MV.ui.fraga()`. Om en dialog kan visas ovanpå en annan är **omätt**; kvittera med `message()` inifrån en callback. |
| **JS-motorn är INTE densamma på alla enheter** | Android 5.9.0 (9 juli 2026) uppdaterade till **Rhino 1.9.1**; desktop nämner ingen motoruppdatering men kör ändå något betydligt nyare än 1.7.15 — stacktracen visar `nullishCoalescingExpr` och `expExpr`, metoder som inte finns i gamla Rhino. Vad varje enhet faktiskt kör är alltså okänt, och olika. Det är hela skälet till att I2 inte släpps: nivån bestäms av den äldsta appen i uppsättningen, inte av din. |
| **Android-apparna uppdaterar sig själva, desktop gör det inte** | Telefonerna går till senaste officiella versionen automatiskt så snart den lämnat release candidate (Jimmy 6 nov 2026). Det betyder att **telefonflottan är enhetlig och ny**, medan desktop uppdateras när var och en väljer det — och ägarens dator är en annan maskin än Jimmys. Den som är äldst i en uppsättning är alltså sannolikt en dator, inte en telefon. |
| **Dialoger renderar inte tecken utanför Latin-1** | `→` (U+2192) kom ut som `?` i en `dialog()` på desktop 3.11.1, 6 nov 2026. Svenska bokstäver — `åäöÅÄÖ` — renderas korrekt i samma ruta, så det är inte teckenkodningen utan teckensnittet eller Mementos egen hantering av symboler. **Håll dig till ASCII plus svenska bokstäver i allt som går till `dialog()`, `ui().text()` eller `message()`.** Skriv `->`, inte `→`. I *Rich text*-fält är läget ett annat: `✔` och `·` har använts i loggen och historiken hela projektet utan att någon rapporterat fel — men det är frånvaro av klagomål, inte en mätning. |
| **`message()` försvinner efter några sekunder** | Duger för en kvittens, inte för något man ska läsa. Allt med mer än en rad ska visas med `MV.ui.info()` / `dialog()`, som står kvar tills man trycker OK. Gäller i synnerhet mätscript. |
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

**I2 — håll dig till ES5-nivån, även där motorn klarar mer.**
`tools/kontroll.js` stoppar det. Regeln ifrågasattes 6 nov 2026 och överlevde,
men **motiveringen har ändrats** — läs den innan du tar upp frågan igen.

**Vad som faktiskt är uppmätt, desktop 3.11.1, 6 nov 2026.** Ett syntaxprov
kördes som eget script. Felet kom på **rad 7**:

```
org.mozilla.javascript.EvaluatorException: syntax error (Action 4.js#7)
	... at org.mozilla.javascript.Parser.forLoopInit(Parser.java:1778)
```

| Rad | Konstruktion | Utfall |
|---|---|---|
| 1 | `let a = 1;` | **parsas** |
| 2 | `const b = 2;` | **parsas** |
| 4 | `var pil = (x) => x + 1;` | **parsas** |
| 5 | `` var mall = `a är ${a}`; `` | **parsas** |
| 6 | `var arr = [...[1, 2]];` | **parsas** |
| 7 | `for (const v of arr) { ... }` | **SYNTAXFEL** |
| 7 | `for (var v of arr) { ... }` | **parsas** |

Parsern hann alltså till rad 7. Motorn är **inte** ren ES5 — den gamla hade
dött på rad 1. Stacktracen nämner dessutom `nullishCoalescingExpr` och
`expExpr`, metoder som inte finns i gammal Rhino. Påståendet "Rhino 1.7.15 =
ES5" som stod i sanningstabellen var alltså fel, och hade aldrig mätts.

**Gränsen är avgjord, och den är löjligt smal.** Samma rad med `var` i stället
för `const` går igenom. `for...of` fungerar alltså — det är **`const` i
for-huvudet** som inte gör det, trots att `const` som vanlig sats fungerar på
rad 2. Stacken pekade rätt hela tiden: `forLoopInit`.

Av allt vi förbjuder är det alltså **en enda konstruktion** som bevisligen
fälls på desktop 3.11.1, och det är den som ingen skulle gissa på.

**Och ändå står regeln kvar. Skälen är inte tekniska:**

- **Gränsen ligger där ingen letar.** Allt vi ville ha fungerar utom `const` i
  ett for-huvud — en konstruktion som ser fullkomligt normal ut, som ingen
  linter varnar för, och som man skriver utan att tänka. Det är inte en gräns
  man håller sig innanför av vana; det är en mina.
- **Ett parsfel dödar allt.** Inte bara raden — hela modulen, och därmed varje
  script i biblioteket som bygger på den. Tyst tills någon trycker på en knapp.
- **Plattformen kan gå sönder av sig själv.** Desktop 3.11.0 stoppade ägarens
  script tills 3.11.1 kom. Alla enheter följer senaste version, så en dålig
  utgåva når hela flottan. Konservativ syntax är den enda yta vi styr över.
- **Vinsten är kosmetisk.** ES5 har inte kostat oss något på hela projektet.

**Den sista okända enheten är numera mätt, och svaret vände argumentet.**
Ägaren kör också 3.11.1 och uppdaterar alltid till senaste version. Hela
flottan ligger alltså på en motor som klarar nästan hela ES6, och den tekniska
invändningen mot att släppa I2 är därmed borta.

Men samma svar bar med sig något viktigare: **ägaren körde en period på 3.11.0,
och då slutade hans befintliga script fungera.** De kom tillbaka först med
3.11.1. En punktutgåva av appen tog alltså sönder fungerande kod, utan att
någon rört koden.

Det gör "alla kör senaste version" till en risk i stället för en garanti.
Plattformen under oss rör sig, den kan gå sönder, och vi får veta det efteråt.
Den enda yta vi styr över är hur mycket av språket vi lutar oss mot — och ju
mer välbeprövad syntax, desto mindre att träffa. **Det är numera huvudskälet
till I2, och det är starkare än det tekniska argument som just försvann.**

Skulle regeln ändå släppas någon gång är ordningen **en konstruktion i taget**,
med `const` och `let` först, och raden tas bort ur `forbjudet` i
`tools/kontroll.js` i samma veva. `const` i ett for-huvud förblir förbjudet
oavsett — det är mätt och fungerar inte.

**Syntaxprovet, för den som vill köra om det.** Eget, tomt script i en kopia:

```js
let a = 1;
const b = 2;
var f = function (x) { return x + b; };
var pil = (x) => x + 1;
var mall = `a är ${a}`;
var arr = [...[1, 2]];
for (var v of arr) { a += v; }
message("ES6-syntax OK: " + mall + " " + f(a) + " " + pil(a) + " " + arr.length);
```

Den versionen går igenom på desktop 3.11.1. Byt rad 7 till
`for (const v of arr)` för att se den enda konstruktion som faktiskt fälls.

Radnumret i felmeddelandet säger var gränsen går. Kommer meddelandet fram
klarar motorn alltihop.

*Till den som bara vill veta vilka inbyggda objekt som finns: `typeof Symbol`,
`typeof Promise`, `typeof [].includes` och `typeof Object.assign` svarade alla
`function` på desktop 3.11.1. Det säger dock ingenting om syntax — Rhino 1.7.15
har dem också. Jag mätte det först och drog fel slutsats.*

**I3 — Repot är publikt. Inga kundnamn, personnamn eller adresser.**
Kundnamnet härleds vid körning ur biblioteksnamnet (`MV.db.affix()`), så det
behöver aldrig stå i koden. `.forbjudna-ord` är gitignorerad och kontrolleras
före varje push. *Detta kom till efter att ett kundnamn nådde ett publikt repo
via README — Jimmy hittade det, inte jag.*

**I exempel och kommentarer används alltid platshållare:** `Kraft AB` för kund,
`<kund>` i genererad text. Aldrig ett verkligt namn — inte ens "bara som
exempel", och inte ens i en kommentar som förklarar hur maskeringen fungerar.
*Det var precis vad jag gjorde: docstringen i `_maskera()` — funktionen vars
enda syfte är att stryka kundnamn — innehöll kundnamnet. Sekretesskontrollen
stoppade pushen. Andra gången den räddat mig.*

**Kör kontrollen i containern innan du levererar**, inte bara vid push:

```
sh /home/claude/sekretess.sh
```

Ordlistan ligger på `/home/claude/.forbjudna-ord` — **utanför repot**, så den
inte kan versionshanteras. Containern töms mellan sessioner; saknas filen,
hämta om den från `<repo>/.forbjudna-ord` via bryggan och skriv den dit.
Poängen är att ett kundnamn aldrig ens ska nå Jimmys disk.

**I4 — Testerna laddar modulerna i alfabetisk ordning. Sortera inte om listan.**
Den ordningen är själva testet av I1. Står i en kommentar i `tools/test.js`
också, men värt att upprepa.

**I5 — Byter en fil namn, eller tillkommer en: fyra ställen ska uppdateras.**
`tools/test.js`, `memento/KORSCHEMA.md`, `memento/<bibliotek>/shared/Moduler.js`
och `README.md`. `tools/kontroll.js` kontrollerar att de är i synk.
*(Stod `UPPSATTNING.md` fram till 23 sep. Modullistorna flyttade till
`KORSCHEMA.md` när körschemat bröts ut, och den här raden följde inte med
förrän efteråt — se I11.)* *Detta är
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

**I9 — Slå upp fältnamn och fältvärden. Gissa aldrig.**
`memento/FALT.md` är genererad ur templaterna och listar varje fält och dess
typ, i kortets ordning med underrubrikerna kvar. Vilka *värden* ett listfält kan
ha står i `ARBETSFLODE.md` och kommer från verksamheten — inte ur templaten.
*Jag skrev in `Avslutad` som ett värde i `Status Fältarbete`. Det är ett
kryssrutefält (`ft_boolean`). Jimmy kände inte igen det och trodde jag hittat på
något som inte fanns — vilket jag hade.* `tools/kontroll.js` varnar för fältnamn
i koden som inte finns i inventeringen. Ändras strukturen i appen: exportera om
och kör `python tools/mementools.py fields "Raw" memento/FALT.md`.

**I10 — Fånga bara fel du själv kastat.**
`try`/`catch` runt ett Memento-anrop är inte gratis: en `PermissionError`
kraschar i själva catch-satsen och gör ett begripligt rättighetsfel till en
Java-stacktrace. Behöver du hantera "finns inte", använd en variant som
returnerar `null` i stället för att kasta — `MV.db.libEller()` är mönstret —
och låt appens egna fel gå vidare orörda. *Det var ett defensivt `catch` runt
`MV.db.lib()` som gjorde att `Återställ historik` dog utan att säga varför.*

**I11 — En uppgift bor på ETT ställe. Övriga pekar dit.**
Står samma lista, samma numrering eller samma steg i två filer kommer de att
glida isär, och den som läser fel fil får fel svar. Skriv därför aldrig av en
lista till en andra fil — hänvisa. Behövs en översikt på andra hållet får den
vara just en översikt, utan egna nummer att underhålla.

Och åt andra hållet: **när något ändras, sök upp varje ställe som beskriver
det** innan du säger att du är klar. `grep` på namnet, på filnamnet och på
numret. En ändring är inte levererad förrän dokumenten säger samma sak som
koden.

*Tre gånger har det här kostat tid. `UPPSATTNING.md` och Del B beskrev samma
uppsättning olika, och under repetitionen 15 sep blev flera steg gjorda två
gånger. `ARBETSLAGE.md` hade två att-göra-listor som inte höll ihop. Och värst:
avvikelse A5 låg som "punkt 7 under Planerat" i en fil där punkt 7 var något
helt annat — ägaren hade bett om den i samband med driftsättningen, och den låg
still i två veckor eftersom ingen lista pekade rätt.* Den maskinella delen
finns i `tools/kontroll.js`, `kontrolleraDubbelDokumentation()`.

**I12 — Koden i en dialogknapp ska klara sig helt själv.**
En dialog körs asynkront, och knappens kod kan köras som en **ny instans** av
scriptet — utan den körnings variabler som visade rutan. Skriv därför
callbacken som ETT anrop som hämtar sitt eget underlag på nytt:

```js
function () { MV.Import.laggUpp({ godkant: true }); }
```

Aldrig med ett uträknat resultat, ett entry-handtag eller ett opts-objekt från
den anropande körningen. Att räkna om kostar inget — ingen hinner ändra något
medan rutan står öppen. Och allt som ska hända ligger **i** callbacken, aldrig
efter `show()`: returnerar `show()` direkt skulle det annars köras utan att
någon svarat, och frågan vore en kuliss.

Mocken sparar knapparnas callbacks utan att köra dem, precis som appen. Ett
test trycker själv med `d.ja()` och kontrollerar dels att ingenting skrevs
innan dess, dels att callbacken klarar sig ensam. *Regeln kommer från Jimmy
23 sep: "de tycks alltid köras asynkront och kör koden i en knapp som en ny
instans". A5 var först skriven med en callback som slöt om `forslag` — grön i
testerna, trasig i appen.*

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
node tools/kontroll.js          # invarianterna I1, I2, I5, I9, I11 + döda referenser
node tools/test.js              # alla tester gröna
sh /home/claude/sekretess.sh    # inga kundnamn — se I3
```

Alla fyra. Sedan, och först då:

1. Skriv filerna till Jimmys disk via bryggan (`device_commit_files`). *En fil
   som bara finns i containern finns inte.* Containern töms när sessionen dör.
2. Leverera dem också med `SendUserFile` så de syns i chatten.
3. **Ge honom ett commit-meddelande.** Han har uttryckligen bett om det, varje
   gång något är pushfärdigt. Kort, imperativ svenska, en rad.
4. Uppdatera `ARBETSLAGE.md` och `CHANGELOG.md` i samma leverans.
5. **Leta rätt på varje annat dokument som beskriver det du ändrat** (I11).
   Det räcker inte att de fyra kontrollerna är gröna — de fångar döda
   filreferenser och dubblerade listor, inte en mening som blivit osann.
   `grep` på funktionsnamnet, fältnamnet, filnamnet och numret. *Jimmy bad om
   det här uttryckligen 23 sep, efter tredje gången två dokument sade emot
   varandra.*

### Bryggan har tre begränsningar som har bitit oss

- **Den kan inte radera filer hos Jimmy.** Döps en fil om måste han köra
  `git rm` själv — säg till uttryckligen, annars pushas den döda filen med.
- **Containern och hans disk är två olika filsystem.** Redigerar du i
  containern har det inte hänt hos honom förrän du skrivit över bryggan.
- **`force: true` raderar hans arbete utan att säga något.**

**ANVÄND ALDRIG `force: true` slentrianmässigt.** `device_commit_files` har en
mtime-spärr just för att upptäcka att filen ändrats sedan du läste den. Med
`force` stängs den av, och en fil Jimmy just redigerat skrivs över tyst.

*Det hände: han fyllde i `TESTPLAN.md` avsnitt 4 och 5, sparade, och min nästa
skrivning raderade det. Jag hade satt `force: true` på varenda leverans under
hela projektet — spärren som fanns för exakt det här var avstängd från början.*

Rätt ordning för en fil som Jimmy också kan ha rört — alla under `memento/`,
och särskilt `TESTPLAN.md`:

1. `device_stage_files` på filen **direkt innan** du skriver.
2. `diff` mot din kopia. Skiljer de sig: **hans version gäller**. Slå ihop
   ändringarna, eller fråga. Skriv inte över.
3. `device_commit_files` **utan** `force`, med `expectedMtimeMs` från
   stagingen. Blir den avvisad har han hunnit spara igen — börja om från 1.

`force: true` är motiverat på en fil bara du skriver, när mtime-spärren
felaktigt stoppar en leverans du vet är korrekt. Skriv då ut varför.

### Aldrig scriptad sök-och-ersätt utan att först verifiera träffen

*Jag förstörde `tools/test.js` en gång — 5,3 miljoner rader — med ett
Python-script som räknade ut `end < start`, fick en tom söksträng, och
`s.replace("", new)` sköt in text mellan varje tecken.* Filen räddades bara
för att den fanns kvar på Jimmys disk.

Använd `Edit` med exakt sträng. Skriver du ändå ett script: hävda antalet
träffar först, och avbryt om det inte stämmer.

### Dokument som någon följer steg för steg

`DRIFTSATTNING.md` läses med appen öppen bredvid, av någon som utför medan hen
läser. Tre regler, alla efterfrågade av Jimmy under generalrepetitionen:

- **Allt man behöver veta står FÖRE listan.** En förklaring under en checklista
  hittas inte — man har redan börjat klicka. Varningar, förutsättningar och
  "det här är ofarligt"-lugnanden hör överst i steget.
- **Ingenting får kräva att man bläddrar tillbaka.** Behövs modullistan i tre
  steg skrivs den ut tre gånger. Dubbleringen är billigare än scrollandet, och
  `tools/kontroll.js` håller listorna i synk.
- **Ordningen är appens, inte dokumentets.** Stegen följer det man ser på
  skärmen uppifrån och ner. Avviker man måste skälet stå på plats.

*Två omgångar kommentarer gick åt till det här innan jag förstod att det var en
regel och inte enskilda synpunkter.*

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
  test.js            399 tester. REGRESSION = buggen får inte tillbaka.
                     AVSIKT = beteendet är beslutat, riv det inte.
  mock.js            Memento-simulator. Flaggorna COLD_CREATE och LAZY_MAP
                     återskapar appens egenheter med flit.
  kontroll.js        invariantkontroll — I1, I2, I5, I9, döda doc-referenser
  stamp.js           byggstämplar; --check verifierar hash mot innehåll
  mementools.py      extract / inject / diff / fields / links för .mlt2
  push.ps1           git-check -> stämpel -> kontroll -> tester ->
                     sekretess -> visa diff -> commit + push

memento/             det som ska göras i appen, inte kod som körs
  FALT.md            GENERERAD fältinventering. Facit för vad som finns.
  KORSCHEMA.md       DET ÄGAREN FÖLJER, och enda källan för uppsättningen.
                     Steg 1-8, backup och återgång ingår.
  DRIFTSATTNING.md   förberedelserna i kopiorna innan körschemat lämnas över
  UPPSATTNING.md     checklista + all scriptkod att klistra in
  TESTPLAN.md        paritetstestet. Facit för när vi är klara.
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

## Del 6 — Kravet: minst lika bra som förr

Ribban är **inte** att beteendet ska vara identiskt med startpunkten. Den är
att inget som fungerade förr får ha blivit sämre. Förbättringar får följa med
— de behöver inte vänta på ett godkänt paritetstest.

Två saker gäller fortfarande:

- **Ett beteende som verksamheten är beroende av ändras inte utan att Jimmy
  sagt ja** (I6). Att kravet mjukats upp betyder inte att koden får ändra sig
  själv på eget bevåg.
- **En förbättring som inte är efterfrågad byggs inte i förtid.** Det som är
  värt att göra står under *Planerat* i `ARBETSFLODE.md` — parkera nya idéer
  där i stället för att bygga dem.

`memento/TESTPLAN.md` är fortfarande facit för vad som ska provas, och
`memento/DRIFTSATTNING.md` för vad som måste vara gjort innan driftbiblioteken
rörs. Skillnaden är bara att en avvikelse i testplanen numera kan vara ett
medvetet förbättrat beteende, inte automatiskt ett fel.

Facit för när paritet är nådd är `memento/TESTPLAN.md`. Hittas en avvikelse där:
skriv `REGRESSION`-testet **före** rättningen, och står det sig som avsiktligt
beteende blir det ett `AVSIKT`-test plus en rad i planens tabell över
avsiktliga skillnader.
