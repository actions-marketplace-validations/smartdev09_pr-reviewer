/**
 * Code Suggestions Engine
 * Generate commitable code improvements
 */

import { BaseAIProvider } from "../ai/provider";
import { SuggestionsResponse, SuggestionsResponseSchema } from "../types";
import { SUGGESTIONS_SYSTEM_PROMPT, buildSuggestionsPrompt } from "../prompts/suggestions";

export class SuggestionsEngine {
  constructor(private aiProvider: BaseAIProvider) {}

  async generate(diff: string): Promise<SuggestionsResponse> {
    const systemPrompt = SUGGESTIONS_SYSTEM_PROMPT;
    const userPrompt = buildSuggestionsPrompt(diff);

    const response = await this.aiProvider.callWithSchema(
      systemPrompt,
      userPrompt,
      SuggestionsResponseSchema
    );

    return response.data;
  }
}
