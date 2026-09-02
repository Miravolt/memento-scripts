/**
 * fa-anteckning.js — knappflödet för att skriva och redigera loggposter.
 *
 * Flödet: användaren skriver i fältet "Anteckning", väljer "Logg Datum" och
 * trycker Spara. Vid "Hämta" plockas ett tidigare datum tillbaka in i
 * Anteckning för redigering, och "Redigeringsläge" sätts så att nästa Spara
 * skriver över i stället för att lägga till.
 *
 * Kräver: mv-core.js, mv-logg.js, moment.min.js
 * Test rad
 */

var MV = MV || {};
MV.Anteckning = MV.Anteckning || {};

/**
 * Sparar innehållet i Anteckning till loggen under valt Logg Datum.
 * Tömmer Anteckning och nollar Redigeringsläge efteråt.
 */
MV.Anteckning.spara = function (entryObj) {
    var e = entryObj || entry();

    var fAnteckning = MV.util.f("anteckning");
    var fLoggDatum = MV.util.f("loggDatum");
    var fRedigering = MV.util.f("redigeringslage");

    var text = e.field(fAnteckning);
    var datum = e.field(fLoggDatum);
    var isEditMode = e.field(fRedigering) === true;

    if (MV.util.isBlank(text) || !datum) {
        MV.util.say("Vänligen fyll i både '" + fAnteckning + "' och '" + fLoggDatum + "'.");
        return false;
    }

    var dateStr = MV.util.dateStr(datum);
    var existing = MV.Logg.parse(e.field(MV.util.f("logg")) || "");
    var hadDate = existing.hasOwnProperty(dateStr);

    // Redigeringsläge skriver över datumets innehåll, annars läggs det till.
    MV.Logg.append(e, MV.util.f("logg"), text, {
        append: !isEditMode,
        date: datum
    });

    e.set(fAnteckning, "");
    e.set(fRedigering, false);

    if (isEditMode) {
        MV.util.say("Anteckningen för " + dateStr + " är uppdaterad.");
    } else if (hadDate) {
        MV.util.say("Nytt tillägg sparat under " + dateStr + ".");
    } else {
        MV.util.say("Nytt datum och anteckning skapad för " + dateStr + ".");
    }
    return true;
};

/**
 * Hämtar loggposten för valt Logg Datum tillbaka in i Anteckning och slår
 * på Redigeringsläge.
 */
MV.Anteckning.hamta = function (entryObj) {
    var e = entryObj || entry();

    var fAnteckning = MV.util.f("anteckning");
    var fLoggDatum = MV.util.f("loggDatum");
    var fRedigering = MV.util.f("redigeringslage");

    var datum = e.field(fLoggDatum);

    if (!datum) {
        MV.util.say("Vänligen välj ett datum i '" + fLoggDatum + "' att hämta.");
        return false;
    }

    var dateStr = MV.util.dateStr(datum);
    var text = MV.Logg.get(e, datum);

    if (text === null) {
        MV.util.say("Kunde inte hitta någon anteckning för " + dateStr + " i loggen.");
        return false;
    }

    e.set(fAnteckning, text);
    e.set(fRedigering, true);

    MV.util.say("Anteckningen för " + dateStr + " är hämtad för redigering.");
    return true;
};

/**
 * Lägger till "YYYY-MM-DD: " sist i Kommentar-fältet som prefix för en ny rad.
 */
MV.Anteckning.laggTillDatumIKommentar = function (entryObj, faltnamn) {
    var e = entryObj || entry();
    var field = faltnamn || MV.util.f("kommentar");

    var prefix = MV.util.dateStr() + ": ";
    var current = e.field(field) || "";

    if (String(current).trim() === "") {
        e.set(field, prefix);
    } else {
        e.set(field, current + "\n" + prefix);
    }

    MV.util.say("Datum tillagt i " + field.toLowerCase() + ".");
    return true;
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "fa-anteckning", byggd: "2026-09-02 13:03", hash: "2bffdc9" });
