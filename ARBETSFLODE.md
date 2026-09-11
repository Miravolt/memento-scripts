# Arbetsflödet

Domänkunskapen bakom koden. Det här går inte att läsa ur modulerna, och det är
det som försvinner först när ingen skrivit ner det.

---

## Kedjan, från beställning till avslut

1. **Nätägaren skickar en lista** med anläggningar som behöver besökas. Oftast
   för att elmätaren inte längre går att fjärravläsa.

2. **Adresser blir koordinater.** Listan körs genom ett verktyg som slår upp
   adresser via Googles API. Koordinaterna som kommer ut är *grova* — det är
   därför anläggningens egen koordinat alltid vinner om den finns.

   Listan kommer som **PDF**. Datan måste extraheras till CSV innan den kan
   importeras i Memento. Det steget sker utanför Memento idag.

3. **Import** till *Import Fältarbete* → `Hitta befintliga` matchar mot
   anläggningar på Tjänstenr → `Lägg upp` skapar anläggning där ingen fanns och
   startar ett fältarbete.

4. **Besök i fält.** För det mesta går jobbet att göra direkt — mätaren är
   åtkomlig med nyckel från nätägaren, eller via nyckelrör vid adressen. Ibland
   sitter mätaren inlåst och kräver bokning med kund. Ibland får man inte tag
   på kunden och måste åka tillbaka.

5. **Status styr vad fältpersonalen ser.** `Nytt besök` betyder att den behöver
   besökas igen. Så småningom sätts `Klar`.

6. **Kontoret granskar det som är `Klar`.** Någon kontrollerar i CM om mätaren
   läser igen. Gör den det kryssas `Läser i CM`.

   Har flera försök gjorts utan att mätaren kommit igång — kunden släppte
   aldrig in oss, eller annat — skickas ärendet tillbaka till nätägaren, som
   får lösa det själva. Då kryssas `Åter till nätägare`.

7. **Avslut.** Fältarbetet lämnar den aktiva listan. All ny data skrivs till
   anläggningen och fältarbetet läggs i anläggningens historik.

8. **Nästa ärende på samma anläggning** ärver allt: koordinaten som rättats på
   plats, kunduppgifter, mätardata. Tidigare ordrar länkas in i det nya
   fältarbetet så att man ser vad som gjorts förut, och statusen sätts till
   `Historik finns`.

---

## Vad statusvärdena betyder

`Status Fältarbete` sätts av **koden** i två fall:

| Värde | Sätts när |
|---|---|
| `Ny` | fältarbete skapas på en anläggning utan historik |
| `Historik finns` | fältarbete skapas på en anläggning som besökts förut |

Resten sätts **för hand** och är fältpersonalens och kontorets kommunikation:

| Värde | Betyder |
|---|---|
| `Nytt besök` | måste besökas igen — syns för fältpersonalen |
| `Kund ej hemma` | ingen svarade |
| `Bokad` | tid avtalad med kund |
| `Klar` | fältarbetet utfört, väntar på kontorets kontroll i CM |
| `Klar med kommentar i CM` | utfört, med anteckning i CM |
| `Mätaren läser utan åtgärd` | felet fanns inte, mätaren fungerade |
| `Fungerar efter ny mätarlista` | löste sig utan besök |
| `Mätaren bytt` / `Mätaren är nertagen` / `Mätaren avstängd` | mätarens tillstånd |
| `Ström bruten i kabelskåp` | matningen bruten |
| `Utreder störning` | pågående felsökning |
| `Test av P1-port` | pågående test |
| `Annan orsak, se anmärkning` | se kommentarfältet |

`Åtgärder` (kryssrutor) är vad som faktiskt gjordes på plats:

`Avläsning` · `Terminal omstartad` · `Terminal bytt` · `Mätare bytt` ·
`Bruten i kabelskåp` · `Mätare spänningslös` · `RF8 antenn monterad` ·
`Test av P1-port`

---

## Test, drift och kunder

Varje uppsättning bibliotek är sluten: `Test Fältarbete Kraft AB` slår upp
`Test Anläggningar Kraft AB`, aldrig driftens. Det gäller **scriptens**
biblioteksuppslag, som går på namn.

Länkfälten går däremot på bibliotekets ID och följer med vid en kopiering — de
måste pekas om för hand. [memento/KOPIERING.md](memento/KOPIERING.md) listar
vilka.

