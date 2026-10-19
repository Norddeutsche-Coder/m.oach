---
name: lukas-plant-setzt-um-testet-und-laedt-hoch
description: Führt den ganzen Ablauf in einer Sitzung nacheinander aus, von der Idee bis zur Veröffentlichung, z. B. `/lukas-plant-setzt-um-testet-und-laedt-hoch Onboarding für neue Läufer` oder mit einer Story-Nummer `/lukas-plant-setzt-um-testet-und-laedt-hoch 27` (steigt nach Taiga-Status in die passende Stufe ein, auch zum Fortsetzen). Plant das Epic, setzt eine Story um (mit `alle Stories` im Aufruf alle nacheinander), lässt die QA unabhängig prüfen und erstellt nach bestandener QA automatisch PR und Merge, sobald alle Pipelines grün sind (bei riskanten Stories erst nach Go), mit anschließender Live-Prüfung. Läuft ohne Go durch. Mit `mit Vorschau` im Aufruf öffnet er bei Änderungen an der Oberfläche vor Commit und Push die alte und die geänderte Seite lokal nebeneinander im Browser.
argument-hint: <idee> | <story-nummer>
disable-model-invocation: true
effort: high
---

# Planen, umsetzen, prüfen und abschließen

> Gemeinsame Regeln: `docs/workflow.md` (zu Beginn lesen). Helfer: `python3 -I scripts/moach_taiga.py <befehl>`. Unter Windows heißt Python oft `python` oder `py` statt `python3`. Nimm den Befehl, den es gibt. Alle übrigen Befehle dieses Skills (`node`, `npx`, `git`, `gh`) sind auf allen Systemen gleich.

Dieser Skill verkettet `plan-taiga-epic` → `implement-taiga-ticket` → (auf Wunsch) **lokale Vorschau** → `qa-taiga-ticket` → `finish-taiga-ticket`. Für jede Stufe liest du die jeweilige `.agents/skills/<skill>/SKILL.md` an der Stelle, an der sie dran ist, und folgst ihr vollständig, mit Vorlagen und Grenzen. Was dort steht, gilt. Hier steht nur, was die Verkettung zusätzlich regelt.

**Eingabe:**
- **Idee in Freitext** → Start bei Stufe 1.
- **`alle Stories`** irgendwo im Aufruf → nach einer Story folgt die nächste in derselben Sitzung (siehe „Nächste Story“). Sonst endet der Ablauf nach einer Story.
- **`mit Vorschau`** irgendwo im Aufruf → Stufe 3 läuft bei Änderungen an der Oberfläche. Sonst entfällt sie.
- **Story-Nummer** (`27` oder `#27`) → Stufe 1 entfällt, Einstieg nach Status (siehe unten).
- Fehlt beides, frag danach und mach nichts weiter.

**Einstieg nach Status:** So lässt sich ein abgebrochener Ablauf mit derselben Story-Nummer fortsetzen. Status aus Taiga, Stand der QA aus `python3 -I scripts/moach_taiga.py finish-check <nr>` (QA-Kommentar zum Head-Commit):

| Status der Story | Start bei |
|---|---|
| `Neu`, `Bereit`, `In Arbeit` | Stufe 2 |
| `Im Test`, keine bestandene QA für den Head-Commit | Stufe 4 |
| `Im Test` mit bestandener QA für den Head-Commit, `Im Review` | Stufe 5 |
| `Abnahme` (alter Ablauf) | auf `Fertig` setzen wie in `finish-taiga-ticket` beschrieben |
| `Fertig`, `Archiviert` | nichts tun, Stand melden |

Sag zu Beginn in einem Satz, bei welcher Stufe du einsteigst und warum.

**Tokens:** Die Stufen laufen in einer Sitzung statt in frischen Sitzungen. Behalte zwischen den Stufen nur das Ergebnis (Story-Nummern, Branch, Head-Commit, Status), nicht die Zwischenausgaben. Was du brauchst, lädst du aus Taiga und Git neu.

