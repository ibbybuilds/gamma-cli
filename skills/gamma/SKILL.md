---
name: gamma
description: Create presentations, documents, webpages, and social posts using the Gamma API. Use when the user asks to create slides, presentations, decks, documents, or any Gamma content.
argument-hint: [topic or content description]
---

# Gamma CLI — Agent Skill

Create presentations, documents, webpages, and social posts via the Gamma API using `gamma` CLI.

## Setup

```bash
gamma config set apiKey YOUR_KEY  # one-time, stored in ~/.gamma-cli/config.json
```

## Commands

### Generate Content

```bash
# Simple presentation (waits for completion, returns URL)
gamma generate -i "Topic: Quarterly Business Review" -m generate

# With all the bells and whistles
gamma generate -i "Guide to machine learning" -m generate \
  --type document \
  --amount detailed \
  --tone professional \
  --audience "engineering managers" \
  --language es \
  --image-source aiGenerated \
  --image-style "minimalist flat illustrations" \
  --dimensions 16x9 \
  -n 8 \
  --export pdf

# From file
gamma generate -i @notes.txt -m preserve

# Pipe content in
echo "My raw content" | gamma generate -m condense -n 5

# Fire-and-forget
gamma generate -i "AI trends" -m generate --no-wait
# -> {"generationId":"abc123","status":"submitted"}

# Open in browser when done
gamma generate -i "Sales deck" -m generate --open

# Preview without sending (no API key needed)
gamma generate -i "test" -m generate --type document --dry-run

# Full control with raw JSON body
gamma generate --json-body '{"inputText":"hello","textMode":"generate","format":"presentation"}'
```

### Generate from Template

```bash
gamma template -g TEMPLATE_ID -p "Fill with Q4 results"
gamma template -g TEMPLATE_ID -p @brief.txt --export pptx --open
```

### List Themes & Folders

```bash
gamma themes --all                    # all themes (paginated automatically)
gamma themes -q "modern" -l 10       # search
gamma --format table themes -l 5     # human-readable table
gamma folders --all
```

### Check Status

```bash
gamma status GENERATION_ID            # one-time check
gamma status GENERATION_ID --wait     # poll until done
```

### Config

```bash
gamma config set apiKey YOUR_KEY      # store key persistently
gamma config get apiKey               # check (masked)
gamma config list                     # all config
gamma config delete apiKey            # remove
```

## Output Formats

```bash
gamma --format json themes     # JSON (default, best for agents)
gamma --format table themes    # aligned text table with pagination hints
gamma --format yaml themes     # YAML
gamma --pretty themes          # shorthand for --format table
```

## Key Options for `generate`

| Flag | Values | Description |
|------|--------|-------------|
| `-i, --input` | text, `@file`, `-` (stdin) | Input content |
| `-m, --mode` | `generate`, `condense`, `preserve` | How to handle input text |
| `--type` | `presentation`, `document`, `webpage`, `social` | Content type |
| `-n, --num-cards` | 1-75 | Number of cards |
| `--amount` | `brief`, `medium`, `detailed`, `extensive` | Text density |
| `--tone` | any string | Voice/mood |
| `--audience` | any string | Target audience |
| `--language` | ISO code | Output language |
| `--image-source` | `aiGenerated`, `pexels`, `noImages`, etc. | Image source |
| `--image-model` | model ID | AI image model |
| `--image-style` | any string | Image style direction |
| `--export` | `pdf`, `pptx` | Export format (URL in response) |
| `--dimensions` | `fluid`, `16x9`, `4x3`, `1x1`, etc. | Card dimensions |
| `--email` | addresses... | Share via email |
| `--json-body` | JSON string | Raw API body (full control) |
| `--no-wait` | - | Don't poll, return ID immediately |
| `--open` | - | Open result in browser |
| `--dry-run` | - | Preview request body |

## Agent Workflow Patterns

### Pattern 1: Quick generate (blocking)
```bash
gamma generate -i "..." -m generate
# Blocks ~20-60s, returns JSON with gammaUrl
```

### Pattern 2: Async (fire-and-forget)
```bash
gamma generate -i "..." -m generate --no-wait
# Returns immediately with generationId
# ... agent does other work ...
gamma status GENERATION_ID --wait
# Returns when complete
```

### Pattern 3: Validation before spend
```bash
gamma generate -i "..." -m generate --dry-run
# Shows what would be sent, no credits spent
```

## Response Examples

### Completed:
```json
{"generationId":"xxx","status":"completed","gammaUrl":"https://gamma.app/docs/yyy","credits":{"deducted":27,"remaining":4157}}
```

### With export:
```json
{"generationId":"xxx","status":"completed","gammaUrl":"https://gamma.app/docs/yyy","exportUrl":"https://assets.api.gamma.app/export/pdf/...","credits":{...}}
```

### Error (stderr, exit 1):
```json
{"error":"Invalid value for mode: \"bad\"","allowed":["generate","condense","preserve"],"suggestion":"Use one of: generate, condense, preserve"}
```

## Validation

The CLI validates enum values locally before calling the API:
- `--mode`: generate, condense, preserve
- `--type`: presentation, document, webpage, social
- `--amount`: brief, medium, detailed, extensive
- `--image-source`: aiGenerated, pictographic, pexels, giphy, webAllImages, webFreeToUse, webFreeToUseCommercially, placeholder, noImages
- `--export`: pdf, pptx
- `--num-cards`: 1-75

Invalid values produce structured JSON errors with the list of allowed values.

## Exit Codes

- `0` - success
- `1` - error (validation, API error, timeout, generation failed)