Testbiblioteken innehåller **riktig data** från utförda arbeten, vilket gör
testerna verklighetstrogna men också betyder att adresser, kundnamn och
teknikernamn finns där. `Raw/` och `Build/` är gitignorerade så en
template-export inte kan råka pushas, och sekretesskontrollen i `push.cmd`
fångar ord ur `.forbjudna-ord`. Den känner däremot inte igen en adress eller ett
personnamn den inte fått veta om — klistra alltså aldrig in verklig data i
tester eller exempel.

---

## Planerat

Inget av detta är byggt. Ordningen är medveten: **paritet med det gamla
beteendet först**, sedan det här. Blandar man ihop dem blir "fungerar det som
förut?" en omöjlig fråga.

### 1. `Nytt fältarbete krävs` ska göra något

Kryssrutan finns i Fältarbete men ingen modul läser den. Avsikten var två
saker:

**Tillåta avslut utan `Läser i CM` / `Åter till nätägare`.** Idag kräver
`MV.Faltarbete.avsluta()` `Avslutad` **och** minst en av de två. Ett besök som
inte kunde slutföras har därför bara dåliga utgångar: antingen kryssas något av
dem ändå — och då står det i anläggningens logg att mätaren läser i CM eller är
återlämnad, vilket inte är sant — eller lämnas fältarbetet öppet, och då
**blockerar det anläggningen**, eftersom `skapa()` vägrar när ett aktivt
fältarbete finns.

**Erbjuda att skapa nästa ärende direkt.** En dialog vid avslut: *"Nytt
fältarbete krävs. Vill du skapa det nu?"* Det fungerar tekniskt eftersom
avslutet just länkat bort det aktiva fältarbetet — anläggningen är fri.

Att göra: släpp CM/nätägare-kravet när flaggan är satt, logga orsaken tydligt i
anläggningen, och erbjud direktskapande. Behövs ett fält på anläggningen att
filtrera på för kontorets arbetskö är det en schemaändring.

**Bekräftat:** de utesluter varandra i praktiken. Ett filter över **678
fältarbeten i drift** hittade noll fall där båda är ikryssade. Valideringen
kräver idag *minst* en; den kan därför skärpas till *exakt* en utan att bryta
mot något som faktiskt finns i datan.

### 2. Räkna omstarter — när ska terminalen bytas?

Rutinen: har kommunikationsmodulen startats om **tre gånger** och samma fel
återkommer, ska modulen bytas. Det finns ingen möjlighet att se det idag.

Datan finns dock redan. `Åtgärder` innehåller `Terminal omstartad` och
`Terminal bytt`, och varje tidigare fältarbete ligger i anläggningens historik.
Räkningen är alltså beräkningsbar:

```
antal Terminal omstartad i historiken, räknat EFTER senaste Terminal bytt
```

Skiss:

```js
MV.Faltarbete.raknaAtgard(anlaggning, "Terminal omstartad", {
    nollstallsAv: "Terminal bytt"
});
```

`skapa()` skulle sedan kunna sätta ett fält och skriva en tydlig rad i loggen
när gränsen nås — `⚠ 3 omstarter sedan senaste terminalbyte. Byt terminal.`

**Att bekräfta:** att räkningen ska nollställas av `Terminal bytt` är min
tolkning av rutinen, inte något du sagt uttryckligen. Och `Mätare bytt` — ska
den också nollställa, eller är terminal och mätare olika saker här?

Var siffran ska synas är också öppet. Loggen fungerar utan schemaändring, men
ett heltalsfält på fältarbetet går att sortera och filtrera på, vilket är vad
kontoret troligen vill.

### 3. Rikare information i listvyn

`Lookup`-fältet i Fältarbete hämtar nyckelnumret ur Nyckelregister och visar det
i entryts statusrad — så att man ser det i listan innan man öppnar ärendet.
Det fungerar, men visar bara **ett** fält.

Önskemålet är mer: om det är ett nyckelrör, och annat som är bra att veta innan
man går in i fältarbetet.

Ett `ft_lookup` kan bara peka på ett enda fält. Vägen dit är därför att låta
**Nyckelregister** räkna ut sin egen sammanfattning i ett JavaScript-fält —
`864 · Nyckelrör · trög` — och låta `Lookup` peka på det fältet i stället.
Sammansättningen sker då där datan bor, och alla bibliotek som slår upp nyckeln
får samma sträng.

