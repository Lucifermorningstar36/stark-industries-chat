import { useState, useEffect } from 'react'
import { Rss, ExternalLink, RefreshCw } from 'lucide-react'

interface NewsItem {
  title: string
  source: string
  time: string
  url: string
  category: string
  color: string
}

const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'geo', label: 'GEO' },
  { id: 'finance', label: 'FIN' },
  { id: 'tech', label: 'TECH' },
]

// RSS proxy endpoint — backend'den çekilecek
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', category: 'geo', color: '#f87171' },
  { url: 'https://rss.cnn.com/rss/edition_world.rss', source: 'CNN', category: 'geo', color: '#f59e0b' },
  { url: 'https://feeds.reuters.com/reuters/topNews', source: 'Reuters', category: 'geo', color: '#60a5fa' },
]

// Mock news — gerçek RSS proxy olmadan
const MOCK_NEWS: NewsItem[] = [
  { title: 'Global markets show mixed signals amid geopolitical tensions', source: 'Reuters', time: '2m ago', url: '#', category: 'finance', color: '#60a5fa' },
  { title: 'Diplomatic talks resume between major powers', source: 'BBC', time: '5m ago', url: '#', category: 'geo', color: '#f87171' },
  { title: 'Tech sector leads market recovery in Asian trading', source: 'Bloomberg', time: '8m ago', url: '#', category: 'tech', color: '#34d399' },
  { title: 'Energy prices stabilize after weeks of volatility', source: 'Reuters', time: '12m ago', url: '#', category: 'finance', color: '#60a5fa' },
  { title: 'Cybersecurity alert issued for critical infrastructure', source: 'AP', time: '15m ago', url: '#', category: 'tech', color: '#818cf8' },
  { title: 'UN Security Council convenes emergency session', source: 'BBC', time: '18m ago', url: '#', category: 'geo', color: '#f87171' },
  { title: 'Central banks signal policy shift amid inflation data', source: 'FT', time: '22m ago', url: '#', category: 'finance', color: '#60a5fa' },
  { title: 'Satellite imagery reveals military buildup in disputed region', source: 'Reuters', time: '25m ago', url: '#', category: 'geo', color: '#f87171' },
  { title: 'AI regulation framework proposed by G7 nations', source: 'Bloomberg', time: '30m ago', url: '#', category: 'tech', color: '#34d399' },
  { title: 'Commodity markets react to supply chain disruptions', source: 'Reuters', time: '35m ago', url: '#', category: 'finance', color: '#60a5fa' },
  { title: 'Naval exercises conducted in contested waters', source: 'AP', time: '40m ago', url: '#', category: 'geo', color: '#f87171' },
  { title: 'Semiconductor shortage eases as production ramps up', source: 'Bloomberg', time: '45m ago', url: '#', category: 'tech', color: '#34d399' },
]

export default function NewsPanel() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [news] = useState<NewsItem[]>(MOCK_NEWS)
  const [loading] = useState(false)

  const filtered = activeCategory === 'all' ? news : news.filter(n => n.category === activeCategory)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Rss size={12} className="text-cyan-400" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-300">LIVE INTEL FEED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[8px] text-green-400/60 font-mono">{news.length} ITEMS</span>
          </div>
        </div>
        {/* Category filter */}
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className="px-2 py-0.5 text-[8px] font-mono tracking-wider transition-all"
              style={{
                background: activeCategory === c.id ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${activeCategory === c.id ? 'rgba(6,182,212,0.4)' : 'rgba(59,130,246,0.15)'}`,
                color: activeCategory === c.id ? '#06b6d4' : 'rgba(96,165,250,0.4)',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <RefreshCw size={14} className="text-blue-400/40 animate-spin" />
          </div>
        ) : filtered.map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noreferrer"
            className="news-item flex gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
            <div className="w-1 shrink-0 rounded-full mt-1" style={{ background: item.color, minHeight: '40px' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] leading-relaxed text-blue-100/80 mb-1">{item.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold" style={{ color: item.color }}>{item.source}</span>
                <span className="text-[8px] text-blue-400/30">{item.time}</span>
                <ExternalLink size={8} className="text-blue-400/20 ml-auto shrink-0" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
