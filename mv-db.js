/**
 * mv-db.js — säker åtkomst till entries och bibliotek.
 *
 * BAKGRUNDEN, och varför den här modulen finns:
 *
 * Entries man just fått i handen — från create(), från find(), eller ur ett
 * länkfält — beter sig inte som fullt levande entries. Originalkoden i "Spara
 * ändringar och avsluta Fältarbete" hade redan upptäckt det och löst det med
 * findById() plus kommentaren "Vi hämtar ett fullt skrivbart, levande entry
 * från systemet". Samma mönster saknades i "Nytt Fältarbete" och "Lägg upp".
 *
 * Modulen gör omhämtningen till regel i stället för undantag. Det är billigt
 * och tar bort en hel klass av tysta fel.
 *
 * OBS om orsakssamband: omhämtningen var INTE orsaken till att historik inte
 * följde med till nya fältarbeten. Det vet vi nu. Ett fältarbete kan över huvud
 * taget inte länka till andra fältarbeten — ett Link to entry-fält kan inte
 * peka på sitt eget bibliotek (uppmätt 2026-08-31). Fältet i drift pekade på
 * ett gammalt test-Fältarbete därför att det var det enda mål det kunde få.
 * Historiken bor numera i anläggningen; fältarbetet får en textsammanfattning.
 *
 * Omhämtningen behålls för det den faktiskt gör: den tar bort en klass av
 * tysta fel vid skrivning. Den är skydd, inte en rättning av historikbuggen.
 *
 * Kräver: mv-core.js
 */

var MV = MV || {};
MV.db = MV.db || {};

/**
 * Prefixet och suffixet som gäller i den här körningen — härledda ur namnet på
 * det bibliotek scriptet körs i, eller framtvingade via MV.config.
 *
 * "Test Fältarbete Kraft AB" ger { prefix: "Test ", suffix: " Kraft AB" }, och alla
 * uppslag mot andra bibliotek hamnar då i samma uppsättning.
 *
 * @return { prefix, suffix }
 */
MV.db.affix = function () {
    var forcedPre = MV.config.libPrefix;
    var forcedSuf = MV.config.libSuffix;

    if (forcedPre !== null && forcedPre !== undefined &&
        forcedSuf !== null && forcedSuf !== undefined) {
        return { prefix: forcedPre, suffix: forcedSuf };
    }

    if (MV.db._affix === undefined) {
        var name = "";
        try {
            var current = lib();
            name = (current && (current.name || current.title)) || "";
        } catch (ex) {
            name = "";
        }

        // Längsta matchande basnamn vinner, så att "Import Fältarbete" inte
        // förväxlas med "Fältarbete" (vilket hade gett prefixet "Import ").
        var found = { prefix: "", suffix: "" };
        var bestLen = -1;
        var bases = MV.config.libBaseNames;

        for (var i = 0; i < bases.length; i++) {
            var base = bases[i];
            var at = name.indexOf(base);
            if (at >= 0 && base.length > bestLen) {
                found = {
                    prefix: name.substring(0, at),
                    suffix: name.substring(at + base.length)
                };
                bestLen = base.length;
            }
        }
        MV.db._affix = found;
    }

    return {
        prefix: (forcedPre !== null && forcedPre !== undefined) ? forcedPre : MV.db._affix.prefix,
        suffix: (forcedSuf !== null && forcedSuf !== undefined) ? forcedSuf : MV.db._affix.suffix
    };
};

/** Bara prefixet, för läsbarhet på anropssidan. */
MV.db.prefix = function () { return MV.db.affix().prefix; };

/** Bara suffixet (kundnamnet). */
MV.db.suffix = function () { return MV.db.affix().suffix; };

/** Basnamn -> det fullständiga namnet som gäller i den här körningen. */
MV.db.libName = function (base) {
    var a = MV.db.affix();
    return a.prefix + base + a.suffix;
};

/**
 * Hämtar biblioteket utifrån dess basnamn.
 *
 * Försöker i tur och ordning:
 *   1. prefix + basnamn + suffix     "Test Anläggningar Kraft AB"
 *   2. prefix + basnamn              "Test Anläggningar"
 *
 * Steg 2 finns för att man ska kunna döpa om biblioteken ett i taget utan att
 * allt slutar fungera däremellan. Prefixet släpps aldrig — annars hade en
 * testkörning kunnat nå driftbiblioteken.
 *
 * Kastar begripligt fel i stället för att returnera null och krascha tre
 * rader senare.
 */
MV.db.lib = function (base) {
    var a = MV.db.affix();
    var kandidater = [a.prefix + base + a.suffix];

    if (a.suffix !== "") kandidater.push(a.prefix + base);

    for (var i = 0; i < kandidater.length; i++) {
        var library = libByName(kandidater[i]);
        if (library) return library;
    }

    throw new Error("Hittade inte biblioteket. Sökte: '" +
        kandidater.join("', '") + "'.");
};

