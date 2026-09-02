/**
 * mv-core.js — grund för alla Miravolt-moduler i Memento Database.
 *
 * Laddas som JavaScript-bibliotek via GitHub-repot. Övriga moduler bygger på
 * MV, men ordningen i bibliotekslistan går inte att styra — se
 * LADDNINGSORDNING nedan.
 *
 * Kräver: moment.min.js
 *
 * OBS: Rhino (Mementos JS-motor) är ES5. Ingen let/const, inga arrow functions,
 * ingen template literal, inget Object.assign.
 * Test rad
 */

var MV = MV || {};

/* ------------------------------------------------------------------ *
 * LADDNINGSORDNING — läs detta innan du ändrar något här
 *
 * Memento laddar JavaScript-biblioteken i ALFABETISK ordning, inte i den
 * ordning man bockar i dem. "fa-anteckning.js" körs alltså före
 * "mv-core.js", trots att den bygger på MV.
 *
 * Därför får INGEN modul förutsätta att en annan redan är laddad. Praktiskt
 * betyder det två regler:
 *
 *   1. Skriv aldrig `MV.nagot = { ... }` rakt av — det raderar vad en
 *      tidigare laddad modul lagt dit. Använd `MV.nagot = MV.nagot || {}`
 *      och `if (!MV.nagot.nyckel) MV.nagot.nyckel = ...`.
 *
 *   2. Anropa aldrig en funktion ur en annan modul på toppnivå. Definiera
 *      bara — anropen sker vid körning, då allt är inläst.
 *
 * Byggstämpeln längst ner i varje modul följer samma regel: den skriver
 * direkt i en array i stället för att anropa MV.stamp().
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Konfiguration
 *
 * Fältnamn på ett ställe. Ska ett enskilt bibliotek avvika, skriv över
 * i bibliotekets egna script (körs efter att biblioteken laddats):
 *
 *     MV.config.fields.logg = "Historik";
 * ------------------------------------------------------------------ */
MV.config = MV.config || {};

if (!MV.config.fields) MV.config.fields = {
    logg: "Logg",
    loggDatum: "Logg Datum",
    anteckning: "Anteckning",
    redigeringslage: "Redigeringsläge",
    kommentar: "Kommentar",
    firmware: "Firmware",
    firmwareStatus: "Firmware Status",
    firmwareUppgraderades: "Firmware uppgraderades"
};

if (!MV.config.theme) MV.config.theme = {
    main: "#1e902b",
    light: "#f4fbf4",
    line: "#7dc284"
};

if (MV.config.dateFormat === undefined) MV.config.dateFormat = "YYYY-MM-DD";

/* -------------------------------------------------------------- *
 * Biblioteksnamn
 *
 * Ett biblioteksnamn består av tre delar:
 *
 *     [prefix] BASNAMN [suffix]
 *      "Test "  "Fältarbete"  " Kraft AB"
 *
 * Prefixet skiljer test från drift. Suffixet skiljer kund från kund.
 * Koden känner bara till basnamnen — prefix och suffix härleds vid
 * körning ur namnet på det bibliotek scriptet körs i:
 *
 *   körs i "Test Fältarbete Kraft AB"  ->  "Test Anläggningar Kraft AB"
 *   körs i "Fältarbete Kraft AB"       ->  "Anläggningar Kraft AB"
 *   körs i "Fältarbete Elnät Syd"      ->  "Anläggningar Elnät Syd"
 *
 * Följden är att varje uppsättning bibliotek bara hittar sina egna. Ingen kod
 * behöver ändras för en ny kund — det räcker att biblioteken döps konsekvent.
 *
 * OBS: detta gäller SCRIPTENS biblioteksuppslag. Länkfält binder mot
 * bibliotekets ID och följer med vid en kopiering — de måste pekas om för
 * hand, annars kan en testkörning nå driftdata. Se memento/KOPIERING.md.
 *
 * Sätt libPrefix/libSuffix till en sträng för att tvinga fram ett visst
 * värde ("" = ingen). null = härled automatiskt.
 * -------------------------------------------------------------- */
if (MV.config.libPrefix === undefined) MV.config.libPrefix = null;
if (MV.config.libSuffix === undefined) MV.config.libSuffix = null;

/**
 * Basnamnen — den gemensamma delen av varje biblioteksnamn, utan prefix och
 * utan kundnamn. Ordningen spelar ingen roll; längsta matchning vinner, så att
 * "Import Fältarbete" inte förväxlas med "Fältarbete".
 */
if (!MV.config.libBaseNames) MV.config.libBaseNames = [
    "Anläggningar",
    "Fältarbete",
    "Import Fältarbete",
    "Nyckelregister"
];

/* ------------------------------------------------------------------ *
 * Byggstämplar — vilken version körs egentligen?
 *
 * Varje modul avslutas med ett MV.stamp()-anrop som tools/stamp.js skriver
 * om vid varje push: samma byggtid för alla moduler, plus en hash per fil.
 *
 * Poängen är att kunna svara på två frågor ute i fält, offline:
 *
 *   "Har min ändring kommit hela vägen hit?"
 *       Jämför byggtiden i appen med den i git.
 *
 *   "Har Memento cachat en gammal version av EN modul?"
 *       Modulen rapporterar då en äldre byggtid än de andra, och MV.about()
 *       flaggar den. Det är annars nästan omöjligt att upptäcka.
 * ------------------------------------------------------------------ */
MV.build = MV.build || { moduler: [] };

/**
 * Nyaste byggtiden bland de laddade modulerna — referensen alla jämförs mot.
 * Räknas ut vid anrop, inte vid inläsning, eftersom modulerna kan komma i
 * vilken ordning som helst.
 */
