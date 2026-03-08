---
name: gamma
description: Create presentations, documents, webpages, and social posts using the Gamma API. Use when the user asks to create slides, presentations, decks, documents, pitch decks, reports, or any visual content. Also use when they say things like "make a deck", "turn this into slides", "create a pptx", "I need a presentation for my meeting", or want to convert notes/text into polished visual content. Even if they don't mention Gamma by name, if the task is about generating presentations or documents from text, this is the right skill.
argument-hint: [topic or content description]
---

# Gamma CLI — Agent Skill

Create presentations, documents, webpages, and social posts via the Gamma API using the `gamma` CLI.

## Before You Start

Check if the API key is configured:

```bash
gamma config get apiKey
```

If it returns `null`, the user needs to set one up. Tell them:
- "You'll need a Gamma API key to create content. You can get one at gamma.app/settings (requires a Pro+ plan)."
- They can either set it globally so you don't need to ask again: `gamma config set apiKey sk-gamma-xxxxx`
- Or set it for the current session only: `export GAMMA_API_KEY=sk-gamma-xxxxx`

Don't ask for the key directly — let the user decide how to provide it.

## Deciding What to Generate

### Choosing `--mode` (how to handle the user's input)

This is the most important decision. Think about what the user gave you:

- **`generate`** — The user gave you a topic, brief, or short description. Gamma will expand it into full content. Use this when the input is a prompt like "AI trends in 2026" or "onboarding process for new hires".
- **`preserve`** — The user gave you finished text they want to keep as-is (a blog post, report, meeting notes, markdown doc). Gamma will lay it out visually without rewriting. Use this when the user says "turn this into..." or provides substantial existing content.
- **`condense`** — The user gave you long content they want shortened. Gamma will distill it into key points. Use this when the user says "summarize this" or "make this brief".

When in doubt between `generate` and `preserve`: if the input is more than a couple paragraphs of real content, lean toward `preserve`. If it's a short prompt or topic description, use `generate`.

### Choosing `--type` (output format)

- **`presentation`** (default) — Slides. Use for meetings, pitches, talks, decks. This is the most common choice.
- **`document`** — Long-form. Use when the user says "document", "report", "write-up", or wants something read rather than presented.
- **`webpage`** — Web page. Use when the user explicitly wants a web page or landing page.
- **`social`** — Social media cards. Use when the user mentions social posts.

If the user says "deck" or "slides" or "pptx", they mean `presentation`. If they say "doc" or "pdf to share", they likely mean `document`.

### Choosing `--amount` (text density)

Only set this if the user hints at length:
- "keep it brief" / "high-level" → `brief`
- "quick overview" → `medium`
- "detailed" / "thorough" / "comprehensive" → `detailed`
- "cover everything" / "deep dive" → `extensive`

If the user doesn't mention length, don't set it — Gamma's default is fine.

## Commands

### Generate Content

```bash
# Simple — just a topic
gamma generate -i "Quarterly Business Review Q3 2025" -m generate

# User provided actual content to preserve
gamma generate -i "the user's full text here" -m preserve --type document

# Summarize long content into a short deck
gamma generate -i @long-report.txt -m condense -n 5

# All options
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

# Fire-and-forget (returns immediately, poll later)
gamma generate -i "AI trends" -m generate --no-wait

# Open in browser when done
gamma generate -i "Sales deck" -m generate --open

# Preview without spending credits
gamma generate -i "test" -m generate --dry-run
```

### Generate from Template

```bash
gamma template -g TEMPLATE_ID -p "Fill with Q4 results"
gamma template -g TEMPLATE_ID -p @brief.txt --export pptx --open
```

### List Themes & Folders

```bash
gamma themes --all                    # all themes
gamma themes -q "modern" -l 10       # search
gamma folders --all
```

### Check Status

```bash
gamma status GENERATION_ID            # one-time check
gamma status GENERATION_ID --wait     # poll until done
```

### Config

```bash
gamma config set apiKey YOUR_KEY
gamma config get apiKey
gamma config list
gamma config delete apiKey
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
| `--export` | `pdf`, `pptx` | Export format (URL in response) |
| `--dimensions` | `fluid`, `16x9`, `4x3`, `1x1`, etc. | Card dimensions |
| `--no-wait` | - | Return ID immediately, poll with `gamma status` |
| `--open` | - | Open result in browser |
| `--dry-run` | - | Preview request body, no credits spent |

## Workflow Patterns

**Blocking (simple):** Just run it and wait. Takes 20-60 seconds.
```bash
gamma generate -i "..." -m generate
# Returns JSON with gammaUrl
```

**Async (for multitasking):** Start generation, do other work, check later.
```bash
gamma generate -i "..." -m generate --no-wait
# Returns: {"generationId":"abc","status":"submitted"}
gamma status abc --wait
# Returns when complete with gammaUrl
```

## Presenting Results to the User

When generation completes, you'll get JSON like:
```json
{"generationId":"xxx","status":"completed","gammaUrl":"https://gamma.app/docs/yyy","credits":{"deducted":27,"remaining":4130}}
```

Share the `gammaUrl` with the user — that's their presentation/document link. If they asked for an export (`--export pdf`), also share the `exportUrl`.

## Error Recovery

If you get an error:
- **"No API key"** — Guide the user through setup (see "Before You Start")
- **Validation error** (exit code 1) — The CLI caught a bad parameter locally. Read the error JSON — it lists allowed values. Fix and retry.
- **API error** — Check the error message. Common causes: invalid API key, rate limiting, insufficient credits.
- **Timeout** — The generation took too long. Use `gamma status GENERATION_ID --wait` to check if it's still running.

## Validation

The CLI validates these locally (no API call needed):
- `--mode`: generate, condense, preserve
- `--type`: presentation, document, webpage, social
- `--amount`: brief, medium, detailed, extensive
- `--image-source`: aiGenerated, pictographic, pexels, giphy, webAllImages, webFreeToUse, webFreeToUseCommercially, placeholder, noImages
- `--export`: pdf, pptx
- `--num-cards`: 1-75
