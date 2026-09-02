/**
 * tools/test.js — kör alla moduler mot Memento-simulatorn i tools/mock.js.
 *
 *   node tools/test.js
 *
 * Testerna är skrivna så att flera av dem FALLERAR om man återinför de buggar
 * som fanns i originalscripten. De är markerade REGRESSION.
 */

// Medvetet INTE "use strict": i strict mode får eval sin egen scope och
// modulernas `var MV` skulle inte bli synligt här.

var mock = require("./mock");

// Ett enda eval på toppnivå — samma gemensamma scope som Memento ger jsLibs.
//
// ORDNINGEN ÄR AVSIKTLIGT ALFABETISK. Memento laddar biblioteken alfabetiskt,
// inte i den ordning man bockar i dem, så mv-core.js kommer SIST — efter alla
// fa-moduler som bygger på den. Testerna körs därför under exakt de villkor
// appen ger. Sorterar du om listan "logiskt" försvinner den täckningen.
eval(mock.source([
    "fa-anteckning.js", "fa-faltarbete.js", "fa-firmware.js", "fa-import.js",
    "mv-core.js", "mv-db.js", "mv-format.js", "mv-logg.js"
]));

/* ---------------------------------------------------------------- */

var passed = 0, failed = 0, group = "";

function suite(name) { group = name; console.log("\n" + name); }

function ok(cond, label) {
    if (cond) { passed++; console.log("  ok    " + label); }
    else { failed++; console.log("  FEL   " + label); }
}

function eq(actual, expected, label) {
    var same = JSON.stringify(actual) === JSON.stringify(expected);
    ok(same, label + (same ? "" : "\n          fick:     " + JSON.stringify(actual) +
        "\n          väntade:  " + JSON.stringify(expected)));
}

var ANL = "Anläggningar";
var FALT = "Fältarbete";

var ANL_FIELDS = MV.Faltarbete.COPY_FROM_ANLAGGNING
    .concat(["Logg", "Kundinformation", "Bilder övrigt", "Logg Datum",
             "Anteckning", "Redigeringsläge", "Kommentar"]);

var FALT_FIELDS = ANL_FIELDS
    .concat(MV.Faltarbete.COMMENT_FIELDS)
    .concat(["Åtgärder", "Avslutad", "Läser i CM", "Åter till nätägare",
             "Låst för redigering", "Status Fältarbete", "Skapad",
             "Datum för avslut", "Nytt mätarnummer", "Nytt Star Serienummer",
             "User", "Firmware"]);

function scenario(prefix, suffix) {
    mock.reset();
    prefix = prefix || "";
    suffix = suffix || "";
    MV.db._affix = undefined;           // prefix/suffix cachas per körning
    MV.config.libPrefix = null;         // härled automatiskt
    MV.config.libSuffix = null;

    function n(base) { return prefix + base + suffix; }
    var nyckelLib = mock.defineLib(n("Nyckelregister"), {
        fields: ["Adress", "Fastighet", "Nyckelplats", "Nyckel",
                 "Anmärkning", "Anmärkning Nyckelrör"],
        nameField: "Adress"
    });
    var anlLib = mock.defineLib(n(ANL), {
        fields: ANL_FIELDS,
        linkFields: ["Aktivt Fältarbete", "Historiska Fältarbeten", "Nyckel"],
        mapFields: ["Koordinater"],
        nameField: "Anl. adress"
    });
    var faltLib = mock.defineLib(n(FALT), {
        fields: FALT_FIELDS,
        linkFields: ["Koppling till anläggning", "Historiska Fältarbeten", "Nyckel"],
        mapFields: ["Koordinater"],
        nameField: "Anl. adress"
    });
    return { nyckelLib: nyckelLib, anlLib: anlLib, faltLib: faltLib, n: n };
}


/* ================================================================ */
suite("mv-core — byggstämpel och version");

(function () {
    eq(MV.build.moduler.length, 8, "alla åtta moduler stämplade sig vid inläsning");
    ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(MV.byggd() || ""),
       "byggtiden har formatet YYYY-MM-DD HH:mm");
    eq(MV.avvikande().length, 0, "inga moduler avviker i ett rent bygge");

    // REGRESSION: stämpeln får inte anropa en funktion ur mv-core, eftersom
    // mv-core laddas sist. Att vi ens kommer hit bevisar att den inte gör det.
    eq(typeof MV.stamp, "undefined",
       "REGRESSION: ingen MV.stamp()-funktion — stämpeln skriver direkt i arrayen");

    var rapport = MV.about();
    ok(rapport.indexOf(MV.byggd()) > -1, "rapporten visar byggtiden");
    ok(rapport.indexOf("mv-core") > -1 && rapport.indexOf("fa-import") > -1,
       "rapporten listar modulerna");
    ok(rapport.indexOf("AVVIKER") === -1, "inget flaggas i ett rent bygge");

    var kort = MV.about({ kort: true });
    ok(kort.indexOf("\n") === -1, "kort form är en rad");
    ok(kort.indexOf("8 moduler") > -1, "kort form räknar modulerna");

    // Simulera att Memento cachat en gammal version av EN modul
    var sparade = MV.build.moduler.slice(0);

    MV.build.moduler.push({ namn: "fa-gammal", byggd: "2020-01-01 00:00", hash: "old1234" });
    eq(MV.avvikande().length, 1, "en cachad modul upptäcks");
    eq(MV.avvikande()[0].namn, "fa-gammal", "rätt modul flaggas");
    ok(MV.about().indexOf("AVVIKER") > -1, "rapporten flaggar den");
    ok(MV.about().indexOf("cachad") > -1, "och förklarar vad det troligen beror på");
    ok(MV.about({ kort: true }).indexOf("1 AVVIKER") > -1, "kort form varnar också");

    MV.build.moduler = sparade;
    eq(MV.avvikande().length, 0, "återställt");

    // Konfiguration från fa-modulerna får inte ha raderats av mv-core, som
    // laddades efter dem.
    ok(MV.config.faltarbete !== undefined,
       "REGRESSION: fa-faltarbetes config överlevde att mv-core laddades efter");
    ok(MV.config.importen !== undefined,
       "REGRESSION: fa-imports config överlevde likaså");
    ok(MV.config.fields !== undefined && MV.config.libBaseNames !== undefined,
       "och mv-cores egen config finns kvar");
})();


/* ================================================================ */
suite("mv-core — text och HTML");

var src = "Rad ett\nRad två\n---\nAndra blocket";
var html = MV.util.textToHtml(src);
ok(html.indexOf("Rad ett<br>Rad två") > -1, "radbrytning blir <br>");
ok(html.indexOf("<hr") > -1, "--- blir avdelare");
eq(MV.util.htmlToText(html), src, "REGRESSION: text -> HTML -> text är förlustfri");
eq(MV.util.htmlToText("<div><p>Gammalt format</p></div>"), "Gammalt format",
   "äldre <p>-baserad logg kan läsas");
ok(MV.util.isBlank("   ") && MV.util.isBlank(null) && !MV.util.isBlank("x"),
   "isBlank");


/* ================================================================ */
suite("mv-format — läsa fältvärden");

