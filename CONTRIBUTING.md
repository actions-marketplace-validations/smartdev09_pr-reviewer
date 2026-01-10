# Contributing to PR Reviewer

Thank you for your interest in contributing! This project combines Bun/TypeScript with Python for optimal performance.

## Development Setup

### Prerequisites

- **Bun** >= 1.0.0 ([install](https://bun.sh))
- **Python** >= 3.12 ([install](https://python.org))
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourorg/pr-reviewer.git
cd pr-reviewer

# Install dependencies
bun install
pip install -r python/requirements.txt

# Run tests
./test-local.sh

# Build
bun run build
```

## Project Structure

```
pr-reviewer/
├── src/                     # TypeScript/Bun code
│   ├── main.ts             # Entry point
│   ├── engines/            # Review engines (security, quality, suggestions)
│   ├── prompts/            # AI prompts
│   ├── python_bridge.ts    # Bun ↔ Python bridge
│   ├── ai/                 # AI provider abstraction
│   ├── github/             # GitHub API client
│   └── types.ts            # Zod schemas
│
├── python/                  # Python code
│   ├── token_manager.py    # Token counting & compression
│   └── test_token_manager.py
│
├── action.yml              # GitHub Action definition
└── package.json            # Bun dependencies
```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - TypeScript: Edit files in `src/`
   - Python: Edit files in `python/`
   - Prompts: Edit files in `src/prompts/`

3. **Test your changes**
   ```bash
   # Type check
   bun run typecheck
   
   # Test Python
   cd python && pytest -v
   
   # Build
   bun run build
   ```

4. **Commit with descriptive messages**
   ```bash
   git add .
   git commit -m "feat: add support for X"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

### Testing Locally

To test the GitHub Action locally:

```bash
# Set environment variables
export INPUT_GITHUB-TOKEN="your_token"
export INPUT_OPENAI-API-KEY="your_api_key"

# Run
bun dist/main.js
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Follow existing code structure
- Use Zod for validation
- Prefer async/await over promises

### Python
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions focused and testable

## Adding Features

### Adding a New Review Engine

1. Create `src/engines/your-engine.ts`:
   ```typescript
   import { BaseAIProvider } from "../ai/provider";
   
   export class YourEngine {
     constructor(private aiProvider: BaseAIProvider) {}
     
     async analyze(diff: string) {
       // Implementation
     }
   }
   ```

2. Add prompt in `src/prompts/your-engine.ts`

3. Wire into `src/main.ts`

### Adding a New AI Provider

1. Extend `BaseAIProvider` in `src/ai/provider.ts`

2. Implement `callWithSchema` method

3. Update `createAIProvider` factory

## Testing

### Unit Tests (Python)

```bash
cd python
pytest test_token_manager.py -v
```

### Integration Tests

Create a test PR and run the action:

```yaml
# .github/workflows/test.yml
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

## Pull Request Guidelines

1. **Keep PRs focused** - One feature/fix per PR
2. **Add tests** - For new features
3. **Update docs** - If changing user-facing behavior
4. **Follow conventions** - Match existing code style
5. **Test thoroughly** - Run all tests before submitting

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Publish to GitHub Actions Marketplace

## Getting Help

- 📖 Read the [README](README.md)
- 🐛 File an [issue](https://github.com/yourorg/pr-reviewer/issues)
- 💬 Ask in discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
