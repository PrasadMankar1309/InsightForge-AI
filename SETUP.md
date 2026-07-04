# Company Intel Studio - Complete Setup & Deployment Guide

## Overview
Company Intel Studio is a production-ready Next.js application that researches companies, crawls their public websites, generates AI-powered summaries using OpenRouter, and produces professional PDF reports with Discord integration.

## What's Included
- **Frontend**: Modern React UI with Tailwind CSS, responsive design, real-time progress tracking
- **Backend**: Next.js API routes with website crawling, AI integration, and PDF generation
- **Services**: Serper search integration, OpenRouter AI analysis, Discord webhooks
- **Database**: None (in-memory, no persistence needed)
- **Deployment**: Vercel-ready with environment variables

---

## Quick Start (Local Development)

### Step 1: Clone/Download the Project
```bash
# If this is in a folder, navigate to it:
cd c:\Users\user\OneDrive\Desktop\AI
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables
1. Copy `.env.example` to `.env.local`:
```bash
copy .env.example .env.local
```

2. Edit `.env.local` and add your API keys:
```
SERPER_API_KEY=your_serper_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here (optional)
DISCORD_CHANNEL_ID=your_discord_channel_id_here (optional)
```

### Step 4: Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

### Step 5: Use the Application
1. Enter a company name (e.g., "Tesla")
2. Enter the company website (e.g., "https://www.tesla.com")
3. Optionally configure Discord settings to receive notifications
4. Click "Generate report"
5. Wait for the research to complete (Searching → Crawling → AI Analysis → Competitor Research → PDF Generation)
6. Download the generated PDF

---

## API Keys Setup

### Serper API (Website Search)
1. Go to https://serper.dev/
2. Sign up for a free account
3. Copy your API key
4. Paste into `.env.local` as `SERPER_API_KEY`

### OpenRouter API (AI Analysis)
1. Go to https://openrouter.ai/
2. Sign up and get an API key
3. Paste into `.env.local` as `OPENROUTER_API_KEY`
4. You can use any OpenRouter model (default: `openai/gpt-4o-mini`)

### Discord Webhook (Optional)
1. Create a Discord server (or use existing one)
2. Right-click a channel → Edit Channel → Integrations → Webhooks → New Webhook
3. Copy the webhook URL
4. Extract `DISCORD_BOT_TOKEN` (from URL) and `DISCORD_CHANNEL_ID` (from URL)
5. Paste both into `.env.local`

---

## Production Build & Local Testing

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

The app will run on `http://localhost:3000`.

---

## Vercel Deployment

### Method 1: Direct Deployment (Recommended)
1. Push your code to GitHub (or GitLab/Bitbucket)
2. Go to https://vercel.com/
3. Click "Add New" → "Project"
4. Select your repository
5. Vercel auto-detects Next.js
6. Under "Environment Variables", add:
   - `SERPER_API_KEY`
   - `OPENROUTER_API_KEY`
   - `DISCORD_BOT_TOKEN` (optional)
   - `DISCORD_CHANNEL_ID` (optional)
7. Click "Deploy"

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts, add environment variables in the Vercel dashboard.

---

## Project Structure
```
.
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main UI component
│   ├── globals.css             # Tailwind + custom styles
│   └── api/
│       ├── generate/
│       │   └── route.ts        # Main generation API (crawl → AI → PDF)
│       └── files/[fileName]/
│           └── route.ts        # PDF download endpoint
├── components/                 # (empty, ready for components)
├── lib/                        # (empty, ready for utilities)
├── public/reports/             # Generated PDFs stored here
├── .env.example                # Environment template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── next.config.js              # Next.js config
└── README.md                   # This file
```

---

## Features

### Core Features
✅ Company name and website input  
✅ Serper-powered website discovery  
✅ Same-domain website crawling (up to 12 pages)  
✅ OpenRouter AI analysis for summaries and competitor suggestions  
✅ Professional PDF generation with typography  
✅ Real-time progress tracking (Searching → Crawling → AI Analysis → Competitor Research → PDF Generation)  
✅ Download PDF reports  

### Bonus Features
✅ Model selector (any OpenRouter model)  
✅ Discord webhook notifications  
✅ Applicant name and email tracking  
✅ In-memory caching for repeated queries  
✅ Error handling with fallback responses  
✅ Responsive design (mobile + desktop)  
✅ Source tracking in reports  

---

## Troubleshooting

### "Port 3000 is already in use"
The app will automatically try ports 3001, 3002, etc. Check the terminal output for which port is available.

