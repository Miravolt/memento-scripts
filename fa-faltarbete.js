/**
 * fa-faltarbete.js — livscykeln för ett fältarbete.
 *
 *   skapa()          nytt fältarbete från en anläggning (Nytt Fältarbete + Lägg upp)
 *   loggaAndringar() ändringslogg vid spara (MODIFY_ENTRY-trigger)
 *   avsluta()        skriv tillbaka till anläggningen, arkivera och lås
 *
 * Fältlistorna nedan var tidigare kopierade i fyra script. Nu finns de på ett
 * ställe — lägger du till ett fält i biblioteket räcker det att lägga till det här.
 *
 * Kräver: mv-core.js, mv-db.js, mv-format.js, mv-logg.js, moment.min.js
 */

var MV = MV || {};
MV.Faltarbete = MV.Faltarbete || {};

// MV.config kan saknas — mv-core.js laddas efter fa-* (alfabetisk ordning).
MV.config = MV.config || {};
MV.config.faltarbete = {
    libAnlaggning: "Anläggningar",
    libFaltarbete: "Fältarbete",

    linkKoppling: "Koppling till anläggning",  // i FÄLTARBETET -> anläggningen
    linkAktivt: "Aktivt Fältarbete",           // i ANLÄGGNINGEN -> pågående
    linkHistorik: "Historiska Fältarbeten",    // i BÅDA -> avslutade

    faltLast: "Låst för redigering",
    faltAvslutad: "Avslutad",
    faltLaserICM: "Läser i CM",
    faltAterTillNatagare: "Åter till nätägare",
    /**
     * Hette fältet något annat tidigare? Ange det gamla namnet här under
     * övergången — båda läses, så bytet kan göras i lugn takt utan att
     * avslutsknappen slutar validera. Tom sträng = inget alias.
     */
    faltAterTillNatagareAlias: "",
    faltStatus: "Status Fältarbete",
    faltSkapad: "Skapad",
    faltDatumAvslut: "Datum för avslut",
    faltAtgarder: "Åtgärder",
    faltBilder: "Bilder övrigt",
    faltKoordinater: "Koordinater",

    /**
     * Får ett tomt fält i fältarbetet tömma anläggningens ifyllda värde vid
     * avslut?
     *
     * false (standard): nej. Ett tomt fält i fältarbetet betyder "inte
     * ifyllt", inte "radera". Annars räcker det att någon råkar rensa ett fält
     * på telefonen för att uppgiften ska försvinna ur anläggningen — och
     * kundnamn eller koordinat som blankas syns inte förrän någon letar efter
     * dem.
     *
     * Sätt till true för att återgå till det ursprungliga beteendet, där
     * fältarbetet alltid vinner.
     */
    tillatTomningVidAvslut: false
};

/** Fält som kopieras från anläggningen till ett nytt fältarbete. */
MV.Faltarbete.COPY_FROM_ANLAGGNING = [
    "Koordinat inmatning", "Koordinater", "Anl. adress", "Mätarplacering",
    "Nyckel", "Kund", "Postadress", "Postnummer", "Postort", "Tfn. 1",
    "Tfn. 2", "Tjänst", "Produktion", "Anl Id", "Anl Id Produktion",
    "Säkring", "Nätstation", "Leveranspunkt", "Mätarnummer",
    "Star Serienummer", "Mätartyp", "Omsättning", "Kom typ", "Antenntyp",
    "SIM-kort", "RF-bas", "Firmware Status", "Firmware uppgraderades"
];

/**
 * Länkfält som ska följa med till det nya fältarbetet. Dessa kan INTE ingå i
 * COPY_FROM_ANLAGGNING — länkfält går inte att sätta via create(), värdet
 * tappas tyst. "Nyckel" låg tidigare i kopieringslistan, vilket är varför
 * nycklarna inte följde med till nya fältarbeten.
 */
MV.Faltarbete.LINK_FROM_ANLAGGNING = ["Nyckel"];

/** Fält som ändringsloggas när ett fältarbete sparas. */
MV.Faltarbete.TRACK_FIELDS = [
    "Status Fältarbete", "User", "Anl. adress", "Kund", "Nyckel",
    "Postnummer", "Postort", "Tfn. 1", "Tfn. 2", "Tjänst",
    "Produktion", "Anl Id", "Anl Id Produktion", "Säkring",
    "Nätstation", "Leveranspunkt", "Mätarnummer", "Star Serienummer",
    "Mätartyp", "Omsättning", "Kom typ", "Antenntyp", "SIM-kort",
    "RF-bas", "Mätarplacering", "Firmware Status"
];

