import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { ProposedAction } from './validation-engine';

/**
 * Verification Agent (LLM-based Second Opinion)
 * Independent review of Controller's proposed actions
 */

export interface VerificationResult {
  approved: boolean;
  reason?: string;
  warning?: string;
}

/**
 * Verify execution proposal against evidence
 */
export async function verifyExecution({
  evidenceStore,
  proposedAction,
  modelId = 'gpt-4o-mini',
}: {
  evidenceStore: Record<string, any>;
  proposedAction: ProposedAction;
  modelId?: string;
}): Promise<VerificationResult> {
  const model = openai(modelId);

  const verificationPrompt = `You are an independent Verification Agent (Level 2).
Your job is to review the work of a Site Reliability Engineer (SRE) (Level 1).

**TASK:**
Review the "Proposed Action" and the "Evidence" provided by the SRE.
1. Does the Evidence actually support the Action? (Crucially verify).
2. Is the Action safe according to DevOps best practices? (e.g., restarting a pod is safe, dropping a DB table is NOT).
3. Does the Action violate any Governance Policies? (Check against provided rules).
4. Is there any risk of "Over-Reaction"? (e.g., scaling up 100x for a minor latency spike).

**EVIDENCE:**
${JSON.stringify(evidenceStore, null, 2)}

**PROPOSED ACTION:**
Type: ${proposedAction.type}
Params: ${JSON.stringify(proposedAction.params)}
Target: ${proposedAction.target || 'N/A'}

**INSTRUCTIONS:**
- Respond ONLY in valid JSON.
- Use keys: "approved" (boolean), "reason" (string, required if rejected), "warning" (string, optional).
- If approved: Set \`approved: true\`.
- If rejected: Set \`approved: false\` and provide a clear reason in "reason".
- If warning: Set \`approved: true\` but provide a warning in "warning".
- Do not add extra text outside the JSON.`;

  try {
    const result = await generateText({
      model,
      prompt: verificationPrompt,
      temperature: 0.1, // Low temp for strict validation logic
      maxTokens: 300,
    });

    // Parse the JSON response from the agent
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          approved: parsed.approved === true,
          reason: parsed.reason,
          warning: parsed.warning,
        };
      } catch (parseError) {
        console.error('Failed to parse verification JSON:', parseError);
      }
    }

    // Fallback: try to infer from text
    const text = result.text.toLowerCase();
    if (text.includes('approved') || text.includes('safe') || text.includes('proceed')) {
      return { approved: true };
    }
    if (text.includes('rejected') || text.includes('unsafe') || text.includes('violation')) {
      return { approved: false, reason: 'Verification agent detected safety concerns' };
    }

    // Default to rejection if unclear
    return {
      approved: false,
      reason: 'Invalid response format from Verification Agent',
    };
  } catch (error: any) {
    console.error('Verification Agent error:', error);
    return {
      approved: false,
      reason: `Verification failed: ${error.message}`,
    };
  }
}