**Auf Pipelines warten, ohne abzufragen:** Wo ein Skill auf CI, PR-Checks oder Deployment wartet, nicht wiederholt `gh run list` aufrufen. Stattdessen einmal die Lauf-ID holen (erscheint sie nicht sofort nach dem Push, kurz warten) und dann blockierend warten: `gh run watch <id> --exit-status` bzw. für PR-Checks `gh pr checks <nr> --watch --fail-fast`. In Claude Code läuft das im Hintergrund (`run_in_background`, oder `Monitor` mit Abbruchbedingung), du wirst beim Ende benachrichtigt. Ohne Hintergrund-Werkzeug im Vordergrund mit passendem Zeitlimit. Die Zeitlimits der Skills (15 bzw. 20 Minuten) gelten weiter.

**Jede Frage an die Person über das Fragetool:** In diesem Skill stellst du **alle** Fragen und Haltepunkte über das Fragetool, nie nur als Chatnachricht. Das gilt für fehlende Eingaben, Rückfragen, die Vorschau, das Go bei riskanten Stories und Fragen, die ein Subagent zurückgibt. In Claude Code ist das `AskUserQuestion` (Einzelauswahl, 2–4 Optionen, die empfohlene zuerst mit „(Recommended)“). Braucht die Antwort eigenen Text (z. B. eine Idee oder ein Änderungswunsch), biete trotzdem sinnvolle Optionen an, der Text kommt über das Freitextfeld. Übersichten, Diffs und Berichte zeigst du vorher im Chat, die Frage selbst stellt immer das Werkzeug. Nur wenn der Agent kein solches Werkzeug hat (z. B. Codex), nummerierte Optionen im Chat wie in `docs/workflow.md`, Abschnitt 1.

**Fachliche Fragen:** Ist die aufrufende Person `lukcy22` (`python3 -I scripts/moach_taiga.py me`), stellst du fachliche Fragen direkt im Dialog über das Fragetool statt als Kommentar und schreibst die Antworten als `Antworten von @lukcy22 (im Dialog mit <Agent>): …` an die Story. Sonst gilt die Fragerunde aus `docs/workflow.md`: Kommentar, dann hält der Ablauf für diese Story an.

## Stufe 1: Epic planen

Folge `plan-taiga-epic` bis zum Abschlussbericht. Danach:

1. Zeig die angelegten Stories mit Status. Nur Stories auf `Bereit` können weiter. Stories auf `Neu` (offene Fragerunde, fehlender Entwurf) nennst du mit dem fehlenden Punkt.
2. Ohne zu fragen weiter mit der ersten Story auf `Bereit`, deren Abhängigkeiten erfüllt sind. Gibt es keine, endet der Ablauf.

## Stufe 2: Story umsetzen

Folge `implement-taiga-ticket` für die Story, Phase 0 bis Phase 5, ohne Haltepunkte. Ist `mit Vorschau` gewählt und die Oberfläche betroffen, kommt vor Phase 6 die Vorschau aus Stufe 3. Danach Phase 6 (Commit, Push, CI grün, Story `Im Test`).

## Stufe 3: Lokale Vorschau (nur mit `mit Vorschau`, vor Commit und Push)

**Wann:** `mit Vorschau` steht im Aufruf, und der Diff betrifft die Oberfläche (`.tsx`, `.css`, `index.html`, `src/legacy/app.js`, `public/`) oder Logik, die in der App sichtbar wird. Gleiche Regel wie bei den Screenshots in `qa-taiga-ticket`. Sonst entfällt die Stufe.

**Vorgehen:**

