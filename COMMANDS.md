# PR Reviewer Commands

PR Reviewer supports comment-triggered reviews! Just comment on any PR to trigger a review.

## 🎯 Available Commands

### Full Review (Default)

```
@pr-review
```

Runs all review engines:
- 🔒 Security review (VAPT methodology)
- ✨ Code quality review (best practices)
- 💡 Code suggestions (commitable improvements)

**Example:**
```
@pr-review
```

---

### Security-Only Review

```
@pr-review security
```

Only runs security analysis:
- OWASP Top 10 coverage
- VAPT severity classification
- Exploitability + impact assessment
- Focus on vulnerabilities

**Example:**
```
@pr-review security
```

**Use when:** You want fast security scan before merge

---

### Quality-Only Review

```
@pr-review quality
```

Only runs code quality analysis:
- Clean code principles
- SOLID principles
- Best practices
- Code organization
- Error handling

**Example:**
```
@pr-review quality
```

**Use when:** You already have security covered, need code review

---

### Suggestions-Only

```
@pr-review suggest
```

Only generates code improvement suggestions:
- Bug fixes
- Performance improvements
- Readability enhancements
- Modern syntax suggestions

**Example:**
```
@pr-review suggest
```

**Use when:** You want specific actionable improvements

---

### Help

```
@pr-review help
```

Shows available commands and usage examples.

---

## 🚀 How It Works

1. **Comment on any PR** with `@pr-review` (plus optional command)

2. **Bot reacts with 👀** to show it's processing

3. **Analysis runs** (30-60 seconds depending on PR size)

4. **Results posted as comments:**
   - Critical/High issues → Inline comments at specific lines
   - Medium/Low/Info → Aggregated summary comment

5. **Bot reacts with 👍** when complete (or 👎 if failed)

---

## 📋 Examples

### Example 1: Quick Security Check

```
Someone just raised a PR with database code. You want to check for SQL injection:

Comment: @pr-review security

Result: 
- Finds SQL injection vulnerability
- Posts inline comment at vulnerable line
- Marks as 🔴 Critical severity
```

### Example 2: Pre-Merge Review

```
PR looks good but you want a final check before merging:

Comment: @pr-review

Result:
- Full review (security + quality + suggestions)
- Inline comments for critical/high issues
- Aggregated comment with all findings
```

### Example 3: Code Improvement Ideas

```
Code works but could be better:

Comment: @pr-review suggest

Result:
- Suggests using modern syntax
- Recommends performance improvements
- Provides commitable code examples
```

---

## ⚙️ Configuration

Commands use the configuration from your workflow file (`.github/workflows/comment-triggered.yml`).

### Customize Settings

Edit `.github/workflows/comment-triggered.yml`:

```yaml
- name: Run PR Reviewer
  uses: ./
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    mode: ${{ steps.parse.outputs.mode }}
    
    # Customize these:
    model: gpt-4o-mini  # Use cheaper model
    inline-severity-threshold: high
    aggregated-severity-threshold: medium
    ignore-patterns: |
      **/*.test.ts
      **/*.md
```

---

## 🎛️ Advanced Usage

### Multiple Commands

You can trigger multiple reviews on the same PR:

```
@pr-review security
(wait for results)

@pr-review quality
(wait for results)

@pr-review suggest
```

Each command runs independently.

### Re-run After Changes

Made changes based on feedback? Re-run the review:

```
@pr-review
```

It will analyze the latest commit.

---

## 💡 Tips

**When to use commands:**

- `@pr-review security` → Before merging sensitive code
- `@pr-review quality` → During code review cycle
- `@pr-review suggest` → When you want improvement ideas
- `@pr-review` → Comprehensive pre-merge check

**Best practices:**

- ✅ Run `@pr-review security` on every PR touching auth/data
- ✅ Run full `@pr-review` before final merge
- ✅ Use `@pr-review suggest` to learn better patterns
- ❌ Don't spam commands (wait for previous run to finish)

---

## 🔧 Troubleshooting

### Command not triggering

**Problem:** You commented but nothing happened

**Solution:**
1. Check you're commenting on a **PR**, not an issue
2. Make sure you include `@pr-review` in your comment
3. Check GitHub Actions tab for errors
4. Verify workflow file exists: `.github/workflows/comment-triggered.yml`

### Bot reacts with 👎

**Problem:** Command failed

**Solution:**
1. Check GitHub Actions logs for error details
2. Common issues:
   - Missing `OPENAI_API_KEY` secret
   - Invalid API key
   - Rate limit exceeded
   - PR too large (split into smaller PRs)

### No inline comments posted

**Problem:** Analysis ran but no inline comments

**Solution:**
- Inline comments only posted for **critical/high** severity by default
- Lower severity issues go to aggregated comment
- Check if issues were found at all (might be clean code!)
- Adjust `inline-severity-threshold` in workflow to show more

---

## 📚 Related Documentation

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Setup guide
- [Example workflow](/.github/workflows/example.yml) - Automatic reviews

---

## 🆘 Support

Need help?
- 🐛 [Report issues](https://github.com/yourorg/pr-reviewer/issues)
- 💬 [Ask questions](https://github.com/yourorg/pr-reviewer/discussions)
- 📖 [Read docs](README.md)

---

**Pro tip:** Add this to your team's PR checklist:
```markdown
- [ ] Comment `@pr-review security` before requesting review
- [ ] Address critical/high findings
- [ ] Run `@pr-review` before final merge
```
