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
  const searchQuery = `${query} near ${location}`;
  console.log(`🔍 Searching for contractors: "${searchQuery}"`);
  
  if (!apiKey) {
    console.warn('⚠️  PARALLEL_API_KEY not set, using mock data');
    return getMockContractors(query, location);
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
function getMockContractors(query: string = '', location: string = '') {
  // Generate more realistic mock contractors based on query
  const serviceType = query.toLowerCase();
  const city = location.split(',')[0] || location;
  
  const contractors = [
    {
      name: `${city} ${serviceType} Pro`,
      website: `https://${city.toLowerCase().replace(' ', '')}-${serviceType.replace(' ', '-')}.com`,
      snippet: `Professional ${serviceType} services in ${city}. Licensed and insured.`,
    },
    {
      name: `Elite ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Services`,
      website: `https://elite-${serviceType.replace(' ', '-')}-${city.toLowerCase().replace(' ', '-')}.com`,
      snippet: `Top-rated ${serviceType} company serving ${city}. Fast response time.`,
    },
    {
      name: `${city} Local ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}`,
      website: `https://local-${serviceType.replace(' ', '-')}.com`,
      snippet: `Local ${serviceType} experts. Competitive pricing. 24/7 availability.`,
    },
  ];
  
  return contractors;
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
    
    // Create provider even if no contacts found (will use website as contact method)
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
    
    // Add contact methods (or website as fallback)
    if (emails.length > 0) {
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
    } else {
      // Add website as contact method if no email found
      await prisma.contactMethod.create({
        data: {
          providerId: provider.id,
          kind: 'email',
          value: `contact@${result.website.replace('https://', '').replace('http://', '').replace('www.', '')}`,
          sourceUrl: result.website,
          confidence: 0.3,
          allowed: false, // Mark as not verified
        },
      });
    }
    
    if (phones.length > 0) {
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
