/**
 * fa-firmware.js — håller "Firmware Status" i takt med "Firmware".
 *
 * Kräver: mv-core.js, moment.min.js
 */

var MV = MV || {};
MV.Firmware = MV.Firmware || {};

/** Värden i Firmware-fältet som betyder "inget valt". */
MV.Firmware.IGNORE = ["", "Välj"];

/** Värdet som utlöser stämpling av uppgraderingsdatum. */
MV.Firmware.UPGRADED = "Uppgraderad";

/**
 * Speglar Firmware till Firmware Status. Sätter dessutom
 * "Firmware uppgraderades" till dagens datum när statusen blir Uppgraderad.
 *
 * @return true om något ändrades
 */
MV.Firmware.syncStatus = function (entryObj) {
    var e = entryObj || entry();
    if (!e) return false;

    var raw = e.field(MV.util.f("firmware"));
    var currentRaw = e.field(MV.util.f("firmwareStatus"));

    var value = (raw === null || raw === undefined) ? "" : String(raw);
    var current = (currentRaw === null || currentRaw === undefined) ? "" : String(currentRaw);

    for (var i = 0; i < MV.Firmware.IGNORE.length; i++) {
        if (value === MV.Firmware.IGNORE[i]) return false;
    }

    if (value === current) return false;

    e.set(MV.util.f("firmwareStatus"), value);

    if (value === MV.Firmware.UPGRADED) {
        e.set(MV.util.f("firmwareUppgraderades"), MV.util.today());
    }
    return true;
};

/* Bakåtkompatibilitet med befintliga trigger-script. */
function updateFirmwareStatus() {
    return MV.Firmware.syncStatus();
}

// byggstämpel — skrivs av tools/stamp.js
MV.build = MV.build || { moduler: [] };
MV.build.moduler.push({ namn: "fa-firmware", byggd: "2026-08-31 13:37", hash: "57dc413" });
