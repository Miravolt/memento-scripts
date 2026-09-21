/**
 * mv-format.js — läsa och jämföra fältvärden av vilken typ som helst.
 *
 * Memento returnerar olika saker beroende på fälttyp: sträng, tal, Date,
 * kartobjekt {lat,lng}, ett länkat entry, eller en array av något av det.
 * Att jämföra "före och efter" kräver därför en kanonisk textform.
 *
 * Detta ersätter getSafeString() / getCheckboxArray() / getArray() som fanns
 * i tre olika versioner i olika script.
 *
 * Kräver: mv-core.js
 */

var MV = MV || {};
MV.fmt = MV.fmt || {};

/** Ser ut som en array (Rhino ger inte alltid äkta Array för listfält). */
MV.fmt.isArrayLike = function (value) {
    if (value === null || value === undefined) return false;
    if (value instanceof Array) return true;
    if (typeof Array.isArray === "function" && Array.isArray(value)) return true;
    return typeof value === "object" && typeof value !== "string" &&
        value.length !== undefined;
};

/** Ser ut som ett länkat entry. */
MV.fmt.isEntry = function (value) {
    return value !== null && typeof value === "object" &&
        value.id !== undefined && !MV.fmt.isArrayLike(value);
};

/**
 * Vilket värde som helst -> array. null/tom sträng -> [].
 * Kommaseparerad sträng delas upp.
 */
MV.fmt.toArray = function (value) {
    if (value === null || value === undefined || value === "") return [];
    if (MV.fmt.isArrayLike(value)) {
        var out = [];
        for (var i = 0; i < value.length; i++) {
            if (value[i] !== null && value[i] !== undefined) out.push(value[i]);
        }
        return out;
    }
    if (typeof value === "string") {
        var parts = value.split(",");
        var cleaned = [];
        for (var j = 0; j < parts.length; j++) {
            if (parts[j].trim() !== "") cleaned.push(parts[j].trim());
        }
        return cleaned;
    }
    return [value];
};

/**
 * Detaljrad för ett länkat Nyckel-entry:
 * "Nyckel 12 [Nr: 4711, Plats: Skåp A, Anm: trög]"
 */
MV.fmt.nyckel = function (item) {
    if (!item || typeof item.field !== "function") {
        return item && item.name ? String(item.name) : String(item);
    }

    function part(label, raw) {
        var text;
        if (MV.fmt.isArrayLike(raw)) {
            var tmp = [];
            for (var i = 0; i < raw.length; i++) tmp.push(String(raw[i]));
            text = tmp.join(", ");
        } else {
            text = raw === null || raw === undefined ? "" : String(raw);
        }
        text = text.trim();
        return (text === "" || text === "[]") ? null : label + ": " + text;
    }

    var details = [];
    var candidates = [
        part("Nr", item.field("Nyckel")),
        part("Plats", item.field("Nyckelplats")),
        part("Anm", item.field("Anmärkning")),
        part("Rör", item.field("Anmärkning Nyckelrör"))
    ];
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i]) details.push(candidates[i]);
    }

    var label = item.name || "Nyckel-entry";
    return details.length ? label + " [" + details.join(", ") + "]" : String(label);
};

/**
 * Kanonisk textform av ett fält, för jämförelse och för loggtext.
 * Arrayer slås ihop med " | ". Nyckel-fält får detaljrad.
 */
/**
 * Ett datumvärde som "YYYY-MM-DD", oavsett om Memento lämnat det som ett
 * Date-objekt, som millisekunder eller som en siffersträng.
 *
 * Tom sträng för tomt värde. Går talet inte att tolka returneras det oförändrat
 * — hellre ett obegripligt värde i loggen än ett påhittat datum.
 */
MV.fmt.datum = function (raw) {
    if (raw === null || raw === undefined || raw === "") return "";
    if (raw instanceof Date) return MV.util.dateStr(raw.getTime());

    // 0 är ett tomt datumfält, inte den 1 januari 1970. Ett verkligt datum i
    // den här verksamheten ligger inte i närheten av epoken.
    if (raw === 0) return "";

    if (typeof raw === "number") return MV.util.dateStr(raw);

    var num = Number(raw);
    if (isNaN(num)) return String(raw);
    return num === 0 ? "" : MV.util.dateStr(num);
};

/** true om fältnamnet står i MV.config.datumFalt. */
MV.fmt.arDatumFalt = function (fieldName) {
    var lista = MV.config.datumFalt;
    if (!lista) return false;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i] === fieldName) return true;
    }
    return false;
};

MV.fmt.value = function (entryObj, fieldName) {
    if (!entryObj) return "";

    var raw;
    try {
        raw = entryObj.field(fieldName);
    } catch (ex) {
        return "";
    }

    if (raw === null || raw === undefined || raw === "") return "";

    // Kartfält har ingen vettig toString().
    if (typeof raw === "object" && raw.lat !== undefined && raw.lng !== undefined) {
        return raw.lat + "," + raw.lng;
    }
    if (raw instanceof Date) return MV.util.dateStr(raw.getTime());

    // Datumfält kommer som millisekunder. Se MV.config.datumFalt.
    if (MV.fmt.arDatumFalt(fieldName)) return MV.fmt.datum(raw);

    var items;
    if (MV.fmt.isArrayLike(raw)) {
        items = MV.fmt.toArray(raw);
    } else if (MV.fmt.isEntry(raw)) {
        items = [raw];
    } else {
        return String(raw);
    }

    if (items.length === 0) return "";

    var out = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (fieldName === "Nyckel") {
            out.push(MV.fmt.nyckel(item));
        } else {
            out.push(item.name ? String(item.name) : String(item));
        }
    }
    return out.join(" | ");
};

/**
 * Kryssrutor/listfält som sorterad array av rena strängar, för stabil
 * jämförelse oavsett i vilken ordning användaren kryssade.
 */
MV.fmt.list = function (entryObj, fieldName) {
    if (!entryObj) return [];

    var raw;
    try {
        raw = entryObj.field(fieldName);
    } catch (ex) {
        return [];
    }
    if (raw === null || raw === undefined || raw === "") return [];

    var items = MV.fmt.toArray(raw);
    var out = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var text = item && item.name ? String(item.name) : String(item);
        text = text.replace(/^\[|\]$/g, "").trim();
        // Memento kan ge tillbaka fältnamnet självt för tomma listfält.
        if (text !== "" && text !== fieldName) out.push(text);
    }
    out.sort();
    return out;
};

/** "tomt" i stället för tom sträng, för läsbara loggrader. */
MV.fmt.orEmpty = function (text) {
    return (text === null || text === undefined || text === "") ? "tomt" : text;
};

/** En rad i ändringsloggen. */
MV.fmt.diffLine = function (fieldName, oldText, newText, suffix) {
    return "• " + fieldName + " ändrades från '" + MV.fmt.orEmpty(oldText) +
        "' till '" + MV.fmt.orEmpty(newText) + "'" + (suffix ? " (" + suffix + ")" : "");
};

/**
 * Jämför en lista fältnamn mellan två entries.
 * @return array av loggrader, tom om inget skiljer
 */
MV.fmt.diffFields = function (oldEntry, newEntry, fieldNames) {
    var changes = [];
    for (var i = 0; i < fieldNames.length; i++) {
        var name = fieldNames[i];
        var before = MV.fmt.value(oldEntry, name);
        var after = MV.fmt.value(newEntry, name);
        if (before !== after) changes.push(MV.fmt.diffLine(name, before, after));
    }
    return changes;
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "mv-format", byggd: "2026-09-21 11:06", hash: "1ad0deb" });
