import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { randomUUID } from 'crypto';

const cache = new Map<string, any>();

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/https?:\/\//gi, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeUrl(raw: string) {
  try {
    if (!raw) return '';
    const value = raw.trim();
    if (!/^https?:\/\//i.test(value)) return `https://${value}`;
    return value;
  } catch {
    return raw;
  }
}

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isRelevantPath(pathname: string) {
  const ignored = ['login', 'signin', 'signup', 'register', 'forgot', 'privacy', 'terms', 'careers', 'blog', 'news'];
  const lowered = pathname.toLowerCase();
  if (ignored.some((token) => lowered.includes(token))) return false;
  return (
    ['about', 'product', 'products', 'service', 'services', 'solution', 'solutions', 'contact', 'pricing', 'home', 'team', 'mission', 'vision'].some(
      (token) => lowered.includes(token)
    ) || lowered === '/'
  );
}

function cleanText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

async function fetchText(url: string) {
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompanyIntelBot/1.0)' }
    });
    return res.data as string;
  } catch {
    return '';
  }
}

async function crawlSite(baseUrl: string) {
  const queue = [baseUrl];
  const visited = new Set<string>();
  const pages: string[] = [];
  const maxPages = 15;

  while (queue.length && pages.length < maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const pageUrl = normalizeUrl(current);
    if (!pageUrl) continue;

    const html = await fetchText(pageUrl);
    if (!html) continue;

    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const cleaned = cleanText(bodyText.slice(0, 5000));
    if (cleaned) {
      const pathname = (() => {
        try {
          return new URL(pageUrl).pathname;
        } catch {
          return '/';
        }
      })();
      if (isRelevantPath(pathname)) {
        pages.push(`[PAGE: ${title}]\n${cleaned}`);
      }
    }

    const links = $('a[href]')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(Boolean)
      .map((href) => href!.trim())
      .filter((href) => !href.startsWith('mailto:') && !href.startsWith('tel:'));

    for (const link of links) {
      try {
        const absolute = new URL(link, pageUrl).toString();
        if (!absolute.startsWith(baseUrl)) continue;
        const host = getHost(absolute);
        if (!host || host !== getHost(baseUrl)) continue;
        if (isRelevantPath(new URL(absolute).pathname) && !visited.has(absolute) && !queue.includes(absolute)) {
          queue.push(absolute);
        }
      } catch {
        // ignore bad links
      }
    }
  }

  return pages;
}

async function searchSerper(companyName: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return { officialSite: '', results: [] as any[] };

  const response = await axios.get('https://google.serper.dev/search', {
    params: { q: `${companyName} official website company info about` },
    headers: { 'X-API-KEY': apiKey },
    timeout: 60000
  });

  const organic = response.data.organic || [];
  const officialSite =
    organic.find((item: any) => /company|about|official/i.test(item.title || ''))?.link ||
    organic[0]?.link ||
    '';
  return { officialSite, results: organic.slice(0, 8) };
}

async function callOpenRouter(prompt: string, model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://company-intel-studio.vercel.app',
        'X-Title': 'Company Intel Studio'
      },
      timeout: 180000
    }
  );

  return response.data.choices?.[0]?.message?.content || '{}';
}

