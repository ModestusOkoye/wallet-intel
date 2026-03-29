import { useState, useRef } from 'react';
import Layout from '../components/Layout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortAddr(addr) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function getEntityName(entry) { return entry?.arkhamEntity?.name || ''; }
function getLabelName(entry) { return entry?.arkhamLabel?.name || ''; }

const TYPE_COLORS = { CEX:'#4DA6FF', Fund:'#50C878', DeFi:'#FF9500', Whale:'#B19CD9', Unclassified:'#5A6A8A' };
const TYPE_BG = { CEX:'rgba(77,166,255,0.12)', Fund:'rgba(80,200,120,0.12)', DeFi:'rgba(255,149,0,0.12)', Whale:'rgba(177,156,217,0.12)', Unclassified:'rgba(90,106,138,0.1)' };

function classifyAddr(addr, entry, overrides) {
  if (overrides[addr]) return overrides[addr];
  if (!entry) return 'Unclassified';
  const type = (entry.arkhamEntity?.type || '').toLowerCase();
  const name = (entry.arkhamEntity?.name || entry.arkhamLabel?.name || '').toLowerCase();
  if (type.includes('cex') || type.includes('exchange') ||
    ['binance','coinbase','kraken','okx','bybit','gate','kucoin','huobi','upbit','bitfinex','gemini','crypto.com','bitmex','bitget','mexc'].some(x => name.includes(x)) ||
    name.includes('deposit') || name.includes('withdrawal') || name.includes('hot wallet'))
    return 'CEX';
  if (type.includes('fund') || type.includes('vc') ||
    ['fund','capital','ventures','invest','partners','asset'].some(x => name.includes(x)))
    return 'Fund';
  if (type.includes('defi') || type.includes('protocol') || type.includes('contract') ||
    name.includes('bridge') || name.includes('router') || name.includes('pool') || name.includes('vault'))
    return 'DeFi';
  return 'Unclassified';
}

