---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story bis zur QA-Bereitschaft um, ohne Pull Request. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Klärt zuerst offene Rückfragen im Sprint, prüft die Definition of Ready, ordnet die Story der aufrufenden Person und dem laufenden Sprint zu, plant, implementiert, macht schnelle Checks, committet und pusht nach Freigabe und setzt die Story nach grüner CI auf Im Test.
argument-hint: <story-nummer>
disable-model-invocation: true
effort: high
---

# Taiga-Story umsetzen

> Gemeinsame Regeln (Werkzeuge, Rollen, Fragen, Status, Sprint, Hotfix, Token-Regeln): `docs/workflow.md`. Lies sie zu Beginn, falls nicht schon in dieser Sitzung geschehen. Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Starte den Skill in einer frischen Sitzung.

Argument: Nummer einer **User Story** (`27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

**Zwei Haltepunkte:** nach dem Plan (Phase 2) und nach der Umsetzung (Phase 5). Ein Go zum Plan ist kein Go zum Commit. **Kein Pull Request**, auch kein Entwurf. Nur schnelle Checks (`npm run check`, `npm run lint`, `npm test -- --reporter=dot` in `frontend/`). Build, E2E, Screenshots und der Beleg je Acceptance Criteria gehören zu `/qa-taiga-ticket`.

## Phase 0: Offene Rückfragen

`python3 -I scripts/moach_taiga.py pending-questions --exclude <nr>`. Gibt es offene Fragerunden an die aufrufende Person im laufenden Sprint, zeig sie und frag, ob sie jetzt beantwortet werden (Empfehlung). Antworten schreibst du als `Antworten von @<person> (im Dialog mit <Agent>): …` an die jeweilige Story. Erfüllt eine Story danach die Definition of Ready, setz sie auf `Bereit`.

## Phase 1: Story laden und Lage prüfen

1. Story, Tasks und Kommentare laden (Taiga-MCP `work` `op: get`, `type: story`; Tasks mit `op: list`; Taiga-MCP `comments`). Wiki `definition-of-ready` und `definition-of-done` lesen.
2. `git status` (fremde uncommittete Änderungen → anhalten und fragen), `git fetch origin`, Branch `…/tg-<nr>-…` suchen.
3. **Fortsetzen:** Story `In Arbeit` oder Branch vorhanden → dorthin wechseln, offene Tasks (`QA: …`, `Abnahme: …`, `Release: …`), Kommentare und `git diff --stat origin/main...HEAD` lesen, nur den Rest planen. Nach „Nicht abgenommen“ auf einem neuen Branch.
4. Story `Fertig`, `Im Review`, `Abnahme` oder `Im Test` ohne offene Tasks → anhalten, Stand und nächsten Schritt melden.
5. **Zuordnung:** Gehört die Story jemand anderem, nur nach ausdrücklichem Ja übernehmen.
6. **WIP:** eine andere eigene Story `In Arbeit` (`op: list`, `status: In Arbeit`, `assignee: "me"`) → anhalten und fragen. Nicht bei `hotfix`.
7. **Definition of Ready** (nicht bei `hotfix`): fehlende fachliche Punkte sind Fragen an `lukcy22`, eine fehlende Schätzung ergänzt du im Plan. Oberflächen-Stories brauchen einen Entwurf mit „Entwurf freigegeben“ oder „Kein Entwurf nötig“ von `lukcy22`.

## Phase 2: Plan (Haltepunkt 1)

Lies den betroffenen Code gezielt (`grep -n`, dann Ausschnitte; `app.js` und `app.css` nie ganz). Was der Code beantwortet, fragst du nicht. Zeig:

- **Kurz gesagt** (2–3 Sätze ohne Fachbegriffe) und **Ziel** in einem Satz,
- **Definition of Ready:** erfüllt oder fehlende Punkte,
- **Acceptance Criteria** einzeln mit dem Weg zur Erfüllung,
- **Schritte** (je höchstens ½ Tag, werden zu Tasks) und **betroffene Dateien**,
- **Tests:** welche Unit-Tests (Datei `*.test.ts`) und E2E-Tests (`frontend/tests/`) neu entstehen oder sich ändern, je mit dem Fall, den sie absichern,
- **Fachliche Fragen an `lukcy22`**: Gibt es welche, als Kommentar an die Story stellen (Format in `docs/workflow.md`) und anhalten.
- **Architektur-Fragen an `fynndow`** mit Alternativen und Empfehlung, im Dialog,
- **Technische Entscheidungen**, die du selbst triffst,
- **Risiken** (localStorage, Supabase, Service Worker),
- **Branch:** `<typ>/tg-<nr>-<kurztitel>`. Der Typ ist `fix` bei `bug`/`hotfix`, `chore` bei Infrastruktur oder Doku, sonst `feat`. Der Kurztitel ist englisch, kleingeschrieben, höchstens 5 Wörter.

**Halte an.** Ein Go gibt es erst, wenn alle fachlichen Fragen beantwortet sind (bzw. nach 2 Arbeitstagen „Entschieden“) und die Architektur-Fragen entschieden sind.

## Phase 3: Vorbereiten (nach Go)

1. Branch von `origin/main` anlegen bzw. den vorhandenen nehmen.
2. Story `assignee: "me"`, `status: In Arbeit`. Liegt sie nicht im laufenden Sprint (`current-sprint`), hineinziehen und kommentieren (Text in `docs/workflow.md`). Ohne laufenden Sprint fragen. Danach `sort-sprint`.
3. Fehlende Tasks als Batch anlegen (Status `Neu`, `assignee: "me"`), offene Tasks ohne Zuordnung übernehmen.

## Phase 4: Umsetzen

Tasks der Reihe nach: beim Beginn `In Arbeit`, nach Abschluss `Im Test`. Entwurf umsetzen, Abweichungen notieren. Stil der Umgebung, nichts außerhalb des Umfangs (Auffälliges notieren). Ein Task kommt nicht weiter → `Blockiert` mit Kommentar, anhalten.

**Tests gehören zur Umsetzung**, auch wenn die Acceptance Criteria sie nicht ausdrücklich nennen (Definition of Done):
- Neue oder geänderte Logik bekommt Unit-Tests als `*.test.ts` neben dem Code: Normalfall, Grenzwerte und Sonderfälle. Mit Datum immer mit festem Datum (`vi.setSystemTime`) und zeitzonenunabhängig (AGENTS.md Regel 5).
- Neues oder geändertes sichtbares Verhalten bekommt E2E-Tests in `frontend/tests/`, mit Testdaten wie in `frontend/tests/fixtures/`.
- Ein behobener Fehler bekommt einen Test, der ohne die Korrektur fehlschlägt.
- Ausnahme nur für reine Doku, CI oder Konfiguration ohne Verhalten. Dann im Haltepunkt 2 begründen.

## Phase 5: Checks und Freigabe (Haltepunkt 2)

Schnelle Checks mit kompakter Ausgabe. Bei Fehlern Ursache beheben, höchstens 3 Runden, Tests nie abschwächen (`.skip`, `.fixme`, angepasste Erwartungen). Danach zeigen: eine Zeile je Check, jede Acceptance Criteria ✅/❌, **neue und geänderte Tests** mit Datei und Testname (oder die begründete Ausnahme), `git diff --stat`, Commit-Nachricht. Fehlen Tests für neue Logik oder neues Verhalten, ist das kein Stand für ein Go. **Ohne Go kein Commit und kein Push.**

## Phase 6: Commit und Push (nach Go)

1. Commit `<typ>: <beschreibung> TG-<nr>`, ohne `#status` und ohne `Co-Authored-By:` für KI-Agenten.
2. `git push -u origin <branch>`. Nie auf `main`, nie force-pushen, **kein PR**.
3. Behobene `QA: …`/`Abnahme: …`-Tasks auf `Im Test`.
4. CI für den Head-Commit abwarten (`gh run list --commit <sha>`, höchstens 15 Minuten). Rot → Job und Ursache zeigen, anhalten, Story bleibt `In Arbeit`.
5. Grün → Story `Im Test`, Kommentar nach `templates/umgesetzt.md`. Nächster Schritt: `/qa-taiga-ticket <nr>` in einer frischen Sitzung.

## Abschlussbericht

Kurz gesagt, Branch mit Head-Commit und CI-Link, Status in Taiga (Story, Tasks, Zuordnung, Sprint und ggf. Punkte über Planung), Acceptance Criteria, Hinweise für die QA, Auffälligkeiten außerhalb des Umfangs als Story-Vorschläge (nicht anlegen).

## Grenzen

- Kein PR, kein Merge, nie `Im Review`, `Abnahme` oder `Fertig` setzen.
- Fachliche Fragen nie selbst entscheiden (→ `lukcy22`), Architektur-Fragen nie selbst entscheiden (→ `fynndow`), übrige technische Fragen selbst entscheiden und dokumentieren.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt, keine Secrets.
- Weicht etwas vom freigegebenen Plan ab, anhalten und fragen.
