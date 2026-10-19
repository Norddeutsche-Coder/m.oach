---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story bis zur QA-Bereitschaft um, ohne Pull Request. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Klärt zuerst offene Rückfragen im Sprint, prüft die Definition of Ready, ordnet die Story der aufrufenden Person und dem laufenden Sprint zu, plant, implementiert, macht schnelle Checks, committet und pusht ohne Freigabe und setzt die Story nach grüner CI auf Im Test.
argument-hint: <story-nummer>
disable-model-invocation: true
effort: high
---

# Taiga-Story umsetzen

> Gemeinsame Regeln (Werkzeuge, Rollen, Fragen, Status, Sprint, Hotfix, Token-Regeln): `docs/workflow.md`. Lies sie zu Beginn, falls nicht schon in dieser Sitzung geschehen. Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Starte den Skill in einer frischen Sitzung.

Argument: Nummer einer **User Story** (`27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

**Kein Haltepunkt:** Der Skill läuft ohne Go durch. Er hält nur an bei offenen fachlichen oder Architektur-Fragen und bei Fehlern, die er nicht beheben kann. **Kein Pull Request**, auch kein Entwurf. Nur schnelle Checks (`npm run check`, `npm run lint`, `npm test -- --reporter=dot` in `frontend/`). Build, E2E, Screenshots und der Beleg je Acceptance Criteria gehören zu `/qa-taiga-ticket`.

## Phase 0: Offene Rückfragen

`python3 -I scripts/moach_taiga.py pending-questions --exclude <nr>`. Gibt es offene Fragerunden an die aufrufende Person im laufenden Sprint, zeig sie und frag, ob sie jetzt beantwortet werden (Empfehlung). Antworten schreibst du als `Antworten von @<person> (im Dialog mit <Agent>): …` an die jeweilige Story. Erfüllt eine Story danach die Definition of Ready, setz sie auf `Bereit`.

## Phase 1: Story laden und Lage prüfen

1. Story, Tasks und Kommentare laden (Taiga-MCP `work` `op: get`, `type: story`; Tasks mit `op: list`; Taiga-MCP `comments`). Wiki `definition-of-ready` und `definition-of-done` lesen.
2. `git status` (fremde uncommittete Änderungen → anhalten und fragen), `git fetch origin`, Branch `…/tg-<nr>-…` suchen.
3. **Fortsetzen:** Story `In Arbeit` oder Branch vorhanden → dorthin wechseln, offene Tasks (`QA: …`, `Release: …`), Kommentare und `git diff --stat origin/main...HEAD` lesen, nur den Rest planen.
4. Story `Fertig`, `Im Review` oder `Im Test` ohne offene Tasks → anhalten, Stand und nächsten Schritt melden.
5. **Zuordnung:** Gehört die Story jemand anderem, nur nach ausdrücklichem Ja übernehmen.
6. **Definition of Ready** (nicht bei `hotfix`): fehlende fachliche Punkte sind Fragen an `lukcy22`, eine fehlende Schätzung ergänzt du im Plan. Oberflächen-Stories brauchen einen Entwurf mit „Entwurf freigegeben“ oder „Kein Entwurf nötig“ von `lukcy22`.

## Phase 2: Plan

Lies den betroffenen Code gezielt (`grep -n`, dann Ausschnitte; `app.js` und `app.css` nie ganz). Was der Code beantwortet, fragst du nicht. Zeig:

- **Kurz gesagt** (2–3 Sätze ohne Fachbegriffe) und **Ziel** in einem Satz,
- **Definition of Ready:** erfüllt oder fehlende Punkte,
- **Acceptance Criteria** einzeln mit dem Weg zur Erfüllung,
- **Schritte** (je höchstens ½ Tag, werden zu Tasks) und **betroffene Dateien**,
- **Tests:** welche Unit-Tests (Datei `*.test.ts`) und E2E-Tests (`frontend/tests/`) neu entstehen oder sich ändern, je mit dem Fall, den sie absichern,
- **Schnittstellen** für Test und Logik: Namen, Parameter und Rückgabetypen neuer Funktionen, Dateipfade, Texte und Selektoren, die die E2E-Tests ansprechen. Test- und Logik-Agent bauen beide darauf auf (Phase 4),
- **Fachliche Fragen an `lukcy22`**: Gibt es welche, als Kommentar an die Story stellen (Format in `docs/workflow.md`) und anhalten.
- **Architektur-Fragen an `fynndow`** mit Alternativen und Empfehlung, im Dialog,
- **Technische Entscheidungen**, die du selbst triffst,
- **Risiken** (localStorage, Supabase, Service Worker),
- **Branch:** `<typ>/tg-<nr>-<kurztitel>`. Der Typ ist `fix` bei `bug`/`hotfix`, `chore` bei Infrastruktur oder Doku, sonst `feat`. Der Kurztitel ist englisch, kleingeschrieben, höchstens 5 Wörter.

Zeig den Plan und mach **ohne Warten** weiter. Angehalten wird nur, solange fachliche Fragen offen sind (bzw. bis nach 2 Arbeitstagen „Entschieden“ kommt) oder Architektur-Fragen nicht entschieden sind.

## Phase 3: Vorbereiten

1. Branch von `origin/main` anlegen bzw. den vorhandenen nehmen.
2. Story `assignee: "me"`, `status: In Arbeit`. Liegt sie nicht im laufenden Sprint (`current-sprint`), hineinziehen und kommentieren (Text in `docs/workflow.md`). Ohne laufenden Sprint fragen. Danach `sort-sprint`.
3. Fehlende Tasks als Batch anlegen (Status `Neu`, `assignee: "me"`), offene Tasks ohne Zuordnung übernehmen.

## Phase 4: Umsetzen

**Erst der Test, dann die Logik, jeweils von einem eigenen Subagenten.** Du selbst koordinierst nur und schreibst weder Tests noch Logik. Gilt für die Story und für jede Nachbesserung (`QA: …`). Ausnahme nur für reine Doku, CI oder Konfiguration ohne Verhalten, mit Begründung im Bericht in Phase 5.

1. **Test-Agent** (Claude Code: `Agent`, Typ `general-purpose`, im Vordergrund). Er bekommt Story-Nummer, Acceptance Criteria, die Punkte „Tests“ und „Schnittstellen“ aus dem Plan und diese Regeln, aber **keinen Code der Umsetzung**. Er schreibt nur Tests und Testdaten (`*.test.ts`, `frontend/tests/**`) und ändert nichts anderes:
   - Logik: Unit-Tests neben dem Code für Normalfall, Grenzwerte und Sonderfälle. Mit Datum immer mit festem Datum (`vi.setSystemTime`) und zeitzonenunabhängig (AGENTS.md Regel 5).
   - Sichtbares Verhalten: E2E-Tests in `frontend/tests/`, mit Testdaten wie in `frontend/tests/fixtures/`.
   - Behobener Fehler: ein Test, der den Fehler zeigt.
   - **Rot belegen:** Die neuen Tests laufen und schlagen fehl, aus dem richtigen Grund: falsches Ergebnis, fehlendes Element oder noch nicht vorhandene Funktion. Nie wegen eines Fehlers im Test selbst. Befehle: `npx vitest run <dateien> --reporter=dot` bzw. `npx playwright test <spec> --reporter=dot` in `frontend/`.
   - Rückgabe: Liste der Tests (Datei, Name, abgesicherter Fall) und die rote Ausgabe, gekürzt.
2. **Prüfen:** Ändert der Test-Agent etwas außerhalb der Test-Dateien, oder ist ein Test grün, obwohl die Logik fehlt, schickst du ihn mit dem Befund zurück (`SendMessage`). Danach den Stand der Tests festhalten: `git hash-object <test-dateien>` nach `<tmp>/tg-<nr>-tests.sha`.
3. **Logik-Agent** (neuer Subagent, nie derselbe wie in Schritt 1). Er bekommt Story, Plan, Entwurf und die Liste der Test-Dateien. Er setzt die Tasks der Reihe nach um, bis alle Tests grün sind. Tasks: beim Beginn `In Arbeit`, nach Abschluss `Im Test`. Entwurf umsetzen, Abweichungen notieren. Stil der Umgebung, nichts außerhalb des Umfangs (Auffälliges notieren). **Test-Dateien darf er nicht ändern.** Hält er einen Test für falsch, hört er auf und gibt die Begründung zurück. Rückgabe: geänderte Dateien, grüne Ausgabe, Abweichungen vom Entwurf, Auffälligkeiten.
4. **Prüfen:** `git hash-object` der Test-Dateien mit `<tmp>/tg-<nr>-tests.sha` vergleichen. Abweichung → die Änderung an den Tests zurücknehmen und den Logik-Agenten erneut beauftragen. **Ein Test ist falsch:** Begründung zeigen und über das Fragetool fragen, ob der Test-Agent ihn korrigiert (danach Schritt 2 bis 4) oder die Logik angepasst wird.
5. Ein Task kommt nicht weiter → `Blockiert` mit Kommentar, anhalten.

**Ohne Subagenten** (z. B. Codex): dieselbe Reihenfolge selbst einhalten. Zuerst nur Tests schreiben und rot belegen, Stand festhalten, danach die Logik, ohne die Tests zu ändern.

## Phase 5: Checks

Schnelle Checks mit kompakter Ausgabe. Bei Fehlern Ursache beheben (Logik über den Logik-Agenten, Tests über den Test-Agenten), höchstens 3 Runden, Tests nie abschwächen (`.skip`, `.fixme`, angepasste Erwartungen). Danach zeigen: eine Zeile je Check, jede Acceptance Criteria ✅/❌, **neue und geänderte Tests** mit Datei und Testname, Beleg „erst rot, dann grün“ und Bestätigung, dass der Logik-Agent keine Test-Datei geändert hat (oder die begründete Ausnahme), `git diff --stat`, Commit-Nachricht. Danach ohne Warten weiter. Fehlen Tests für neue Logik oder neues Verhalten, oder ist ein Check rot, **kein Commit und kein Push**: Tests über den Test-Agenten ergänzen, sonst anhalten.

## Phase 6: Commit und Push

1. Commit `<typ>: <beschreibung> TG-<nr>`, ohne `#status` und ohne `Co-Authored-By:` für KI-Agenten.
2. `git push -u origin <branch>`. Nie auf `main`, nie force-pushen, **kein PR**.
3. Behobene `QA: …`-Tasks auf `Im Test`.
4. CI für den Head-Commit abwarten (`gh run list --commit <sha>`, höchstens 15 Minuten). Rot → Job und Ursache zeigen, anhalten, Story bleibt `In Arbeit`.
5. Grün → Story `Im Test`, Kommentar nach `templates/umgesetzt.md`. Nächster Schritt: `/qa-taiga-ticket <nr>` in einer frischen Sitzung.

## Abschlussbericht

Kurz gesagt, Branch mit Head-Commit und CI-Link, Status in Taiga (Story, Tasks, Zuordnung, Sprint und ggf. Punkte über Planung), Acceptance Criteria, Hinweise für die QA, Auffälligkeiten außerhalb des Umfangs als Story-Vorschläge (nicht anlegen).

## Grenzen

- Kein PR, kein Merge, nie `Im Review` oder `Fertig` setzen.
- Fachliche Fragen nie selbst entscheiden (→ `lukcy22`), Architektur-Fragen nie selbst entscheiden (→ `fynndow`), übrige technische Fragen selbst entscheiden und dokumentieren.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt, keine Secrets.
- Weicht die Umsetzung vom Plan ab, die Abweichung mit Begründung im Kommentar „Umgesetzt“ festhalten. Anhalten nur, wenn dadurch eine fachliche oder Architektur-Frage entsteht.
