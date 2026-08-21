# Script som ska tas bort i Memento

Dessa finns inte längre som stubbar — de ska raderas i appen.

| Bibliotek | Script | Varför |
|---|---|---|
| Fältarbete | Shared: `LoggWriter` | Ligger nu i `mv-logg.js` |
| Fältarbete | Shared: `FirmwareSync` | Ligger nu i `fa-firmware.js` |
| Fältarbete | Action: `Flyttad till knapp - - Spara ändringar och avsluta Fältarbete` | Avstängd (`enabled: false`) — flyttad till knappfältet, precis som namnet säger. Dubblett. |
| Anläggningar | Shared: `Shared_LoggWriter` | Identisk kopia av `LoggWriter`. Ligger nu i `mv-logg.js` |

Shim-funktionerna `appendToLog()` och `updateFirmwareStatus()` finns kvar i
modulerna, så ordningen spelar ingen roll — inget slutar fungera mitt i.

Genomgång av alla script i de fyra templaterna: **exakt ett** har
`enabled: false` — action-dubbletten ovan. Övriga 18 är aktiva.
