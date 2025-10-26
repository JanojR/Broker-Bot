# 🚀 Quick Start - Contractr.AI

## For Hackathon Judges

This is a two-stage AI agent that:
1. **Discovers** contractors by scraping the web for contact info
2. **Negotiates** by sending emails/SMS and negotiating the best deals

## ⚡ 5-Minute Demo

```bash
# 1. Start database (Docker)
docker-compose up -d

# 2. Install dependencies
npm install
cd backend && npm install && cd ../frontend && npm install

# 3. Setup database
cd backend && npx prisma generate && npx prisma db push

# 4. Start services
cd .. && npm run dev
# Or separately:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# 5. Visit http://localhost:3000
```

## 🎯 Demo Without API Keys

The system works in **demo mode** without API keys:
- Uses mock contractor data (no SerpAPI)
- Logs emails/SMS instead of sending (no SendGrid/Twilio)
- Uses simple templates (no OpenAI)

To see full functionality, add API keys to `.env`.

## 📸 What You'll See

1. **Homepage** → Landing page with feature overview
2. **Projects List** → All sourcing jobs
3. **Create Project** → Enter service type, location, budget
4. **Project Detail** → See candidates, quotes, conversations
5. **Start Sourcing** → Discovers 5-10 contractors
6. **Outreach** → Sends emails to contractors
7. **Quotes** → Compares offers side-by-side

## 🎬 Demo Script

1. Go to "Create Project"
2. Enter: "House cleaning in San Jose under $300"
3. Click "Create Project"
4. Click "Start Sourcing" (happens instantly in demo)
5. See 5+ candidates with contact info
6. Click a provider → See email/phone details
7. Check "Quotes" panel → See parsed quotes

## 🏗️ Architecture Highlights

- **Next.js 14** (App Router) frontend
- **Express** + TypeScript backend
- **Prisma** ORM with PostgreSQL
- **BullMQ** for background jobs
- **SendGrid** + **Twilio** for messaging
- **OpenAI GPT-4** for negotiation

## 📋 All Requirements Met

From the PRD:

- ✅ G1: Accept user request with seed contractors
- ✅ G2: Source contractors via web discovery
- ✅ G3: Outreach via email/SMS with guardrails
- ✅ G4: Track quotes, conversation state, ranked recommendations
- ✅ G5: TCPA/CAN-SPAM compliance, opt-outs, quiet hours

See `HACKATHON_NOTES.md` for full checklist.

## 🔧 Troubleshooting

**Port already in use?**
- Backend: Change `PORT` in `.env`
- Frontend: Edit `frontend/package.json` dev script

**Database errors?**
```bash
cd backend && npx prisma db push --force-reset
```

**Module not found?**
```bash
rm -rf node_modules && npm install
```

## 📚 Documentation

- `README.md` - Overview
- `SETUP.md` - Detailed setup
- `HACKATHON_NOTES.md` - Implementation notes
- `docs/ARCHITECTURE.md` - System design

## 💡 Key Features

- **Compliant**: TCPA/CAN-SPAM with opt-out handling
- **Ethical**: No scraping behind logins, respects robots.txt
- **Transparent**: All messages disclose AI agent role
- **Flexible**: Works with or without API keys (demo mode)
- **Complete**: Full audit trail, quote comparison, decision tools

Built in 12 hours for hackathon. Happy judging! 🎉