1. `<tmp>/vorschau-tg-<nr>/szenarien.json` schreiben, im Format von `qa-taiga-ticket/scripts/shots.cjs`: Testdaten wie in `frontend/tests/today.spec.ts` und `frontend/tests/fixtures/`, festes Datum, `tab` für die geänderte Ansicht, ggf. `click`, damit genau der geänderte Zustand zu sehen ist. Standard: zwei Szenarien, Handy hell und Desktop dunkel. Bei geänderten Farben, `app.css` oder Layout alle vier Kombinationen. Jedes Szenario öffnet sich zweimal, vorher und nachher.
2. Vorschau im Hintergrund starten (falls Chromium fehlt, vorher `npx playwright install chromium` in `frontend/`). Der Befehl ist unter macOS, Linux und Windows gleich:
   ```sh
   node <repo>/.agents/skills/lukas-plant-setzt-um-testet-und-laedt-hoch/scripts/preview.cjs <repo>/frontend <tmp>/vorschau-tg-<nr>/szenarien.json --vorher <basis>
   ```
   `<basis>` ist der Stand vor der Story: `git merge-base HEAD origin/main`. So zeigt „vorher“ auch nach QA-Runden den Stand ohne die Story und keine fremden neuen Commits auf `main`.

   Das Skript startet „nachher“ als Dev-Server aus dem Arbeitsverzeichnis. Der lädt Änderungen sofort neu, die Fenster können während Nachbesserungen offen bleiben. „Vorher“ checkt es als Git-Worktree unter `<tmp>/vorschau-tg-<nr>/basis-src` aus, baut es einmal und stellt es daneben bereit. Beide nutzen die Testwerte aus AGENTS.md und die ersten freien Ports von 4183 bis 4189. Die eigenen Ports halten die Testdaten getrennt von lokalen Daten auf dem üblichen Dev-Port. Die Fenster tragen oben das Schild **VORHER** (grau, links) bzw. **NACHHER** (blau, rechts). Externe Anfragen und Service Worker sind blockiert.
3. Auf die Zeile `alle Fenster geöffnet: …` warten. `FEHLER: …` ohne Szenario (Server, Worktree, Build) → Ausgabe zeigen und anhalten. `FEHLER <name> · nachher` heißt: Seite, Tab oder Klickziel nicht erreichbar, das Fenster zeigt also nicht die geänderte Ansicht. Szenario korrigieren und neu starten, bevor du die Person fragst. `FEHLER <name> · vorher` ist erwartbar, wenn die Story eine Ansicht oder ein Element neu einführt. Sag das dann im Haltepunkt. Ausgaben mit `!` sind Konsolenfehler und gehören in den Haltepunkt.
4. Die Person schließt die Fenster selbst, wenn sie fertig ist. Danach beendet das Skript die Server und entfernt den Worktree von allein.
5. **Rückfrage zur Vorschau:** Zeig die Übersicht aus Phase 5 von `implement-taiga-ticket` (Checks, Acceptance Criteria, `git diff --stat`, Commit-Nachricht), dazu welche Fenster offen sind, was sich zwischen vorher und nachher unterscheidet und worauf die Person achten soll (bei freigegebenem Entwurf: Abweichungen davon). Die Person darf in den Fenstern frei klicken. Frag dann über das Fragetool (`AskUserQuestion`), nie als Chatnachricht:
   - „Gefällt mir, committen und pushen“ (Recommended): weiter mit Phase 6,
   - „Oberfläche ändern“: die Person beschreibt im eigenen Text, was anders soll,
   - „Andere Ansicht zeigen“: Szenarien anpassen und neu öffnen,
   - „Abbrechen“: nichts committen, Stand melden.
6. **Änderungswünsche:** Liegen sie im Umfang der Story und im freigegebenen Entwurf, setzt du sie **nicht selbst** um, sondern wie in Phase 4 von `implement-taiga-ticket`: zuerst passt der Test-Agent die Tests an den Wunsch an und belegt, dass sie fehlschlagen, danach setzt ein neuer Logik-Agent den Wunsch um, ohne die Tests zu ändern (Stand per `git hash-object` prüfen). Rein optische Wünsche ohne neues Verhalten (Farbe, Abstand, Größe) gehen direkt an einen Logik-Agenten, mit Begründung im Kommentar „Umgesetzt“. Die Vorschau bleibt offen und zeigt den neuen Stand sofort. Danach schnelle Checks wiederholen und erneut ab Schritt 5 fragen. Ändern sie das Verhalten für Läufer, Texte oder den Entwurf über die Story hinaus, ist das eine fachliche Frage (siehe oben), keine eigene Entscheidung. Weicht die Umsetzung danach vom Entwurf ab, gehört die Begründung in den Kommentar „Umgesetzt“.
7. Nach der Zustimmung oder dem Abbruch: Läuft die Vorschau noch, den Hintergrund-Prozess beenden (das stoppt die Server und entfernt den Worktree; bleibt `basis-src` doch liegen, `git worktree remove --force` darauf), `<tmp>/vorschau-tg-<nr>/` löschen.

