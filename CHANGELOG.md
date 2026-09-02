# Changelog

Alla noterbara ändringar i modulerna. Nyast först.

Versionen som körs i Memento visas med **Version**-knappen i respektive
bibliotek (`MV.about()`). Jämför byggtiden där med `git log` för att se om en
ändring kommit hela vägen ut.

Formatet följer [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/) löst:
*Tillagt*, *Ändrat*, *Rättat*, *Borttaget*.

---

## Ostämplat — det som ligger i main just nu

### Tillagt

- **`mementools.py links`** — visar vilket bibliotek varje länkfält pekar på.
  Måltabellen ligger i fältets `cnt[0].s` och fältets egen tabell i `lib`;
  exporteras alla bibliotek samtidigt går id:na att lösa upp till namn. Kört på
  augustiexporten pekade **samtliga åtta** länkfält ut ur testuppsättningen —
  `Aktivt Fältarbete` i Anläggningar pekade inte på Fältarbete, och båda
  `Historiska Fältarbeten` pekade på samma okända bibliotek. Rapporten skrivs
  bara till skärmen; den innehåller biblioteksnamnen och därmed kundnamnet.

- **`memento/FALT.md` — genererad fältinventering.** `mementools.py fields`
  läser templaterna och skriver varje fält med typ, i kortets ordning och med
  underrubrikerna kvar, för alla fyra biblioteken. Kundnamn i fältnamn maskeras
  mot `.forbjudna-ord` innan filen skrivs — det gamla fältet `Åter till <kund>`
  hade annars nått det publika repot. `tools/kontroll.js` varnar för fältnamn i
  koden som inte finns i inventeringen. Kom till efter att koden fått ett
  statusvärde som i själva verket var ett kryssrutefält.

- **Historiken som text i fältarbetet.** `MV.Faltarbete.historikText()` skriver
  en sammanfattning av anläggningens tidigare fältarbeten i fältet
  `Tidigare fältarbeten`, eller i loggen om fältet inte finns. Ersätter
  historiklänkfältet, som aldrig kunde fungera.

  **Ett block per order**, nyast först: en färgad rubrikrad med datum och
  anledning till avslut, och under den åtgärderna som bockar plus
  kommentarfälten märkta med sina namn.

  Ramen och färgerna kommer från `MV.Logg.block()` — utbruten ur
  `MV.Logg.render()` just för detta — så historiken och loggen ser ut som
  samma familj. Grupperingen skiljer dem åt: loggen samlar allt som hänt en
  viss dag, historiken håller isär ordrarna. *Två fältarbeten avslutade samma
  dag är två ärenden, inte ett.*

  Anledningen är `Status Fältarbete` — värden som `Mätaren läser utan åtgärd`
  och `Ström bruten i kabelskåp` är just det man vill veta. Intetsägande
  värden (`Ny`, `Historik finns`, `Klar`) utelämnas, styrt av
  `historikDoljStatus`.

  Ett ärende utan innehåll säger det i klartext i stället för att bli en tom
  ruta. Bär kommentaren sitt eget datum, satt av knappen *Lägg till datum i
  kommentar*, stryks det när det upprepar rubrikens — annars stod datumet två
  gånger. Ordningen inom ett datum följer länkfältet, inte Rhinos sorterings-
  implementation, som inte är garanterat stabil.

  `historikAntal` är 0, alltså alla ärenden: historiken har en egen flik i
  kortet med inget annat under. Saknas rich text-fältet hamnar samma innehåll
  som ren text i loggen (`historikText()`).
- **Utebliven länkning syns.** `skapa()` läser tillbaka `Koppling till
  anläggning` och `Aktivt Fältarbete` efter att ha länkat, och returnerar
  `varningar`. `skapaMedDialog()` visar dem. Tidigare ignorerades returvärdet
  från `linkOnce()`, och ett fältarbete kunde skapas utan koppling helt tyst.

- **`CLAUDE.md` och `ARBETSLAGE.md`.** De uppmätta sanningarna om Memento
  (alfabetisk laddning, desktop-cachen, länkfältens ID-bindning, permissions
  per enhet), invarianterna som följer av dem, och var arbetet står just nu.
  Kom till för att ingen — människa eller AI — ska behöva upptäcka samma sak
  två gånger. Varje invariant har ett faktiskt fel bakom sig; felen står
  namngivna, så att regeln går att ifrågasätta i stället för att bara följas.
