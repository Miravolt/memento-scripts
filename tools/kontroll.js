/**
 * tools/kontroll.js — kontrollerar invarianterna i CLAUDE.md.
 *
 *   node tools/kontroll.js
 *
 * Testerna i tools/test.js kontrollerar att koden GÖR rätt. Den här filen
 * kontrollerar sådant som testerna inte kan se: att modulerna tål Mementos
 * alfabetiska laddningsordning, att ingen ES6-syntax smugit in (Rhino är ES5),
 * och att dokumentationen inte pekar på filer som bytt namn eller försvunnit.
 *
 * Varje kontroll motsvarar en invariant i CLAUDE.md, och varje invariant kom
 * till efter ett faktiskt fel. En regel i en textfil kan glömmas; det här kan
 * den inte.
 *
 * Avslutar med kod 1 vid FEL, 0 vid bara VARNING.
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var fel = [];
var varningar = [];

function fail(kontroll, text) { fel.push(kontroll + ": " + text); }
function warn(kontroll, text) { varningar.push(kontroll + ": " + text); }

/** Alla filer under ROOT, utom det som inte är källkod. */
function allaFiler(dir, ut) {
    ut = ut || [];
    var poster = fs.readdirSync(dir);
    for (var i = 0; i < poster.length; i++) {
        var namn = poster[i];
        if (namn === ".git" || namn === "node_modules" || namn === "Raw" ||
            namn === "Build" || namn === "__pycache__") continue;

        var full = path.join(dir, namn);
        if (fs.statSync(full).isDirectory()) allaFiler(full, ut);
        else ut.push(full);
    }
    return ut;
}

function las(fil) { return fs.readFileSync(fil, "utf8"); }
function rel(fil) { return path.relative(ROOT, fil).replace(/\\/g, "/"); }

/**
 * Tar bort kommentarer och stränginnehåll, så att en syntaxkontroll inte
 * larmar för ordet "const" i en kommentar eller i en loggtext.
 */
function skalaAv(kod) {
    var ut = "";
    var i = 0;
    var n = kod.length;

    while (i < n) {
        var c = kod.charAt(i);
        var c2 = kod.charAt(i + 1);

        if (c === "/" && c2 === "*") {
            var slut = kod.indexOf("*/", i + 2);
            var till = slut === -1 ? n : slut + 2;
            // Behåll radbrytningarna, annars pekar radnumren fel.
            var borttaget = kod.substring(i, till);
            for (var b = 0; b < borttaget.length; b++) {
                if (borttaget.charAt(b) === "\n") ut += "\n";
            }
            i = till;
            continue;
        }
        if (c === "/" && c2 === "/") {
            var rad = kod.indexOf("\n", i);
            i = rad === -1 ? n : rad;          // behåll radbrytningen
            continue;
        }
        if (c === '"' || c === "'") {
            var q = c;
            i++;
            while (i < n) {
                if (kod.charAt(i) === "\\") { i += 2; continue; }
                if (kod.charAt(i) === q) { i++; break; }
                if (kod.charAt(i) === "\n") break;   // oavslutad sträng
                i++;
            }
            ut += '""';
            continue;
        }
        ut += c;
        i++;
    }
    return ut;
}

/* ================================================================== *
 * Moduler på disk
 * ================================================================== */

var moduler = fs.readdirSync(ROOT)
    .filter(function (f) { return /^(mv|fa)-[a-z0-9-]+\.js$/.test(f); })
    .sort();

if (moduler.length === 0) {
    console.error("  Hittade inga moduler i repots rot. Står du i rätt mapp?");
    process.exit(1);
}

/* ================================================================== *
 * I5 — modullistan i synk på alla ställen
 *
 * Det här är felet där fyra döda mv-*.js pushades: filerna döptes om i en
 * arbetskopia, men listorna pekade kvar på de gamla namnen.
 * ================================================================== */

