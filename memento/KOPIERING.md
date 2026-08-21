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

## Script-permissions — måste sättas per bibliotek OCH per enhet

Ett script får inte automatiskt läsa eller skriva i andra bibliotek. Rättigheten
sätts i script-editorn under **Permissions**:

- **Library permission** — vilka bibliotek scriptet får nå. Bocka i de bibliotek
  som listas nedan.
- **Read files / Write files / Network** — behövs **inte** av modulerna.
  Modulerna hämtas av Memento som JavaScript-bibliotek, inte av scriptkoden, så
  ingen `Network`-rättighet krävs för det.

> **Permissions synkroniseras INTE mellan enheter.**
> Det står i klartext i Mementos egen panel. Rättigheterna måste alltså sättas
> om på **varje telefon** och på **varje dator** — annars fungerar scripten på
> en enhet och kraschar tyst på nästa, med samma kod och samma bygge. Det är en
> av de svåraste felkällorna att förstå, eftersom `Version` ser identisk ut på
> båda enheterna.

### Vilka bibliotek varje uppsättning behöver

| Scripten i… | Behöver Library permission till |
|---|---|
| **Anläggningar** | Anläggningar *(sig självt)*, Fältarbete, Nyckelregister |
| **Fältarbete** | Fältarbete *(sig självt)*, Anläggningar, Nyckelregister |
| **Import Fältarbete** | alla fyra: Import Fältarbete, Anläggningar, Fältarbete, Nyckelregister |
| **Nyckelregister** | inga — biblioteket har inga script |

Alltid **samma uppsättning** (samma prefix och samma kund). Bibliotek som inget
script rör — arkiv, kartbibliotek och liknande — ska lämnas obockade.

### Varför just dessa

Listan är läst ur modulkoden, inte gissad:

- **Anläggningar** → `MV.Faltarbete.skapa()` skapar och länkar i *Fältarbete*,
  och `LINK_FROM_ANLAGGNING = ["Nyckel"]` länkar in ur *Nyckelregister*.
- **Fältarbete** → `avsluta()` skriver tillbaka till *Anläggningar* (fältvärden,
  logg, koordinat, historiklänk), och `MV.fmt.value(e, "Nyckel")` läser fält ur
  länkade *Nyckelregister*-entries för loggtexten.
- **Import Fältarbete** → `hittaBefintliga()` och `laggUpp()` söker och skapar i
  *Anläggningar*, och `laggUpp()` anropar därefter `MV.Faltarbete.skapa()`, som
  når *Fältarbete* och *Nyckelregister*. Alltså hela kedjan.

Ändras något av detta i modulerna kan behovet ändras — tabellen hör ihop med
koden och bör uppdateras samtidigt.

### Symptom när det saknas

Felen ser inte ut som rättighetsfel. Räkna med:

- `Hittade inte biblioteket. Sökte: '…'` från `MV.db.lib()` — biblioteket finns,
  men scriptet får inte se det.
- Länkningar och fältkopieringar som verkar gå igenom men inte syns efteråt.
- Fungerar på datorn, inte i telefonen (eller omvänt) — se rutan ovan.

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
   *Går det inte alls: kontrollera Library permission innan du letar vidare.*
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
3. Sätt **Library permission** enligt tabellen ovan — i varje bibliotek och på
   varje enhet.
4. `Moduler`-scriptet följer med och behöver inget — modulerna hämtas från
   repot och är kundneutrala.
5. Kör `Version` i varje bibliotek. Åtta moduler, ingen som avviker.
6. Kör verifieringen ovan.

Punkt 1, 2 och 3 är oberoende av varandra: namnen styr vad *scripten hittar*,
ID:na styr vad *länkfälten pekar på*, och permissions styr vad scripten
*får lov* att nå. Alla tre måste göras — och punkt 3 dessutom om på varje ny
enhet som ska användas i fält.
