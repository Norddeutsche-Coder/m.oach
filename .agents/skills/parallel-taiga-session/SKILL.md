---
name: parallel-taiga-session
description: Lässt beliebig viele Agent-Sitzungen gleichzeitig an M.oach arbeiten, ohne dass sie sich stören. In jeder Sitzung aufrufen, z. B. `/parallel-taiga-session alle` (arbeitet freie Stories nacheinander ab), `/parallel-taiga-session 27` (eine bestimmte Story, auch zum Fortsetzen) oder `/parallel-taiga-session epic 5`. Belegt einen eigenen Platz mit eigenem Git-Worktree und eigenen Ports, wählt eine Story, die keine andere Sitzung bearbeitet und keine Dateien einer anderen Sitzung berührt, führt Umsetzung, QA und Abschluss wie `lukas-plant-setzt-um-testet-und-laedt-hoch` aus und merged nacheinander über eine gemeinsame Merge-Sperre.
argument-hint: [alle] [<story-nummer> | epic <nr>] [mit Vorschau]
disable-model-invocation: true
effort: high
---

# Parallele Sitzung

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Koordination: `node <repo>/.agents/skills/parallel-taiga-session/scripts/session.mjs <befehl>`, im Folgenden **`session`**. Starte den Skill in einer frischen Sitzung, eine Sitzung pro Platz.

Mehrere Sitzungen auf demselben Rechner teilen sich ein Repository. Damit sie sich nicht in die Quere kommen, bekommt jede Sitzung einen **Platz** (1, 2, 3, … ohne Obergrenze) mit:

- eigenem Worktree `<repo>/.claude/worktrees/moach-s<N>` (eigener Branch, eigenes `node_modules`),
- eigenen Ports (`4200 + 10·N`: E2E, QA nachher, QA vorher, Vorschau), abgelegt in `<worktree>/.moach-session.json`. Playwright, QA und Vorschau lesen sie von dort,
- höchstens einer Story zur Zeit (Story-Sperre).

Der Stand aller Plätze liegt im gemeinsamen Git-Verzeichnis (`.git/moach-sessions/`), nicht im Repository. `session status` zeigt ihn. Über Rechner hinweg schützt nur Taiga (Zuordnung und `In Arbeit`). Stories anderer Personen fasst der Skill nicht an.

**Eingabe:**
- **`alle`** → nach jeder Story die nächste freie, bis keine mehr passt.
- **Story-Nummer** (`27` oder `#27`) → nur diese Story. Gehört sie einem verlassenen Platz, wird sie dort fortgesetzt (siehe Phase 0).
- **`epic <nr>`** → nur Stories dieses Epics.
- **`mit Vorschau`** → wird an die Kette durchgereicht.
- Ohne Angabe: eine freie Story, dann Ende.

**Fragen und Haltepunkte** wie in `lukas-plant-setzt-um-testet-und-laedt-hoch`: alles über das Fragetool (Claude Code: `AskUserQuestion`), ohne Fragetool nummerierte Optionen im Chat.

## Phase 0: Platz belegen

1. Im Repository (Haupt-Checkout oder Worktree eines Platzes): `session claim`, mit Story-Nummer `session claim --story <nr>`. Die Ausgabe nennt Platz `N`, Worktree, Ports und Hinweise. Das Skript legt den Worktree beim ersten Mal von `origin/main` an und installiert die Abhängigkeiten, später nur, wenn sich `package-lock.json` geändert hat.
2. Exit-Code **3**: Story oder Platz ist in einer aktiven Sitzung. Melden und aufhören. Exit-Code **4**: Der Platz meldet sich seit über 2 Stunden nicht mehr (abgebrochene Sitzung). Status zeigen und fragen, ob diese Sitzung übernimmt (Empfehlung, wenn die Person die alte Sitzung beendet hat). Nach Ja `session claim --story <nr> --takeover`.
3. **In den Worktree wechseln:**
   - **Claude Code:** `EnterWorktree` mit `path` = Worktree aus der Ausgabe. Läuft die Sitzung schon dort, entfällt das.
   - **Ohne Werkzeug zum Wechseln (z. B. Codex):** Ist das aktuelle Verzeichnis nicht der Worktree, nenne den Befehl `cd <worktree> && scripts/codex-skill.sh parallel-taiga-session <argumente>` und hör auf. Der Platz bleibt belegt, die neue Sitzung nimmt ihn.
