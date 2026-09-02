/**
 * tools/mock.js — minimal Memento-simulator för att köra modulerna i node.
 *
 * Lägger moment/message/dialog/ui/lib/libByName/entry/exit på global scope, så
 * att modulerna kan evalueras precis som Memento gör (alla jsLibs i en
 * gemensam scope).
 *
 * Simulatorn efterliknar med flit två av Mementos egenheter, eftersom det är
 * dem mv-db.js finns för att hantera:
 *
 *   COLD_CREATE  create() returnerar ett kallt entry: link() tystnar och
 *                field() ser bara det som angavs vid create()
 *   LAZY_MAP     ett kartfält som just satts läses tillbaka som null i samma
 *                körning, tills entryt hämtats om
 *
 * Sätt flaggorna till false för att kontrollera att testerna verkligen fångar
 * dem (då ska de sluta gå igenom av rätt anledning).
 */

"use strict";

var flags = { COLD_CREATE: true, LAZY_MAP: true };

var NOW = new Date(2026, 7, 19).getTime();      // 2026-08-19, fast tid
var messages = [];
var dialogs = [];
var libraries = {};
var nextId = 1;
var currentLib = null;
var currentEntry = null;


/* ---------------------------------------------------------------- *
 * Entry
 * ---------------------------------------------------------------- */

function Entry(library, values) {
    this.id = nextId++;
    this.lib = library;
    this.values = {};
    this.links = {};
    this.deleted = false;
    this.lazyMap = {};
    this.lastModifiedTime = "";

    for (var k in values || {}) {
        if (values.hasOwnProperty(k)) {
            // __andrad är inget fält utan mockens sätt att sätta
            // lastModifiedTime, som Memento fyller i av sig självt.
            if (k === "__andrad") { this.lastModifiedTime = values[k]; continue; }
            this.write(k, values[k]);
        }
    }
}

Entry.prototype.isLink = function (name) {
    return this.lib.linkFields.indexOf(name) !== -1;
};

Entry.prototype.assertKnown = function (name) {
    if (this.lib.fields.length && this.lib.fields.indexOf(name) === -1 &&
        !this.isLink(name)) {
        throw new Error("okänt fält '" + name + "' i " + this.lib.name);
    }
};

Entry.prototype.write = function (name, value) {
    this.values[name] = value;
    if (this.lib.mapFields.indexOf(name) !== -1 && flags.LAZY_MAP) {
        this.lazyMap[name] = true;
    }
};

Entry.prototype.read = function (name) {
    if (this.lib.mapFields.indexOf(name) !== -1) {
        if (flags.LAZY_MAP && this.lazyMap[name]) return null;
        var raw = this.values[name];
        if (typeof raw === "string" && raw.indexOf(",") > -1) {
            var p = raw.split(",");
            return { lat: parseFloat(p[0]), lng: parseFloat(p[1]) };
        }
        return raw === undefined ? null : raw;
    }
    return this.values.hasOwnProperty(name) ? this.values[name] : null;
};

Entry.prototype.displayName = function () {
    var f = this.lib.nameField;
    return (f && this.values[f] !== undefined && this.values[f] !== null)
        ? String(this.values[f]) : "Entry " + this.id;
};


/* ---------------------------------------------------------------- *
 * Handtag — vad script faktiskt får i handen
 * ---------------------------------------------------------------- */

/**
 * @param row   Entry
 * @param cold  true = kallt handtag (det create() ger tillbaka)
 */
function handle(row, cold) {
    var api = {
        id: row.id,
        deleted: row.deleted,
        // Memento ger entries en lastModifiedTime som sträng. Granskningen
        // använder den för att hitta poster som rörts efter ett visst datum.
        lastModifiedTime: row.lastModifiedTime || "",
        __row: row,
        __cold: !!cold,

        field: function (name) {
            row.assertKnown(name);
            if (row.isLink(name)) {
                if (cold) return [];
                return (row.links[name] || []).map(function (r) { return handle(r, false); });
            }
            if (cold && !row.values.hasOwnProperty(name)) return null;
            return row.read(name);
        },

        set: function (name, value) {
            row.assertKnown(name);
            if (row.isLink(name)) throw new Error("set() på länkfält '" + name + "'");
            row.write(name, value);
        },

        link: function (name, other) {
            if (!row.isLink(name)) throw new Error("link() på icke-länkfält '" + name + "'");
            if (cold) return;                        // tystnar, precis som i Memento
            row.links[name] = row.links[name] || [];
            row.links[name].push(other.__row);
        },

        unlink: function (name, other) {
            if (!row.isLink(name)) throw new Error("unlink() på icke-länkfält '" + name + "'");
            var arr = row.links[name] || [];
            for (var i = arr.length - 1; i >= 0; i--) {
                if (arr[i].id === other.id) arr.splice(i, 1);
            }
        }
    };

    Object.defineProperty(api, "name", {
        get: function () { return row.displayName(); }
    });
    return api;
}


