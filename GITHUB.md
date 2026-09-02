# GitHub från början

Skriven för dig som inte använt GitHub förut. Följ avsnitten i ordning första
gången; sedan är det bara "Vardagen" du behöver.

Vokabulär, en gång för alla:

| Ord | Betyder |
|---|---|
| **repo** (repository) | mappen med dina filer, plus hela dess historik |
| **commit** | en sparad punkt i historiken, med en förklarande text |
| **push** | skicka dina commits upp till GitHub |
| **pull** | hämta ner ändringar någon annan gjort |
| **origin** | smeknamnet på "repot på GitHub" |
| **main** | huvudgrenen (hette tidigare `master`) |

---

## Första gången (~15 minuter)

### 1. Installera Git

Hämta [Git for Windows](https://git-scm.com/download/win) och kör igenom
installationen med förvalen. Installera även [Node.js](https://nodejs.org)
(LTS-versionen) — det behövs för att köra testerna innan varje push.

Kontrollera i en PowerShell-ruta:

```powershell
git --version
node --version
```

### 2. Berätta vem du är

Git stämplar varje commit med namn och e-post. Engångsinställning:

```powershell
git config --global user.name "Jimmy Josefsson"
git config --global user.email "jimmy.josefsson@miravolt.se"
```

### 3. Skapa repot

På github.com, i organisationen **Miravolt**: **New repository**.

- **Name:** `memento-scripts`
- **Public** — Memento läser filerna utan inloggning, så det är ett krav
- Bocka **inte** i "Add a README file" — vi har redan filer, och ett repo som
  inte är tomt avvisar den första pushen

Namnvalet: små bokstäver med bindestreck är GitHub-konvention och lättare att
skriva in i Mementos *Repositories*-fält på en telefon. Prefixet `memento-`
bildar en familj, så framtida `memento-core`, `memento-faltarbete` eller
`memento-templates` sorteras intill varandra i org-listan.

Repots namn spelar ingen roll för koden. Ingen fil i projektet innehåller
kontonamn eller URL:er — Memento håller själv reda på var repot ligger. Byter
ni namn senare räcker `git remote set-url` plus en ny URL i script-editorn;
GitHub omdirigerar dessutom det gamla namnet.

### 4. Koppla ihop din mapp med GitHub

Öppna PowerShell i repo-mappen — enklast: högerklicka mappen i Utforskaren och
välj *Öppna i Terminal*. Kör raderna en åt gången:

```powershell
git init
git add -A
git commit -m "Första versionen: moduler, stubbar och verktyg"
git branch -M main
git remote add origin https://github.com/Miravolt/memento-scripts.git
git push -u origin main
```

Vid `git push` öppnas ett inloggningsfönster. Logga in med företagskontot —
Windows sparar det, så du slipper göra om det.

Vad raderna gör: `init` gör mappen till ett repo · `add -A` markerar alla filer
· `commit` sparar dem med en text · `branch -M main` döper grenen till main ·
`remote add origin` pekar ut GitHub · `push -u` skickar upp och kommer ihåg vart.

Ladda om github.com-sidan — filerna ska ligga där.

Har du redan ett privat GitHub-konto inloggat på datorn kan pushen gå till fel
konto. Får du `Permission denied` eller `403`: rensa posten i Windows
*Kontrollhanteraren* (se felsökningen längre ner) och försök igen.

### 5. Koppla repot till Memento

I script-editorn: **Add JavaScript libraries** → fliken **Repositories** →
klistra in `github.com/Miravolt/memento-scripts`. Bocka i modulerna enligt
README.md.

---

## Sekretesskontroll

Repot är publikt. Innan varje push läser `push.cmd` filen `.forbjudna-ord` i
repots rot och vägrar pusha om något av orden finns i filinnehåll eller
filnamn. Filen är själv gitignorerad, så listan hamnar aldrig på GitHub.

Kopiera `.forbjudna-ord.exempel` till `.forbjudna-ord` och fyll i era termer —
kundnamn, personnamn, adresser. Ett ord per rad.

Utan filen hoppas kontrollen över, och `push.cmd` säger till om att den saknas.

---

## Vardagen

Efter en ändring i en `mv-*.js`:

**Dubbelklicka `push.cmd`.**

Den kör testerna, gör sekretesskontrollen, visar vad som ändrats, frågar efter
en beskrivning och pushar. Failar något avbryts allt — varken trasig kod eller
kundnamn når GitHub.

Vill du hellre skriva själv:

```powershell
node tools/test.js
git add -A
git commit          # utan -m öppnas din editor, flera rader fungerar
git push
```

### Beskrivningar som är värda något

Texten är vad du läser om ett halvår när du undrar varför något ändrades.

Bra: `Rättade att historik inte kopplades till nya fältarbeten`
Mindre bra: `fix`, `uppdatering`, `test2`

### Flera rader i meddelandet

`push.cmd` frågar efter en beskrivning. Där går det bara att skriva **en rad** —
så fungerar inmatningen i ett konsolfönster.

**Tryck bara Enter utan att skriva något**, så öppnas Anteckningar med en mall.
Skriv hur många rader du vill, **spara** (Ctrl+S) och **stäng fönstret** — då
fortsätter pushen. Lämnar du allt tomt avbryts den i stället.

Formen är den git använder:

```
Kort rubrik i imperativ

Sedan en tom rad, och därefter brödtexten. Här finns plats att förklara
varför ändringen gjordes — vad som var fel, vad som provades, vad som
fortfarande är oklart.
```

Raderna som börjar med `#` i mallen är hjälptext och tas bort automatiskt.
Bland dem listas också vilka filer som ändrats, så du har dem framför dig
medan du skriver.

---

## När det strular

**`fatal: not a git repository`**
Du står i fel mapp. `cd` till repot först.

**`failed to push some refs` / `rejected`**
GitHub har commits du inte har lokalt (du har jobbat från en annan dator).
Hämta dem först: `git pull --rebase`, sedan `git push` igen.

**`remote origin already exists`**
Origin är redan satt. Byt i stället för att lägga till:
`git remote set-url origin <url>`

**Fel inloggning sparad**
Windows *Kontrollhanteraren* → *Autentiseringsuppgifter för Windows* → ta bort
posten som börjar med `git:https://github.com` → nästa push frågar igen.

**Jag ändrade fel och vill tillbaka**
Ospårade ändringar i en fil: `git checkout -- sökväg/till/fil.js`
Se historiken: `git log --oneline`
Hela filen som den såg ut i en tidigare commit: `git checkout <commit-id> -- fil.js`

Ett pushat repo är i praktiken omöjligt att förlora något ur. Var inte rädd för
att experimentera.

---

## Byta repo senare

Skulle repot behöva flyttas eller byta namn:

```powershell
git remote set-url origin https://github.com/<konto>/<repo>.git
git push -u origin main
```

Byt sedan URL i Mementos *Repositories*-flik. Hela historiken följer med, och
ingen kod behöver ändras.

---

## Är repot publikt ett problem?

Memento läser filerna utan inloggning, så repot måste vara publikt. Vad som
hamnar där är värt en tanke:

- **Koden** — logik, fältnamn, bibliotekens namn. Publikt.
- **Er data** — ligger aldrig i repot. Anläggningar, kunder, mätarnummer och
  koordinater bor i Memento.
- **Inga hemligheter i koden.** Skulle något script senare behöva en API-nyckel
  eller ett lösenord får det inte ligga här. Säg till då, det finns lösningar.

Fältnamn som `Mätarnummer` och `Anl Id` avslöjar datamodellen men ingen data.
**Inga kundnamn.** Varken biblioteks- eller fältnamn i repot nämner någon kund.
Kundnamnet ligger som suffix i biblioteksnamnen inne i Memento och härleds vid
körning. Vad repot avslöjar är alltså en datamodell för elmätaruppdrag, inte vem
den är byggd för.

Behöver ni ändå ett privat repo fungerar inte Mementos GitHub-koppling, och då
får vi gå tillbaka till `.mlt2`-vägen med `tools/mementools.py`.
