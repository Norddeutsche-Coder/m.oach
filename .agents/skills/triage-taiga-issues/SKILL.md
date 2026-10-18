---
name: triage-taiga-issues
description: Verarbeitet neue Ideen und Fehlermeldungen aus Taiga-Issues, die auch Nicht-Techniker anlegen können. Aufruf `/triage-taiga-issues` oder mit einer Issue-Nummer, z. B. `/triage-taiga-issues 12`. Klärt offene Punkte, macht nach Go der aufrufenden Person daraus Stories im Backlog (Fehler mit Tag bug, dringende mit hotfix) oder ergänzt bestehende, trägt die meldende Person als Beobachter ein und beantwortet das Issue.
argument-hint: [issue-nummer]
disable-model-invocation: true
model: sonnet
effort: medium
---

# Ideen und Fehler aus Taiga-Issues übernehmen

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Story-Format: `<repo>/.agents/skills/plan-taiga-epic/templates/story.md`.

Meldungen kommen nach der Vorlage im Wiki `ideen-und-fehler-melden`. Angelegt oder geändert wird **erst nach Go der aufrufenden Person**. Issue-Status: Neu, In Klärung, Rückfrage, Übernommen, Erledigt, Abgelehnt, Zurückgestellt.

## Phase 1: Meldungen laden

1. Mit Nummer nur dieses Issue (Taiga-MCP `work` `op: get`, `type: issue`), sonst offene Issues mit Status `Neu` oder `Rückfrage` (älteste zuerst), jeweils mit Kommentaren.
2. Epics laden. Stories nur gezielt mit Suchbegriffen (`op: list`, `q`), auch für Dubletten. Wiki `definition-of-ready`.
3. **Fehler:** Fundstelle (`datei:zeile`) gezielt suchen, betroffene Ansicht bestimmen. Kriterien aus dem Wiki `hotfix` erfüllt → `hotfix` vorschlagen. **Idee:** passendes Epic oder passende Story? **Frage:** direkt beantwortbar?

## Phase 2: Vorschlag (Haltepunkt)

Tabelle je Issue (Nr., Art, Titel, meldende Person, Vorschlag):
- **Neue Story:** Titel als Ergebnis, Epic, Tags (`bug` bzw. `hotfix`), Schätzung pro Rolle (höchstens 3 Punkte), Acceptance Criteria. Bei Fehlern gehören „Erwartet“ und „Tatsächlich“ in die Beschreibung.
- **Bestehende Story ergänzen**, **direkt beantworten** (→ `Erledigt`), **Rückfrage an die meldende Person** (→ `Rückfrage`), **Ablehnen** oder **Zurückstellen** mit Begründung in Alltagssprache.

Fachlich Unklares wird eine Fragerunde an `lukcy22` am Issue (Format in `docs/workflow.md`), das Issue geht auf `In Klärung` und wird erst nach der Antwort verarbeitet. Architektur-Fragen klärst du mit `fynndow`. **Halte an** bis zum Go.

## Phase 3: Umsetzen (nach Go)

1. Neue Stories anlegen (Status `Bereit`, wenn die Definition of Ready erfüllt ist, sonst `Neu`), unten `Gemeldet in Issue #<nr> von <Person>.`, mit dem Epic verknüpfen, `set-points <nr> UX=… Design=… Front=… Back=…`.
2. Bestehende Stories ergänzen: erweitern, nicht ersetzen, mit Verweis auf das Issue.
3. Steht im Issue eine Zeile `Discord: <link>`, übernimm sie unverändert in die Beschreibung der neuen oder ergänzten Story. `finish-taiga-ticket` meldet die Behebung darüber im Discord-Forum.
4. `add-watcher <story> <issue>` für jede neue oder ergänzte Story.
5. Issue beantworten (Alltagssprache, Link zur Story, Hinweis auf die automatische Benachrichtigung) und den Status setzen.

## Abschlussbericht

Issue → Ergebnis, neue Stories mit Punkten, Epic, Tags und Status (bei `Neu` mit dem fehlenden Punkt), `hotfix`-Stories mit dem Hinweis, sie sofort in den laufenden Sprint zu nehmen.

## Grenzen

Nichts löschen, Stories nur ergänzen. Keine Sprints, Tasks, kein Code. Keine Secrets. Enthält eine Meldung Secrets oder Gesundheitsdaten: nicht wiederholen, die aufrufende Person darauf hinweisen, AGENTS.md (Secrets) befolgen.
