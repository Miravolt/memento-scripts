# Fältuppsättningen i biblioteken

**Genererad — redigera inte för hand.** Kör:

```
python tools/mementools.py fields "Raw" memento/FALT.md
```

Detta är facit för vilka fält som finns och vilken typ de har. Slå upp
här innan du skriver ett fältnamn i koden — att gissa har kostat oss tid
förr, senast när ett statusvärde uppfanns som i själva verket var en
kryssruta.

Vilka *värden* ett listfält kan ha ligger inte i templaten. De står i
[ARBETSFLODE.md](../ARBETSFLODE.md) och kommer från verksamheten.

## Anläggningar

| Fält | Typ | Skrivskyddat |
|---|---|---|
| `Koordinat inmatning` | text |  |
| `Koordinater` | karta |  |
| `Anl. adress` | text |  |
| `Mätarplacering` | text |  |
| `Aktivt Fältarbete` | länk till entry |  |
| **— Nyckel info —** | | |
| `Nyckel` | länk till entry |  |
| **— Kundinfo —** | | |
| `Kund` | text |  |
| `Postadress` | text |  |
| `Postnummer` | text |  |
| `Postort` | text |  |
| `Tfn. 1` | text |  |
| `Tfn. 2` | text |  |
| **— Anläggning —** | | |
| `Tjänst` | text |  |
| `Produktion` | kryssruta |  |
| `Anl Id` | text |  |
| `Anl Id Produktion` | text |  |
| `Säkring` | heltal |  |
| `Nätstation` | text |  |
| `Leveranspunkt` | text |  |
| **— Mätar info —** | | |
| `Mätarnummer` | streckkod |  |
| `Star Serienummer` | streckkod |  |
| `Mätartyp` | lista, ett val |  |
| `Omsättning` | lista, ett val |  |
| `Kom typ` | lista, ett val |  |
| `Antenntyp` | lista, ett val |  |
| `SIM-kort` | streckkod |  |
| `RF-bas` | text |  |
| `Firmware Status` | lista, ett val |  |
| `Firmware uppgraderades` | datum |  |
| `Skapad` | datum och tid |  |
| `Kundinformation` | text |  |
| `Anteckning` | text |  |
| `Logg Datum` | datum |  |
| `Spara anteckning` | knapp |  |
| `Hämta anteckning för valt datum` | knapp |  |
| `Logg` | rich text | ja |
| `Bilder övrigt` | bild |  |
| `Historiska Fältarbeten` | länk till entry |  |
| `Redigeringsläge` | kryssruta |  |

39 fält, i kortets egen ordning.

## Fältarbete

| Fält | Typ | Skrivskyddat |
|---|---|---|
| `Koppling till anläggning` | länk till entry | ja |
| **— Kundinfo —** | | |
| `Kund` | text |  |
| `Postadress` | text |  |
| `Postnummer` | text |  |
| `Postort` | text |  |
| `Tfn. 1` | text |  |
| `Tfn. 2` | text |  |
| **— Anläggning —** | | |
| `Anl. adress` | text |  |
| `Mätarplacering` | text |  |
| `Tjänst` | text |  |
| `Produktion` | kryssruta |  |
| `Anl Id` | text |  |
| `Anl Id Produktion` | text |  |
| `Säkring` | heltal |  |
| `Nätstation` | text |  |
| `Leveranspunkt` | text |  |
| **— Mätar info —** | | |
| `Mätarnummer` | streckkod |  |
| `Star Serienummer` | streckkod |  |
| `Mätartyp` | lista, ett val |  |
| `Omsättning` | lista, ett val |  |
| `Kom typ` | lista, ett val |  |
| `Antenntyp` | lista, ett val |  |
| `SIM-kort` | streckkod |  |
| `RF-bas` | text |  |
| `Firmware Status` | lista, ett val |  |
| `Firmware uppgraderades` | datum |  |
| `User` | användare |  |
| `Status Fältarbete` | lista, ett val |  |
| `Bokning` | datum och tid |  |
| `Koordinater` | karta |  |
| `Anl. adress.` | javascript-fält |  |
| `Kund.` | javascript-fält |  |
| `Mätarplacering.` | javascript-fält |  |
| **— Nyckel info —** | | |
| `Nyckel` | länk till entry |  |
| `Lookup` | lookup |  |
| **— Åtgärd —** | | |
| `Åtgärder` | kryssrutor, flera val |  |
| `Kommentar` | text |  |
| `Lägg till datum i kommentar` | knapp |  |
| **— Befintlig mätare —** | | |
| `Mätarnummer befintlig` | javascript-fält |  |
| `Star Serienummer befintlig` | javascript-fält |  |
| `Firmware` | lista, ett val |  |
| **— Avläsning befintlig —** | | |
| `1.8.0` | decimaltal |  |
| `2.8.0` | decimaltal |  |
| `3.8.0` | decimaltal |  |
| `4.8.0` | decimaltal |  |
| `Tid för avläsning` | datum och tid |  |
| `Kommentar Avläsning` | text |  |
| `Bild befintlig mätare` | bild |  |
| **— Ny mätare —** | | |
| `Nytt mätarnummer` | streckkod |  |
| `Nytt Star Serienummer` | streckkod |  |
| `1.8.0 Ny` | decimaltal |  |
| `2.8.0 Ny` | decimaltal |  |
| `3.8.0 Ny` | decimaltal |  |
| `4.8.0 Ny` | decimaltal |  |
| `Bild ny mätare` | bild |  |
| `Kommentar Ny mätare` | text |  |
| `Kundinformation` | text |  |
| `Anteckning` | text |  |
| `Logg Datum` | datum |  |
| `Spara anteckning` | knapp |  |
| `Hämta anteckning för valt datum` | knapp |  |
| `Logg` | rich text | ja |
| `Bilder övrigt` | bild |  |
| `Tidigare fältarbeten` | rich text |  |
| `Läser i CM` | kryssruta |  |
| `Åter till <kund>` | kryssruta |  |
| `Nytt fältarbete krävs` | kryssruta |  |
| `Avslutad` | kryssruta |  |
| `Skapad` | datum och tid |  |
| `Datum för avslut` | datum och tid |  |
| `Låst för redigering` | kryssruta |  |
| `Spara ändringar och avsluta Fältarbete` | knapp |  |
| `Redigeringsläge` | kryssruta |  |

73 fält, i kortets egen ordning.

## Import Fältarbete

| Fält | Typ | Skrivskyddat |
|---|---|---|
| `Namn` | text |  |
| `Tjänstest. adr` | text |  |
| `Koordinater` | karta |  |
| `Tjänstenr` | heltal |  |
| `Mobilnummer 1` | text |  |
| `Mobilnummer 2` | text |  |
| `App.placering` | text |  |
| `Lev.punkt(1)` | text |  |
| `Lev.punkt(2)` | text |  |
| `Befintlig apparat` | text |  |
| `Befintlig` | länk till entry |  |
| `Status` | lista, ett val |  |
| `Status Koordinater` | lista, ett val |  |

13 fält, i kortets egen ordning.

## Nyckelregister

| Fält | Typ | Skrivskyddat |
|---|---|---|
| `Adress` | text |  |
| `Fastighet` | text |  |
| `Nyckelplats` | lista, flera val |  |
| `Nyckel` | text |  |
| `Anmärkning` | text |  |
| `Anmärkning Nyckelrör` | text |  |
| `Placering Nyckelrör` | karta |  |

7 fält, i kortets egen ordning.
