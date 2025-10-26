import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import cheerio from 'cheerio';

const prisma = new PrismaClient();

interface ContactInfo {
  emails: string[];
  phones: string[];
}

/**
 * Extract contact info from HTML
 */
export async function extractContacts(url: string): Promise<ContactInfo> {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const emails: string[] = [];
    const phones: string[] = [];
    
    // Extract emails
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0];
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          emails.push(email);
        }
      }
    });
    
    // Extract phone numbers
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const phone = href.replace('tel:', '').trim();
        if (phone) phones.push(phone);
      }
    });
    
    // Look for contact patterns in text
    const bodyText = $('body').text();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    const emailMatches = bodyText.match(emailRegex);
    if (emailMatches) emails.push(...emailMatches);
    
    const phoneMatches = bodyText.match(phoneRegex);
    if (phoneMatches) phones.push(...phoneMatches);
    
    return {
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
    };
  } catch (error) {
    console.error(`Failed to extract contacts from ${url}:`, error);
    return { emails: [], phones: [] };
  }
}

/**
 * Search for contractors using Parallel AI
 */
export async function searchContractors(query: string, location: string): Promise<any[]> {
  const apiKey = process.env.PARALLEL_API_KEY;
  if (!apiKey) {
    console.warn('PARALLEL_API_KEY not set, using mock data');
    return getMockContractors();
  }
  
  try {
    const response = await axios.post('https://api.parallel.ai/v1/search', {
      query: `${query} ${location}`,
      type: 'google',
      limit: 20,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    const results = response.data.results || [];
    return results.map((result: any) => ({
      name: result.title || result.name,
      website: result.url || result.link,
      snippet: result.description || result.snippet,
    }));
  } catch (error) {
    console.error('Parallel AI search failed:', error);
    return getMockContractors();
  }
}

/**
 * Mock contractors for demo (when API not available)
 */
function getMockContractors() {
  return [
    {
      name: 'ABC Cleaning Services',
      website: 'https://example.com/abc-cleaning',
      snippet: 'Professional house cleaning services in San Jose',
    },
    {
      name: 'Sparkle Clean Co.',
      website: 'https://example.com/sparkle-clean',
      snippet: 'Residential and commercial cleaning',
    },
    {
      name: 'Green Clean Solutions',
      website: 'https://example.com/green-clean',
      snippet: 'Eco-friendly cleaning services',
    },
  ];
}

/**
 * Process sourcing job for a project
 */
export async function processSourcing(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');
  
  // Search for contractors
  const query = `${project.type} ${project.city}`;
  const results = await searchContractors(query, project.address);
  
  // Enrich each result
  for (const result of results.slice(0, 10)) {
    const { emails, phones } = await extractContacts(result.website);
    
    if (emails.length > 0 || phones.length > 0) {
      const provider = await prisma.provider.create({
        data: {
          projectId,
          name: result.name,
          website: result.website,
          serviceAreaText: result.snippet,
          score: 0.7,
          evidenceUrls: [result.website],
        },
      });
      
      // Add contact methods
      for (const email of emails) {
        await prisma.contactMethod.create({
          data: {
            providerId: provider.id,
            kind: 'email',
            value: email,
            sourceUrl: result.website,
            confidence: 0.8,
          },
        });
      }
      
      for (const phone of phones) {
        await prisma.contactMethod.create({
          data: {
            providerId: provider.id,
            kind: 'sms',
            value: phone,
            sourceUrl: result.website,
            confidence: 0.7,
          },
        });
      }
    }
  }
  
  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'awaiting_approval' },
  });
  
  return { success: true, candidatesFound: results.length };
}
