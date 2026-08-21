// Spara ändringar och avsluta Fältarbete
// Bibliotek: Fältarbete  |  Knappfält (ft_button)
//
// JS-bibliotek (i denna ordning):
//   moment.min.js
//   mv-core.js
//   mv-format.js
//   mv-db.js
//   mv-logg.js
//   mv-faltarbete.js
//
// Skriver tillbaka till anläggningen, flyttar länken från Aktivt till
// Historiska Fältarbeten, loggar i båda och låser fältarbetet.

var res = MV.Faltarbete.avsluta();

if (res.ok) {
    MV.util.say("Fältarbetet har uppdaterats till anläggningen och låsts! (" +
        res.andringar + " ändring(ar))");

} else if (res.reason === "last") {
    MV.ui.info("Varning: Redan sparad",
        "Detta fältarbete är redan markerat som sparat till anläggningen.\n\n" +
        "Vill du verkligen skriva över och spara igen? Gör så här:\n" +
        "1. Stäng denna ruta.\n" +
        "2. Kryssa ur rutan 'Låst för redigering' manuellt.\n" +
        "3. Kör detta script igen.");

} else if (res.reason === "validering") {
    MV.ui.info("Avslut avbrutet",
        "Kräver att 'Avslutad' är ikryssad samt antingen 'Läser i CM' eller " +
        "'Åter till nätägare'.");

} else if (res.reason === "ingen-koppling" || res.reason === "anlaggning-saknas") {
    MV.ui.info("Koppling saknas",
        "Kunde inte hitta någon kopplad anläggning. Ingenting har sparats.");

} else {
    MV.ui.info("Avslut misslyckades", "Oväntat fel: " + res.reason);
}
