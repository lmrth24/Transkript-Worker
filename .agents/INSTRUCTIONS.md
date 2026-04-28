# Agent-Anweisungen für diesen Worker

Dieser Notion Worker fügt YouTube-Transkripte als Toggle-Block in Notion-Seiten ein.

## Projekt-Struktur

- `src/index.ts` — die gesamte Worker-Logik (ein einziges Tool: `fetchTranscript`).
- `package.json` — Build-Skripte (`build`, `check`).
- `.env.example` — Vorlage für lokale Konfiguration. Echte Werte gehören in `.env` (gitignored).

## Externe Abhängigkeiten

- **Supadata** (https://supadata.ai) — liefert Transkripte. API-Key in `SUPADATA_API_KEY`.
- **Notion API** — vom `@notionhq/workers`-Framework bereitgestellt, Auth läuft über die Worker-Runtime.

## Konventionen

- Sprache der Nutzer-Kommunikation: Deutsch (Fehlermeldungen, Tool-Beschreibungen, Logs).
- Toggle-Titel auf Notion-Seiten ist immer exakt `Transkript` — der Duplikats-Check verlässt sich darauf.
- Notion-Limits: max. 2000 Zeichen pro `rich_text`, max. 100 Children pro `append`. Beides muss beim Hinzufügen langer Transkripte respektiert werden.

## Tests & Checks

- `npm run check` — TypeScript-Typcheck ohne Build.
- `npm run build` — kompiliert nach `dist/`.
- `test.ts` ist ein lokales End-to-End-Skript (gitignored), das die Kernlogik gegen die echte Notion API ausführt. Erwartet `NOTION_API_KEY` und `SUPADATA_API_KEY` in einer `.env`.

## Deploy

`ntn workers deploy` lädt den Worker in den verbundenen Notion-Workspace hoch. Anschließend `ntn workers env push --yes`, damit die Env-Vars aus `.env` auch im Cloud-Worker landen.
