import Link from 'next/link';
import Layout from '../components/Layout';

const TOOLS = [
  {
    id: 'search',
    icon: '⬡',
    label: 'CORE TOOL',
    labelColor: '#F0C040',
    name: 'Wallet Search',
    desc: 'The foundational tool. Paste any wallet address — single, multiple, or upload a CSV — and instantly see if it\'s a CEX, fund, DeFi protocol, whale, or unknown entity. Powered by Arkham\'s label database.',
    features: ['Single address lookup', 'Batch lookup (up to 50)', 'CSV upload & auto-detect', 'Export to CSV or SQL', 'Manual reclassification'],
    status: 'live',
    href: '/search',
    cta: 'Open Tool',
  },
  {
    id: 'llm-search',
    icon: '✦',
    label: 'AI-POWERED',
    labelColor: '#50C878',
    name: 'LLM Search',
    desc: 'Describe what wallets you need in plain English and let AI do the work. Type "give me 20 government treasury wallets" and get a labeled list instantly. Powered by Arkham Intelligence + OpenRouter AI.',
    features: ['Natural language queries', 'Parsed intent display', 'Chain filtering', 'Entity type detection', 'Export results to CSV'],
    status: 'live',
    href: '/llm-search',
    cta: 'Try LLM Search',
  },
  {
    id: 'relationship-map',
    icon: '◎',
    label: 'VISUAL',
    labelColor: '#4DA6FF',
    name: 'Relationship Map',
    desc: 'Enter any wallet and see a live visual graph of its top counterparties. Node size represents transfer volume, colors represent entity type. Click any node to inspect it.',
    features: ['Top 10 counterparties', 'Volume-weighted nodes', 'CEX / Fund / DeFi grouping', 'Direction (in/out)', 'Click to inspect'],
    status: 'live',
    href: '/relationship-map',
    cta: 'Open Map',
  },
  {
    id: 'bridge-cluster',
    icon: '◈',
    label: 'COMING SOON',
    labelColor: '#FF9500',
    name: 'Bridge Cluster',
    desc: 'Paste one wallet address and instantly see every wallet it has ever bridged to across chains — via LayerZero, Relay, Stargate, and more. The missing "connected wallets" tab that bridge explorers don\'t have.',
    features: ['LayerZero message tracking', 'Moralis cross-chain history', 'Arkham entity enrichment', 'Export wallet cluster', 'Multi-chain support'],
    status: 'soon',
    href: null,
    cta: 'Coming Soon',
  },
  {
    id: 'alpha-scanner',
    icon: '◉',
    label: 'COMING SOON',
    labelColor: '#FF9500',
    name: 'AlphaCA Scanner',
    desc: 'Paste any token contract address and get deep, real-time analytics — buyers & sellers, whale accumulation signals, smart-money detection, and cNGN/stablecoin flow tracking for African DeFi.',
    features: ['Live transfer analysis', 'Edge alpha signal detection', 'Whale accumulation alerts', 'cNGN flow tracking', 'Africa DeFi insights'],
    status: 'soon',
    href: null,
    cta: 'Coming Soon',
  },
];

const STATUS_STYLES = {
  live: { bg: 'rgba(80,200,120,0.1)', color: '#50C878', border: 'rgba(80,200,120,0.2)', label: '● LIVE' },
  soon: { bg: 'rgba(255,149,0,0.08)', color: '#FF9500', border: 'rgba(255,149,0,0.2)', label: '◌ COMING SOON' },
};

export default function Products() {
  return (
    <Layout title="Wallet Intel — Products" description="All on-chain intelligence tools built by Wallet Intel.">
      <style>{`
        .tool-card:hover { border-color: rgba(240,192,64,0.2) !important; }
        .tool-cta:hover { opacity: 0.85; }
        .tool-cta-ghost:hover { border-color: rgba(240,192,64,0.4) !important; color: #F0C040 !important; }
      `}</style>

      {/* Header */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#F0C040', letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>
            All Tools
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#F0F4F8', marginBottom: 20, lineHeight: 1.15 }}>
            Intelligence tools for the{' '}
            <span style={{ color: '#F0C040', fontStyle: 'italic' }}>on-chain era</span>
          </h1>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#3A4A6A', lineHeight: 1.8 }}>
            From simple wallet lookups to AI-powered discovery and relationship mapping — everything you need to understand who's moving money on-chain.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {TOOLS.map(tool => {
            const statusStyle = STATUS_STYLES[tool.status];
            return (
              <div key={tool.id} className="tool-card" style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.02)',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ fontSize: 28, color: tool.labelColor }}>{tool.icon}</div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 4, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Label */}
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: tool.labelColor, letterSpacing: '0.15em', marginBottom: 8 }}>
                  {tool.label}
                </p>

                {/* Name */}
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#F0F4F8', marginBottom: 14, letterSpacing: '-0.01em' }}>
                  {tool.name}
                </h2>

                {/* Desc */}
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#3A4A6A', lineHeight: 1.8, marginBottom: 24 }}>
                  {tool.desc}
                </p>

                {/* Features */}
                <ul style={{ listStyle: 'none', marginBottom: 28, flex: 1 }}>
                  {tool.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: '#F0C040', fontSize: 10 }}>✓</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#4A5A7A' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tool.href ? (
                  <Link href={tool.href} className="tool-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: '#F0C040', color: '#070B12', borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', transition: 'opacity 0.15s', textAlign: 'center' }}>
                    {tool.cta} →
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', border: '1px solid rgba(255,149,0,0.2)', borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#FF9500', letterSpacing: '0.08em', cursor: 'not-allowed', opacity: 0.6 }}>
                    {tool.cta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}