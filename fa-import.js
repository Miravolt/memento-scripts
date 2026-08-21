/**
 * fa-import.js — importflödet i importbiblioteket.
 *
 * Två steg:
 *   1. hittaBefintliga()  matcha importrader mot befintliga anläggningar
 *   2. laggUpp()          skapa anläggning där ingen fanns, starta fältarbete
 *
 * Fältarbetet skapas via MV.Faltarbete.skapa() — samma kod som knappen "Nytt
 * Fältarbete" i anläggningsbiblioteket använder. Tidigare fanns hela
 * skapa-logiken, fältlistan och logg-formateringen i två separata kopior.
 *
 * Kräver: mv-core.js, mv-db.js, mv-format.js, mv-logg.js, fa-faltarbete.js, moment.min.js
 */

var MV = MV || {};
MV.Import = MV.Import || {};

// MV.config kan saknas — mv-core.js laddas efter fa-* (alfabetisk ordning).
MV.config = MV.config || {};
MV.config.importen = {
    libAnlaggning: "Anläggningar",

    faltLank: "Befintlig",
    faltTjanstenr: "Tjänstenr",
    faltStatus: "Status",
    faltKoordinatStatus: "Status Koordinater",
    faltKoordinater: "Koordinater",

    // Motsvarande fält i anläggningsbiblioteket
    anlTjanst: "Tjänst",
    anlKoordinater: "Koordinater",

    statusObehandlad: "-",
    statusHittad: "Hittat befintlig",
    statusFlera: "Hittade flera befintliga",
    statusIngen: "Ingen befintlig hittades",
    statusAterstartad: "Befintlig återstartad",
    statusNyUpplagd: "Ny upplagd och startad",
    statusKoordinaterInmatade: "Koordinater inmatade"
};

/**
 * Importrad -> nytt entry i anläggningsbiblioteket.
 * Vänster: fältnamn i importbiblioteket. Höger: fältnamn i anläggningen.
 *
 * Lev.punkt(1) är nätstationen som matar kabelskåpet, Lev.punkt(2) är
 * kabelskåpet som matar elmätaren på ärendet.
 */
MV.Import.FALT_MAPPNING = [
    ["Tjänstest. adr", "Anl. adress"],
    ["Namn", "Kund"],
    ["Mobilnummer 1", "Tfn. 1"],
    ["Mobilnummer 2", "Tfn. 2"],
    ["Tjänstenr", "Tjänst"],
    ["Befintlig apparat", "Mätarnummer"],
    ["App.placering", "Mätarplacering"],
    ["Lev.punkt(1)", "Nätstation"],
    ["Lev.punkt(2)", "Leveranspunkt"]
];


/**
 * Sätter "Status Koordinater" utifrån om raden har koordinater.
 * Körs som MODIFY_ENTRY-trigger och internt av hittaBefintliga().
 *
 * @param hasCoords  valfritt: känt resultat, när koordinaterna precis skrivits
 *                   och inte går att läsa tillbaka pålitligt i samma körning
 */
MV.Import.satKoordinatStatus = function (entryObj, hasCoords) {
    var cfg = MV.config.importen;
    var e = entryObj || entry();
    if (!e) return false;

    var ifyllt = (hasCoords === undefined)
        ? MV.fmt.value(e, cfg.faltKoordinater) !== ""
        : !!hasCoords;

    if (!ifyllt) return false;

    e.set(cfg.faltKoordinatStatus, cfg.statusKoordinaterInmatade);
    return true;
};


/* ================================================================== *
 * Steg 1 — matcha mot befintliga anläggningar
 * ================================================================== */

/**
 * Går igenom obehandlade importrader ("Status" == "-") och länkar dem till
 * anläggningar med exakt samma Tjänstenr.
 *
 * @return { hittade, flera, inga, totalt, rader }
 */
