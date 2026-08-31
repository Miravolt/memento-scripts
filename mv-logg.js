/**
 * mv-logg.js — datumindelad HTML-logg i ett Rich text-fält.
 *
 * Loggen lagras som en följd av block:
 *     <h3>YYYY-MM-DD</h3><div> ...innehåll... </div>
 * sorterade med nyaste datum först.
 *
 * Kräver: mv-core.js, moment.min.js
 * Test rad
 */

var MV = MV || {};
MV.Logg = MV.Logg || {};

/**
 * Läser ut loggens HTML till ett objekt { "YYYY-MM-DD": "innehåll-html" }.
 */
MV.Logg.parse = function (logHtml) {
    var blocks = {};
    if (MV.util.isBlank(logHtml)) return blocks;

    var regex = /<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
    var match;

    while ((match = regex.exec(String(logHtml))) !== null) {
        var key = match[1];
        var content = match[2].trim();

        // Skala av dagens yttre ram så att innehållet kan byggas om rent.
        if (content.indexOf("<div") === 0) {
            content = content
                .replace(/^<div[^>]*>/i, "")
                .replace(/<\/div>[\s]*$/i, "");
        }
        blocks[key] = content.trim();
    }
    return blocks;
};

/**
 * Bygger komplett logg-HTML från ett blocks-objekt. Nyaste datum först.
 */
MV.Logg.render = function (blocks) {
    var theme = MV.config.theme;
    var dates = Object.keys(blocks).sort().reverse();
    var html = "";

    for (var i = 0; i < dates.length; i++) {
        var d = dates[i];
        if (MV.util.isBlank(blocks[d])) continue;

        html += '<h3 style="background-color: ' + theme.main +
            '; color: #ffffff; margin: 0; padding: 10px 15px;' +
            ' border-radius: 8px 8px 0 0; font-size: 16px;">' + d + "</h3>\n";
        html += '<div style="border: 1px solid ' + theme.main +
            "; border-top: none; border-radius: 0 0 8px 8px; padding: 15px;" +
            " margin-bottom: 20px; background-color: " + theme.light + ';">\n';
        html += blocks[d] + "\n";
        html += "</div>\n";
    }
    return html;
};

/**
 * Lägger till text i loggen.
 *
 * @param entryObj  Memento entry-objekt
 * @param loggFalt  fältnamn, t.ex. "Logg". Utelämnas -> MV.config.fields.logg
 * @param nyText    ren text; "---" på egen rad blir avdelare
 * @param opts      {
 *                    append: true  lägg till efter befintlig text för datumet
 *                            false skriv över datumets innehåll
 *                    date:   millisekunder/Date — vilket datum posten hör till.
 *                            Utelämnas -> idag.
 *                  }
 *                  Bakåtkompatibelt: opts får vara en boolean = append.
 */
MV.Logg.append = function (entryObj, loggFalt, nyText, opts) {
    if (!entryObj || MV.util.isBlank(nyText)) return false;

    if (typeof opts === "boolean" || opts === undefined || opts === null) {
        opts = { append: opts !== false };
    }

    var field = loggFalt || MV.util.f("logg");
    var append = opts.append !== false;
    var dateStr = MV.util.dateStr(opts.date);

    var noteHtml = MV.util.textToHtml(nyText);
    var blocks = MV.Logg.parse(entryObj.field(field) || "");

    if (blocks[dateStr] && append) {
        blocks[dateStr] = blocks[dateStr] + MV.util.separatorHtml() + noteHtml;
    } else {
        blocks[dateStr] = noteHtml;
    }

    entryObj.set(field, MV.Logg.render(blocks));
    return true;
};

/**
 * Hämtar ett datums innehåll som ren text. null om datumet saknas i loggen.
 */
MV.Logg.get = function (entryObj, dateValue, loggFalt) {
    var field = loggFalt || MV.util.f("logg");
    var blocks = MV.Logg.parse(entryObj.field(field) || "");
    var key = MV.util.dateStr(dateValue);

    if (!blocks.hasOwnProperty(key)) return null;
    return MV.util.htmlToText(blocks[key]);
};

/**
 * Sätter Logg Datum till dagens datum. Körs typiskt från trigger
 * OPEN_ENTRY_CARD eller MODIFY_ENTRY.
 */
MV.Logg.setDatum = function (entryObj) {
    var e = entryObj || entry();
    if (!e || !e.id) return false;

    e.set(MV.util.f("loggDatum"), MV.util.today());
    return true;
};

/* ------------------------------------------------------------------ *
 * Bakåtkompatibilitet
 *
 * Gamla script i biblioteken anropar appendToLog() direkt. Shimen gör att
 * de fortsätter fungera utan ändring; migrera dem till MV.Logg.append()
 * när du ändå är i respektive script.
 * ------------------------------------------------------------------ */
function appendToLog(entryObj, loggFalt, nyText, appendMode) {
    return MV.Logg.append(entryObj, loggFalt, nyText, { append: appendMode !== false });
}

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "mv-logg", byggd: "2026-08-31 15:23", hash: "797bd8b" });