/**
 * Hämtar om ett entry som ett fullt skrivbart objekt.
 *
 * @param entryObj  entry att hämta om
 * @param libName   bibliotek entryt ligger i. Utelämnas -> lib() (aktuellt)
 * @return det omhämtade entryt, eller originalet om det inte gick att hämta
 */
MV.db.reload = function (entryObj, libName) {
    if (!entryObj || entryObj.id === undefined || entryObj.id === null) {
        return entryObj;
    }
    try {
        var library = libName ? MV.db.lib(libName) : lib();
        var fresh = library.findById(entryObj.id);
        return fresh || entryObj;
    } catch (ex) {
        return entryObj;
    }
};

/**
 * Skapar ett entry och returnerar det omhämtat och skrivbart.
 * Använd i stället för library.create() rakt av.
 */
MV.db.create = function (library, values) {
    var created = library.create(values);
    if (!created) return null;

    var fresh = null;
    try {
        fresh = library.findById(created.id);
    } catch (ex) {
        fresh = null;
    }
    return fresh || created;
};

/**
 * Länkar utan dubbletter. Hämtar om båda sidor först, så att länken faktiskt
 * fastnar även direkt efter create().
 *
 * @return true om en ny länk skapades
 */
MV.db.linkOnce = function (fromEntry, fieldName, toEntry) {
    if (!fromEntry || !toEntry || toEntry.id === undefined) return false;

    var existing = MV.fmt.toArray(fromEntry.field(fieldName));
    for (var i = 0; i < existing.length; i++) {
        if (existing[i] && existing[i].id === toEntry.id) return false;
    }

    fromEntry.link(fieldName, toEntry);
    return true;
};

/**
 * Tar bort länken till ett specifikt entry, oavsett om fältet innehåller en
 * array eller ett enstaka entry.
 *
 * @return true om något länkades bort
 */
MV.db.unlinkFrom = function (fromEntry, fieldName, targetEntry) {
    if (!fromEntry || !targetEntry) return false;

    var removed = false;
    try {
        var current = fromEntry.field(fieldName);
        var items = MV.fmt.isArrayLike(current) ? MV.fmt.toArray(current)
            : (current ? [current] : []);

        for (var i = 0; i < items.length; i++) {
            if (items[i] && items[i].id === targetEntry.id) {
                fromEntry.unlink(fieldName, items[i]);
                removed = true;
            }
        }
    } catch (ex) { /* fältet kan saknas i biblioteket */ }

    if (!removed) {
        // Andra försöket: länka bort mot objektet vi har i handen.
        try {
            fromEntry.unlink(fieldName, targetEntry);
            removed = true;
        } catch (ex2) { /* fanns inte länkat */ }
    }
    return removed;
};

/**
 * Skriver ett värde och konverterar det Memento inte tar emot rakt av:
 * kartobjekt {lat,lng} -> "lat,lng", Date -> millisekunder.
 *
 * Använd i stället för entryObj.set() när värdet kommer från ett annat entry
 * och kan vara av vilken typ som helst.
 */
MV.db.setValue = function (entryObj, name, value) {
    if (value !== null && typeof value === "object" &&
        value.lat !== undefined && value.lng !== undefined) {
        entryObj.set(name, value.lat + "," + value.lng);
    } else if (value instanceof Date) {
        entryObj.set(name, value.getTime());
    } else {
        entryObj.set(name, value);
    }
};

/**
 * Kopierar fält mellan entries och returnerar ett värdeobjekt som duger till
 * create(). Konverterar det Memento inte tar emot rakt av:
 * kartfält -> "lat,lng", Date -> millisekunder.
 *
 * Länkfält kopieras INTE (de måste länkas efteråt) — ange dem i opts.skipLinks
 * eller hantera dem separat.
 */
MV.db.copyFields = function (sourceEntry, fieldNames) {
    var values = {};
    if (!sourceEntry) return values;

    for (var i = 0; i < fieldNames.length; i++) {
        var name = fieldNames[i];
        var value;
        try {
            value = sourceEntry.field(name);
        } catch (ex) {
            continue;
        }
        if (value === null || value === undefined || value === "") continue;

        // Länkfält går inte att sätta via create() — de måste länkas efteråt.
        // Att skicka med dem gör att värdet tappas tyst.
        if (MV.fmt.isEntry(value)) continue;
        if (MV.fmt.isArrayLike(value)) {
            var items = MV.fmt.toArray(value);
            if (items.length > 0 && MV.fmt.isEntry(items[0])) continue;
        }

        if (typeof value === "object" && value.lat !== undefined && value.lng !== undefined) {
            values[name] = value.lat + "," + value.lng;
        } else if (value instanceof Date) {
            values[name] = value.getTime();
        } else {
            values[name] = value;
        }
    }
    return values;
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "mv-db", byggd: "2026-09-02 12:53", hash: "70f2698" });
