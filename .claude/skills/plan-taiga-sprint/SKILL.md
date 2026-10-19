---
name: plan-taiga-sprint
description: Schließt den laufenden Taiga-Sprint ab (Bilanz, unfertige Stories, Retro und Sprint-Bericht in Alltagssprache im Wiki) und plant den nächsten nach Kapazität, Velocity und festen Prioritätsregeln. Aufruf `/plan-taiga-sprint`. Legt ohne Go an, nur die Retro fragt per Auswahl.
argument-hint: (keine)
disable-model-invocation: true
model: sonnet
effort: medium
---

# Taiga-Sprint abschließen und planen

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Sprintlänge 14 Tage, Standard-Kapazität 14 Arbeitstage (1 Punkt = 1 Arbeitstag).

Kurze Zusammenfassungen im Chat. Der Skill ändert Taiga **ohne Go**. Über das Auswahl-Werkzeug laufen nur die Fragen der Retro.

## Phase 1: Lage

1. `python3 -I scripts/moach_taiga.py sprint-stats` liefert die Velocity der letzten 3 Sprints, den Stand des laufenden Sprints je Status und die nachträglich aufgenommenen Stories.
2. Kandidaten für den nächsten Sprint gezielt laden (Taiga-MCP `work` `op: list`, `type: story`, gefiltert nach Status `Bereit` bzw. `Neu`, ohne Sprint). Abhängigkeiten aus der Zeile `**Abhängig von:**` nur für Kandidaten lesen.
3. Endet der laufende Sprint in höchstens 2 Tagen oder ist vorbei → Phase 2, dann 3. Sonst Hinweis auf das Enddatum und fragen, ob trotzdem geplant werden soll. Kein Sprint → Phase 3.

## Phase 2: Abschluss

1. **Bilanz:** geplant, erledigt (`Fertig`), Stories je Status, nachträglich aufgenommene Stories gesondert. Sie zählen zu erledigt, nicht zu geplant.
2. **Unfertige Stories** wandern mit. Bei `Im Test` oder `Im Review` sinken die Punkte auf 25 %, berechnet mit dem Skript (`reduce-points`). Alle anderen behalten ihre Punkte. Zeig eine Liste mit Punkten alt → neu.
3. **Retro:** Erfüllungsquote, Velocity, Stories, die deutlich länger dauerten (Anzahl der QA- und Release-Tasks). Dann nacheinander drei Fragen mit je 2–3 Vorschlägen aus den Daten: Was lief gut? Was lief schlecht? Was ändert sich?
4. **Sprint-Bericht** in Alltagssprache entwerfen: was fertig ist und was Läufer davon haben, was sich verschoben hat und warum, was kommt. Höchstens 10 Zeilen, ohne Fachbegriffe.
5. Zeig, was passieren wird, und führ es ohne Warten aus:
   - je betroffener Story erst der Kommentar `Punkte für Sprint <neu> von <alt> auf <neu> gesenkt (Umsetzung fertig, nur noch QA bzw. Abschluss offen).`, dann `reduce-points <nrn>`,
   - `close-sprint "<Name>"`,
   - Retro oben in die Wiki-Seite `retrospektiven` nach `templates/retro.md`, Sprint-Bericht oben in `sprint-berichte` (Überschrift `## Sprint <n> · <start>–<ende>`),
   - Vorschlag für eine Vorführung von 15 Minuten (2–3 Stories, Live-App oder Screenshots).

## Phase 3: Planung

1. **Kapazität:** 14 Arbeitstage, außer die aufrufende Person nennt im Aufruf einen anderen Wert.
2. **Planungsziel** = Velocity (Ø der letzten bis zu 3 Sprints), höchstens die Kapazität. Ohne abgeschlossenen Sprint 90 % der Kapazität, abgerundet auf ½.
3. **Reihenfolge**, bis das Ziel erreicht ist: `hotfix` → übernommene Stories → `sicherheit`, `rls`, `datenverlust` → `bug` → übrige mit erfüllten oder vorher eingeplanten Abhängigkeiten, nach Epic und Story-Nummer. Regeln:
   - Nur `Bereit` (außer übernommene und `hotfix`). Stories auf `Neu` prüfst du gegen die Definition of Ready: Ist sie erfüllt, auf `Bereit` setzen (mit Kommentar) und aufnehmen. Sonst unter „vor dem Einplanen klären“ mit dem fehlenden Punkt.
   - Ungeschätzte Stories nicht vorschlagen, sondern als „schätzen“ listen.
   - Das Ziel wird nicht überschritten. Passt die nächste Story nicht, kleinere weiter unten prüfen.
4. **Vorschlag** als kurze Tabelle (Nr., Titel, Punkte, Grund), Summe gegen Ziel, 3–5 knappe Kandidaten. Danach ohne Warten anlegen.

## Phase 4: Anlegen

Sprint `Sprint <n+1>` anlegen (Start am Tag nach dem letzten Sprint, Ende Start + 13 Tage), Stories zuordnen, Punktsumme prüfen, `sort-sprint`.

## Abschlussbericht

Bilanz und übernommene Stories (alt → neu), Links zu Retro und Sprint-Bericht, neuer Sprint mit Zeitraum und Taskboard-Link, Stories und Summe gegen Ziel und Kapazität, „schätzen“ und „klären“, Startempfehlung `/implement-taiga-ticket <nr>`.

## Grenzen

Nichts löschen. Keine Stories anlegen oder inhaltlich ändern, außer Punkte senken und `Bereit` bei erfüllter Definition of Ready. Kein Code.
