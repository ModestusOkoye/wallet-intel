import { useState } from 'react';
import Layout from '../components/Layout';

function shortAddr(addr) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function fmtUSD(val) {
  if (val >= 1e9) return `$${(val/1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val/1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val/1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}
function getLabel(entry) { if (!entry) return '—'; return entry.arkhamEntity?.name || entry.arkhamLabel?.name || '—'; }
function classifyEntity(entry) {
  if (!entry) return 'Unknown';
  const type = (entry.arkhamEntity?.type || '').toLowerCase();
  const name = (entry.arkhamEntity?.name || entry.arkhamLabel?.name || '').toLowerCase();
  if (type.includes('cex')||type.includes('exchange')||['binance','coinbase','kraken','okx','bybit','gate','kucoin','huobi'].some(x=>name.includes(x))) return 'CEX';
  if (type.includes('fund')||type.includes('vc')||['fund','capital','ventures','invest'].some(x=>name.includes(x))) return 'Fund';
  if (type.includes('defi')||type.includes('protocol')||type.includes('contract')) return 'DeFi';
  if (entry.arkhamEntity?.name||entry.arkhamLabel?.name) return 'Whale';
  return 'Unknown';
}

const TYPE_COLORS = { CEX:'#4DA6FF', Fund:'#50C878', DeFi:'#FF9500', Whale:'#B19CD9', Unknown:'#5A6A8A' };
const TYPE_BG = { CEX:'rgba(77,166,255,0.12)', Fund:'rgba(80,200,120,0.12)', DeFi:'rgba(255,149,0,0.12)', Whale:'rgba(177,156,217,0.12)', Unknown:'rgba(90,106,138,0.1)' };

export default function RelationshipMap() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nodes, setNodes] = useState([]);
  const [centerInfo, setCenterInfo] = useState(null);
  const [selected, setSelected] = useState(null);

  const W = 580, H = 420, CX = W/2, CY = H/2;

  const lookup = async () => {
    const addr = address.trim();
    if (!addr) return;
    setLoading(true); setError(''); setNodes([]); setCenterInfo(null); setSelected(null);
    try {
      const txRes = await fetch(`/api/lookup?address=${addr}`);
      const txData = await txRes.json();
      if (txData.error) throw new Error(txData.error);
      const transfers = txData.transfers || [];
      if (!transfers.length) { setError('No transfers found — try a more active wallet.'); setLoading(false); return; }

      const cmap = {};
      transfers.forEach(tx => {
        const fromAddr = tx.fromAddress?.address;
        const toAddr = tx.toAddress?.address;
        const usd = tx.historicalUSD || 0;
        const isOut = fromAddr?.toLowerCase() === addr.toLowerCase();
        const counterparty = isOut ? toAddr : fromAddr;
        const cpEntry = isOut ? tx.toAddress : tx.fromAddress;
        if (!counterparty || counterparty.toLowerCase() === addr.toLowerCase()) return;
        if (!cmap[counterparty]) cmap[counterparty] = { volume:0, count:0, entry:null, direction:isOut?'out':'in' };
        cmap[counterparty].volume += usd;
        cmap[counterparty].count++;
        if (cpEntry) cmap[counterparty].entry = cpEntry;
      });

      const top = Object.entries(cmap).sort((a,b) => b[1].volume-a[1].volume).slice(0,10);
      const allAddrs = [addr, ...top.map(([a]) => a)];
      const labelRes = await fetch('/api/lookup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({addresses:allAddrs}) });
      const labelData = await labelRes.json();

      const centerEntry = labelData[addr] || labelData[addr.toLowerCase()];
      const centerLabel = getLabel(centerEntry);
      setCenterInfo({ address:addr, label:centerLabel!=='—'?centerLabel:shortAddr(addr), type:classifyEntity(centerEntry) });

      const maxVol = top[0]?.[1].volume || 1;
      const angleStep = (2*Math.PI)/Math.max(top.length,1);
      const radius = 155;

      const builtNodes = top.map(([a, meta], i) => {
        const angle = i*angleStep - Math.PI/2;
        const entry = labelData[a] || labelData[a.toLowerCase()] || meta.entry;
        const lbl = getLabel(entry);
        const type = classifyEntity(entry);
        const size = 7 + (meta.volume/maxVol)*13;
        return { id:a, x:CX+radius*Math.cos(angle), y:CY+radius*Math.sin(angle), label:lbl!=='—'?lbl:shortAddr(a), type, volume:meta.volume, count:meta.count, size, direction:meta.direction };
      });
      setNodes(builtNodes);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const s = { sub:'#4A5A7A', border:'rgba(255,255,255,0.07)', text:'#E2E8F0', gold:'#F0C040' };

  return (
    <Layout title="Wallet Intel — Relationship Map" description="Visualize wallet counterparty relationships on-chain.">
      <section style={{ padding:'60px 24px 100px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>

          <div style={{ marginBottom:32 }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:s.gold, letterSpacing:'0.2em', marginBottom:12, textTransform:'uppercase' }}>Relationship Map</p>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,42px)', color:s.text, fontWeight:400, marginBottom:8 }}>Who does this wallet talk to?</h1>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:s.sub, lineHeight:1.7 }}>Enter any wallet to see its top counterparties mapped visually. Node size = transfer volume.</p>
          </div>

          <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${s.border}`, borderRadius:14, padding:28 }}>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
              <input value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key==='Enter'&&lookup()}
                placeholder="0x... — enter any wallet address"
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${s.border}`, borderRadius:8, color:s.text, fontFamily:"'Space Mono',monospace", fontSize:13, outline:'none', padding:'11px 14px' }} />
              <button onClick={lookup} disabled={loading} style={{ background:s.gold, border:'none', borderRadius:8, color:'#070B12', cursor:loading?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, opacity:loading?0.6:1, padding:'11px 22px', whiteSpace:'nowrap' }}>
                {loading ? 'Mapping…' : 'Map It'}
              </button>
            </div>

            {error && <div style={{ background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:6, color:'#FF8080', fontFamily:"'Space Mono',monospace", fontSize:12, padding:'10px 14px', marginBottom:12 }}>⚠ {error}</div>}

            {nodes.length > 0 && (
              <>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background:'rgba(255,255,255,0.01)', borderRadius:12, border:`1px solid ${s.border}`, display:'block' }}>
                  <circle cx={CX} cy={CY} r={155} fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />
                  {nodes.map(node => {
                    const maxVol = Math.max(...nodes.map(n => n.volume));
                    const opacity = 0.1 + (node.volume/maxVol)*0.45;
                    const strokeW = 0.5 + (node.volume/maxVol)*2.5;
                    return <line key={node.id} x1={CX} y1={CY} x2={node.x} y2={node.y} stroke={TYPE_COLORS[node.type]} strokeWidth={strokeW} strokeOpacity={opacity} />;
                  })}
                  <circle cx={CX} cy={CY} r={26} fill={`${s.gold}18`} stroke={s.gold} strokeWidth={2} />
                  <circle cx={CX} cy={CY} r={32} fill="none" stroke={s.gold} strokeWidth={0.5} strokeOpacity={0.3} />
                  <text x={CX} y={CY+4} textAnchor="middle" fill={s.gold} fontSize={9} fontFamily="'Space Mono',monospace" fontWeight={700}>
                    {centerInfo?.label?.length > 14 ? centerInfo.label.slice(0,12)+'…' : centerInfo?.label}
                  </text>
                  {nodes.map(node => (
                    <g key={node.id} style={{ cursor:'pointer' }} onClick={() => setSelected(selected?.id===node.id?null:node)}>
                      <circle cx={node.x} cy={node.y} r={node.size+6} fill="transparent" />
                      <circle cx={node.x} cy={node.y} r={node.size} fill={selected?.id===node.id?TYPE_COLORS[node.type]:`${TYPE_COLORS[node.type]}20`} stroke={TYPE_COLORS[node.type]} strokeWidth={selected?.id===node.id?0:1.5} />
                      <text x={node.x} y={node.y-node.size-5} textAnchor="middle" fill={TYPE_COLORS[node.type]} fontSize={9} fontFamily="'Space Mono',monospace">
                        {node.label.length>13?node.label.slice(0,11)+'…':node.label}
                      </text>
                    </g>
                  ))}
                </svg>

                <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:10, justifyContent:'center' }}>
                  {[...new Set(nodes.map(n=>n.type))].map(type => (
                    <div key={type} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:TYPE_COLORS[type] }} />
                      <span style={{ color:TYPE_COLORS[type], fontFamily:"'Space Mono',monospace", fontSize:10 }}>{type}</span>
                    </div>
                  ))}
                  <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:10 }}>· node size = volume · click to inspect</span>
                </div>

                {selected && (
                  <div style={{ marginTop:14, background:TYPE_BG[selected.type], border:`1px solid ${TYPE_COLORS[selected.type]}33`, borderRadius:10, padding:'14px 18px', fontFamily:"'Space Mono',monospace" }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ color:TYPE_COLORS[selected.type], fontWeight:700, fontSize:14, marginBottom:4 }}>{selected.label}</div>
                        <div style={{ color:s.sub, fontSize:11, marginBottom:4 }}>{selected.id}</div>
                        <div style={{ color:'#7A8A9A', fontSize:11 }}>{selected.count} tx · {fmtUSD(selected.volume)} total · {selected.direction==='out'?'→ outflow':'← inflow'}</div>
                      </div>
                      <span style={{ background:TYPE_BG[selected.type], color:TYPE_COLORS[selected.type], border:`1px solid ${TYPE_COLORS[selected.type]}33`, borderRadius:4, padding:'4px 12px', fontSize:10, fontWeight:700 }}>{selected.type}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {!nodes.length && !loading && !error && (
              <div style={{ textAlign:'center', padding:'56px 24px', color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:11, lineHeight:1.8 }}>
                Enter any wallet to see its top counterparties mapped visually.<br />
                <span style={{ fontSize:10, opacity:0.5 }}>Shows up to 10 connections · Click any node to inspect it</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}