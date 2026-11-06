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

- **Importen uppdaterar befintliga anläggningar (avvikelse A5).** Kunduppgifter,
  `Nätstation` och `Leveranspunkt` följde bara med när anläggningen var **ny**.
  Fanns den redan tappades de tyst — det enda som skrevs var en saknad
  koordinat. Nätbolagen kopplar om i nätet och kunduppgifter ändras, så
  orderfilen är ofta färskare än anläggningen.

  `Lägg upp` samlar nu ihop allt som skulle ändras och **frågar i en enda
  dialog** innan något skrivs: en rad per fält, före → efter. Sju fält får
  uppdateras — `Kund`, `Tfn. 1`, `Tfn. 2`, `Mätarplacering`, `Nätstation`,
  `Leveranspunkt` och `Mätarnummer`. `Anl. adress` och `Tjänst` är med flit
  utelämnade: adressen kan vara rättad på plats, och `Tjänst` är nyckeln
  matchningen bygger på — skrivs den om matchar raden inte längre samma
  anläggning nästa gång, och en dubblett uppstår. `Mätarnummer` är med därför
  att nätägaren ibland skickar egen personal som byter mätare.

  Tre beslut som är värda att känna till:

  **Tomt i importfilen raderar aldrig.** Samma regel som
  `tillatTomningVidAvslut` i fältarbetet. Ett tomt fält betyder "inte med i den
  här filen", inte "ta bort".

  **Avbryter man händer ingenting alls** — inga fältarbeten heller, och
  radernas status rörs inte, så en omkörning erbjuder samma sak igen. Skapades
  fältarbetena ändå vore chansen borta: statusen hade bytts och nästa körning
  hade hoppat över raderna.

  **Uppdateringen sker före `skapa()`.** Den kopierar 28 fält från anläggningen
  till det nya fältarbetet, så en uppdatering efteråt hade nått anläggningen men
  inte ärendet man just skapade. Låst med ett `AVSIKT`-test.

  **Knappens kod bär inte med sig någonting** (invariant I12). Mementos
  dialoger körs asynkront och knappkoden kan köras som en ny instans av
  scriptet, utan den körnings variabler som visade rutan. Callbacken är därför
  ett enda anrop — `MV.Import.laggUpp({ godkant: true })` — som hämtar sitt
  eget underlag på nytt. Första versionen slöt om `forslag` och hade varit grön
  i testerna men trasig i appen. Mocken sparar numera knapparnas callbacks utan
  att köra dem, precis som appen, och testet trycker själv.

  Nytt: `MV.ui.fraga()`, `MV.Import.UPPDATERA_FALT`, `MV.Import._tjanstenr()`,
  `MV.Import.foreslagnaAndringar()`, `MV.Import.samlaUppdateringar()`,
  `MV.Import.uppdateringsText()`, `MV.Import.skrivUppdateringar()` och
  `MV.Import.rapportera()`. **Kräver ingenting nytt i appen** — inget fält,
  ingen action, ingen rättighet.
- **`Tjänstenr` är ett krav vid import.** En rad utan nummer markerades förr som
  "Ingen befintlig hittades", och `Lägg upp` skapade då en ny anläggning **utan
  `Tjänst`** bredvid den som redan fanns. Den anläggningen går aldrig att matcha
  igen, så nästa orderfil för samma abonnemang lade upp ännu en. Det förklarar
  dubbletterna Jimmy sett tidigare.

  `Hitta befintliga` lämnar nu sådana rader **obehandlade** i stället för
  felmarkerade, och rapporten säger hur många de är och vad man ska göra. Två
  skäl till att de lämnas obehandlade: `Lägg upp` rör bara rader med en status
  den känner igen, så ingen anläggning kan skapas av misstag — och `Status` är
  ett listfält, så ett nytt värde hade krävt en strukturändring hos ägaren. En
  obehandlad rad dyker dessutom upp igen vid varje körning tills filen rättas.

  `Lägg upp` har dessutom en egen spärr, för rader som hann bli statusmärkta
  innan den här ändringen och ligger kvar i importbiblioteket.

  Samtidigt rättat: en kolumn som saknas i importbiblioteket fällde hela
  körningen med ett okänt-fält-fel. Nätägarnas filer ser inte likadana ut, så
  den hoppas nu över.
