# Arbeitsablauf mit Taiga und Agent-Skills

Gemeinsame Regeln für alle Skills unter `.agents/skills/` und alle Agenten (Claude Code, Codex u. a.). Die Skills verweisen hierher, statt die Regeln zu wiederholen. Projekt: `fynndow-moach` auf tree.taiga.io, Repository `Norddeutsche-Coder/m.oach`, Basis-Branch `main`, App-Ordner `frontend/`.

## 1. Werkzeuge und Konventionen

- **Taiga-MCP `work`** meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`, Codex: Server `taiga`). Ebenso `comments`, `wiki`, `sprints`, `attachments`.
- **GitHub:** bevorzugt das GitHub-MCP, sonst `gh`. Tokens nie ausgeben.
- **Helfer-Skript:** `python3 -I scripts/moach_taiga.py <befehl>` für alles, was das MCP nicht kann oder was immer gleich abläuft. Es liest Zugangsdaten aus `TAIGA_USERNAME` und `TAIGA_PASSWORD` und gibt sie nie aus. Befehle: `me`, `current-sprint`, `pending-questions`, `sort-sprint`, `set-points`, `reduce-points`, `close-sprint`, `epic-color`, `tag-color`, `set-pr-link`, `add-watcher`, `finish-check`, `sprint-stats`, `compare-shots`, `discord-news`, `discord-bug-fixed`, `discord-news-check`, `discord-bugs-import` (`--help` zeigt die Argumente). Eigenen API-Code nur schreiben, wenn kein Befehl passt. Für Discord liest es lokal `DISCORD_NEWS_WEBHOOK` (Webhook des Kanals #neuigkeiten) und `DISCORD_BOT_TOKEN`; fehlt eine Variable, meldet der Befehl „übersprungen“. Der Workflow `Discord bugs to Taiga` holt alle 15 Minuten neue Beiträge aus dem Forum #bugs als Issues nach Taiga und braucht dafür die GitHub-Secrets `DISCORD_BOT_TOKEN`, `TAIGA_USERNAME` und `TAIGA_PASSWORD` (Taiga-Bot-Konto).
- **`<tmp>`:** temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`).
- **`<repo>`:** Wurzelverzeichnis des Repositorys.
- **Rückfragen mit Auswahl:** über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`, immer Einzelauswahl), höchstens 4 Fragen pro Runde, 2–4 Optionen, die empfohlene zuerst mit „(Recommended)“. Ohne solches Werkzeug als nummerierte Optionen im Chat, dann auf die Antwort warten.
- **Aufruf der Skills:** Claude Code `/<name>`, Codex `$<name>`. Ein Agent ohne Skill-Unterstützung liest `.agents/skills/<name>/SKILL.md` und folgt ihr.

## 2. Mit Tokens gut haushalten

- **Eine frische Sitzung pro Skill** (`/clear` vor jedem Aufruf). Die Skills laden alles Nötige aus Taiga und Git neu. Die QA läuft in Claude Code als Subagent ohne Vorgeschichte (`context: fork`).
- **Gezielt lesen:** Dateien über etwa 300 Zeilen nie ganz lesen, sondern zuerst mit `grep -n` die Stelle finden und dann nur den Ausschnitt. Das gilt besonders für `frontend/src/legacy/app.js` (~93.000 Tokens) und `frontend/src/app.css` (~18.000 Tokens).
- **Kompakte Ausgaben:** Prüfbefehle so ausführen, dass bei Erfolg nur das Ergebnis erscheint, z. B. `npm test -- --reporter=dot`, `npx playwright test --reporter=dot`, `npm ci --silent`, sonst `… 2>&1 | tail -n 30`. Bei Fehlern die relevante Ausgabe vollständig ansehen.
- **Ergebnisse übernehmen statt wiederholen:** Was die CI für denselben Commit geprüft hat, nicht lokal noch einmal ausführen.

## 3. Rollen und Fragen

- **Kein Product Owner, der entscheidet.** Die Skills laufen ohne Freigaben (Go) durch. Sie halten nur an bei offenen fachlichen oder Architektur-Fragen, bei Fehlern, vor PR und Merge einer **riskanten Story** und vor einem Revert. Diese beiden Freigaben gibt die Person, die den Skill aufruft. Sie ist auch das Taiga-Konto der Sitzung (`scripts/moach_taiga.py me`).
- **Riskant** ist eine Story mit einem der Tags `sicherheit`, `rls`, `datenverlust` oder `hotfix`, oder wenn der Diff (`git diff --name-only origin/main...origin/<branch>`) Dateien unter `backend/`, `frontend/src/sw/`, `.github/` oder `scripts/build-service-worker.mjs` ändert.
- **Fachliche Fragen** (Verhalten für Läufer, Texte, Umfang, Entwurf) beantwortet `lukcy22`. Stell sie als Kommentar an die Story bzw. das Issue:
  ```
  ## Fachliche Fragen an @lukcy22
  1. <Frage in Alltagssprache>
     A) <Empfehlung> (Empfehlung) · B) … · C) …
  **So antwortest du:** z. B. „1: A, 2: B“
  ```
  Danach halte an. Antwortet er nach **2 Arbeitstagen** nicht, darf die aufrufende Person mit einem Kommentar „Entschieden …“ selbst entscheiden.
- **Technische Fragen** gehen nur an `fynndow`, wenn sie die **Architektur** beeinflussen: neue Abhängigkeiten, Datenmodell, localStorage-Schlüssel und -Format, Supabase (Schema, RLS, Edge Functions), Sync, Offline und Service Worker, Sicherheit, neue Module oder Schnittstellen zwischen Features, Aufteilung Legacy/React. Im Dialog über das Auswahl-Werkzeug, sonst als Kommentar `## Technische Fragen an @fynndow`. **Alle übrigen technischen Entscheidungen trifft der Agent selbst** und dokumentiert sie an der Story.
- **Erledigt** ist eine Fragerunde, sobald danach die gefragte Person kommentiert hat oder jemand einen Kommentar mit „Antworten“ oder „Entschieden“ schreibt. Antworten aus dem Dialog schreibt der Agent als `Antworten von @<person> (im Dialog mit <Agent>): 1: …`.

