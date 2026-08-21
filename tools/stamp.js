/**
 * tools/stamp.js — skriver byggstämpeln i modulerna.
 *
 *   node tools/stamp.js            stämpla med nuvarande tid
 *   node tools/stamp.js --check    verifiera bara, ändra inget (exit 1 vid fel)
 *
 * Varje modul avslutas med:
 *
 *     // byggstämpel — skrivs av tools/stamp.js
 *     MV.build = MV.build || { moduler: [] };
 *     MV.build.moduler.push({ namn: "mv-core", byggd: "...", hash: "..." });
 *
 * Stämpeln skriver DIREKT i arrayen i stället för att anropa MV.stamp().
 * Memento laddar biblioteken i alfabetisk ordning, så mv-core.js — där en
 * sådan funktion skulle bo — är inte nödvändigtvis inläst än.
 *
 * Byggtiden är gemensam för alla moduler i samma körning. Hashen är per fil och
 * beräknas på innehållet OVANFÖR stämpeln, så att den bara ändras när koden
 * faktiskt gjort det.
 *
 * push.ps1 kör detta före varje commit, så stämpeln i git alltid motsvarar
 * koden. Ute i Memento visar MV.about() samma uppgifter — skiljer de sig har
 * ändringen inte kommit fram, och skiljer EN modul sig från de andra har
 * Memento cachat en gammal version av just den.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const MARKER = "// byggstämpel — skrivs av tools/stamp.js";
const CHECK = process.argv.indexOf("--check") !== -1;

/** Alla moduler i repots rot, oavsett projektprefix. */
function moduler() {
    return fs.readdirSync(REPO)
        .filter(function (f) { return /^[a-z]{2}-.*\.js$/.test(f); })
        .sort();
}

function tidsstampel() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
        " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

/** Innehållet ovanför stämpeln — det som hashas. */
function kropp(text) {
    const at = text.indexOf(MARKER);
    return at === -1 ? text.replace(/\s+$/, "") : text.slice(0, at).replace(/\s+$/, "");
}

function hash(text) {
    return crypto.createHash("sha1").update(text, "utf8").digest("hex").slice(0, 7);
}

const byggd = tidsstampel();
const filer = moduler();

if (filer.length === 0) {
    console.error("  Hittade inga moduler i repots rot.");
    process.exit(1);
}

let ändrade = 0;
let fel = 0;

filer.forEach(function (fil) {
    const full = path.join(REPO, fil);
    const text = fs.readFileSync(full, "utf8");
    const namn = fil.replace(/\.js$/, "");
    const body = kropp(text);
    const h = hash(body);

    if (CHECK) {
        // Stämmer hashen i filen med innehållet?
        const m = text.match(/namn: "([^"]+)", byggd: "([^"]+)", hash: "([^"]+)"/);
        if (!m) {
            console.error("  " + fil + ": saknar byggstämpel");
            fel++;
        } else if (m[1] !== namn) {
            console.error("  " + fil + ": stämpeln säger '" + m[1] + "'");
            fel++;
        } else if (m[3] !== h) {
            console.error("  " + fil + ": hashen är gammal (" + m[3] + " -> " + h + ")");
            fel++;
        }
        return;
    }

    const ny = body + "\n\n" + MARKER + "\n" +
        "MV.build = MV.build || { moduler: [] };\n" +
        'MV.build.moduler.push({ namn: "' + namn + '", byggd: "' + byggd +
        '", hash: "' + h + '" });\n';

    if (ny !== text) {
        fs.writeFileSync(full, ny, "utf8");
        ändrade++;
    }
});

if (CHECK) {
    if (fel > 0) {
        console.error("\n  " + fel + " modul(er) ostämplade eller inaktuella. Kör: node tools/stamp.js");
        process.exit(1);
    }
    console.log("  " + filer.length + " moduler stämplade och aktuella");
    process.exit(0);
}

console.log("  Bygge " + byggd + " — " + filer.length + " moduler stämplade" +
    (ändrade === 0 ? " (oförändrade)" : ", " + ändrade + " uppdaterade"));