4. Ab jetzt **alle Befehle im Worktree**. Den Haupt-Checkout und andere Worktrees nie ändern. `main` ist im Haupt-Checkout ausgecheckt, deshalb im Worktree nie `git switch main`, sondern `git switch --detach origin/main`.

## Phase 1: Story wählen

Ziel: eine Story, die keine andere Sitzung bearbeitet und mit deren Arbeit möglichst nicht kollidiert.

1. `session status` und `python3 -I scripts/moach_taiga.py current-sprint`.
2. **Mit Story-Nummer:** Ist sie schon gesperrt (Phase 0), weiter mit Phase 2. Sonst `session take-story <N> <nr> --epic <epic>` (Epic aus Taiga, ohne Epic weglassen).
3. **Ohne Story-Nummer**, Kandidaten aus Taiga (Taiga-MCP `work` `op: list`, `type: story`), erst laufender Sprint, dann Backlog:
   - Status `Bereit`, nicht jemand anderem zugeordnet, bei `epic <nr>` nur aus diesem Epic,
   - alle Stories aus `**Abhängig von:**` sind `Fertig`,
   - keine offene Fragerunde (`python3 -I scripts/moach_taiga.py pending-questions`),
   - nicht in `session status` gesperrt.

   Reihenfolge wie in `plan-taiga-sprint`: `hotfix` → `sicherheit`, `rls`, `datenverlust` → `bug` → Rest nach Reihenfolge im Sprint. Bevorzuge Epics, an denen gerade kein anderer Platz arbeitet. Stories eines Epics bauen oft aufeinander auf.
4. Den ersten Kandidaten mit `session take-story <N> <nr> --epic <epic>` sperren. Exit-Code 3 heißt, eine andere Sitzung war schneller: den nächsten nehmen.
5. **Kein Kandidat:** `session release <N>` (Platz frei, Worktree bleibt). Melde, woran es hängt: Stories auf `Neu` mit offener Fragerunde (`pending-questions`), unerfüllte Abhängigkeiten, Epics ohne Stories auf `Bereit` (Vorschlag: `/plan-taiga-epic` in **einer** Sitzung, nie parallel für dasselbe Epic). Ende.

## Phase 2: Umsetzen, prüfen, abschließen

Lies `.agents/skills/lukas-plant-setzt-um-testet-und-laedt-hoch/SKILL.md` und folge ihm ab dem Einstieg nach Status für die gesperrte Story (Stufe 1 entfällt). Was dort und in den verketteten Skills steht, gilt. Zusätzlich:

