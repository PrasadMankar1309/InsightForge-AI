# Company Intel Studio - Quick Start Checklist

## 🚀 Get Running in 5 Minutes

### Step 1: Get API Keys (2 minutes)
- [ ] Go to https://serper.dev/ → Sign up → Copy API key
- [ ] Go to https://openrouter.ai/ → Sign up → Copy API key
- [ ] (Optional) Create Discord bot token from Discord Developer Portal

### Step 2: Configure Environment (1 minute)
```bash
# Copy example to local config
copy .env.example .env.local

# Edit .env.local and paste your API keys
notepad .env.local
```

Add these three lines:
```
SERPER_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
DISCORD_BOT_TOKEN=optional_key_here
DISCORD_CHANNEL_ID=optional_id_here
```

### Step 3: Install & Run (2 minutes)
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 4: Open & Test (1 minute)
- Open http://localhost:3000
- Enter a company name (e.g., "Tesla")
- Enter website (e.g., "https://www.tesla.com")
- Click "Generate report"
- Download the PDF

---

## 📋 Complete Feature List

| Feature | Status |
|---------|--------|
| Company name input | ✅ Done |
| Website URL input | ✅ Done |
| Serper search integration | ✅ Done |
| Website crawling (up to 12 pages) | ✅ Done |
| Duplicate page detection | ✅ Done |
| Content cleaning | ✅ Done |
| OpenRouter AI integration | ✅ Done |
| Model selection UI | ✅ Done |
| Summary generation | ✅ Done |
| Products/services extraction | ✅ Done |
| Pain points identification | ✅ Done |
| Competitor suggestions | ✅ Done |
| Professional PDF generation | ✅ Done |
| PDF download | ✅ Done |
| Discord webhook notifications | ✅ Done |
| Applicant tracking | ✅ Done |
| Real-time progress (5 steps) | ✅ Done |
| Responsive UI (mobile + desktop) | ✅ Done |
| Dark mode | ✅ Done |
| Loading states & animations | ✅ Done |
| Error handling & fallbacks | ✅ Done |
| In-memory caching | ✅ Done |
| Source references | ✅ Done |

---

## 🔧 What's in Each File

**Frontend:**
- `app/page.tsx` - Main UI with form, progress, and results display

**Backend:**
- `app/api/generate/route.ts` - Core logic: search, crawl, AI, PDF, Discord
- `app/api/files/[fileName]/route.ts` - PDF download endpoint

**Configuration:**
- `.env.local` - Your API keys (create from .env.example)
- `tsconfig.json` - TypeScript settings
- `tailwind.config.ts` - Tailwind CSS
- `next.config.js` - Next.js settings
- `package.json` - Dependencies

**Deployment:**
- `SETUP.md` - Detailed setup guide
- `setup.bat` - Automated setup script for Windows

---

## 🚢 Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to https://vercel.com/
3. Click "Add New" → "Project"
4. Select your GitHub repository
5. Add environment variables:
   - `SERPER_API_KEY`
   - `OPENROUTER_API_KEY`
   - `DISCORD_BOT_TOKEN` (optional)
   - `DISCORD_CHANNEL_ID` (optional)
6. Click "Deploy"
7. Get your live URL (e.g., `https://company-intel.vercel.app`)

---

## 📊 What Happens When You Generate a Report

```
User Input:
├─ Company Name: "Tesla"
├─ Website: "https://www.tesla.com"
└─ Optional Discord settings

Processing:
├─ 1. Search for official website (Serper)
├─ 2. Crawl up to 12 pages (same domain only)
├─ 3. Extract & clean content
├─ 4. Send to OpenRouter for AI analysis
├─ 5. Generate professional PDF
├─ 6. Save PDF locally
└─ 7. Notify Discord (if configured)

Output:
├─ Company Summary
├─ Products list
├─ Services list
├─ Pain points (AI-identified)
├─ Competitors (AI-suggested)
├─ PDF file (downloadable)
└─ Discord notification
```

---

## 🎯 Example Commands

```bash
# Development (auto-reload on changes)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Check for errors
npm run lint

# Quick setup on Windows
setup.bat
```

---

## ❓ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Port 3000 already in use" | App auto-tries 3001, 3002, etc. Check terminal output |
| "Cannot find module" | Run `npm install` |
| "API key not found" | Make sure `.env.local` exists (not `.env.example`) |
| "PDF generation error" | Check that OpenRouter response is valid JSON |
| "Build fails" | Delete `.next` folder, run `npm run build` again |

---

## 💡 API Keys Explained

**SERPER_API_KEY:**
- Use: Finding company official websites
- Get from: https://serper.dev/ (free tier: 100/month)
- Format: `serper_xxxxxxxxxxxxx`

**OPENROUTER_API_KEY:**
- Use: AI analysis (summaries, extraction, competitors)
- Get from: https://openrouter.ai/ (requires credits)
- Format: `sk-or-xxxxxxxxxxxxx`
- Models: openai/gpt-4o-mini (default), or any OpenRouter model

**DISCORD_BOT_TOKEN:**
- Use: Sending notifications to Discord
- Get from: Discord Developer Portal
- Format: Long token string
- Optional: Leave blank to skip Discord integration

**DISCORD_CHANNEL_ID:**
- Use: Which Discord channel receives notifications
- Get from: Enable Developer Mode in Discord, right-click channel, copy ID
- Format: Numeric ID
- Optional: Leave blank to skip Discord integration

---

## 📁 Project Structure

```
project/
├── app/
│   ├── page.tsx          ← Main UI
│   ├── layout.tsx        ← Layout wrapper
│   ├── globals.css       ← Global styles
│   └── api/
│       ├── generate/     ← Core API
│       └── files/        ← PDF download
├── public/reports/       ← Generated PDFs
├── types/                ← TypeScript types
├── .env.example          ← Template
├── .env.local            ← Your config (create this)
├── package.json          ← Dependencies
├── tsconfig.json         ← TypeScript config
├── tailwind.config.ts    ← Tailwind config
├── next.config.js        ← Next.js config
├── setup.bat             ← Windows setup script
├── SETUP.md              ← Detailed guide
└── README.md             ← Project info
```

---

## ✨ Performance

- **Crawling**: Typically 3-5 seconds
- **AI Analysis**: Typically 5-15 seconds (depends on OpenRouter)
- **PDF Generation**: < 1 second
- **Total**: Usually 10-25 seconds per report
- **Cache**: Repeated queries instant (24-hour session memory)

---

## 🎓 Learning Resources

- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- pdf-lib: https://pdf-lib.js.org/
- cheerio: https://cheerio.js.org/
- axios: https://axios-http.com/

---

## 🎯 What You Can Do Next

After getting it running:

1. **Customize UI**: Edit `app/page.tsx` to change colors, layout, text
2. **Improve crawling**: Edit `app/api/generate/route.ts` → `crawlSite()` function
3. **Better prompts**: Edit `buildPrompt()` function for smarter AI analysis
4. **Add database**: Integrate PostgreSQL/MongoDB to save reports permanently
5. **Add authentication**: Add user login to restrict access
6. **Deploy**: Push to Vercel for live URL

---

## ✅ You're All Set!

Your Company Intel Studio is production-ready. Start with the 5-minute checklist above and you'll have a working app!

**Questions?** Check SETUP.md for detailed instructions.
