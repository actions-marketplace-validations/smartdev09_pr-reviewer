# Setup Guide: Add PR Reviewer to Your GitHub Repository

Follow these steps to add PR Reviewer to your existing GitHub repository.

## 🚀 Quick Setup (5 minutes)

### Step 1: Add OpenAI API Key Secret

1. Go to your GitHub repository
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
6. Click **Add secret**

✅ **Done!** Your API key is now stored securely.

---

### Step 2: Add Automatic PR Review Workflow

1. In your repository, go to **Actions** tab
2. Click **New workflow** (or **Set up a workflow yourself** if no workflows exist)
3. Click **Set up a workflow** → **Simple workflow** (or **Skip this**)
4. Delete the example content, then paste this:

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    name: Review PR
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Review PR
        uses: yourorg/pr-reviewer@v1  # TODO: Update with your action path
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

5. **Important**: Replace `yourorg/pr-reviewer@v1` with one of:
   - If you published the action: `yourusername/pr-reviewer@v1`
   - If using locally: `./` (see "Using Local Action" below)
6. Click **Start commit** → **Commit new file**
7. Commit to `main` branch

✅ **Done!** Automatic reviews are now enabled.

---

### Step 3: Test It!

1. Create a test branch:
   ```bash
   git checkout -b test-pr-reviewer
   ```

2. Make a small change:
   ```bash
   echo "// Test change" >> README.md
   git add README.md
   git commit -m "Test PR Reviewer"
   git push origin test-pr-reviewer
   ```

3. Create a Pull Request:
   - Go to your repository on GitHub
   - Click **Pull requests** → **New pull request**
   - Select `test-pr-reviewer` → `main`
   - Click **Create pull request**

4. Watch the magic happen! 🪄
   - Go to **Actions** tab → You'll see "PR Review" running
   - After 30-60 seconds, go back to your PR
   - You should see review comments!

✅ **Congratulations!** PR Reviewer is now working on your repository.

---

## 📝 Optional: Add Comment-Triggered Reviews

If you want to trigger reviews by commenting `@pr-review` on PRs:

1. Create another workflow file: `.github/workflows/comment-triggered.yml`

2. Copy this content:

```yaml
name: PR Review (Comment Triggered)

on:
  issue_comment:
    types: [created]

jobs:
  review:
    if: github.event.issue.pull_request && contains(github.event.comment.body, '@pr-review')
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - name: React with eyes
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: 'eyes'
            });
      
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: refs/pull/${{ github.event.issue.number }}/head
      
      - name: Parse command
        id: parse
        run: |
          COMMENT="${{ github.event.comment.body }}"
          if echo "$COMMENT" | grep -q "@pr-review security"; then
            MODE="security-only"
          elif echo "$COMMENT" | grep -q "@pr-review quality"; then
            MODE="quality-only"
          elif echo "$COMMENT" | grep -q "@pr-review suggest"; then
            MODE="suggest-only"
          elif echo "$COMMENT" | grep -q "@pr-review help"; then
            MODE="help"
          else
            MODE="auto"
          fi
          echo "mode=$MODE" >> $GITHUB_OUTPUT
      
      - name: Post help
        if: steps.parse.outputs.mode == 'help'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 PR Reviewer Help\n\nCommands:\n- \`@pr-review\` - Full review\n- \`@pr-review security\` - Security only\n- \`@pr-review quality\` - Quality only\n- \`@pr-review suggest\` - Suggestions only`
            });
      
      - name: Run PR Reviewer
        if: steps.parse.outputs.mode != 'help'
        uses: yourorg/pr-reviewer@v1  # TODO: Update with your action path
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          mode: ${{ steps.parse.outputs.mode }}
      
      - name: React success
        if: success() && steps.parse.outputs.mode != 'help'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: '+1'
            });
```

3. Commit the file

4. Test it: Comment `@pr-review` on any PR!

✅ **Done!** Now you can trigger reviews manually with comments.

---

## 🔧 Using Local Action (Development)

If you want to use the action from your local `pr-reviewer` repository (for testing):

1. Clone the PR Reviewer repository:
   ```bash
   git clone https://github.com/yourusername/pr-reviewer.git
   cd pr-reviewer
   ```

2. In your target repository's workflow, use `./` instead of `yourorg/pr-reviewer@v1`:
   ```yaml
   - name: Review PR
     uses: ./path/to/pr-reviewer  # Local path
     with:
       github-token: ${{ secrets.GITHUB_TOKEN }}
       openai-api-key: ${{ secrets.OPENAI_API_KEY }}
   ```

3. **Note**: For production, you'll want to publish the action (see below).

---

## 📦 Publishing the Action (Production)

To make the action available for others (or yourself in multiple repos):

### Option 1: Publish to GitHub Actions Marketplace

1. Push the `pr-reviewer` repository to GitHub
2. Create a release: **Releases** → **Create a new release**
3. Tag: `v1.0.0`
4. Release title: `v1.0.0`
5. Publish release
6. GitHub will ask to publish to Marketplace → **Yes**

Then use: `yourusername/pr-reviewer@v1`

### Option 2: Use from Repository (Without Marketplace)

Just reference your repository directly:

```yaml
- uses: yourusername/pr-reviewer@v1
```

Or use a specific branch/commit:
```yaml
- uses: yourusername/pr-reviewer@main
- uses: yourusername/pr-reviewer@abc123  # Specific commit
```

---

## ⚙️ Customization Options

### Use Cheaper Model

```yaml
- name: Review PR
  uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    model: gpt-4o-mini  # ~5x cheaper than gpt-4o
