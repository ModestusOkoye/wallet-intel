import { useState, useRef } from 'react';
import Head from 'next/head';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function classifyEntity(entry) {
  if (!entry) return 'Unknown';
  const type = (entry.arkhamEntity?.type || '').toLowerCase();
  const name = (entry.arkhamEntity?.name || entry.arkhamLabel?.name || '').toLowerCase();
  if (type.includes('cex') || type.includes('exchange') ||
      ['binance','coinbase','kraken','okx','bybit','gate','kucoin','huobi','upbit','bitfinex','gemini','crypto.com'].some(x => name.includes(x)))
    return 'CEX';
  if (type.includes('fund') || type.includes('vc') ||
      ['fund','capital','ventures','invest','partners'].some(x => name.includes(x)))
    return 'Fund';
  if (type.includes('defi') || type.includes('protocol') || type.includes('contract'))
    return 'DeFi';
  if (entry.arkhamEntity?.name || entry.arkhamLabel?.name) return 'Whale';
  return 'Unknown';
}

function getLabel(entry) {
  if (!entry) return '—';
  return entry.arkhamEntity?.name || entry.arkhamLabel?.name || '—';
}

function getNote(entry) {
  if (!entry) return '';
  return entry.arkhamLabel?.name || entry.arkhamEntity?.note || '';
}

