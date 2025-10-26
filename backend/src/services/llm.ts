import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate negotiation message
 */
export async function generateCounterOffer(
  providerName: string,
  currentQuote: any,
  competitorQuote: any,
  strategy: 'price_match' | 'bundle' | 'off_peak' | 'fee_waiver'
): Promise<string> {
  const prompt = buildNegotiationPrompt(providerName, currentQuote, competitorQuote, strategy);
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0]?.message?.content || 'Unable to generate message';
  } catch (error) {
    console.error('LLM error:', error);
    return generateFallbackMessage(strategy);
  }
}

/**
 * Parse quote from response
 */
export async function parseQuote(body: string): Promise<any> {
  const prompt = `Extract quote information from this email/SMS:

${body}

Return a JSON object with:
{
  "totalPrice": number or null,
  "priceType": "fixed" | "hourly" | "estimate",
  "leadTime": number (days) or null,
  "warranty": string or null,
  "items": array of {desc, quantity, price},
  "fees": array of {type, amount},
  "discounts": number or null,
  "notes": string or null,
  "validUntil": string or null
}

If information is missing or unclear, use null.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Parse error:', error);
    return {};
  }
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