- **`memento/KORSCHEMA.md` — det ägaren följer, i en egen fil.** Det som hette
  Del B i `DRIFTSATTNING.md` ligger nu för sig självt, så att filen kan skickas
  som den är utan att först rensas från Del A, kopiorna och repetitionen.

  Numreringen är ny: B0–B7 heter nu steg 1–8, och de åtta delstegen i ett
  biblioteksavsnitt skrivs 2.1, 2.2 och så vidare. Två avsnitt som bara gällde
  en kopia är borta — förklaringen till varför torrkörningens siffror kan se
  tomma ut, och repetitionens egna mätvärden. Tabellen över torrkörningens
  rapport använder nu rapportens exakta ordalydelse, så att den går att jämföra
  rad för rad mot skärmen.

  `DRIFTSATTNING.md` behåller Del A och pekar på den nya filen. `kontroll.js` I5
  läser `KORSCHEMA.md` när den kontrollerar att alla åtta moduler står
  uppräknade — körschemat är enda källan, och får inte finnas på två ställen.
- **Bilder syns i loggen och i historiken.** Begärt av verksamheten 22 sep: man
  fick öppna varje gammalt ärende för att se om någon hade fotograferat.

  Bildfälten går fortfarande inte att diffa — en diff ger en intern referens
  ingen kan läsa, och det AVSIKT-testet står kvar. Men *antalet* går, och det
  är det man faktiskt frågar efter. Läggs en bild till skriver loggen
  `Bild ny mätare: 2 bilder tillagda (totalt 2)`, och en borttagen bild
  formuleras som borttagen. Vid avslut räknas bilderna mot ingenting, så
  anläggningens logg säger vad ärendet bar med sig.

  Historiken bär samma uppgift: rubriken säger *"3 tidigare fältarbeten på
  denna anläggning. 1 av dem har bilder."*, och det ärendet får raden
  `Bilder: 3 bilder i ärendet`. Ett ärende som bara har bilder räknas inte
  längre som "Inget registrerat".

  Nya: `MV.config.faltarbete.bildFalt`, `MV.Faltarbete.bildAntalTotalt()`,
  `MV.Faltarbete.byggBildblock()` och fältet `bilder` i `historikPost()`.
- **Avläsningar och ny mätare ändringsloggas.** Begärt av verksamheten 21 sep.
  `TRACK_FIELDS` omfattar nu `1.8.0`–`4.8.0`, `Tid för avläsning`,
  `Nytt mätarnummer`, `Nytt Star Serienummer` och `1.8.0 Ny`–`4.8.0 Ny`.

  Även **`Kundinformation`**, som var en lucka: fältet skrevs tillbaka till
  anläggningen vid avslut men loggades inte, så ändringen syntes i anläggningen
  utan att det gick att se när eller av vem den gjordes.

  Två sorters fält i samma avsnitt är med flit utelämnade:
  kommentarfälten, som redan loggas som egna block via `COMMENT_FIELDS` och
  annars hade kommit två gånger, och bildfälten, vars diff bara ger en intern
  referens. Båda är låsta med `AVSIKT`-test.
- **`MV.config.datumFalt` — datumfält skrivs som datum.** Memento lämnar
  tillbaka datum som millisekunder, och `MV.fmt.value()` formaterade bara äkta
  `Date`-objekt. `Tid för avläsning` hade därför loggats som
  `1788000000000 -> 1789000000000`.

  Typen går inte att läsa av på värdet — ett stort tal kan lika gärna vara en
  mätarställning — så listan är uttrycklig och hämtad ur `memento/FALT.md`.
  `MV.fmt.datum()` delas nu med historiksammanfattningen, så samma datum visas
  likadant på båda ställena. `0` räknas som tomt fält, inte som 1 januari 1970.

- **Varning när enheten kör ett gammalt bygge — utan nätverk.**
  `MV.byggAlderDagar()` räknar dagar sedan byggstämpeln, och `MV.byggVarning()`
  ger en rad att haka på ett meddelande när gränsen passerats
  (`MV.config.byggVarningDagar`, 30 som standard, 0 stänger av). Raden hakas på
  kvittensen efter *skapa* och *avsluta*, och åldern visas i `Version`.

  Poängen är vad den **inte** gör: inget `http()`, ingen `Network`-permission,
  inget som kan blockera en sparning i flygplansläge. Den besvarar den fråga
  som går att besvara offline — *hur gammal är den här koden?* — i stället för
  den som kräver nät: *finns det en nyare?* Enheten hämtar ändå inte moduler av
  sig själv, så ålder är den signal som betyder något.
- **`Återställ historik`-action.** Bygger upp `Historiska Fältarbeten` och
  `Aktivt Fältarbete` från varje fältarbetes egen `Koppling till anläggning`.
  Avsedd som engångskörning vid driftsättningen: i driften saknar 676 av 706
  anläggningar all historik, eftersom länkfältet var bundet till ett gammalt
  bibliotek och länkningen misslyckades tyst. Torrkörning som standard, lägger
  bara till länkar, tar aldrig bort någon.

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
  moduler som inte laddas i testerna eller inte nämns i körschemat,
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

