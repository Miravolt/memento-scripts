// Nytt Fältarbete
// Bibliotek: Anläggningar  |  Action
//
// JS-bibliotek (i denna ordning):
//   moment.min.js
//   mv-core.js
//   mv-format.js
//   mv-db.js
//   mv-logg.js
//   mv-faltarbete.js
//
// Skapar ett fältarbete från anläggningen, kopierar fälten, länkar
// tvåvägskopplingen och speglar in historiken i det nya fältarbetet.

var res = MV.Faltarbete.skapa(entry(), {
    loggText: "Nytt fältarbete skapat från anläggningen."
});

if (res.ok) {
    MV.util.say("Fältarbete skapat och länkat!" +
        (res.historik > 0 ? " " + res.historik + " tidigare order(s) kopplade." : ""));

} else if (res.reason === "redan-aktivt") {
    MV.ui.info("Ett fältarbete är redan aktivt",
        "Det finns redan ett aktivt fältarbete kopplat till denna anläggning.\n\n" +
        "Du måste avsluta och spara det inifrån fältarbetet innan du kan köra " +
        "'Nytt Fältarbete' från anläggningen igen!");

} else {
    MV.ui.info("Kunde inte skapa fältarbete", "Orsak: " + res.reason);
}
