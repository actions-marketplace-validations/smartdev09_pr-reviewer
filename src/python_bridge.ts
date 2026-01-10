import { spawn } from "bun";
import { TokenManagerInput, TokenManagerOutput, TokenManagerOutputSchema } from "./types";

/**
 * Bridge to Python token manager subprocess
 * 
 * Spawns Python process, sends JSON via stdin, receives JSON via stdout
 */
export class PythonBridge {
  private pythonPath: string;
  private scriptPath: string;

  constructor(pythonPath: string = "python3", scriptPath: string = "python/token_manager.py") {
    this.pythonPath = pythonPath;
    this.scriptPath = scriptPath;
  }

  /**
   * Call Python token manager with input data
   */
  async callTokenManager(input: TokenManagerInput): Promise<TokenManagerOutput> {
    try {
      // Spawn Python process
      const proc = spawn({
        cmd: [this.pythonPath, this.scriptPath],
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      // Send input to stdin
      const inputJson = JSON.stringify(input);
      proc.stdin.write(inputJson);
      await proc.stdin.end();

      // Read stdout
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      // Wait for process to exit
      const exitCode = await proc.exited;

      // Check for errors
      if (exitCode !== 0) {
        let errorMessage = `Python process exited with code ${exitCode}`;
        if (stderr) {
          try {
            const errorJson = JSON.parse(stderr);
            errorMessage = `${errorJson.type}: ${errorJson.error}`;
          } catch {
            errorMessage = stderr;
          }
        }
        throw new Error(`Token manager failed: ${errorMessage}`);
      }

      // Parse output
      const output = JSON.parse(stdout);

      // Validate with Zod
      return TokenManagerOutputSchema.parse(output);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Python bridge error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test if Python and tiktoken are available
   */
  async test(): Promise<{ success: boolean; error?: string }> {
    try {
      const proc = spawn({
        cmd: [this.pythonPath, "-c", "import tiktoken; print('OK')"],
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      if (exitCode === 0 && stdout.trim() === "OK") {
        return { success: true };
      }

      return {
        success: false,
        error: "tiktoken not installed. Run: pip install tiktoken",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Singleton instance for easy access
 */
export const pythonBridge = new PythonBridge();

/**
 * Helper: Call token manager with default settings
 */
export async function compressDiff(
  files: TokenManagerInput["files"],
  model: string = "gpt-4o",
  maxTokens: number = 8000,
  promptTokens: number = 0
): Promise<TokenManagerOutput> {
  return pythonBridge.callTokenManager({
    files,
    model,
    max_tokens: maxTokens,
    prompt_tokens: promptTokens,
  });
}
