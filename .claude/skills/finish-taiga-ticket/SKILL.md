---
name: finish-taiga-ticket
description: Schließt eine Taiga-User-Story nach bestandener QA ab. Aufruf mit der Story-Nummer, z. B. `/finish-taiga-ticket 27`. Prüft die Bedingungen mit einem Skript, erstellt nach Go den PR, merged per Squash, prüft das Deployment live, schreibt Release-Kommentar und Neuigkeit und setzt die Story auf Fertig oder bei sichtbaren Änderungen auf Abnahme durch eine andere Person. Ein zweiter Aufruf schließt die Abnahme ab. Bei Fehlern nach dem Merge bereitet er einen Revert vor.
argument-hint: <story-nummer>
disable-model-invocation: true
model: sonnet
effort: medium
---

# Taiga-Story abschließen

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Live-URL: `https://norddeutsche-coder.github.io/m.oach/`, Deploy-Workflow `Deploy`.

Argument: Nummer der **User Story**. Fehlt sie, frag danach. **Steht die Story auf `Abnahme`**, direkt zu Phase 7.

**Ein Haltepunkt:** vor PR und Merge. Den PR erstellt nur dieser Skill, und nur nach bestandener QA für den aktuellen Head-Commit.

## Phase 1: Bedingungen

1. `python3 -I scripts/moach_taiga.py finish-check <nr>`. Das Skript prüft Branch, CI, QA-Kommentar zum Head-Commit, neue Commits auf `main` und gemeinsame Dateien, Status `Im Test`, offene Tasks, offene Acceptance Criteria, Merge-Konflikte und einen vorhandenen PR. Läuft die CI noch (⏳), warte (höchstens 15 Minuten) und prüfe erneut.
2. Bei ⚠️ **Basis**: Liste die gemeinsamen Dateien und frag, ob vorher `main` in den Branch gemergt und die QA wiederholt werden soll (Empfehlung: ja). Bei ⚠️ **PR**: den vorhandenen PR weiterverwenden.
3. Offene Acceptance Criteria, die laut QA-Kommentar erfüllt sind, darfst du beim Abschluss abhaken. Das sagst du im Haltepunkt. Andere offene Tasks: fragen, ob schließen, verschieben oder zuerst erledigen.
4. Bundle-Namen der Live-Version notieren (`curl -s <Live-URL> | grep -o 'assets/index-[^"]*\.js'`).

## Phase 2: Freigabe (Haltepunkt)

Zeig die Ausgabe von `finish-check`, `git diff --stat origin/main...origin/<branch>`, den PR (Titel `<Story-Titel> (TG-<nr>)`, Text nach `templates/pr-beschreibung.md`) und die Squash-Nachricht ohne `Co-authored-by:` für KI-Agenten. Steht irgendwo ❌, **kein PR und kein Merge**, sondern nenne den Skill, der es behebt. Sonst halte an und warte auf ein Go.

## Phase 3: PR und Merge (nach Go)

1. PR nach `main` erstellen (GitHub-MCP `create_pull_request` oder `gh pr create --body-file`).
2. `python3 -I scripts/moach_taiga.py set-pr-link <nr> <PR-URL>`, Story auf `Im Review`.
3. Checks des PR abwarten (z. B. Secret-Scan, höchstens 15 Minuten). Rot → anhalten, Story bleibt `Im Review`.
4. Laut QA erfüllte Acceptance Criteria abhaken. Squash-Merge mit Titel und Text aus Phase 2, nie Schutzregeln umgehen. Abgelehnt → anhalten, Grund melden.

## Phase 4: Deployment und Smoke-Test

1. Deploy-Lauf zum Merge-Commit abwarten (`gh run list --commit <sha>`, höchstens 20 Minuten).
2. Live-URL laden, bis sich der Bundle-Name geändert hat (höchstens 5 Minuten).
3. Die betroffene Ansicht mit `shots.cjs` aus dem QA-Skill gegen die Live-URL aufnehmen (Handy hell, bei Oberflächen zusätzlich dunkel, externe Anfragen blockiert, kein `moach_sb`). Jeden Screenshot ansehen: Die App startet, die Änderung ist sichtbar, es gibt keine Konsolenfehler.
4. Schlägt etwas fehl → Phase 6.

