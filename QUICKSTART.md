# Quick Start Guide

Get PR Reviewer running in under 5 minutes!

## Step 1: Add API Key

1. Go to [OpenAI](https://platform.openai.com/api-keys) and create an API key
2. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENAI_API_KEY`
5. Value: Your OpenAI API key
6. Click **Add secret**

## Step 2: Create Workflow File

Create `.github/workflows/pr-review.yml` in your repository:

```yaml
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

## Step 3: Create a Test PR

1. Make a code change
2. Create a pull request
3. Watch the action run!

**Or trigger manually on existing PR:**

Just comment `@pr-review` on any PR to trigger a review!

## That's it! 🎉

The action will:
- ✅ Analyze your code for security issues
- ✅ Review code quality
- ✅ Suggest improvements
- ✅ Post comments on your PR

## Bonus: Comment Commands

You can also trigger reviews by commenting on PRs:

- `@pr-review` - Full review
- `@pr-review security` - Security-only
- `@pr-review quality` - Code quality only
- `@pr-review suggest` - Suggestions only

See [COMMANDS.md](COMMANDS.md) for details.

## Customization (Optional)

### Use Cheaper Model

```yaml
- uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    model: gpt-4o-mini  # Cheaper model (~5x cheaper)
```

### Security-Only Mode

```yaml
- uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    mode: security-only
```

### Ignore Files

```yaml
- uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    ignore-patterns: |
      **/*.test.ts
      **/*.md
      **/node_modules/**
```

## Cost Estimate

| PR Size | Files | Cost (gpt-4o-mini) | Time |
|---------|------:|-------------------:|-----:|
| Small   | 1-5   | ~$0.01             | 35s  |
| Medium  | 6-20  | ~$0.02-0.05        | 45s  |
| Large   | 21-50 | ~$0.06-0.10        | 60s  |

**Monthly estimate**: $5-20 for typical repo (50-200 PRs/month)

## Troubleshooting

### "Not running in a pull request context"

Make sure the workflow is triggered by `pull_request` event, not `push`.

### "Python bridge test failed"

The action automatically installs Python dependencies. Check GitHub Actions logs for errors.

### "API key invalid"

Double-check your `OPENAI_API_KEY` secret is correct.

### "Rate limit exceeded"

OpenAI has rate limits. Upgrade your OpenAI tier or reduce PR frequency.

## Next Steps

- Read the full [README](README.md)
- See [all configuration options](README.md#configuration)
- Check out [examples](/.github/workflows/example.yml)
- [Contribute](CONTRIBUTING.md)

## Support

- 🐛 [Report bugs](https://github.com/yourorg/pr-reviewer/issues)
- 💡 [Request features](https://github.com/yourorg/pr-reviewer/issues)
- 💬 [Ask questions](https://github.com/yourorg/pr-reviewer/discussions)
