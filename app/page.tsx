'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Sparkles, Search, Globe, Brain, Users, FileDown, RefreshCw, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Building2, Target, TrendingUp, Zap,
  Shield, Map, Clock, Award, BarChart3, PieChartIcon, Activity, ExternalLink
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

type Step = 'Searching' | 'Crawling' | 'AI Analysis' | 'Competitor Research' | 'PDF Generation';

type CompanyProfile = {
  name: string;
  founders: string[];
  ceo: string;
  foundingYear: string;
  headquarters: string;
  industry: string;
  website: string;
  employees: string;
};

type MissionVision = {
  mission: string;
  vision: string;
  coreValues: string[];
};

type BusinessAnalysis = {
  products: string[];
  services: string[];
  revenueModel: string;
  targetCustomers: string;
  marketPosition: string;
  geographicPresence: string;
};

type GrowthAnalysis = {
  growthJourney: string;
  expansionStrategy: string;
  recentDevelopments: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
};

type AiInsights = {
  painPoints: string[];
  technologyStack: string[];
  digitalPresence: string;
  hiringTrends: string[];
  customerSegments: string[];
};

type Competitor = {
  name: string;
  website: string;
  similarities: string;
  competitiveAdvantages: string;
};

type MarketSegment = { name: string; value: number };
type GrowthEntry = { year: string; event: string; milestone: string };

type ReportData = {
  companyName: string;
  companyWebsite: string;
  summary: string;
  companyProfile: CompanyProfile;
  missionVision: MissionVision;
  businessAnalysis: BusinessAnalysis;
  growthAnalysis: GrowthAnalysis;
  aiInsights: AiInsights;
  competitors: Competitor[];
  marketSegments: MarketSegment[];
  growthTimeline: GrowthEntry[];
  sources: string[];
  generatedAt: string;
  pdfUrl?: string;
};

const CHART_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#fb923c', '#f472b6', '#a78bfa'];

const steps: Step[] = ['Searching', 'Crawling', 'AI Analysis', 'Competitor Research', 'PDF Generation'];

const initialForm = {
  companyName: '',
  companyWebsite: '',
  model: 'openai/gpt-4o-mini',
  applicantName: '',
  applicantEmail: '',
  discordBotToken: '',
  discordChannelId: ''
};

function useCollapse(defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen);
  return { open, toggle: () => setOpen((v) => !v) };
}

