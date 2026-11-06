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
 * Fält som får uppdateras på en anläggning som REDAN FINNS (avvikelse A5).
 *
 * Bara anläggningssidans namn står här; importsidans hämtas ur
 * FALT_MAPPNING, så mappningen finns fortfarande på ett ställe.
 *
 * Tre fält ur mappningen är med flit utelämnade:
 *
 *   Anl. adress
 *       Ingen av sidorna är facit. Adressen kan dessutom vara rättad på plats
 *       av en fältekniker, och en rättelse ska inte skrivas bort av en
 *       orderfil.
 *
 *   Tjänst
 *       Det är NYCKELN vi matchade på. Skrivs den om matchar raden inte längre
 *       samma anläggning nästa gång, och en dubblett skapas i stället.
 *
 *   Koordinater
 *       Hanteras redan, och åt andra hållet: anläggningens koordinat vinner om
 *       den finns, eftersom den är rättad på plats. Se laggUpp().
 *
 * `Mätarnummer` ÄR med, trots att vi kan ha bytt mätaren själva. Nätägaren
 * skickar ibland ut egen personal som byter, och då är deras uppgift den
 * färska. Byter vi mätaren går den vägen åt andra hållet vid avslut
 * (SYNC_TO_ANLAGGNING), och nästa orderfil har då vårt nummer.
 */