function buildComprehensivePrompt(companyName: string, website: string, crawlText: string[], serperResults: any[]) {
  const crawlContext = crawlText.join('\n\n').slice(0, 12000);
  const serperContext = serperResults
    .map((r: any) => `Title: ${r.title}\nSnippet: ${r.snippet}\nLink: ${r.link}`)
    .join('\n\n')
    .slice(0, 3000);

  return `You are a senior market intelligence analyst with 20+ years of experience. Analyze ${companyName} (website: ${website}) using the provided context and generate a comprehensive company intelligence report.

WEBSITE CONTENT:
${crawlContext}

SEARCH RESULTS:
${serperContext}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "companyProfile": {
    "name": "Official company name",
    "founders": ["Founder 1", "Founder 2"],
    "ceo": "Current CEO name",
    "foundingYear": "Year as string",
    "headquarters": "City, State/Country",
    "industry": "Primary industry",
    "website": "${website}",
    "employees": "Range or number e.g. 500-1000"
  },
  "missionVision": {
    "mission": "Company mission statement",
    "vision": "Company vision statement",
    "coreValues": ["Value 1", "Value 2", "Value 3"]
  },
  "businessAnalysis": {
    "products": ["Product 1", "Product 2", "Product 3"],
    "services": ["Service 1", "Service 2"],
    "revenueModel": "Description of how the company makes money",
    "targetCustomers": "Primary customer segments description",
    "marketPosition": "Where they stand in the market",
    "geographicPresence": "Countries or regions they operate in"
  },
  "growthAnalysis": {
    "growthJourney": "Narrative of company growth from founding to now",
    "expansionStrategy": "How they plan to grow",
    "recentDevelopments": ["Recent news 1", "Recent news 2"],
    "swot": {
      "strengths": ["Strength 1", "Strength 2", "Strength 3"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "opportunities": ["Opportunity 1", "Opportunity 2"],
      "threats": ["Threat 1", "Threat 2"]
    }
  },
  "aiInsights": {
    "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
    "technologyStack": ["Tech 1", "Tech 2", "Tech 3"],
    "digitalPresence": "Analysis of their online presence and digital strategy",
    "hiringTrends": ["Role 1", "Role 2"],
    "customerSegments": ["Segment 1", "Segment 2", "Segment 3"]
  },
  "competitors": [
    {
      "name": "Competitor name",
      "website": "https://competitor.com",
      "similarities": "What they have in common",
      "competitiveAdvantages": "What differentiates this competitor"
    }
  ],
  "marketSegments": [
    { "name": "Segment Name", "value": 40 }
  ],
  "growthTimeline": [
    { "year": "2020", "event": "Event description", "milestone": "Key milestone" }
  ],
  "sources": ["${website}", "https://search-result-url"]
}

Be accurate, insightful, and data-driven. Infer reasonable estimates from context when exact data is unavailable. Provide at least 3 competitors, 4 market segments, and 4 growth timeline entries. All arrays must have at least 2-3 items.`;
}

async function sendDiscordWebhook(payload: any, discordBotToken?: string, discordChannelId?: string) {
  const token = discordBotToken || process.env.DISCORD_BOT_TOKEN;
  const channelId = discordChannelId || process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) return;

  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload));

  try {
    await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, form, {
      headers: { Authorization: token, ...form.getHeaders() },
      timeout: 40000
    });
  } catch (error: any) {
    // Ignore Discord webhook failures so report generation still succeeds.
    console.warn('Discord webhook error:', error?.response?.status || error?.message || 'unknown');
  }
}

