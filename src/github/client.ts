/**
 * GitHub API Client
 * Handles PR fetching and comment posting
 */

import * as github from "@actions/github";
import { FileChange, PRContext, InlineComment } from "../types";
import { minimatch } from "minimatch";

export class GitHubClient {
  private octokit: ReturnType<typeof github.getOctokit>;

  constructor(token: string) {
    this.octokit = github.getOctokit(token);
  }

  /**
   * Get PR context from GitHub Actions environment
   */
  static getPRContext(): PRContext | null {
    const context = github.context;

    if (!context.payload.pull_request) {
      return null;
    }

    return {
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
      head_sha: context.payload.pull_request.head.sha,
    };
  }

  /**
   * Fetch PR files with diffs
   */
  async getPRFiles(prContext: PRContext): Promise<FileChange[]> {
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner: prContext.owner,
      repo: prContext.repo,
      pull_number: prContext.pull_number,
    });

    return files.map((file) => ({
      filename: file.filename,
      status: file.status,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
    }));
  }

  /**
   * Filter files by ignore patterns
   */
  filterFiles(files: FileChange[], ignorePatterns: string[]): FileChange[] {
    if (ignorePatterns.length === 0) {
      return files;
    }

    return files.filter((file) => {
      return !ignorePatterns.some((pattern) => minimatch(file.filename, pattern));
    });
  }

  /**
   * Post inline comment on specific lines
   */
  async postInlineComment(
    prContext: PRContext,
    comment: InlineComment
  ): Promise<void> {
    try {
      await this.octokit.rest.pulls.createReviewComment({
        owner: prContext.owner,
        repo: prContext.repo,
        pull_number: prContext.pull_number,
        commit_id: prContext.head_sha,
        path: comment.path,
        body: comment.body,
        side: "RIGHT",
        start_side: "RIGHT",
        start_line: comment.start_line,
        line: comment.end_line,
      });
    } catch (error) {
      // If inline comment fails (e.g., line not in diff), log warning
      console.warn(
        `Failed to post inline comment at ${comment.path}:${comment.start_line}-${comment.end_line}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Post aggregated comment
   */
  async postComment(prContext: PRContext, body: string): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: prContext.owner,
      repo: prContext.repo,
      issue_number: prContext.pull_number,
      body,
    });
  }

  /**
   * Build unified diff string from file changes
   */
  buildDiff(files: FileChange[]): string {
    return files
      .filter((f) => f.patch)
      .map(
        (f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch}`
      )
      .join("\n\n");
  }

  /**
   * Build GitHub permalink to specific line
   */
  buildPermalink(
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
}
