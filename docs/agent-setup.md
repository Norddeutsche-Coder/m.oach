# Einrichtung für KI-Agenten (GitHub und Taiga)

Diese Anleitung richtet Claude Code so ein, dass es mit GitHub (Pull Requests, CI) und Taiga (Stories, Sprints) arbeiten kann. Sie gilt pro Person und Rechner. Zugangsdaten gehören **nie** ins Repository, denn es ist öffentlich.

Am Ende prüft `scripts/check-agent-setup.sh`, ob alles funktioniert.

Die Schritte sind für macOS beschrieben. **Unter Windows** gelten die Abweichungen aus dem [Abschnitt Windows](#windows).

## 1. Voraussetzungen

- **Node 22** (siehe `.nvmrc`, mindestens 20.19) und **npm 11**: `node -v`, `npm -v`. Ist npm älter: `npm install --global npm@11`.
- **Claude Code** (CLI oder VS-Code-Erweiterung).
- **Python 3**, nur für das Prüfskript (auf macOS vorhanden, unter Windows siehe [Windows](#windows)).

## 2. GitHub

Claude Code nutzt das offizielle **GitHub-Plugin**. Es ist nicht im Repository eingetragen, sondern wird pro Person installiert.

1. **Plugin installieren:** In Claude Code `/plugin` aufrufen, im Marketplace `claude-plugins-official` das Plugin **github** wählen und für den eigenen Account installieren. Fehlt der Marketplace, ihn über „Add marketplace“ mit der Quelle `anthropics/claude-plugins-official` hinzufügen. Der Name allein führt zum Fehler „Invalid marketplace source format“.
2. **Token anlegen:** https://github.com/settings/personal-access-tokens/new (Fine-grained token)
   - **Resource owner:** `Norddeutsche-Coder`
   - **Repository access:** Only select repositories → `m.oach`
   - **Repository permissions:**

     | Recht | Stufe |
     |---|---|
     | Contents | Read-only |
     | Pull requests | Read and write |
     | Actions | Read-only |
     | Commit statuses | Read-only (optional) |
     | Metadata | Read-only (automatisch) |

   - Keine weiteren Rechte, insbesondere nicht Administration, Secrets, Variables, Environments, Workflows oder Pages.
   - **Ablaufdatum:** z. B. 90 Tage. Je nach Einstellung der Organisation muss ein Admin den Token noch freigeben.
3. **Token eintragen** in `~/.zshrc` (siehe Abschnitt 4):
   ```sh
   export GITHUB_PERSONAL_ACCESS_TOKEN='github_pat_…'
   ```

## 3. Taiga

Der Taiga-Server ist im Repository in `.mcp.json` eingetragen (`mcp-taiga`, feste Version). Er braucht nur deine Zugangsdaten.

1. **Taiga-Passwort:** Der Server meldet sich mit Benutzername und Passwort an. Wer sich bei Taiga über GitHub anmeldet, setzt sich über „Passwort vergessen“ auf der Taiga-Anmeldeseite ein Passwort. Alternative: ein eigener Taiga-Account nur für den Agenten, eingeladen ins Projekt `fynndow-moach`.
2. **Zugangsdaten eintragen** in `~/.zshrc`:
   ```sh
   export TAIGA_USERNAME='name@example.com'
   export TAIGA_PASSWORD='…'
   # nur für selbst gehostetes Taiga:
   # export TAIGA_API_URL='https://taiga.example.com/api/v1'
   ```

## 4. Variablen richtig eintragen

`~/.zshrc` öffnen, z. B. mit `nano ~/.zshrc`, und die Zeilen aus Abschnitt 2 und 3 am Ende einfügen. In nano speichert **Ctrl + O** (Enter bestätigen), **Ctrl + X** beendet.

Häufige Fehler:
- **Kein Leerzeichen um das `=`:** `export NAME='wert'`, nicht `export NAME ='wert'`. Mit Leerzeichen wird die Variable nicht gesetzt.
- **Einfache Anführungszeichen**, damit Sonderzeichen wie `$` oder `!` im Passwort nicht stören.
- Die Datei enthält danach Geheimnisse: nicht teilen, nicht ins Repository kopieren.

## 5. Neu starten

Claude Code übernimmt die Variablen nur beim Start:
- **VS Code komplett beenden** (Cmd + Q, nicht nur das Fenster schließen) und neu öffnen. Klappt es danach nicht, VS Code aus dem Terminal starten: `code /pfad/zu/m.oach`.
- **CLI:** neues Terminal öffnen, dann `claude` starten.

Beim ersten Start im Projekt fragt Claude Code, ob der Projekt-Server **taiga** aus `.mcp.json` erlaubt werden soll. Bestätigen.

## 6. Prüfen

Im Hauptordner des Repositories:
```sh
./scripts/check-agent-setup.sh
```
Das Skript zeigt keine Zugangsdaten an. Es prüft:
- Node und npm,
- ob die Variablen gesetzt sind und in `~/.zshrc` richtig geschrieben sind,
- die Anmeldung bei Taiga und den Zugriff auf das Projekt,
- den GitHub-Token und den Zugriff auf Repository, Pull Requests und Actions,
- ob das GitHub-Plugin installiert ist.

In Claude Code zusätzlich `/mcp` aufrufen: **github** und **taiga** müssen als verbunden erscheinen.

## 7. Fehlerbehebung

| Meldung | Ursache und Lösung |
|---|---|
| GitHub: „Authorization header is badly formatted“ | `GITHUB_PERSONAL_ACCESS_TOKEN` ist im laufenden Claude-Prozess leer. Schreibweise in `~/.zshrc` prüfen (Abschnitt 4), dann VS Code mit Cmd + Q (Windows: Datei → Beenden) neu starten. |
| Taiga: „401 … No active account found with the given credentials“ | Variablen fehlen im Prozess (wie oben) oder die Zugangsdaten stimmen nicht. Auf https://tree.taiga.io/login mit E-Mail und Passwort testen, nicht über „Login with GitHub“. |
| Prüfskript meldet die Variablen, `/mcp` aber nicht verbunden | Claude Code läuft noch mit der alten Umgebung. Komplett beenden und neu starten. |
| GitHub 404 auf das Repository | Der Token hat keinen Zugriff auf `m.oach`, ist noch nicht freigegeben, oder der Resource owner ist nicht `Norddeutsche-Coder`. |

## Windows

Unter Windows weichen nur Werkzeuge, Variablen und Neustart ab. Token und Taiga-Passwort legst du wie in Abschnitt 2 und 3 an.

- **Werkzeuge:** [Git for Windows](https://git-scm.com/download/win) bringt Git Bash mit. Darin läuft das Prüfskript. Python 3 z. B. mit `winget install Python.Python.3.13` installieren. Der Eintrag `python3` aus dem Microsoft Store öffnet ohne Installation nur den Store.
- **Variablen statt `~/.zshrc`:** Windows-Taste, `Umgebungsvariablen` tippen, „Umgebungsvariablen für dieses Konto bearbeiten“ wählen. Unter „Benutzervariablen“ mit „Neu…“ `GITHUB_PERSONAL_ACCESS_TOKEN`, `TAIGA_USERNAME` und `TAIGA_PASSWORD` anlegen. Werte ohne Anführungszeichen eintragen und beide Fenster mit **OK** schließen. Nicht mit `setx` im Terminal setzen, sonst steht der Wert in der Shell-History.
- **Neu starten:** Alle VS-Code-Fenster schließen (Datei → Beenden) und VS Code neu öffnen. Ein einzelnes Fenster zu schließen reicht nicht.
- **Prüfen:** In Git Bash im Hauptordner `bash scripts/check-agent-setup.sh` ausführen. Die Prüfung der Schreibweise in `~/.zshrc` entfällt, wenn die Datei fehlt.

## Andere Agenten (Codex)

Codex liest die Projektregeln aus `AGENTS.md` automatisch. Den Taiga-Server bekommt Codex über die Projektdatei `.codex/config.toml`, das Gegenstück zu `.mcp.json`:

- gleicher Befehl und gleiche Version (`npx -y mcp-taiga@1.0.0`),
- `env_vars` reicht nur die **Namen** `TAIGA_USERNAME` und `TAIGA_PASSWORD` aus der eigenen Umgebung weiter, die Werte stehen nie in der Datei.

Die Zugangsdaten kommen wie für Claude Code aus `~/.zshrc` (Abschnitt 4). Ändert sich die Version von `mcp-taiga`, beide Dateien gemeinsam anpassen.

Die Skills (`triage-taiga-issues`, `plan-taiga-epic`, `plan-taiga-sprint`, `implement-taiga-ticket`, `qa-taiga-ticket`, `finish-taiga-ticket`) liegen unter `.agents/skills/`. Dort findet Codex sie automatisch. Claude Code liest eine Kopie in `.claude/skills/`, die `node scripts/sync-skills.mjs` erzeugt (echte Dateien, keine Symlinks, deshalb ohne Zusatzeinstellungen auch unter Windows). Aufruf mit `$<name>`, z. B. `$implement-taiga-ticket 27`, oder über `/skills`. `agents/openai.yaml` verhindert, dass Codex sie ungefragt startet.

Damit jeder Skill mit dem passenden Modell und Reasoning-Aufwand läuft, drei persönliche Profildateien unter `~/.codex/` anlegen (Windows: `%USERPROFILE%\.codex\`):

- `moach-deep.config.toml`: `model = "gpt-6-astra"` und `model_reasoning_effort = "high"`
- `moach-routine.config.toml`: `model = "gpt-6.1-sol"` und `model_reasoning_effort = "medium"`
- `moach-quick.config.toml`: `model = "gpt-6-luna"` und `model_reasoning_effort = "low"`

Die Dateien enthalten nur diese beiden Einstellungen. Zugangsdaten und MCP-Server bleiben in der bestehenden persönlichen bzw. Projektkonfiguration. Skills anschließend über `scripts/codex-skill.sh <skill> [argumente]` starten, zum Beispiel:

```sh
scripts/codex-skill.sh implement-taiga-ticket 27
```

Das Skript ordnet Planungs-, Umsetzungs- und QA-Skills `moach-deep` zu; Triage, Sprintplanung und Abschluss laufen mit `moach-routine`. Für kurze Fragen ohne Skill `codex --profile moach-quick` verwenden. Die vollständige Zuordnung steht in `docs/workflow.md`, Abschnitt 10.