Det skulle bli Nyckelregisters första script. Öppen fråga: JavaScript-fält har
en egen `libs`-lista i templaten, så de *ser ut* att kunna använda repots
moduler — men Mementos dokumentation säger att JavaScript-fält körs i en
begränsad kontext utan Memento-API:t. Går det inte måste koden ligga inline i
appen, och då är den inte versionshanterad. Behöver testas innan man bygger på
det.

### 4. PDF → CSV

Extraheringen sker utanför Memento idag. Ett verktyg för det skulle kunna bo i
`tools/` — samma repo, samma push-flöde. Kräver att man vet hur PDF:erna ser
ut; de varierar sannolikt med nätägare.

### 5. Utseende och widgets

Dashboards, dialoger, kortlayout. Efter paritet.

### 6. Varning när enheten kör en gammal version

> **Delvis byggt.** Den offline-baserade halvan finns: `MV.byggVarning()`
> räknar byggets ålder ur byggstämpeln och varnar när den passerat
> `MV.config.byggVarningDagar`. Inget nätverk, ingen blockering, fungerar i
> flygplansläge. Den kan säga *"den här koden är 45 dagar gammal"* men inte
> *"det finns en nyare"*. Resten av avsnittet beskriver den nätverksbaserade
> kontrollen, som fortfarande är oskriven — och som mest tillför i fallet där
> en enhet är gammal men under åldersgränsen.

Idag upptäcks en gammal version bara om **någon** modul är nyare än de andra —
då flaggar `MV.avvikande()` den, gratis och offline. Är *alla* åtta lika gamla
finns det ingen intern ledtråd alls: modulerna är konsekventa med varandra,
bara inte med git. Det är precis det läget som en gång såg ut som en
Android/desktop-skillnad.

Det enda som kan avgöra det är en fråga ut på nätet.

**Så det skulle fungera.** `tools/stamp.js` skriver också en `senaste.json` i
repot vid varje push:

```json
{ "byggd": "2026-08-21 13:42", "moduler": 8 }
```

En ny funktion `MV.version.kolla()` hämtar den med `http().get()` och jämför mot
`MV.byggd()`. Returnerar `{ status: "aktuell" | "gammal" | "okand" }` och kastar
aldrig — allt som går fel, inklusive ingen täckning, blir `"okand"`.

**Den avgörande detaljen:** `senaste.json` får INTE bockas i som ett
JavaScript-bibliotek. Då hämtas den genom exakt samma cache som modulerna, blir
gammal i takt med dem, och kan strukturellt aldrig upptäcka problemet. Den måste
hämtas med `http()`, med en cache-brytande parameter (`?t=` plus millisekunder).

**Reglerna som gör det ofarligt:**

- **Aldrig i en trigger som användaren väntar på.** `http().get()` används
  synkront — `var result = http().get(url)` — så scriptet står still tills
  svaret kommer eller tiden går ut. En trigger på `MODIFY_ENTRY` skulle alltså
  blockera *varje sparning* i flygplansläge. Det är hela skillnaden mellan
  ofarligt och oanvändbart. Undantaget är den schemalagda triggern, som kör
  asynkront — se nedan.
- **Bara i användarstartade actions**, där en paus är begriplig: alltid i
  `Version`, och möjligen i `Lägg upp` (som körs inomhus och redan tar tid).
- **`message()`, aldrig `dialog()`.** En rad, ingen knapp att trycka på:
  *"Ny version finns (bygge X). Uppdatera modullistan i Moduler."* Scripten
  fortsätter köra på den gamla koden — varningen stoppar ingenting.
- **Tyst när svaret är `"okand"`.** Ingen täckning är inte ett fel.

**Tre saker måste mätas först.** Inget av dem står i Mementos dokumentation:

1. **Hur länge blockerar `http().get()` i flygplansläge?** Ta tid på det. Är det
   30 sekunder duger idén bara i `Version`, och ingen annanstans.
2. **Vad betyder "HTTP requests must be executed asynchronously in the last
   Phase of an Event"?** Det står i API-dokumentationen utan förklaring och kan
   betyda att triggers är uteslutna även tekniskt — vilket vi ändå vill.
3. **Överlever `MV`-tillstånd mellan två script-körningar i samma
   app-session?** Gör det det räcker en flagga i minnet för att kolla en gång
   per app-session, gratis. Gör det inte behöver kontrollen antingen ske vid
   varje explicit anrop, eller så måste senaste kontrolltid sparas i ett fält.