/**
 * Fält som skrivs tillbaka till anläggningen vid avslut.
 *
 * "Koordinater" ingår: har fältteknikern rättat koordinaten på plats ska
 * anläggningen få den, så att nästa ärende startar från rätt position.
 */
MV.Faltarbete.SYNC_TO_ANLAGGNING = [
    "Koordinater",
    "Anl. adress", "Kund", "Nyckel", "Postadress", "Postnummer", "Postort",
    "Tfn. 1", "Tfn. 2", "Tjänst", "Produktion", "Anl Id", "Anl Id Produktion",
    "Säkring", "Nätstation", "Leveranspunkt", "Mätartyp", "Omsättning",
    "Kom typ", "Antenntyp", "SIM-kort", "RF-bas", "Mätarplacering",
    "Firmware Status", "Firmware uppgraderades", "Kundinformation"
];

/** Kommentarfält som tas med i loggen. */
MV.Faltarbete.COMMENT_FIELDS = [
    "Kommentar", "Kommentar Avläsning", "Kommentar Ny mätare"
];


/* ================================================================== *
 * Åtgärder och kommentarer som loggblock
 * ================================================================== */

/**
 * Bygger loggblock för Åtgärder och kommentarer.
 *
 * @param newEntry  entryt som det ser ut nu
 * @param oldEntry  tidigare tillstånd. null -> ta med allt oavsett ändring
 * @return array av HTML-block (kan vara tom)
 */
MV.Faltarbete.byggAtgardsblock = function (newEntry, oldEntry) {
    var cfg = MV.config.faltarbete;
    var blocks = [];

    var nya = MV.fmt.list(newEntry, cfg.faltAtgarder);
    var gamla = oldEntry ? MV.fmt.list(oldEntry, cfg.faltAtgarder) : null;

    if (gamla === null ? nya.length > 0 : gamla.join("|") !== nya.join("|")) {
        if (nya.length > 0) {
            blocks.push("<b>Åtgärder utförda:</b>\n&nbsp;&nbsp;✔ " +
                nya.join("\n&nbsp;&nbsp;✔ "));
        } else {
            blocks.push("<b>Åtgärder utförda:</b>\n&nbsp;&nbsp;Inga åtgärder markerade");
        }
    }

    for (var i = 0; i < MV.Faltarbete.COMMENT_FIELDS.length; i++) {
        var name = MV.Faltarbete.COMMENT_FIELDS[i];
        var now = MV.fmt.value(newEntry, name);
        var before = oldEntry ? MV.fmt.value(oldEntry, name) : "";

        if (now !== "" && now !== before) {
            blocks.push("<b>" + name + ":</b>\n<span style='color: #555555;'>&nbsp;&nbsp;" +
                now.replace(/\n/g, "\n&nbsp;&nbsp;") + "</span>");
        }
    }
    return blocks;
};


/* ================================================================== *
 * Skapa
 * ================================================================== */

/**
 * Skapar ett fältarbete från en anläggning och länkar ihop allt.
 *
 * @param anlaggning  entry i anläggningsbiblioteket
 * @param opts        { loggText, extra, tillatFleraAktiva }
 * @return { ok, reason, entry, historik }
 */