### "Error: Cannot find module..."
Run `npm install` again to ensure all dependencies are installed.

### "API key not found"
Make sure `.env.local` exists and contains your API keys (not `.env.example`).

### PDF generation errors
The app uses `pdf-lib` which requires no external font files. If you see PDF errors, check that the API response is valid JSON.

### Build fails with TypeScript errors
Run:
```bash
npm run build
```

If it still fails, delete `.next` folder and try again:
```bash
rmdir /s /q .next
npm run build
```

---

## What Happens When You Generate a Report

1. **Searching**: Serper searches for the company's official website
2. **Crawling**: The app fetches up to 12 relevant pages from the company's website
3. **AI Analysis**: OpenRouter generates a summary, extracts products/services, identifies pain points
4. **Competitor Research**: AI suggests competitors in the same industry
5. **PDF Generation**: A professional PDF is created with all findings
6. **Discord Notification** (if enabled): A message is sent to your Discord channel with applicant info

---

## Example Workflow

```
Input:
- Company: Tesla
- Website: https://www.tesla.com
- Applicant: John Doe
- Email: john@example.com

Output:
- Summary: Tesla is an electric vehicle and renewable energy company...
- Products: [Model S, Model 3, Model Y, Cybertruck, Energy Storage]
- Services: [Charging Network, Service Centers, Insurance]
- Pain Points: [High prices, Limited charging infrastructure, Supply chain]
- Competitors: [Ford, GM, Volkswagen]
- PDF: tesla-[uuid].pdf (downloadable)
- Discord: Notification sent to configured channel
```

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `SERPER_API_KEY` | Yes | `serper_xxxxxxxxxxxxx` |
| `OPENROUTER_API_KEY` | Yes | `sk-or-xxxxxxxxxxxxx` |
| `DISCORD_BOT_TOKEN` | No | `MTk4NjIyNDgzMjExODE4NzY4.xxxxx` |
| `DISCORD_CHANNEL_ID` | No | `1234567890` |

---

## API Endpoint Reference

### POST /api/generate
Generates a company report.

**Request Body:**
```json
{
  "companyName": "Tesla",
  "companyWebsite": "https://www.tesla.com",
  "model": "openai/gpt-4o-mini",
  "applicantName": "John Doe",
  "applicantEmail": "john@example.com",
  "discordBotToken": "...",
  "discordChannelId": "..."
}
```

**Response:**
```json
{
  "companyName": "Tesla",
  "companyWebsite": "https://www.tesla.com",
  "summary": "...",
  "products": [...],
  "services": [...],
  "painPoints": [...],
  "competitors": [...],
  "sources": [...],
  "generatedAt": "2026-07-04T12:00:00.000Z",
  "pdfUrl": "/api/files/tesla-uuid.pdf"
}
```

### GET /api/files/[fileName]
Downloads a generated PDF.

Example: `/api/files/tesla-a1b2c3d4.pdf`

---

## Performance & Limitations

- **Crawling**: Limited to 12 pages per domain to avoid timeouts
- **AI**: Uses OpenRouter (no native API integration, supports 100+ models)
- **Cache**: In-memory cache (cleared on server restart)
- **PDF Size**: Typically 50-200 KB per report
- **Timeout**: 10 minutes for full report generation

---

## Development Tips

### Modify UI
Edit `app/page.tsx` to change the interface.

### Change Crawling Logic
Edit `app/api/generate/route.ts` → `crawlSite()` function.

### Update AI Prompts
Edit `app/api/generate/route.ts` → `buildPrompt()` function.

### Add New API Routes
Create files in `app/api/` following the pattern of existing routes.

---

## Support

If you encounter issues:
1. Check `.env.local` has all required API keys
2. Verify API keys are valid at their respective services
3. Check internet connection (for crawling and API calls)
4. Review browser console for errors
5. Check terminal output for backend errors

---

## Next Steps

1. ✅ Set up `.env.local` with API keys
2. ✅ Run `npm install && npm run dev`
3. ✅ Open http://localhost:3000
4. ✅ Test with a company (e.g., Tesla)
5. ✅ Download and review the PDF
6. ✅ Deploy to Vercel (optional)

---

## Production Deployment Checklist

- [ ] API keys are set in production environment
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production build
- [ ] PDF downloads work correctly
- [ ] Discord webhooks fire (if enabled)
- [ ] Caching works as expected
- [ ] Responsive design tested on mobile

---

## License
Open source for educational and commercial use.

---

**Ready to go!** Start with Step 1 above and you'll have a working company intelligence dashboard in minutes.