(function () {
    var s = scenario();
    var nyckel = s.nyckelLib.seed({
        Adress: "Storgatan 1", Nyckel: "4711",
        Nyckelplats: ["Skåp A", "Rör 3"], Anmärkning: "trög"
    });
    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Tjänst": "900123" });
    anl.link("Nyckel", nyckel);

    eq(MV.fmt.value(anl, "Tjänst"), "900123", "vanligt strängfält");
    eq(MV.fmt.value(anl, "Kund"), "", "tomt fält blir tom sträng");
    eq(MV.fmt.value(anl, "Nyckel"),
       "Storgatan 1 [Nr: 4711, Plats: Skåp A, Rör 3, Anm: trög]",
       "Nyckel-fält får detaljrad");

    var m = s.anlLib.seed({ "Koordinater": "56.88,14.81" });
    s.anlLib.findById(m.id);
    eq(MV.fmt.value(s.anlLib.findById(m.id), "Koordinater"), "56.88,14.81",
       "kartfält blir 'lat,lng'");

    eq(MV.fmt.toArray(null), [], "toArray(null)");
    eq(MV.fmt.toArray("a, b ,c"), ["a", "b", "c"], "toArray delar kommalista");
    eq(MV.fmt.toArray(["x"]), ["x"], "toArray av array");

    var f = s.faltLib.seed({ "Åtgärder": ["Byte", "Avläsning"] });
    eq(MV.fmt.list(f, "Åtgärder"), ["Avläsning", "Byte"],
       "list() sorterar så ordningen inte spelar roll");

    eq(MV.fmt.diffLine("Kund", "", "Nisse"),
       "• Kund ändrades från 'tomt' till 'Nisse'", "diffLine visar 'tomt'");

    var a = s.faltLib.seed({ Kund: "A", "Tfn. 1": "070" });
    var b = s.faltLib.seed({ Kund: "B", "Tfn. 1": "070" });
    eq(MV.fmt.diffFields(a, b, ["Kund", "Tfn. 1"]),
       ["• Kund ändrades från 'A' till 'B'"], "diffFields hittar bara skillnaden");
})();


/* ================================================================ */
suite("mv-db — skrivbara entries och länkar");

(function () {
    var s = scenario();
    mock.use(s.anlLib);

    var kall = s.anlLib.create({ "Anl. adress": "Testv 1" });
    eq(kall.field("Kund"), null, "simulerat: create() ger kallt entry");
    eq(kall.field("Historiska Fältarbeten"), [],
       "simulerat: länkfält är tomt på kallt entry");

    var varm = MV.db.create(s.anlLib, { "Anl. adress": "Testv 2" });
    ok(!varm.__cold, "REGRESSION: MV.db.create() ger ett varmt entry");

    var f1 = s.faltLib.seed({ "Anl. adress": "Testv 2" });
    ok(MV.db.linkOnce(varm, "Historiska Fältarbeten", f1) === true, "linkOnce länkar");
    ok(MV.db.linkOnce(varm, "Historiska Fältarbeten", f1) === false,
       "linkOnce länkar inte om samma post två gånger");
    eq(MV.fmt.toArray(varm.field("Historiska Fältarbeten")).length, 1,
       "bara en länk trots två anrop");

    ok(MV.db.unlinkFrom(varm, "Historiska Fältarbeten", f1), "unlinkFrom tar bort");
    eq(MV.fmt.toArray(varm.field("Historiska Fältarbeten")).length, 0, "länken är borta");

    var kalla = s.nyckelLib.seed({ Adress: "K1", Nyckel: "1" });
    var kalla2 = s.anlLib.seed({
        "Anl. adress": "Kopiera", "Koordinater": "56.1,14.2",
        "Firmware uppgraderades": new Date(2026, 0, 2), "Kund": ""
    });
    kalla2.link("Nyckel", kalla);
    var values = MV.db.copyFields(kalla2, ["Anl. adress", "Koordinater", "Kund",
                                           "Firmware uppgraderades", "Nyckel"]);
    eq(values["Anl. adress"], "Kopiera", "copyFields tar med strängfält");
    ok(!values.hasOwnProperty("Kund"), "copyFields hoppar över tomma fält");
    eq(typeof values["Firmware uppgraderades"], "number",
       "copyFields gör Date till millisekunder");
    ok(!values.hasOwnProperty("Nyckel"),
       "REGRESSION: copyFields hoppar över länkfält (går inte via create)");

    ok(MV.db.lib(ANL) !== null, "db.lib hittar bibliotek");
    var threw = false;
    try { MV.db.lib("Finns inte"); } catch (ex) { threw = true; }
    ok(threw, "db.lib kastar begripligt fel för okänt bibliotek");
})();


/* ================================================================ */
suite("mv-logg / fa-anteckning");

(function () {
    var s = scenario();
    mock.use(s.faltLib);

    var e = s.faltLib.seed({
        "Logg": "", "Anteckning": src,
        "Logg Datum": mock.NOW, "Redigeringsläge": false
    });
    mock.use(s.faltLib, e);

    ok(MV.Anteckning.spara(e), "spara returnerar true");
    ok(e.field("Logg").indexOf("2026-08-19") > -1, "datumrubrik skriven");
    eq(e.field("Anteckning"), "", "Anteckning tömd");

    MV.Anteckning.hamta(e);
    eq(e.field("Anteckning"), src, "hämta ger tillbaka originaltexten");
    eq(e.field("Redigeringsläge"), true, "Redigeringsläge slås på");

    e.set("Anteckning", "Ersatt");
    MV.Anteckning.spara(e);
    ok(e.field("Logg").indexOf("Rad ett") === -1 &&
       e.field("Logg").indexOf("Ersatt") > -1, "redigeringsläge skriver över");

    e.set("Anteckning", "Tillägg");
    MV.Anteckning.spara(e);
    var blocks = MV.Logg.parse(e.field("Logg"));
    eq(Object.keys(blocks).length, 1, "samma datum ger ett block");
    ok(blocks["2026-08-19"].indexOf("Ersatt") > -1 &&
       blocks["2026-08-19"].indexOf("Tillägg") > -1, "båda texterna kvar");

    // REGRESSION: valt Logg Datum, inte dagens
    var e2 = s.faltLib.seed({
        "Logg": "", "Anteckning": "Retroaktiv",
        "Logg Datum": new Date(2026, 2, 3).getTime(), "Redigeringsläge": false
    });
    MV.Anteckning.spara(e2);
    ok(e2.field("Logg").indexOf("2026-03-03") > -1 &&
       e2.field("Logg").indexOf("2026-08-19") === -1,
       "REGRESSION: posten hamnar under valt datum, inte dagens");

    MV.Logg.append(e2, "Logg", "Nyare", { date: new Date(2026, 5, 1).getTime() });
    ok(e2.field("Logg").indexOf("2026-06-01") < e2.field("Logg").indexOf("2026-03-03"),
       "nyaste datum sorteras först");

    var e3 = s.faltLib.seed({ "Logg": "" });
    appendToLog(e3, "Logg", "Via gamla API:t", true);
    ok(e3.field("Logg").indexOf("Via gamla API:t") > -1, "shim appendToLog fungerar");

    eq(MV.Logg.get(s.faltLib.seed({ "Logg": "" }), mock.NOW), null,
       "get på okänt datum ger null");

    var blank = s.faltLib.seed({ "Logg": "", "Anteckning": "  ", "Logg Datum": mock.NOW });
    eq(MV.Anteckning.spara(blank), false, "blank anteckning avvisas");
    var utanDatum = s.faltLib.seed({ "Logg": "", "Anteckning": "x", "Logg Datum": null });
    eq(MV.Anteckning.spara(utanDatum), false, "saknat datum avvisas");
})();


/* ================================================================ */
suite("fa-firmware");