## 4. Status

- **Story:** Neu → Bereit → In Arbeit → Im Test → Im Review → Fertig (oder Archiviert).
  - **Bereit:** Definition of Ready (Wiki `definition-of-ready`) erfüllt. Die Skills setzen den Status **automatisch** mit Kommentar `Definition of Ready erfüllt, auf Bereit gesetzt.`. Fehlt ein Punkt, bleibt die Story `Neu`, der fehlende Punkt steht als Kommentar an der Story.
  - **Im Test:** umgesetzt, gepusht, CI grün, wartet auf QA.
  - **Im Review:** QA bestanden, PR offen.
  - **Abnahme:** wird nicht mehr vergeben. Stories, die noch darauf stehen, setzt `/finish-taiga-ticket` direkt auf `Fertig`.
- **Task:** Neu → In Arbeit → Im Test (erledigt, wartet auf QA) → Erledigt (nach bestandener QA), oder Blockiert.

## 5. Ablauf einer Story

1. `/implement-taiga-ticket <nr>`: Plan, Umsetzung, schnelle Checks, Commit, Push, CI grün → **Im Test**. **Kein PR.** Umgesetzt wird testgetrieben: Ein Subagent schreibt zuerst die Tests und belegt, dass sie fehlschlagen, ein zweiter schreibt danach die Logik, ohne die Tests zu ändern.
2. `/qa-taiga-ticket <nr>`: prüft den gepushten Branch. Befunde → `In Arbeit` mit Tasks `QA: …`. Bestanden → Tasks `Erledigt`, Story bleibt `Im Test`.
3. `/finish-taiga-ticket <nr>`: prüft die Bedingungen, erstellt den PR (**Im Review**), merged, prüft live, Neuigkeit im Wiki, dann **Fertig**. Nur bei riskanten Stories erst nach Go.

Eine Abnahme durch eine andere Person gibt es nicht mehr. Die QA und die Live-Prüfung nach dem Merge ersetzen sie.

**Alles in einem Ablauf:** `/lukas-plant-setzt-um-testet-und-laedt-hoch <idee | nr>` führt `plan-taiga-epic` und 1–3 nacheinander in einer Sitzung aus. Er läuft ohne Go durch, auch PR und Squash-Merge, sobald die QA bestanden ist und alle Pipelines grün sind. Nur bei riskanten Stories hält er vor PR und Merge an. Auf Wunsch (`mit Vorschau` im Aufruf) öffnet er vor Commit und Push die alte und die geänderte Seite lokal mit Testdaten nebeneinander im Browser.

## 6. Sprint, Zuordnung und parallele Arbeit

- **Zuordnung:** `/implement-taiga-ticket` ordnet Story und Tasks der aufrufenden Person zu. Eine Story, die jemand anderem gehört, nur nach Rückfrage übernehmen.
- **Kein WIP-Limit:** Beliebig viele Stories dürfen gleichzeitig `In Arbeit` sein, auch in parallelen Sitzungen. Jede Story hat ihren eigenen Branch. Stories, die dieselben großen Dateien ändern (`src/legacy/app.js`, `src/app.css`), laufen besser nacheinander, sonst drohen Merge-Konflikte.
- **Laufender Sprint:** der offene Sprint, dessen Zeitraum heute enthält (`current-sprint`). Eine bearbeitete Story außerhalb davon wird hineingezogen, mit Kommentar `In Sprint <Name> aufgenommen (vorher: <alt> | Backlog), <Punkte> Punkte zusätzlich zur Planung.`
- **Sortierung:** nach jedem Statuswechsel `sort-sprint`. In Bearbeitung oben, offen darunter, fertig unten.
- **Offene Rückfragen zuerst:** `/implement-taiga-ticket` beginnt mit `pending-questions` für den laufenden Sprint.

