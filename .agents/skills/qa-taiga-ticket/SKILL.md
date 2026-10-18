---
name: qa-taiga-ticket
description: Unabhängige Qualitätsprüfung einer Taiga-User-Story auf dem gepushten Branch, bevor es einen PR gibt. Aufruf mit optionaler Story-Nummer, z. B. `/qa-taiga-ticket 27`. Übernimmt das CI-Ergebnis, prüft jede Acceptance Criteria mit Beleg, macht bei sichtbaren Änderungen Vorher/Nachher-Screenshots nach Risiko, reviewt den Diff, berichtet in Taiga und setzt die Story bei Befunden zurück auf In Arbeit. Behebt selbst nichts.
argument-hint: [story-nummer]
disable-model-invocation: true
context: fork
agent: general-purpose
background: false
effort: high
---

# QA einer Taiga-Story

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Du läufst ohne Vorgeschichte und prüfst unabhängig: **Du behebst nichts** und änderst weder Code, Tests noch Konfiguration.

## 0. Prüfstand

1. Story-Nummer aus dem Argument, sonst aus dem Branch-Namen `…/tg-<nr>-…`. Gibt es keine, prüf nur den Diff gegen `main` ohne Taiga-Schritte und sag das.
2. Story, Tasks und den letzten Kommentar „Umgesetzt“ laden, Wiki `definition-of-done` lesen. Status sollte `Im Test` sein (sonst sagen, trotzdem prüfen).
3. `git fetch origin`. Geprüft wird `origin/<branch>`. Head-Commit merken (Kurz-SHA). Diff: `git diff --stat origin/main...origin/<branch>`, danach gezielt Datei für Datei.
4. Gibt es schon einen PR für den Branch, ist das ein **Befund** (kein PR vor bestandener QA).

## 1. CI übernehmen

Die CI prüft auf jedem Push Typprüfung, Lint, Unit-Tests, Build und E2E. Hol das Ergebnis für den Head-Commit (`gh run list --commit <sha> --json workflowName,status,conclusion,url`), höchstens 15 Minuten warten. Grün → nicht lokal wiederholen. Rot oder fehlend → **Befund**. Die Ursache suchst du über das Log (`gh run view <id> --log-failed | tail -n 60`). Lokal nur nachstellen, wenn das Log nicht reicht.

## 2. Acceptance Criteria und Definition of Done

Jede Acceptance Criteria einzeln, unabhängig vom Haken in Taiga: **erfüllt** mit Beleg (Test mit Datei und Name, `datei:zeile` oder Screenshot) oder **Befund**. Ebenso die Punkte der Definition of Done, soweit sie vor dem Merge prüfbar sind (Rest: „nach dem Merge“). Mit freigegebenem Entwurf: Nachher-Screenshots damit vergleichen. Eine Abweichung, die im Kommentar „Umgesetzt“ nicht begründet ist, ist ein Befund.

## 3. Screenshots (bei sichtbaren Änderungen)

**Wann:** Der Diff betrifft die Oberfläche (`.tsx`, `.css`, `index.html`, `src/legacy/app.js`, `public/`) oder Logik, die in der App sichtbar wird. Bei Logik baust du Testdaten, die genau den Fall auslösen. Reine Tests, Doku oder CI brauchen keine.

**Matrix nach Risiko** je Szenario:

- Standard: Handy hell und Desktop dunkel,
- alle vier Kombinationen (Handy/Desktop × hell/dunkel) bei den Tags `sicherheit`, `rls`, `datenverlust` oder wenn `app.css`, Farben oder das Layout geändert sind,
- `hotfix`: nur das betroffene Szenario auf Handy hell.

**Vorgehen:**