(function () {
    var s = scenario();
    var e = s.faltLib.seed({ "Firmware": "Uppgraderad", "Firmware Status": "Behöver uppgradering" });
    mock.use(s.faltLib, e);

    ok(MV.Firmware.syncStatus() === true, "ändring rapporteras");
    eq(e.field("Firmware Status"), "Uppgraderad", "status speglas");
    eq(typeof e.field("Firmware uppgraderades"), "number", "uppgraderingsdatum stämplas");

    var e2 = s.faltLib.seed({ "Firmware": "Välj", "Firmware Status": "X" });
    mock.use(s.faltLib, e2);
    ok(updateFirmwareStatus() === false && e2.field("Firmware Status") === "X",
       "'Välj' ignoreras (via shim)");

    var e3 = s.faltLib.seed({ "Firmware": "1.2", "Firmware Status": "1.2" });
    mock.use(s.faltLib, e3);
    eq(MV.Firmware.syncStatus(), false, "oförändrat värde ger ingen skrivning");
})();


/* ================================================================ */
suite("fa-faltarbete — skapa");

(function () {
    var s = scenario();
    mock.use(s.anlLib);

    var nyckel = s.nyckelLib.seed({ Adress: "Storgatan 1", Nyckel: "4711" });
    var anl = s.anlLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Tjänst": "900123",
        "Koordinater": "56.88,14.81", "Mätarnummer": "M-1",
        "Firmware Status": "Uppgraderad", "Logg": ""
    });
    anl.link("Nyckel", nyckel);

    // Två avslutade fältarbeten ligger i historiken
    var gammal1 = s.faltLib.seed({ "Anl. adress": "Storgatan 1", "Skapad": 1 });
    var gammal2 = s.faltLib.seed({ "Anl. adress": "Storgatan 1", "Skapad": 2 });
    anl.link("Historiska Fältarbeten", gammal1);
    anl.link("Historiska Fältarbeten", gammal2);

    var res = MV.Faltarbete.skapa(anl);
    ok(res.ok, "skapa lyckas");

    var nytt = res.entry;
    eq(nytt.field("Kund"), "Nisse", "fält kopieras från anläggningen");
    eq(MV.fmt.value(nytt, "Koordinater"), "56.88,14.81", "kartfält kopieras");
    eq(nytt.field("Status Fältarbete"), "Historik finns",
       "status sätts efter historik");

    // AVSIKT: historiken LÄNKAS INTE in i fältarbetet. Ett Link to entry-fält
    // kan inte peka på sitt eget bibliotek, så ett fältarbete kan inte länka
    // till andra fältarbeten (uppmätt i appen 2026-08-31). Anläggningen är
    // facit; fältarbetet får en sammanfattning i text.
    eq(res.historik, 2, "antalet tidigare fältarbeten rapporteras");
    ok(res.sammanfattning.indexOf("2 tidigare fältarbeten") === 0,
       "AVSIKT: sammanfattningen inleds med antalet");
    ok(res.sammanfattning.indexOf("Hela historiken finns på anläggningen") > 0,
       "AVSIKT: sammanfattningen pekar vidare till anläggningen");
    eq(MV.fmt.toArray(nytt.field("Historiska Fältarbeten")).length, 0,
       "AVSIKT: inget historiklänkfält i fältarbetet — det går inte i Memento");

    eq(MV.fmt.toArray(nytt.field("Koppling till anläggning")).length, 1,
       "fältarbetet är kopplat till anläggningen");
    eq(MV.fmt.toArray(anl.field("Aktivt Fältarbete")).length, 1,
       "anläggningen pekar på det aktiva fältarbetet");
    eq(MV.fmt.toArray(nytt.field("Nyckel")).length, 1,
       "REGRESSION: nycklar länkas till det nya fältarbetet");

    ok(nytt.field("Logg").indexOf("Nytt fältarbete skapat") > -1, "loggpost skriven");

    var res2 = MV.Faltarbete.skapa(anl);
    eq(res2.ok, false, "andra försöket blockeras");
    eq(res2.reason, "redan-aktivt", "orsaken är att ett fältarbete redan är aktivt");

    // Anläggning utan historik
    var tom = s.anlLib.seed({ "Anl. adress": "Nyvägen 2", "Logg": "" });
    var res3 = MV.Faltarbete.skapa(tom);
    eq(res3.entry.field("Status Fältarbete"), "Ny", "utan historik blir status Ny");
    eq(res3.historik, 0, "ingen historik att koppla");
})();


/* ================================================================ */
suite("fa-faltarbete — ändringslogg vid spara");

(function () {
    var s = scenario();
    var e = s.faltLib.seed({
        "Kund": "Nisse", "Tfn. 1": "070-1", "Logg": "",
        "Åtgärder": [], "Kommentar": ""
    });
    mock.use(s.faltLib, e);

    eq(MV.Faltarbete.loggaAndringar(e), false, "inget ändrat -> ingen logg");

    // Simulerar redigering: läs sparat tillstånd, ändra, logga
    var sparad = s.faltLib.seed({ "Kund": "Nisse", "Tfn. 1": "070-1", "Åtgärder": [] });
    e.set("Kund", "Kajsa");
    e.set("Åtgärder", ["Mätarbyte", "Avläsning"]);
    e.set("Kommentar", "Bytte mätare");

    var changes = MV.fmt.diffFields(sparad, e, MV.Faltarbete.TRACK_FIELDS);
    ok(changes.length === 1 && changes[0].indexOf("Kund") > -1,
       "fältändring hittas");

    var blocks = MV.Faltarbete.byggAtgardsblock(e, sparad);
    ok(blocks.length === 2, "åtgärder och kommentar ger två block");
    ok(blocks[0].indexOf("✔ Avläsning") > -1, "åtgärder listas");
    ok(blocks[1].indexOf("Bytte mätare") > -1, "kommentaren kommer med");

    var utanAndring = MV.Faltarbete.byggAtgardsblock(sparad, sparad);
    eq(utanAndring.length, 0, "inget ändrat ger inga block");

    var alla = MV.Faltarbete.byggAtgardsblock(e, null);
    eq(alla.length, 2, "oldEntry=null tar med allt oavsett ändring");
})();


/* ================================================================ */
suite("fa-faltarbete — avsluta och arkivera");