## Stufe 4: QA

Die QA prüft unabhängig und ohne Vorgeschichte.

- **Claude Code:** Starte einen Subagenten (`Agent`, Typ `general-purpose`, im Vordergrund) mit dem Auftrag: „Lies `<repo>/.agents/skills/qa-taiga-ticket/SKILL.md` und `<repo>/docs/workflow.md` und folge der QA für Story <nr> vollständig. Du hast keine Vorgeschichte, prüfst unabhängig und behebst nichts. Gib am Ende den Bericht aus Abschnitt 6 zurück, mit Ergebnis bestanden/nicht bestanden, Head-Commit und Befunden.“ Keine Hinweise aus der Umsetzung mitgeben außer der Story-Nummer.
- **Andere Agenten ohne Subagenten:** Folge `qa-taiga-ticket` selbst. Belege jede Acceptance Criteria neu aus Git, CI und Screenshots, nie aus deiner Erinnerung an die Umsetzung.

Zeig den Bericht. Dann:
- **Bestanden** → Stufe 5.
- **Befunde** → zurück zu Stufe 2 (`implement-taiga-ticket` setzt fort und arbeitet die Tasks `QA: …` ab), bei Oberflächen wieder mit Stufe 3, danach erneut Stufe 4. Nach **2 Runden** mit Befunden anhalten und fragen, wie es weitergeht.

## Stufe 5: Abschließen und automatisch mergen

Folge `finish-taiga-ticket`. PR und Merge laufen ohne Haltepunkt, solange alle Bedingungen erfüllt sind. **Ausnahme: riskante Stories.**

**Risiko prüfen (selbst, vor dem Subagenten):** Riskant nach der Definition in `docs/workflow.md`, Abschnitt 3. Dann den Haltepunkt aus Phase 2 von `finish-taiga-ticket` wie dort halten: `finish-check`, `git diff --stat`, PR-Titel und Squash-Nachricht zeigen, den Grund für das Risiko nennen und über das Fragetool nach dem Go fragen. Ohne Go kein PR.

**Ausführen:**
- **Claude Code:** Die Stufe läuft als Subagent mit dem günstigeren Modell, wie es `finish-taiga-ticket` vorsieht (`Agent`, Typ `general-purpose`, `model: sonnet`, im Vordergrund). Auftrag: Story-Nummer, Branch, ob das Go für eine riskante Story erteilt ist, und „Lies `<repo>/.agents/skills/finish-taiga-ticket/SKILL.md`, `<repo>/docs/workflow.md` und Stufe 5 sowie den Abschnitt zum Warten auf Pipelines in `<repo>/.agents/skills/lukas-plant-setzt-um-testet-und-laedt-hoch/SKILL.md` und folge ihnen. Wo angehalten werden muss, hörst du auf und gibst Grund, Stand und die Frage an die Person zurück. Am Ende gibst du den Abschlussbericht zurück.“ Hält der Subagent an, stellst du die Frage über das Fragetool und setzt ihn danach mit der Antwort fort (`SendMessage` an denselben Agenten).
- **Andere Agenten ohne Subagenten:** Führe die Stufe selbst aus.

**Ablauf:**

