import { useState } from 'react';
import Layout from '../components/Layout';

function shortAddr(addr) { return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : '—'; }

const CHAIN_COLORS = { ethereum:'#627EEA', eth:'#627EEA', bsc:'#F3BA2F', polygon:'#8247E5', arbitrum:'#28A0F0', optimism:'#FF0420', base:'#0052FF', avalanche:'#E84142', solana:'#9945FF' };
const ENTITY_ICONS = { cex:'🏦', exchange:'🏦', dex:'🔄', 'market maker':'📊', fund:'💼', government:'🏛️', whale:'🐋', bridge:'🌉', dao:'🗳️', nft:'🖼️', miner:'⛏️', stablecoin:'💵', individual:'👤' };

const EXAMPLES = ['50 market maker wallets on Ethereum', 'top government treasury wallets', 'known CEX hot wallets on BSC and ETH', '20 DeFi fund wallets', 'bridge operator wallets', 'whale wallets on Arbitrum'];

function getIcon(type) { if (!type) return '🔍'; const l = type.toLowerCase(); for (const [k,v] of Object.entries(ENTITY_ICONS)) { if (l.includes(k)) return v; } return '🔍'; }
function getChainColor(chain) { if (!chain) return '#4A5A7A'; const l = chain.toLowerCase(); for (const [k,v] of Object.entries(CHAIN_COLORS)) { if (l.includes(k)) return v; } return '#4A5A7A'; }