(function () {
    var s = scenario();
    mock.use(s.faltLib);

    var anl = s.anlLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Mätarnummer": "M-1",
        "Star Serienummer": "S-1", "Tfn. 1": "070-1", "Logg": ""
    });
    var f = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Kajsa", "Tfn. 1": "070-2",
        "Nytt mätarnummer": "M-2", "Nytt Star Serienummer": "S-2",
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": "",
        "Åtgärder": ["Mätarbyte"], "Kommentar": "Allt klart"
    });
    f.link("Koppling till anläggning", anl);
    anl.link("Aktivt Fältarbete", f);

    var res = MV.Faltarbete.avsluta(f);
    ok(res.ok, "avsluta lyckas");

    eq(anl.field("Mätarnummer"), "M-2", "nytt mätarnummer skrivs till anläggningen");
    eq(anl.field("Star Serienummer"), "S-2", "nytt serienummer skrivs");
    eq(anl.field("Kund"), "Kajsa", "ändrat kundnamn synkas");
    eq(anl.field("Tfn. 1"), "070-2", "ändrat telefonnummer synkas");

    var anlLogg = anl.field("Logg");
    ok(anlLogg.indexOf("2026-08-19") > -1,
       "REGRESSION: anläggningens logg fick en post");
    ok(anlLogg.indexOf("Mätarnummer") > -1 && anlLogg.indexOf("M-2") > -1,
       "REGRESSION: ändringsraderna hamnade i anläggningens logg");
    ok(anlLogg.indexOf("Kund") > -1, "fältändringar loggas i anläggningen");
    ok(anlLogg.indexOf("✔ Mätarbyte") > -1,
       "REGRESSION: åtgärder följde med till anläggningens logg");
    ok(anlLogg.indexOf("Allt klart") > -1,
       "REGRESSION: kommentaren följde med till anläggningens logg");

    eq(MV.fmt.toArray(anl.field("Aktivt Fältarbete")).length, 0,
       "aktivt fältarbete är avlänkat");
    eq(MV.fmt.toArray(anl.field("Historiska Fältarbeten")).length, 1,
       "fältarbetet ligger i historiken");

    eq(f.field("Låst för redigering"), true, "fältarbetet är låst");
    ok(f.field("Logg").indexOf("Data överförd") > -1, "kvittens i fältarbetets logg");
    ok(typeof f.field("Datum för avslut") === "number", "avslutsdatum satt");

    // Andra körningen ska stoppas av låset
    eq(MV.Faltarbete.avsluta(f).reason, "last", "låst fältarbete kan inte avslutas igen");

    // Validering
    var ovalid = s.faltLib.seed({
        "Avslutad": false, "Läser i CM": false, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": ""
    });
    eq(MV.Faltarbete.avsluta(ovalid).reason, "validering",
       "kräver Avslutad + CM/nätägare");

    var utanKoppling = s.faltLib.seed({
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": ""
    });
    eq(MV.Faltarbete.avsluta(utanKoppling).reason, "ingen-koppling",
       "utan kopplad anläggning sparas inget");
})();


/* ================================================================ */
suite("fa-faltarbete — koordinat och tömningsskydd vid avslut");

(function () {
    var s = scenario();
    mock.use(s.faltLib);

    var anl = s.anlLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Tfn. 1": "070-1",
        "Koordinater": "56.10,14.10", "Logg": ""
    });
    var f = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Tfn. 1": "070-1",
        "Koordinater": "56.123456,14.654321",   // rättad på plats
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": ""
    });
    f.link("Koppling till anläggning", anl);
    anl.link("Aktivt Fältarbete", f);

    ok(MV.Faltarbete.avsluta(f).ok, "avsluta lyckas");
    eq(MV.fmt.value(s.anlLib.findById(anl.id), "Koordinater"), "56.123456,14.654321",
       "koordinaten rättad på plats skrivs till anläggningen");
    ok(anl.field("Logg").indexOf("Koordinater") > -1,
       "koordinatändringen loggas i anläggningen");

    // Nästa ärende ska starta från den rättade koordinaten
    mock.use(s.anlLib);
    MV.db._affix = undefined;
    var nytt = MV.Faltarbete.skapa(s.anlLib.findById(anl.id));
    ok(nytt.ok, "nytt fältarbete kan skapas");
    eq(MV.fmt.value(s.faltLib.findById(nytt.entry.id), "Koordinater"),
       "56.123456,14.654321",
       "nästa ärende startar från den rättade koordinaten");

    // --- tömningsskydd ---
    var s2 = scenario();
    mock.use(s2.faltLib);

    var anl2 = s2.anlLib.seed({
        "Anl. adress": "Nyvägen 2", "Kund": "Kajsa", "Tfn. 1": "070-9",
        "Koordinater": "57.00,15.00", "Logg": ""
    });
    var f2 = s2.faltLib.seed({
        "Anl. adress": "Nyvägen 2", "Kund": "", "Tfn. 1": "070-9",
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": ""
    });
    f2.link("Koppling till anläggning", anl2);
    anl2.link("Aktivt Fältarbete", f2);

    ok(MV.Faltarbete.avsluta(f2).ok, "avsluta lyckas");
    eq(anl2.field("Kund"), "Kajsa",
       "tomt fält i fältarbetet raderar INTE anläggningens värde");
    // "57.00" -> 57 är simulatorns parseFloat, inte en ändring av värdet
    eq(MV.fmt.value(s2.anlLib.findById(anl2.id), "Koordinater"), "57,15",
       "tom koordinat i fältarbetet raderar inte anläggningens");
    ok(anl2.field("Logg").indexOf("Kund") === -1,
       "och inget vilseledande loggas om att fältet ändrats");

    // Med skyddet avstängt återgår beteendet
    var s3 = scenario();
    mock.use(s3.faltLib);
    MV.config.faltarbete.tillatTomningVidAvslut = true;

    var anl3 = s3.anlLib.seed({ "Anl. adress": "Gamla vägen 5", "Kund": "Olle", "Logg": "" });
    var f3 = s3.faltLib.seed({
        "Anl. adress": "Gamla vägen 5", "Kund": "",
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false, "Logg": ""
    });
    f3.link("Koppling till anläggning", anl3);
    anl3.link("Aktivt Fältarbete", f3);

    MV.Faltarbete.avsluta(f3);
    eq(anl3.field("Kund"), "",
       "tillatTomningVidAvslut = true ger det ursprungliga beteendet");
    MV.config.faltarbete.tillatTomningVidAvslut = false;
})();


/* ================================================================ */
suite("fa-faltarbete — knappversionerna med dialog");

(function () {
    var s = scenario();
    mock.use(s.faltLib);

    function senasteDialog() {
        return mock.dialogs.length ? mock.dialogs[mock.dialogs.length - 1] : null;
    }
    function senasteMeddelande() {
        return mock.messages.length ? mock.messages[mock.messages.length - 1] : null;
    }

    // --- lyckat avslut -> meddelande, ingen dialog ---
    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Logg": "" });
    var f = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Kajsa", "Logg": "",
        "Avslutad": true, "Läser i CM": true, "Åter till nätägare": false,
        "Låst för redigering": false
    });
    f.link("Koppling till anläggning", anl);
    anl.link("Aktivt Fältarbete", f);

    var res = MV.Faltarbete.avslutaMedDialog(f);
    ok(res.ok, "avslutaMedDialog returnerar resultatet vidare");
    ok((senasteMeddelande() || "").indexOf("låsts") > -1, "kvittens visas");
    eq(mock.dialogs.length, 0, "inget dialogfönster vid lyckat avslut");

    // --- låst -> dialog ---
    MV.Faltarbete.avslutaMedDialog(f);
    ok(senasteDialog() !== null, "låst fältarbete ger en dialog");
    eq(senasteDialog().title, MV.Faltarbete.TEXTER.last.titel, "rätt rubrik");
    ok(senasteDialog().text.indexOf("Låst för redigering") > -1,
       "dialogen förklarar hur man låser upp");

    // --- validering -> dialog ---
    var ovalid = s.faltLib.seed({
        "Logg": "", "Avslutad": false, "Läser i CM": false,
        "Åter till nätägare": false, "Låst för redigering": false
    });
    MV.Faltarbete.avslutaMedDialog(ovalid);
    eq(senasteDialog().title, MV.Faltarbete.TEXTER.validering.titel,
       "valideringsfel ger valideringsdialogen");

    // --- ingen koppling -> dialog ---
    var utan = s.faltLib.seed({
        "Logg": "", "Avslutad": true, "Läser i CM": true,
        "Åter till nätägare": false, "Låst för redigering": false
    });
    MV.Faltarbete.avslutaMedDialog(utan);
    eq(senasteDialog().title, MV.Faltarbete.TEXTER.ingenKoppling.titel,
       "saknad koppling ger kopplingsdialogen");

    // --- skapaMedDialog ---
    var s2 = scenario();
    mock.use(s2.anlLib);
    MV.db._affix = undefined;
    var anl2 = s2.anlLib.seed({ "Anl. adress": "Nyvägen 2", "Kund": "Olle", "Logg": "" });

    var r1 = MV.Faltarbete.skapaMedDialog(anl2);
    ok(r1.ok, "skapaMedDialog lyckas");
    ok((senasteMeddelande() || "").indexOf("skapat") > -1, "kvittens visas");

    var innan = mock.dialogs.length;
    var r2 = MV.Faltarbete.skapaMedDialog(anl2);
    eq(r2.reason, "redan-aktivt", "andra försöket blockeras");
    ok(mock.dialogs.length === innan + 1, "och ger en dialog");
    eq(senasteDialog().title, MV.Faltarbete.TEXTER.redanAktivt.titel, "rätt rubrik");

    // --- texterna ska gå att skriva över per bibliotek ---
    var original = MV.Faltarbete.TEXTER.redanAktivt.titel;
    MV.Faltarbete.TEXTER.redanAktivt.titel = "Egen rubrik";
    MV.Faltarbete.skapaMedDialog(anl2);
    eq(senasteDialog().title, "Egen rubrik",
       "TEXTER kan skrivas över i bibliotekets Config-script");
    MV.Faltarbete.TEXTER.redanAktivt.titel = original;

    // --- de rena funktionerna visar fortfarande ingenting ---
    var s3 = scenario();
    mock.use(s3.anlLib);
    MV.db._affix = undefined;
    var anl3 = s3.anlLib.seed({ "Anl. adress": "Gamla vägen 5", "Logg": "" });
    MV.Faltarbete.skapa(anl3);
    MV.Faltarbete.skapa(anl3);
    eq(mock.dialogs.length, 0,
       "AVSIKT: skapa() och avsluta() gör ingen UI — de går att köra i batch");
})();


