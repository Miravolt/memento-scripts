// Nytt Fältarbete
// Bibliotek: Anläggningar  |  Action
//
// JS-bibliotek (ordningen spelar ingen roll — Memento laddar
// dem alfabetiskt oavsett vad man bockar i):
//   moment.min.js
//   mv-core.js
//   mv-format.js
//   mv-db.js
//   mv-logg.js
//   fa-faltarbete.js
//
// Skapar ett fältarbete från anläggningen, kopierar fälten, länkar
// tvåvägskopplingen och speglar in historiken i det nya fältarbetet.
// Dialogtexterna ligger i fa-faltarbete.js (MV.Faltarbete.TEXTER).

MV.Faltarbete.skapaMedDialog(entry(), {
    loggText: "Nytt fältarbete skapat från anläggningen."
});
