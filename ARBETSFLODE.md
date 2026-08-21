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
