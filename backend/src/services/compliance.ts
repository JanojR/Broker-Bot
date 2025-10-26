/**
 * Compliance and safety utilities
 */

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(quietHours?: string): boolean {
  if (!quietHours) return false;
  
  // Parse format like "9am-6pm"
  const [start, end] = quietHours.split('-');
  const now = new Date();
  const hour = now.getHours();
  
  const startHour = parseInt(start.replace(/\D/g, '')) || 9;
  const endHour = parseInt(end.replace(/\D/g, '')) || 18;
  
  return hour >= startHour && hour < endHour;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Check length (US: 10 digits)
  return cleaned.length >= 10;
}

/**
 * Handle STOP opt-out request
 */
export function isStopRequest(body: string): boolean {
  const stopKeywords = ['stop', 'unsubscribe', 'opt out', 'cancel'];
  const lowerBody = body.toLowerCase().trim();
  return stopKeywords.some(keyword => lowerBody.includes(keyword));
}

/**
 * Rate limit check (simple in-memory, use Redis in production)
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Sanitize message content for compliance
 */
export function sanitizeMessage(body: string): string {
  // Ensure assistant disclosure
  if (!body.includes('Contractr.AI')) {
    body += '\n\n(This message was sent by Contractr.AI on behalf of our user.)';
  }
  
  // Add STOP notice for SMS
  if (body.length < 500 && !body.includes('STOP')) {
    body += '\n\nReply STOP to opt out.';
  }
  
  return body;
}

/**
 * Check for required unsubscribe link (CAN-SPAM)
 */
export function addUnsubscribeLink(emailBody: string, projectId: string): string {
  if (!emailBody.includes('unsubscribe')) {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/projects/${projectId}/unsubscribe`;
    emailBody += `\n\n<a href="${unsubscribeUrl}">Unsubscribe from these emails</a>`;
  }
  return emailBody;
}
