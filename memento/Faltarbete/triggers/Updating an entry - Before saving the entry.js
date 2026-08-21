// Updating an entry - Before saving the entry
// Bibliotek: Fältarbete  |  Trigger: MODIFY_ENTRY
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
// Jämför entryt mot sitt sparade tillstånd och skriver skillnaderna,
// åtgärderna och kommentarerna i Logg-fältet.

MV.Faltarbete.loggaAndringar();