1. **Bedingungen (Phase 1):** Die QA aus Stufe 4 ist **bestanden**, und ihr Kommentar in Taiga gilt für den aktuellen Head-Commit. Kam nach der QA ein neuer Commit dazu, zuerst Stufe 4 wiederholen. Dazu `finish-check` ohne ❌. Läuft die CI noch, warten wie im Skill. Bei ⚠️ **Basis** (neue Commits auf `main` mit gemeinsamen Dateien): `origin/main` in den Branch mergen, pushen, CI abwarten und zurück zu Stufe 4. Bei Merge-Konflikten anhalten und melden. Andere offene Tasks als laut QA erfüllte Acceptance Criteria → zurück zu Stufe 2.
2. **PR (Phase 2 und 3):** Bei nicht riskanten Stories `finish-check`, `git diff --stat`, PR-Titel und Squash-Nachricht nur zur Information zeigen, ohne zu warten. Bei riskanten Stories nur mit erteiltem Go weiter. Dann PR erstellen, PR-Link setzen, Story `Im Review`.
3. **Pipelines abwarten:** alle Checks des PR (CI, Secret-Scan und weitere, höchstens 15 Minuten). Erst wenn **jeder Check grün** ist und GitHub den PR als mergebar meldet (`gh pr view <nr> --json mergeable,mergeStateStatus,statusCheckRollup`), Acceptance Criteria abhaken und per Squash mergen, ohne `Co-authored-by:` für KI-Agenten. Nie Schutzregeln umgehen, nie `--admin`, kein `--auto`, das ohne Prüfung später mergt.
4. **Rot, abgelehnt oder Zeitlimit:** nicht mergen. Story bleibt `Im Review`, fehlgeschlagenen Check mit Ursache zeigen, anhalten.
5. Danach Phase 4 bis 6 von `finish-taiga-ticket` wie dort beschrieben (Deployment, Smoke-Test, Abschluss, bei Fehlern Revert nur nach Go).

## Nächste Story

Sind aus Stufe 1 noch Stories auf `Bereit`:

- **Standard:** Der Ablauf endet hier, damit jede Story in einer frischen, kleinen Sitzung läuft. Nenne je Story den Befehl für eine neue Sitzung (`/lukas-plant-setzt-um-testet-und-laedt-hoch <nr>`) und welche davon unabhängig sind und parallel laufen können (keine Abhängigkeit untereinander, nicht beide an `src/legacy/app.js` oder `src/app.css`).
- **Mit `alle Stories`:** ohne Frage weiter mit der nächsten (Auswahl wie in Stufe 1), in derselben Sitzung nacheinander.

Jede neue Story beginnt mit einem Branch vom dann aktuellen `origin/main`.

## Haltepunkte im Überblick

| Wo | Was die Person entscheidet |
|---|---|
| Stufe 3, nur mit `mit Vorschau` | Oberfläche gefällt → Commit und Push |
| Stufe 5, nur riskante Stories | Go zu PR und Merge |
| Fehler nach dem Merge | Go zum Revert |

Sonst läuft alles ohne Haltepunkt. Angehalten wird nur bei offenen fachlichen oder Architektur-Fragen, Merge-Konflikten, roten Checks, 2 QA-Runden mit Befunden oder einem Fehler nach dem Merge. Ein Go gilt nur für den Haltepunkt, an dem es gegeben wird.

## Abschlussbericht

Kurz gesagt, dann je Story eine Zeile: Nr., Titel, Branch bzw. PR, Ergebnis der QA (Runden), Status in Taiga. Danach offene Fragerunden und Stories auf `Neu` mit fehlendem Punkt.

## Grenzen

- Alle Grenzen der vier Skills gelten weiter.
- Kein Merge, solange ein Check rot, ausstehend oder übersprungen ist, und kein Revert ohne Go.
- Mit `mit Vorschau`: kein Commit und kein Push, bevor die Person die Vorschau gesehen und zugestimmt hat, wenn die Oberfläche betroffen ist.
- Kein PR vor bestandener QA für den aktuellen Head-Commit.
- Die Vorschau nutzt nur Testwerte und Testdaten, nie echte Zugangsdaten oder Live-Backends.