MV.Faltarbete.skapa = function (anlaggning, opts) {
    var cfg = MV.config.faltarbete;
    opts = opts || {};

    if (!anlaggning) return { ok: false, reason: "ingen-anlaggning" };

    // Fullt skrivbart entry innan vi läser 28 fält ur det. Utan detta blir ett
    // nyss skapat anläggnings-entry (importflödet) halvtomt.
    var anl = MV.db.reload(anlaggning, cfg.libAnlaggning);

    if (!opts.tillatFleraAktiva) {
        var aktiva = MV.fmt.toArray(anl.field(cfg.linkAktivt));
        if (aktiva.length > 0) {
            return { ok: false, reason: "redan-aktivt", entry: aktiva[0] };
        }
    }

    var faltLib = MV.db.lib(cfg.libFaltarbete);
    var historik = MV.fmt.toArray(anl.field(cfg.linkHistorik));

    var values = MV.db.copyFields(anl, MV.Faltarbete.COPY_FROM_ANLAGGNING);
    values[cfg.faltSkapad] = MV.util.today();
    values[cfg.faltStatus] = historik.length > 0 ? "Historik finns" : "Ny";

    if (opts.extra) {
        for (var key in opts.extra) {
            if (opts.extra.hasOwnProperty(key)) values[key] = opts.extra[key];
        }
    }

    var nytt = MV.db.create(faltLib, values);
    if (!nytt) return { ok: false, reason: "create-misslyckades" };

    // Tvåvägskopplingen mellan fältarbete och anläggning.
    MV.db.linkOnce(nytt, cfg.linkKoppling, anl);
    MV.db.linkOnce(anl, cfg.linkAktivt, nytt);

    // Länkfält kopieras inte av create() — de länkas här.
    for (var n = 0; n < MV.Faltarbete.LINK_FROM_ANLAGGNING.length; n++) {
        var linkFalt = MV.Faltarbete.LINK_FROM_ANLAGGNING[n];
        try {
            var lankade = MV.fmt.toArray(anl.field(linkFalt));
            for (var m = 0; m < lankade.length; m++) {
                MV.db.linkOnce(nytt, linkFalt, lankade[m]);
            }
        } catch (ex) { /* fältet finns inte i båda biblioteken */ }
    }

    // Historiken från anläggningen speglas in i det nya fältarbetet, så att
    // tidigare ordrar syns direkt utan att man behöver gå till anläggningen.
    var kopplade = 0;
    for (var i = 0; i < historik.length; i++) {
        var tidigare = MV.db.reload(historik[i], cfg.libFaltarbete);
        if (MV.db.linkOnce(nytt, cfg.linkHistorik, tidigare)) kopplade++;
    }

    MV.Logg.append(nytt, MV.util.f("logg"),
        opts.loggText || "Nytt fältarbete skapat.");

    return { ok: true, entry: nytt, historik: kopplade };
};


/* ================================================================== *
 * Ändringslogg vid spara
 * ================================================================== */

/**
 * Jämför entryt mot sitt sparade tillstånd och skriver skillnaderna i loggen.
 * Körs från trigger "Updating an entry - Before saving the entry".
 *
 * @return true om något loggades
 */
MV.Faltarbete.loggaAndringar = function (entryObj) {
    var e = entryObj || entry();
    if (!e || !e.id) return false;

    var sparad = lib().findById(e.id);
    if (!sparad) return false;

    var changes = MV.fmt.diffFields(sparad, e, MV.Faltarbete.TRACK_FIELDS);
    var atgarder = MV.Faltarbete.byggAtgardsblock(e, sparad);

    if (atgarder.length > 0) changes.push(atgarder.join("\n\n"));
    if (changes.length === 0) return false;

    MV.Logg.append(e, MV.util.f("logg"), changes.join("\n---\n"));
    return true;
};


/* ================================================================== *
 * Avsluta och arkivera
 * ================================================================== */

/**
 * Skriver tillbaka fältarbetets data till anläggningen, flyttar länken från
 * Aktivt till Historiska, loggar i båda och låser fältarbetet.
 *
 * @return { ok, reason, andringar }
 */