function kontrolleraTestlista() {
    var kod = las(path.join(ROOT, "tools", "test.js"));
    var m = kod.match(/mock\.source\(\[([\s\S]*?)\]\)/);
    if (!m) {
        fail("I5", "hittade inte mock.source([...]) i tools/test.js");
        return;
    }

    var listade = [];
    var re = /"([^"]+\.js)"/g;
    var t;
    while ((t = re.exec(m[1])) !== null) listade.push(t[1]);

    for (var i = 0; i < moduler.length; i++) {
        if (listade.indexOf(moduler[i]) === -1) {
            fail("I5", moduler[i] + " finns på disk men laddas inte i tools/test.js" +
                " — den är alltså helt otestad");
        }
    }
    for (var j = 0; j < listade.length; j++) {
        if (moduler.indexOf(listade[j]) === -1) {
            fail("I5", "tools/test.js laddar " + listade[j] + " som inte finns på disk");
        }
    }

    // I4 — ordningen ÄR testet av I1.
    var sorterad = listade.slice().sort();
    for (var k = 0; k < listade.length; k++) {
        if (listade[k] !== sorterad[k]) {
            fail("I4", "modullistan i tools/test.js är inte alfabetisk. Ordningen är" +
                " själva testet av att modulerna tål Mementos laddningsordning" +
                " — sortera inte om den 'logiskt'.");
            break;
        }
    }
}

function kontrolleraReferenser() {
    // Varje omnämnande av en modulfil, var som helst i repot, ska peka på en
    // fil som finns. Fångar dokumentation som halkat efter en omdöpning.
    var undantag = ["moment.min.js"];
    var filer = allaFiler(ROOT).filter(function (f) {
        return /\.(md|js|txt|cmd|ps1|py)$/.test(f) &&
            path.basename(f) !== "kontroll.js";
    });

    for (var i = 0; i < filer.length; i++) {
        var innehall = las(filer[i]);
        var re = /\b((?:mv|fa)-[a-z0-9-]+\.js)\b/g;
        var m;
        var sedda = {};

        while ((m = re.exec(innehall)) !== null) {
            var namn = m[1];
            if (sedda[namn] || undantag.indexOf(namn) !== -1) continue;
            sedda[namn] = true;

            if (moduler.indexOf(namn) === -1) {
                fail("I5", rel(filer[i]) + " nämner " + namn +
                    " som inte finns på disk");
            }
        }
    }

    // Åt andra hållet: en modul som ingen dokumentation känner till kommer
    // aldrig att bockas i i appen, och blir därmed osynlig för scripten.
    var uppsattning = las(path.join(ROOT, "memento", "UPPSATTNING.md"));
    for (var j = 0; j < moduler.length; j++) {
        if (uppsattning.indexOf(moduler[j]) === -1) {
            fail("I5", moduler[j] + " saknas i memento/UPPSATTNING.md — den" +
                " kommer då inte att bockas i i appen och syns inte för scripten");
        }
    }

    // Moduler-scripten per bibliotek bär bibliotekslistan.
    var bibliotek;
    try {
        bibliotek = fs.readdirSync(path.join(ROOT, "memento")).filter(function (d) {
            return fs.statSync(path.join(ROOT, "memento", d)).isDirectory();
        });
    } catch (ex) { bibliotek = []; }

    for (var b = 0; b < bibliotek.length; b++) {
        var modulfil = path.join(ROOT, "memento", bibliotek[b], "shared", "Moduler.js");
        if (!fs.existsSync(modulfil)) {
            warn("I5", "memento/" + bibliotek[b] + " har inget shared/Moduler.js");
        }
    }
}

/* ================================================================== *
 * I1 — allt på toppnivå additivt och deklarativt
 * ================================================================== */

