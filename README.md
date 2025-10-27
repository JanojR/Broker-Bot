# Contractr.AI - Automated Contractor Sourcing & Negotiation

A two-stage AI agent that automatically discovers contractors and negotiates the best deals via real SMS.

## 🎯 What It Does

**Stage 1 - Discovery**
- Searches Google for real contractors using SerpAPI
- Scrapes business websites for contact information (email/phone)
- Scores and ranks candidates by relevance

**Stage 2 - Negotiation**
- Sends real SMS via Twilio to demo contractors
- Uses Claude AI to generate negotiation messages
- Parses quote responses and compares offers
- Recommends the best contractor based on price and terms

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)
- Twilio account (for real SMS)

### Installation

1. **Clone and install:**
```bash
git clone <your-repo>
cd contractr-ai
npm install
cd backend && npm install && cd ../frontend && npm install
```

2. **Start database services:**
```bash
docker compose up -d
```

3. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your API keys (see below)
```

4. **Initialize database:**
```bash
cd backend
npm run db:generate
npm run db:push
```

5. **Start services:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit **http://localhost:3000**

## 📱 Demo Features

### Real SMS Integration
- **Sends actual SMS** to demo contractors using Twilio
- Demo contractors:
  - Premier Cleaning Services → 8586105361
  - Elite Professional Services → 3108949312
- You will **receive real SMS messages** on these numbers

### AI-Powered Negotiation
- Claude AI generates professional negotiation messages
- Supports multiple strategies: price match, bundle deals, off-peak discounts
- Parses quotes from SMS responses
- Compares offers automatically

## 🔑 Required API Keys

### Essential
- **SerpAPI** - For real contractor search
  - Get free key: https://serpapi.com/users/sign_up
  - Add to `.env`: `SERP_API_KEY="your-key"`

- **Twilio** - For real SMS sending
  - Get free account: https://www.twilio.com/try-twilio
  - Add to `.env`:
    ```bash
    TWILIO_ACCOUNT_SID="AC..."
    TWILIO_AUTH_TOKEN="your-token"
    TWILIO_PHONE_NUMBER="+18556864165"
    ```

### Optional
- **Claude AI** - For advanced negotiation (enabled by default)
  - Get key: https://console.anthropic.com/
  - Add to `.env`: `CLAUDE_API_KEY="your-key"`

## 📖 How to Use

1. **Create a Project**
   - Title: "House cleaning in San Jose"
   - Type: "House Cleaning"
   - City: "San Jose"
   - Budget: 300

2. **Start Sourcing**
   - Click "Start Sourcing"
   - System finds real contractors via Google
   - Shows 8-10 contractors + 2 demo contractors

3. **Start Negotiations**
   - Click "Start Negotiations"
   - **You receive real SMS** on 8586105361 and 3108949312
   - Claude AI generates professional request messages

4. **Respond with Quotes**
   - Reply to SMS with a quote (e.g., "$250 for the job")
   - System parses your response
   - Updates the dashboard with the quote

5. **Compare & Decide**
   - View quotes side-by-side
   - System recommends the best option
   - Select winning contractor

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Search**: SerpAPI (Google search)
- **Scraping**: Cheerio + axios
- **SMS**: Twilio Programmable SMS
- **AI**: Claude AI (Anthropic) for negotiations
- **Queue**: BullMQ with Redis

## 📊 Database Schema

- `User` - App users
- `Project` - Sourcing jobs
- `Provider` - Contractors (real + demo)
- `ContactMethod` - Email/phone contacts
- `Thread` - Conversation threads
- `Message` - Individual messages
- `Quote` - Structured quotes
- `CounterOffer` - Negotiation attempts

## 🔒 Safety Features

- Only demo phone numbers receive SMS (real contractors disabled)
- TCPA/CAN-SPAM compliant messaging
- Opt-out support (reply STOP)
- Rate limiting and quiet hours
- Complete audit trail

## 🎬 Demo Flow

1. Search finds real contractors (display only)
2. Adds 2 demo contractors with your phone numbers
3. Click "Start Negotiations"
4. **Real SMS sent** to 8586105361 and 3108949312
5. Reply to SMS with quotes
6. System compares and recommends best offer

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Architecture](./docs/ARCHITECTURE.md) - System design
- [Project Summary](./PROJECT_SUMMARY.md) - Feature overview

## 🎯 Use Cases

- **Homeowners**: Get multiple contractor quotes fast
- **Property Managers**: Automate vendor sourcing
- **Businesses**: Streamline procurement for services

## 📝 License

MIT License - Built for hackathon demo

---

**Built with ❤️ for the hackathon**