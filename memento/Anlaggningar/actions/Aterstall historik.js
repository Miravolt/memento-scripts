// Återställ historik
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
// ENGÅNGSKÖRNING efter att "Historiska Fältarbeten" pekats om till rätt
// bibliotek. Bygger upp historiken från varje fältarbetes egen
// "Koppling till anläggning" — avslutade hamnar i historiken, pågående som
// aktivt fältarbete.
//
// Som den står här gör den en TORRKÖRNING: den rapporterar vad den skulle
// göra utan att skriva något. Stämmer rapporten, byt raden till:
//
//   MV.Faltarbete.aterstallHistorikMedDialog({ skarpt: true });
//
// Funktionen lägger bara till länkar. Den tar aldrig bort någon, och den rör
// inga fältvärden.

MV.Faltarbete.aterstallHistorikMedDialog();