- **`tools/kontroll.js`.** Kontrollerar det testerna inte kan se: ES6-syntax
  som Rhino kraschar på, moduler som skriver över varandras data på toppnivå,
  moduler som inte laddas i testerna eller inte nämns i `UPPSATTNING.md`,
  saknade byggstämplar och döda länkar i dokumentationen. Körs som steg 3 i
  `push.cmd` och stoppar pushen vid fel. En regel i en textfil kan glömmas;
  det här kan den inte.
- **`memento/KOPIERING.md`** — checklista för de åtta länkfält som binder mot
  bibliotekets ID och därför pekar på originalet efter en kopiering. Missas det
  kan en testkörning skriva i driftdata. Innehåller nu även vilka
  **Library permission** scripten i varje bibliotek behöver, och att
  permissions inte synkroniseras mellan enheter — de måste sättas om på varje
  telefon och dator, annars fungerar samma bygge på en enhet men inte på nästa.
- **`ARBETSFLODE.md`** — arbetsflödet från nätägarens lista till avslut,
  vad de sexton statusvärdena betyder, och specifikationer för det planerade.
- **`Moduler` som Shared script.** Bibliotek ibockade på ett Shared script blir
  tillgängliga för alla script i biblioteket — verifierat på Android och
  desktop. Ett ställe per bibliotek i stället för på varje script.
- **Byggstämpel och versionsrapport.** Varje modul stämplas av
  `tools/stamp.js` med gemensam byggtid och en hash per fil. `MV.about()` visar
  vad som körs, och flaggar moduler vars byggtid avviker från de övriga — då har
  Memento cachat en gammal version av just den modulen. `Version`-action finns
  som stub i varje bibliotek.
- **Sekretesskontroll före push.** `push.cmd` läser `.forbjudna-ord`
  (gitignorerad) och vägrar pusha om något av orden finns i filinnehåll eller
  filnamn. Kom till efter att ett kundnamn nått ett publikt repo via README.
- **Kundnamn som suffix i biblioteksnamnet.** `MV.db.affix()` härleder både
  testprefix och kundsuffix ur namnet på det bibliotek scriptet körs i, så
  koden känner bara till basnamnen. Repot innehåller därmed inga kundnamn, och
  en ny kund kräver ingen kodändring.
- **Tömningsskydd vid avslut.** Ett tomt fält i fältarbetet raderar inte längre
  anläggningens ifyllda värde. Avstängbart med
  `MV.config.faltarbete.tillatTomningVidAvslut = true`.
- **Koordinaten skrivs till anläggningen vid avslut**, så nästa ärende startar
  från den position teknikern rättat på plats.
- `tools/mementools.py` — `extract` / `inject` / `diff` för `.mlt2`-templates.
- Testsvit mot en Memento-simulator (`tools/mock.js`), som med flit efterliknar
  två av Mementos egenheter: kalla `create()`-objekt och tröga kartfält.

### Ändrat

- **Commit-meddelanden kan vara flera rader.** `push.cmd` frågar fortfarande
  efter en rad i fönstret, men trycker man bara Enter öppnas Anteckningar med
  en mall — rubrik, tom rad, brödtext, och de ändrade filerna listade som
  kommentarer. Meddelandet committas med `git commit -F` i stället för `-m`,
  vilket också gör att citattecken och åäö slipper escapas.

- **Dialogerna flyttade från knappscripten till modulen.**
  `MV.Faltarbete.avslutaMedDialog()` och `skapaMedDialog()` gör arbetet och
  visar resultatet, så att scripten i appen blir en rad som alla andra. Texterna
  ligger i `MV.Faltarbete.TEXTER` och är därmed versionshanterade; de går att
  skriva över per bibliotek. `avsluta()` och `skapa()` är oförändrade och visar
  fortfarande ingenting — de behövs så av testerna och av batchkörningar.

- **Repot heter `memento-scripts`.** Små bokstäver med bindestreck, och
  prefixet `memento-` så att framtida Memento-repon sorteras intill varandra.
- **Modulnamnen fick projektprefix.** `mv-` är den generella grunden (core,
  format, db, logg); `fa-` hör till fältarbetesprojektet. Memento listar bara
  filer i repots rot, så prefixet är det som håller roten läsbar när fler
  projekt tillkommer.
- **Fältet `Åter till <nätägare>` heter nu `Åter till nätägare.`**
  `faltAterTillNatagareAlias` läser även det gamla namnet under övergången.
- All logik flyttad från inbäddade script i Memento till moduler i repot.
  Scripten i appen är nu en rad var. Se `memento/` för exakt innehåll.

### Borttaget

- Fyra kopior av logg-koden, två av skapa-fältarbete-logiken, och sex andra
  dubbletter — se *Vad som slogs ihop* nedan.
