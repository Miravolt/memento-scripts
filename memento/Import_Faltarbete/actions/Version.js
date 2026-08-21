// Version
// Bibliotek: Import Fältarbete  |  Action
//
// JS-bibliotek (i denna ordning):
//   moment.min.js
//   mv-core.js
//   ...plus exakt de moduler biblioteket annars använder
//
// Visar vilket bygge som faktiskt körs på den här enheten. Jämför byggtiden
// med den i git för att se om en push kommit hela vägen. Flaggas en modul som
// AVVIKER har Memento cachat en gammal version av just den.
//
// Bocka i ALLA moduler biblioteket använder här — annars listas bara de få
// som är ibockade, och rapporten säger inget om de övriga.

MV.ui.info("Version", MV.about());
