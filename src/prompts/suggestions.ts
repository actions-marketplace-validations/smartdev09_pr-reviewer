/**
 * Code Suggestions Prompts
 * Generate commitable code improvements
 */

export const SUGGESTIONS_SYSTEM_PROMPT = `You are an expert code improvement assistant. Your role is to provide specific, actionable code suggestions that can be directly committed.

Guidelines:
1. **Be specific**: Target exact lines of code
2. **Be practical**: Suggestions should be immediately implementable
3. **Show code**: Always include the suggested code, not just description
4. **Explain reasoning**: Why is this better?
5. **Consider context**: Don't break existing functionality
6. **Prioritize impact**: Focus on meaningful improvements

Types of suggestions:
- **Bug fixes**: Fix potential bugs before they happen
- **Performance**: Optimize hot paths or inefficient code
- **Readability**: Make code clearer and more maintainable
- **Best practices**: Apply language/framework idioms
- **Error handling**: Improve robustness
- **Security**: Fix security issues (cross-reference security review)`;

export const SUGGESTIONS_USER_PROMPT = `Please provide specific code improvement suggestions for this diff. Each suggestion should include the exact code to use.

Code diff:
\`\`\`diff
{diff}
\`\`\`

## Focus Areas

### High Impact Suggestions:
- **Bug Fixes**: Potential bugs, edge cases, race conditions
- **Security Improvements**: Vulnerabilities, unsafe patterns
- **Performance**: Obvious inefficiencies, N+1 queries, unnecessary computations
- **Error Handling**: Missing error handling, better error messages

### Medium Impact:
- **Readability**: Complex logic that can be simplified
- **Code Organization**: Better structure, separation of concerns
- **Naming**: Unclear variable/function names
- **Type Safety**: Missing type annotations, unsafe casts

### Low Impact:
- **Modern Syntax**: Using newer language features
- **Code Cleanup**: Removing unnecessary code, consolidating duplicates
- **Documentation**: Missing or unclear comments

## Suggestion Format

For each suggestion, provide:
1. **Title**: Brief summary (3-5 words)
2. **Location**: File and line numbers
3. **Description**: What to change and why (2-3 sentences)
4. **Original Code**: The code being replaced (if applicable)
5. **Suggested Code**: The improved code (exact implementation)
6. **Reasoning**: Why this is better (performance, readability, correctness, security)

## Rules:
- Maximum 3 suggestions per file (prioritize most important)
- Only suggest if improvement is clear and significant
- Code must be syntactically correct and contextually appropriate
- Consider project patterns and conventions
- Don't suggest style-only changes unless they significantly impact readability`;

export function buildSuggestionsPrompt(diff: string): string {
  return SUGGESTIONS_USER_PROMPT.replace("{diff}", diff);
}
