// Moduler
// Bibliotek: Fältarbete  |  Shared script
//
// Detta scripts ENDA syfte är att bära bibliotekslistan. Bibliotek som är
// ibockade på ett Shared script blir tillgängliga för alla script i
// biblioteket — verifierat på både Android och desktop. Det sparar att bocka
// i samma moduler på varje script.
//
// Bocka i här (ordningen spelar ingen roll, Memento laddar alfabetiskt):
//   moment.min.js
//   mv-core.js
//   mv-format.js
//   mv-db.js
//   mv-logg.js
//   fa-anteckning.js
//   fa-firmware.js
//   fa-faltarbete.js
//
// Koden nedan gör ingenting i sig. Den finns bara för att göra det synligt
// i Output att scriptet körts, om man någon gång behöver felsöka kedjan.
//
// VIKTIGT: läggs en ny modul till i repot måste den bockas i HÄR, annars
// syns den inte för något script i biblioteket. Version-actionen räknar
// modulerna, så avvikelsen upptäcks där.

// (avsiktligt tom)