MV.Import.hittaBefintliga = function (opts) {
    var cfg = MV.config.importen;
    opts = opts || {};

    var anlLib = MV.db.lib(cfg.libAnlaggning);
    var rader = lib().entries();

    var hittade = 0, flera = 0, inga = 0;

    for (var r = 0; r < rader.length; r++) {
        var rad = rader[r];

        // Statuskontrollen först — tidigare kördes sökningen i anläggnings-
        // biblioteket för varje rad även när raden skulle hoppas över.
        if (rad.field(cfg.faltStatus) !== cfg.statusObehandlad) continue;

        var tjanstenr = rad.field(cfg.faltTjanstenr);
        var target = String(tjanstenr === null || tjanstenr === undefined ? "" : tjanstenr).trim();
        if (target === "") {
            rad.set(cfg.faltStatus, cfg.statusIngen);
            inga++;
            continue;
        }

        var traffar = anlLib.find(target) || [];
        var exakta = [];

        for (var i = 0; i < traffar.length; i++) {
            var kandidat = traffar[i];
            if (!kandidat || kandidat.deleted) continue;

            var kandidatNr = kandidat.field(cfg.anlTjanst);
            if (String(kandidatNr === null || kandidatNr === undefined ? "" : kandidatNr).trim() === target) {
                exakta.push(kandidat);
            }
        }

        // Rensa gamla länkar innan nya sätts, men bara när vi har något att
        // ersätta dem med.
        if (exakta.length > 0) {
            var befintliga = MV.fmt.toArray(rad.field(cfg.faltLank));
            for (var u = 0; u < befintliga.length; u++) {
                rad.unlink(cfg.faltLank, befintliga[u]);
            }
        }

        var koordinaterSatta = MV.fmt.value(rad, cfg.faltKoordinater) !== "";

        for (var j = 0; j < exakta.length; j++) {
            MV.db.linkOnce(rad, cfg.faltLank, exakta[j]);

            // Koordinaterna från den första exakta träffen SKRIVER ÖVER
            // importradens. Har någon varit på plats tidigare är anläggningens
            // koordinat rättad och mer exakt än den vi får med nya ärenden.
            if (j === 0) {
                var plats = exakta[j].field(cfg.anlKoordinater);
                if (plats && plats.lat !== undefined && plats.lng !== undefined) {
                    rad.set(cfg.faltKoordinater, plats.lat + "," + plats.lng);
                    koordinaterSatta = true;
                }
            }
        }

        if (exakta.length === 1) {
            rad.set(cfg.faltStatus, cfg.statusHittad);
            hittade++;
        } else if (exakta.length > 1) {
            rad.set(cfg.faltStatus, cfg.statusFlera);
            flera++;
        } else {
            rad.set(cfg.faltStatus, cfg.statusIngen);
            inga++;
        }

        // Skickar med resultatet i stället för att läsa tillbaka kartfältet —
        // ett fält som just satts i samma körning kan komma tillbaka som null.
        MV.Import.satKoordinatStatus(rad, koordinaterSatta);
    }

    var totalt = hittade + flera + inga;
    var result = { hittade: hittade, flera: flera, inga: inga, totalt: totalt, rader: rader.length };

    if (!opts.tyst) {
        var lines = ["Totalt " + totalt + " utan status hanterades av " + rader.length + " objekt"];
        if (totalt > 0) {
            lines.push("");
            if (hittade > 0) lines.push(hittade + " - med befintlig anläggning");
            if (flera > 0) lines.push(flera + " - där flera ordrar finns på samma anläggning");
            if (inga > 0) lines.push(inga + " - där ingen anläggning med samma Tjänstenr hittades");
        }
        MV.ui.summary("Hantera kontroller", lines);
    }
    return result;
};


/* ================================================================== *
 * Steg 2 — lägg upp anläggning och starta fältarbete
 * ================================================================== */

/**
 * För varje färdigmatchad importrad: starta ett fältarbete på den befintliga
 * anläggningen, eller lägg upp en ny anläggning först.
 *
 * @return { befintliga, nya, hoppades, totalt, rader, problem }
 */
