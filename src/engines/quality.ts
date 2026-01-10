/**
 * Code Quality Review Engine
 * Clean code, best practices, SOLID principles
 */

import { BaseAIProvider } from "../ai/provider";
import { ReviewResponse, ReviewResponseSchema } from "../types";
import { QUALITY_SYSTEM_PROMPT, buildQualityPrompt } from "../prompts/quality";

export class QualityEngine {
  constructor(private aiProvider: BaseAIProvider) {}

  async analyze(diff: string): Promise<ReviewResponse> {
    const systemPrompt = QUALITY_SYSTEM_PROMPT;
    const userPrompt = buildQualityPrompt(diff);

    const response = await this.aiProvider.callWithSchema(
      systemPrompt,
      userPrompt,
      ReviewResponseSchema
    );

    return response.data;
  }
}
