<div align="center">

<br>

<h1>⚡ gamma-cli</h1>

<p><strong>Create presentations, documents, webpages & social posts — right from your terminal.</strong></p>

<br>

[![npm version](https://img.shields.io/npm/v/gamma-cli.svg?style=flat-square)](https://www.npmjs.com/package/gamma-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)

<br>

A CLI wrapper for the [Gamma API](https://developers.gamma.app) — built for both humans and AI agents.

Bundled with an [Agent Skill](https://agentskills.io) for automatic discovery by **30+ AI coding tools**.

<br>

</div>

---

<br>

## 📟 Quick Start

```bash
npm install -g gamma-cli
```

```bash
# Store your API key (one-time)
gamma config set apiKey sk-gamma-xxxxx
```

> Get your key at [gamma.app/settings](https://gamma.app/settings) — requires Pro+ plan.

<br>

## ⚡ One-liner

```bash
gamma generate -i "5 trends in AI for 2026" -m generate
```

```json
{
  "generationId": "abc",
  "status": "completed",
  "gammaUrl": "https://gamma.app/docs/xyz",
  "credits": { "deducted": 27, "remaining": 4130 }
}
```

That's it. One command → a full presentation with a shareable link.

<br>

---

<br>

## 🎯 Why gamma-cli?

| | |
|---|---|
| **JSON output by default** | Agents parse it directly, humans add `--pretty` |
| **3 output formats** | JSON · table · YAML |
| **Async workflows** | `--no-wait` to fire-and-forget, `status --wait` to poll |
| **Input flexibility** | Inline text · `@filepath` · pipe via stdin |
| **Local validation** | Catches bad values before calling the API (saves credits) |
| **`--dry-run`** | Preview what would be sent — zero credits spent |
| **`--json-body`** | Raw JSON escape hatch for full API control |
| **`--open`** | Auto-open result in browser |
| **Config persistence** | `gamma config set apiKey` stores key securely |
| **Single dependency** | Just `commander` — built with TypeScript + tsup |

<br>

---

<br>

## 📝 Usage

### Generate content

```bash
# Simple presentation
gamma generate -i "Machine learning fundamentals" -m generate

# Full control
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
gamma generate -i @research-notes.txt -m preserve

cat article.md | gamma generate -m condense -n 5
```

### From a template

```bash
gamma template -g TEMPLATE_ID -p "Fill this sales deck with Q4 results"
```

### Browse themes

```bash
gamma themes --all                    # all themes (JSON)
gamma --format table themes -l 5     # human-readable table
gamma themes -q "modern"             # search
```

### Check status

```bash
gamma status GENERATION_ID            # one-time check
gamma status GENERATION_ID --wait     # poll until complete
```

### Preview before spending credits

```bash
gamma generate -i "test" -m generate --type document --dry-run
```

```json
{
  "dryRun": true,
  "method": "POST",
  "path": "/v1.0/generations",
  "body": { "inputText": "test", "textMode": "generate", "format": "document" }
}
```

<br>

---

<br>

## 🎨 Output Formats

```bash
gamma --format json themes       # JSON (default — best for agents)
gamma --format table themes      # aligned text table
gamma --format yaml themes       # YAML
gamma --pretty themes            # shorthand for --format table
```

<br>

---

<br>

## 📃 All Options

### `gamma generate`

| Flag | Values | Description |
|------|--------|-------------|
| `-i, --input` | text, `@file`, `-` | Input content |
| `-m, --mode` | `generate` · `condense` · `preserve` | How to process input |
| `--type` | `presentation` · `document` · `webpage` · `social` | Content type |
| `-n, --num-cards` | 1–75 | Number of cards |
| `-t, --theme` | ID | Theme (from `gamma themes`) |
| `--amount` | `brief` · `medium` · `detailed` · `extensive` | Text density |
| `--tone` | string | Voice/mood |
| `--audience` | string | Target audience |
| `--language` | ISO code | Output language |
| `--image-source` | `aiGenerated` · `pexels` · `noImages` ... | Image source |
| `--image-model` | ID | AI image model |
| `--image-style` | string | Style direction |
| `--dimensions` | `fluid` · `16x9` · `4x3` · `1x1` ... | Aspect ratio |
| `--export` | `pdf` · `pptx` | Export format |
| `--email` | addresses | Share via email |
| `--json-body` | JSON | Raw API body |
| `--no-wait` | — | Return ID immediately |
| `--open` | — | Open in browser |
| `--dry-run` | — | Preview without sending |

### `gamma template`

| Flag | Values | Description |
|------|--------|-------------|
| `-g, --gamma-id` | ID | Template ID (required) |
| `-p, --prompt` | text, `@file` | Content prompt |
| `-t, --theme` | ID | Override template theme |
| `--export` | `pdf` · `pptx` | Export format |
| `--image-style` | string | Image style |
| `--open` | — | Open in browser |

### `gamma config`

```bash
gamma config set <key> <value>    # set a value
gamma config get <key>            # read a value
gamma config delete <key>         # remove a value
gamma config list                 # show all config
```

<br>

---

<br>

## 🛡️ Input Validation

Bad values are caught **locally** before hitting the API — saves credits, gives instant feedback:

```bash
$ gamma generate -i "test" --mode badvalue
```
```json
{
  "error": "Invalid value for mode: \"badvalue\"",
  "allowed": ["generate", "condense", "preserve"],
  "suggestion": "Use one of: generate, condense, preserve"
}
```

<br>

---

<br>

## 🤖 Agent Skill

This repo ships with an [Agent Skill](https://agentskills.io) at `skills/gamma/SKILL.md` — compatible with **30+ AI coding tools** including Claude Code, Cursor, Windsurf, and Copilot.

### Install via skills.sh

```bash
npx skills add ibbybuilds/gamma-cli
```

### Or copy manually

```bash
# Claude Code
cp -r skills/gamma ~/.claude/skills/

# Cursor / VS Code Copilot
cp -r skills/gamma .cursor/skills/
```

<br>

### Agent workflow patterns

<table>
<tr>
<td><strong>Pattern</strong></td>
<td><strong>Usage</strong></td>
</tr>
<tr>
<td>Blocking</td>
<td>

```bash
gamma generate -i "quarterly review" -m generate
# Waits ~30-60s, returns JSON with gammaUrl
```

</td>
</tr>
<tr>
<td>Async</td>
<td>

```bash
gamma generate -i "quarterly review" -m generate --no-wait
# {"generationId":"abc","status":"submitted"}

# ... agent does other work ...

gamma status abc --wait
# {"status":"completed","gammaUrl":"https://..."}
```

</td>
</tr>
<tr>
<td>Preview</td>
<td>

```bash
gamma generate -i "test" -m generate --dry-run
# Zero credits spent
```

</td>
</tr>
</table>

<br>

### Why CLI over MCP?

| | CLI | MCP |
|---|---|---|
| **Schema tokens** | 0 | 28,000+ |
| **Training data** | Billions of CLI examples | Custom schemas |
| **Composability** | Pipes, files, chaining | Single tool calls |
| **Error handling** | Exit codes + JSON | Protocol errors |
| **Async** | `--no-wait` + `status` | Requires session |

<br>

---

<br>

## 🔌 API Coverage

| Endpoint | Command | Status |
|----------|---------|--------|
| `POST /v1.0/generations` | `gamma generate` | ✅ |
| `POST /v1.0/generations/from-template` | `gamma template` | ✅ |
| `GET /v1.0/generations/{id}` | `gamma status` | ✅ |
| `GET /v1.0/themes` | `gamma themes` | ✅ |
| `GET /v1.0/folders` | `gamma folders` | ✅ |

**100% of the Gamma API is covered.**

<br>

---

<br>

## 🛠️ Development

```bash
git clone https://github.com/ibbybuilds/gamma-cli
cd gamma-cli
npm install
npm run build         # tsup → dist/cli.js
npm run typecheck     # tsc --noEmit
npm test              # build + 13 tests
npm run dev           # tsup --watch
npm link              # global `gamma` command
```

<br>

---

<br>

## 📄 License

MIT — do whatever you want.

<br>

---

<div align="center">

<br>

**Built for humans and AI agents.**

<br>

</div>