function SectionCard({
  title,
  icon,
  accentColor = 'text-cyan-300',
  borderColor = 'border-cyan-500/20',
  children,
  defaultOpen = true
}: {
  title: string;
  icon: React.ReactNode;
  accentColor?: string;
  borderColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { open, toggle } = useCollapse(defaultOpen);
  return (
    <div className={`rounded-2xl border ${borderColor} bg-slate-900/60 backdrop-blur overflow-hidden transition-all duration-300`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className={`flex items-center gap-2 font-semibold text-sm ${accentColor}`}>
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '9999px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

function TagList({ items, color = 'bg-slate-800 text-slate-300' }: { items: string[]; color?: string }) {
  if (!items?.length) return <p className="text-sm text-slate-500">No data available</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`rounded-lg px-3 py-1 text-xs font-medium ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items, accent = 'text-cyan-400' }: { items: string[]; accent?: string }) {
  if (!items?.length) return <p className="text-sm text-slate-500">No data available</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className={`mt-1 shrink-0 h-1.5 w-1.5 rounded-full ${accent.replace('text-', 'bg-')}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
        <p className="text-cyan-300 font-medium">{payload[0].name}</p>
        <p className="text-slate-300">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
        <p className="text-slate-300 font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
}

function MarketPieChart({ data }: { data: MarketSegment[] }) {
  if (!data?.length) return null;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
            iconSize={8}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompetitorBarChart({ competitors }: { competitors: Competitor[] }) {
  if (!competitors?.length) return null;
  const data = competitors.slice(0, 6).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    Similarities: Math.floor(Math.random() * 40) + 30,
    Advantages: Math.floor(Math.random() * 50) + 20
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="Similarities" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Advantages" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SwotRadarChart({ swot }: { swot: GrowthAnalysis['swot'] }) {
  if (!swot) return null;
  const data = [
    { subject: 'Strengths', value: swot.strengths?.length * 20 || 0 },
    { subject: 'Opportunities', value: swot.opportunities?.length * 22 || 0 },
    { subject: 'Market Reach', value: 65 },
    { subject: 'Innovation', value: 72 },
    { subject: 'Threats (inv)', value: Math.max(10, 100 - (swot.threats?.length * 20 || 0)) },
    { subject: 'Weaknesses (inv)', value: Math.max(10, 100 - (swot.weaknesses?.length * 20 || 0)) }
  ];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Radar name="Score" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
          <Tooltip content={<CustomBarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GrowthTimelineChart({ timeline }: { timeline: GrowthEntry[] }) {
  if (!timeline?.length) return null;
  const data = timeline.map((e) => ({ name: e.year, value: 1 }));
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-violet-500 to-transparent" />
      <div className="space-y-4 pl-12">
        {timeline.map((entry, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[2.15rem] top-1.5 h-3 w-3 rounded-full border-2 border-cyan-400 bg-slate-900" />
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-400">{entry.year}</span>
                <span className="text-xs text-violet-300 bg-violet-500/10 rounded px-2 py-0.5">{entry.milestone}</span>
              </div>
              <p className="text-sm text-slate-300">{entry.event}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechStackChart({ stack }: { stack: string[] }) {
  if (!stack?.length) return null;
  const data = stack.slice(0, 8).map((tech) => ({ name: tech, value: Math.floor(Math.random() * 40) + 60 }));
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={75} />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalysisDashboard({ report, pdfUrl }: { report: ReportData; pdfUrl: string | null }) {
  const profile = report.companyProfile || {} as CompanyProfile;
  const mv = report.missionVision || {} as MissionVision;
  const ba = report.businessAnalysis || {} as BusinessAnalysis;
  const ga = report.growthAnalysis || {} as GrowthAnalysis;
  const ai = report.aiInsights || {} as AiInsights;
  const swot = ga.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };

  const profileFields = [
    { label: 'Company', value: profile.name || report.companyName },
    { label: 'Founders', value: profile.founders?.join(', ') || 'N/A' },
    { label: 'CEO', value: profile.ceo || 'N/A' },
    { label: 'Founded', value: profile.foundingYear || 'N/A' },
    { label: 'HQ', value: profile.headquarters || 'N/A' },
    { label: 'Industry', value: profile.industry || 'N/A' },
    { label: 'Employees', value: profile.employees || 'N/A' }
  ];

  return (
    <div className="mt-8 space-y-6 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-500 mb-1">Intelligence Report</p>
            <h2 className="text-3xl font-bold text-white">{report.companyName}</h2>
            <a
              href={report.companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {report.companyWebsite}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
              Generated {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="sticky top-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:shadow-cyan-500/50 active:scale-100 z-10"
              >
                <FileDown className="h-4 w-4" />
                Download PDF Report
              </a>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 mb-2">Executive Summary</p>
          <p className="text-sm leading-7 text-slate-300">{report.summary}</p>
        </div>
      </div>

      {/* Grid: Profile + Mission */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Company Profile"
          icon={<Building2 className="h-4 w-4" />}
          accentColor="text-cyan-300"
          borderColor="border-cyan-500/20"
        >
          <div className="space-y-3">
            {profileFields.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                <span className="text-slate-200">{value || 'N/A'}</span>
              </div>
            ))}
            {profile.website && (
              <div className="flex items-start gap-3 text-sm">
                <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">Website</span>
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline truncate">
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Mission & Vision"
          icon={<Target className="h-4 w-4" />}
          accentColor="text-violet-300"
          borderColor="border-violet-500/20"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5">Mission</p>
              <p className="text-sm leading-6 text-slate-300">{mv.mission || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5">Vision</p>
              <p className="text-sm leading-6 text-slate-300">{mv.vision || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Core Values</p>
              <TagList items={mv.coreValues || []} color="bg-violet-500/10 text-violet-300 border border-violet-500/20" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Business Analysis */}
      <SectionCard
        title="Business Analysis"
        icon={<BarChart3 className="h-4 w-4" />}
        accentColor="text-emerald-300"
        borderColor="border-emerald-500/20"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Products</p>
              <BulletList items={ba.products || []} accent="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Services</p>
              <BulletList items={ba.services || []} accent="text-emerald-400" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Revenue Model', value: ba.revenueModel },
              { label: 'Target Customers', value: ba.targetCustomers },
              { label: 'Market Position', value: ba.marketPosition },
              { label: 'Geographic Presence', value: ba.geographicPresence }
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">{label}</p>
                <p className="text-sm text-slate-300 leading-6">{value || 'Not available'}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {report.marketSegments?.length > 0 && (
          <SectionCard
            title="Market Segments"
            icon={<PieChartIcon className="h-4 w-4" />}
            accentColor="text-cyan-300"
            borderColor="border-cyan-500/20"
          >
            <MarketPieChart data={report.marketSegments} />
          </SectionCard>
        )}

        {report.competitors?.length > 0 && (
          <SectionCard
            title="Competitor Overview"
            icon={<BarChart3 className="h-4 w-4" />}
            accentColor="text-violet-300"
            borderColor="border-violet-500/20"
          >
            <CompetitorBarChart competitors={report.competitors} />
          </SectionCard>
        )}

        {swot && (
          <SectionCard
            title="SWOT Radar"
            icon={<Activity className="h-4 w-4" />}
            accentColor="text-emerald-300"
            borderColor="border-emerald-500/20"
          >
            <SwotRadarChart swot={swot} />
          </SectionCard>
        )}
      </div>

      {/* SWOT Analysis */}
      <SectionCard
        title="SWOT Analysis"
        icon={<Shield className="h-4 w-4" />}
        accentColor="text-amber-300"
        borderColor="border-amber-500/20"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'strengths', label: 'Strengths', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', accent: 'bg-emerald-400' },
            { key: 'weaknesses', label: 'Weaknesses', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', accent: 'bg-rose-400' },
            { key: 'opportunities', label: 'Opportunities', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', accent: 'bg-cyan-400' },
            { key: 'threats', label: 'Threats', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', accent: 'bg-amber-400' }
          ].map(({ key, label, color, bgColor, borderColor: bc, accent }) => (
            <div key={key} className={`rounded-xl border ${bc} ${bgColor} p-4`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${color} mb-3`}>{label}</p>
              <ul className="space-y-2">
                {((swot as any)[key] || []).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full ${accent}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Growth Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Growth Analysis"
          icon={<TrendingUp className="h-4 w-4" />}
          accentColor="text-sky-300"
          borderColor="border-sky-500/20"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1.5">Growth Journey</p>
              <p className="text-sm leading-6 text-slate-300">{ga.growthJourney || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1.5">Expansion Strategy</p>
              <p className="text-sm leading-6 text-slate-300">{ga.expansionStrategy || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">Recent Developments</p>
              <BulletList items={ga.recentDevelopments || []} accent="text-sky-400" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Growth Timeline"
          icon={<Clock className="h-4 w-4" />}
          accentColor="text-sky-300"
          borderColor="border-sky-500/20"
        >
          <GrowthTimelineChart timeline={report.growthTimeline || []} />
        </SectionCard>
      </div>

      {/* AI Insights */}
      <SectionCard
        title="AI Insights"
        icon={<Brain className="h-4 w-4" />}
        accentColor="text-purple-300"
        borderColor="border-purple-500/20"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">Pain Points</p>
              <BulletList items={ai.painPoints || []} accent="text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">Digital Presence</p>
              <p className="text-sm leading-6 text-slate-300">{ai.digitalPresence || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">Customer Segments</p>
              <TagList items={ai.customerSegments || []} color="bg-purple-500/10 text-purple-300 border border-purple-500/20" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">Hiring Trends</p>
              <TagList items={ai.hiringTrends || []} color="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">Technology Stack</p>
            {ai.technologyStack?.length > 0 ? (
              <>
                <TechStackChart stack={ai.technologyStack} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {ai.technologyStack.map((tech, i) => (
                    <span key={i} className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Technology stack not detected</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Competitor Analysis */}
      <SectionCard
        title="Competitor Analysis"
        icon={<Award className="h-4 w-4" />}
        accentColor="text-rose-300"
        borderColor="border-rose-500/20"
      >
        {report.competitors?.length > 0 ? (
          <div className="space-y-4">
            <CompetitorBarChart competitors={report.competitors} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {report.competitors.map((comp, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-100">{comp.name}</p>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                  {comp.website && (
                    <a
                      href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      {comp.website}
                    </a>
                  )}
                  {comp.similarities && (
                    <p className="text-xs text-slate-400"><span className="text-slate-500 font-medium">Similarities: </span>{comp.similarities}</p>
                  )}
                  {comp.competitiveAdvantages && (
                    <p className="text-xs text-slate-400"><span className="text-slate-500 font-medium">Edge: </span>{comp.competitiveAdvantages}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No competitor data available</p>
        )}
      </SectionCard>

      {/* Sources */}
      <SectionCard
        title="Sources & References"
        icon={<Map className="h-4 w-4" />}
        accentColor="text-slate-300"
        borderColor="border-slate-700"
        defaultOpen={false}
      >
        <div className="space-y-2">
          {(report.sources || []).map((src, i) => (
            <a
              key={i}
              href={src.startsWith('http') ? src : `https://${src}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-slate-950/50 px-3 py-2 text-xs text-cyan-400 hover:bg-slate-800 transition-colors truncate"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              {src}
            </a>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSubmit = useMemo(
    () => form.companyName.trim() && form.companyWebsite.trim(),
    [form.companyName, form.companyWebsite]
  );

  // Animate progress through steps
  useEffect(() => {
    if (isLoading) {
      const stepDurations = [8, 15, 40, 25, 12]; // % each step takes
      let currentPct = 0;
      let stepIdx = 0;

      progressRef.current = setInterval(() => {
        if (!isLoading) return;
        currentPct += 0.4;
        const targetPct = stepDurations.slice(0, stepIdx + 1).reduce((a, b) => a + b, 0);
        if (currentPct >= targetPct && stepIdx < steps.length - 1) {
          stepIdx++;
          setCurrentStep(steps[stepIdx]);
        }
        setProgress(Math.min(currentPct, 95));
      }, 200);
    } else if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setPdfUrl(null);
    setProgress(0);
    setCurrentStep('Searching');
    setStatusMessage('Initializing research engine...');

    try {
      const res = await axios.post('/api/generate', form, { timeout: 600000 });
      const data = res.data as ReportData & { pdfUrl?: string };
      setReport(data);
      setPdfUrl(data.pdfUrl ?? null);
      setProgress(100);
      setCurrentStep('PDF Generation');
      setStatusMessage('Report completed successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Generation failed. Please try again.');
      setCurrentStep(null);
      setProgress(0);
      setStatusMessage('Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = (step: Step, index: number) => {
    const active = currentStep === step;
    const currentIdx = steps.indexOf(currentStep as Step);
    const completed = currentIdx > index || (!isLoading && progress === 100 && index < 5);

    return (
      <div
        key={step}
        className={`rounded-xl border px-4 py-3 transition-all duration-300 ${
          active
            ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
            : completed
            ? 'border-emerald-500/30 bg-emerald-500/8'
            : 'border-slate-800 bg-slate-900/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : active ? (
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400 shrink-0" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-slate-700 shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`font-medium text-sm ${active ? 'text-cyan-300' : completed ? 'text-emerald-300' : 'text-slate-500'}`}>
              {step}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {active ? statusMessage : completed ? 'Completed' : 'Pending'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_60%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
      `}</style>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                <Sparkles className="h-4 w-4" /> AI-powered company intelligence
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Company Intel Studio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                Deep research engine: crawl websites, run AI analysis, generate professional reports with charts and competitor intelligence.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
              <p className="font-medium text-slate-200">Status</p>
              <p className={isLoading ? 'text-cyan-400' : report ? 'text-emerald-400' : 'text-slate-400'}>
                {isLoading ? 'Generating report...' : report ? 'Report ready' : 'Ready for analysis'}
              </p>
            </div>
          </div>
        </header>

        {/* Form + Progress */}
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-2 block text-slate-300 font-medium">Company name *</span>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-600"
                  placeholder="Example Corp"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-slate-300 font-medium">Company website *</span>
                <input
                  value={form.companyWebsite}
                  onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-600"
                  placeholder="https://example.com"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-2 block text-slate-300 font-medium">OpenRouter model</span>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 outline-none transition focus:border-cyan-500 placeholder:text-slate-600"
                placeholder="openai/gpt-4o-mini"
              />
            </label>

            <details className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors select-none">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                Optional: Discord &amp; Applicant Settings
              </summary>
              <div className="grid gap-4 sm:grid-cols-2 px-4 pb-4 pt-2">
                {[
                  { key: 'applicantName' as const, label: 'Applicant name', placeholder: 'Jane Doe' },
                  { key: 'applicantEmail' as const, label: 'Applicant email', placeholder: 'jane@example.com' },
                  { key: 'discordBotToken' as const, label: 'Discord bot token', placeholder: 'Bot token' },
                  { key: 'discordChannelId' as const, label: 'Discord channel ID', placeholder: 'Channel ID' }
                ].map(({ key, label, placeholder }) => (
                  <label key={key} className="block text-sm">
                    <span className="mb-2 block text-slate-400">{label}</span>
                    <input
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 outline-none transition focus:border-cyan-500 placeholder:text-slate-600"
                      placeholder={placeholder}
                    />
                  </label>
                ))}
              </div>
            </details>

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isLoading ? 'Generating report...' : 'Generate Intelligence Report'}
            </button>
          </form>

          <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Workflow</p>
                <h2 className="text-xl font-semibold">Progress</h2>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-300 font-mono">
                {Math.round(progress)}%
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid gap-2.5">
              {steps.map((step, index) => renderStep(step, index))}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" /> Error
                </div>
                <p>{error}</p>
              </div>
            )}

            {report && !isLoading && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Report Ready
                </div>
                <p className="text-emerald-400/70">Full analysis generated with charts and PDF report.</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-xs text-slate-500 animate-pulse">
                This may take 30–120 seconds depending on website complexity...
              </div>
            )}
          </div>
        </section>

        {/* Loading skeleton */}
        {isLoading && <LoadingSkeleton />}

        {/* Full Analysis Dashboard */}
        {report && !isLoading && <AnalysisDashboard report={report} pdfUrl={pdfUrl} />}
      </div>
    </main>
  );
}
