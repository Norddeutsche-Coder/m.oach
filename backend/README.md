# Backend – Supabase

Das Supabase-Backend von M.oach ist unter `backend/supabase/` versioniert. Die
Baseline-Migration bildet das am 17. Oktober 2026 gelesene Schema des verbundenen Projekts ab:
Tabellen, Constraints, Funktionen, Trigger, Rechte und Row-Level-Security-Policies (RLS).

Das Live-Projekt wurde für diesen Snapshot nur gelesen. Im Projekt war zu diesem Zeitpunkt keine
Edge Function bereitgestellt. Insbesondere existierte `moach-push` nicht; die vollständige
Umsetzung des Push-Dienstes wird in Taiga-Story #176 verfolgt.

## Voraussetzungen

- Docker Desktop oder eine kompatible Docker-Laufzeit
- Node.js 22 (mindestens 20.19)
- Supabase CLI, zum Beispiel temporär über `npx supabase`

Die Supabase CLI benötigt für die lokale Entwicklung weder Zugang zum Live-Projekt noch dessen
Zugangsdaten.

## Lokales Backend starten

Alle Befehle werden aus `backend/` ausgeführt:

```sh
cd backend
npx supabase start
```

Beim ersten Start lädt die CLI die benötigten Container-Images. Anschließend zeigt sie die lokalen
URLs und ausschließlich lokale Testschlüssel an. Diese Ausgabe nicht in Issues, Commits oder andere
öffentliche Stellen kopieren.

Die lokale Umgebung beenden:

```sh
npx supabase stop
```

## Migrationen anwenden

`supabase start` wendet die Migrationen beim ersten Aufbau an. Um die lokale Datenbank später
vollständig auf den versionierten Stand zurückzusetzen:

```sh
cd backend
npx supabase db reset
```

`db reset` löscht ausschließlich die Daten der lokalen Supabase-Container und führt danach alle
Dateien unter `supabase/migrations/` in zeitlicher Reihenfolge aus. Der Befehl darf nicht mit einer
Remote-Datenbank-URL ausgeführt werden.

Neue Schema- oder Policy-Änderungen kommen immer als zusätzliche Migration hinzu. Vorhandene,
bereits veröffentlichte Migrationen werden nicht nachträglich umgeschrieben.

## Datenbanktests

Die Tests unter `supabase/tests/` prüfen Datenbankregeln wie Row-Level Security gegen die lokale
Supabase-Instanz. Nach dem lokalen Start werden sie aus `backend/` ausgeführt:

```sh
npx supabase test db
```

Die Testdaten laufen in Transaktionen und werden danach zurückgerollt. Der Befehl verwendet nur die
lokale Datenbank; Tests niemals mit einer Remote-Datenbank-URL starten.

## Verzeichnisstruktur

```text
backend/
├── README.md
└── supabase/
    ├── config.toml
    ├── migrations/
    │   ├── 20261017000000_remote_schema.sql
    │   └── 20261017190000_harden_coach_request_rls.sql
    ├── functions/
    └── tests/
        └── coach_requests_rls.test.sql
```

Der Ordner `functions/` wird angelegt, sobald eine Edge Function im Repository umgesetzt wird. Er
bleibt leer, solange das verbundene Projekt keine Function enthält.

## Secrets und Live-Projekt

- Keine Service-Role-Keys, Datenbankpasswörter, privaten VAPID-Schlüssel oder Session-Tokens ins
  Repository schreiben.
- Lokale Werte gehören in ignorierte `.env`-Dateien oder in den Secret-Speicher der Supabase CLI.
- In Konfiguration und Quellcode werden nur Variablennamen dokumentiert, niemals deren Werte.
- `supabase db push`, `supabase migration up`, Function-Deployments und Änderungen im Dashboard
  verändern das Live-Projekt und dürfen nur nach ausdrücklicher Freigabe ausgeführt werden.
- Ein Schema-Abgleich mit dem Live-Projekt erfolgt lesend, beispielsweise über `supabase db pull`
  oder den projektgebundenen Supabase-MCP-Server.

Die Sicherheit beruht nicht auf dem öffentlichen Publishable Key, sondern auf den versionierten
RLS-Policies. Nach jeder Änderung müssen die betroffenen Policies und Supabase Security Advisors
erneut geprüft werden.
