# Contractr.AI - Contractor Sourcing & Negotiation Agent

A two-stage AI agent that automatically discovers contractors and negotiates the best deals.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start database services
docker-compose up -d

# 3. Setup environment
cp env.example .env
# Edit .env with your API keys

# 4. Initialize database
npm run db:generate
npm run db:push

# 5. Start development
npm run dev
```

Visit http://localhost:3000

## 📋 Overview

**Stage 1 - Discovery**
- Searches for contractors using web directories and business sites
- Extracts and validates contact info (email/phone)
- Scores and ranks candidates based on relevance
- Enriches data with service area, ratings, and evidence

**Stage 2 - Negotiation**
- Sends personalized outreach via email/SMS
- Negotiates terms using AI (price matching, bundles, off-peak discounts)
- Parses quotes and tracks conversation threads
- Compares offers and recommends the best option

## 🏗️ Architecture

- **Frontend**: Next.js 14 with Tailwind CSS (App Router)
- **Backend**: Express + TypeScript API
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ + Redis for background jobs
- **Scraping**: Playwright + Cheerio for contact extraction
- **Messaging**: SendGrid (Email), Twilio (SMS)
- **LLM**: OpenAI GPT-4 for negotiation and quote parsing

## ✨ Key Features

- ✅ **Automated Sourcing**: Web scraping finds contractors with validated contacts
- ✅ **Multi-Channel Outreach**: Email + SMS with ethical templates
- ✅ **AI-Powered Negotiation**: Smart counter-offers based on competitor quotes
- ✅ **Quote Comparison**: Real-time dashboard with side-by-side analysis
- ✅ **Compliance**: TCPA/CAN-SPAM compliant with opt-out handling
- ✅ **Audit Trail**: Complete message history and event logging

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [API Reference](./docs/API.md) - REST API endpoints
- [Architecture](./docs/ARCHITECTURE.md) - System design details

## 🎯 Usage

### 1. Create Project
Enter service type, location, budget, and timeline.

### 2. Start Sourcing
System discovers 5-10 contractors with contact info.

### 3. Review Candidates
Approve/reject candidates before outreach.

### 4. Automated Outreach
AI sends initial requests and negotiates terms.

### 5. Compare & Decide
Review quotes and select the best offer.

## 🔧 Configuration

Required API keys (see `.env.example`):
- OpenAI (LLM)
- SendGrid (Email)
- Twilio (SMS)
- SerpAPI (Search, optional - uses mock data if not set)

## 📝 License

MIT License - Built for hackathon demo