MV.byggd = function () {
    var senast = "";
    for (var i = 0; i < MV.build.moduler.length; i++) {
        if (MV.build.moduler[i].byggd > senast) senast = MV.build.moduler[i].byggd;
    }
    return senast;
};

/** Moduler vars byggtid avviker från den nyaste — troligen cachade. */
MV.avvikande = function () {
    var senast = MV.byggd();
    var out = [];
    for (var i = 0; i < MV.build.moduler.length; i++) {
        if (MV.build.moduler[i].byggd !== senast) out.push(MV.build.moduler[i]);
    }
    return out;
};

/**
 * Läsbar versionsrapport.
 *
 * @param opts { kort: true } -> en rad, för loggar och meddelanden
 */
MV.about = function (opts) {
    opts = opts || {};

    var antal = MV.build.moduler.length;
    var avvikande = MV.avvikande();
    var byggd = MV.byggd() || "ostämplad";

    if (opts.kort) {
        return "Bygge " + byggd + ", " + antal + " moduler" +
            (avvikande.length > 0 ? " (" + avvikande.length + " AVVIKER)" : "");
    }

    var rader = ["Bygge:   " + byggd, "Moduler: " + antal, ""];

    for (var i = 0; i < MV.build.moduler.length; i++) {
        var m = MV.build.moduler[i];
        rader.push(m.namn + "  " + m.hash +
            (m.byggd !== byggd ? "  <- AVVIKER: " + m.byggd : ""));
    }

    if (avvikande.length > 0) {
        rader.push("");
        rader.push("Minst en modul är äldre än de andra. Memento har troligen");
        rader.push("en cachad version. Läs om repo-kopplingen i script-editorn.");
    }
    return rader.join("\n");
};

MV.util = MV.util || {};

/** Fältnamn ur config, med fallback till nyckeln själv. */
MV.util.f = function (key) {
    return MV.config.fields[key] || key;
};

/** Millisekunder eller Date -> "YYYY-MM-DD". Utan argument: idag. */
MV.util.dateStr = function (value) {
    var m = (value === undefined || value === null) ? moment() : moment(value);
    return m.format(MV.config.dateFormat);
};

/** Dagens datum som millisekunder — Mementos interna datumformat. */
MV.util.today = function () {
    return moment().valueOf();
};

/** true för null, undefined och sträng som bara innehåller whitespace. */
MV.util.isBlank = function (value) {
    return value === null || value === undefined || String(value).trim() === "";
};

/**
 * Ren text -> HTML-block. Rader blir <br>, "---" på egen rad blir avdelare.
 */
MV.util.textToHtml = function (text) {
    if (MV.util.isBlank(text)) return "";

    var parts = String(text).split(/\n*---\n*/);
    var out = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (part) {
            out.push("<div style='margin: 0;'>" + part.replace(/\n/g, "<br>") + "</div>");
        }
    }
    return out.join(MV.util.separatorHtml());
};

/**
 * HTML-block -> ren text. Inversen av textToHtml, tålig mot <p>/<b>/<span>
 * från äldre loggposter.
 */
MV.util.htmlToText = function (html) {
    if (MV.util.isBlank(html)) return "";

    var text = String(html);

    // Yttre omslutande div (dagens ram) tas bort först.
    if (text.indexOf("<div") === 0) {
        text = text.replace(/^<div[^>]*>/i, "").replace(/<\/div>[\s]*$/i, "");
    }

    // Avdelaren får egna radbrytningar; textToHtml sätter <hr> direkt mellan
    // två </div><div> utan radbrytning, och utan detta klistras "---" ihop
    // med texten efter.
    text = text.replace(/<hr[^>]*>/gi, "\n---\n");
    text = text.replace(/<div[^>]*>/gi, "");
    text = text.replace(/<\/div>/gi, "\n");
    text = text.replace(/<p[^>]*>/gi, "");
    text = text.replace(/<\/p>/gi, "\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");

    // Städa runt avdelare och kollapsa överflödiga tomrader.
    text = text.replace(/\n+\s*---\s*\n+/g, "\n---\n");
    text = text.replace(/\n{3,}/g, "\n\n");

    return text.trim();
};

MV.util.separatorHtml = function () {
    return '<hr style="border: 0; border-top: 1px dashed ' +
        MV.config.theme.line + '; margin: 12px 0;">';
};

/**
 * Visar ett meddelande om message() finns. Trigger-script som körs utan UI
 * (batch, sync) har inte alltid message() tillgängligt.
 */
MV.util.say = function (text) {
    if (typeof message === "function") message(text);
};

/* ------------------------------------------------------------------ *
 * Dialoger
 * ------------------------------------------------------------------ */
MV.ui = MV.ui || {};

/** Enkel informationsruta med en OK-knapp. Faller tillbaka på message(). */
MV.ui.info = function (title, text) {
    if (typeof dialog !== "function") {
        MV.util.say(title + "\n\n" + text);
        return;
    }
    dialog()
        .title(title)
        .text(text)
        .positiveButton("Uppfattat!", function () { return true; })
        .show();
};

/**
 * Sammanfattningsruta med en rad per post i lines. Tomma strängar blir
 * blankrader.
 */
MV.ui.summary = function (title, lines) {
    if (typeof dialog !== "function" || typeof ui !== "function") {
        MV.util.say(title + "\n\n" + lines.join("\n"));
        return;
    }
    var layout = [];
    for (var i = 0; i < lines.length; i++) {
        layout.push(ui().text(lines[i]));
    }
    dialog()
        .title(title)
        .view(ui().layout(layout))
        .positiveButton("Fortsätt", function () { return true; })
        .show();
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "mv-core", byggd: "2026-09-02 13:16", hash: "9e6406a" });