- **Invariant I11 — en uppgift bor på ett ställe, övriga pekar dit.** Tre
  gånger har två dokument sagt emot varandra: `UPPSATTNING.md` mot Del B, de två
  att-göra-listorna i `ARBETSLAGE.md`, och nu senast avvikelse A5, som låg som
  "punkt 7 under *Planerat*" i en fil där punkt 7 var template-paketet. Ägaren
  hade bett om A5 i samband med driftsättningen, och den låg still i två veckor
  eftersom ingen lista pekade rätt.

  `ARBETSFLODE.md` *Planerat* är nu enda listan. `ARBETSLAGE.md` har en
  översikt utan eget underhållsansvar, märkt med en spegelrad:

  ```
  <!-- speglar: ARBETSFLODE.md#Planerat (9 punkter) -->
  ```

  `kontrolleraDubbelDokumentation()` i `tools/kontroll.js` jämför antalet mot
  källan och kräver att källan är numrerad 1..N i följd. Läggs en punkt till
  utan att översikten rörs säger den ifrån. Den läser inte texten — en punkt
  som bytt innebörd utan att bytt nummer går igenom, och det är den halvan bara
  en människa kan göra. Punktlistan i `CLAUDE.md` del 3 har därför fått ett
  femte steg om att leta upp varje dokument som beskriver det man ändrat.

  Samtidigt rättat: arkivbiblioteket fanns bara i `ARBETSLAGE.md` och saknas
  inte längre i `ARBETSFLODE.md` (punkt 8, template-paketet blev 9), och I5
  pekade fortfarande på `UPPSATTNING.md` i stället för `KORSCHEMA.md`.
- **A5-dialogen skrev `?` i stället för pil.** Uppmätt i appen 6 nov: Mementos
  dialoger renderar inte tecken utanför Latin-1, och `→` (U+2192) kom ut som
  `?` — mitt i raden som bär hela budskapet, `Kund: Anton ? Annan Kund`. Det
  läser som "okänt", inte som "blir". Svenska bokstäver i samma ruta renderades
  korrekt.

  Pilen är nu `->`. Låst med ett `REGRESSION`-test som underkänner all
  användning av U+2192 i dialogtexten, och infört som sanning i `CLAUDE.md`:
  ASCII plus svenska bokstäver i allt som går till `dialog()`, `ui().text()`
  eller `message()`.
- **En Memento-uppdatering kan ta sönder fungerande script.** Ägaren körde en
  period på desktop 3.11.0 och hans befintliga script slutade fungera; de kom
  tillbaka först med 3.11.1 (rapporterat 6 nov, symptomet inte utrett av oss).

  Både han och Jimmy installerar alltid senaste version, och Android uppdaterar
  sig självt — en dålig utgåva når alltså hela flottan. Ny rad i
  sanningstabellen, och en ny punkt i `KORSCHEMA.md` under *Om något ser fel
  ut*: slutar allt fungera samtidigt i alla bibliotek är appversionen första
  misstänkta, inte vår kod. Med rådet att inte installera en nyss släppt
  version mitt i uppsättningen.

  Det här är numera **huvudskälet till I2**. Den yta vi styr över är hur mycket
  av språket vi lutar oss mot.
- **"Rhino 1.7.15 = ES5" var fel, och är rättat.** Påståendet stod överst i
  sanningstabellen, styrde invariant I2 — och hade aldrig mätts.

  Ett syntaxprov på desktop 3.11.1 (6 nov) föll på **rad 7**, och en andra
  körning snävade in det: `let`, `const`, pilfunktioner, template literals,
  spread och `for...of` **parsas alla**. Det enda som fälls är **`const` i ett
  for-huvud** — `for (const v of arr)` ger syntaxfel, `for (var v of arr)` går
  igenom. Stacktracen nämner dessutom `nullishCoalescingExpr` och `expExpr`,
  som inte finns i gammal Rhino. Motorn är alltså nästan helt ES6-kapabel.

  **I2 står ändå kvar**, men skälet är inte längre motorn — det är driftrisk.
  Gränsen ligger där ingen letar: `const` i ett for-huvud ser normalt ut och
  ingen linter varnar. Ett parsfel dödar hela modulen och varje script i
  biblioteket, tyst tills någon trycker på en knapp. Och nivån sätts av den
  äldsta appen i uppsättningen — **ägarens dator är omätt**, och det är hen som
  ska köra driftsättningen. Det är den enda mätning som återstår; det räcker
  att fråga vad hens About-ruta visar.

  I2 bär nu mätningen rad för rad, syntaxprovet att köra om, och ordningen för
  att släppa en konstruktion i taget om det blir aktuellt. `const` i ett
  for-huvud förblir förbjudet oavsett. Felmeddelandet i `kontrolleraES5()` sade
  "Rhino är ES5 och kraschar på det"; det är nu omskrivet, eftersom förbudet är
  en policy och inte en motorgräns.

  Nytt i sanningstabellen: **Android-apparna uppdaterar sig själva, desktop gör
  det inte** (Jimmy 6 nov). Telefonflottan är enhetlig och ny; den äldsta
  enheten i en uppsättning är sannolikt en dator.

  *En lärdom om mätande: första provet frågade efter `Symbol`, `Promise`,
  `Array.includes` och `Object.assign`, fick fyra `function` och såg ut som ett
  klart besked. Alla fyra finns i Rhino 1.7.15 också. Inbyggda objekt säger
  ingenting om syntax — det är parsningen som avgör, och den måste provas med
  syntax.*