/* ================================================================ */
suite("fa-faltarbete — historik efter ett helt varv");

(function () {
    var s = scenario();
    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Logg": "" });

    // Varv 1
    mock.use(s.anlLib);
    var r1 = MV.Faltarbete.skapa(anl);
    eq(r1.historik, 0, "första fältarbetet har ingen historik");

    var f1 = r1.entry;
    f1.set("Avslutad", true);
    f1.set("Läser i CM", true);
    mock.use(s.faltLib, f1);
    ok(MV.Faltarbete.avsluta(f1).ok, "första fältarbetet avslutas");

    // Varv 2 — ska nu se varv 1 i sin historik
    mock.use(s.anlLib);
    var r2 = MV.Faltarbete.skapa(anl);
    ok(r2.ok, "andra fältarbetet kan skapas efter avslut");
    eq(r2.historik, 1,
       "REGRESSION: det andra fältarbetet ser det första i sin historik");
    eq(r2.entry.field("Status Fältarbete"), "Historik finns",
       "status speglar att historik finns");

    ok(r2.sammanfattning.indexOf("1 tidigare fältarbete") === 0,
       "sammanfattningen räknar i singular när det bara finns ett");

    // Historiken ligger kvar där den KAN ligga: i anläggningen.
    var historikIds = MV.fmt.toArray(anl.field("Historiska Fältarbeten"))
        .map(function (x) { return x.id; });
    eq(historikIds, [f1.id], "anläggningens historik pekar på rätt fältarbete");
})();


/* ================================================================ */
suite("fa-import — hitta befintliga");

(function () {
    var s = scenario();
    var impLib = mock.defineLib(s.n("Import Fältarbete"), {
        fields: ["Namn", "Tjänstest. adr", "Koordinater", "Tjänstenr",
                 "Mobilnummer 1", "Mobilnummer 2", "App.placering",
                 "Lev.punkt(1)", "Lev.punkt(2)", "Befintlig apparat",
                 "Status", "Status Koordinater"],
        linkFields: ["Befintlig"],
        mapFields: ["Koordinater"],
        nameField: "Namn"
    });

    s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Tjänst": "900123",
                    "Koordinater": "56.88,14.81", "Logg": "" });
    s.anlLib.seed({ "Anl. adress": "Dubblett A", "Tjänst": "900999", "Logg": "" });
    s.anlLib.seed({ "Anl. adress": "Dubblett B", "Tjänst": "900999", "Logg": "" });
    s.anlLib.seed({ "Anl. adress": "Rättad koord", "Tjänst": "900777",
                    "Koordinater": "56.123456,14.654321", "Logg": "" });
    s.anlLib.seed({ "Anl. adress": "Utan koord", "Tjänst": "900888", "Logg": "" });

    var rad1 = impLib.seed({ Namn: "Nisse", "Tjänstenr": "900123", Status: "-" });
    var rad2 = impLib.seed({ Namn: "Kajsa", "Tjänstenr": "900999", Status: "-" });
    var rad3 = impLib.seed({ Namn: "Olle", "Tjänstenr": "900000", Status: "-" });
    var rad4 = impLib.seed({ Namn: "Klar", "Tjänstenr": "900123",
                             Status: "Befintlig återstartad" });

    // Importfilens grova koordinat ska vika för anläggningens rättade
    var rad5 = impLib.seed({ Namn: "Grov", "Tjänstenr": "900777", Status: "-",
                             "Koordinater": "56.1,14.6" });
    // ...men finns ingen på anläggningen behålls importens
    var rad6 = impLib.seed({ Namn: "Behåll", "Tjänstenr": "900888", Status: "-",
                             "Koordinater": "56.5,14.5" });

    mock.use(impLib);
    var res = MV.Import.hittaBefintliga({ tyst: true });

    eq(res.hittade, 3, "tre rader med exakt en träff");
    eq(res.flera, 1, "en rad med flera träffar");
    eq(res.inga, 1, "en rad utan träff");
    eq(rad1.field("Status"), "Hittat befintlig", "rad1 fick rätt status");
    eq(rad2.field("Status"), "Hittade flera befintliga", "rad2 fick rätt status");
    eq(rad3.field("Status"), "Ingen befintlig hittades", "rad3 fick rätt status");
    eq(rad4.field("Status"), "Befintlig återstartad",
       "redan behandlad rad rörs inte");

    eq(MV.fmt.toArray(rad1.field("Befintlig")).length, 1, "rad1 länkad till anläggning");
    eq(MV.fmt.toArray(rad2.field("Befintlig")).length, 2, "rad2 länkad till båda");

    eq(rad1.field("Status Koordinater"), "Koordinater inmatade",
       "REGRESSION: koordinatstatus sätts trots att kartfältet just skrivits");
    // Kartfält måste läsas via ett omhämtat entry — ett fält som just skrivits
    // kommer tillbaka som null i samma körning.
    function koord(rad) { return MV.fmt.value(impLib.findById(rad.id), "Koordinater"); }

    eq(koord(rad1), "56.88,14.81", "tom importrad får anläggningens koordinat");
    eq(koord(rad5), "56.123456,14.654321",
       "AVSIKT: anläggningens rättade koordinat skriver över importens grova");
    eq(koord(rad6), "56.5,14.5",
       "AVSIKT: saknar anläggningen koordinat behålls importens");
    eq(rad6.field("Status Koordinater"), "Koordinater inmatade",
       "raden räknas som klar på importens egen koordinat");
})();


