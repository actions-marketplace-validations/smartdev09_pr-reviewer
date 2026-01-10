/**
 * Security Review Engine
 * VAPT-focused security analysis
 */

import { BaseAIProvider } from "../ai/provider";
import { ReviewResponse, ReviewResponseSchema } from "../types";
import { SECURITY_SYSTEM_PROMPT, buildSecurityPrompt } from "../prompts/security";

export class SecurityEngine {
  constructor(private aiProvider: BaseAIProvider) {}

  async analyze(diff: string): Promise<ReviewResponse> {
    const systemPrompt = SECURITY_SYSTEM_PROMPT;
    const userPrompt = buildSecurityPrompt(diff);

    const response = await this.aiProvider.callWithSchema(
      systemPrompt,
      userPrompt,
      ReviewResponseSchema
    );

    return response.data;
  }
}