function shortAddr(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtUSD(val) {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

const TYPE_COLORS = {
  CEX:     '#4DA6FF',
  Fund:    '#50C878',
  DeFi:    '#FF9500',
  Whale:   '#B19CD9',
  Unknown: '#5A6A8A',
};

const TYPE_BG = {
  CEX:     'rgba(77,166,255,0.15)',
  Fund:    'rgba(80,200,120,0.15)',
  DeFi:    'rgba(255,149,0,0.15)',
  Whale:   'rgba(177,156,217,0.15)',
  Unknown: 'rgba(90,106,138,0.12)',
};

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ results, isDark }) {
  const entries = Object.values(results);
  if (!entries.length) return null;
  const counts = { CEX: 0, Fund: 0, DeFi: 0, Whale: 0, Unknown: 0 };
  entries.forEach(e => { counts[classifyEntity(e)]++; });
  const total = entries.length;
  return (
    <div style={{ margin: '16px 0 0', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding: '14px 16px' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#5A6A8A', letterSpacing: 1, marginBottom: 10 }}>
        ENTITY BREAKDOWN — {total} WALLET{total !== 1 ? 'S' : ''}
      </div>
      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
        {Object.entries(counts).filter(([, v]) => v > 0).map(([type, count]) => (
          <div key={type} style={{ flex: count, background: TYPE_COLORS[type] }} title={`${type}: ${count}`} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(counts).filter(([, v]) => v > 0).map(([type, count]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[type] }} />
            <span style={{ color: TYPE_COLORS[type], fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{type}</span>
            <span style={{ color: '#5A6A8A', fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{count} ({Math.round(count / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Results table ────────────────────────────────────────────────────────────
function ResultsTable({ results, isDark }) {
  const [copied, setCopied] = useState(null);
  const entries = Object.entries(results);
  if (!entries.length) return null;

  const border = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)';

  const copyAddr = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportCSV = () => {
    const rows = [
      'Address,Label,Type,Note',
      ...entries.map(([addr, entry]) =>
        `"${addr}","${getLabel(entry)}","${classifyEntity(entry)}","${getNote(entry)}"`
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wallet-intel.csv'; a.click();
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#5A6A8A', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1 }}>
          {entries.length} RESULT{entries.length !== 1 ? 'S' : ''}
        </span>
        <button onClick={exportCSV} style={{ background: 'transparent', border: '1px solid #F0C040', borderRadius: 4, color: '#F0C040', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11, padding: '4px 12px' }}>
          ↓ Export CSV
        </button>
      </div>
      <div style={{ borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
          <thead>
            <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
              {['Address', 'Label', 'Type', 'Note'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#5A6A8A', fontWeight: 400, fontSize: 10, letterSpacing: 1, borderBottom: border }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([addr, entry], i) => {
              const label = getLabel(entry);
              const type = classifyEntity(entry);
              const note = getNote(entry);
              const color = isDark ? '#E8E8E8' : '#111827';
              return (
                <tr key={addr} style={{ background: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)') }}>
                  <td style={{ padding: '8px 12px', borderBottom: border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: isDark ? '#A0B0C8' : '#6B7280', fontSize: 11 }}>{shortAddr(addr)}</span>
                      <button onClick={() => copyAddr(addr)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === addr ? '#50C878' : '#5A6A8A', fontSize: 11, padding: 0 }}>
                        {copied === addr ? '✓' : '⎘'}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: border, color: label === '—' ? '#5A6A8A' : color, fontWeight: label !== '—' ? 600 : 400 }}>{label}</td>
                  <td style={{ padding: '8px 12px', borderBottom: border }}>
                    <span style={{ background: TYPE_BG[type], color: TYPE_COLORS[type], border: `1px solid ${TYPE_COLORS[type]}55`, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                      {type}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: border, color: '#5A6A8A', fontSize: 11 }}>{note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Relationship Map ─────────────────────────────────────────────────────────
function RelationshipMap({ isDark }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nodes, setNodes] = useState([]);
  const [centerInfo, setCenterInfo] = useState(null);
  const [selected, setSelected] = useState(null);

  const W = 560, H = 400, CX = W / 2, CY = H / 2;

  const lookup = async () => {
    const addr = address.trim();
    if (!addr) return;
    setLoading(true); setError(''); setNodes([]); setCenterInfo(null); setSelected(null);

    try {
      // Fetch transfers
      const txRes = await fetch(`/api/lookup?address=${addr}`);
      const txData = await txRes.json();
      if (txData.error) throw new Error(txData.error);

      const transfers = txData.transfers || [];
      if (!transfers.length) {
        setError('No transfers found — try a more active wallet or lower the USD threshold.');
        setLoading(false); return;
      }

      // Aggregate counterparties
      const cmap = {};
      transfers.forEach(tx => {
        const fromAddr = tx.fromAddress?.address;
        const toAddr = tx.toAddress?.address;
        const usd = tx.historicalUSD || 0;
        const isOut = fromAddr?.toLowerCase() === addr.toLowerCase();
        const counterparty = isOut ? toAddr : fromAddr;
        const cpEntry = isOut ? tx.toAddress : tx.fromAddress;
        if (!counterparty || counterparty.toLowerCase() === addr.toLowerCase()) return;
        if (!cmap[counterparty]) cmap[counterparty] = { volume: 0, count: 0, entry: null, direction: isOut ? 'out' : 'in' };
        cmap[counterparty].volume += usd;
        cmap[counterparty].count++;
        if (cpEntry) cmap[counterparty].entry = cpEntry;
      });

      const top = Object.entries(cmap).sort((a, b) => b[1].volume - a[1].volume).slice(0, 10);

      // Batch label lookup
      const allAddrs = [addr, ...top.map(([a]) => a)];
      const labelRes = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: allAddrs }),
      });
      const labelData = await labelRes.json();

      const centerEntry = labelData[addr] || labelData[addr.toLowerCase()];
      setCenterInfo({ address: addr, label: getLabel(centerEntry) !== '—' ? getLabel(centerEntry) : shortAddr(addr), type: classifyEntity(centerEntry) });

      const maxVol = top[0]?.[1].volume || 1;
      const angleStep = (2 * Math.PI) / Math.max(top.length, 1);
      const radius = 148;

      const builtNodes = top.map(([a, meta], i) => {
        const angle = i * angleStep - Math.PI / 2;
        const entry = labelData[a] || labelData[a.toLowerCase()] || meta.entry;
        const label = getLabel(entry) !== '—' ? getLabel(entry) : shortAddr(a);
        const type = classifyEntity(entry);
        const size = 7 + (meta.volume / maxVol) * 13;
        return {
          id: a, x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle),
          label, type, volume: meta.volume, count: meta.count, size, direction: meta.direction,
        };
      });

      setNodes(builtNodes);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="0x... — enter any wallet address"
          style={{ flex: 1, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 6, color: isDark ? '#E8E8E8' : '#111', fontFamily: "'Space Mono',monospace", fontSize: 13, outline: 'none', padding: '10px 14px' }} />
        <button onClick={lookup} disabled={loading}
          style={{ background: '#F0C040', border: 'none', borderRadius: 6, color: '#0A0E1A', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, opacity: loading ? 0.6 : 1, padding: '10px 22px', whiteSpace: 'nowrap' }}>
          {loading ? 'Mapping…' : 'Map It'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 6, color: '#FF8080', fontFamily: "'Space Mono',monospace", fontSize: 12, padding: '10px 14px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {nodes.length > 0 && (
        <>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, display: 'block' }}>
            {/* Dashed orbit ring */}
            <circle cx={CX} cy={CY} r={148} fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeDasharray="4 6" />

            {/* Edges */}
            {nodes.map(node => {
              const maxVol = Math.max(...nodes.map(n => n.volume));
              const opacity = 0.12 + (node.volume / maxVol) * 0.45;
              const strokeW = 0.5 + (node.volume / maxVol) * 2.5;
              return (
                <line key={node.id} x1={CX} y1={CY} x2={node.x} y2={node.y}
                  stroke={TYPE_COLORS[node.type]} strokeWidth={strokeW} strokeOpacity={opacity} />
              );
            })}

            {/* Center node */}
            <circle cx={CX} cy={CY} r={24} fill="#F0C04020" stroke="#F0C040" strokeWidth={2} />
            <circle cx={CX} cy={CY} r={30} fill="none" stroke="#F0C040" strokeWidth={0.5} strokeOpacity={0.3} />
            <text x={CX} y={CY + 4} textAnchor="middle" fill="#F0C040" fontSize={9} fontFamily="'Space Mono',monospace" fontWeight={700}>
              {centerInfo?.label?.length > 14 ? centerInfo.label.slice(0, 12) + '…' : centerInfo?.label}
            </text>

            {/* Counterparty nodes */}
            {nodes.map(node => (
              <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === node.id ? null : node)}>
                <circle cx={node.x} cy={node.y} r={node.size + 6} fill="transparent" />
                <circle cx={node.x} cy={node.y} r={node.size}
                  fill={selected?.id === node.id ? TYPE_COLORS[node.type] : `${TYPE_COLORS[node.type]}22`}
                  stroke={TYPE_COLORS[node.type]} strokeWidth={selected?.id === node.id ? 0 : 1.5} />
                <text x={node.x} y={node.y - node.size - 5} textAnchor="middle"
                  fill={TYPE_COLORS[node.type]} fontSize={9} fontFamily="'Space Mono',monospace">
                  {node.label.length > 13 ? node.label.slice(0, 11) + '…' : node.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, justifyContent: 'center' }}>
            {[...new Set(nodes.map(n => n.type))].map(type => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[type] }} />
                <span style={{ color: TYPE_COLORS[type], fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{type}</span>
              </div>
            ))}
            <span style={{ color: '#5A6A8A', fontFamily: "'Space Mono',monospace", fontSize: 10 }}>· node size = transfer volume · click to inspect</span>
          </div>

          {/* Selected node detail */}
          {selected && (
            <div style={{ marginTop: 12, background: TYPE_BG[selected.type], border: `1px solid ${TYPE_COLORS[selected.type]}44`, borderRadius: 8, padding: '12px 16px', fontFamily: "'Space Mono',monospace" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: TYPE_COLORS[selected.type], fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{selected.label}</div>
                  <div style={{ color: '#5A6A8A', fontSize: 11, marginBottom: 4 }}>{selected.id}</div>
                  <div style={{ color: isDark ? '#A0B0C8' : '#6B7280', fontSize: 11 }}>
                    {selected.count} tx · {fmtUSD(selected.volume)} total · {selected.direction === 'out' ? '→ outflow' : '← inflow'}
                  </div>
                </div>
                <span style={{ background: TYPE_BG[selected.type], color: TYPE_COLORS[selected.type], border: `1px solid ${TYPE_COLORS[selected.type]}44`, borderRadius: 4, padding: '3px 10px', fontSize: 10, fontWeight: 700 }}>
                  {selected.type}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {!nodes.length && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#5A6A8A', fontFamily: "'Space Mono',monospace", fontSize: 12, lineHeight: 1.8 }}>
          Enter any wallet to see its top counterparties mapped visually.<br />
          <span style={{ fontSize: 10, opacity: 0.6 }}>Shows up to 10 connections · Node size = transfer volume · Click any node to inspect it</span>
        </div>
      )}
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({});
  const [singleAddr, setSingleAddr] = useState('');
  const [multiAddrs, setMultiAddrs] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvName, setCsvName] = useState('');
  const [csvResults, setCsvResults] = useState(null);
  const [csvGroupTab, setCsvGroupTab] = useState('All');
  const [csvCopied, setCsvCopied] = useState(null);
  const fileInputRef = useRef(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0E1A' : '#131824';
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.05)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)';
  const textColor = isDark ? '#E8E8E8' : '#D8E0EE';
  const subColor = '#5A6A8A';
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`, borderRadius: 6, color: textColor, fontFamily: "'Space Mono',monospace", fontSize: 13, outline: 'none', padding: '10px 14px', width: '100%', boxSizing: 'border-box' };

  const doLookup = async (addresses) => {
    if (!addresses.length) return;
    setLoading(true); setError(''); setResults({});
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleCSV = async () => {
    if (!csvFile) return;
    setLoading(true); setError(''); setCsvResults(null);
    try {
      const text = await csvFile.text();
      const lines = text.split(/[\n,\r]+/); const addrs = lines.map(l => l.trim().replace(/["'\s]+/g, '')).filter(l => l.length === 42 && l.toLowerCase().startsWith('0x'));
      const unique = [...new Set(addrs)];
      if (!unique.length) { setError('No Ethereum addresses found in this CSV.'); setLoading(false); return; }
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: unique }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCsvResults(data);
      setCsvGroupTab('All');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const clearCSV = () => {
    setCsvFile(null); setCsvName(''); setCsvResults(null);
    setCsvGroupTab('All'); setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // CSV grouped results
  const csvEntries = csvResults ? Object.entries(csvResults) : [];
  const csvGroups = { All: csvEntries, CEX: [], Fund: [], DeFi: [], Whale: [], Unknown: [] };
  csvEntries.forEach(([addr, entry]) => { csvGroups[classifyEntity(entry)].push([addr, entry]); });
  const activeGroup = csvGroups[csvGroupTab] || [];

  const exportGroupCSV = (groupName) => {
    const rows = ['Address,Label,Type,Note',
      ...csvGroups[groupName].map(([addr, entry]) =>
        `"${addr}","${getLabel(entry)}","${classifyEntity(entry)}","${getNote(entry)}"`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `wallet-intel-${groupName.toLowerCase()}.csv`; a.click();
  };

  const copyGroupSQL = (groupName) => {
    const addrs = csvGroups[groupName].map(([addr]) => `  '${addr}'`).join(',\n');
    const sql = `-- ${groupName} addresses from Wallet Intel (${csvGroups[groupName].length} wallets)\nLOWER(address) IN (\n${addrs}\n)`;
    navigator.clipboard.writeText(sql);
    setCsvCopied(groupName);
    setTimeout(() => setCsvCopied(null), 2000);
  };

  const multiCount = multiAddrs.split(/[\n,]+/).filter(a => a.trim().startsWith('0x') && a.trim().length === 42).length;

  const tabStyle = (t) => ({
    background: tab === t ? '#F0C040' : 'transparent',
    border: `1px solid ${tab === t ? '#F0C040' : borderColor}`,
    borderRadius: 6, color: tab === t ? '#0A0E1A' : subColor,
    cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 13,
    fontWeight: 700, padding: '7px 16px', transition: 'all 0.15s',
  });

  const btnStyle = (disabled) => ({
    background: '#F0C040', border: 'none', borderRadius: 6, color: '#0A0E1A',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif",
    fontSize: 13, fontWeight: 700, opacity: disabled ? 0.6 : 1,
    padding: '10px 22px', whiteSpace: 'nowrap',
  });

  const ghostBtn = { background: 'transparent', border: `1px solid ${borderColor}`, borderRadius: 5, color: subColor, cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11, padding: '5px 12px' };

  return (
    <>
      <Head>
        <title>Wallet Intel</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background: bg, minHeight: '100vh', paddingBottom: 64, transition: 'background 0.2s' }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${borderColor}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 820, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F0C040', boxShadow: '0 0 10px #F0C040' }} />
              <span style={{ color: '#F0C040', fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>WALLET INTEL</span>
            </div>
            <div style={{ color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10, marginTop: 2, letterSpacing: 0.5 }}>
              On-chain label intelligence · Powered by <span style={{ color: '#4DA6FF' }}>Arkham</span>
            </div>
          </div>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{ background: surface, border: `1px solid ${borderColor}`, borderRadius: 20, color: subColor, cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11, padding: '5px 14px' }}>
            {isDark ? '◑ Dim' : '● Dark'}
          </button>
        </div>

        <div style={{ maxWidth: 820, margin: '32px auto', padding: '0 16px' }}>
          <div style={{ background: surface, border: `1px solid ${borderColor}`, borderRadius: 14, padding: 24 }}>

            {/* Main tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { id: 'single', label: 'Single Address' },
                { id: 'multi',  label: 'Multiple Addresses' },
                { id: 'csv',    label: 'Upload CSV' },
                { id: 'map',    label: '🕸 Relationship Map' },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setResults({}); setError(''); }} style={tabStyle(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Single */}
            {tab === 'single' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={singleAddr} onChange={e => setSingleAddr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doLookup([singleAddr.trim()])}
                  placeholder="0x..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => doLookup([singleAddr.trim()])} disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Looking up…' : 'Look Up'}
                </button>
              </div>
            )}

            {/* Multi */}
            {tab === 'multi' && (
              <div>
                <textarea value={multiAddrs} onChange={e => setMultiAddrs(e.target.value)}
                  placeholder={'Paste addresses — one per line or comma-separated\n0x...\n0x...\n0x...'}
                  rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
                    {multiCount} valid address{multiCount !== 1 ? 'es' : ''} · max 50 per lookup
                  </span>
                  <button onClick={() => doLookup(multiAddrs.split(/[\n,]+/).map(a => a.trim()).filter(a => a.startsWith('0x') && a.length === 42))}
                    disabled={loading} style={btnStyle(loading)}>
                    {loading ? 'Looking up…' : 'Look Up All'}
                  </button>
                </div>
              </div>
            )}

            {/* ── CSV TAB ── */}
            {tab === 'csv' && (
              <div>
                {/* Upload area — hidden once results are in */}
                {!csvResults && (
                  <div>
                    <div onClick={() => fileInputRef.current?.click()}
                      style={{ border: `2px dashed ${borderColor}`, borderRadius: 8, cursor: 'pointer', padding: '36px 24px', textAlign: 'center' }}>
                      <div style={{ color: '#F0C040', fontSize: 30, marginBottom: 8 }}>⬆</div>
                      <div style={{ color: textColor, fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}>
                        {csvName || 'Click to upload a CSV file'}
                      </div>
                      <div style={{ color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10, marginTop: 4 }}>
                        Any CSV with 0x addresses — auto-detected · enriched with Arkham labels
                      </div>
                      <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files[0]; if (f) { setCsvFile(f); setCsvName(f.name); } }} />
                    </div>
                    {csvFile && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button onClick={handleCSV} disabled={loading} style={btnStyle(loading)}>
                          {loading ? 'Enriching…' : 'Enrich CSV'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Results breakdown ── */}
                {csvResults && (
                  <div>
                    {/* Header row: filename + clear button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <span style={{ color: '#F0C040', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{csvName}</span>
                        <span style={{ color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10, marginLeft: 10 }}>{csvEntries.length} addresses screened</span>
                      </div>
                      <button onClick={clearCSV} style={{ ...ghostBtn, color: '#FF8080', borderColor: 'rgba(255,80,80,0.3)' }}>
                        ✕ Clear
                      </button>
                    </div>

                    {/* Stats bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
                        {Object.entries(csvGroups).filter(([k, v]) => k !== 'All' && v.length > 0).map(([type, group]) => (
                          <div key={type} style={{ flex: group.length, background: TYPE_COLORS[type] }} title={`${type}: ${group.length}`} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {Object.entries(csvGroups).filter(([k, v]) => k !== 'All' && v.length > 0).map(([type, group]) => (
                          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[type] }} />
                            <span style={{ color: TYPE_COLORS[type], fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{type}</span>
                            <span style={{ color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>{group.length} ({Math.round(group.length / csvEntries.length * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group filter tabs */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {Object.entries(csvGroups).map(([type, group]) => {
                        if (type !== 'All' && group.length === 0) return null;
                        const active = csvGroupTab === type;
                        const color = type === 'All' ? '#F0C040' : TYPE_COLORS[type];
                        return (
                          <button key={type} onClick={() => setCsvGroupTab(type)} style={{
                            background: active ? `${color}22` : 'transparent',
                            border: `1px solid ${active ? color : borderColor}`,
                            borderRadius: 5, color: active ? color : subColor,
                            cursor: 'pointer', fontFamily: "'Space Mono',monospace",
                            fontSize: 11, fontWeight: active ? 700 : 400,
                            padding: '4px 12px', transition: 'all 0.15s',
                          }}>
                            {type} <span style={{ opacity: 0.7 }}>({group.length})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action buttons for active group */}
                    {activeGroup.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <button onClick={() => exportGroupCSV(csvGroupTab)} style={{ ...ghostBtn, color: '#F0C040', borderColor: 'rgba(240,192,64,0.4)' }}>
                          ↓ Download {csvGroupTab} CSV
                        </button>
                        <button onClick={() => copyGroupSQL(csvGroupTab)} style={{ ...ghostBtn, color: csvCopied === csvGroupTab ? '#50C878' : '#4DA6FF', borderColor: csvCopied === csvGroupTab ? 'rgba(80,200,120,0.4)' : 'rgba(77,166,255,0.4)' }}>
                          {csvCopied === csvGroupTab ? '✓ Copied!' : '{ } Copy as SQL'}
                        </button>
                      </div>
                    )}

                    {/* Address table for active group */}
                    <div style={{ borderRadius: 8, border: `1px solid ${borderColor}`, overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Space Mono',monospace", fontSize: 11 }}>
                        <thead style={{ position: 'sticky', top: 0, background: isDark ? '#0D1220' : '#161C2E' }}>
                          <tr>
                            {['#', 'Address', 'Label', 'Type', 'Note'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: subColor, fontWeight: 400, fontSize: 10, letterSpacing: 1, borderBottom: `1px solid ${borderColor}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeGroup.map(([addr, entry], i) => {
                            const label = getLabel(entry);
                            const type = classifyEntity(entry);
                            const note = getNote(entry);
                            return (
                              <tr key={addr} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                <td style={{ padding: '7px 10px', color: subColor, borderBottom: `1px solid ${borderColor}`, fontSize: 10 }}>{i + 1}</td>
                                <td style={{ padding: '7px 10px', borderBottom: `1px solid ${borderColor}` }}>
                                  <span style={{ color: '#A0B0C8' }}>{shortAddr(addr)}</span>
                                </td>
                                <td style={{ padding: '7px 10px', borderBottom: `1px solid ${borderColor}`, color: label === '—' ? subColor : textColor, fontWeight: label !== '—' ? 700 : 400 }}>{label}</td>
                                <td style={{ padding: '7px 10px', borderBottom: `1px solid ${borderColor}` }}>
                                  <span style={{ background: TYPE_BG[type], color: TYPE_COLORS[type], border: `1px solid ${TYPE_COLORS[type]}44`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{type}</span>
                                </td>
                                <td style={{ padding: '7px 10px', borderBottom: `1px solid ${borderColor}`, color: subColor }}>{note || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Relationship Map */}
            {tab === 'map' && <RelationshipMap isDark={isDark} />}

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 6, color: '#FF8080', fontFamily: "'Space Mono',monospace", fontSize: 12, marginTop: 12, padding: '10px 14px' }}>
                {error}
              </div>
            )}

            {/* Stats + Table for Single / Multi tabs */}
            {(tab === 'single' || tab === 'multi') && (
              <>
                <StatsBar results={results} isDark={isDark} />
                <ResultsTable results={results} isDark={isDark} />
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, color: subColor, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
            Built by{' '}
            <a href="https://twitter.com/modestus_eth" target="_blank" rel="noreferrer" style={{ color: '#4DA6FF', textDecoration: 'none' }}>@modestus_eth</a>
            {' '}· Data from Arkham Intelligence
          </div>
        </div>
      </div>
    </>
  );
}