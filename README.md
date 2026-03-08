<div align="center">

# gamma-cli

Create presentations, documents, webpages & social posts from the terminal.

[![npm version](https://img.shields.io/npm/v/gamma-cli.svg?style=flat)](https://www.npmjs.com/package/gamma-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

<br>

A CLI wrapper for the [Gamma API](https://developers.gamma.app) — designed for both humans and AI agents. Bundled with an [Agent Skill](https://agentskills.io) for automatic discovery by 30+ AI coding tools.

<br>

## Highlights

- **JSON output by default** — agents parse it, humans add `--pretty`
- **3 output formats** — JSON, table, YAML
- **Async workflows** — `--no-wait` to fire-and-forget, `status --wait` to poll
- **Input flexibility** — inline text, `@filepath`, or pipe via stdin
- **Local validation** — catches bad values before calling the API (saves credits)
- **`--dry-run`** — preview what would be sent without spending a single credit
- **`--json-body`** — raw JSON escape hatch for full API control
- **`--open`** — auto-open result in browser
- **Config persistence** — `gamma config set apiKey` stores key securely
- **Single dependency** — just `commander`, built with TypeScript + tsup

<br>

## Install

```bash
npm install -g gamma-cli
```

<br>

## Setup

Get your API key from [gamma.app/settings](https://gamma.app/settings) (requires Pro+ plan).

```bash
# Persistent (recommended)
gamma config set apiKey sk-gamma-xxxxx

# Or session-only
export GAMMA_API_KEY=sk-gamma-xxxxx
```

<br>

## Usage

### Create a presentation

```bash
gamma generate -i "5 trends in AI for 2026" -m generate
```

```json
{"generationId":"abc","status":"completed","gammaUrl":"https://gamma.app/docs/xyz","credits":{"deducted":27,"remaining":4130}}
```

### With all the options

```bash
gamma generate \
  -i "Machine learning fundamentals" \
  -m generate \
  --type document \
  --amount detailed \
  --tone "professional and concise" \
  --audience "engineering managers" \
  --language es \
  --image-source aiGenerated \
  --image-style "minimalist flat illustrations" \
  --dimensions 16x9 \
  -n 8 \
  --export pdf \
  --open
```

### From a file or stdin

```bash
# Read from file
gamma generate -i @research-notes.txt -m preserve

# Pipe in
cat article.md | gamma generate -m condense -n 5
```

### From a template

```bash
gamma template -g TEMPLATE_ID -p "Fill this sales deck with Q4 results"
```

### Browse themes

```bash
# JSON (default)
gamma themes --all

# Human-readable table
gamma --format table themes -l 5

# Search
gamma themes -q "modern"
```

### Check status

```bash
gamma status GENERATION_ID          # one-time check
gamma status GENERATION_ID --wait   # poll until complete
```

### Preview before spending credits

```bash
gamma generate -i "test" -m generate --type document --dry-run
```

```json
{"dryRun":true,"method":"POST","path":"/v1.0/generations","body":{"inputText":"test","textMode":"generate","format":"document"}}
```

<br>

## Output Formats

```bash
gamma --format json themes       # JSON (default, for agents)
gamma --format table themes      # aligned text table
gamma --format yaml themes       # YAML
gamma --pretty themes            # shorthand for --format table
```

<br>

## All Options

### `gamma generate`

| Option | Values | Description |
|--------|--------|-------------|
| `-i, --input` | text, `@file`, `-` | Input content |
| `-m, --mode` | `generate` `condense` `preserve` | How to process input |
| `--type` | `presentation` `document` `webpage` `social` | Content type |
| `-n, --num-cards` | 1-75 | Number of cards |
| `-t, --theme` | ID | Theme (from `gamma themes`) |
| `--amount` | `brief` `medium` `detailed` `extensive` | Text density |
| `--tone` | string | Voice/mood |
| `--audience` | string | Target audience |
| `--language` | ISO code | Output language |
| `--image-source` | `aiGenerated` `pexels` `noImages` ... | Image source |
| `--image-model` | ID | AI image model |
| `--image-style` | string | Style direction |
| `--dimensions` | `fluid` `16x9` `4x3` `1x1` ... | Aspect ratio |
| `--export` | `pdf` `pptx` | Export format |
| `--email` | addresses | Share via email |
| `--json-body` | JSON | Raw API body |
| `--no-wait` | | Return ID immediately |
| `--open` | | Open in browser |
| `--dry-run` | | Preview without sending |

### `gamma template`

| Option | Values | Description |
|--------|--------|-------------|
| `-g, --gamma-id` | ID | Template ID (required) |
| `-p, --prompt` | text, `@file` | Content prompt |
| `-t, --theme` | ID | Override template theme |
| `--export` | `pdf` `pptx` | Export format |
| `--image-style` | string | Image style |
| `--open` | | Open in browser |

### `gamma config`

```bash
gamma config set <key> <value>    # set a value
gamma config get <key>            # get a value
gamma config delete <key>         # remove a value
gamma config list                 # show all config
```

<br>

## Input Validation

Bad values are caught locally before hitting the API:

```bash
$ gamma generate -i "test" --mode badvalue
```
```json
{"error":"Invalid value for mode: \"badvalue\"","allowed":["generate","condense","preserve"],"suggestion":"Use one of: generate, condense, preserve"}
```

<br>

## Agent Skill

This repo includes an [Agent Skill](https://agentskills.io) at `skills/gamma/SKILL.md` — compatible with 30+ AI coding agents.

### Install via skills.sh

```bash
npx skills add YOUR_USERNAME/gamma-cli
```

### Or copy manually

```bash
# Claude Code
cp -r skills/gamma ~/.claude/skills/

# Cursor / VS Code Copilot
cp -r skills/gamma .cursor/skills/
```

### Agent workflow patterns

**Blocking** — simple, one command:
```bash
gamma generate -i "quarterly review" -m generate
# Waits ~30-60s, returns JSON with gammaUrl
```

**Async** — for multitasking agents:
```bash
gamma generate -i "quarterly review" -m generate --no-wait
# {"generationId":"abc","status":"submitted"}

# ... agent does other work ...

gamma status abc --wait
# {"status":"completed","gammaUrl":"https://..."}
```

**Preview** — zero cost:
```bash
gamma generate -i "test" -m generate --dry-run
```

### Why CLI over MCP?

| | CLI | MCP |
|---|---|---|
| Schema tokens | 0 | 28,000+ |
| Training data | Billions of CLI examples | Custom schemas |
| Composability | Pipes, files, chaining | Single tool calls |
| Error handling | Exit codes + JSON | Protocol errors |
| Async | `--no-wait` + `status` | Requires session |

<br>

## Development

```bash
git clone https://github.com/YOUR_USERNAME/gamma-cli
cd gamma-cli
npm install
npm run build         # tsup -> dist/cli.js
npm run typecheck     # tsc --noEmit
npm test              # build + tests (13 tests)
npm run dev           # tsup --watch
npm link              # global `gamma` command
```

<br>

## API Coverage

| Endpoint | Command | Description |
|----------|---------|-------------|
| `POST /v1.0/generations` | `gamma generate` | Create from scratch |
| `POST /v1.0/generations/from-template` | `gamma template` | Create from template |
| `GET /v1.0/generations/{id}` | `gamma status` | Check/poll status |
| `GET /v1.0/themes` | `gamma themes` | List themes |
| `GET /v1.0/folders` | `gamma folders` | List folders |

100% of the Gamma API is covered.

<br>

## License

MIT

<br>

---

<div align="center">

Built for humans and AI agents.

</div>
