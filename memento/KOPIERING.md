# Kopiera bibliotek — test, drift och nya kunder

**Länkfält binder mot bibliotekets ID, inte mot dess namn.**

Det är den viktigaste raden i det här dokumentet. Kopierar du ett bibliotek
följer länkfältens inställningar med, och de pekar fortfarande på **originalet**.
En testkopia länkar alltså in i drift tills någon ändrar det, för hand, fält för
fält.

Namnmekaniken i `mv-db.js` hjälper inte här. Den avgör vilket bibliotek
*scripten* slår upp — den kan inte påverka vad ett länkfält är bundet till,
eftersom bindningen ligger i bibliotekets struktur och inte i koden.

---

## Vad som kan gå fel om det missas

Ett testfältarbete som ska länkas till en testanläggning, men vars
`Koppling till anläggning` pekar på driftbiblioteket, kan gå två vägar — och
båda är dåliga:

- **Länkningen misslyckas tyst.** Entryt tillhör ett annat bibliotek än fältet
  förväntar sig. Inget fel visas, kopplingen blir bara aldrig gjord, och
  historiken ser tom ut utan förklaring.
- **Länkningen lyckas mot drift.** Då har en testkörning skrivit i skarp data.

Har du kört tester innan länkfälten pekades om: **kontrollera driftbiblioteken**
efter fältarbeten och historikkopplingar som inte hör dit.

---

## Checklista

Åtta fält i tre bibliotek. Nyckelregister har inga.

### Anläggningar

| Fält | Typ | Ska peka på |
|---|---|---|
| `Aktivt Fältarbete` | Link to entry | Fältarbete *(samma uppsättning)* |
| `Historiska Fältarbeten` | Link to entry | Fältarbete *(samma uppsättning)* |
| `Nyckel` | Link to entry | Nyckelregister *(samma uppsättning)* |

### Fältarbete

| Fält | Typ | Ska peka på |
|---|---|---|
| `Koppling till anläggning` | Link to entry | Anläggningar *(samma uppsättning)* |
| `Historiska Fältarbeten` | Link to entry | Fältarbete — **sig självt** |
| `Nyckel` | Link to entry | Nyckelregister *(samma uppsättning)* |
| `Lookup` | Lookup | Nyckelregister *(samma uppsättning)*, fältet med nyckelinfo |

### Import Fältarbete

| Fält | Typ | Ska peka på |
|---|---|---|
| `Befintlig` | Link to entry | Anläggningar *(samma uppsättning)* |

`Koppling till anläggning` och `Aktivt Fältarbete` har `relationType 2` — de är
två sidor av samma tvåvägsrelation. Pekar en av dem fel går relationen sönder i
båda riktningarna.

---

## Glöm inte resten av strukturen

Länkfälten är de uppenbara. Dessa kan också bära biblioteksreferenser och är
värda en genomgång:

- **Relations** — biblioteksrelationer definierade i strukturen
- **Aggregation** — summeringar över länkade entries
- **Autofill** — regler som hämtar från andra bibliotek
- **Dependencies** — fältberoenden
- **Calendar** — om händelser hämtas från ett annat bibliotek

---

## Efter omkopplingen — verifiera

Kör igenom ett helt varv i **testbiblioteken** och kontrollera efteråt att
**driftbiblioteken är orörda**:

1. `Lägg upp` i importen → skapar anläggning och fältarbete. Ligger de i
   testbiblioteken?
2. Avsluta fältarbetet → hamnar det i *test*anläggningens historik?
3. Skapa ett nytt fältarbete → syns historiken, och pekar den på testposter?
4. Öppna driftbiblioteken. Har antalet fältarbeten ändrats? Har någon anläggning
   fått en ny historikpost?

Punkt 4 är den som avgör om något läckt. Gör den först, innan du litar på
resultatet av de andra.

---

## Vid en ny kund

Samma sak gäller när en uppsättning kopieras för en ny kund. Efter kopieringen:

1. Döp om biblioteken enligt konventionen — `<Basnamn> <Kund>`, se
   *Biblioteksnamn* i [README](../README.md).
2. Peka om alla åtta länkfälten ovan till den nya uppsättningen.
3. `Moduler`-scriptet följer med och behöver inget — modulerna hämtas från
   repot och är kundneutrala.
4. Kör `Version` i varje bibliotek. Åtta moduler, ingen som avviker.
5. Kör verifieringen ovan.

Punkt 1 och 2 är oberoende: namnen styr vad *scripten* hittar, ID:na styr vad
*länkfälten* pekar på. Båda måste göras.
