# 🚀 Quick Setup: Add PR Reviewer to Your Repo

**Time required: 5 minutes**

## Step 1: Add OpenAI API Key (1 minute)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key (copy it!)
3. In your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `OPENAI_API_KEY`, Value: (paste your key)
6. Click **Add secret**

✅ Done!

---

## Step 2: Add Workflow File (2 minutes)

**Option A: Via GitHub UI (Easiest)**

1. In your repo, click **Actions** tab
2. Click **New workflow** (or **set up a workflow yourself**)
3. Click **Skip this** (or create a simple workflow)
4. Name it: `pr-review.yml`
5. Delete the example code, paste this:

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
        uses: yourusername/pr-reviewer@v1  # TODO: Update this!
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

6. **Important**: Replace `yourusername/pr-reviewer@v1` with:
   - If you published the action: `yourusername/pr-reviewer@v1`
   - If using from local repo: See "Using Local Action" below
   - If action is not published yet: You'll need to publish it first (see "Publishing" below)

7. Click **Start commit** → **Commit new file**

✅ Done!

**Option B: Via Git (Faster)**

1. In your repo, create file: `.github/workflows/pr-review.yml`

2. Paste the workflow code above (same as Option A)

3. Commit and push:
   ```bash
   git add .github/workflows/pr-review.yml
   git commit -m "Add PR Reviewer workflow"
   git push
   ```

✅ Done!

---

## Step 3: Test It! (2 minutes)

1. Create a test branch:
   ```bash
   git checkout -b test-pr-reviewer
   ```

2. Make a small change:
   ```bash
   echo "# Test change" >> README.md
   git add README.md
   git commit -m "Test PR Reviewer"
   git push origin test-pr-reviewer
   ```

3. Create a Pull Request:
   - Go to your repo on GitHub
   - Click **Pull requests** → **New pull request**
   - Select `test-pr-reviewer` → `main`
   - Click **Create pull request**

4. Watch it work! 🪄
   - Go to **Actions** tab → See "PR Review" running
   - After 30-60 seconds, check your PR
   - You should see review comments!

✅ Done!

---

## 🎉 That's It!

Your repository now has AI-powered PR reviews!

### What Happens Now?

- ✅ **Every PR** gets automatically reviewed
- ✅ **Security issues** are flagged (critical/high → inline comments)
- ✅ **Code quality** issues are identified (medium/low → aggregated comment)
- ✅ **Code suggestions** are provided (improvements)

### Cost

- **Small PRs (5 files)**: ~$0.01 each
- **Medium PRs (15 files)**: ~$0.02-0.05 each
- **Monthly estimate**: $5-20 for typical usage

---

## 🆘 Troubleshooting

### "Action not found" error

**Problem**: `uses: yourusername/pr-reviewer@v1` fails

**Solution**: You need to publish the action first, or use a local path.

**Quick fix (for testing)**:
1. Copy the entire `pr-reviewer` repository into your repo as a subdirectory
2. Use: `uses: ./pr-reviewer` instead

**Proper fix (for production)**:
1. Push `pr-reviewer` repo to GitHub (separate repository)
2. Create a release (`v1.0.0`)
3. Update workflow to use: `yourusername/pr-reviewer@v1`

### "Secret not found" error

**Problem**: `OPENAI_API_KEY` not found

**Solution**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify secret exists and is named exactly `OPENAI_API_KEY`
3. Re-run the workflow

### Workflow doesn't run

**Problem**: Created workflow but nothing happens on PR

**Solutions**:
1. Check workflow file is in `.github/workflows/` (not `.github/workflow/`)
2. Ensure workflow is committed to `main` branch (not in a PR)
3. Verify trigger: `on: pull_request: types: [opened, synchronize]`

---

## 📝 Optional: Customize

Edit `.github/workflows/pr-review.yml` to customize:

```yaml
- name: Review PR
  uses: yourusername/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    
    # Customize these:
    model: gpt-4o-mini  # Cheaper model (~5x cheaper)
    mode: security-only  # Only security review
    inline-severity-threshold: medium  # More inline comments
    ignore-patterns: |
      **/*.test.ts
      **/*.md
```

---

## 🚀 Next Steps

1. **Test it**: Create a test PR and watch it review
2. **Customize**: Adjust settings for your needs
3. **Add comment triggers**: See [COMMANDS.md](COMMANDS.md) to enable `@pr-review` commands
4. **Monitor costs**: Track usage in OpenAI dashboard

---

## 📚 More Help

- 📖 [Full Setup Guide](SETUP_GUIDE.md) - Detailed instructions
- 🚀 [Quick Start](QUICKSTART.md) - Usage examples
- 💬 [Commands](COMMANDS.md) - Comment-triggered reviews
- 🐛 [Troubleshooting](SETUP_GUIDE.md#-troubleshooting) - Common issues

---

**Need help?** Open an issue or ask in discussions! 🆘
