# tools/push.ps1 — kör testerna och pusha till GitHub.
#
# Starta via push.cmd (dubbelklicka) eller:
#   powershell -ExecutionPolicy Bypass -File tools\push.ps1 "meddelande"
#
# Gör i tur och ordning:
#   1. kontrollerar att git finns
#   2. skriver byggstämpeln i modulerna (tools/stamp.js)
#   3. invariantkontroll (tools/kontroll.js) — ES5, laddningsordning, döda
#      referenser i dokumentationen
#   4. kör node tools/test.js — avbryter vid fel, så trasig kod inte pushas
#   5. sekretesskontroll mot .forbjudna-ord — avbryter vid träff
#   6. visar vad som ändrats
#   7. commit + push

param([string]$Message)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Stå i repots rot oavsett varifrån scriptet startades
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

function Fail($text) {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor Red
    Write-Host ""
    Read-Host "Tryck Enter for att stanga"
    exit 1
}

Write-Host ""
Write-Host "  Memento-script -> GitHub" -ForegroundColor Cyan
Write-Host "  $repo"
Write-Host ""

# --- 1. git installerat? ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "git hittades inte. Installera Git for Windows: https://git-scm.com/download/win"
}

if (-not (Test-Path ".git")) {
    Fail "Den här mappen är inget git-repo än. Följ GITHUB.md, avsnitt 'Första gången'."
}

# --- 2. byggstämpel ---
# Stämpeln måste skrivas FÖRE testerna, så att testet av MV.about() ser
# samma uppgifter som hamnar i git.
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  Byggstämpel..." -ForegroundColor Yellow
    $stampOut = & node tools/stamp.js 2>&1
    if ($LASTEXITCODE -ne 0) {
        $stampOut | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        Fail "Byggstampeln kunde inte skrivas."
    }
    Write-Host "  $($stampOut | Select-Object -Last 1)" -ForegroundColor Green
    Write-Host ""

    # Byggtiden visas igen på slutet, så man kan jämföra med Version i appen.
    $m = [regex]::Match(($stampOut -join " "), "(\d{4}-\d{2}-\d{2} \d{2}:\d{2})")
    if ($m.Success) { $byggtid = $m.Groups[1].Value }
}

# --- 3. invariantkontroll ---
# Testerna kontrollerar att koden gör rätt. Den här kontrollerar sådant
# testerna inte kan se: ES6-syntax som Rhino kraschar på, moduler som skriver
# över varandra på toppnivå, och dokumentation som pekar på filer som bytt
# namn. Se CLAUDE.md.
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  Invariantkontroll..." -ForegroundColor Yellow
    $kontrollOut = & node tools/kontroll.js 2>&1
    $kontrollExit = $LASTEXITCODE

    $kontrollOut | Where-Object { $_ -match "VARNING" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Yellow
    }
    if ($kontrollExit -ne 0) {
        $kontrollOut | Where-Object { $_ -match "FEL" } | Select-Object -First 30 |
            ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        Fail "Invariantkontrollen failade. Inget pushat. Se CLAUDE.md."
    }
    Write-Host "  $($kontrollOut | Select-Object -Last 1)" -ForegroundColor Green
    Write-Host ""
}

# --- 4. testerna ---
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  Kör tester..." -ForegroundColor Yellow
    $testOutput = & node tools/test.js 2>&1
    $testExit = $LASTEXITCODE

    if ($testExit -ne 0) {
        $testOutput | Where-Object { $_ -match "FEL" } | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Red
        }
        Fail "Testerna failade. Inget pushat. Rätta felen och kör igen."
    }
    Write-Host "  $($testOutput | Select-Object -Last 1)" -ForegroundColor Green
} else {
    Write-Host "  node saknas - hoppar over testerna." -ForegroundColor Yellow
    Write-Host "  Installera Node.js for att fanga fel innan de nar telefonerna:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org" -ForegroundColor Yellow
}
Write-Host ""

# --- 5. sekretesskontroll ---
# Repot är publikt. .forbjudna-ord innehåller ord som aldrig får hamna där —
# kundnamn, personnamn, adresser. Filen är själv gitignorerad, så listan
# läcker inte. Se .forbjudna-ord.exempel.
$ordfil = ".forbjudna-ord"

