# Driftsättning — vad som måste vara gjort innan driften rörs

`TESTPLAN.md` svarar på *fungerar det?*. Den här filen svarar på *vad krävs för
att våga göra det skarpt?* — och i vilken ordning, så att man kan backa.

**Kravet är inte längre paritet med startpunkten.** Det är att inget som
fungerade förr har blivit sämre. Förbättringar får följa med.

---

## Läget just nu

| | Test | Drift |
|---|---|---|
| Fältarbete — script bytta mot enradsstubbar | nästan klart | inte påbörjat |
| Anläggningar — `Moduler`, stubbar, `Version` | kvar | inte påbörjat |
| Import Fältarbete — samma | kvar | inte påbörjat |
| Fältet `Tidigare fältarbeten` | kvar | inte påbörjat |
| `Historiska Fältarbeten` borttaget ur Fältarbete | kvar | inte påbörjat |
| Library permission per enhet | delvis | inte påbörjat |
| Gamla script raderade (`BORTTAGET.md`) | kvar | inte påbörjat |

Driftbiblioteken är alltså **orörda**, vilket är precis som det ska vara.

---

## Steg 0 — Backup. Görs först, varje gång

Utan denna finns ingen väg tillbaka.

- [ ] Exportera **alla fyra driftbibliotek** som `.mlt2` (*Library menu →
      Export → Template*). Lägg dem i `Raw/` — mappen är gitignorerad, så
      riktig data kan inte råka pushas.
- [ ] Datera filnamnen. Du vill kunna se vilken export som är före respektive
      efter.
- [ ] Kontrollera att filerna går att öppna och innehåller script:
      `python tools/mementools.py extract "Raw" "/tmp/kontroll" "/tmp/kontroll"`
- [ ] Kör **`Granska`** i drift-Anläggningar och anteckna siffrorna. Antalet
      entries ensamt duger inte som mått — driften används ju parallellt, och
      nya poster tillkommer hela tiden. Främmande länkar däremot ska vara noll
      både före och efter.

En template-export innehåller **strukturen och scripten, inte datan**. Går
något sönder i strukturen går den att återställa; ett raderat entry gör det
inte. Rör därför aldrig entries under driftsättningen.

---

## Steg 1 — Klart i test först

Ingen av dessa får vara öppen när driften rörs.

- [ ] `TESTPLAN.md` avsnitt 0–3 avbockade
- [ ] `TESTPLAN.md` avsnitt 4 — hela varvet från **telefonen**, och i
      **Anläggningar** och **Import Fältarbete**, inte bara Fältarbete
- [ ] `TESTPLAN.md` avsnitt 5 — driftbiblioteken orörda av testkörningarna.
      Kör **`Granska`** i drift-Anläggningar; den gör på sekunder det som inte
      går för hand med 670 poster. Noll främmande länkar är kravet.
- [ ] A2 — `Nytt Fältarbete` länkar `Aktivt Fältarbete`, eller varnar synligt
      när den inte gör det
- [ ] A3 — avslut utan koppling stoppas *(reproduceras först: trycktes knappen,
      eller sattes kryssen för hand?)*
- [ ] A4 — `Firmware Status` hamnar i ändringsloggen
- [ ] Ett fältarbete skapat, ändrat och avslutat **i flygplansläge**, i varje
      bibliotek

---

## Steg 2 — Strukturändringar i drift

Gör ett bibliotek i taget. Efter varje bibliotek: öppna ett entry och se att
kortet ser normalt ut.

### Fältarbete

- [ ] Lägg till fältet **`Tidigare fältarbeten`** (Rich text)
- [ ] Ta bort fältet **`Historiska Fältarbeten`** — det kan inte fungera, se
      `KOPIERING.md`. Anläggningens motsvarighet ska vara kvar.
- [ ] Kontrollera `Koppling till anläggning` → pekar på **drift**-Anläggningar
- [ ] Kontrollera `Nyckel` och `Lookup` → drift-Nyckelregister

### Anläggningar