1. Unter `<tmp>/qa-tg-<nr>/` die Worktrees `branch-src` (von `origin/<branch>`) und `basis-src` (von `origin/main`) anlegen. In `frontend/` jeweils `npm ci --silent` (oder `node_modules` verlinken, wenn `package-lock.json` gleich ist), mit den Testwerten aus AGENTS.md bauen und mit `npx vite preview --host 127.0.0.1 --strictPort` auf Port 4181 (nachher) bzw. 4182 (vorher) starten.
2. `szenarien.json` schreiben (localStorage-Testdaten wie in `frontend/tests/today.spec.ts` und `frontend/tests/fixtures/`, festes Datum, sprechende Namen wie `heute-readiness-8-handy-dunkel`).
3. Je Stand `node <repo>/.agents/skills/qa-taiga-ticket/scripts/shots.cjs <tmp>/qa-tg-<nr>/branch-src/frontend/node_modules/@playwright/test http://127.0.0.1:<port>/ <tmp>/qa-tg-<nr>/<nachher|vorher> <tmp>/qa-tg-<nr>/szenarien.json`.
4. `python3 -I scripts/moach_taiga.py compare-shots <tmp>/qa-tg-<nr>/vorher <tmp>/qa-tg-<nr>/nachher`. **Ansehen musst du nur geänderte und neue Bilder**, dazu je ein Vorher-Bild zum Vergleich. Unverändert, obwohl die Story etwas Sichtbares ändern soll, ist ein Befund.
5. Prüfen: Ist die beabsichtigte Änderung sichtbar und richtig? Gibt es Regressionen (Überlappung, abgeschnittener Text, Umbrüche zwischen Wert und Einheit, leere Bereiche, falsche Farben, Dunkelmodus, Inhalt hinter der Navigation) oder Konsolenfehler? Fehler sind Befunde, Geschmack ist ein Hinweis.
6. Preview-Server beenden, Worktrees entfernen.

## 4. Code-Review

Logik und Sonderfälle, Datum und Zeitzone (AGENTS.md Regel 5), XSS (`innerHTML` ohne `esc()`), Secrets, RLS, localStorage-Schlüssel ohne Migration, Service Worker, Änderungen außerhalb des Umfangs, abgeschwächte oder gelöschte Tests. **Befund** = Fehler, Sicherheitsproblem, Verstoß gegen Acceptance Criteria oder Definition of Done. **Hinweis** = optionale Verbesserung.

**Jeder Befund** hat überall dieselben fünf Angaben: Geprüft, Erwartet, Tatsächlich (höchstens 10 Zeilen Auszug), Ursache (`datei:zeile`, 1–3 Sätze, sonst „Ursache unklar“ mit Ausgeschlossenem), Vorschlag (ohne Tests abzuschwächen).

## 5. Ergebnis in Taiga

- **Befunde:** Story `In Arbeit`, pro Befund ein Task `QA: <kurz>` (Status `Neu`, fünf Angaben, gleiche Zuordnung wie die Story). Ist die Story unzugeordnet, keinen Account raten und das im Bericht nennen. Gleichnamigen offenen QA-Task ergänzen statt doppelt anlegen und seine Zuordnung an die Story angleichen.
- **Bestanden:** Story bleibt `Im Test`. Alle Tasks in `Im Test` auf `Erledigt`. Festlegen, ob nach der Veröffentlichung eine Abnahme nötig ist (sichtbare Änderung, siehe `docs/workflow.md`).
- **Immer:** alle Screenshots als **eine ZIP** (`python3 -m zipfile -c <tmp>/qa-tg-<nr>/screenshots-tg-<nr>-<sha>.zip <tmp>/qa-tg-<nr>/vorher <tmp>/qa-tg-<nr>/nachher`) mit Taiga-MCP `attachments` hochladen. Kommentar nach `templates/qa-kommentar.md`: bei „bestanden“ ohne „Befunde“, bei „nicht bestanden“ ohne „Abnahme“.

## 6. Bericht

Inhalt wie der Kommentar, dazu 2–4 aussagekräftige Bilder und der nächste Schritt: bei Befunden `/implement-taiga-ticket <nr>`, bei Bestehen `/finish-taiga-ticket <nr>`.

## Grenzen

Nichts beheben, committen, pushen oder mergen, keinen PR. In Taiga nur QA-Tasks, Kommentare, Anhänge, Story `In Arbeit` bei Befunden, Tasks `Erledigt` bei Bestehen. Nie `Im Review`, `Abnahme` oder `Fertig`, nie abnehmen. Keine echten Zugangsdaten, keine Live-Systeme. Was nicht ausführbar ist, ist ein Befund. Weiterprüfen, was geht.