/* ---------------------------------------------------------------- *
 * Library
 * ---------------------------------------------------------------- */

function Library(name, opts) {
    opts = opts || {};
    this.name = name;
    this.fields = opts.fields || [];
    this.linkFields = opts.linkFields || [];
    this.mapFields = opts.mapFields || [];
    this.nameField = opts.nameField || null;
    this.rows = [];
}

Library.prototype.create = function (values) {
    var row = new Entry(this, values);
    this.rows.push(row);
    return handle(row, flags.COLD_CREATE);
};

Library.prototype.findById = function (id) {
    for (var i = 0; i < this.rows.length; i++) {
        if (this.rows[i].id === id) {
            this.rows[i].lazyMap = {};              // omhämtning löser trögheten
            return handle(this.rows[i], false);
        }
    }
    return null;
};

Library.prototype.entries = function () {
    return this.rows.map(function (r) { return handle(r, false); });
};

Library.prototype.find = function (query) {
    var q = String(query).toLowerCase();
    var out = [];
    for (var i = 0; i < this.rows.length; i++) {
        var row = this.rows[i];
        for (var k in row.values) {
            if (row.values.hasOwnProperty(k) &&
                String(row.values[k]).toLowerCase().indexOf(q) > -1) {
                out.push(handle(row, false));
                break;
            }
        }
    }
    return out;
};

/** Skapar ett entry direkt, utan create()-trögheten. För testuppsättning. */
Library.prototype.seed = function (values) {
    var row = new Entry(this, values);
    row.lazyMap = {};
    this.rows.push(row);
    return handle(row, false);
};


/* ---------------------------------------------------------------- *
 * Globala Memento-funktioner
 * ---------------------------------------------------------------- */

global.moment = function (value) {
    var d = (value === undefined || value === null) ? new Date(NOW) : new Date(value);
    return {
        valueOf: function () { return d.getTime(); },
        format: function () {
            function p(n) { return (n < 10 ? "0" : "") + n; }
            return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
        }
    };
};

global.message = function (text) { messages.push(String(text)); };

global.dialog = function () {
    var d = { title: "", text: "", lines: [] };
    var api = {
        title: function (t) { d.title = t; return api; },
        text: function (t) { d.text = t; return api; },
        view: function (v) { d.lines = v.lines || []; return api; },
        positiveButton: function () { return api; },
        negativeButton: function () { return api; },
        show: function () { dialogs.push(d); return api; }
    };
    return api;
};

global.ui = function () {
    return {
        text: function (t) { return { text: String(t) }; },
        layout: function (items) {
            return { lines: items.map(function (i) { return i.text; }) };
        }
    };
};

global.log = function () { /* tyst */ };
global.libByName = function (name) { return libraries[name] || null; };
global.lib = function () { return currentLib; };
global.entry = function () { return currentEntry; };
global.exit = function () { throw { __exit: true }; };


/* ---------------------------------------------------------------- */

module.exports = {
    flags: flags,
    NOW: NOW,
    messages: messages,
    dialogs: dialogs,

    reset: function () {
        libraries = {};
        currentLib = null;
        currentEntry = null;
        messages.length = 0;
        dialogs.length = 0;
        nextId = 1;
    },

    defineLib: function (name, opts) {
        libraries[name] = new Library(name, opts);
        return libraries[name];
    },

    use: function (library, entryHandle) {
        currentLib = library;
        currentEntry = entryHandle || null;
    },

    /** Källkoden för modulerna, att evaluera på toppnivå i testfilen. */
    source: function (files) {
        var fs = require("fs");
        var path = require("path");
        return files.map(function (f) {
            return fs.readFileSync(path.join(__dirname, "..", f), "utf8");
        }).join("\n");
    }
};