MV.Import.laggUpp = function (opts) {
    var cfg = MV.config.importen;
    opts = opts || {};

    var anlLib = MV.db.lib(cfg.libAnlaggning);
    var rader = lib().entries();

    var befintliga = 0, nya = 0, hoppades = 0;
    var problem = [];

    for (var r = 0; r < rader.length; r++) {
        var rad = rader[r];
        var status = rad.field(cfg.faltStatus);
        var koordStatus = rad.field(cfg.faltKoordinatStatus);

        if (koordStatus !== cfg.statusKoordinaterInmatade) continue;

        // --- Anläggningen fanns redan ---
        if (status === cfg.statusHittad) {
            var lankade = MV.fmt.toArray(rad.field(cfg.faltLank));
            if (lankade.length === 0) {
                problem.push(rad.name + ": status säger hittad men länken saknas");
                hoppades++;
                continue;
            }

            // Saknar anläggningen koordinat får den importradens, innan
            // fältarbetet skapas — annars kopierar fältarbetet ett tomt fält
            // trots att koordinaten fanns i importfilen. Har anläggningen
            // redan en koordinat rörs den inte; den är rättad på plats.
            var anl = MV.db.reload(lankade[0], cfg.libAnlaggning);
            if (MV.fmt.value(anl, cfg.anlKoordinater) === "") {
                var radKoord = anl ? rad.field(cfg.faltKoordinater) : null;
                if (radKoord && radKoord.lat !== undefined) {
                    MV.db.setValue(anl, cfg.anlKoordinater, radKoord);
                    anl = MV.db.reload(anl, cfg.libAnlaggning);
                }
            }

            var res = MV.Faltarbete.skapa(anl, {
                loggText: "Nytt fältarbete skapat via Import-scriptet."
            });

            if (!res.ok) {
                problem.push(rad.name + ": " + MV.Import._forklara(res.reason));
                hoppades++;
                continue;
            }

            rad.set(cfg.faltStatus, cfg.statusAterstartad);
            befintliga++;
            continue;
        }

        // --- Ingen anläggning fanns: lägg upp en ---
        if (status === cfg.statusIngen) {
            var koordinater = rad.field(cfg.faltKoordinater);
            if (!koordinater || koordinater.lat === undefined) {
                problem.push(rad.name + ": koordinater saknas");
                hoppades++;
                continue;
            }

            var values = { };
            values[cfg.anlKoordinater] = koordinater.lat + "," + koordinater.lng;

            for (var m = 0; m < MV.Import.FALT_MAPPNING.length; m++) {
                var fran = MV.Import.FALT_MAPPNING[m][0];
                var till = MV.Import.FALT_MAPPNING[m][1];
                var value = rad.field(fran);
                if (value !== null && value !== undefined && value !== "") {
                    values[till] = value;
                }
            }

            // MV.db.create hämtar om entryt, så att skapa() nedan kan läsa alla
            // fält ur det. Tidigare skickades det råa create()-objektet vidare,
            // vilket gav halvtomma fältarbeten.
            var nyAnlaggning = MV.db.create(anlLib, values);
            if (!nyAnlaggning) {
                problem.push(rad.name + ": kunde inte skapa anläggning");
                hoppades++;
                continue;
            }

            MV.db.linkOnce(rad, cfg.faltLank, nyAnlaggning);

            var res2 = MV.Faltarbete.skapa(nyAnlaggning, {
                loggText: "Anläggning och fältarbete skapade via Import-scriptet."
            });

            if (!res2.ok) {
                problem.push(rad.name + ": anläggning skapad men " + MV.Import._forklara(res2.reason));
                hoppades++;
                continue;
            }

            rad.set(cfg.faltStatus, cfg.statusNyUpplagd);
            nya++;
        }
    }

    var totalt = befintliga + nya;
    var result = { befintliga: befintliga, nya: nya, hoppades: hoppades,
                   totalt: totalt, rader: rader.length, problem: problem };

    if (!opts.tyst) {
        var lines = ["Totalt " + totalt + " hanterades av " + rader.length + " objekt"];
        if (totalt > 0) {
            lines.push("");
            if (befintliga > 0) lines.push(befintliga + " - med befintlig anläggning");
            if (nya > 0) lines.push(nya + " - där ingen anläggning med samma Tjänstenr hittades");
        }
        if (problem.length > 0) {
            lines.push("");
            lines.push(hoppades + " rad(er) hoppades över:");
            for (var p = 0; p < problem.length && p < 10; p++) {
                lines.push("  " + problem[p]);
            }
            if (problem.length > 10) lines.push("  ...och " + (problem.length - 10) + " fler");
        }
        MV.ui.summary("Hantera kontroller", lines);
    }
    return result;
};

MV.Import._forklara = function (reason) {
    if (reason === "redan-aktivt") return "anläggningen har redan ett aktivt fältarbete";
    if (reason === "ingen-anlaggning") return "ingen anläggning angiven";
    if (reason === "create-misslyckades") return "fältarbetet kunde inte skapas";
    return "okänt fel (" + reason + ")";
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "fa-import", byggd: "2026-08-21 12:34", hash: "57837e5" });