function kontrolleraToppniva() {
    // Vem skriver vad? En modul får äga sina egna grenar; problemet uppstår
    // när två moduler skriver samma, eller när någon skriver över en delad rot
    // (MV.config, MV.util, MV.ui, ...) rakt av. Det senare var det verkliga
    // felet: mv-core.js raderade MV.config.faltarbete som fa-faltarbete.js
    // redan lagt dit, eftersom fa-* laddas först.
    var skrivare = {};

    for (var s = 0; s < moduler.length; s++) {
        var kodrader = skalaAv(las(path.join(ROOT, moduler[s]))).split("\n");
        for (var q = 0; q < kodrader.length; q++) {
            if (/^\s/.test(kodrader[q])) continue;
            var t = kodrader[q].match(/^(MV(?:\.[A-Za-z_$][\w$]*)+)\s*=/);
            if (!t) continue;
            if (!skrivare[t[1]]) skrivare[t[1]] = [];
            if (skrivare[t[1]].indexOf(moduler[s]) === -1) {
                skrivare[t[1]].push(moduler[s]);
            }
        }
    }

    for (var i = 0; i < moduler.length; i++) {
        var namn = moduler[i];
        var rader = skalaAv(las(path.join(ROOT, namn))).split("\n");

        for (var r = 0; r < rader.length; r++) {
            var rad = rader[r];
            var nr = r + 1;

            // Bara toppnivå: indenterad kod ligger inne i en funktion.
            if (/^\s/.test(rad) || rad.trim() === "") continue;

            // Destruktiv tilldelning: MV.x = { ... } utan || {}
            var till = rad.match(/^(MV(?:\.[A-Za-z_$][\w$]*)+)\s*=\s*(.+)$/);
            if (till) {
                var hoger = till[2];
                var additiv = hoger.indexOf("||") !== -1 ||
                    /^function\b/.test(hoger) ||
                    /^MV\b/.test(hoger);
                if (!additiv && /^[\{\[]/.test(hoger)) {
                    var vag = till[1];
                    var djup = vag.split(".").length;      // "MV.config" = 2
                    var andra = skrivare[vag] || [];

                    if (djup <= 2) {
                        fail("I1", namn + ":" + nr + " skriver över den delade" +
                            " roten " + vag + " rakt av. Memento laddar" +
                            " alfabetiskt, så en annan modul kan redan ha lagt" +
                            " något där. Använd `" + vag + " = " + vag +
                            " || {}` och `if (!...) ...`.");
                    } else if (andra.length > 1) {
                        fail("I1", namn + ":" + nr + " skriver över " + vag +
                            " rakt av, men " + andra.join(" och ") +
                            " skriver alla dit. Den som laddas sist vinner," +
                            " och ordningen är alfabetisk. Gör tilldelningen" +
                            " additiv, eller låt en enda modul äga grenen.");
                    }
                }
            }

            // Anrop på toppnivå: kan träffa en modul som inte laddats än.
            var anrop = rad.match(/^([A-Za-z_$][\w.$]*)\s*\(/);
            if (anrop && !/^(function|if|for|while|switch|catch|return|typeof|var)\b/.test(rad)) {
                fail("I1", namn + ":" + nr + " anropar " + anrop[1] +
                    "() på toppnivå. Modulen kan laddas före den som definierar" +
                    " funktionen. Definiera bara — anropa vid körning.");
            }

            // Byggstämpelns push är undantaget, och den är avsiktlig.
            if (/^MV\.build\.moduler\.push\(/.test(rad)) {
                fel = fel.filter(function (f) {
                    return f.indexOf(namn + ":" + nr + " anropar") === -1;
                });
            }
        }
    }
}

/* ================================================================== *
 * I2 — ES5. Rhino 1.7.15 klarar inte mer.
 * ================================================================== */

function kontrolleraES5() {
    var forbjudet = [
        [/\blet\s+[A-Za-z_$]/, "let"],
        [/\bconst\s+[A-Za-z_$]/, "const"],
        [/\bclass\s+[A-Za-z_$]/, "class"],
        [/=>/, "arrow function"],
        [/`/, "template literal"],
        [/\bObject\.assign\b/, "Object.assign"],
        [/\bfor\s*\([^;)]*\bof\b/, "for...of"],
        [/\.includes\s*\(/, "Array/String.includes"],
        [/\bArray\.from\b/, "Array.from"],
        [/\bPromise\b/, "Promise"],
        [/\.\.\./, "spread/rest"],
        [/\bfunction\s*\*/, "generator"]
    ];

    for (var i = 0; i < moduler.length; i++) {
        var namn = moduler[i];
        var rader = skalaAv(las(path.join(ROOT, namn))).split("\n");

        for (var r = 0; r < rader.length; r++) {
            for (var f = 0; f < forbjudet.length; f++) {
                if (forbjudet[f][0].test(rader[r])) {
                    fail("I2", namn + ":" + (r + 1) + " använder " +
                        forbjudet[f][1] + " — Rhino är ES5 och kraschar på det." +
                        " Felet syns först i appen, inte här.");
                }
            }
        }
    }
}

/* ================================================================== *
 * Byggstämpel i varje modul
 * ================================================================== */

function kontrolleraStamplar() {
    for (var i = 0; i < moduler.length; i++) {
        var namn = moduler[i];
        var kod = las(path.join(ROOT, namn));
        var bas = namn.replace(/\.js$/, "");
        var m = kod.match(/MV\.build\.moduler\.push\(\s*\{\s*namn:\s*"([^"]+)"/);

        if (!m) {
            fail("stämpel", namn + " saknar byggstämpel längst ner." +
                " Då syns den inte i Version och man kan inte se om appen" +
                " kört en cachad version. Kör: node tools/stamp.js");
        } else if (m[1] !== bas) {
            fail("stämpel", namn + " stämplas som \"" + m[1] +
                "\" — namnet ska vara \"" + bas + "\"");
        }
    }
}

/* ================================================================== *
 * Döda länkar i dokumentationen
 * ================================================================== */

function kontrolleraLankar() {
    var filer = allaFiler(ROOT).filter(function (f) { return /\.md$/.test(f); });

    for (var i = 0; i < filer.length; i++) {
        var innehall = las(filer[i]);
        var re = /\]\(([^)#\s]+)(?:#[^)]*)?\)/g;
        var m;
        while ((m = re.exec(innehall)) !== null) {
            var mal = m[1];
            if (/^(https?:|mailto:)/.test(mal)) continue;

            var full = path.resolve(path.dirname(filer[i]), decodeURIComponent(mal));
            if (!fs.existsSync(full)) {
                fail("länk", rel(filer[i]) + " länkar till " + mal +
                    " som inte finns");
            }
        }
    }
}

/* ================================================================== *
 * Arbetsläget hänger med
 * ================================================================== */

function kontrolleraArbetslage() {
    if (!fs.existsSync(path.join(ROOT, "ARBETSLAGE.md"))) {
        warn("arbetsläge", "ARBETSLAGE.md saknas — den som kommer in i arbetet" +
            " har då inget att läsa om var det står");
        return;
    }

    // Ändras något av betydelse ska arbetsläget följa med. Frågan går till git,
    // inte till byggtiden: byggstämpeln skrivs om vid varje push och kan därför
    // aldrig stämma överens med en fil som skrevs innan.
    var andrade;
    try {
        var cp = require("child_process");
        var ut = cp.execSync("git diff --name-only HEAD", {
            cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
        });
        andrade = ut.split("\n").filter(function (r) { return r.trim() !== ""; });
    } catch (ex) {
        return;                         // inget git-repo, eller inga commits än
    }

    if (andrade.indexOf("ARBETSLAGE.md") !== -1) return;

    // En modul vars enda ändring är byggstämpeln räknas inte.
    var pahittat = [];
    for (var i = 0; i < andrade.length; i++) {
        var fil = andrade[i];
        if (fil === "CHANGELOG.md") continue;

        if (/^(mv|fa)-[a-z0-9-]+\.js$/.test(fil)) {
            var diff = "";
            try {
                diff = require("child_process").execSync(
                    'git diff -U0 HEAD -- "' + fil + '"',
                    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
            } catch (ex2) { diff = ""; }

            var riktig = diff.split("\n").filter(function (rad) {
                if (!/^[+-]/.test(rad) || /^(\+\+\+|---)/.test(rad)) return false;
                return rad.indexOf("MV.build.moduler.push") === -1;
            });
            if (riktig.length === 0) continue;
        }
        pahittat.push(fil);
    }

    if (pahittat.length > 0) {
        warn("arbetsläge", pahittat.length + " fil(er) har ändrats utan att" +
            " ARBETSLAGE.md rörts — t.ex. " + pahittat.slice(0, 3).join(", ") +
            ". Stämmer 'Kvar innan parity' och beslutsloggen fortfarande?");
    }
}

/* ================================================================== */

kontrolleraTestlista();
kontrolleraReferenser();
kontrolleraToppniva();
kontrolleraES5();
kontrolleraStamplar();
kontrolleraLankar();
kontrolleraArbetslage();

console.log("");
console.log("  Invariantkontroll — " + moduler.length + " moduler");

for (var i = 0; i < varningar.length; i++) {
    console.log("  VARNING  " + varningar[i]);
}
for (var j = 0; j < fel.length; j++) {
    console.log("  FEL      " + fel[j]);
}

console.log("");
if (fel.length === 0) {
    console.log("  Allt i ordning" +
        (varningar.length ? " (" + varningar.length + " varning(ar))" : "") + ".");
    process.exit(0);
}
console.log("  " + fel.length + " fel. Se CLAUDE.md för vad invarianterna betyder.");
process.exit(1);
