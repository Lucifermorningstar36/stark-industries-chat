import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Market {
  symbol: string
  name: string
  price: string
  change: number
  category: string
}

const MOCK_MARKETS: Market[] = [
  { symbol: 'SPX', name: 'S&P 500', price: '5,234.18', change: 0.42, category: 'index' },
  { symbol: 'NDX', name: 'NASDAQ 100', price: '18,321.45', change: 0.87, category: 'index' },
  { symbol: 'DJI', name: 'Dow Jones', price: '39,127.80', change: -0.12, category: 'index' },
  { symbol: 'VIX', name: 'Volatility', price: '14.23', change: -2.1, category: 'index' },
  { symbol: 'BTC', name: 'Bitcoin', price: '67,432.00', change: 1.23, category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: '3,521.40', change: 2.14, category: 'crypto' },
  { symbol: 'XAU', name: 'Gold', price: '2,341.50', change: 0.31, category: 'commodity' },
  { symbol: 'XAG', name: 'Silver', price: '29.84', change: -0.54, category: 'commodity' },
  { symbol: 'CL1', name: 'Crude Oil', price: '82.14', change: -1.2, category: 'commodity' },
  { symbol: 'DXY', name: 'USD Index', price: '104.32', change: 0.08, category: 'forex' },
  { symbol: 'EUR/USD', name: 'Euro', price: '1.0821', change: -0.15, category: 'forex' },
  { symbol: 'USD/JPY', name: 'Yen', price: '151.42', change: 0.22, category: 'forex' },
]

const CATS = ['all', 'index', 'crypto', 'commodity', 'forex']

export default function MarketsPanel() {
  const [cat, setCat] = useState('all')
  const filtered = cat === 'all' ? MOCK_MARKETS : MOCK_MARKETS.filter(m => m.category === cat)

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="text-[10px] font-mono tracking-widest text-cyan-300">MARKET RADAR</div>
        <div className="flex gap-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-2 py-0.5 text-[8px] font-mono tracking-wider transition-all uppercase"
              style={{
                background: cat === c ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${cat === c ? 'rgba(6,182,212,0.4)' : 'rgba(59,130,246,0.15)'}`,
                color: cat === c ? '#06b6d4' : 'rgba(96,165,250,0.4)',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(m => (
            <div key={m.symbol} className="p-3 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-cyan-400">{m.symbol}</span>
                <div className="flex items-center gap-0.5" style={{ color: m.change > 0 ? '#34d399' : m.change < 0 ? '#f87171' : '#94a3b8' }}>
                  {m.change > 0 ? <TrendingUp size={10} /> : m.change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                  <span className="text-[9px] font-mono">{m.change > 0 ? '+' : ''}{m.change}%</span>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-blue-100">{m.price}</div>
              <div className="text-[8px] text-blue-400/30 mt-0.5">{m.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
