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

- **`memento/KOPIERING.md`** — checklista för de åtta länkfält som binder mot
  bibliotekets ID och därför pekar på originalet efter en kopiering. Missas det
  kan en testkörning skriva i driftdata.
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