## 7. Hotfix

Tag `hotfix` für dringende Fehler in der Live-App (Datenverlust, Sicherheit, App unbenutzbar, schädlicher Rat). Kriterien und Ablauf im Wiki `hotfix`. Es entfallen Definition of Ready, Entwurf und die volle Screenshot-Matrix. Nie entfallen: Tests, QA, PR, grüne CI, Live-Prüfung.

## 8. Texte für Menschen

Kommentare in Taiga, PR-Beschreibungen und Berichte beginnen mit **„Kurz gesagt“**: 2–3 Sätze ohne Fachbegriffe. Screenshots bleiben im lokalen `<tmp>` und werden **nicht** an Taiga hochgeladen, weder einzeln noch als ZIP. Kommentare beschreiben, was auf ihnen zu sehen ist.

## 9. Skills pflegen

Skills nur unter `.agents/skills/` ändern, danach `node scripts/sync-skills.mjs`. Die CI prüft, dass `.claude/skills/` aktuell ist. Vorlagen für Kommentare liegen in `templates/` des jeweiligen Skills: `templates/x.md` in einem Skill meint `<repo>/.agents/skills/<skill>/templates/x.md`. Code liegt in `scripts/moach_taiga.py`.

**Modelle:** Das Frontmatter der Skills legt `model`, `effort` und `context` für Claude Code fest. Codex ignoriert diese Felder und nutzt für alle Skills das Modell der Sitzung (siehe Abschnitt 10).

## 10. Modelle in Claude Code und Codex

| Skill                    | Claude Code (Frontmatter)                                  | Codex-Profil                             |
| ------------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `plan-taiga-epic`        | Sitzungsmodell, `effort: high`                             | `moach-deep`: `gpt-6-astra`, `high`      |
| `triage-taiga-issues`    | `model: sonnet`, `effort: medium`                          | `moach-routine`: `gpt-6.1-sol`, `medium` |
| `plan-taiga-sprint`      | `model: sonnet`, `effort: medium`                          | `moach-routine`: `gpt-6.1-sol`, `medium` |
| `implement-taiga-ticket` | Sitzungsmodell, `effort: high`                             | `moach-deep`: `gpt-6-astra`, `high`      |
| `qa-taiga-ticket`        | Subagent (`context: fork`), Sitzungsmodell, `effort: high` | `moach-deep`: `gpt-6-astra`, `high`      |
| `finish-taiga-ticket`    | `model: sonnet`, `effort: medium`                          | `moach-routine`: `gpt-6.1-sol`, `medium` |
| `lukas-plant-setzt-um-testet-und-laedt-hoch` | Sitzungsmodell, `effort: high`, QA als Subagent, Abschluss als Subagent mit `sonnet` | `moach-deep`: `gpt-6-astra`, `high`      |

- **Claude Code:** `model` und `effort` gelten für den Zug, in dem der Skill aufgerufen wird. Nach der nächsten Eingabe, etwa der Antwort auf eine Rückfrage, gilt wieder das Sitzungsmodell.
- **Codex:** Skills können kein Modell und keinen Reasoning-Aufwand festlegen. Weder `SKILL.md` noch `agents/openai.yaml` haben dafür ein Feld. Deshalb liegen die persönlichen Profile `moach-deep.config.toml`, `moach-routine.config.toml` und `moach-quick.config.toml` unter `~/.codex/` (Windows: `%USERPROFILE%\.codex\`). Sie enthalten jeweils nur `model` und `model_reasoning_effort`. `moach-quick` nutzt `gpt-6-luna` mit `low` für kurze Fragen ohne Skill. Profile gehören nicht ins Repository; die Projektdatei `.codex/config.toml` ignoriert `profile`/`profiles` und liefert weiterhin die MCP-Konfiguration.

  Skills immer über das Startskript in einer frischen Sitzung aufrufen:

  ```sh
  scripts/codex-skill.sh implement-taiga-ticket 27
  ```

  Das Skript wählt `moach-deep` oder `moach-routine` gemäß der Tabelle und startet `codex --profile <profil> "$<skill> <argumente>"`. Mit `scripts/codex-skill.sh --dry-run plan-taiga-sprint` lässt sich der Befehl anzeigen, ohne Codex zu starten. Für eine kurze Frage ohne Skill Codex direkt mit `codex --profile moach-quick` starten.