#### Bättre väg: schemalagd trigger + delad lagring

Jimmys förslag, 11 sep. Det löser den invändning som annars sänker hela idén.

Memento har en triggertyp **"At scheduled time"**, och dokumentationen säger att
den — till skillnad från alla andra triggers — **alltid kör asynkront**. Då
finns ingen användare som väntar, och blockeringsfrågan i punkt 1 ovan slutar
vara avgörande: en http-timeout i flygplansläge kostar ingenting eftersom ingen
sparning hänger på den.

Det ger en tvådelad konstruktion, och det är uppdelningen som är poängen:

1. **Hämtningen** sker i den schemalagda triggern, i **ett** bibliotek, en gång
   om dygnet. Bara det biblioteket behöver `Network`-permission — inte alla
   fyra, och inte på varje telefon som råkar trycka på en knapp.
2. **Resultatet skrivs till ett delat ställe** som synkas via Memento. Alla
   andra script *läser bara lokalt* och jämför mot sin egen byggstämpel. Ingen
   annan kodväg rör nätet någonsin.

Delningen betyder också att det räcker att **en** enhet har täckning för att
alla enheter ska veta vad som är senaste bygge.

**Var resultatet ska bo.** `lib().notes` är dokumenterad som en `string` på
Library-objektet — "Library notes (as specified in the library structure)".
Formuleringen antyder att den speglar strukturen, alltså kanske bara läsbar.
**Skrivbarheten är omätt.** Går den att skriva är den det snyggaste stället:
inget extra fält, inget entry som en användare kan råka redigera. Går den inte
är alternativet ett eget entry i ett litet bibliotek med två textfält
(`senaste_bygge`, `kontrollerad`) — garanterat skrivbart, garanterat synkat,
men synligt i appen.

**Mätningar innan något byggs:**

- **M1. BESVARAD 11 sep: schemaläggning finns inte på desktop.** På Android
  finns den, men den kräver extra app-permissions. Därmed faller den
  schemalagda hämtningen som *generell* lösning — den kan i bästa fall köras på
  en telefon.
- **M2. BESVARAD 11 sep: `lib().notes` går inte att använda.** `typeof` ger
  `undefined` trots att biblioteket har text i Notes. Skrivningen *såg* ut att
  fungera, men `lib()` returnerar samma objekt vid varje anrop i en körning, så
  `lib().notes = x` skapade bara en JS-egenskap i minnet som lästes tillbaka i
  samma körning. Se fällan i `CLAUDE.md` del 1. Och även om egenskapen hade
  funnits: Notes redigeras via strukturen, och Jimmy har inte
  strukturrättigheter i drift — en stämpling som måste ske efter varje push
  hade han alltså inte kunnat göra själv.
- ~~**M3.** Kör den schemalagda triggern med `http().get()` inuti?~~ Utgår
  tillsvidare, följer av M1.

#### Enklare ändå: manuell stämpling efter push

Jimmys förslag, 11 sep, efter att M1 föll. **Den som pushar vet redan vilken
version som är den senaste** — ingen behöver fråga GitHub om det. Då behövs
inget nätverksanrop alls:

1. Efter en push kör Jimmy en **action** i appen, en gång, som skriver
   byggtiden till bibliotekets `notes`.
2. Memento synkar `notes` till alla enheter, som vanlig biblioteksdata.
3. Varje script läser `lib().notes` vid körning — **lokalt** — och jämför mot
   sin egen byggstämpel. Skiljer de sig kör enheten gammal kod.

Det tar bort hela nätverksgrenen: inget `http()`, ingen `Network`-permission,
ingen timeout, ingenting att mäta om synkron blockering. Kvar blir "skriv en
sträng, läs en sträng". Det är den billigaste versionen av funktionen som
fortfarande gör nytta, och den gör *mer* nytta än åldersvarningen eftersom den
upptäcker en två dagar gammal bugfix.

**Format i `notes`.** En markörrad, så att mänskliga anteckningar i fältet
överlever:

```
[bygge] 2026-09-11 08:02
```

Skrivningen ersätter raden om den finns, annars lägger den den först. Läsningen
plockar ut den med `/^\[bygge\]\s*(.+)$/m`. Jämförelsen är ren
strängjämförelse mot `MV.byggd()` — samma stämpelformat i båda ändar, så
likhet räcker: *är mitt bygge det publicerade?*