export default function LLMSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(null);

  const s = { sub:'#4A5A7A', border:'rgba(255,255,255,0.07)', text:'#E2E8F0', gold:'#F0C040' };

  const handleSearch = async (q) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const res = await fetch('/api/llm-search', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({query:searchQuery}) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Search failed');
      setResults(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const copyAddr = (addr) => { navigator.clipboard.writeText(addr); setCopiedAddr(addr); setTimeout(() => setCopiedAddr(null), 1500); };

  const exportCSV = () => {
    if (!results?.wallets?.length) return;
    const blob = new Blob([`address,chain,entityName,entityType,label\n${results.wallets.map(w=>`"${w.address}","${w.chain}","${w.entityName}","${w.entityType}","${w.label||''}"`).join('\n')}`], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `llm-search-${Date.now()}.csv`; a.click();
  };

  return (
    <Layout title="Wallet Intel — LLM Search" description="Search for wallets using plain English powered by AI and Arkham Intelligence.">
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.3} 40%{transform:translateY(-8px);opacity:1} }
        .example-chip:hover { border-color: rgba(240,192,64,0.3) !important; color: #A0B0C8 !important; }
        .result-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      <section style={{ padding:'60px 24px 100px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>

          <div style={{ marginBottom:32 }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:s.gold, letterSpacing:'0.2em', marginBottom:12, textTransform:'uppercase' }}>LLM Search</p>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,42px)', color:s.text, fontWeight:400, marginBottom:8 }}>Ask for wallets in plain English</h1>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:s.sub, lineHeight:1.7 }}>AI parses your intent and queries Arkham Intelligence automatically. No filters needed.</p>
          </div>

          <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${s.border}`, borderRadius:14, padding:28 }}>

            {/* AI badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:20, padding:'6px 14px', border:'1px solid rgba(240,192,64,0.15)', borderRadius:100, background:'rgba(240,192,64,0.04)' }}>
              <span style={{ color:s.gold, fontSize:12 }}>✦</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:s.gold, letterSpacing:'0.1em' }}>AI-POWERED · OPENROUTER + ARKHAM</span>
            </div>

            {/* Input */}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleSearch()} disabled={loading}
                placeholder='"give me 50 market maker wallets on Ethereum"'
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${s.border}`, borderRadius:8, color:s.text, fontFamily:"'Space Mono',monospace", fontSize:13, outline:'none', padding:'11px 14px' }} />
              <button onClick={() => handleSearch()} disabled={loading} style={{ background:s.gold, border:'none', borderRadius:8, color:'#070B12', cursor:loading?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, opacity:loading?0.6:1, padding:'11px 22px', whiteSpace:'nowrap' }}>
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>

            {/* Examples */}
            {!results && !loading && (
              <div style={{ marginBottom:8 }}>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:'#2A3A5A', letterSpacing:'0.15em', marginBottom:10, textTransform:'uppercase' }}>Try an example:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {EXAMPLES.map(p => (
                    <button key={p} className="example-chip" onClick={() => { setQuery(p); handleSearch(p); }} style={{ background:'transparent', border:`1px solid ${s.border}`, borderRadius:4, color:'#3A4A6A', cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:10, padding:'5px 10px', transition:'all 0.15s' }}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign:'center', padding:'48px 24px', border:`1px solid ${s.border}`, borderRadius:10 }}>
                <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:14 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:s.gold, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
                <div style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:11 }}>AI is parsing your query · Querying Arkham…</div>
              </div>
            )}

            {/* Error */}
            {error && <div style={{ background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:6, color:'#FF8080', fontFamily:"'Space Mono',monospace", fontSize:12, padding:'10px 14px' }}>⚠ {error}</div>}

            {/* Results */}
            {results && !loading && (
              <div>
                {/* Parsed intent */}
                {results.parsedIntent && (
                  <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(240,192,64,0.04)', border:'1px solid rgba(240,192,64,0.12)', borderRadius:8, marginBottom:14 }}>
                    <span style={{ color:'#2A3A5A', fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase' }}>Parsed:</span>
                    {[`🎯 ${results.parsedIntent.entityType}`, `🔢 ${results.parsedIntent.count} wallets`, ...(results.parsedIntent.chains?.length?[`⛓️ ${results.parsedIntent.chains.join(', ')}`]:[]), `🔍 "${results.parsedIntent.searchQuery}"`].map((pill,i) => (
                      <span key={i} style={{ background:'rgba(240,192,64,0.08)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:4, color:s.gold, fontFamily:"'Space Mono',monospace", fontSize:9, padding:'2px 8px' }}>{pill}</span>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>{results.count} Wallet{results.count!==1?'s':''} Found</span>
                  {results.count > 0 && <button onClick={exportCSV} style={{ background:'transparent', border:`1px solid rgba(240,192,64,0.3)`, borderRadius:4, color:s.gold, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:10, padding:'4px 12px' }}>↓ Export CSV</button>}
                </div>

                {results.wallets?.length > 0 ? (
                  <div style={{ border:`1px solid ${s.border}`, borderRadius:10, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Space Mono',monospace", fontSize:11 }}>
                      <thead>
                        <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                          {['#','Address','Entity','Chain','Type',''].map(h => (
                            <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:'#2A3A5A', fontWeight:400, fontSize:9, letterSpacing:1, borderBottom:`1px solid ${s.border}`, textTransform:'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.wallets.map((wallet, i) => {
                          const chainColor = getChainColor(wallet.chain);
                          const icon = getIcon(wallet.entityType);
                          return (
                            <tr key={`${wallet.address}-${i}`} className="result-row" style={{ background:i%2===0?'transparent':'rgba(255,255,255,0.01)', transition:'background 0.1s' }}>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}`, color:'#1A2A4A', fontSize:10 }}>{i+1}</td>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}`, color:'#7A8A9A' }}>{shortAddr(wallet.address)}</td>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}`, color:s.text, fontWeight:600 }}>
                                <span style={{ marginRight:6 }}>{icon}</span>
                                {wallet.entityName || '—'}
                                {wallet.label && wallet.label !== wallet.entityName && <span style={{ marginLeft:6, color:s.gold, fontSize:9, fontWeight:400 }}>{wallet.label}</span>}
                              </td>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}` }}>
                                <span style={{ border:`1px solid ${chainColor}`, borderRadius:3, color:chainColor, fontSize:9, fontWeight:700, letterSpacing:'0.05em', padding:'1px 6px', textTransform:'uppercase' }}>{wallet.chain||'eth'}</span>
                              </td>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}`, color:s.sub, fontSize:10 }}>{wallet.entityType||'—'}</td>
                              <td style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}` }}>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button onClick={() => copyAddr(wallet.address)} style={{ background:'none', border:`1px solid ${s.border}`, borderRadius:3, color:copiedAddr===wallet.address?'#50C878':s.sub, cursor:'pointer', fontSize:11, padding:'2px 7px' }}>{copiedAddr===wallet.address?'✓':'⎘'}</button>
                                  <a href={wallet.arkhamUrl} target="_blank" rel="noopener noreferrer" style={{ background:'none', border:`1px solid ${s.border}`, borderRadius:3, color:'#4DA6FF', fontSize:11, padding:'2px 7px', textDecoration:'none', display:'inline-flex', alignItems:'center' }}>↗</a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'32px', color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:12, border:`1px dashed ${s.border}`, borderRadius:8 }}>No wallets found. Try different keywords.</div>
                )}
              </div>
            )}

            {!results && !loading && !error && (
              <div style={{ textAlign:'center', padding:'48px 24px', color:'#2A3A5A', fontFamily:"'Space Mono',monospace", fontSize:11, lineHeight:1.8, border:`1px dashed ${s.border}`, borderRadius:10, marginTop:8 }}>
                Describe the wallets you're looking for in plain English.<br />
                <span style={{ fontSize:10, opacity:0.6 }}>e.g. "50 market maker wallets" · "government treasury wallets"</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}