- **Appens egen changelog genomläst till 6 nov, tre fynd.** Mirror-filen ligger
  i `Docs/Memento Database Changelog.md`, utanför repot.

  **M12 besvarad: `download()` finns även på Android** (5.10.0, samma datum som
  desktop 3.11.1). Det var frågan connectorn föll på; den faller inte här.

  **Android 5.9.0 bytte JS-motor till Rhino 1.9.1.** Desktop nämner ingen
  motoruppdatering, så samma kod körs nu på olika motorer beroende på enhet och
  appversion. **I2 står fast** — ES5 är den enda nivå som säkert fungerar
  överallt — och invarianten har fått en skrivning om exakt vad som måste vara
  uppmätt innan den ens kan diskuteras.

  **Privata GitHub-repon löser inte sekretessfrågan.** Android 5.9.0 kan koppla
  ett privat repo för att *redigera* script, men Mementos egen text säger att
  synk kräver att repot görs publikt. I3 står fast. Noterat i `GITHUB.md`.
- **`http().download()` tillagd som kandidat till versionsmarkören.** Kom i
  Memento desktop 3.11.0 (21 okt 2026) och kan enligt changelogen spara en
  nedladdad fil direkt i ett **filfält på ett entry** — och filfält synkar.
  Det skulle lösa spridningsfrågan som sänkt varje tidigare variant: datorn
  hämtar, synken bär, telefonerna läser lokalt utan nät och utan
  `Network`-permission. Fyra mätningar står i `ARBETSFLODE.md` punkt 6 som
  M9–M12. **Ingenting är byggt eller provat.** Appens changelog ligger i
  `Docs/Memento Database Changelog.md`.
- **`Bruten i kabelskåp` räknas som en omstart.** Bekräftat 23 sep: bryts
  matningen i kabelskåpet startar modulen om när strömmen kommer tillbaka.
  Räkningen i `ARBETSFLODE.md` punkt 2 tar nu både den och `Terminal omstartad`.
  Funktionen är fortfarande inte byggd.
- **Omstartsräknaren nollställs av både `Terminal bytt` och `Mätare bytt`.**
  Bekräftat av verksamheten 23 sep: det sitter alltid en ny
  kommunikationsmodul på en ny mätare. Skissen i `ARBETSFLODE.md` punkt 2 hade
  bara `Terminal bytt`, vilket gett för höga tal på varje anläggning där
  mätaren bytts — alltså precis där modulen är som nyast. Frågan är struken ur
  *Öppna frågor*. Funktionen är fortfarande inte byggd.
- **Ett dokument i stället för tre.** `DRIFTSATTNING.md` Del B är numera hela
  körschemat: fält, knappfält, `Moduler`, triggrar, actioner, rättigheter och
  raderingar, ett bibliotek i taget, i den ordning sakerna dyker upp i Memento.
  `UPPSATTNING.md` och `BORTTAGET.md` är uppgångna i den och står kvar som
  vägvisare.

  Skälet är uppmätt, inte estetiskt: under generalrepetitionen 15 sep blev
  flera steg gjorda två gånger, eftersom samma sak stod i två filer och
  ordningen var dokumentets i stället för appens. Rättigheterna ligger nu där de
  sitter i gränssnittet — efter scripten, längst ner — och varje bibliotek
  avslutas med en kontroll som ska stämma innan man går vidare.