```

### Security-Only Mode

```yaml
- name: Review PR
  uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    mode: security-only  # Only run security review
```

### Ignore Test Files

```yaml
- name: Review PR
  uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    ignore-patterns: |
      **/*.test.ts
      **/*.test.js
      **/*.spec.ts
      **/node_modules/**
      **/*.md
```

### Adjust Severity Thresholds

```yaml
- name: Review PR
  uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    inline-severity-threshold: medium  # Show medium+ as inline
    aggregated-severity-threshold: low  # Show low+ in summary
```

### Disable Specific Engines

```yaml
- name: Review PR
  uses: yourorg/pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    enable-quality: false  # Disable quality review
    enable-suggestions: false  # Disable suggestions
    # Security review still runs
```

---

## 📊 Expected Costs

Based on OpenAI gpt-4o-mini pricing:

| PR Size | Files | Cost per PR | Monthly (50 PRs) | Monthly (200 PRs) |
|---------|------:|------------:|-----------------:|------------------:|
| Small   | 1-5   | ~$0.01      | ~$0.50           | ~$2               |
| Medium  | 6-20  | ~$0.02-0.05 | ~$1-2.50         | ~$4-10            |
| Large   | 21-50 | ~$0.06-0.10 | ~$3-5            | ~$12-20           |

**Recommendation**: Start with `gpt-4o-mini` to keep costs low (~$0.01-0.05 per PR).

---

## ✅ Verification Checklist

After setup, verify:

- [ ] ✅ `OPENAI_API_KEY` secret exists in repository settings
- [ ] ✅ `.github/workflows/pr-review.yml` exists
- [ ] ✅ Workflow has correct `uses: yourorg/pr-reviewer@v1` path
- [ ] ✅ Workflow is committed to `main` branch
- [ ] ✅ Created test PR → Action runs successfully
- [ ] ✅ Review comments appear on PR
- [ ] (Optional) Comment-triggered workflow works

---

## 🐛 Troubleshooting

### "Workflow not running"

**Problem**: Created workflow but it doesn't run on PR

**Solutions**:
1. Check workflow file is in `.github/workflows/` directory
2. Ensure workflow is on `main` branch (not in a PR)
3. Check **Actions** tab → Is workflow enabled?
4. Verify trigger is correct: `on: pull_request: types: [opened, synchronize]`

### "Secret not found"

**Problem**: `OPENAI_API_KEY` not found error

**Solutions**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify secret name is exactly `OPENAI_API_KEY` (case-sensitive)
3. For forks: Secrets must be added to the forked repository, not original

### "Action not found"

**Problem**: `uses: yourorg/pr-reviewer@v1` fails with "not found"

**Solutions**:
1. If using local: Change to `uses: ./` or relative path
2. If using published: Check repository name is correct
3. If using branch: Change `@v1` to `@main` or `@your-branch`
4. Check repository is public (or you have access if private)

### "No comments posted"

**Problem**: Action runs successfully but no comments appear

**Solutions**:
1. Check PR actually has files changed (not just metadata)
2. Verify all files aren't ignored by `ignore-patterns`
3. Check severity thresholds (maybe all issues are below threshold)
4. Review Actions logs for warnings/errors
5. Verify `permissions: pull-requests: write` is set

### "Rate limit exceeded"

**Problem**: OpenAI API rate limit error

**Solutions**:
1. Upgrade OpenAI tier (more rate limit)
2. Reduce PR frequency (don't trigger on every commit)
3. Use `gpt-4o-mini` instead of `gpt-4o` (higher rate limit)
4. Add delay between reviews:
   ```yaml
   - name: Wait
     run: sleep 60  # Wait 60 seconds
   ```

---

## 📚 Next Steps

1. **Customize configuration**: Adjust thresholds, ignore patterns, model selection
2. **Set up comment-triggered reviews**: Add manual review capability
3. **Monitor costs**: Track OpenAI usage in dashboard
4. **Fine-tune prompts**: Customize security/quality checks for your needs
5. **Team training**: Share with team, add to PR checklist

---

## 🆘 Need Help?

- 📖 Read [README.md](README.md) for full documentation
- 🚀 See [QUICKSTART.md](QUICKSTART.md) for quick setup
- 💬 [Ask questions](https://github.com/yourorg/pr-reviewer/discussions)
- 🐛 [Report issues](https://github.com/yourorg/pr-reviewer/issues)

---

**Congratulations!** 🎉 Your repository now has AI-powered PR reviews!