async function buildPdfBuffer(report: any) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const margin = 45;
  const lineHeight = 17;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = page.getSize();
  let y = height - margin;
  let pageNum = 1;

  const addPage = () => {
    // Footer on current page
    page.drawText(`Company Intel Studio  |  ${report.companyProfile?.name || report.companyName}  |  Page ${pageNum}`, {
      x: margin,
      y: 22,
      size: 8,
      font,
      color: rgb(0.4, 0.5, 0.6)
    });
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNum++;
    y = height - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 30) addPage();
  };

  const drawText = (text: string, x: number, size = 10, color = rgb(0.85, 0.87, 0.9), useBold = false) => {
    page.drawText(text, { x, y, size, font: useBold ? boldFont : font, color, maxWidth: width - x - margin });
    y -= lineHeight;
  };

  const wrapAndDraw = (text: string, x: number, size = 10, color = rgb(0.85, 0.87, 0.9), maxW?: number) => {
    const maxWidth = maxW || width - x - margin;
    const words = text.split(' ');
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      const tw = font.widthOfTextAtSize(next, size);
      if (tw > maxWidth && current) {
        ensureSpace(lineHeight);
        page.drawText(current, { x, y, size, font, color, maxWidth });
        y -= lineHeight;
        current = word;
      } else {
        current = next;
      }
    });
    if (current) {
      ensureSpace(lineHeight);
      page.drawText(current, { x, y, size, font, color, maxWidth });
      y -= lineHeight;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(40);
    y -= 8;
    page.drawRectangle({ x: margin, y: y - 4, width: width - margin * 2, height: 22, color: rgb(0.08, 0.16, 0.25) });
    page.drawText(title.toUpperCase(), { x: margin + 8, y: y + 2, size: 10, font: boldFont, color: rgb(0.4, 0.78, 0.95) });
    y -= 22;
  };

  const bullet = (text: string, indent = margin + 12) => {
    ensureSpace(lineHeight * 2);
    page.drawText('•', { x: indent - 10, y, size: 10, font, color: rgb(0.4, 0.78, 0.95) });
    wrapAndDraw(text, indent, 10, rgb(0.82, 0.85, 0.88), width - indent - margin);
  };

  // ── Cover Page ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.04, 0.07, 0.12) });
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: rgb(0.18, 0.55, 0.88) });
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 8, color: rgb(0.18, 0.55, 0.88) });

  const title = report.companyProfile?.name || report.companyName || 'Company Intelligence Report';
  page.drawText('COMPANY INTELLIGENCE REPORT', { x: margin, y: PAGE_HEIGHT - 100, size: 13, font: boldFont, color: rgb(0.4, 0.78, 0.95) });
  page.drawText(title, { x: margin, y: PAGE_HEIGHT - 135, size: 28, font: boldFont, color: rgb(0.95, 0.97, 1) });
  page.drawLine({ start: { x: margin, y: PAGE_HEIGHT - 155 }, end: { x: PAGE_WIDTH - margin, y: PAGE_HEIGHT - 155 }, thickness: 1, color: rgb(0.18, 0.55, 0.88) });

  const profile = report.companyProfile || {};
  const infoItems = [
    ['Industry', profile.industry || 'N/A'],
    ['Founded', profile.foundingYear || 'N/A'],
    ['Headquarters', profile.headquarters || 'N/A'],
    ['CEO', profile.ceo || 'N/A'],
    ['Employees', profile.employees || 'N/A'],
    ['Website', profile.website || report.companyWebsite || 'N/A']
  ];

  let infoY = PAGE_HEIGHT - 185;
  infoItems.forEach(([label, value]) => {
    page.drawText(`${label}:`, { x: margin, y: infoY, size: 9, font: boldFont, color: rgb(0.45, 0.55, 0.65) });
    page.drawText(value, { x: margin + 90, y: infoY, size: 9, font, color: rgb(0.82, 0.88, 0.95) });
    infoY -= 18;
  });

  page.drawText(`Generated: ${new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: margin,
    y: 80,
    size: 9,
    font,
    color: rgb(0.4, 0.5, 0.6)
  });
  page.drawText('CONFIDENTIAL — Generated by Company Intel Studio', {
    x: margin,
    y: 55,
    size: 8,
    font,
    color: rgb(0.3, 0.4, 0.5)
  });

  addPage();
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.04, 0.07, 0.12) });

  // ── Executive Summary ──────────────────────────────────────────────────────
  sectionTitle('Executive Summary');
  y -= 4;
  wrapAndDraw(report.summary || 'No summary available.', margin, 10, rgb(0.82, 0.85, 0.88));
  y -= 8;

  // ── Company Profile ────────────────────────────────────────────────────────
  sectionTitle('Company Profile');
  y -= 4;
  const profileFields: [string, string][] = [
    ['Company Name', profile.name || 'N/A'],
    ['Founders', (profile.founders || []).join(', ') || 'N/A'],
    ['CEO', profile.ceo || 'N/A'],
    ['Founded', profile.foundingYear || 'N/A'],
    ['Headquarters', profile.headquarters || 'N/A'],
    ['Industry', profile.industry || 'N/A'],
    ['Employees', profile.employees || 'N/A'],
    ['Website', profile.website || 'N/A']
  ];
  profileFields.forEach(([label, value]) => {
    ensureSpace(lineHeight * 2);
    page.drawText(`${label}:`, { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
    wrapAndDraw(value, margin + 100, 9, rgb(0.82, 0.85, 0.88), width - margin - 100 - margin);
    y -= 2;
  });

  // ── Mission & Vision ───────────────────────────────────────────────────────
  sectionTitle('Mission & Vision');
  const mv = report.missionVision || {};
  ensureSpace(50);
  y -= 4;
  page.drawText('Mission:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  wrapAndDraw(mv.mission || 'N/A', margin + 8, 10, rgb(0.82, 0.85, 0.88));
  y -= 4;
  page.drawText('Vision:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  wrapAndDraw(mv.vision || 'N/A', margin + 8, 10, rgb(0.82, 0.85, 0.88));
  y -= 4;
  page.drawText('Core Values:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (mv.coreValues || []).forEach((v: string) => bullet(v));

  // ── Business Analysis ──────────────────────────────────────────────────────
  const ba = report.businessAnalysis || {};
  sectionTitle('Products & Services');
  y -= 4;
  page.drawText('Products:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ba.products || []).forEach((p: string) => bullet(p));
  y -= 4;
  page.drawText('Services:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ba.services || []).forEach((s: string) => bullet(s));

  sectionTitle('Business Model');
  y -= 4;
  const bFields: [string, string][] = [
    ['Revenue Model', ba.revenueModel || 'N/A'],
    ['Target Customers', ba.targetCustomers || 'N/A'],
    ['Market Position', ba.marketPosition || 'N/A'],
    ['Geographic Presence', ba.geographicPresence || 'N/A']
  ];
  bFields.forEach(([label, value]) => {
    ensureSpace(lineHeight * 3);
    page.drawText(`${label}:`, { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
    y -= lineHeight;
    wrapAndDraw(value, margin + 8, 10, rgb(0.82, 0.85, 0.88));
    y -= 4;
  });

  // ── SWOT Analysis ──────────────────────────────────────────────────────────
  const swot = report.growthAnalysis?.swot || {};
  sectionTitle('SWOT Analysis');
  y -= 4;
  const swotSections: [string, string[]][] = [
    ['Strengths', swot.strengths || []],
    ['Weaknesses', swot.weaknesses || []],
    ['Opportunities', swot.opportunities || []],
    ['Threats', swot.threats || []]
  ];
  swotSections.forEach(([label, items]) => {
    ensureSpace(lineHeight * (items.length + 2));
    page.drawText(label + ':', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
    y -= lineHeight;
    items.forEach((item: string) => bullet(item));
    y -= 4;
  });

  // ── Growth Analysis ────────────────────────────────────────────────────────
  const ga = report.growthAnalysis || {};
  sectionTitle('Growth Analysis');
  y -= 4;
  page.drawText('Growth Journey:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  wrapAndDraw(ga.growthJourney || 'N/A', margin + 8, 10, rgb(0.82, 0.85, 0.88));
  y -= 4;
  page.drawText('Expansion Strategy:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  wrapAndDraw(ga.expansionStrategy || 'N/A', margin + 8, 10, rgb(0.82, 0.85, 0.88));
  y -= 4;
  page.drawText('Recent Developments:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ga.recentDevelopments || []).forEach((d: string) => bullet(d));

  // Growth Timeline
  y -= 8;
  page.drawText('Growth Timeline:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight + 4;
  (report.growthTimeline || []).forEach((entry: any) => {
    ensureSpace(lineHeight * 2);
    page.drawText(`${entry.year || ''}`, { x: margin, y, size: 9, font: boldFont, color: rgb(0.4, 0.78, 0.95) });
    page.drawText(`${entry.event || ''} — ${entry.milestone || ''}`, { x: margin + 45, y, size: 9, font, color: rgb(0.82, 0.85, 0.88) });
    y -= lineHeight;
  });

  // ── AI Insights ────────────────────────────────────────────────────────────
  const ai = report.aiInsights || {};
  sectionTitle('AI Insights');
  y -= 4;
  page.drawText('Customer Pain Points:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ai.painPoints || []).forEach((p: string) => bullet(p));
  y -= 4;
  page.drawText('Technology Stack:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ai.technologyStack || []).forEach((t: string) => bullet(t));
  y -= 4;
  page.drawText('Digital Presence:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  wrapAndDraw(ai.digitalPresence || 'N/A', margin + 8, 10, rgb(0.82, 0.85, 0.88));
  y -= 4;
  page.drawText('Customer Segments:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ai.customerSegments || []).forEach((s: string) => bullet(s));
  y -= 4;
  page.drawText('Hiring Trends:', { x: margin, y, size: 9, font: boldFont, color: rgb(0.45, 0.65, 0.85) });
  y -= lineHeight;
  (ai.hiringTrends || []).forEach((h: string) => bullet(h));

  // ── Competitors ────────────────────────────────────────────────────────────
  sectionTitle('Competitor Analysis');
  y -= 4;
  (report.competitors || []).forEach((comp: any, i: number) => {
    ensureSpace(lineHeight * 6);
    page.drawText(`${i + 1}. ${comp.name || 'Unknown'}`, { x: margin, y, size: 11, font: boldFont, color: rgb(0.9, 0.92, 1) });
    y -= lineHeight;
    page.drawText(`Website: ${comp.website || 'N/A'}`, { x: margin + 8, y, size: 9, font, color: rgb(0.45, 0.65, 0.85) });
    y -= lineHeight;
    wrapAndDraw(`Similarities: ${comp.similarities || 'N/A'}`, margin + 8, 9, rgb(0.75, 0.78, 0.82));
    wrapAndDraw(`Advantages: ${comp.competitiveAdvantages || 'N/A'}`, margin + 8, 9, rgb(0.75, 0.78, 0.82));
    y -= 8;
  });

  // ── Sources ────────────────────────────────────────────────────────────────
  sectionTitle('Sources & References');
  y -= 4;
  (report.sources || []).forEach((src: string) => {
    ensureSpace(lineHeight);
    page.drawText('•', { x: margin, y, size: 9, font, color: rgb(0.4, 0.78, 0.95) });
    page.drawText(src, { x: margin + 12, y, size: 8, font, color: rgb(0.45, 0.65, 0.85), maxWidth: width - margin * 2 - 12 });
    y -= lineHeight;
  });

  // Final footer
  page.drawText(`Company Intel Studio  |  ${profile.name || report.companyName}  |  Page ${pageNum}`, {
    x: margin,
    y: 22,
    size: 8,
    font,
    color: rgb(0.4, 0.5, 0.6)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, companyWebsite, model, applicantName, applicantEmail, discordBotToken, discordChannelId } = body;

    const normalizedSite = normalizeUrl(companyWebsite || '');
    const cacheKey = `${companyName}:${normalizedSite}:${model}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    const searchResult = await searchSerper(companyName);
    const siteToUse = normalizedSite || searchResult.officialSite || 'https://example.com';
    const crawlText = await crawlSite(siteToUse);

    let aiPayload = '';
    let openRouterError: string | null = null;
    try {
      aiPayload = await callOpenRouter(
        buildComprehensivePrompt(companyName, siteToUse, crawlText, searchResult.results),
        model || 'openai/gpt-4o-mini'
      );
    } catch (error: any) {
      openRouterError = error?.response?.status
        ? `OpenRouter request failed with status ${error.response.status}`
        : error?.message || 'OpenRouter request failed';
      aiPayload = '';
    }

    let parsed: any = {};
    if (aiPayload) {
      try {
        // Strip any markdown code fences if present
        const cleaned = aiPayload.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          companyProfile: { name: companyName, founders: [], ceo: 'N/A', foundingYear: 'N/A', headquarters: 'N/A', industry: 'N/A', website: siteToUse, employees: 'N/A' },
          missionVision: { mission: 'Not available', vision: 'Not available', coreValues: [] },
          businessAnalysis: { products: ['Product insights pending'], services: ['Service insights pending'], revenueModel: 'Not analyzed', targetCustomers: 'Not analyzed', marketPosition: 'Not analyzed', geographicPresence: 'Not analyzed' },
          growthAnalysis: { growthJourney: aiPayload.slice(0, 500), expansionStrategy: 'Not analyzed', recentDevelopments: [], swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] } },
          aiInsights: { painPoints: ['Customer pain points pending'], technologyStack: [], digitalPresence: 'Not analyzed', hiringTrends: [], customerSegments: [] },
          competitors: [],
          marketSegments: [],
          growthTimeline: [],
          sources: [siteToUse]
        };
      }
    } else {
      parsed = {
        companyProfile: {
          name: companyName,
          founders: [],
          ceo: 'N/A',
          foundingYear: 'N/A',
          headquarters: 'N/A',
          industry: 'N/A',
          website: siteToUse,
          employees: 'N/A'
        },
        missionVision: { mission: 'Not available', vision: 'Not available', coreValues: [] },
        businessAnalysis: { products: ['Product insights pending'], services: ['Service insights pending'], revenueModel: 'Not analyzed', targetCustomers: 'Not analyzed', marketPosition: 'Not analyzed', geographicPresence: 'Not analyzed' },
        growthAnalysis: { growthJourney: openRouterError ? `AI generation failed: ${openRouterError}` : 'Not analyzed', expansionStrategy: 'Not analyzed', recentDevelopments: [], swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] } },
        aiInsights: { painPoints: ['Customer pain points pending'], technologyStack: [], digitalPresence: 'Not analyzed', hiringTrends: [], customerSegments: [] },
        competitors: [],
        marketSegments: [],
        growthTimeline: [],
        sources: [siteToUse]
      };
    }

    // Build executive summary from profile if not provided
    const profile = parsed.companyProfile || {};
    const ba = parsed.businessAnalysis || {};
    const mv = parsed.missionVision || {};
    const summary = `${profile.name || companyName} is a ${profile.industry || 'technology'} company founded in ${profile.foundingYear || 'an unspecified year'}, headquartered in ${profile.headquarters || 'an undisclosed location'}. ${mv.mission ? `Mission: ${mv.mission}` : ''} The company offers ${(ba.products || []).slice(0, 3).join(', ')} and targets ${ba.targetCustomers || 'enterprise customers'}.`;

    const report = {
      companyName: profile.name || companyName || 'Unknown Company',
      companyWebsite: profile.website || siteToUse,
      summary,
      companyProfile: profile,
      missionVision: mv,
      businessAnalysis: ba,
      growthAnalysis: parsed.growthAnalysis || {},
      aiInsights: parsed.aiInsights || {},
      competitors: parsed.competitors || [],
      marketSegments: parsed.marketSegments || [],
      growthTimeline: parsed.growthTimeline || [],
      sources: parsed.sources || [siteToUse],
      // Legacy fields for backward compatibility
      products: ba.products || [],
      services: ba.services || [],
      painPoints: parsed.aiInsights?.painPoints || [],
      generatedAt: new Date().toISOString()
    };

    const pdfBuffer = await buildPdfBuffer(report);
    const safeName = sanitizeFilename(companyName || 'report');
    const pdfName = `${safeName}-${randomUUID().slice(0, 8)}.pdf`;
    const pdfUrl = `/api/files/${pdfName}`;

    const fs = await import('fs/promises');
    const path = await import('path');
    const dir = path.join(process.cwd(), 'public', 'reports');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, pdfName), pdfBuffer);

    const responsePayload = { ...report, pdfUrl };
    cache.set(cacheKey, responsePayload);

    if (applicantName || applicantEmail || discordBotToken || discordChannelId) {
      await sendDiscordWebhook(
        {
          embeds: [
            {
              title: 'New company analysis generated',
              description: `${applicantName || 'Applicant'} requested a report for ${companyName}`,
              fields: [
                { name: 'Applicant', value: applicantName || 'N/A' },
                { name: 'Email', value: applicantEmail || 'N/A' },
                { name: 'Company', value: companyName || 'N/A' },
                { name: 'Website', value: normalizedSite || 'N/A' }
              ]
            }
          ]
        },
        discordBotToken,
        discordChannelId
      );
    }

    if (openRouterError) {
      console.warn('OpenRouter fallback used:', openRouterError);
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unexpected server error' }, { status: 500 });
  }
}