- [ ] `Aktivt Fältarbete` och `Historiska Fältarbeten` → drift-Fältarbete
- [ ] `Nyckel` → drift-Nyckelregister

### Import Fältarbete

- [ ] `Befintlig` → drift-Anläggningar

> **Länkfälten är den farligaste punkten i hela dokumentet.** Pekar ett av dem
> på ett testbibliotek skriver driften i testdata, eller tvärtom. Att de såg
> rätt ut i test säger ingenting — bindningen går på bibliotekets ID.

---

## Steg 3 — Script i drift

Ordningen spelar roll: `Moduler` först, annars finns inga moduler när stubbarna
körs.

För varje bibliotek — **Fältarbete, Anläggningar, Import Fältarbete**:

- [ ] Skapa `Moduler` (Shared) och bocka i modulerna enligt `UPPSATTNING.md`
- [ ] Sätt **Library permission** enligt `KOPIERING.md`
- [ ] Byt varje script mot sin enradsstub
- [ ] Lägg till `Version`-actionen
- [ ] Kör `Version` → 8 moduler, ingen som avviker, rätt byggtid

Nyckelregister har inga script och behöver ingenting.

**Radera de gamla scripten sist**, enligt `BORTTAGET.md`. Shimarna
(`appendToLog`, `updateFirmwareStatus`) gör att både gammalt och nytt fungerar
under tiden — men ligger `LoggWriter` kvar när modulen redan körs kan samma
händelse loggas två gånger. Bli inte stående i det läget längre än nödvändigt.

---

## Steg 4 — Enheterna

Två saker synkroniseras **inte** av Memento och måste göras på varje enhet:

- [ ] **Library permission** — per bibliotek, per telefon, per dator
- [ ] **Hämta om modulerna** i `Moduler` → uppdateringsknappen
- [ ] Kör `Version` på varje enhet och jämför byggtiden

En enhet som missas kraschar tyst medan de andra fungerar. Det är den svåraste
felkällan i hela upplägget, eftersom `Version` ser identisk ut på alla enheter
tills man faktiskt kört den där.

---

## Steg 5 — Första skarpa ärendet

Välj **en** anläggning med känd historik och följ den hela vägen.

- [ ] `Nytt Fältarbete` → skapas och länkas som `Aktivt Fältarbete`
- [ ] `Tidigare fältarbeten` visar historiken, med rätt datum och åtgärder
- [ ] Ändra ett fält, spara → ändringsloggen skrivs
- [ ] Avsluta → anläggningen uppdateras, ärendet hamnar i historiken, låses
- [ ] Jämför med hur det såg ut före bytet. **Har något blivit sämre?**

Är svaret nej på den sista frågan är driftsättningen godkänd.

---

## Om något går fel

1. **Sluta.** Rör inga fler bibliotek.
2. Ett trasigt script gör sällan skada — det kastar ett fel och avbryter.
   Kontrollera i stället om **data** ändrats: fältarbeten som skapats fel,
   anläggningar som fått fel värden.
3. Är strukturen trasig: importera `.mlt2`-filen från steg 0 igen.
4. Är ett script trasigt: klistra tillbaka den gamla koden. Den finns i
   `Startpunkt/Extraherade scripts/` och i git.
5. Skriv ner vad som hände i `ARBETSLAGE.md` innan du glömmer det.

Modulerna i git kan **inte** göra skada i sig — de kör inget förrän ett script
anropar dem. Vill man snabbt neutralisera allt: ta bort modulerna ur `Moduler`,
så slutar stubbarna fungera med ett tydligt fel i stället för att göra fel sak.

---

## Efter driftsättningen

- [ ] Ny `.mlt2`-export av alla fyra bibliotek, som "efter"-läge
- [ ] `python tools/mementools.py fields "Raw" memento/FALT.md` — inventeringen
      ska spegla driftens struktur, inte augustis testexport
- [ ] `ARBETSLAGE.md` uppdaterad: fas, vad som är kvar, beslutslogg
- [ ] Kör `push.cmd`