- Den avstängda action-dubbletten `Flyttad till knapp - - Spara ändringar och
  avsluta Fältarbete`. Se `memento/BORTTAGET.md`.

### Rättat

- **Historiklänken i Fältarbete togs bort — den kunde aldrig fungera.**
  Ett `Link to entry`-fält kan inte peka på sitt eget bibliotek, så ett
  fältarbete kan inte länka till andra fältarbeten. Fältet i drift pekade på
  ett gammalt test-Fältarbete, vilket var det enda mål det kunde få — och
  därför följde historiken aldrig med. Detta är den tredje och strukturella
  förklaringen till buggen; de två tidigare (kalla `create()`-entries,
  felpekande länkfält efter kopiering) var symptombeskrivningar.
- **Datum i historiksammanfattningen.** `MV.fmt.value()` formaterar bara äkta
  `Date`-objekt, och Memento lämnar datumfält som millisekunder — raden blev
  `1784505600000` i stället för `2026-04-12`. Egen datumformatering.
  *OBS: samma sak gäller ändringsloggen om ett rent datumfält någonsin läggs
  till i `TRACK_FIELDS`. Inget sådant finns där idag.*

- **`mementools` missade JavaScript-fält.** `ft_script`-fält lagrar sitt uttryck
  i `templates[i].cnt[].s.expr`, inte i `json_options` som knappfälten. Fem fält
  i Fältarbete låg därför ospårade. Alla var triviala alias så inget gick
  förlorat, men verktyget påstod att det extraherade allt. `extract`, `inject`
  och `diff` täcker nu även dem, och round-trip-verifieringen är utökad.
- **Modulerna tålde inte Mementos laddningsordning.** Memento laddar
  biblioteken alfabetiskt, inte i ibockad ordning, så `mv-core.js` kommer sist
  — efter alla `fa-`-moduler som bygger på den. Två följder rättade:
  byggstämpeln anropade `MV.stamp()` som inte fanns än, och `mv-core` raderade
  `MV.config.faltarbete` och `MV.config.importen` genom att skriva
  `MV.config = { ... }` rakt av. All konfiguration sätts nu additivt, och
  stämpeln skriver direkt i `MV.build.moduler`. Testsviten laddar numera
  modulerna alfabetiskt för att köra under appens villkor.

Alla har ett test som failar om buggen återinförs. Detaljerna längre ner.

- Historiken följde inte med till nya fältarbeten *(orsaken omvärderad — se
  detaljen nedan)*
- `Nyckel` följde inte med till nya fältarbeten
- Ingenting av vad som ändrades nådde anläggningens logg vid avslut
- Importerade anläggningar gav halvtomma fältarbeten
- `Mobilnummer 2`, `Lev.punkt(1)` och `Lev.punkt(2)` kastades bort vid import
- Koordinatstatus sattes inte vid import
- `Spara anteckning` skrev under dagens datum i stället för valt
- `---` klistrades ihop med texten efter vid `hämta`

---

## Bakgrund

Detaljerna bakom ovanstående, sparade för att motiven inte ska tappas.

### Vad som slogs ihop

| Fanns i | Antal kopior | Nu |
|---|---|---|
| `LoggWriter` / `Shared_LoggWriter` + inlinad kopia i `Spara anteckning` + inlinad kopia i `Lägg upp` | 4 | `mv-logg.js` |
| `fieldsToCopy` (28 fältnamn) + hela skapa-fältarbete-logiken | 2 | `fa-faltarbete.js` |
| `getSafeString()` — i två olika, inte likvärdiga, versioner | 2 | `MV.fmt.value()` |
| `getCheckboxArray()` / `getArray()` | 2 | `MV.fmt.list()` / `MV.fmt.toArray()` |
| Nyckel-detaljformateringen | 2 | `MV.fmt.nyckel()` |
| Ändringsrads-byggaren `"• X ändrades från..."` | 3 | `MV.fmt.diffLine()` |
| Åtgärder + kommentarer som loggblock | 2 | `MV.Faltarbete.byggAtgardsblock()` |

Fältlistorna finns nu på ett ställe. Lägger du till ett fält i biblioteket
räcker det att lägga till namnet i rätt lista i `fa-faltarbete.js`.

---

### Buggarna i detalj

#### Historiken följde inte med till nya fältarbeten

**Orsaken var inte den jag först skrev.** Symptomet var att tidigare ordrar inte
syntes i ett nytt fältarbete, så man måste gå till anläggningsbiblioteket.

Min diagnos var att objektet `lib().create()` returnerar inte är ett fullt
levande entry, och att `link()` på det tystnar. Det byggde på en extrapolering:
originalkoden hämtade om ett entry ur ett *länkfält* med `findById()` och
kommenterade att det behövdes. Jag drog slutsatsen att samma sak gällde
`create()`.