- **Byggåldersvarningen är avstängd som standard** (`byggVarningDagar = 0`),
  och dess uppmaning är en egen inställning (`byggVarningAtgard`).

  Två skäl, båda Jimmys. Det första: uppmaningen *"uppdatera modullistan"* går
  inte att följa — knappen sitter på script-sidan, som bara ägaren kommer åt.
  Det andra, och viktigare: **ålder är inte samma sak som inaktuell.** Har
  ingen pushat på två månader kör varenda enhet rätt kod, och varenda enhet
  varnar ändå. Under en lugn period är i stort sett varje larm falskt, och ett
  larm som nästan alltid har fel blir avstängt — varefter även det riktiga
  larmet är borta den dagen en rättning inte når fram. Sämre än inget larm,
  eftersom man då tror sig ha ett.

  Åldern visas fortfarande i `Version`, vilket är rätt ställe: den syns när man
  går och letar, i stället för att avbryta ett fältarbete. Koden står kvar och
  kan sättas på per bibliotek när det finns skäl. Låst med ett `AVSIKT`-test så
  att standarden inte glider tillbaka.
- **En modullista i stället för tre.** Alla åtta modulerna bockas nu i på
  `Moduler` i samtliga bibliotek, i stället för en anpassad delmängd per
  bibliotek. En modul för mycket kostar ingenting — allt på toppnivå bara
  definierar (I1) — medan tre listor att hålla isär kostar varje gång något
  ändras. `Version` ska nu rapportera **8 moduler** i alla bibliotek, vilket
  också gör siffran användbar som kontroll. `moment.min.js` är dessutom
  utmärkt i listan som Mementos egen: den ligger inte i vårt repo, och det var
  lätt att missa.

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

- **`Återställ historik` läste som ett godkännande när den inte hade något att
  arbeta med.** Torrkörningen i generalrepetitionen 23 sep rapporterade 786
  fältarbeten, 0 att lägga till och 786 utan koppling — vilket ser ut som
  "allt är redan rätt" men betyder "det finns inga kopplingar alls".

  Rapporten skiljer nu på **utan koppling** (fältet är tomt) och **koppling
  till okänd anläggning** (länken finns men målet gick inte att hämta) — två
  helt olika fel som tidigare räknades ihop. Saknar dessutom *varenda* post
  koppling skrivs en OBS-rad ut som pekar på den troliga orsaken: ett länkfält
  som pekats om, eftersom ompekning kastar länkarna.

  Rapporttexten är utbruten till `aterstallHistorikText()` så att den går att
  läsa i ett test. Det var formuleringen, inte siffrorna, som var problemet.

- **`Återställ historik` kraschade i sitt eget `catch` (generalrepetitionen
  15 sep).** Saknad `Library permission` fick Memento att kasta en
  `PermissionError`. Rhino kan inte bygga catch-scopet för en felklass den inte
  känner till och dog med `No enum constant ...NativeErrors.PermissionError` —
  en Java-stacktrace i loggen i stället för appens egen rättighetsdialog.

  Det defensiva `try`/`catch` runt `MV.db.lib()` gjorde alltså ett tydligt fel
  obegripligt. `MV.db.libEller()` returnerar nu `null` när biblioteket saknas,
  så `granska()` och `aterstallHistorik()` klarar sig utan `catch` och
  rättighetsfel går vidare orörda. Ny invariant I10: **fånga bara fel du själv
  kastat.**
- **`Version` räknade moduler flera gånger.** Rapporterade 16 i Import
  Fältarbete, där två Shared-script råkade heta `Moduler` och båda hade
  modulerna ibockade. Byggstämpeln är den enda satsen på toppnivå som inte är
  idempotent, så allt annat tålde dubbelinläsningen — det var bara räkningen
  som blev fel. `MV.about()` räknar nu varje modul en gång och pekar ut
  dubbletterna med namn och åtgärd.
- **`Firmware Status` hamnade aldrig i ändringsloggen (avvikelse A4).**
  Fältet härleds ur `Firmware` av en egen trigger, och Memento garanterar ingen
  ordning mellan triggrar. Kör den efter `loggaAndringar()` ser diffen det
  gamla värdet — och eftersom det nya värdet ändå hinner sparas ser *nästa*
  diff ingen skillnad alls. Ändringen blev därmed permanent osynlig, inte bara
  försenad ett varv; det förklarar varför den aldrig dök upp hur många gånger
  man än sparade.

  `loggaAndringar()` anropar nu `MV.Firmware.syncStatus(e)` innan diffen tas.
  Har den andra triggern redan kört returnerar den `false` och ingenting
  händer, så resultatet är detsamma oavsett ordning. Tre `REGRESSION`-tester
  fallerar om anropet tas bort.

  *Reproducerad i appen 11 sep, i två bibliotek oberoende av varandra.*
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

