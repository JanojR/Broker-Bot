# System Architecture

## High-Level Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Frontend  │──────▶│   Backend   │──────▶│  Database   │
│  (Next.js)  │◀──────│  (Express)  │◀──────│(PostgreSQL) │
└─────────────┘       └─────────────┘       └─────────────┘
                              │
                              ├─────────────┐
                              │             │
                              ▼             ▼
                       ┌─────────────┐ ┌─────────────┐
                       │   Queue     │ │  Services   │
                       │  (BullMQ)   │ │ (External)  │
                       └─────────────┘ └─────────────┘
```

## Data Flow

### Stage 1: Sourcing

```
User Input → Project Creation
     │
     ▼
  Enqueue Sourcing Job
     │
     ├─→ Search (SerpAPI)
     ├─→ Scrape (Playwright)
     ├─→ Extract Contacts (Cheerio)
     └─→ Store Providers (Prisma)
```

### Stage 2: Outreach

```
Approved Providers → Initiate Outreach
     │
     ├─→ Email (SendGrid)
     ├─→ SMS (Twilio)
     └─→ Track Threads
```

### Stage 3: Negotiation

```
Received Response → Parse Quote (LLM)
     │
     ├─→ Compare Quotes
     ├─→ Generate Counter (LLM)
     └─→ Update Recommendation
```

## Core Services

### Sourcing Service (`backend/src/services/sourcing.ts`)
- `extractContacts(url)` - Scrape website for email/phone
- `searchContractors(query, location)` - Search via SerpAPI
- `processSourcing(projectId)` - Orchestrate full sourcing

### Messaging Service (`backend/src/services/messaging.ts`)
- `sendEmail(to, subject, body)` - Send via SendGrid
- `sendSMS(to, body)` - Send via Twilio
- `initiateOutreach(providerId)` - Create thread and send initial

### LLM Service (`backend/src/services/llm.ts`)
- `generateCounterOffer(...)` - Negotiation strategy
- `parseQuote(body)` - Extract structured quote

### Compliance Service (`backend/src/services/compliance.ts`)
- `isWithinQuietHours(quietHours)` - Time check
- `isStopRequest(body)` - Opt-out detection
- `checkRateLimit(key)` - Throttle sending

## API Routes

### Projects (`/api/v1/projects`)
- `POST /` - Create
- `GET /` - List
- `GET /:id` - Detail
- `POST /:id/sourcing/start` - Trigger sourcing

### Providers (`/api/v1/providers`)
- `POST /:id/outreach/init` - Send outreach

### Threads (`/api/v1/threads`)
- `POST /:id/messages` - Send message

### Webhooks (`/api/v1/webhooks`)
- `POST /email` - Inbound email
- `POST /sms` - Inbound SMS

## Database Schema

```
User (1) ────── (many) Project
                        │
                        ├─ (many) Provider
                        │   ├─ (many) ContactMethod
                        │   └─ (many) Thread
                        │       └─ (many) Message
                        ├─ (many) Quote
                        └─ (many) Event (audit)
```

## Frontend Pages

- `/` - Landing page
- `/projects` - Projects list
- `/projects/new` - Create project
- `/projects/:id` - Project detail (candidates, quotes, threads)

## Security & Compliance

- ✅ Rate limiting on API endpoints
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS protection (React escaping)
- ✅ CORS configuration
- ✅ Environment variable secrets
- ✅ Audit trail for all actions
- ✅ Opt-out handling (STOP for SMS, unsubscribe for email)

## Production Considerations

- Add Redis for proper job queue
- Add authentication middleware
- Add request logging
- Add error tracking (Sentry)
- Add monitoring (Prometheus/Grafana)
- Scale workers horizontally
- Use connection pooling for DB
- Add CDN for frontend assets
