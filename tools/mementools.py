#!/usr/bin/env python3
"""
mementools — packa upp och packa ihop Memento Database-templates (.mlt2).

En .mlt2 är JSON där script ligger inbäddade som strängar på två ställen:

  triggers                              -> JSON-sträng med en lista triggers/actions/
                                           shared scripts, script i .script
  templates[i].json_options             -> JSON-sträng; för knappfält ligger
                                           script i .script (också JSON-sträng)
                                           med koden i .script
  templates[i].cnt[].s                  -> JSON-sträng; för JavaScript-fält
                                           (ft_script) ligger uttrycket i .expr,
                                           och fältets egna jsLibs i .libs

Kommandon
---------
  extract  IN_DIR  SCRIPTS_DIR  STRIPPED_DIR
      Plockar ut varje aktivt script till en egen .js-fil och skriver en
      rensad .mlt2 där koden bytts mot "// @script: <relativ sökväg>".
      Revisionshistoriken tas bort.

  inject   STRIPPED_DIR  SCRIPTS_DIR  OUT_DIR
      Motsatsen: läser de rensade .mlt2-filerna, följer varje @script-referens
      och bygger kompletta template-filer igen.

  diff     IN_DIR  SCRIPTS_DIR
      Jämför en färsk export mot .js-filerna i repot och listar vad som skiljer.
      Använd efter att du ändrat script i desktop-appen.

Exempel
-------
  python tools/mementools.py extract "Raw" "Extraherade scripts" "Templates utan script"
  python tools/mementools.py diff    "Raw" "Extraherade scripts"
  python tools/mementools.py inject  "Templates utan script" "Extraherade scripts" "Build"
"""

import io
import json
import os
import re
import sys

HEADER_RE = re.compile(r"^// (?:Källa|Typ|Namn|Fält|jsLibs|Sökväg i template):.*\n", re.M)
REF_RE = re.compile(r"^//\s*@script:\s*(.+?)\s*$", re.M)


# --------------------------------------------------------------------------- #
# hjälpare
# --------------------------------------------------------------------------- #

def slug(text):
    text = (text or "").strip()
    for a, b in [("å", "a"), ("ä", "a"), ("ö", "o"), ("Å", "A"), ("Ä", "A"), ("Ö", "O")]:
        text = text.replace(a, b)
    text = re.sub(r"[^\w\-. ]+", "_", text)
    text = re.sub(r"\s+", "_", text).strip("._")
    return text or "unnamed"


def read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def write_json(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False)