export default function Search() {
  const [tab, setTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [singleAddr, setSingleAddr] = useState('');
  const [multiAddrs, setMultiAddrs] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [csvResults, setCsvResults] = useState(null);
  const [csvGroupTab, setCsvGroupTab] = useState('All');
  const [csvName, setCsvName] = useState('');
  const [csvCopied, setCsvCopied] = useState(null);
  const [csvAddresses, setCsvAddresses] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [copied, setCopied] = useState(null);
  const fileInputRef = useRef(null);

  const ALL_TYPES = ['CEX', 'Fund', 'DeFi', 'Whale', 'Unclassified'];

  const doLookup = async (addresses, isMulti = false) => {
    if (!addresses.length) return;
    setLoading(true); setError('');
    if (!isMulti) setSingleResult(null);
    else { setCsvResults(null); setCsvGroupTab('All'); setSelected(new Set()); setOverrides({}); }
    try {
      const res = await fetch('/api/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addresses }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (isMulti) { setCsvResults(data); setCsvName(`${addresses.length} addresses`); }
      else setSingleResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleCSVFile = async (file) => {
    if (!file) return;
    setCsvName(file.name); setCsvResults(null); setCsvAddresses([]); setCsvGroupTab('All'); setError(''); setOverrides({}); setSelected(new Set());
    try {
      const text = await file.text();
      const matches = text.match(/0x[a-fA-F0-9]{40}/gi) || [];
      const unique = [...new Set(matches.map(a => a.toLowerCase()))];
      if (!unique.length) { setError('No Ethereum addresses found in this file.'); return; }
      setCsvAddresses(unique);
    } catch (err) { setError(err.message); }
  };

  const runCSVLookup = async () => {
    if (!csvAddresses.length) return;
    setLoading(true); setError(''); setCsvResults(null); setOverrides({}); setSelected(new Set());
    try {
      const res = await fetch('/api/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addresses: csvAddresses }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCsvResults(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const clearCSV = () => {
    setCsvResults(null); setCsvName(''); setCsvGroupTab('All'); setCsvAddresses([]); setError(''); setOverrides({}); setSelected(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const csvEntries = csvResults ? Object.entries(csvResults) : [];
  const csvGroups = { All: [], CEX: [], Fund: [], DeFi: [], Whale: [], Unclassified: [] };
  csvEntries.forEach(([addr, entry]) => {
    const type = classifyAddr(addr, entry, overrides);
    csvGroups['All'].push([addr, entry, type]);
    csvGroups[type].push([addr, entry, type]);
  });
  const activeGroup = csvGroups[csvGroupTab] || [];

  const toggleSelect = (addr) => { const s = new Set(selected); s.has(addr) ? s.delete(addr) : s.add(addr); setSelected(s); };
  const toggleSelectAll = () => { if (selected.size === activeGroup.length) setSelected(new Set()); else setSelected(new Set(activeGroup.map(([addr]) => addr))); };
  const reclassifySelected = (newType) => { const o = { ...overrides }; selected.forEach(addr => { o[addr] = newType; }); setOverrides(o); setSelected(new Set()); };

  const exportGroupCSV = (groupName) => {
    const rows = ['Address,Entity,Label,Type,Note', ...csvGroups[groupName].map(([addr, entry, type]) => `"${addr}","${getEntityName(entry)}","${getLabelName(entry)}","${type}","${entry?.arkhamEntity?.note || ''}"`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `wallet-intel-${groupName.toLowerCase()}.csv`; a.click();
  };

  const copyGroupSQL = (groupName) => {
    const addrs = csvGroups[groupName].map(([addr]) => `  '${addr}'`).join(',\n');
    const sql = `-- ${groupName} addresses (${csvGroups[groupName].length} wallets)\nLOWER(address) IN (\n${addrs}\n)`;
    navigator.clipboard.writeText(sql);
    setCsvCopied(groupName);
    setTimeout(() => setCsvCopied(null), 2000);
  };

  const copyAddr = (addr) => { navigator.clipboard.writeText(addr); setCopied(addr); setTimeout(() => setCopied(null), 1500); };
  const multiCount = multiAddrs.split(/[\n,]+/).filter(a => a.trim().startsWith('0x') && a.trim().length === 42).length;

  const s = {
    bg: '#070B12', surface: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)',
    text: '#E2E8F0', sub: '#4A5A7A', gold: '#F0C040',
    input: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#E2E8F0', fontFamily:"'Space Mono',monospace", fontSize:13, outline:'none', padding:'11px 14px', width:'100%', boxSizing:'border-box' },
    btn: (disabled) => ({ background:'#F0C040', border:'none', borderRadius:8, color:'#070B12', cursor:disabled?'not-allowed':'pointer', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, opacity:disabled?0.6:1, padding:'11px 22px', whiteSpace:'nowrap' }),
    ghost: (color) => ({ background:'transparent', border:`1px solid ${color}33`, borderRadius:6, color, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:11, padding:'5px 12px' }),
  };

  const singleEntry = singleResult ? Object.entries(singleResult)[0] : null;

  return (
    <Layout title="Wallet Intel — Search" description="Look up any Ethereum wallet address to identify its entity type.">
      <style>{`
        .tab-btn:hover{color:#A0B0C8!important}
        .row:hover{background:rgba(255,255,255,0.02)!important}
      `}</style>

      <section style={{ padding:'60px 24px 100px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:s.gold, letterSpacing:'0.2em', marginBottom:12, textTransform:'uppercase' }}>Wallet Search</p>
            <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(28px,4vw,42px)', color:s.text, fontWeight:400, marginBottom:8 }}>Identify any wallet instantly</h1>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:s.sub, lineHeight:1.7 }}>Paste an address — single, multiple, or upload a CSV — and get Arkham-powered labels.</p>
          </div>

          {/* Card */}
          <div style={{ background:s.surface, border:`1px solid ${s.border}`, borderRadius:14, padding:28 }}>

            {/* Tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:24, borderBottom:`1px solid ${s.border}`, paddingBottom:0 }}>
              {[{id:'single',label:'Single Address'},{id:'multi',label:'Multiple Addresses'},{id:'csv',label:'Upload CSV'}].map(t => (
                <button key={t.id} className="tab-btn" onClick={() => { setTab(t.id); setError(''); setSingleResult(null); }} style={{ background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.id?s.gold:'transparent'}`, color:tab===t.id?s.gold:s.sub, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.05em', padding:'8px 14px 12px', transition:'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Single */}
            {tab === 'single' && (
              <div>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={singleAddr} onChange={e => { setSingleAddr(e.target.value); setError(''); if (!e.target.value.trim()) setSingleResult(null); }}
                    onKeyDown={e => { if (e.key==='Enter') { const a=singleAddr.trim(); if (!/^0x[a-fA-F0-9]{40}$/.test(a)){setError('Invalid address');return;} doLookup([a]); }}}
                    placeholder="0x..." style={{ ...s.input, flex:1 }} />
                  <button onClick={() => { const a=singleAddr.trim(); if(!/^0x[a-fA-F0-9]{40}$/.test(a)){setError('Invalid address');return;} doLookup([a]); }} disabled={loading} style={s.btn(loading)}>
                    {loading ? 'Looking up…' : 'Look Up'}
                  </button>
                </div>

                {singleEntry && (() => {
                  const [addr, entry] = singleEntry;
                  const type = classifyAddr(addr, entry, {});
                  const entity = getEntityName(entry);
                  const label = getLabelName(entry);
                  return (
                    <div style={{ marginTop:20, padding:'20px 24px', border:`1px solid ${TYPE_COLORS[type]}33`, borderRadius:10, background:TYPE_BG[type] }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:'#7A8A9A' }}>{shortAddr(addr)}</span>
                            <button onClick={() => copyAddr(addr)} style={{ background:'none', border:'none', cursor:'pointer', color:copied===addr?'#50C878':s.sub, fontSize:12, padding:0 }}>{copied===addr?'✓':'⎘'}</button>
                          </div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:entity?s.text:s.sub, marginBottom:4 }}>{entity || label || 'Unlabeled'}</div>
                          {label && entity && <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:s.sub }}>{label}</div>}
                        </div>
                        <span style={{ background:TYPE_BG[type], color:TYPE_COLORS[type], border:`1px solid ${TYPE_COLORS[type]}44`, borderRadius:6, padding:'6px 14px', fontSize:11, fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:'0.08em' }}>{type}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Multi */}
            {tab === 'multi' && (
              <div>
                <textarea value={multiAddrs} onChange={e => { setMultiAddrs(e.target.value); if (!e.target.value.trim()){setCsvResults(null);setCsvName('');setSelected(new Set());setOverrides({});} }}
                  placeholder={'Paste addresses — one per line or comma-separated\n0x...\n0x...'}
                  rows={5} style={{ ...s.input, resize:'vertical', lineHeight:1.7 }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:10 }}>{multiCount} valid address{multiCount!==1?'es':''} · max 50</span>
                  <button onClick={() => doLookup(multiAddrs.split(/[\n,]+/).map(a=>a.trim()).filter(a=>a.startsWith('0x')&&a.length===42), true)} disabled={loading} style={s.btn(loading)}>
                    {loading ? 'Looking up…' : 'Look Up All'}
                  </button>
                </div>
              </div>
            )}

            {/* CSV */}
            {tab === 'csv' && !csvResults && (
              <div>
                <div onClick={() => fileInputRef.current?.click()} style={{ border:`2px dashed ${s.border}`, borderRadius:10, cursor:'pointer', padding:'48px 24px', textAlign:'center' }}>
                  <div style={{ color:s.gold, fontSize:32, marginBottom:12 }}>⬆</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:s.text, marginBottom:6 }}>{csvName || 'Click to upload a CSV file'}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:s.sub }}>Any CSV containing 0x addresses — auto-detected</div>
                  <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={e => handleCSVFile(e.target.files[0])} />
                </div>
                {csvAddresses.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
                    <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:11 }}>{csvAddresses.length} addresses detected in <span style={{ color:s.text }}>{csvName}</span></span>
                    <button onClick={runCSVLookup} disabled={loading} style={s.btn(loading)}>{loading?'Looking up…':'Look Up All'}</button>
                  </div>
                )}
              </div>
            )}

            {/* CSV Results (shown for both multi and csv tabs) */}
            {csvResults && !loading && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:10 }}>{csvEntries.length} addresses screened · <span style={{ color:'#A0B0C8' }}>{csvName}</span></span>
                  <button onClick={clearCSV} style={s.ghost('#FF8080')}>✕ Clear</button>
                </div>

                {/* Stats bar */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ height:6, borderRadius:3, overflow:'hidden', display:'flex', marginBottom:8 }}>
                    {ALL_TYPES.filter(t => csvGroups[t].length > 0).map(type => (
                      <div key={type} style={{ flex:csvGroups[type].length, background:TYPE_COLORS[type] }} />
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {ALL_TYPES.filter(t => csvGroups[t].length > 0).map(type => (
                      <div key={type} style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:TYPE_COLORS[type] }} />
                        <span style={{ color:TYPE_COLORS[type], fontFamily:"'Space Mono',monospace", fontSize:10 }}>{type}</span>
                        <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:10 }}>{csvGroups[type].length} ({Math.round(csvGroups[type].length/csvEntries.length*100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group tabs */}
                <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                  {['All',...ALL_TYPES].map(type => {
                    const count = type==='All' ? csvEntries.length : csvGroups[type].length;
                    if (type!=='All' && count===0) return null;
                    const active = csvGroupTab===type;
                    const color = type==='All' ? s.gold : TYPE_COLORS[type];
                    return (
                      <button key={type} onClick={() => { setCsvGroupTab(type); setSelected(new Set()); }} style={{ background:active?`${color}18`:'transparent', border:`1px solid ${active?color:s.border}`, borderRadius:5, color:active?color:s.sub, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:10, fontWeight:active?700:400, padding:'4px 12px' }}>
                        {type} ({count})
                      </button>
                    );
                  })}
                </div>

                {activeGroup.length > 0 && (
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <button onClick={() => exportGroupCSV(csvGroupTab)} style={s.ghost(s.gold)}>↓ Download {csvGroupTab} CSV</button>
                    <button onClick={() => copyGroupSQL(csvGroupTab)} style={s.ghost(csvCopied===csvGroupTab?'#50C878':'#4DA6FF')}>{csvCopied===csvGroupTab?'✓ Copied!':'{ } Copy as SQL'}</button>
                  </div>
                )}

                {/* Table */}
                <div style={{ borderRadius:8, border:`1px solid ${s.border}`, overflow:'hidden', maxHeight:420, overflowY:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Space Mono',monospace", fontSize:11 }}>
                    <thead style={{ position:'sticky', top:0, background:'#0A0F1A', zIndex:1 }}>
                      <tr>
                        <th style={{ padding:'8px 10px', borderBottom:`1px solid ${s.border}`, width:32 }}>
                          <input type="checkbox" checked={selected.size===activeGroup.length&&activeGroup.length>0} onChange={toggleSelectAll} style={{ cursor:'pointer', accentColor:s.gold }} />
                        </th>
                        {['Address','Entity','Label','Type','Note'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:s.sub, fontWeight:400, fontSize:10, letterSpacing:1, borderBottom:`1px solid ${s.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeGroup.map(([addr, entry, type], i) => {
                        const entity = getEntityName(entry);
                        const label = getLabelName(entry);
                        const note = entry?.arkhamEntity?.note || '';
                        const isSelected = selected.has(addr);
                        return (
                          <tr key={addr} className="row" onClick={() => toggleSelect(addr)} style={{ background:isSelected?'rgba(240,192,64,0.05)':i%2===0?'transparent':'rgba(255,255,255,0.01)', cursor:'pointer', transition:'background 0.1s' }}>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}`, textAlign:'center' }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(addr)} onClick={e => e.stopPropagation()} style={{ cursor:'pointer', accentColor:s.gold }} />
                            </td>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}`, color:'#7A8A9A' }}>{shortAddr(addr)}</td>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}`, color:entity?s.text:s.sub, fontWeight:entity?700:400 }}>{entity||'—'}</td>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}`, color:label?'#C8D8F0':s.sub }}>{label||'—'}</td>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}` }}>
                              <span style={{ background:TYPE_BG[type], color:TYPE_COLORS[type], border:`1px solid ${TYPE_COLORS[type]}33`, borderRadius:4, padding:'2px 7px', fontSize:9, fontWeight:700 }}>{type}</span>
                            </td>
                            <td style={{ padding:'7px 10px', borderBottom:`1px solid ${s.border}`, color:s.sub, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note||'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Reclassify bar */}
                {selected.size > 0 && (
                  <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#0A0F1A', border:`2px solid ${s.gold}`, borderRadius:10, padding:'12px 20px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', boxShadow:'0 8px 32px rgba(0,0,0,0.6)', maxWidth:700, width:'calc(100% - 48px)', zIndex:100 }}>
                    <span style={{ color:s.gold, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13 }}>{selected.size} selected</span>
                    <span style={{ color:s.sub, fontFamily:"'Space Mono',monospace", fontSize:11 }}>Move to →</span>
                    {ALL_TYPES.map(type => (
                      <button key={type} onClick={() => reclassifySelected(type)} style={{ background:`${TYPE_COLORS[type]}18`, border:`1px solid ${TYPE_COLORS[type]}`, borderRadius:4, color:TYPE_COLORS[type], cursor:'pointer', fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, padding:'5px 14px' }}>{type}</button>
                    ))}
                    <button onClick={() => setSelected(new Set())} style={{ background:'transparent', border:'none', color:s.sub, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:11, marginLeft:'auto' }}>✕ Deselect all</button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background:'rgba(255,80,80,0.07)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:6, color:'#FF8080', fontFamily:"'Space Mono',monospace", fontSize:12, marginTop:12, padding:'10px 14px' }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}