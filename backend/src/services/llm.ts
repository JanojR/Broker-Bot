import Anthropic from '@anthropic-ai/sdk';

// Claude client (configured but not auto-called to save API usage)
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Generate negotiation message
 */
export async function generateCounterOffer(
  providerName: string,
  currentQuote: any,
  competitorQuote: any,
  strategy: 'price_match' | 'bundle' | 'off_peak' | 'fee_waiver',
  useClaude: boolean = false
): Promise<string> {
  const prompt = buildNegotiationPrompt(providerName, currentQuote, competitorQuote, strategy);
  
  // Only use Claude if explicitly requested (to save API calls)
  if (useClaude && process.env.CLAUDE_API_KEY) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      
      // Extract text from Claude response
      const textContent = message.content.find(block => block.type === 'text');
      return textContent ? textContent.text : 'Unable to generate message';
    } catch (error) {
      console.error('Claude API error:', error);
      return generateFallbackMessage(strategy);
    }
  }
  
  // Return fallback message (saves API calls)
  return generateFallbackMessage(strategy);
}

/**
 * Parse quote from response
 */
export async function parseQuote(body: string, useClaude: boolean = false): Promise<any> {
  // For now, just parse with regex to avoid API calls
  // Claude parsing can be enabled later
  const totalPriceMatch = body.match(/\$\s*(\d+(?:\.\d{2})?)/);
  const totalPrice = totalPriceMatch ? parseFloat(totalPriceMatch[1]) : null;
  
  // Simple extraction without API calls
  return {
    totalPrice,
    priceType: body.includes('hourly') || body.includes('hr') ? 'hourly' : 'fixed',
    leadTime: null,
    warranty: null,
    items: [],
    fees: [],
    discounts: null,
    notes: body.substring(0, 200),
    validUntil: null,
  };
}

/**
 * Build negotiation prompt
 */
function buildNegotiationPrompt(
  providerName: string,
  currentQuote: any,
  competitorQuote: any,
  strategy: string
): string {
  const basePrompt = `You are negotiating a contract on behalf of your client. Be professional, polite, and truthful. Never fabricate information.

Provider: ${providerName}
Current quote: $${currentQuote?.totalEstimated || 'N/A'}

Competitor quote for comparison: $${competitorQuote?.totalEstimated || 'N/A'}

Strategy: ${strategy}

Generate a short message (2-3 sentences) that:
1. Acknowledges the quote
2. Mentions the competitor's offer (be truthful)
3. Requests the specific change based on strategy`;

  switch (strategy) {
    case 'price_match':
      return `${basePrompt}
Request: Could you match or beat the $${competitorQuote?.totalEstimated} offer?`;
    
    case 'bundle':
      return `${basePrompt}
Request: Could you offer a bundle discount if we add additional services?`;
    
    case 'off_peak':
      return `${basePrompt}
Request: Could you offer a discount if we schedule during off-peak hours (e.g., weekdays)?`;
    
    case 'fee_waiver':
      return `${basePrompt}
Request: Could you waive or reduce the setup/deposit fees?`;
    
    default:
      return basePrompt;
  }
}

function generateFallbackMessage(strategy: string): string {
  const messages: Record<string, string> = {
    price_match: "Would you be able to match or beat this competitive offer?",
    bundle: "Could you offer a bundle discount for additional services?",
    off_peak: "Could we get a discount for scheduling during off-peak hours?",
    fee_waiver: "Is there any way you could reduce or waive the setup/deposit fees?",
  };
  
  return messages[strategy] || "Would you be open to negotiating the terms?";
}
