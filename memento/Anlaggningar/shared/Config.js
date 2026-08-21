// Config
// Bibliotek: Anläggningar  |  Shared script
//
// JS-bibliotek: inga behövs — filen rör bara MV.config.
//
// VALFRI. Behövs inte i normalfallet: biblioteks- och kundnamn härleds
// automatiskt, och fältnamnen i mv-core.js/fa-*.js stämmer redan.
//
// Shared script körs för VARJE script i biblioteket, efter att
// JavaScript-biblioteken lästs in men före scriptets egen kod. Det gör detta
// till rätt plats för avvikelser som gäller hela biblioteket — sätt dem här
// en gång i stället för i varje script.
//
// Raderna nedan är exempel och avsiktligt bortkommenterade.

// MV.config kan saknas om det körande scriptet inte har mv-core.js ibockad.
// Guarden gör att detta script aldrig blir det som kraschar.
var MV = MV || {};
MV.config = MV.config || {};

// --- Avvikande fältnamn i just detta bibliotek ---------------------------
// MV.config.fields = MV.config.fields || {};
// MV.config.fields.logg = "Historik";

// --- Tvinga fram test eller drift, i stället för att härleda -------------
// MV.config.libPrefix = "";          // alltid driftbibliotek
// MV.config.libSuffix = " Kund AB";  // alltid en viss kund

// --- Fältarbetets beteende vid avslut -----------------------------------
// MV.config.faltarbete = MV.config.faltarbete || {};
// MV.config.faltarbete.tillatTomningVidAvslut = true;

// --- Gammalt fältnamn som läses parallellt under ett namnbyte -----------
// MV.config.faltarbete = MV.config.faltarbete || {};
// MV.config.faltarbete.faltAterTillNatagareAlias = "Gamla fältnamnet";
