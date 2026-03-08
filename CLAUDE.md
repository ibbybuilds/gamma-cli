# gamma-cli

TypeScript CLI wrapping the Gamma API. Built with `tsup`, single runtime dependency: `commander`.

## Build & Test

```bash
npm run build       # tsup -> dist/cli.js
npm run typecheck   # tsc --noEmit
npm test            # build + node --test
npm run dev         # tsup --watch
```

## Project Structure

```
src/
  cli.ts                  # Entry point, registers commands
  commands/
    generate.ts           # POST /generations
    template.ts           # POST /generations/from-template
    themes.ts             # GET /themes
    folders.ts            # GET /folders
    status.ts             # GET /generations/{id}
    config.ts             # Local config management
  utils/
    api.ts                # HTTP client, auth, polling
    config.ts             # ~/.gamma-cli/config.json read/write
    output.ts             # JSON/table/YAML formatters
    validate.ts           # Enum validation with allowed-values errors
    open.ts               # Cross-platform browser open
test/
  cli.test.js             # CLI integration tests
  output.test.js          # Output formatting tests
```

## Key Design Decisions

- **JSON output by default** — agents parse directly, `--format table|yaml` for humans
- **Local validation** — catches bad enum values before API call (saves credits)
- **`--dry-run`** — preview request body without spending credits
- **`--json-body`** — raw JSON escape hatch for full API control
- **`--no-wait` + `status --wait`** — async workflow for agents
- **`--open`** — auto-open result in browser
- **`@filepath` + stdin** — flexible input sources
- **Config file** — persistent API key in `~/.gamma-cli/config.json` (mode 0o600)
- **Env var override** — `GAMMA_API_KEY` env var takes priority over config

## API

- **Base URL**: `https://public-api.gamma.app/v1.0`
- **Auth**: `X-API-KEY` header
- **Endpoints**: POST `/generations`, POST `/generations/from-template`, GET `/generations/{id}`, GET `/themes`, GET `/folders`