/* ================================================================ */
suite("fa-import — lägg upp");

(function () {
    var s = scenario();
    var impLib = mock.defineLib(s.n("Import Fältarbete"), {
        fields: ["Namn", "Tjänstest. adr", "Koordinater", "Tjänstenr",
                 "Mobilnummer 1", "Mobilnummer 2", "App.placering",
                 "Lev.punkt(1)", "Lev.punkt(2)", "Befintlig apparat",
                 "Status", "Status Koordinater"],
        linkFields: ["Befintlig"],
        mapFields: ["Koordinater"],
        nameField: "Namn"
    });

    var befintlig = s.anlLib.seed({
        "Anl. adress": "Storgatan 1", "Tjänst": "900123", "Kund": "Nisse",
        "Mätarnummer": "M-1", "Koordinater": "56.88,14.81", "Logg": ""
    });

    // Scenario 1 — anläggningen finns
    var rad1 = impLib.seed({
        Namn: "Nisse", "Tjänstenr": "900123", Status: "Hittat befintlig",
        "Status Koordinater": "Koordinater inmatade", "Koordinater": "56.88,14.81"
    });
    rad1.link("Befintlig", befintlig);

    // Scenario 2 — ingen anläggning finns
    var rad2 = impLib.seed({
        Namn: "Kajsa Karlsson", "Tjänstest. adr": "Nyvägen 7",
        "Tjänstenr": "900500", "Mobilnummer 1": "070-111",
        "Mobilnummer 2": "070-222", "Befintlig apparat": "M-9",
        "App.placering": "Källare",
        "Lev.punkt(1)": "NS-14", "Lev.punkt(2)": "KS-3", Status: "Ingen befintlig hittades",
        "Status Koordinater": "Koordinater inmatade", "Koordinater": "57.1,15.2"
    });

    // Anläggning utan koordinat — ska få importradens
    var utanKoord = s.anlLib.seed({
        "Anl. adress": "Skogsvägen 3", "Tjänst": "900700", "Kund": "Olle", "Logg": ""
    });
    var rad4 = impLib.seed({
        Namn: "Olle", "Tjänstenr": "900700", Status: "Hittat befintlig",
        "Status Koordinater": "Koordinater inmatade", "Koordinater": "58.2,15.9"
    });
    rad4.link("Befintlig", utanKoord);

    // Rad som ska hoppas över
    var rad3 = impLib.seed({
        Namn: "Utan koord", "Tjänstenr": "900600",
        Status: "Ingen befintlig hittades", "Status Koordinater": "-"
    });

    mock.use(impLib);
    var res = MV.Import.laggUpp({ tyst: true });

    eq(res.befintliga, 2, "två fältarbeten på befintliga anläggningar");
    eq(res.nya, 1, "en ny anläggning upplagd");
    eq(rad1.field("Status"), "Befintlig återstartad", "rad1 markerad");
    eq(rad2.field("Status"), "Ny upplagd och startad", "rad2 markerad");
    eq(rad3.field("Status"), "Ingen befintlig hittades", "rad3 orörd");

    // Fältarbetet på den befintliga anläggningen
    eq(MV.fmt.toArray(befintlig.field("Aktivt Fältarbete")).length, 1,
       "befintlig anläggning har nu ett aktivt fältarbete");

    // Anläggningen som saknade koordinat
    var uk = s.anlLib.findById(utanKoord.id);
    eq(MV.fmt.value(uk, "Koordinater"), "58.2,15.9",
       "anläggning utan koordinat får importradens");
    var ukFalt = MV.fmt.toArray(uk.field("Aktivt Fältarbete"));
    eq(ukFalt.length, 1, "och ett fältarbete");
    eq(MV.fmt.value(s.faltLib.findById(ukFalt[0].id), "Koordinater"), "58.2,15.9",
       "koordinaten når hela vägen till fältarbetet");

    // Anläggning som redan hade koordinat ska inte skrivas över
    eq(MV.fmt.value(s.anlLib.findById(befintlig.id), "Koordinater"), "56.88,14.81",
       "befintlig koordinat på anläggningen rörs inte");

    // Den nya anläggningen
    var nyaLankar = MV.fmt.toArray(rad2.field("Befintlig"));
    eq(nyaLankar.length, 1, "importraden är länkad till den nya anläggningen");

    var nyAnl = s.anlLib.findById(nyaLankar[0].id);
    eq(nyAnl.field("Anl. adress"), "Nyvägen 7", "adress mappad");
    eq(nyAnl.field("Kund"), "Kajsa Karlsson", "kund mappad");
    eq(nyAnl.field("Tfn. 1"), "070-111", "mobilnummer 1 mappat");
    eq(nyAnl.field("Tfn. 2"), "070-222",
       "REGRESSION: mobilnummer 2 mappas (tappades tidigare)");
    eq(nyAnl.field("Mätarnummer"), "M-9", "befintlig apparat mappad");
    eq(nyAnl.field("Mätarplacering"), "Källare", "placering mappad");
    eq(nyAnl.field("Nätstation"), "NS-14", "Lev.punkt(1) mappas till Nätstation");
    eq(nyAnl.field("Leveranspunkt"), "KS-3", "Lev.punkt(2) mappas till Leveranspunkt");
    eq(MV.fmt.value(nyAnl, "Koordinater"), "57.1,15.2", "koordinater mappade");

    // Fältarbetet på den nya anläggningen ska inte vara halvtomt
    var nyttFalt = MV.fmt.toArray(nyAnl.field("Aktivt Fältarbete"));
    eq(nyttFalt.length, 1, "den nya anläggningen fick ett fältarbete");
    var fb = s.faltLib.findById(nyttFalt[0].id);
    eq(fb.field("Kund"), "Kajsa Karlsson",
       "REGRESSION: fältarbetet fick data från den nyskapade anläggningen");
    eq(fb.field("Mätarnummer"), "M-9",
       "REGRESSION: mätarnummer följde med till fältarbetet");
    eq(MV.fmt.value(fb, "Koordinater"), "57.1,15.2",
       "REGRESSION: koordinater följde med till fältarbetet");

    // Dubbelkörning ska inte skapa fler fältarbeten
    mock.use(impLib);
    var res2 = MV.Import.laggUpp({ tyst: true });
    eq(res2.totalt, 0, "andra körningen skapar inget nytt");
})();


/* ================================================================ */
suite("fa-import — koordinatstatus");

(function () {
    var s = scenario();
    var impLib = mock.defineLib(s.n("Import Fältarbete"), {
        fields: ["Koordinater", "Status", "Status Koordinater", "Tjänstenr", "Namn"],
        linkFields: ["Befintlig"], mapFields: ["Koordinater"], nameField: "Namn"
    });

    var rad = impLib.seed({ "Koordinater": "56.1,14.2", "Status Koordinater": "-" });
    mock.use(impLib, rad);
    ok(MV.Import.satKoordinatStatus(), "status sätts när koordinater finns");
    eq(rad.field("Status Koordinater"), "Koordinater inmatade", "rätt värde");

    var utan = impLib.seed({ "Status Koordinater": "-" });
    mock.use(impLib, utan);
    eq(MV.Import.satKoordinatStatus(), false, "utan koordinater görs inget");
    eq(utan.field("Status Koordinater"), "-", "statusen är orörd");
})();


/* ================================================================ */
suite("biblioteksnamn — test/drift och kund");

