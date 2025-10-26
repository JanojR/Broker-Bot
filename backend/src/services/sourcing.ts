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
 * Search for contractors using Google via SerpAPI
 */
export async function searchContractors(query: string, location: string): Promise<any[]> {
  const apiKey = process.env.SERP_API_KEY;
  const searchQuery = `${query} ${location}`;
  console.log(`🔍 Searching Google for: "${searchQuery}"`);
  console.log(`API Key exists: ${!!apiKey}`);
  
  if (!apiKey || apiKey === 'your-serp-api-key') {
    console.warn('⚠️  SERP_API_KEY not set, using mock data with improved scraping');
    const mockResults = getMockContractors(query, location);
    return mockResults;
  }
  
  try {
    console.log(`🔗 Calling SerpAPI...`);
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: searchQuery,
        engine: 'google',
        api_key: apiKey,
        num: 20,
        hl: 'en',
        gl: 'us',
        // Add filters to get local businesses
        safe: 'active',
      },
    });
    
    console.log('📊 SerpAPI response:', JSON.stringify(response.data).substring(0, 200));
    
    const results = response.data.organic_results || [];
    console.log(`✅ Found ${results.length} results from Google`);
    
    if (results.length > 0) {
      // Filter out generic articles and keep only business websites
      const businessResults = results
        .filter((result: any) => {
          const link = result.link || '';
          const title = result.title || '';
          // Skip generic "best of" articles
          if (title.toLowerCase().includes('best ') || 
              title.toLowerCase().includes('top ') ||
              title.toLowerCase().includes('review')) {
            return false;
          }
          // Keep only real business domains
          return link && !link.includes('best-') && !link.includes('top-');
        })
        .slice(0, 15); // Get top 15 business results
      
      console.log(`🎯 Found ${businessResults.length} actual business websites`);
      
      return businessResults.map((result: any) => ({
        name: result.title || 'Unknown',
        website: result.link,
        snippet: result.snippet || '',
      }));
    }
    
    // No results from SerpAPI, use mocks
    console.warn('No results from SerpAPI, using mock data');
    return getMockContractors(query, location);
  } catch (error: any) {
    console.error('❌ Google search failed:', error.message);
    console.error('Error details:', error.response?.data || error);
    return getMockContractors(query, location);
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
  
  // Enrich each result (show all contractors on page)
  for (const result of results.slice(0, 8)) {
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
    
    // Add contact methods (disabled for real contractors - won't be contacted)
    if (emails.length > 0) {
      for (const email of emails) {
        await prisma.contactMethod.create({
          data: {
            providerId: provider.id,
            kind: 'email',
            value: email,
            sourceUrl: result.website,
            confidence: 0.8,
            allowed: false, // Disabled - won't contact real contractors
          },
        });
      }
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
            allowed: false, // Disabled - won't contact real contractors
          },
        });
      }
    }
  }
  
  // Add demo contractors with provided phone numbers (ONLY these will be contacted)
  console.log('📞 Adding demo contractors with phone numbers...');
  const demoContractors = [
    {
      name: 'Premier Cleaning Services',
      website: 'https://premier-cleaning-demo.com',
      snippet: 'Premium cleaning service provider',
      phone: '+18586105361',
    },
    {
      name: 'Elite Professional Services',
      website: 'https://elite-services-demo.com',
      snippet: 'Top-tier professional cleaning and maintenance',
      phone: '+13108949312',
    },
  ];
  
  for (const demo of demoContractors) {
    const provider = await prisma.provider.create({
      data: {
        projectId,
        name: demo.name,
        website: demo.website,
        serviceAreaText: demo.snippet,
        score: 0.9, // Higher score for demo contractors
        evidenceUrls: [demo.website],
        notes: 'Demo contractor for negotiation testing',
      },
    });
    
    // Add phone number
    await prisma.contactMethod.create({
      data: {
        providerId: provider.id,
        kind: 'sms',
        value: demo.phone,
        sourceUrl: demo.website,
        confidence: 1.0, // 100% confidence for demo
        allowed: true,
      },
    });
  }
  
  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'awaiting_approval' },
  });
  
  // Auto-start outreach for demo contractors (simulated)
  console.log('🚀 Starting automated outreach to demo contractors...');
  
  return { success: true, candidatesFound: results.length, autoOutreach: true };
}
