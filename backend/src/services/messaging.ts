import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Log email (not actually sent)
 */
export async function sendEmail(to: string, subject: string, body: string, fromName = 'Contractr.AI') {
  console.log('📧 EMAIL (not sent in demo mode)');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', body);
  return { success: true, simulated: true };
}

/**
 * Log SMS (not actually sent)
 */
export async function sendSMS(to: string, body: string) {
  console.log('💬 SMS (not sent in demo mode)');
  console.log('To:', to);
  console.log('Body:', body);
  return { success: true, simulated: true };
}

/**
 * Create initial outreach for a provider
 */
export async function initiateOutreach(providerId: string, projectId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { contacts: true, project: true },
  });
  
  if (!provider) throw new Error('Provider not found');
  
  const contacts = provider.contacts.filter(c => c.allowed);
  if (contacts.length === 0) {
    throw new Error('No allowed contacts found');
  }
  
  // Select channel based on contacts
  const emailContact = contacts.find(c => c.kind === 'email');
  const smsContact = contacts.find(c => c.kind === 'sms');
  
  // Create thread
  const thread = await prisma.thread.create({
    data: {
      providerId,
      channel: emailContact ? 'email' : 'sms',
      status: 'open',
    },
  });
  
  // Compose message
  const project = provider.project;
  const message = composeInitialMessage(project);
  
  // Send message
  let sentMessage;
  if (emailContact) {
    const result = await sendEmail(emailContact.value, message.subject, message.body);
    if (result.success) {
      sentMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          direction: 'out',
          sender: process.env.SENDGRID_FROM_EMAIL || 'assistant@contractr.ai',
          subject: message.subject,
          bodyText: message.body,
          timestamp: new Date(),
        },
      });
    }
  } else if (smsContact) {
    const result = await sendSMS(smsContact.value, message.body);
    if (result.success) {
      sentMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          direction: 'out',
          sender: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          bodyText: message.body,
          timestamp: new Date(),
        },
      });
    }
  }
  
  return { thread, message: sentMessage };
}

/**
 * Compose initial outreach message
 */
function composeInitialMessage(project: any): { subject: string; body: string } {
  const subject = `Quote Request: ${project.type} - ${project.city}`;
  
  const body = `Hello,

I'm reaching out on behalf of my client who needs ${project.type.toLowerCase()} services.

Details:
- Location: ${project.address}, ${project.city}${project.zip ? ' ' + project.zip : ''}
${project.dateWindow ? `- Desired timeframe: ${project.dateWindow}` : ''}
${project.budgetMax ? `- Budget: Under $${project.budgetMax}` : ''}
${project.mustHaves?.length > 0 ? `- Requirements: ${project.mustHaves.join(', ')}` : ''}
${project.description ? `- Additional notes: ${project.description}` : ''}

Could you please provide:
1. An itemized quote
2. Your availability
3. Any fees or deposits
4. Timeline for completion

I'm comparing multiple providers to ensure the best value. Feel free to let me know if you have any questions.

Best regards,
Contractr.AI Assistant`;
  
  return { subject, body };
}