(function () {
    var s = scenario("Test ", " Kraft AB");
    mock.use(s.faltLib);
    MV.db._affix = undefined;

    eq(MV.db.prefix(), "Test ", "prefixet härleds ur körande bibliotekets namn");
    eq(MV.db.suffix(), " Kraft AB", "suffixet (kundnamnet) härleds likaså");
    eq(MV.db.libName("Anläggningar"), "Test Anläggningar Kraft AB",
       "uppslag sätts ihop av prefix + basnamn + suffix");
    eq(MV.db.lib("Anläggningar").name, "Test Anläggningar Kraft AB",
       "rätt bibliotek hämtas");

    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Logg": "" });
    mock.use(s.anlLib);
    MV.db._affix = undefined;
    var res = MV.Faltarbete.skapa(anl);
    ok(res.ok, "fältarbete kan skapas");
    eq(res.entry.field("Kund"), "Nisse", "fälten kopierades");

    // "Import Fältarbete" får inte tolkas som prefix + "Fältarbete"
    scenario("Test ", " Kraft AB");
    var imp = mock.defineLib("Test Import Fältarbete Kraft AB", { fields: ["Namn"] });
    mock.use(imp);
    MV.db._affix = undefined;
    eq(MV.db.prefix(), "Test ", "längsta matchande basnamn vinner — prefix");
    eq(MV.db.suffix(), " Kraft AB", "längsta matchande basnamn vinner — suffix");

    // Drift utan kundnamn
    var s3 = scenario();
    mock.use(s3.faltLib);
    MV.db._affix = undefined;
    eq(MV.db.prefix(), "", "utan prefix blir prefixet tomt");
    eq(MV.db.suffix(), "", "utan kundnamn blir suffixet tomt");
    eq(MV.db.lib("Anläggningar").name, "Anläggningar", "biblioteket hämtas ändå");

    // Kund utan testprefix
    var s4 = scenario("", " Kraft AB");
    mock.use(s4.faltLib);
    MV.db._affix = undefined;
    eq(MV.db.suffix(), " Kraft AB", "kundnamnet härleds utan prefix");
    eq(MV.db.lib("Anläggningar").name, "Anläggningar Kraft AB", "kundens bibliotek hämtas");

    // Två kunder samtidigt — de får inte nå varandra
    var s5 = scenario("", " Kraft AB");
    mock.defineLib("Anläggningar Elnät Syd", {
        fields: ANL_FIELDS,
        linkFields: ["Aktivt Fältarbete", "Historiska Fältarbeten", "Nyckel"],
        mapFields: ["Koordinater"], nameField: "Anl. adress"
    });
    mock.use(s5.faltLib);
    MV.db._affix = undefined;
    eq(MV.db.lib("Anläggningar").name, "Anläggningar Kraft AB",
       "AVSIKT: en kunds bibliotek når bara sin egen uppsättning");

    // Test når aldrig drift, ens när testbiblioteket saknas
    scenario("", " Kraft AB");
    var testFalt = mock.defineLib("Test Fältarbete Kraft AB", { fields: ["Namn"] });
    mock.use(testFalt);
    MV.db._affix = undefined;
    var lackte = false;
    try { MV.db.lib("Anläggningar"); lackte = true; } catch (ex) { lackte = false; }
    ok(!lackte, "AVSIKT: en testkörning når aldrig driften, den failar hellre");

    // Fallback: suffixet får släppas när ett bibliotek inte döpts om än
    mock.reset();
    MV.db._affix = undefined;
    var omdopt = mock.defineLib("Fältarbete Kraft AB", { fields: ["Namn"] });
    mock.defineLib("Nyckelregister", { fields: ["Adress"] });   // ej omdöpt än
    mock.use(omdopt);
    MV.db._affix = undefined;
    eq(MV.db.suffix(), " Kraft AB", "kundnamnet härleds ur det omdöpta biblioteket");
    eq(MV.db.lib("Nyckelregister").name, "Nyckelregister",
       "bibliotek som inte döpts om hittas ändå under övergången");

    // Manuell override
    var s8 = scenario("Test ", " Kraft AB");
    mock.use(s8.faltLib);
    MV.db._affix = undefined;
    MV.config.libPrefix = "";
    MV.config.libSuffix = "";
    eq(MV.db.prefix() + "|" + MV.db.suffix(), "|", "override nollar båda");
    var overrideThrew = false;
    try { MV.db.lib("Anläggningar"); } catch (ex) { overrideThrew = true; }
    ok(overrideThrew, "en framtvingad override är exakt");
    MV.config.libPrefix = null;
    MV.config.libSuffix = null;

    var s9 = scenario();
    mock.use(s9.faltLib);
    MV.db._affix = undefined;
    var threw = false;
    try { MV.db.lib("Finns inte"); } catch (ex) { threw = true; }
    ok(threw, "okänt bibliotek ger fel");
})();


/* ================================================================ */
suite("Åter till nätägare — alias under namnbytet");

(function () {
    // Bibliotek med det nya fältnamnet
    var s = scenario();
    var nyLib = mock.defineLib("Fältarbete", {
        fields: FALT_FIELDS.concat(["Åter till nätägare"]),
        linkFields: ["Koppling till anläggning", "Historiska Fältarbeten", "Nyckel"],
        mapFields: ["Koordinater"], nameField: "Anl. adress"
    });
    mock.use(nyLib);
    MV.db._affix = undefined;

    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Logg": "" });
    var f = nyLib.seed({
        "Anl. adress": "Storgatan 1", "Kund": "Nisse", "Logg": "",
        "Avslutad": true, "Läser i CM": false, "Åter till nätägare": true,
        "Låst för redigering": false
    });
    f.link("Koppling till anläggning", anl);
    anl.link("Aktivt Fältarbete", f);
    ok(MV.Faltarbete.avsluta(f).ok, "nya fältnamnet godtas");

    // Bibliotek som inte döpt om fältet än
    var s2 = scenario();
    var gammalLib = mock.defineLib("Fältarbete", {
        fields: FALT_FIELDS.concat(["Åter till gamla namnet"]),
        linkFields: ["Koppling till anläggning", "Historiska Fältarbeten", "Nyckel"],
        mapFields: ["Koordinater"], nameField: "Anl. adress"
    });
    mock.use(gammalLib);
    MV.db._affix = undefined;
    MV.config.faltarbete.faltAterTillNatagareAlias = "Åter till gamla namnet";

    var anl2 = s2.anlLib.seed({ "Anl. adress": "Nyvägen 2", "Logg": "" });
    var f2 = gammalLib.seed({
        "Anl. adress": "Nyvägen 2", "Logg": "",
        "Avslutad": true, "Läser i CM": false, "Åter till gamla namnet": true,
        "Låst för redigering": false
    });
    f2.link("Koppling till anläggning", anl2);
    anl2.link("Aktivt Fältarbete", f2);
    ok(MV.Faltarbete.avsluta(f2).ok,
       "aliaset gör att avslut fungerar innan fältet döpts om");

    // Varken nytt namn eller alias: stoppa snyggt, inte krascha
    MV.config.faltarbete.faltAterTillNatagareAlias = "";
    var f3 = gammalLib.seed({
        "Anl. adress": "Nyvägen 2", "Logg": "",
        "Avslutad": true, "Läser i CM": false, "Åter till gamla namnet": true,
        "Låst för redigering": false
    });
    f3.link("Koppling till anläggning", anl2);
    eq(MV.Faltarbete.avsluta(f3).reason, "validering",
       "saknas fältet helt stoppas avslutet snyggt i stället för att krascha");
})();


