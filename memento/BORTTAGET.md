# Script som ska tas bort i Memento — flyttat

**Listan ligger nu i [`KORSCHEMA.md`](KORSCHEMA.md), som delsteg .7 i varje
biblioteksavsnitt.**

Skälet är att raderingen hör hemma i samma svep som resten av arbetet i det
biblioteket, inte i en egen omgång i slutet. Som egen fil blev den ett extra
dokument att hoppa till, och det var lätt att glömma den helt.

| Bibliotek | Script | Varför |
|---|---|---|
| Fältarbete | Shared: `LoggWriter` | Ligger nu i `mv-logg.js` |
| Fältarbete | Shared: `FirmwareSync` | Ligger nu i `fa-firmware.js` |
| Fältarbete | Action: `Flyttad till knapp - - Spara ändringar och avsluta Fältarbete` | Avstängd dubblett — flyttad till knappfältet, precis som namnet säger. |
| Anläggningar | Shared: `Shared_LoggWriter` | Identisk kopia av `LoggWriter`. Ligger nu i `mv-logg.js` |

Shim-funktionerna `appendToLog()` och `updateFirmwareStatus()` finns kvar i
modulerna, så ordningen spelar ingen roll — inget slutar fungera mitt i.

Kan tas bort med `git rm memento/BORTTAGET.md` när ingen letar efter den längre.