def write_text(path, text):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    if not text.endswith("\n"):
        text += "\n"
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def read_text(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def strip_header(code):
    """Tar bort den genererade kommentarshuvudet så bara koden återstår."""
    out = HEADER_RE.sub("", code)
    return out.lstrip("\n")


def templates_in(directory):
    return sorted(
        os.path.join(directory, n)
        for n in os.listdir(directory)
        if n.lower().endswith(".mlt2")
    )


def field_script(tpl):
    """Returnerar (script_dict, setter) för ett fälts inbäddade script, annars (None, None)."""
    raw_opts = tpl.get("json_options")
    if not raw_opts:
        return None, None
    try:
        opts = json.loads(raw_opts)
    except (ValueError, TypeError):
        return None, None

    raw = opts.get("script")
    if isinstance(raw, str):
        try:
            script = json.loads(raw)
        except (ValueError, TypeError):
            return None, None
    elif isinstance(raw, dict):
        script = raw
    else:
        return None, None

    if not isinstance(script.get("script"), str):
        return None, None

    def setter():
        opts["script"] = json.dumps(script, ensure_ascii=False)
        tpl["json_options"] = json.dumps(opts, ensure_ascii=False)

    return script, setter


SUBDIR = {"ACTION": "actions", "COMMON": "common"}


def field_expr(tpl):
    """(cnt-post, uttrycksobjekt, setter) för ett JavaScript-fält, annars (None, None, None).

    JavaScript-fält (ft_script) lagrar sitt uttryck i cnt[].s som JSON med
    nyckeln "expr" — inte i json_options som knappfälten. Missas det blir
    fältens kod aldrig versionshanterad.
    """
    for post in tpl.get("cnt") or []:
        raw = post.get("s")
        if not isinstance(raw, str) or "expr" not in raw:
            continue
        try:
            obj = json.loads(raw)
        except (ValueError, TypeError):
            continue
        if not isinstance(obj.get("expr"), str):
            continue

        def setter(_post=post, _obj=obj):
            _post["s"] = json.dumps(_obj, ensure_ascii=False)

        return post, obj, setter
    return None, None, None


# --------------------------------------------------------------------------- #
# extract
# --------------------------------------------------------------------------- #

def cmd_extract(in_dir, scripts_dir, stripped_dir):
    manifest = []

    for path in templates_in(in_dir):
        fname = os.path.basename(path)
        libslug = slug(os.path.splitext(fname)[0])
        data = read_json(path)
        used, entries = set(), []

        def target(rel):
            base, ext = os.path.splitext(rel)
            i = 2
            while rel.lower() in used:
                rel, i = "%s_%d%s" % (base, i, ext), i + 1
            used.add(rel.lower())
            return rel

        raw_triggers = data.get("triggers") or ""
        if raw_triggers:
            triggers = json.loads(raw_triggers)
            for i, trig in enumerate(triggers):
                code = trig.get("script")
                trig.pop("history", None)
                if code is None:
                    continue
                event = trig.get("event") or "UNKNOWN"
                name = trig.get("name") or "%s_%d" % (event, i)
                rel = target("%s/%s/%s.js" % (libslug, SUBDIR.get(event, "triggers"), slug(name)))
                write_text(
                    os.path.join(scripts_dir, rel),
                    "// Källa: %s\n// Typ: %s\n// Namn: %s\n// Sökväg i template: triggers[%d].script\n\n%s"
                    % (fname, event, name, i, code),
                )
                trig["script"] = "// @script: %s" % rel
                entries.append({"file": rel, "kind": event, "name": name,
                                "json_path": "triggers[%d].script" % i, "chars": len(code)})
            data["triggers"] = json.dumps(triggers, ensure_ascii=False)

        for idx, tpl in enumerate(data.get("templates", [])):
            _post, expr_obj, expr_setter = field_expr(tpl)
            if expr_obj is not None:
                code = expr_obj["expr"]
                label = tpl.get("tt") or "field_%d" % idx
                rel = target("%s/fields/%s.js" % (libslug, slug(label)))
                write_text(
                    os.path.join(scripts_dir, rel),
                    "// Källa: %s\n// Typ: %s (JavaScript-fält, uttryck)\n// Fält: %s\n"
                    "// jsLibs: %s\n"
                    "// Sökväg i template: templates[%d].cnt[].s.expr\n\n%s"
                    % (fname, tpl.get("type"), label,
                       json.dumps(expr_obj.get("libs") or [], ensure_ascii=False), idx, code),
                )
                expr_obj["expr"] = "// @script: %s" % rel
                expr_setter()
                entries.append({"file": rel, "kind": tpl.get("type"), "name": label,
                                "json_path": "templates[%d].cnt[].s.expr" % idx,
                                "chars": len(code)})

            script, setter = field_script(tpl)
            if script is None:
                continue
            code = script["script"]
            ftype = tpl.get("type") or "field"
            label = tpl.get("tt") or "field_%d" % idx
            sub = "buttons" if ftype == "ft_button" else "fields"
            rel = target("%s/%s/%s.js" % (libslug, sub, slug(label)))
            write_text(
                os.path.join(scripts_dir, rel),
                "// Källa: %s\n// Typ: %s\n// Fält: %s\n"
                "// Sökväg i template: templates[%d].json_options.script.script\n\n%s"
                % (fname, ftype, label, idx, code),
            )
            script["script"] = "// @script: %s" % rel
            script.pop("history", None)
            setter()
            entries.append({"file": rel, "kind": ftype, "name": label,
                            "json_path": "templates[%d].json_options.script.script" % idx,
                            "chars": len(code)})

        write_json(os.path.join(stripped_dir, fname), data)
        manifest.append({"template": fname, "scripts": entries})
        print("%-42s %2d script" % (fname, len(entries)))

    write_text(os.path.join(scripts_dir, "_manifest.json"),
               json.dumps(manifest, ensure_ascii=False, indent=2))


# --------------------------------------------------------------------------- #
# inject
# --------------------------------------------------------------------------- #

def resolve(ref_comment, scripts_dir):
    match = REF_RE.search(ref_comment or "")
    if not match:
        return None
    path = os.path.join(scripts_dir, match.group(1))
    if not os.path.isfile(path):
        raise SystemExit("saknad scriptfil: %s" % path)

    # Avslutande radbrytningar normaliseras bort — .js-filer i git ska sluta med
    # newline, men den inbäddade script-strängen i templaten ska inte.
    return strip_header(read_text(path)).rstrip("\n")


def cmd_inject(stripped_dir, scripts_dir, out_dir):
    for path in templates_in(stripped_dir):
        fname = os.path.basename(path)
        data = read_json(path)
        count = 0

        raw_triggers = data.get("triggers") or ""
        if raw_triggers:
            triggers = json.loads(raw_triggers)
            for trig in triggers:
                code = resolve(trig.get("script"), scripts_dir)
                if code is not None:
                    trig["script"] = code
                    trig.setdefault("history", [])
                    count += 1
            data["triggers"] = json.dumps(triggers, ensure_ascii=False)

        for tpl in data.get("templates", []):
            _post, expr_obj, expr_setter = field_expr(tpl)
            if expr_obj is not None:
                code = resolve(expr_obj["expr"], scripts_dir)
                if code is not None:
                    expr_obj["expr"] = code
                    expr_setter()
                    count += 1

            script, setter = field_script(tpl)
            if script is None:
                continue
            code = resolve(script["script"], scripts_dir)
            if code is not None:
                script["script"] = code
                script.setdefault("history", [])
                setter()
                count += 1

        write_json(os.path.join(out_dir, fname), data)
        print("%-42s %2d script injicerade" % (fname, count))


# --------------------------------------------------------------------------- #
# diff
# --------------------------------------------------------------------------- #

def cmd_diff(in_dir, scripts_dir):
    changed = new = same = 0

    for path in templates_in(in_dir):
        fname = os.path.basename(path)
        libslug = slug(os.path.splitext(fname)[0])
        data = read_json(path)
        seen = set()

        def compare(rel, code, label):
            nonlocal changed, new, same
            base, ext = os.path.splitext(rel)
            i = 2
            while rel.lower() in seen:
                rel, i = "%s_%d%s" % (base, i, ext), i + 1
            seen.add(rel.lower())

            full = os.path.join(scripts_dir, rel)
            if not os.path.isfile(full):
                print("NY        %s" % label)
                new += 1
            elif strip_header(read_text(full)).strip() != code.strip():
                print("ÄNDRAD    %s  ->  %s" % (label, rel))
                changed += 1
            else:
                same += 1

        raw = data.get("triggers") or ""
        if raw:
            for i, trig in enumerate(json.loads(raw)):
                if trig.get("script") is None:
                    continue
                event = trig.get("event") or "UNKNOWN"
                name = trig.get("name") or "%s_%d" % (event, i)
                compare("%s/%s/%s.js" % (libslug, SUBDIR.get(event, "triggers"), slug(name)),
                        trig["script"], "%s :: %s" % (fname, name))

        for idx, tpl in enumerate(data.get("templates", [])):
            _post, expr_obj, _ = field_expr(tpl)
            if expr_obj is not None:
                label = tpl.get("tt") or "field_%d" % idx
                compare("%s/fields/%s.js" % (libslug, slug(label)),
                        expr_obj["expr"], "%s :: %s (JS-fält)" % (fname, label))

            script, _ = field_script(tpl)
            if script is None:
                continue
            ftype = tpl.get("type") or "field"
            label = tpl.get("tt") or "field_%d" % idx
            sub = "buttons" if ftype == "ft_button" else "fields"
            compare("%s/%s/%s.js" % (libslug, sub, slug(label)),
                    script["script"], "%s :: %s" % (fname, label))

    print("\n%d oförändrade, %d ändrade, %d nya" % (same, changed, new))
    return 1 if (changed or new) else 0


# --------------------------------------------------------------------------- #

# --------------------------------------------------------------------------- #
# fields — vilka fält finns egentligen?
#
# Kom till efter att koden fått ett statusvärde uppfunnet ur luften ("Avslutad"
# är en kryssruta, inte ett alternativ i Status Fältarbete). Fältuppsättningen
# ska gå att slå upp, inte gissas.
# --------------------------------------------------------------------------- #

# Basnamnen, så att inget kundnamn hamnar i den genererade filen.
BASNAMN = ["Anläggningar", "Fältarbete", "Import Fältarbete", "Nyckelregister"]

TYPTEXT = {
    "ft_string": "text",
    "ft_str_multiline": "text, flera rader",
    "ft_richtext": "rich text",
    "ft_int": "heltal",
    "ft_real": "decimaltal",
    "ft_boolean": "kryssruta",
    "ft_date": "datum",
    "ft_datetime": "datum och tid",
    "ft_str_list": "lista, ett val",
    "ft_checkboxes": "kryssrutor, flera val",
    "ft_radio": "radioknappar",
    "ft_lib_entry": "länk till entry",
    "ft_lookup": "lookup",
    "ft_image": "bild",
    "ft_location": "karta",
    "ft_button": "knapp",
    "ft_script": "javascript-fält",
    "ft_calc": "beräkning",
    "ft_contact": "kontakt",
    "ft_phone": "telefonnummer",
    "ft_hyperlink": "länk",
    "ft_file": "fil",
}


def _basnamn(titel):
    """"Test Fältarbete Kraft AB" -> "Fältarbete". Längsta matchning vinner."""
    bast, langd = titel, -1
    for bas in BASNAMN:
        if bas in titel and len(bas) > langd:
            bast, langd = bas, len(bas)
    return bast


def _forbjudna(repo_rot):
    """Orden ur .forbjudna-ord. Filen är gitignorerad; saknas den: tom lista."""
    sokvag = os.path.join(repo_rot, ".forbjudna-ord")
    if not os.path.exists(sokvag):
        return []
    with io.open(sokvag, encoding="utf-8") as fh:
        return [r.strip() for r in fh
                if r.strip() and not r.strip().startswith("#")]


def _maskera(text, ord_lista):
    """Byter ut kundnamn mot <kund>. Fältnamn kan innehålla dem.

    "Åter till Kraft AB" -> "Åter till <kund>". Utan detta skulle den genererade
    filen stoppas av sekretesskontrollen i push.cmd — eller värre, slinka
    igenom om ordet inte råkat stå i listan.
    """
    for term in ord_lista:
        text = re.sub(re.escape(term), "<kund>", text, flags=re.IGNORECASE)
    return text


def cmd_fields(raw_dir, out_file):
    """Skriver en fältinventering för alla .mlt2 i raw_dir."""
    filer = sorted(p for p in os.listdir(raw_dir) if p.endswith(".mlt2"))
    if not filer:
        print("inga .mlt2 i %s" % raw_dir)
        return 2

    rader = [
        "# Fältuppsättningen i biblioteken",
        "",
        "**Genererad — redigera inte för hand.** Kör:",
        "",
        "```",
        "python tools/mementools.py fields \"Raw\" memento/FALT.md",
        "```",
        "",
        "Detta är facit för vilka fält som finns och vilken typ de har. Slå upp",
        "här innan du skriver ett fältnamn i koden — att gissa har kostat oss tid",
        "förr, senast när ett statusvärde uppfanns som i själva verket var en",
        "kryssruta.",
        "",
        "Vilka *värden* ett listfält kan ha ligger inte i templaten. De står i",
        "[ARBETSFLODE.md](../ARBETSFLODE.md) och kommer från verksamheten.",
        "",
    ]

    for fil in filer:
        with io.open(os.path.join(raw_dir, fil), encoding="utf-8") as fh:
            data = json.load(fh)

        titel = data.get("title") or fil[:-5]
        rader.append("## %s" % _basnamn(titel))
        rader.append("")
        rader.append("| Fält | Typ | Skrivskyddat |")
        rader.append("|---|---|---|")

        falt = []
        for tpl in data.get("templates", []):
            namn = tpl.get("tt")
            if not namn:
                continue
            falt.append((tpl.get("order", 0), namn, tpl.get("type", ""),
                         "ja" if tpl.get("readonly") else ""))

        falt.sort()
        antal = 0

        for _, namn, typ, ro in falt:
            # Underrubrikerna är kortets indelning. De är inte fält, men de
            # visar VAR ett fält sitter — och det är så fälten refereras i tal
            # ("kommentaren under Åtgärder").
            if typ == "ft_subheader":
                rader.append("| **— %s —** | | |" % namn)
            else:
                antal += 1
                rader.append("| `%s` | %s | %s |" %
                             (namn, TYPTEXT.get(typ, typ), ro))

        rader.append("")
        rader.append("%d fält, i kortets egen ordning." % antal)
        rader.append("")

    # Fältnamn kan bära kundnamnet (t.ex. det gamla "Åter till <kund>").
    # Maskera innan filen skrivs — repot är publikt.
    ord_lista = _forbjudna(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    text = _maskera("\n".join(rader), ord_lista)

    if ord_lista and text != "\n".join(rader):
        print("  maskerade kundnamn i minst ett fältnamn")

    with io.open(out_file, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)

    print("skrev %s — %d bibliotek" % (out_file, len(filer)))
    if not ord_lista:
        print("  OBS: ingen .forbjudna-ord hittades — inget maskerades")
    return 0


# --------------------------------------------------------------------------- #
# links — vilket bibliotek pekar varje länkfält på?
#
# Kom till för att driftbiblioteken visade sig ha länkfält som pekade på gamla
# TESTbibliotek. Det gick inte att se någonstans utan att öppna varje fält i
# appen, ett i taget, och jämföra mot minnet.
#
# Måltabellen ligger i fältets cnt[0].s. Fältets EGEN tabell ligger i "lib".
# Är de exporterade tillsammans går allt att lösa upp till namn.
#
# Rapporten skrivs till skärmen och INTE till en fil: den innehåller riktiga
# biblioteksnamn, alltså kundnamn, och repot är publikt.
# --------------------------------------------------------------------------- #

def _lib_id(data):
    """Bibliotekets eget id — samma "lib" på alla dess fält."""
    for tpl in data.get("templates", []):
        if tpl.get("lib"):
            return tpl["lib"]
    return None


def cmd_links(raw_dir):
    filer = sorted(p for p in os.listdir(raw_dir) if p.endswith(".mlt2"))
    if not filer:
        print("inga .mlt2 i %s" % raw_dir)
        return 2

    # Karta id -> titel, byggd av allt som exporterats.
    namn = {}
    laddade = []

    for fil in filer:
        with io.open(os.path.join(raw_dir, fil), encoding="utf-8") as fh:
            data = json.load(fh)
        titel = data.get("title") or fil[:-5]
        egen = _lib_id(data)
        if egen:
            namn[egen] = titel
        laddade.append((titel, egen, data))

    print("")
    print("  Exporterade bibliotek")
    for titel, egen, _ in laddade:
        print("    %-40s %s" % (titel, egen or "(inget id — inga fält?)"))

    problem = 0

    for titel, egen, data in laddade:
        rader = []
        for tpl in data.get("templates", []):
            typ = tpl.get("type")
            mal = None

            if typ == "ft_lib_entry":
                cnt = tpl.get("cnt") or [{}]
                mal = cnt[0].get("s")
            elif typ == "ft_lookup":
                jo = tpl.get("json_options")
                if isinstance(jo, str):
                    try:
                        mal = json.loads(jo).get("libraryId")
                    except ValueError:
                        mal = None
            else:
                continue

            if not mal:
                rader.append((tpl.get("tt"), "(inget mål satt)", True))
                problem += 1
                continue

            if mal in namn:
                rader.append((tpl.get("tt"), namn[mal], False))
            else:
                rader.append((tpl.get("tt"), "OKÄNT id %s — biblioteket är "
                              "inte med i exporten" % mal, True))
                problem += 1

        if not rader:
            continue

        print("")
        print("  %s" % titel)
        for falt, mal, flagga in rader:
            print("    %-28s -> %s%s" % (falt, mal, "   <-- KONTROLLERA" if flagga else ""))

    print("")
    if problem:
        print("  %d länkfält pekar på något som inte finns i exporten." % problem)
        print("  Exportera ALLA bibliotek — drift och test — och kör igen, så")
        print("  syns det om ett driftfält pekar på ett testbibliotek.")
    else:
        print("  Alla länkfält pekar på bibliotek som finns i exporten.")
        print("  Kontrollera ändå att drift pekar på drift och test på test.")
    return 0


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2

    cmd, args = argv[1], argv[2:]
    handlers = {"extract": (cmd_extract, 3), "inject": (cmd_inject, 3),
                "diff": (cmd_diff, 2), "fields": (cmd_fields, 2),
                "links": (cmd_links, 1)}

    if cmd not in handlers:
        print("okänt kommando: %s" % cmd)
        print(__doc__)
        return 2

    fn, argc = handlers[cmd]
    if len(args) != argc:
        print("%s tar %d argument, fick %d" % (cmd, argc, len(args)))
        return 2

    return fn(*args) or 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