## Phase 5: Abschließen

1. Restliche Tasks `Erledigt`. Story auf `Abnahme`, wenn der QA-Kommentar „Nötig: ja“ sagt (bei `hotfix` optional), sonst `Fertig`. Danach `sort-sprint`.
2. Screenshots als **eine ZIP** (`python3 -m zipfile -c <tmp>/release-tg-<nr>/live-tg-<nr>.zip <tmp>/release-tg-<nr>/*.png`) hochladen, Kommentar nach `templates/release.md`.
3. Bemerken Läufer die Änderung: eine Zeile oben in der Wiki-Seite `neuigkeiten`: `- <Datum>: <was Läufer davon haben> (#<nr>)`.
4. Discord: `discord-news-check <nr>` ausführen.
   - Bei `Epic … ankündigen: ja`: einen Text nach `epic_news_text` vorschlagen („Kurz gesagt“, nur der Nutzen für Läufer, ohne Fachbegriffe).
   - Bei `Bug: ja`: einen Text nach `bug_news_text` vorschlagen (`Behoben: …`).
   - Nach Go den Text in eine Datei unter `<tmp>` schreiben und `discord-news <datei>` ausführen. Die Ausgabe ist der Link zur Nachricht.
   - Bei `Discord-Beitrag: <link>` danach `discord-bug-fixed <link> <news-link>` ausführen. Wurde `discord-news` übersprungen oder nichts gepostet, nimm als `<news-link>` die App-URL `https://norddeutsche-coder.github.io/m.oach/`.
   - Sonst nichts posten. Rein technische Stories posten nie. Keine Erwähnungen. Meldet ein Befehl `übersprungen: …`, weil eine Variable fehlt, weitermachen und es im Abschlussbericht nennen.
5. Bei Abnahme: Kommentar nach `templates/zur-abnahme.md` an die nicht zugeordnete Person.
6. Aufräumen: Remote-Branch löschen, falls noch da, lokal `git switch main && git pull --ff-only && git branch -d <branch>` (bei Weigerung fragen).

## Phase 6: Fehler nach dem Merge

Story bleibt `Im Review`. Task `Release: <kurz>` mit den fünf Angaben (Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag). Revert vorbereiten, **nicht mergen**: Branch `revert/tg-<nr>-<kurztitel>`, `git revert <merge-sha>`, PR „Revert: <PR-Titel>“. Melden und fragen: Revert oder vorwärts korrigieren. Nach Go zum Revert: mergen, Deployment und Smoke-Test, Kommentar, Story `In Arbeit`.

## Phase 7: Abnahme abschließen

Neuester Kommentar nach „Zur Abnahme“, der mit „Abgenommen“ oder „Nicht abgenommen“ beginnt:
- von der zugeordneten Person → zählt nicht, anhalten und darauf hinweisen,
- „Abgenommen“ von jemand anderem → `Fertig`, Kommentar `Abnahme bestätigt durch @<Person> · <Datum>`,
- „Nicht abgenommen: …“ → je Punkt ein Task `Abnahme: <Punkt>` (Status `Neu`, der zugeordneten Person), Story `In Arbeit`, nächster Schritt `/implement-taiga-ticket <nr>`. Bei schädlichen Mängeln Revert oder `hotfix` vorschlagen,
- keine Antwort → anhalten, nennen, wer angesprochen ist und seit wann.

Danach `sort-sprint`.

## Abschlussbericht

Kurz gesagt, Ergebnis ✅/❌, PR, Merge-Commit, Deploy-Lauf, Live-Version, 1–2 Screenshots, Taiga-Status, aufgeräumte Branches.

## Grenzen

Kein PR ohne bestandene QA für den Head-Commit, kein PR oder Merge ohne Go oder bei ❌. Nie selbst abnehmen. Nie force-pushen, nie direkt auf `main`, kein Revert ohne Go. Keine echten Zugangsdaten, keine Live-Backends. Kein Code außer dem Revert.
