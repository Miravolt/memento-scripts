// Version
// Bibliotek: Anläggningar  |  Action
//
// JS-bibliotek — bocka i ALLA biblioteket använder, så att rapporten säger
// något om samtliga och inte bara om de få som är ibockade.
// Ordningen spelar ingen roll; Memento laddar dem alfabetiskt ändå:
//   moment.min.js
//   mv-core.js
//   mv-format.js
//   mv-db.js
//   mv-logg.js
//   fa-anteckning.js
//   fa-faltarbete.js
//
// Visar vilket bygge som faktiskt körs på den här enheten. Jämför byggtiden
// med den i git för att se om en push kommit hela vägen. Flaggas en modul som
// AVVIKER har Memento cachat en gammal version av just den.

MV.ui.info("Version", MV.about());
