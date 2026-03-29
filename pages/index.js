import Link from 'next/link';
import Layout from '../components/Layout';

const STATS = [
  { value: '20+', label: 'Chains Supported' },
  { value: '3B+', label: 'Wallets Searchable' },
  { value: '5', label: 'Intelligence Tools' },
  { value: '100%', label: 'Free to Use' },
];

const FEATURES = [
  { icon: '⬡', title: 'Wallet Label Search', desc: 'Instantly identify any wallet — CEX, fund, DeFi protocol, or whale. Paste an address, get the label.' },
  { icon: '✦', title: 'LLM-Powered Discovery', desc: 'Ask in plain English. "Give me 50 market maker wallets on Ethereum" — and get exactly that.' },
  { icon: '◎', title: 'Relationship Mapping', desc: 'Visualize who a wallet sends to, how often, and what type of entities they interact with.' },
  { icon: '◈', title: 'Bridge Cluster Analysis', desc: 'Trace wallets across chains. See every address a wallet has ever bridged to or from.' },
];

export default function Landing() {
  return (
    <Layout title="Wallet Intel — On-Chain Intelligence for Everyone" description="Identify wallets, map relationships, and discover on-chain entities with institutional-grade intelligence.">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp 0.6s 0.1s ease both}
        .fu2{animation:fadeUp 0.6s 0.2s ease both}
        .fu3{animation:fadeUp 0.6s 0.3s ease both}
        .fu4{animation:fadeUp 0.6s 0.4s ease both}
        .feat-card:hover{border-color:rgba(240,192,64,0.2)!important;background:rgba(240,192,64,0.03)!important}
        .cta-primary:hover{opacity:0.85}
        .cta-ghost:hover{border-color:rgba(240,192,64,0.3)!important;color:#F0C040!important}
      `}</style>

      {/* Grid bg */}
      <div style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none', backgroundImage:'linear-gradient(rgba(240,192,64,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(240,192,64,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
      <div style={{ position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',width:700,height:500,borderRadius:'50%', background:'radial-gradient(ellipse,rgba(240,192,64,0.05) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }} />

      {/* Hero */}
      <section style={{ position:'relative',zIndex:1,padding:'120px 24px 80px',textAlign:'center' }}>
        <div style={{ maxWidth:800,margin:'0 auto' }}>
          <div className="fu1" style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:32,padding:'6px 16px',border:'1px solid rgba(240,192,64,0.2)',borderRadius:100,background:'rgba(240,192,64,0.05)' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#F0C040',animation:'pulse 2s infinite',display:'inline-block' }} />
            <span style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#F0C040',letterSpacing:'0.1em' }}>POWERED BY ARKHAM INTELLIGENCE</span>
          </div>

          <h1 className="fu2" style={{ fontFamily:"'DM Serif Display',serif",fontSize:'clamp(44px,7vw,82px)',fontWeight:400,lineHeight:1.08,color:'#F0F4F8',marginBottom:24,letterSpacing:'-0.02em' }}>
            See What the{' '}
            <span style={{ color:'#F0C040',fontStyle:'italic' }}>Blockchain</span>
            {' '}Knows
          </h1>

          <p className="fu3" style={{ fontFamily:"'Space Mono',monospace",fontSize:12,color:'#4A5A7A',lineHeight:1.9,maxWidth:540,margin:'0 auto 48px',letterSpacing:'0.02em' }}>
            Wallet Intel gives you institutional-grade blockchain intelligence — label wallets, map on-chain relationships, and discover entities in seconds. Built for everyone in crypto.
          </p>

          <div className="fu4" style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
            <Link href="/search" className="cta-primary" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',background:'#F0C040',color:'#070B12',borderRadius:8,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,letterSpacing:'0.08em',transition:'opacity 0.15s' }}>
              START SEARCHING →
            </Link>
            <Link href="/products" className="cta-ghost" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 28px',background:'transparent',color:'#5A6A8A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13,letterSpacing:'0.08em',transition:'all 0.15s' }}>
              VIEW ALL TOOLS
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ position:'relative',zIndex:1,padding:'0 24px 80px' }}>
        <div style={{ maxWidth:800,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'rgba(255,255,255,0.04)',borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)' }}>
          {STATS.map((s,i) => (
            <div key={i} style={{ padding:'28px 20px',textAlign:'center',background:'#070B12' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:36,color:'#F0C040',marginBottom:6 }}>{s.value}</div>
              <div style={{ fontFamily:"'Space Mono',monospace",fontSize:9,color:'#E2E8F0',letterSpacing:'0.1em',textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position:'relative',zIndex:1,padding:'0 24px 100px' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <p style={{ fontFamily:"'Space Mono',monospace",fontSize:10,color:'#F0C040',letterSpacing:'0.2em',marginBottom:16,textTransform:'uppercase' }}>What You Get</p>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:'clamp(28px,4vw,42px)',color:'#F0F4F8',fontWeight:400 }}>Intelligence tools for every use case</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16 }}>
            {FEATURES.map((f,i) => (
              <div key={i} className="feat-card" style={{ padding:'28px 24px',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,background:'rgba(255,255,255,0.02)',transition:'all 0.2s' }}>
                <div style={{ fontSize:24,color:'#F0C040',marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:'#E2E8F0',marginBottom:10,letterSpacing:'0.03em' }}>{f.title}</h3>
                <p style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#3A4A6A',lineHeight:1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ position:'relative',zIndex:1,padding:'0 24px 100px' }}>
        <div style={{ maxWidth:680,margin:'0 auto',padding:'56px 40px',border:'1px solid rgba(240,192,64,0.15)',borderRadius:16,background:'rgba(240,192,64,0.03)',textAlign:'center' }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:'clamp(24px,4vw,38px)',color:'#F0F4F8',fontWeight:400,marginBottom:16 }}>Ready to explore the chain?</h2>
          <p style={{ fontFamily:"'Space Mono',monospace",fontSize:11,color:'#3A4A6A',marginBottom:32,lineHeight:1.8 }}>No sign-up required. Start identifying wallets instantly.</p>
          <Link href="/search" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'14px 32px',background:'#F0C040',color:'#070B12',borderRadius:8,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,letterSpacing:'0.08em' }}>
            GET STARTED FREE →
          </Link>
        </div>
      </section>
    </Layout>
  );
}