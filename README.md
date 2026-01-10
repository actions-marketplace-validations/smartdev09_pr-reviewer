# PR Reviewer

Fast, comprehensive PR review tool combining Bun/TypeScript runtime with Python token management.

## Features

- 🔒 **Security Review**: VAPT methodology with OWASP Top 10 coverage
- ✨ **Code Quality**: Best practices and clean code principles
- 💡 **Code Suggestions**: Commitable code improvements
- 📝 **PR Descriptions**: Auto-generated descriptions and walkthroughs
- ⚡ **Fast**: 35-40s execution time (Bun runtime + Python computation)
- 💰 **Cost-Effective**: Token management reduces costs by 40-50%
- 🎯 **Smart**: Handles PRs of any size with intelligent compression

## Architecture

### Hybrid Bun + Python

```
┌─────────────────────────────────────┐
│   Bun/TypeScript (Orchestration)    │
│  - GitHub API integration           │
│  - LLM API calls                    │
│  - Structured output parsing (Zod)  │
│  - Comment formatting & posting     │
└──────────────┬──────────────────────┘
               │ JSON via subprocess
┌──────────────▼──────────────────────┐
│     Python (Token Management)       │
│  - tiktoken (exact token counting)  │
│  - Diff compression                 │
│  - Deletion removal                 │
│  - Greedy file packing              │
│  - Multi-chunk splitting            │
└─────────────────────────────────────┘
```

**Why Hybrid?**
- Bun: Fast startup (15s), modern TypeScript, type-safe
- Python: Mature AI ecosystem (tiktoken, battle-tested logic)
- Combined: 35s total (vs 30s pure Bun without token mgmt, 40s pure Python)

## Quick Start

### Add to Your Repository (5 minutes)

1. **Add OpenAI API Key**:
   - Go to your repo → **Settings** → **Secrets and variables** → **Actions**
   - Add secret: `OPENAI_API_KEY` = your OpenAI API key

2. **Add Workflow File**:
   - Create `.github/workflows/pr-review.yml` in your repo
   - Copy workflow from [setup-workflow.yml](setup-workflow.yml)
   - Replace `yourusername/pr-reviewer@v1` with your action path

3. **Test It**:
   - Create a test PR
   - Watch it get reviewed automatically!

📖 **Full setup guide**: [QUICK_SETUP.md](QUICK_SETUP.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)

### Development (For PR Reviewer Repository)

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
pip install -r python/requirements.txt

# Build
bun run build
```

### Usage (GitHub Action)

```yaml
# .github/workflows/pr-review.yml
name: PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      
      - name: Review PR
        uses: yourorg/pr-reviewer@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Comment-Triggered Reviews

You can also trigger reviews by commenting on existing PRs:

```bash
# Full review
@pr-review

# Security only
@pr-review security

# Code quality only  
@pr-review quality

# Suggestions only
@pr-review suggest

# Help
@pr-review help
```

See [COMMANDS.md](COMMANDS.md) for detailed command documentation.

## Configuration

### Zero Config (Recommended)

Just install and run - sensible defaults included.

### GitHub Action Inputs

```yaml
- uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    
    # Optional customization
    provider: openai  # openai, anthropic, openai-compatible
    model: gpt-4o-mini  # Use cheaper model
    mode: auto  # auto, security-only, quality-only, suggest-only
    
    inline-severity-threshold: high  # critical, high, medium, low
    enable-incremental: auto  # Enable incremental review
    ignore-patterns: |
      **/*.test.ts
      **/*.md
```

### Config File (Advanced)

Create `.pr-review.yaml` in repo root:

```yaml
provider:
  name: openai
  model: gpt-4o

features:
  security:
    enabled: true
  quality:
    enabled: true
  suggestions:
    enabled: true
    max_suggestions_per_file: 3
  incremental:
    enabled: auto
    min_commits: 3

output:
  inline_comments:
    severity_threshold: high
  persistent_comments:
    enabled: true

filters:
  ignore_patterns:
    - "**/*.test.ts"
    - "**/node_modules/**"
```

## Commands

PR Reviewer supports comment-triggered reviews. Comment on any PR with:

- `@pr-review` - Full review (security + quality + suggestions)
- `@pr-review security` - Security-only (VAPT methodology)
- `@pr-review quality` - Code quality only
- `@pr-review suggest` - Code suggestions only
- `@pr-review help` - Show available commands

See [COMMANDS.md](COMMANDS.md) for detailed documentation and examples.

## Development

```bash
# Run locally
bun run dev

# Type check
bun run typecheck

# Test Python module
cd python && pytest

# Test full integration
bun test
```

## Project Structure

```
pr-reviewer/
├── src/                      # TypeScript/Bun (orchestration)
│   ├── main.ts              # Entry point
│   ├── engines/             # Review engines
│   │   ├── security.ts
│   │   ├── quality.ts
│   │   └── suggestions.ts
│   ├── python_bridge.ts     # Python subprocess interface
│   ├── github/              # GitHub API
│   └── types.ts             # Zod schemas
│
├── python/                   # Python (token management)
│   ├── token_manager.py     # Main entry point
│   ├── diff_compressor.py   # Compression logic
│   └── chunker.py           # Multi-chunk splitting
│
├── action.yml               # GitHub Action definition
├── package.json             # Bun dependencies
└── pyproject.toml           # Python dependencies
```

## Benchmarks

| PR Size | Files | Lines | Time | Cost |
|---------|------:|------:|-----:|-----:|
| Small   | 5     | 200   | 35s  | $0.006 |
| Medium  | 15    | 800   | 45s  | $0.02 |
| Large   | 50    | 2000  | 70s  | $0.06 |
| Huge    | 150   | 8000  | 120s | $0.15 |

## Comparison

| Feature | Saltman | PR-Agent | PR Reviewer |
|---------|:-------:|:--------:|:-----------:|
| Handles large PRs | ❌ | ✅ | ✅ |
| Structured outputs | ✅ | ❌ | ✅ |
| Speed (small PR) | 30s | 55s | 35s |
| Cost (large PR) | ❌ Fails | $0.10 | $0.06 |
| Complexity | Simple | High | Balanced |

## License

MIT

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