MV.Import.UPPDATERA_FALT = [
    "Kund", "Tfn. 1", "Tfn. 2", "Mätarplacering",
    "Nätstation", "Leveranspunkt", "Mätarnummer"
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

    var hittade = 0, flera = 0, inga = 0, utanTjanst = 0;

    for (var r = 0; r < rader.length; r++) {
        var rad = rader[r];

        // Statuskontrollen först — tidigare kördes sökningen i anläggnings-
        // biblioteket för varje rad även när raden skulle hoppas över.
        if (rad.field(cfg.faltStatus) !== cfg.statusObehandlad) continue;

        var target = MV.Import._tjanstenr(rad);
        if (target === "") {
            /*
             * Tjänstenr MÅSTE finnas. Utan det går raden inte att matcha, och
             * tidigare markerades den som "Ingen befintlig hittades" — varpå
             * Lägg upp skapade en ny anläggning utan Tjänst, bredvid den som
             * redan fanns. Det är så dubbletter uppstår.
             *
             * Raden lämnas därför OBEHANDLAD, inte felmarkerad. Två skäl:
             * Lägg upp rör bara rader med en status den känner igen, så en
             * anläggning kan inte skapas av misstag — och Status är ett
             * listfält, så ett nytt värde hade krävt en strukturändring hos
             * ägaren. En obehandlad rad dyker dessutom upp igen vid varje
             * körning tills någon rättar filen, vilket är precis vad man vill.
             */
            utanTjanst++;
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
    var result = { hittade: hittade, flera: flera, inga: inga, totalt: totalt,
                   utanTjanst: utanTjanst, rader: rader.length };

    if (!opts.tyst) {
        var lines = ["Totalt " + totalt + " utan status hanterades av " + rader.length + " objekt"];
        if (totalt > 0) {
            lines.push("");
            if (hittade > 0) lines.push(hittade + " - med befintlig anläggning");
            if (flera > 0) lines.push(flera + " - där flera ordrar finns på samma anläggning");
            if (inga > 0) lines.push(inga + " - där ingen anläggning med samma Tjänstenr hittades");
        }
        if (utanTjanst > 0) {
            lines.push("");
            lines.push("OBS: " + utanTjanst + " rad(er) saknar Tjänstenr.");
            lines.push("De är INTE behandlade och ingen anläggning läggs upp");
            lines.push("för dem. Utan Tjänstenr går de inte att matcha, och");
            lines.push("resultatet hade blivit en dubblett bredvid den");
            lines.push("anläggning som redan finns.");
            lines.push("Fyll i Tjänstenr och kör Hitta befintliga igen.");
        }
        MV.ui.summary("Hantera kontroller", lines);
    }
    return result;
};

/** Tjänstenr som trimmad sträng. Tom sträng när fältet saknas eller är tomt. */
MV.Import._tjanstenr = function (rad) {
    var nr;
    try {
        nr = rad.field(MV.config.importen.faltTjanstenr);
    } catch (ex) {
        return "";
    }
    if (nr === null || nr === undefined) return "";
    return String(nr).trim();
};


/* ================================================================== *
 * Uppdatera befintliga anläggningar (avvikelse A5)
 *
 * Tidigare följde kunduppgifter, Nätstation och Leveranspunkt bara med när
 * anläggningen var NY. Fanns den redan tappades de tyst — det enda som skrevs
 * var en saknad koordinat. Nätbolagen kopplar om i nätet och kunduppgifter
 * ändras, så uppgifterna i orderfilen är ofta färskare än våra.
 *
 * Det får ändå inte ske i tysthet: det här skriver över uppgifter som någon
 * kan ha rättat för hand. Därför föreslås ändringarna först, i en enda dialog,
 * och skrivs bara om den godkänns.
 * ================================================================== */

/**
 * Vilka fält på anläggningen som skulle ändras av importraden.
 *
 * Tomt i importen betyder "inte med i den här filen", aldrig "radera".
 * Samma regel som tillatTomningVidAvslut i fältarbetet.
 *
 * @return array av { falt, fran, till }, tom om inget skiljer
 */
MV.Import.foreslagnaAndringar = function (rad, anl) {
    var andringar = [];
    if (!rad || !anl) return andringar;

    for (var i = 0; i < MV.Import.FALT_MAPPNING.length; i++) {
        var fran = MV.Import.FALT_MAPPNING[i][0];
        var till = MV.Import.FALT_MAPPNING[i][1];

        if (MV.Import.UPPDATERA_FALT.indexOf(till) === -1) continue;

        var nytt = MV.fmt.value(rad, fran);
        if (nytt === "") continue;

        var gammalt = MV.fmt.value(anl, till);
        if (gammalt === nytt) continue;

        andringar.push({ falt: till, fran: gammalt, till: nytt });
    }
    return andringar;
};

/**
 * Går igenom raderna och samlar allt som skulle ändras, utan att skriva något.
 *
 * Bara rader som laggUpp faktiskt skulle behandla tas med — samma två villkor
 * som där. Annars skulle dialogen lova ändringar på rader som sedan hoppas
 * över, och siffrorna hade inte gått ihop.
 *
 * @return { poster: [{ rad, anl, andringar }], antalAnlaggningar, antalAndringar }
 */
MV.Import.samlaUppdateringar = function (rader) {
    var cfg = MV.config.importen;
    var poster = [];
    var antalAndringar = 0;

    for (var r = 0; r < rader.length; r++) {
        var rad = rader[r];

        if (rad.field(cfg.faltKoordinatStatus) !== cfg.statusKoordinaterInmatade) continue;
        if (rad.field(cfg.faltStatus) !== cfg.statusHittad) continue;

        var lankade = MV.fmt.toArray(rad.field(cfg.faltLank));
        if (lankade.length === 0) continue;

        var anl = MV.db.reload(lankade[0], cfg.libAnlaggning);
        var andringar = MV.Import.foreslagnaAndringar(rad, anl);
        if (andringar.length === 0) continue;

        poster.push({ rad: rad, anl: anl, andringar: andringar });
        antalAndringar += andringar.length;
    }

    return {
        poster: poster,
        antalAnlaggningar: poster.length,
        antalAndringar: antalAndringar
    };
};

/** Dialogens rader. Bryts ut för att gå att läsa i ett test. */
MV.Import.uppdateringsText = function (forslag, maxPoster) {
    var lines = [
        forslag.antalAnlaggningar + " anläggning(ar) får ändrade uppgifter, " +
        forslag.antalAndringar + " ändring(ar) totalt.",
        ""
    ];

    var tak = maxPoster || 12;
    for (var i = 0; i < forslag.poster.length && i < tak; i++) {
        var post = forslag.poster[i];
        lines.push(post.anl && post.anl.name ? String(post.anl.name) : "(utan namn)");

        for (var a = 0; a < post.andringar.length; a++) {
            var and = post.andringar[a];
            /*
             * ASCII-pil med flit. Mementos dialoger renderar INTE tecken
             * utanför Latin-1: "→" (U+2192) kom ut som "?" på desktop 3.11.1,
             * mitt i den rad som bär hela budskapet. Svenska bokstäver
             * fungerar; symboler gör det inte. Uppmätt 6 nov 2026.
             */
            lines.push("   " + and.falt + ": " +
                MV.fmt.orEmpty(and.fran) + " -> " + and.till);
        }
        lines.push("");
    }

    if (forslag.poster.length > tak) {
        lines.push("...och " + (forslag.poster.length - tak) + " anläggning(ar) till.");
        lines.push("");
    }

    lines.push("Tomma fält i importfilen rör ingenting.");
    lines.push("Avbryter du skrivs inget alls, och du kan köra om.");
    return lines;
};

/**
 * Skriver de godkända ändringarna och loggar dem i anläggningen.
 *
 * @return antal anläggningar som ändrades
 */
MV.Import.skrivUppdateringar = function (forslag) {
    var andrade = 0;

    for (var i = 0; i < forslag.poster.length; i++) {
        var post = forslag.poster[i];
        var anl = post.anl;
        var rader = [];

        for (var a = 0; a < post.andringar.length; a++) {
            var and = post.andringar[a];
            anl.set(and.falt, and.till);
            rader.push(MV.fmt.diffLine(and.falt, and.fran, and.till, "importen"));
        }

        MV.Logg.append(anl, MV.util.f("logg"), rader.join("\n"));
        andrade++;
    }
    return andrade;
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
    opts = opts || {};

    /*
     * A5: uppdatera befintliga anläggningar först, och bara efter ett ja.
     *
     * Ordningen är inte valfri. skapa() kopierar 28 fält FRÅN anläggningen
     * till det nya fältarbetet, så en uppdatering efteråt hade nått
     * anläggningen men inte ärendet man just skapade. Samma skäl som
     * koordinatpåfyllningen nedan har.
     *
     * Avbryter användaren händer INGENTING alls — inga fältarbeten heller.
     * Radernas status rörs inte, så en omkörning erbjuder samma sak igen.
     * Skapades fältarbetena ändå vore chansen borta: statusen hade bytts och
     * nästa körning hade hoppat över raderna.
     */
    var forslag = MV.Import.samlaUppdateringar(lib().entries());

    if (forslag.antalAndringar > 0 && !opts.godkant) {
        /*
         * KNAPPEN ANROPAR laggUpp PÅ NYTT. Den skickar inte med forslag, och
         * det är med flit — se invariant I12 i CLAUDE.md.
         *
         * Dialogen körs asynkront, och koden i en knapp kan köras som en NY
         * instans av scriptet (Jimmys erfarenhet av Mementos dialoger, 23
         * sep). En ny instans har inte den här körningens variabler: `forslag`
         * och entry-handtagen i den skulle vara borta eller döda. Callbacken
         * får därför inte bära med sig någonting alls — den gör om arbetet
         * från biblioteket i stället.
         *
         * Priset är att raderna läses två gånger. Det kostar inget: ingen
         * hinner ändra något medan dialogen står öppen, och skulle de mot
         * förmodan skilja sig är den andra läsningen den färskare.
         */
        var stalld = MV.ui.fraga(
            "Uppdatera befintliga anläggningar?",
            MV.Import.uppdateringsText(forslag),
            "Uppdatera och lägg upp",
            function () { MV.Import.laggUpp({ godkant: true }); });

        if (stalld) return { fragad: true, forslag: forslag };

        // Ingen dialog att fråga i. Att gissa ett ja åt användaren vore fel;
        // att tyst tappa uppgifterna vore det gamla felet igen. Säg det.
        MV.util.say("Importen vill uppdatera " + forslag.antalAnlaggningar +
            " befintlig(a) anläggning(ar) men kan inte fråga här. Kör Lägg upp" +
            " som en action i appen.");
        return { fragad: false, forslag: forslag };
    }

    return MV.Import._laggUpp(forslag, opts);
};

/**
 * Själva körningen, efter att frågan är ur världen.
 *
 * @return { befintliga, nya, hoppades, totalt, rader, problem, uppdaterade }
 */
MV.Import._laggUpp = function (forslag, opts) {
    var cfg = MV.config.importen;
    opts = opts || {};

    var rader = lib().entries();
    var anlLib = MV.db.lib(cfg.libAnlaggning);
    var uppdaterade = forslag ? MV.Import.skrivUppdateringar(forslag) : 0;

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
            /*
             * Ingen anläggning utan Tjänst. Den går aldrig att matcha igen, så
             * nästa orderfil för samma abonnemang lägger upp ännu en — och
             * ingen av dem kan hitta den andra.
             *
             * Hitta befintliga lämnar numera sådana rader obehandlade, så de
             * kommer aldrig hit. Spärren finns för rader som HANN bli
             * statusmärkta innan den ändringen, och de kan mycket väl ligga
             * kvar i importbiblioteket.
             */
            if (MV.Import._tjanstenr(rad) === "") {
                problem.push(rad.name + ": Tjänstenr saknas — ingen anläggning" +
                    " läggs upp, den hade blivit omöjlig att matcha");
                hoppades++;
                continue;
            }

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

                // En kolumn kan saknas i importbiblioteket — nätägarnas filer
                // ser inte likadana ut. Då hoppas den över i stället för att
                // fälla hela körningen. Värdet läses RÅTT, inte via
                // MV.fmt.value: Tjänstenr är ett heltal och ska förbli det.
                var value;
                try {
                    value = rad.field(fran);
                } catch (ex) {
                    continue;
                }

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
                   totalt: totalt, rader: rader.length, problem: problem,
                   uppdaterade: uppdaterade };

    if (!opts.tyst) MV.Import.rapportera(result);
    return result;
};

/**
 * Kvittensen efter en körning.
 *
 * Kommer vi hit ur dialogens ja-knapp står den dialogen kanske kvar. Om en
 * dialog går att visa ovanpå en annan är omätt, så kvittensen blir ett
 * message() i det läget — kort, men det kommer alltid fram. Utan föregående
 * fråga visas den fylliga rutan som förut.
 */
MV.Import.rapportera = function (result) {
    var lines = ["Totalt " + result.totalt + " hanterades av " +
                 result.rader + " objekt"];

    if (result.uppdaterade > 0) {
        lines.push("");
        lines.push(result.uppdaterade + " - befintliga anläggningar uppdaterades");
    }
    if (result.totalt > 0) {
        lines.push("");
        if (result.befintliga > 0) lines.push(result.befintliga + " - med befintlig anläggning");
        if (result.nya > 0) lines.push(result.nya + " - där ingen anläggning med samma Tjänstenr hittades");
    }
    if (result.problem.length > 0) {
        lines.push("");
        lines.push(result.hoppades + " rad(er) hoppades över:");
        for (var p = 0; p < result.problem.length && p < 10; p++) {
            lines.push("  " + result.problem[p]);
        }
        if (result.problem.length > 10) {
            lines.push("  ...och " + (result.problem.length - 10) + " fler");
        }
    }

    if (result.uppdaterade > 0) {
        MV.util.say(lines.join("\n"));
    } else {
        MV.ui.summary("Hantera kontroller", lines);
    }
};

MV.Import._forklara = function (reason) {
    if (reason === "redan-aktivt") return "anläggningen har redan ett aktivt fältarbete";
    if (reason === "ingen-anlaggning") return "ingen anläggning angiven";
    if (reason === "create-misslyckades") return "fältarbetet kunde inte skapas";
    return "okänt fel (" + reason + ")";
};

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "fa-import", byggd: "2026-11-06 15:16", hash: "cac2d68" });
