#!/usr/bin/env python3
"""
mementools — packa upp och packa ihop Memento Database-templates (.mlt2).

En .mlt2 är JSON där script ligger inbäddade som strängar på två ställen:

  triggers                              -> JSON-sträng med en lista triggers/actions/
                                           shared scripts, script i .script
  templates[i].json_options             -> JSON-sträng; för knapp- och JS-fält
                                           ligger script i .script (också JSON-sträng)
                                           med koden i .script

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

import json
import os
import re
import sys

HEADER_RE = re.compile(r"^// (?:Källa|Typ|Namn|Fält|Sökväg i template):.*\n", re.M)
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

def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2

    cmd, args = argv[1], argv[2:]
    handlers = {"extract": (cmd_extract, 3), "inject": (cmd_inject, 3), "diff": (cmd_diff, 2)}

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
