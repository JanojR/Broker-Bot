# Contractr.AI Setup Guide

## Quick Start (Hackathon)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for database services)

### 1. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Database

#### Option A: Docker (Recommended)
```bash
docker-compose up -d
```

#### Option B: Local PostgreSQL
Create a database:
```sql
CREATE DATABASE contractr;
```

### 3. Configure Environment

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` and add your API keys:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `SENDGRID_API_KEY` - SendGrid for email
- `SENDGRID_FROM_EMAIL` - Your verified sender email
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `SERP_API_KEY` - SerpAPI key for search (optional, uses mock data if not set)

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed demo data (optional)
cd backend && npm run db:seed
```

### 5. Start Services

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### 6. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `cd backend && npm run db:studio`

## Development Workflow

### Creating a Project

1. Navigate to http://localhost:3000/projects/new
2. Fill in the form:
   - Title: e.g., "2-bedroom move-out clean"
   - Type: e.g., "House Cleaning"
   - Address, City, Zip
   - Budget: e.g., 300
   - Date Window: e.g., "Next week"
3. Click "Create Project"

### Stage 1: Sourcing

1. On the project detail page, click "Start Sourcing"
2. The system will:
   - Search for contractors using SerpAPI or mock data
   - Visit each contractor's website
   - Extract email addresses and phone numbers
   - Score and rank candidates
3. Candidates appear in the dashboard

### Stage 2: Outreach

1. Review candidates and their contact info
2. Initiate outreach (currently manual via API):
   ```bash
   curl -X POST http://localhost:3001/api/v1/providers/{providerId}/outreach/init
   ```
3. The system sends emails/SMS to contractors
4. View quotes and conversations in the dashboard

### Viewing Results

- Projects list: `/projects`
- Project detail: `/projects/{id}`
- Compare quotes side-by-side
- View conversation threads
- Track message history

## API Endpoints

### Projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/:id` - Get project
- `POST /api/v1/projects/:id/sourcing/start` - Start sourcing

### Providers
- `POST /api/v1/providers/:id/outreach/init` - Initiate outreach

### Webhooks
- `POST /api/v1/webhooks/email` - Inbound email
- `POST /api/v1/webhooks/sms` - Inbound SMS

## Without API Keys

The system works in demo mode without API keys:
- SerpAPI: Uses mock contractor data
- SendGrid/Twilio: Logs messages instead of sending
- OpenAI: Falls back to simple template-based messages

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Reset database
npm run db:push
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
Change ports in:
- Backend: `backend/src/index.ts` (PORT environment variable)
- Frontend: `frontend/package.json` (dev script)

## Next Steps

1. Configure SendGrid domain authentication
2. Setup Twilio webhooks for SMS replies
3. Add user authentication
4. Implement quote parsing from replies
5. Add counter-offer generation
6. Build comparison and decision UI
