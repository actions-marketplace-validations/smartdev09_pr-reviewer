/**
 * Output Formatters
 * Format review issues into GitHub comments
 */

import {
  ReviewIssue,
  Severity,
  InlineComment,
  PRContext,
} from "./types";

/**
 * Severity emoji mapping
 */
export function getSeverityEmoji(severity: Severity): string {
  const emojiMap: Record<Severity, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
    info: "ℹ️",
  };
  return emojiMap[severity];
}

/**
 * Separate issues by severity threshold
 */
export function separateIssuesBySeverity(
  issues: ReviewIssue[],
  inlineThreshold: Severity,
  aggregatedThreshold: Severity
): { inline: ReviewIssue[]; aggregated: ReviewIssue[] } {
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  const inlineLevel = severityOrder[inlineThreshold];
  const aggregatedLevel = severityOrder[aggregatedThreshold];

  const inline = issues.filter(
    (issue) => severityOrder[issue.severity] <= inlineLevel
  );
  const aggregated = issues.filter(
    (issue) =>
      severityOrder[issue.severity] > inlineLevel &&
      severityOrder[issue.severity] <= aggregatedLevel
  );

  return { inline, aggregated };
}

/**
 * Format inline comment for critical/high issues
 */
export function formatInlineComment(
  issue: ReviewIssue,
  prContext: PRContext
): InlineComment | null {
  if (!issue.location?.file || !issue.location.startLine) {
    return null;
  }

  let body = `## ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;
  body += `**Severity:** ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}\n\n`;

  if (issue.securityCategory) {
    body += `**Category:** ${formatCategory(issue.securityCategory)}\n`;
  }
  if (issue.exploitability) {
    body += `**Exploitability:** ${issue.exploitability}\n`;
  }
  if (issue.impact) {
    body += `**Impact:** ${formatImpact(issue.impact)}\n`;
  }
  body += `\n`;

  body += `${issue.description}\n\n`;

  if (issue.explanation) {
    body += `<details>\n<summary><strong>💡 Explanation</strong></summary>\n\n`;
    body += `${issue.explanation}\n\n`;
    body += `</details>\n\n`;
  }

  if (issue.suggestion) {
    body += `<details>\n<summary><strong>🛠️ Fix</strong></summary>\n\n`;
    body += `${issue.suggestion}\n\n`;
    if (issue.codeSnippet) {
      body += `**Code example:**\n\n\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
    }
    body += `</details>\n\n`;
  }

  body += `---\n*Automated review by PR Reviewer*`;

  return {
    path: issue.location.file,
    start_line: issue.location.startLine,
    end_line: issue.location.endLine || issue.location.startLine,
    body,
  };
}

/**
 * Format aggregated comment for medium/low/info issues
 */
export function formatAggregatedComment(
  issues: ReviewIssue[],
  prContext: PRContext,
  hasCriticalHigh: boolean
): string {
  let body = `## 📋 Code Review Summary\n\n`;

  if (hasCriticalHigh) {
    body += `> ⚠️ Critical/High severity issues have been posted as inline comments.\n\n`;
  }

  // Group by severity
  const bySeverity: Record<Severity, ReviewIssue[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: [],
  };

  for (const issue of issues) {
    bySeverity[issue.severity].push(issue);
  }

  for (const severity of ["medium", "low", "info"] as Severity[]) {
    const severityIssues = bySeverity[severity];
    if (severityIssues.length === 0) continue;

    body += `### ${getSeverityEmoji(severity)} ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${severityIssues.length})\n\n`;

    for (const issue of severityIssues) {
      body += `<details>\n`;
      body += `<summary><strong>${issue.title}</strong>`;
      if (issue.location?.file) {
        const permalink = buildPermalink(prContext, issue.location.file, issue.location.startLine, issue.location.endLine);
        body += ` - [${issue.location.file}](${permalink})`;
      }
      body += `</summary>\n\n`;

      body += `${issue.description}\n\n`;

      if (issue.explanation) {
        body += `**Explanation:** ${issue.explanation}\n\n`;
      }

      if (issue.suggestion) {
        body += `**Suggestion:** ${issue.suggestion}\n\n`;
      }

      if (issue.codeSnippet) {
        body += `\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
      }

      body += `</details>\n\n`;
    }
  }

  body += `---\n*Automated review by PR Reviewer*`;

  return body;
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ");
}

function formatImpact(impact: string): string {
  return impact
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildPermalink(
  prContext: PRContext,
  file: string,
  startLine?: number,
  endLine?: number
): string {
  const baseUrl = `https://github.com/${prContext.owner}/${prContext.repo}/blob/${prContext.head_sha}/${file}`;

  if (startLine) {
    if (endLine && endLine > startLine) {
      return `${baseUrl}#L${startLine}-L${endLine}`;
    }
    return `${baseUrl}#L${startLine}`;
  }

  return baseUrl;
}