**Bäraren blir ett entry, inte `notes`.** Efter M2 återstår ett vanligt entry
som markör. Det är **data, inte struktur** — och det är hela poängen, för Jimmy
får lägga till entries i drift men inte röra strukturen. Ett entry synkas
dessutom som all annan data, och scripten läser det lokalt med `find()` eller
`lastEntry()`.

Öppet: **var det entryt ska bo.** Ett eget litet bibliotek är renast men måste
delas till alla som ska läsa det, vilket lägger till steg i driftsättningen. Ett
entry i ett befintligt bibliotek kräver inget nytt men syns i listor och kan
råka redigeras. Avgörs när funktionen byggs, inte nu.

#### Var kan versionen bo? Hela listan

Frågan har två halvor som är lätta att blanda ihop:

- **Spridning** — hur kommer "senaste publicerade bygge" ut till en enhet?
- **Lagring** — var ligger värdet på enheten mellan körningarna?

Det finns exakt **två** kanaler för spridning, eftersom modulcachen är det som
ska kringgås: Mementos egen datasynk (ett entry) eller nätet (`http()`).
Ingenting annat lämnar Jimmys dator.

För lagring finns tre kandidater, och listan är uttömmande — Java-åtkomsten är
blockerad, så det dokumenterade API:t är hela API:t:

| Bärare | Sprider? | Omdöme |
|---|---|---|
| `lib().notes` | ja, via synk | **Död.** `undefined` i appen, och Notes är dessutom struktur — Jimmy får inte skriva den i drift. Uppmätt 11 sep. |
| Ett entry | ja, via synk | Fungerar, men bär hela bibliotekets fältuppsättning. Obligatoriska fält kan stoppa en manuell redigering, och posten blandas med riktig data. Kräver manuell stämpling efter varje push. |
| En fil på enheten (`file()`) | **nej** | Filen är lokal. Den kan aldrig bära ett värde från Jimmys dator till en telefon. Däremot en utmärkt **cache** för ett värde man hämtat på annat sätt. |
| **REST API-connector** | ja, direkt från nätet | **Mest lovande, minst utrett.** Memento har en inbyggd connector som hämtar JSON från en extern tjänst och mappar in i biblioteket. Vårt repo är publikt, så `No Auth` räcker. Då gör *appen* hämtningen — inget `http()` i vår kod, ingen `Network`-permission, ingen manuell stämpling. Se nedan. |

**Filen är alltså inget alternativ till entryt — den löser den andra halvan.**
Kombinationen som blir intressant är därför `http()` + fil:

1. Ett **användartryckt** anrop — `Version`, eller nästa gång någon trycker
   *Skapa* eller *Avsluta* — hämtar `senaste.json` från repot, i `try`/`catch`,
   som mest en gång per dygn.
2. Resultatet skrivs till en lokal fil, tillsammans med tidpunkten.
3. Alla andra körningar läser bara filen. Ingen väntan, fungerar offline, och
   raden visas bara när det publicerade bygget skiljer sig från det som körs.

Det tar bort entryt helt, och det tar bort den manuella stämplingen — kontrollen
blir automatisk. Priset är två nya permissions (`Network` och fil) per
bibliotek och per enhet, plus att Android kräver att användaren pekar ut en
mapp i behörighetsdialogen. Rättigheter per enhet är redan det svåraste i hela
upplägget, så det priset är inte litet.

#### Connectorn — utred den först

Upptäckt 11 sep i strukturvyn: **Structure → Connectors → Add connector → REST
API**. Den hämtar JSON från en extern tjänst och mappar in i biblioteket. Vårt
`senaste.json` ligger i ett publikt repo, så `No Auth` räcker.

Om den gör vad namnet antyder försvinner nästan hela konstruktionen: appen
sköter hämtningen, vår kod läser bara ett värde, ingen `Network`-permission,
ingen fil, ingen manuell stämpling efter push. Connectorn konfigureras i
strukturen — alltså av ägaren, men **en gång vid driftsättningen**, inte per
push. Och den kan mata ett eget litet bibliotek med ett enda fält, vilket
undanröjer invändningen mot entryt: inga obligatoriska fält, ingen
sammanblandning med riktig data.