MV.Faltarbete.avsluta = function (entryObj) {
    var cfg = MV.config.faltarbete;
    var e = MV.db.reload(entryObj || entry());

    if (e.field(cfg.faltLast)) {
        return { ok: false, reason: "last" };
    }

    var avslutad = e.field(cfg.faltAvslutad);
    var laserICM = e.field(cfg.faltLaserICM);
    var aterTillNatagare = MV.Faltarbete._flagga(e, [
        cfg.faltAterTillNatagare, cfg.faltAterTillNatagareAlias
    ]);

    if (!avslutad || (!laserICM && !aterTillNatagare)) {
        return { ok: false, reason: "validering" };
    }

    var kopplingar = MV.fmt.toArray(e.field(cfg.linkKoppling));
    if (kopplingar.length === 0) {
        return { ok: false, reason: "ingen-koppling" };
    }

    var anl = MV.db.reload(kopplingar[0], cfg.libAnlaggning);
    if (!anl) return { ok: false, reason: "anlaggning-saknas" };

    var changes = [];
    e.set(cfg.faltDatumAvslut, MV.util.today());

    // --- mätarbyte ---
    var nyttMatarnr = MV.fmt.value(e, "Nytt mätarnummer");
    var nyttStar = MV.fmt.value(e, "Nytt Star Serienummer");

    if (nyttMatarnr !== "" || nyttStar !== "") {
        var gammaltMatarnr = MV.fmt.value(anl, "Mätarnummer");
        var gammaltStar = MV.fmt.value(anl, "Star Serienummer");

        anl.set("Mätarnummer", nyttMatarnr);
        anl.set("Star Serienummer", nyttStar);

        if (gammaltMatarnr !== nyttMatarnr) {
            changes.push(MV.fmt.diffLine("Mätarnummer", gammaltMatarnr, nyttMatarnr, "Mätarbyte"));
        }
        if (gammaltStar !== nyttStar) {
            changes.push(MV.fmt.diffLine("Star Serienummer", gammaltStar, nyttStar, "Mätarbyte"));
        }
    }

    // --- övriga fält ---
    for (var i = 0; i < MV.Faltarbete.SYNC_TO_ANLAGGNING.length; i++) {
        var name = MV.Faltarbete.SYNC_TO_ANLAGGNING[i];
        try {
            var faltStr = MV.fmt.value(e, name);
            var anlStr = MV.fmt.value(anl, name);
            if (faltStr === anlStr) continue;

            // Tomt i fältarbetet betyder "inte ifyllt", inte "radera".
            if (faltStr === "" && anlStr !== "" && !cfg.tillatTomningVidAvslut) {
                continue;
            }

            changes.push(MV.fmt.diffLine(name, anlStr, faltStr));

            var faltVal = e.field(name);
            var anlVal = anl.field(name);
            var isLink = MV.Faltarbete._arLankfalt(faltVal) || MV.Faltarbete._arLankfalt(anlVal);

            if (isLink) {
                var gamla = MV.fmt.toArray(anlVal);
                for (var u = 0; u < gamla.length; u++) {
                    if (gamla[u].id !== undefined) anl.unlink(name, gamla[u]);
                }
                var nya = MV.fmt.toArray(faltVal);
                for (var l = 0; l < nya.length; l++) {
                    if (nya[l].id !== undefined) anl.link(name, nya[l]);
                }
            } else {
                MV.db.setValue(anl, name, faltVal);
            }
        } catch (ex) { /* fältet finns inte i båda biblioteken */ }
    }

    // --- bilder läggs till, skriver inte över ---
    var faltBilder = MV.fmt.toArray(e.field(cfg.faltBilder));
    if (faltBilder.length > 0) {
        try {
            var anlBilder = MV.fmt.toArray(anl.field(cfg.faltBilder));
            anl.set(cfg.faltBilder, anlBilder.concat(faltBilder).join(","));
        } catch (ex) { /* fältet kan saknas */ }
    }

    // --- LOGG I ANLÄGGNINGEN ---
    // Detta block var tidigare dött: "var actionText = typeof actionText
    // !== 'undefined' ? actionText : ''" är alltid "" eftersom var-hoisting
    // redan deklarerat variabeln. Ingenting av vad som ändrades nådde
    // anläggningens logg. Samma sak med changes[], som byggdes och slängdes.
    var loggblock = changes.slice(0);
    var atgarder = MV.Faltarbete.byggAtgardsblock(e, null);
    if (atgarder.length > 0) loggblock.push(atgarder.join("\n\n"));

    if (loggblock.length > 0) {
        MV.Logg.append(anl, MV.util.f("logg"), loggblock.join("\n---\n"));
    }

    // --- flytta länken: aktivt -> historik ---
    MV.db.unlinkFrom(anl, cfg.linkAktivt, e);
    MV.db.linkOnce(anl, cfg.linkHistorik, e);

    // --- kvittens i fältarbetets egen logg ---
    MV.Logg.append(e, MV.util.f("logg"),
        "<div style='margin: 0; color: " + MV.config.theme.main +
        ";'><b>Data överförd till anläggning</b><br>" +
        (loggblock.length > 0
            ? loggblock.length + " ändring(ar) sparade till kopplad anläggning."
            : "Inga fältändringar att överföra.") +
        "</div>");

    e.set(cfg.faltLast, true);

    return { ok: true, andringar: changes.length };
};

/**
 * Läser en kryssruta som kan heta olika saker i olika bibliotek. Sant om
 * någon av de angivna fälten är ikryssad. Ett fält som inte finns i
 * biblioteket räknas som ej ikryssat i stället för att stoppa körningen.
 */
MV.Faltarbete._flagga = function (entryObj, namn) {
    for (var i = 0; i < namn.length; i++) {
        if (!namn[i]) continue;
        try {
            if (entryObj.field(namn[i])) return true;
        } catch (ex) { /* fältet finns inte i det här biblioteket */ }
    }
    return false;
};

