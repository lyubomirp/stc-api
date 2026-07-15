# STC — Standard Template Construct

A Warhammer 40,000 army list data API. It mirrors the
[Wahapedia](https://wahapedia.ru) data exports into Postgres on a nightly
schedule and serves them over a read-only HTTP API, so a front end can query
factions, datasheets, weapon profiles, stratagems and abilities without
parsing CSVs itself.

Unofficial and non-commercial. Not affiliated with or endorsed by Games
Workshop. Warhammer 40,000 and all associated names are trademarks of Games
Workshop Limited; game data belongs to them.

## How it works

A nightly cron checks the upstream publication timestamp. If it is newer than
the local copy, the export files are downloaded to a temp directory, parsed,
validated, and written to Postgres in a single transaction — the whole dataset
is replaced rather than merged, so the database always matches upstream. Temp
files are deleted afterwards.

Data enters the database from the cron or the manual import command only.
Every HTTP route is read-only.

`src/config/importManifest.ts` is the single source of truth for the import:
file order, CSV-header to entity-property mapping, and the download list.

## Tech stack

| | |
|---|---|
| Runtime | Node.js 24 LTS, TypeScript 6 (strict) |
| Framework | NestJS 11 (Express 5) |
| Database | PostgreSQL 16 (via TypeORM 1) |
| Scheduling | `@nestjs/schedule` |
| HTTP / parsing | `@nestjs/axios`, `fast-csv` |
| Lint / test | ESLint 10 (flat config), Prettier 3, Jest 30 |
| Local infra | Docker Compose |

## Getting started

**Prerequisites:** Node.js 24 (see `.nvmrc`), Docker.

```bash
npm install
cp .env.example .env    # then fill it in
docker compose up -d    # starts Postgres, reading credentials from .env
npm run start:dev
```

Tables are created automatically on boot (`synchronize: true`). The database
starts empty — run an import to populate it.

```bash
npm run lint      # eslint --fix
npm run format    # prettier --write
npm run build
```

### Environment

`.env` is read by both the app and `docker-compose.yaml`, so the two cannot
drift apart.

| Variable | Description |
|---|---|
| `ENVIRONMENT` | `dev` / `prod` |
| `PORT` | Currently unused — the app listens on 3000 |
| `DB_TYPE` | `postgres` |
| `DB_HOST` | Database host |
| `DB_PORT` | Optional, defaults to `5432` |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `API_URL` | Base URL the export files are fetched from |

## Importing data

Runs nightly at 03:00. To trigger it by hand:

```bash
npm run import        # builds, then imports
npm run import:prod   # runs the existing build
```

Takes roughly 70 seconds, most of it downloading. It prints a per-file report
and exits non-zero on failure. Warnings about dangling `datasheet=…`
references are expected: upstream ships child rows for datasheets that are
absent from the export, and those rows are skipped.

## API

All endpoints are `GET`. `:datasheetId` and `:factionId` are upstream ids
(e.g. `SM`, `000000159`).

| Endpoint | Returns |
|---|---|
| `/factions` | All factions |
| `/datasheets/:factionId` | Datasheets belonging to a faction |
| `/datasheets/single/:datasheetId` | A single datasheet |
| `/datasheets-models/:datasheetId` | Model profiles (M, T, Sv, W, Ld, OC) |
| `/datasheets-wargear/:datasheetId` | Weapon profiles (range, A, BS/WS, S, AP, D) |
| `/datasheets-abilities/:datasheetId` | Abilities, grouped by type |
| `/datasheets-options/:datasheetId` | Wargear options |
| `/datasheets-unit-composition/:datasheetId` | `{ costs, comp }` — points and unit composition |
| `/datasheets-stratagems/:datasheetId` | `{ detachments, stratagems }` |
| `/datasheets-leader/:datasheetId` | Leader / attachment pairings |

Known rough edges: a missing datasheet returns the string `'nope'` with a 200
rather than a 404. `/` and `/abilities` are unimplemented stubs.

## Tests

None functional. The only spec is the Nest starter's, which still asserts
`getHello()` returns `"Hello World!"` and fails.

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Authors

- Lyubomir Petkov
- Claude (Anthropic)

## License

MIT