/* ================================================================ */
suite("fa-faltarbete — historik som text");

/*
 * Ett Link to entry-fält kan inte peka på sitt eget bibliotek. Ett fältarbete
 * kan alltså inte länka till andra fältarbeten — uppmätt i appen 2026-08-31.
 * Historiken bor i anläggningen, och fältarbetet får en sammanfattning.
 */
(function () {
    var s = scenario();
    mock.use(s.anlLib);

    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Logg": "" });

    var g1 = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-04-12"),
        "Status Fältarbete": "Avslutad", "Åtgärder": ["Mätare bytt"]
    });
    var g2 = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-06-01"),
        "Status Fältarbete": "Avslutad", "Åtgärder": ["Terminal omstartad", "Antenn bytt"]
    });
    anl.link("Historiska Fältarbeten", g1);
    anl.link("Historiska Fältarbeten", g2);

    var text = MV.Faltarbete.historikText(anl);

    ok(text.indexOf("2 tidigare fältarbeten") === 0, "antalet står först");
    ok(text.indexOf("2026-06-01") < text.indexOf("2026-04-12"),
       "AVSIKT: nyaste ärendet först");
    ok(text.indexOf("Mätare bytt") > 0, "åtgärderna kommer med");
    ok(text.indexOf("Antenn bytt") > 0, "flera åtgärder slås ihop på raden");

    // Avslutssätt och anledning — det man vill veta om ett tidigare besök
    var g4 = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-06-15"),
        "Status Fältarbete": "Mätaren läser utan åtgärd",
        "Åtgärder": ["Avläsning"], "Kommentar": "Kunden ej hemma\nförsta gången."
    });
    anl.link("Historiska Fältarbeten", g4);
    var medOrsak = MV.Faltarbete.historikText(anl);

    ok(medOrsak.indexOf("2026-06-15 · Mätaren läser utan åtgärd · Avläsning") > 0,
       "AVSIKT: datum, anledning och åtgärder på EN rad — inga etiketter");
    ok(medOrsak.indexOf("\u201dKunden ej hemma första gången.\u201d") > 0,
       "AVSIKT: kommentaren får egen rad inom citattecken, utan etikett");
    ok(medOrsak.indexOf("Läser i CM") === -1,
       "AVSIKT: avslutssättet visas inte — statusvärdet räcker som anledning");

    var g5 = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-06-16"),
        "Status Fältarbete": "Klar"
    });
    anl.link("Historiska Fältarbeten", g5);
    var utanBrus = MV.Faltarbete.historikText(anl);

    ok(utanBrus.indexOf("Klar") === -1,
       "AVSIKT: intetsägande status utelämnas — 'Klar' är brus i en historikrad");
    ok(utanBrus.indexOf("• 2026-06-16\n") > 0,
       "utan anledning, åtgärder och kommentar blir det bara datumet");

    // Långa kommentarer klipps
    MV.config.faltarbete.historikKommentarLangd = 20;
    var langt = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-06-17"),
        "Kommentar": "En mycket lång utläggning som inte får äta hela rutan"
    });
    anl.link("Historiska Fältarbeten", langt);
    ok(MV.Faltarbete.historikText(anl).indexOf("…") > 0, "lång kommentar klipps");
    MV.config.faltarbete.historikKommentarLangd = 200;

    // Ett ärende utan avslutsdatum ska falla tillbaka på Skapad, inte försvinna
    var g3 = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Skapad": Date.parse("2026-07-20"),
        "Status Fältarbete": "Pågående"
    });
    anl.link("Historiska Fältarbeten", g3);
    ok(MV.Faltarbete.historikText(anl).indexOf("2026-07-20") > 0,
       "utan avslutsdatum används Skapad");

    // Taket: bara de senaste sammanfattas, resten räknas
    MV.config.faltarbete.historikAntal = 2;
    var kort = MV.Faltarbete.historikText(anl);
    eq(kort.split("•").length - 1, 2, "bara historikAntal besök visas");
    var totalt = MV.fmt.toArray(anl.field("Historiska Fältarbeten")).length;
    ok(kort.indexOf("…och " + (totalt - 2) + " till") > 0,
       "resten räknas i stället för att döljas");
    MV.config.faltarbete.historikAntal = 5;

    eq(MV.Faltarbete.historikText(s.anlLib.seed({ "Anl. adress": "Tom" })), "",
       "ingen historik ger tom sträng, inte en rubrik utan innehåll");
})();

(function () {
    var s = scenario();
    mock.use(s.anlLib);

    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Logg": "" });
    var gammal = s.faltLib.seed({
        "Anl. adress": "Storgatan 1", "Datum för avslut": Date.parse("2026-04-12"),
        "Status Fältarbete": "Avslutad"
    });
    anl.link("Historiska Fältarbeten", gammal);

    var res = MV.Faltarbete.skapa(anl);
    ok(res.ok, "skapa lyckas");

    // Finns inte fältet i biblioteket ska texten hamna i loggen i stället,
    // så att den aldrig tappas tyst.
    var logg = MV.util.htmlToText(res.entry.field("Logg"));
    ok(logg.indexOf("1 tidigare fältarbete") > 0,
       "AVSIKT: saknas historikfältet hamnar sammanfattningen i loggen");
})();


/* ================================================================ */
suite("fa-faltarbete — misslyckad länkning ska synas");

/*
 * A2 i ARBETSLAGE.md: "Nytt Fältarbete" från Anläggningar skapade fältarbetet
 * men länkade inte "Aktivt Fältarbete", helt tyst, eftersom returvärdet från
 * linkOnce() ignorerades. Orsaken är inte fastställd — men tystnaden är
 * åtgärdad, och det är den som gör felet farligt.
 */
(function () {
    var s = scenario();
    mock.use(s.anlLib);

    var anl = s.anlLib.seed({ "Anl. adress": "Storgatan 1", "Logg": "" });

    // Simulera exakt det appen gjorde: linkOnce anropas, rapporterar framgång,
    // men länken finns inte efteråt. Patchen sitter på MV.db.linkOnce och inte
    // på entryt, eftersom skapa() arbetar på en omhämtad kopia — vilket är
    // just varför en patch på entryt inte skulle märkas.
    var origLinkOnce = MV.db.linkOnce;
    MV.db.linkOnce = function (fromEntry, fieldName, toEntry) {
        if (fieldName === "Aktivt Fältarbete") return true;   // ljuger, som förr
        return origLinkOnce(fromEntry, fieldName, toEntry);
    };

    var res = MV.Faltarbete.skapa(anl);
    MV.db.linkOnce = origLinkOnce;

    ok(res.ok, "fältarbetet skapas ändå — det är inte förlorat");
    eq(res.varningar, ["Aktivt Fältarbete"],
       "REGRESSION: den uteblivna länken rapporteras i stället för att tigas ihjäl");
    ok(res.entry && res.entry.id !== undefined,
       "det skapade fältarbetet returneras, så det går att laga för hand");
})();

(function () {
    var s = scenario();
    mock.use(s.anlLib);
    var anl = s.anlLib.seed({ "Anl. adress": "Nyvägen 2", "Logg": "" });

    var res = MV.Faltarbete.skapa(anl);
    eq(res.varningar, [], "går allt rätt är varningslistan tom");
})();


/* ================================================================ */

console.log("\n" + passed + " ok, " + failed + " fel");
process.exitCode = failed ? 1 : 0;