**Men det avgörande står inte i dokumentationen.** Hjälpsidan beskriver bara
uppsättningen. Det enda som antyder körtiden är inställningen *Cache TTL
(minutes)* — "hur länge den hämtade API-datan lagras lokalt innan Memento
begär färsk data". Det låter mer som en **live-uppslagning per enhet** än som
en bakgrundssynk som skapar entries. Skillnaden är hela skillnaden: en
live-uppslagning når inte en enhet utan täckning, och i värsta fall *väntar*
den.

**Vad som måste mätas:**

- **M4.** Vad händer i flygplansläge när connectorns data behövs? Tomt värde
  och vidare, eller en väntan? En väntan som kan blockera en sparning gör
  connectorn oanvändbar på samma sätt som `http()` i en trigger.
- **M5. BESVARAD 11 sep: connectorn finns inte på Android.** *Edit library* på
  telefonen har bara flikarna MAIN, FIELDS, AGGREGATION, AUTOFILL och NOTES —
  ingen Connectors. Den går alltså bara att **konfigurera** på desktop. Om en
  connector som satts upp på desktop sedan *körs* på telefonen är en annan
  fråga, och den ingår i M6.
- **M6.** Blir hämtad data ett vanligt entry som **synkas** till andra enheter,
  eller hämtar varje enhet för sig? Synkas det är frågan i praktiken löst.

Provas billigast med en connector mot vilken publik JSON som helst, i en kopia,
på desktop och telefon, med och utan täckning.

**Faller connectorn** återstår `http()` + fil, och de mätningarna är:

- **M7.** Hur länge hänger `http().get()` i flygplansläge? Är det trettio
  sekunder duger idén bara i `Version`.
- **M8.** Fungerar `file()` på både desktop och Android, och överlever filen en
  omstart av appen?

Rättighetsfrågan är däremot **besvarad**: script-permissions deklareras i
strukturen och godkänns av användaren själv vid första körningen. `Network`
och fil kostar alltså en dialogruta per enhet, inte en ägarinsats.

#### Bygg det i två steg, med desktop först

Jimmys observation 11 sep, och den ändrar hela ordningen: **import och avslut
görs alltid från desktop**, liksom det mesta arbetet som inte kräver att någon
är på plats. Varje ärende passerar alltså en dator minst två gånger.

**Steg 1 — bara desktop. Ingen bärare behövs alls.**
Datorn hämtar `senaste.json` och jämför mot sitt eget bygge. Punkt. Ingen
synk, inget entry, inget att bestämma om var markören ska bo, inget som rör
telefonerna. Det är den minsta möjliga version som ger verkligt värde, och den
täcker den maskin där mest arbete sker och där en felaktig import kostar mest.
Hämtningen görs där en paus är begriplig — `Version`, eller `Lägg upp` som
redan tar tid och alltid körs inomhus med täckning.

Alla tre riskerna vi oroat oss för försvinner i steg 1: connectorn behöver inte
finnas på Android, `Network` behöver bara godkännas på datorn, och
flygplansläge är inte ett realistiskt läge för en kontorsdator.

**Steg 2 — låt datorn förmedla vidare.**
Först om telefonerna visar sig glida isär i praktiken: datorn skriver det den
hämtat till ett entry, som synkas ut som vanlig data. Telefonerna läser bara
lokalt, utan nät, utan `Network`-permission, utan fil. Då — och först då —
måste frågan om var entryt ska bo besvaras.

Poängen med uppdelningen är att steg 1 kan byggas och driftsättas utan att en
enda av de öppna frågorna behöver besvaras.

**Detta är nu den enda vägen framåt, inte ett tillägg.** Åldersvarningen som
byggdes först är avstängd som standard (11 sep), eftersom den mäter fel sak:
under en lugn period kör alla enheter rätt kod och alla varnar ändå. En markör
att jämföra mot har ingen sådan falsklarmsfrekvens — den säger till bara när
det faktiskt skiljer, och är tyst resten av tiden. Det är hela skillnaden
mellan ett larm som blir kvar och ett som blir avstängt.

Faller även markören kvarstår åldern i `Version`, som man ser när man går och
letar.

**Värdet är begränsat men verkligt.** `push.cmd` säger redan vad byggtiden ska
vara, och `Version` visar vad den är — den som följer rutinen behöver inte
detta. Det här är ett skyddsnät för den som glömmer, och för telefoner som
ingen rört på en månad. Åldersvarningen täcker redan den telefon som ingen rört;
det här täcker fallet där en bugfix är två dagar gammal och enheten inte vet om
det.