if (Test-Path $ordfil) {
    Write-Host "  Sekretesskontroll..." -ForegroundColor Yellow

    $ord = Get-Content $ordfil -Encoding UTF8 |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -ne "" -and -not $_.StartsWith("#") }

    if ($ord.Count -gt 0) {
        # Allt git skulle ta med: spårade filer plus nya som inte är ignorerade
        $filer = & git ls-files -c -o --exclude-standard
        $traffar = @()

        foreach ($term in $ord) {
            foreach ($fil in $filer) {
                if ($fil -match [regex]::Escape($term)) {
                    $traffar += "  $fil  (i filnamnet: $term)"
                    continue
                }
                if (-not (Test-Path $fil)) { continue }
                $m = Select-String -Path $fil -Pattern ([regex]::Escape($term)) `
                                   -SimpleMatch -Encoding UTF8 -ErrorAction SilentlyContinue
                foreach ($hit in $m) {
                    $traffar += "  $($hit.Path):$($hit.LineNumber)  ($term)"
                }
            }
        }

        if ($traffar.Count -gt 0) {
            Write-Host ""
            Write-Host "  STOPP - forbjudna ord hittades:" -ForegroundColor Red
            $traffar | Select-Object -First 40 | ForEach-Object {
                Write-Host $_ -ForegroundColor Red
            }
            if ($traffar.Count -gt 40) {
                Write-Host "  ...och $($traffar.Count - 40) fler" -ForegroundColor Red
            }
            Fail "Inget pushat. Ta bort forekomsterna, eller redigera $ordfil om ordet ar ofarligt."
        }
        Write-Host "  $($ord.Count) ord kontrollerade, inga traffar" -ForegroundColor Green
    }
} else {
    Write-Host "  (ingen $ordfil - sekretesskontrollen hoppas over)" -ForegroundColor DarkGray
}
Write-Host ""

# --- 6. vad har ändrats? ---
$changes = & git status --porcelain
if (-not $changes) {
    Write-Host "  Inget har ändrats sedan senaste push." -ForegroundColor Green
    Write-Host ""
    Read-Host "Tryck Enter for att stanga"
    exit 0
}

Write-Host "  Ändrat:" -ForegroundColor Cyan
$changes | ForEach-Object { Write-Host "    $_" }
Write-Host ""

# --- 7. commit + push ---
if (-not $Message) {
    $Message = Read-Host "  Beskriv andringen (Enter = standardtext)"
}
if (-not $Message) {
    $Message = "Uppdaterade script " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

& git add -A
if ($LASTEXITCODE -ne 0) { Fail "git add misslyckades." }

& git commit -m $Message
if ($LASTEXITCODE -ne 0) { Fail "git commit misslyckades." }

Write-Host ""
Write-Host "  Pushar..." -ForegroundColor Yellow
& git push
if ($LASTEXITCODE -ne 0) {
    Fail "git push misslyckades. Vanligast: du är inte inloggad, eller 'origin' saknas. Se GITHUB.md."
}

Write-Host ""
Write-Host "  Pushat. Koden ligger nu på GitHub." -ForegroundColor Green
Write-Host ""
Write-Host "  Men Memento hämtar den INTE av sig själv." -ForegroundColor Yellow
Write-Host "  Appen återanvänder det den redan laddat, hela sin körning." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Gör så här, i varje bibliotek — och på varje enhet:" -ForegroundColor Cyan
Write-Host "    1. Automation -> Script -> Moduler"
Write-Host "    2. Klicka uppdateringsikonen (runda pilen) ovanför modullistan"
Write-Host "    3. Kör Version och kontrollera byggtiden"
if ($byggtid) {
    Write-Host "       Den ska visa:  $byggtid" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Visar den en äldre tid:" -ForegroundColor DarkGray
Write-Host "    - vänta nagra minuter. GitHubs CDN cachar filerna en kort stund." -ForegroundColor DarkGray
Write-Host "    - hjälper det inte: starta om appen. Det tömmer cachen säkert." -ForegroundColor DarkGray
Write-Host "    - avviker EN modul men inte de andra: just den är cachad." -ForegroundColor DarkGray
Write-Host ""
Read-Host "Tryck Enter for att stanga"