1. **Lebenszeichen:** Nach jedem Stufenwechsel und vor jedem langen Warten `session update <N> --phase "<stufe>"`, nach dem Anlegen des Branches `session update <N> --branch <branch>`. Ohne Lebenszeichen gilt der Platz nach 2 Stunden als verlassen.
2. **Kollisionen prüfen (nach dem Plan, vor Phase 3 von `implement-taiga-ticket`):** `session busy-files <N>` zeigt, welche Dateien die anderen Plätze ändern (Commits und uncommittete Änderungen). Ändert ein anderer Platz `frontend/src/legacy/app.js` oder `frontend/src/app.css` (`hot`) oder eine Datei, die der Plan ändert, und die Story kam **ohne** Story-Nummer: Story noch nicht übernehmen (nichts in Taiga geändert), `session release-story <N>`, zurück zu Phase 1 mit dem nächsten Kandidaten. Merke dir die übersprungene Story und nimm sie in dieser Sitzung erst wieder, wenn der andere Platz sie freigegeben hat. Gibt es keinen anderen Kandidaten, oder kam die Story mit Nummer: trotzdem umsetzen und das Risiko für Merge-Konflikte im Plan nennen.
3. **Ports:** E2E (`npm run test:e2e`) nimmt den Port aus `.moach-session.json` von selbst, ebenso die Vorschau. Die QA startet ihre Server auf `ports.qaAfter` und `ports.qaBefore`. Gib dem QA-Subagenten den Worktree-Pfad mit, damit er die Datei findet.
4. **Merge-Sperre (Stufe 5):** Direkt vor `finish-check` `session merge-lock <N>` (wartet bis zu 9 Minuten, im Hintergrund ausführen). Exit-Code 5 → erneut aufrufen, solange der andere Platz sichtbar vorankommt (`session status`). Die Sperre hältst du bis nach dem Smoke-Test, damit jeder Merge auf dem Stand des vorigen geprüft und live geprüft wird. Danach und bei **jedem** Anhalten in Stufe 5 sofort `session merge-unlock <N>`. Meldet `finish-check` ⚠️ **Basis**, erst die Sperre freigeben, dann `origin/main` mergen wie im Skill beschrieben.
5. **Aufräumen** (statt Schritt 5 in Phase 5 von `finish-taiga-ticket`): `git fetch origin`, `git switch --detach origin/main`, `git branch -d <branch>`, Remote-Branch löschen, falls noch da. Danach `session release-story <N>`.
6. **Anhalten:**
   - **Fragerunde als Kommentar an `lukcy22` oder `fynndow`**, bevor die Story übernommen ist: `session release-story <N>`. Bei `alle` weiter mit Phase 1. Die Story kommt erst nach der Antwort wieder in Frage.
   - **Alles andere** (rote CI, 2 QA-Runden, Go bei riskanten Stories, Merge-Konflikt, Revert, Frage im Dialog ohne Antwort): Merge-Sperre freigeben, falls gehalten, Story-Sperre behalten, `session update <N> --phase "wartet: <grund>"`, melden und die Sitzung beenden, auch bei `alle`. Die Story läuft später mit `/parallel-taiga-session <nr>` im selben Platz weiter.

## Phase 3: Nächste Story oder Ende

- **Mit `alle`**, nach erfolgreichem Abschluss: zurück zu Phase 1. Jede Story beginnt mit einem Branch vom dann aktuellen `origin/main`. Behalte aus der vorigen Story nur Nummer, PR und Ergebnis. Wird der Kontext groß, beende die Sitzung nach dem Abschluss einer Story und nenne den Befehl für die nächste.
- **Sonst:** `session release <N>`. In Claude Code danach `ExitWorktree` mit `action: "keep"`.

## Mehrere Sitzungen starten

Für die Person, im Abschlussbericht beim ersten Lauf erwähnen:

1. Einmal `/plan-taiga-sprint` bzw. `/plan-taiga-epic` in einer Sitzung, damit genug Stories auf `Bereit` stehen.
2. Beliebig viele Sitzungen öffnen, in jeder `/parallel-taiga-session alle`. Jede belegt den nächsten freien Platz.
3. Übersicht jederzeit: `node .agents/skills/parallel-taiga-session/scripts/session.mjs status`.
4. Worktree eines Platzes löschen, der nicht mehr gebraucht wird: `… session.mjs remove <N>` (nur ohne uncommittete Änderungen).

## Abschlussbericht

Kurz gesagt, Platz und Worktree, dann je Story eine Zeile: Nr., Titel, Branch bzw. PR, Ergebnis der QA, Status in Taiga. Danach übersprungene Stories mit Grund (gesperrt, Datei-Kollision, Abhängigkeit), wartende Stories mit Grund und `session status`.

## Grenzen

- Alle Grenzen von `lukas-plant-setzt-um-testet-und-laedt-hoch` und der verketteten Skills gelten weiter.
- Nie in einem fremden Worktree oder im Haupt-Checkout arbeiten, nie eine fremde Story-Sperre ohne Rückfrage übernehmen (`--takeover`), nie die Merge-Sperre eines anderen Platzes löschen (verwaiste Sperren hebt das Skript nach 60 Minuten selbst auf).
- Kein Merge ohne gehaltene Merge-Sperre.
- `.git/moach-sessions/` und `.moach-session.json` nie committen oder von Hand ändern.