/* ================================================================== *
 * Dialogtexter
 *
 * Ligger här, inte i knappscripten, så att de versionshanteras med koden.
 * Ska ett bibliotek formulera sig annorlunda går de att skriva över i
 * bibliotekets Shared script:
 *
 *     MV.Faltarbete.TEXTER.last.text = "...";
 * ================================================================== */
MV.Faltarbete.TEXTER = MV.Faltarbete.TEXTER || {
    last: {
        titel: "Varning: Redan sparad",
        text: "Detta fältarbete är redan markerat som sparat till anläggningen.\n\n" +
            "Vill du verkligen skriva över och spara igen? Gör så här:\n" +
            "1. Stäng denna ruta.\n" +
            "2. Kryssa ur rutan 'Låst för redigering' manuellt.\n" +
            "3. Kör detta script igen."
    },
    validering: {
        titel: "Avslut avbrutet",
        text: "Kräver att 'Avslutad' är ikryssad samt antingen 'Läser i CM' " +
            "eller 'Åter till nätägare'."
    },
    ingenKoppling: {
        titel: "Koppling saknas",
        text: "Kunde inte hitta någon kopplad anläggning. Ingenting har sparats."
    },
    redanAktivt: {
        titel: "Ett fältarbete är redan aktivt",
        text: "Det finns redan ett aktivt fältarbete kopplat till denna anläggning.\n\n" +
            "Du måste avsluta och spara det inifrån fältarbetet innan du kan köra " +
            "'Nytt Fältarbete' från anläggningen igen!"
    },
    ovantatAvslut: { titel: "Avslut misslyckades", text: "Oväntat fel: " },
    ovantatSkapa: { titel: "Kunde inte skapa fältarbete", text: "Orsak: " }
};


/* ================================================================== *
 * Knappversioner — gör, och berätta
 *
 * skapa() och avsluta() returnerar ett resultat och visar ingenting. Det gör
 * dem testbara och användbara från batchkörningar. Funktionerna här nedanför
 * lägger på dialogerna, så att knappscripten i appen blir en rad.
 * ================================================================== */

/** avsluta() + dialog. Detta är vad avslutsknappen anropar. */
MV.Faltarbete.avslutaMedDialog = function (entryObj) {
    var res = MV.Faltarbete.avsluta(entryObj);
    var t = MV.Faltarbete.TEXTER;

    if (res.ok) {
        MV.util.say("Fältarbetet har uppdaterats till anläggningen och låsts! (" +
            res.andringar + " ändring(ar))");
    } else if (res.reason === "last") {
        MV.ui.info(t.last.titel, t.last.text);
    } else if (res.reason === "validering") {
        MV.ui.info(t.validering.titel, t.validering.text);
    } else if (res.reason === "ingen-koppling" || res.reason === "anlaggning-saknas") {
        MV.ui.info(t.ingenKoppling.titel, t.ingenKoppling.text);
    } else {
        MV.ui.info(t.ovantatAvslut.titel, t.ovantatAvslut.text + res.reason);
    }
    return res;
};

/** skapa() + dialog. Detta är vad "Nytt Fältarbete"-actionen anropar. */
MV.Faltarbete.skapaMedDialog = function (anlaggning, opts) {
    var res = MV.Faltarbete.skapa(anlaggning || entry(), opts);
    var t = MV.Faltarbete.TEXTER;

    if (res.ok) {
        MV.util.say("Fältarbete skapat och länkat!" +
            (res.historik > 0
                ? " " + res.historik + " tidigare order(s) kopplade."
                : ""));
    } else if (res.reason === "redan-aktivt") {
        MV.ui.info(t.redanAktivt.titel, t.redanAktivt.text);
    } else {
        MV.ui.info(t.ovantatSkapa.titel, t.ovantatSkapa.text + res.reason);
    }
    return res;
};


/** Ser värdet ut som ett länkfält (array av entries, eller ett entry)? */
MV.Faltarbete._arLankfalt = function (value) {
    if (MV.fmt.isEntry(value)) return true;
    var items = MV.fmt.toArray(value);
    return items.length > 0 && items[0] !== null &&
        typeof items[0] === "object" && items[0].id !== undefined;
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "fa-faltarbete", byggd: "2026-08-31 13:37", hash: "e77a943" });
