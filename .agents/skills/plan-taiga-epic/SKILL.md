---
name: plan-taiga-epic
description: Plant ein neues Taiga-Epic mit User Stories aus einer Freitext-Idee, z. B. `/plan-taiga-epic Onboarding für neue Läufer`. Untersucht den Code, klärt offene Punkte mit gezielten Rückfragen, prüft auf Dubletten, schneidet Stories (max. 3 Punkte) mit Acceptance Criteria und Schätzung pro Rolle und legt alles ohne Freigabe im Backlog an. Kann auch neue Stories zu einem bestehenden Epic hinzufügen.
argument-hint: <idee oder epic-thema>
disable-model-invocation: true
effort: high
---

# Taiga-Epic planen

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`.

Eingabe: eine Idee in Freitext. Fehlt sie, frag danach. Du legst **nur Epics und User Stories** im Backlog an, ohne Sprint, keine Tasks, keine Issues. Angelegt wird **ohne Go**, direkt nach dem Entwurf. Gemeldete Ideen und Fehler verarbeitet `/triage-taiga-issues`.

## Phase 1: Verstehen

1. Epics laden (Taiga-MCP `work` `op: list`, `type: epic`) und die Wiki-Seiten `home` und `definition-of-done`. Stories nicht komplett laden, sondern **gezielt mit Suchbegriffen** (`op: list`, `type: story`, `q: <begriff>`), auch für Dubletten.
2. Den betroffenen Code gezielt untersuchen (`grep -n`, Ausschnitte). Was der Code beantwortet, fragst du nicht.

## Phase 2: Rückfragen

Kläre Ziel und Nutzen für Läufer, Umfang (was ist bewusst nicht drin), Sonderfälle, Abhängigkeiten, Datenschutz und Sicherheit und die Messbarkeit der Acceptance Criteria. 1–3 Runden über das Auswahl-Werkzeug, nichts doppelt fragen, eigenen Text genau lesen. Was die aufrufende Person fachlich nicht entscheiden kann, wird nach dem Anlegen eine Fragerunde an `lukcy22` an der Story. Architektur-Fragen entscheidet `fynndow`.

## Phase 3: Entwurf

- **Epic:** Titel, Beschreibung (Ziel in einem Satz, Hintergrund, Grundsätze, was nicht dazugehört), Farbe als Hex-Wert, die sich von den bestehenden Epics unterscheidet. Oder: „Stories für bestehendes Epic #<nr>“.
- **Dubletten:** je Überschneidung ein Vorschlag (anhängen, ergänzen, neu) mit Begründung, sonst ausdrücklich „keine“.
- **Stories:** Übersichtstabelle (Nr., Titel, Punkte gesamt und pro Rolle, Tags, Abhängigkeiten), dann jede Story nach `templates/story.md`.
  - Höchstens 3 Punkte. Größeres fachlich sinnvoll teilen.
  - Rollen UX, Design, Front, Back mit den Werten 0, ½, 1, 2, 3.
  - Acceptance Criteria einzeln prüfbar, ohne vage Wörter, mit Sonderfällen.
  - Bestehende Tags bevorzugen. Für neue einen Farbvorschlag machen.
  - Oberflächen-Stories bekommen „Entwurf: nötig“ und mindestens ½ Punkt Design.
  - Titel als Ergebnis formulieren.
- **Summe** gesamt und pro Rolle, grob in Sprints à 14 Arbeitstage.

Zeig den Entwurf und leg ihn **ohne Warten** an. Bei Dubletten nimm deinen empfohlenen Vorschlag.

## Phase 4: Anlegen

1. Epic anlegen (`op: create`, `type: epic`) und Farbe setzen mit `epic-color <nr> <hex>`.
2. Stories als Batch anlegen (`op: create`, `type: story`, `items`, höchstens 20, `status: "Neu"`, `tags`), mit dem Epic verknüpfen (`op: link`).
3. Punkte je Story: `set-points <nr> UX=… Design=… Front=… Back=…` (das Skript prüft die Summe). Neue Tags färben mit `tag-color <tag> <hex>`.
4. Ergänzungen bestehender Stories: Beschreibung erweitern, nicht ersetzen.
5. Definition of Ready erfüllt → `Bereit` mit Kommentar. Sonst bleibt die Story `Neu`, mit einem Kommentar zum fehlenden Punkt bzw. der Fragerunde an `lukcy22`.

## Abschlussbericht

Epic mit Link (`https://tree.taiga.io/project/<slug>/epic/<nr>`), Tabelle der Stories (Nr., Titel, Punkte, Status), Summe und Sprint-Anzahl, ergänzte Stories, offene Fragerunden, Hinweis auf `/implement-taiga-ticket <nr>`.

## Grenzen

Nichts löschen. Bestehende Stories nur ergänzen, nie ersetzen. Keine Sprints, Tasks, Issues, kein Code, keine Secrets.