**Den verkliga orsaken var troligen en annan.** `Link to entry`-fält binder mot
bibliotekets **ID**, inte dess namn. I drift pekade `Historiska Fältarbeten` på
ett gammalt testbibliotek. Länkningen hade alltså aldrig kunnat lyckas —
entryna tillhörde ett annat bibliotek än fältet förväntade sig. Det förklarar
symptomet direkt, och förklarar dessutom varför det *fungerade* vid test men
inte i drift.

Omhämtningen i `mv-db.js` behålls ändå: den är billig, den löser bevisligen
`Nyckel`-fallet nedan, och originalkoden hade redan funnit den nödvändig på ett
ställe. Men den ska läsas som **skydd**, inte som en bevisad rättning av just
det här felet. Se [memento/KOPIERING.md](memento/KOPIERING.md).

#### `Nyckel` följde inte med till nya fältarbeten

`Nyckel` är ett länkfält (`ft_lib_entry`) men låg i `fieldsToCopy`. Länkfält går
inte att sätta via `create()` — värdet tappas tyst. Nycklarna nådde alltså aldrig
det nya fältarbetet.

Rättat: `MV.db.copyFields()` hoppar över länkvärden, och
`MV.Faltarbete.LINK_FROM_ANLAGGNING` länkar dem separat efteråt.

#### Ingenting av vad som ändrades nådde anläggningens logg

I `Spara ändringar och avsluta Fältarbete`:

```js
var actionText = typeof actionText !== 'undefined' ? actionText : "";
var cleanLog   = typeof cleanLog   !== 'undefined' ? cleanLog   : "";
```

`var` hoistas, så båda variablerna *är redan deklarerade* när `typeof` körs.
Villkoret är alltid falskt, båda blir alltid `""`, och hela blocket som skulle
skriva loggen i anläggningen var dött. Ingen såg det för att det inte kastade
något fel.

Samtidigt byggdes `changes[]` upp med varje ändringsrad — och användes aldrig.

Rättat: `MV.Faltarbete.avsluta()` bygger loggen av `changes` plus åtgärder plus
kommentarer, och skriver den i anläggningens logg.

#### Importerade anläggningar gav halvtomma fältarbeten

I `Lägg upp`, scenario 2, skickades det nyskapade anläggnings-entryt direkt till
`createFaltarbete()`, som läste 28 fält ur det. Samma kalla-entry-problem: de
flesta kom tillbaka som `null`.

Rättat: `MV.db.create()` hämtar om entryt, så `MV.Faltarbete.skapa()` läser ett
komplett objekt.

#### Importfält som kastades bort

`Mobilnummer 2` mappades inte till `Tfn. 2` när en ny anläggning lades upp,
trots att `Mobilnummer 1` → `Tfn. 1` fanns.

Rättat, och mappningen är nu en tabell: `MV.Import.FALT_MAPPNING`.

`Lev.punkt(1)` och `Lev.punkt(2)` mappas fortfarande inte — det är oklart om de
motsvarar `Leveranspunkt`, `Anl Id` eller `Anl Id Produktion`. Raderna ligger
förberedda och bortkommenterade i `fa-import.js`.

#### Koordinatstatus sattes inte vid import

`Hitta befintliga` satte koordinaterna och läste sedan tillbaka samma kartfält
för att avgöra om `Status Koordinater` skulle sättas. Ett fält som just skrivits
kan komma tillbaka som `null` i samma körning, så statusen uteblev — och då
hoppade `Lägg upp` över raden helt.

Rättat: resultatet skickas vidare i en variabel i stället för att läsas tillbaka.

**Prioriteringen mellan koordinater är däremot avsiktlig och bevarad** — se
avsnittet nedan.

#### `Spara anteckning` skrev under fel datum

Fältarbetes version anropade `appendToLog()`, som alltid använde `moment()` —
dagens datum — och ignorerade valt `Logg Datum`. En retroaktiv anteckning hamnade
under dagens rubrik.

Rättat: `MV.Logg.append()` tar datumet som parameter.

#### `Spara anteckning` i anläggningsbiblioteket hade en egen kopia

Hela logg-logiken låg inlinad och hade redan hunnit glida från
`Shared_LoggWriter`. Båda biblioteken anropar nu samma modul.

#### `---` klistrades ihop med texten efter

Vid `hämta` blev `<hr>` till `---` utan radbrytning, så "`---`Andra blocket" kom
tillbaka som en rad. Rundgången text → HTML → text är nu förlustfri och testad.

---

