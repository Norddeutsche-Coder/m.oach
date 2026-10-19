# M.oach

Marathon-Coach mit Trainingsplanung, Tagesbriefing und Intervals.icu-Anbindung.

## Struktur

- `frontend/`: Web-App mit Vite, React 19 und TypeScript.
- `backend/`: Supabase-Backend; Datenbankschema und serverseitige Funktionen werden hier versioniert.
- `frontend/legacy-app/`: ursprüngliche App mit HTML, Service Worker, Manifest und Bildern. Der Ordner dient nur als Referenz für die Migration und wird nach deren Abschluss gelöscht.
- `frontend/src/features/today/`: bereits nach React und TypeScript migrierte Tagesansicht.
- `frontend/src/legacy/`: Übergangsmodul für die noch nicht migrierten Ansichten.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.12+ und npm 11 (die Engine-Anforderungen der installierten Pakete gelten zusätzlich).

```sh
cd frontend
npm ci
npm run dev
```

Die Abhängigkeiten wurden mit npm 11 installiert; npm 10.8.2 scheiterte bei der Auflösung der Vorlage. Falls nötig: `npx --yes npm@11 ci` statt `npm ci`.

Prüfen und bauen: `npm run check` und `npm run build` im Ordner `frontend/`.
Browserprüfungen: nach dem Build `npx playwright install chromium` und `npm run test:e2e` ausführen. Details und Grenzen der Migration stehen in [frontend/README.md](frontend/README.md).

Der Build liegt unter `frontend/dist/`; `npm run preview` zeigt ihn lokal an.

Die bisherige App lässt sich separat mit `python3 -m http.server 8080 --directory frontend/legacy-app` unter `http://localhost:8080` öffnen.

## Deployment

Ein Push auf `main` startet automatisch `.github/workflows/deploy.yml`. Der Workflow veröffentlicht `frontend/dist/` erst, nachdem die vollständige CI einschließlich der Browserprüfungen erfolgreich war.

Voraussetzungen sind die Pages-Quelle „GitHub Actions“ und die beiden gesetzten Repository-Variablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`. Die Live-App ist unter `https://m-oach.com/` erreichbar.

Die frühere Pages-Adresse `https://norddeutsche-coder.github.io/m.oach/` bleibt während der Datenmigration als Brücke bestehen. Das Repository deshalb nicht umbenennen: GitHub leitet die alte Pages-Adresse nicht weiter. Ein Domainwechsel überträgt außerdem keine im localStorage gespeicherten Nutzerdaten zwischen den Adressen.

Seit dem 16.10.2026 heißt das Repository `m.oach` statt `M.oach`. Die frühere Adresse `https://norddeutsche-coder.github.io/M.oach/` liefert seitdem eine 404-Seite.

Die einmalige Umstellung erfolgt in dieser Reihenfolge:

1. PR von `chore/project-structure` nach `main` öffnen und prüfen.
2. Unter Settings → Pages die Quelle auf „GitHub Actions“ umstellen. Die bisher veröffentlichte Version bleibt dabei bis zum nächsten Deployment online.
3. Unter Settings → Environments → `github-pages` prüfen, dass `main` deployen darf.
4. PR mergen. Danach unter Actions prüfen, dass „Deploy“ grün durchläuft.
5. `https://norddeutsche-coder.github.io/m.oach/` auf einem Gerät öffnen, auf dem die alte App installiert war, neu laden und prüfen, ob die Daten vorhanden sind und Offline-Neuladen funktioniert.
6. In Supabase unter Authentication → URL Configuration prüfen, dass die Pages-URL als Site-URL beziehungsweise Redirect-URL für den Passwort-Reset eingetragen ist.

## Hinweise für KI-Agenten

Regeln und Arbeitsweise für Claude Code, Codex und andere Agenten stehen in [AGENTS.md](AGENTS.md). `CLAUDE.md` verweist nur darauf.

Einrichtung von GitHub und Taiga für Agenten: [docs/agent-setup.md](docs/agent-setup.md). Ob alles funktioniert, zeigt `./scripts/check-agent-setup.sh`.

## Taiga-Anbindung für KI-Assistenten (MCP)

`.mcp.json` bindet Taiga über den Community-MCP-Server [`mcp-taiga`](https://github.com/negoro26/mcp-taiga) (Version fest auf 1.0.0) an Claude Code an. Die Datei enthält keine Zugangsdaten. Jede Person setzt sie in der eigenen Shell-Umgebung, zum Beispiel in `~/.zshrc`:

```sh
export TAIGA_USERNAME="name@example.com"
export TAIGA_PASSWORD="…"
# nur für selbst gehostetes Taiga, Standard ist https://api.taiga.io/api/v1
# export TAIGA_API_URL="https://taiga.example.com/api/v1"
```

Danach Claude Code neu starten, den Projekt-Server einmalig bestätigen und mit `/mcp` prüfen, ob „taiga“ verbunden ist.

Der Server meldet sich mit Benutzername und Passwort an und kann Einträge anlegen, ändern und löschen. Am besten einen eigenen Taiga-Account nur mit Zugriff auf dieses Projekt verwenden. Zugangsdaten gehören nie ins Repository, denn es ist öffentlich.

## Migrationsstand

Das Frontend enthält die bestehende Oberfläche im Vite-Build. Kopfbereich, Navigation und Tagesansicht sind React-Komponenten. Kalender, Läufe, Leistung, Race, Profil, Coaching und Anmeldung werden noch vom gekennzeichneten JavaScript-Übergangsmodul gerendert. Die weitere React-/TypeScript-Migration erfolgt ansichtsweise. Die bisherige App bleibt unter `frontend/legacy-app/` als Referenz erhalten. Das Hosting wird in diesem Schritt nicht umgestellt.

Nächste Schritte:

1. Kalender und seinen Datenvertrag vollständig nach React/TypeScript übertragen; anschließend die weiteren Ansichten.
2. Supabase-Schema, Zugriffsregeln und vorhandene Funktionen erfassen und unter `backend/` versionieren.
3. Speicherung und API-Zugriffe aus der Oberfläche lösen; Trainingslogik in TypeScript überführen und prüfen.
4. Echte Cloud-Anmeldung, Synchronisierung und Push prüfen; danach Hosting auf `frontend/dist/` umstellen. Offline-Neuladen ist im Vite-Build bereits integriert und browsergetestet.

Das bestehende Supabase-Projekt wird durch dieses Grundgerüst nicht verändert.
