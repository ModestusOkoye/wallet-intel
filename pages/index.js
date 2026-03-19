import { useState, useRef, useEffect } from "react";
import Head from "next/head";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

function truncate(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function parseMultiInput(text) {
  const tokens = text.split(/[\n,\s]+/);
  const seen = new Set();
  const valid = [];
  for (const token of tokens) {
    const val = token.trim().toLowerCase();
    if (isValidAddress(val) && !seen.has(val)) { seen.add(val); valid.push(val); }
  }
  return valid;
}

function parseAddressesFromCSV(text) {
  const lines = text.split(/\r?\n/);
  const addresses = new Set();
  for (const line of lines) {
    const cols = line.split(",");
    for (const col of cols) {
      const val = col.trim().replace(/^"(.*)"$/, "$1");
      if (isValidAddress(val)) addresses.add(val.toLowerCase());
    }
  }
  return [...addresses];
}

function downloadCSV(rows, filename) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function getEntityType(r) {
  // Manual override takes priority
  if (r._manualType) return r._manualType;
  const t = (r.entityType || r.labelType || "").toLowerCase();
  if (t === "cex") return "CEX";
  if (t === "dex") return "DEX";
  if (["fund", "hedge fund", "vc"].some(x => t.includes(x))) return "Fund";
  if (r.entity || r.label) return "Other";
  return "Unlabelled";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState("single");
  const [singleInput, setSingleInput] = useState("");
  const [multiInput, setMultiInput] = useState("");
  const [csvAddresses, setCsvAddresses] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [copiedGroup, setCopiedGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState(new Set(["CEX","DEX","Fund","Other","Unlabelled"]));
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(new Set()); // selected addresses
  const fileInputRef = useRef(null);

  const c = darkMode ? dark : light;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wi_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  function saveHistory(addresses, resultCount) {
    const entry = { id: Date.now(), date: new Date().toLocaleDateString(), addresses: addresses.slice(0, 3).map(truncate), total: addresses.length, labelled: resultCount };
    const updated = [entry, ...history].slice(0, 8);
    setHistory(updated);
    try { localStorage.setItem("wi_history", JSON.stringify(updated)); } catch {}
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const addrs = parseAddressesFromCSV(ev.target.result);
      if (addrs.length === 0) { setError("No valid Ethereum addresses found."); setCsvAddresses([]); }
      else if (addrs.length > 50) { setError(`Found ${addrs.length} — only first 50 used.`); setCsvAddresses(addrs.slice(0, 50)); }
      else { setError(""); setCsvAddresses(addrs); }
    };
    reader.readAsText(file);
  }

  async function handleLookup(overrideAddresses) {
    setError(""); setResults(null); setSearchQuery(""); setSelected(new Set());
    setActiveFilters(new Set(["CEX","DEX","Fund","Other","Unlabelled"]));
    let addresses = overrideAddresses || [];

    if (!overrideAddresses) {
      if (mode === "single") {
        const val = singleInput.trim().toLowerCase();
        if (!isValidAddress(val)) { setError("Enter a valid Ethereum address."); return; }
        addresses = [val];
      } else if (mode === "multi") {
        const parsed = parseMultiInput(multiInput);
        if (parsed.length === 0) { setError("No valid addresses found."); return; }
        if (parsed.length > 50) setError(`Found ${parsed.length} — only first 50 used.`);
        addresses = parsed.slice(0, 50);
      } else if (mode === "csv") {
        if (csvAddresses.length === 0) { setError("Upload a CSV first."); return; }
        addresses = csvAddresses;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      const r = data.results ?? [];
      setResults(r);
      saveHistory(addresses, r.filter(x => x.entity || x.label).length);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  // ── Manual reclassify ────────────────────────────────────────────────────

  function reclassifySelected(targetType) {
    setResults(prev => prev.map(r =>
      selected.has(r.address) ? { ...r, _manualType: targetType } : r
    ));
    setSelected(new Set());
  }

  function toggleSelect(addr) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });
  }

  function toggleSelectAll(rows) {
    const allSelected = rows.every(r => selected.has(r.address));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) rows.forEach(r => next.delete(r.address));
      else rows.forEach(r => next.add(r.address));
      return next;
    });
  }

  function toggleFilter(type) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  }

  function copyGroupAddresses(rows, key) {
    navigator.clipboard.writeText(rows.map(r => r.address).join("\n"));
    setCopiedGroup(key); setTimeout(() => setCopiedGroup(""), 2000);
  }

  function copyAsSQL(rows) {
    const lines = rows.map(r => {
      const comment = [r.entity, r.label].filter(Boolean).join(": ");
      return `  '${r.address}'${comment ? ` -- ${comment}` : ""}`;
    }).join(",\n");
    navigator.clipboard.writeText(lines);
    setCopiedGroup("sql"); setTimeout(() => setCopiedGroup(""), 2000);
  }

  function exportRows(rows, filename) {
    const hasLabels = rows.some(r => r.entity || r.label);
    const headers = hasLabels ? ["Address","Entity","Entity Type","Label","Label Type"] : ["Address"];
    const data = rows.map(r => hasLabels
      ? [r.address, r.entity ?? "—", r.entityType ?? "—", r.label ?? "—", r.labelType ?? "—"]
      : [r.address]);
    downloadCSV([headers, ...data], filename);
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const allResults = results ?? [];
  const allTypes = [...new Set(allResults.map(getEntityType))];

  const filtered = allResults.filter(r => {
    const type = getEntityType(r);
    if (!activeFilters.has(type)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (r.entity||"").toLowerCase().includes(q) || (r.label||"").toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
  });

  const breakdown = {};
  for (const r of allResults) { const t = getEntityType(r); breakdown[t] = (breakdown[t] || 0) + 1; }

  // Group filtered results by type
  const groups = {};
  for (const r of filtered) {
    const t = getEntityType(r);
    if (!groups[t]) groups[t] = [];
    groups[t].push(r);
  }

  const labelledTypes = ["CEX","DEX","Fund","Other"].filter(t => groups[t]?.length > 0);
  const hasUnlabelled = (groups["Unlabelled"]?.length || 0) > 0;
  const parsedMultiCount = parseMultiInput(multiInput).length;

  const typeColors = { CEX: "#F0C040", DEX: "#3DD6C8", Fund: "#A78BFA", Other: "#FB923C", Unlabelled: "#5A6A8A" };

  return (
    <>
      <Head>
        <title>Wallet Intel — Arkham Label Checker</title>
        <meta name="description" content="On-chain wallet label checker powered by Arkham" />
      </Head>

      <div style={{ ...s.page, background: c.bg, color: c.text, minHeight: "100vh" }}>

        {/* Header */}
        <header style={s.header}>
          <div style={s.logoRow}>
            <span style={s.logoDot} />
            <span style={{ ...s.logoText, color: c.accent }}> WALLET INTEL</span>
            <button onClick={() => setDarkMode(d => !d)} style={{ ...s.ghostBtn, marginLeft: "auto", background: c.card, border: `1px solid ${c.border}`, color: c.muted }}>
              {darkMode ? "☀ Light" : "☾ Dark"}
            </button>
          </div>
          <p style={{ ...s.tagline, color: c.muted }}>
            On-chain label intelligence · Powered by{" "}
            <a href="https://platform.arkhamintelligence.com" target="_blank" rel="noreferrer" style={{ color: c.accent }}>Arkham</a>
          </p>
        </header>

        {/* History */}
        {history.length > 0 && (
          <div style={{ ...s.historyBar, background: c.card, border: `1px solid ${c.border}` }}>
            <span style={{ ...s.hint, color: c.muted, marginBottom: 0 }}>Recent:</span>
            {history.map(h => (
              <button key={h.id} style={{ ...s.ghostBtn, background: c.bg, border: `1px solid ${c.border}`, color: c.muted, fontSize: 11 }}
                title={`${h.total} addresses · ${h.labelled} labelled · ${h.date}`}>
                {h.addresses.join(", ")}{h.total > 3 ? ` +${h.total - 3}` : ""}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[{ key:"single",label:"Single Address"},{ key:"multi",label:"Multiple Addresses"},{ key:"csv",label:"Upload CSV"}].map(tab => (
            <button key={tab.key}
              style={{ ...s.tab, background: mode===tab.key ? c.card:"transparent", borderColor: mode===tab.key ? c.accent:c.border, color: mode===tab.key ? c.accent:c.muted }}
              onClick={() => { setMode(tab.key); setError(""); setResults(null); setSelected(new Set()); }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input card */}
        <div style={{ ...s.card, background: c.card, border: `1px solid ${c.border}` }}>
          {mode === "single" && (
            <div style={s.inputRow}>
              <input style={{ ...s.input, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                type="text" placeholder="0x..."
                value={singleInput}
                onChange={e => { setSingleInput(e.target.value); if (!e.target.value) setResults(null); }}
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                spellCheck={false} />
              <button style={{ ...s.btn, background: c.accent }} onClick={() => handleLookup()} disabled={loading}>
                {loading ? "Checking…" : "Look Up"}
              </button>
            </div>
          )}

          {mode === "multi" && (
            <>
              <p style={{ ...s.hint, color: c.muted }}>Paste up to 50 addresses — one per line, or separated by commas or spaces.</p>
              <textarea style={{ ...s.textarea, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                placeholder={"0x28c6c06298d514db089934071355e5743bf21d60\n0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE\n..."}
                value={multiInput}
                onChange={e => { setMultiInput(e.target.value); if (!e.target.value) setResults(null); }}
                spellCheck={false} rows={8} />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...s.hint, color: c.muted, marginBottom: 0 }}>
                  {parsedMultiCount > 0 ? `${parsedMultiCount} valid address${parsedMultiCount>1?"es":""} detected${parsedMultiCount>50?" — first 50 will be used":""}` : "Paste addresses above"}
                </span>
                <button style={{ ...s.btn, background: c.accent }} onClick={() => handleLookup()} disabled={loading || parsedMultiCount === 0}>
                  {loading ? "Checking…" : `Look Up${parsedMultiCount > 0 ? ` ${Math.min(parsedMultiCount,50)}` : ""}`}
                </button>
              </div>
            </>
          )}

          {mode === "csv" && (
            <>
              <div style={{ ...s.dropzone, border: `2px dashed ${c.border}` }} onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCSVUpload({ target: { files: [f] } }); }}>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCSVUpload} />
                <span style={{ color: c.accent, fontSize: 28 }}>⬆</span>
                <span style={{ color: c.text, fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14 }}>
                  {csvFileName ? `${csvFileName} · ${csvAddresses.length} addresses found` : "Click or drag a CSV file here"}
                </span>
                <span style={{ ...s.hint, color: c.muted, marginBottom: 0 }}>Any column with 0x addresses will be detected automatically</span>
              </div>
              {csvAddresses.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button style={{ ...s.ghostBtn, border: "1px solid #FF5F57", color: "#FF5F57" }}
                    onClick={() => { setCsvAddresses([]); setCsvFileName(""); setResults(null); setError(""); setSelected(new Set()); if (fileInputRef.current) fileInputRef.current.value=""; }}>
                    ✕ Clear CSV
                  </button>
                  <button style={{ ...s.btn, background: c.accent }} onClick={() => handleLookup()} disabled={loading}>
                    {loading ? "Checking…" : `Look Up ${csvAddresses.length} Addresses`}
                  </button>
                </div>
              )}
            </>
          )}

          {error && <p style={s.error}>{error}</p>}
        </div>

        {/* Results */}
        {results && (
          <div>

            {/* Summary + search */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div>
                <span style={{ color: c.accent, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{allResults.length}</span>
                <span style={{ color: c.muted, fontFamily: "'Space Mono',monospace", fontSize: 12 }}> queried · </span>
                <span style={{ color: "#3DD6C8", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{allResults.filter(r=>r.entity||r.label).length}</span>
                <span style={{ color: c.muted, fontFamily: "'Space Mono',monospace", fontSize: 12 }}> labelled · </span>
                <span style={{ color: c.muted, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{allResults.filter(r=>!r.entity&&!r.label).length}</span>
                <span style={{ color: c.muted, fontFamily: "'Space Mono',monospace", fontSize: 12 }}> unlabelled</span>
              </div>
              <input
                style={{ ...s.input, background: c.card, border: `1px solid ${c.border}`, color: c.text, maxWidth: 240, marginLeft: "auto" }}
                placeholder="🔍 Search entity or label..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                spellCheck={false} />
            </div>

            {/* Filter chips */}
            {allTypes.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: c.muted, fontFamily: "'Space Mono',monospace", fontSize: 11 }}>Filter:</span>
                {allTypes.map(type => {
                  const active = activeFilters.has(type);
                  const col = typeColors[type] || "#5A6A8A";
                  return (
                    <button key={type} onClick={() => toggleFilter(type)}
                      style={{ background: active ? `${col}22`:"transparent", border: `1px solid ${active ? col : c.border}`, borderRadius: 20, color: active ? col : c.muted, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600, padding: "4px 14px" }}>
                      {type} {breakdown[type] ? `(${breakdown[type]})` : ""}
                    </button>
                  );
                })}
                <button onClick={() => setActiveFilters(new Set(allTypes))}
                  style={{ background: "transparent", border: "none", color: c.muted, cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>Reset</button>
              </div>
            )}

            {/* ── Selection action bar — fixed to bottom of screen ── */}
            {selected.size > 0 && (
              <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "#0F1526", border: "1px solid #F0C040", borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 700, width: "calc(100% - 48px)" }}>
                <span style={{ color: "#F0C040", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>
                  {selected.size} selected
                </span>
                <span style={{ color: "#5A6A8A", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>Move to →</span>
                {["CEX","DEX","Fund","Other"].map(type => (
                  <button key={type} onClick={() => reclassifySelected(type)}
                    style={{ background: `${typeColors[type]}22`, border: `1px solid ${typeColors[type]}`, borderRadius: 4, color: typeColors[type], cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, padding: "5px 14px" }}>
                    {type}
                  </button>
                ))}
                <button onClick={() => setSelected(new Set())}
                  style={{ background: "transparent", border: "none", color: "#5A6A8A", cursor: "pointer", fontFamily: "'Space Mono',monospace", fontSize: 11, marginLeft: "auto" }}>
                  ✕ Deselect all
                </button>
              </div>
            )}

            {/* Labelled groups */}
            {labelledTypes.map(type => {
              const rows = groups[type] || [];
              const col = typeColors[type] || "#5A6A8A";
              const allSel = rows.length > 0 && rows.every(r => selected.has(r.address));
              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={allSel} onChange={() => toggleSelectAll(rows)}
                        style={{ accentColor: col, cursor: "pointer", width: 15, height: 15 }} />
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: col }} />
                      <span style={{ color: col, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>{type} ({rows.length})</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...s.ghostBtn, border: `1px solid ${c.border}`, color: c.muted }} onClick={() => copyGroupAddresses(rows, type)}>
                        {copiedGroup === type ? "✓ Copied" : "⎘ Copy Addresses"}
                      </button>
                      <button style={{ ...s.ghostBtn, border: `1px solid ${c.border}`, color: c.muted }} onClick={() => exportRows(rows, `${type.toLowerCase()}.csv`)}>
                        ↓ Export CSV
                      </button>
                      <button style={{ ...s.ghostBtn, border: `1px solid #F0C040`, color: "#F0C040" }} onClick={() => copyAsSQL(rows)}
                        title="Copy as SQL — paste into your Dune CTE">
                        {copiedGroup === "sql" ? "✓ Copied SQL" : "{ } Copy as SQL"}
                      </button>
                    </div>
                  </div>
                  <ResultTable rows={rows} selected={selected} onSelect={toggleSelect} copied={copied} onCopy={addr => copyText(addr, addr)} c={c} accentCol={col} />
                </div>
              );
            })}

            {/* Unlabelled group */}
            {hasUnlabelled && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox"
                      checked={(groups["Unlabelled"]||[]).every(r => selected.has(r.address))}
                      onChange={() => toggleSelectAll(groups["Unlabelled"]||[])}
                      style={{ accentColor: "#5A6A8A", cursor: "pointer", width: 15, height: 15 }} />
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c.muted }} />
                    <span style={{ color: c.muted, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>Unlabelled ({groups["Unlabelled"]?.length || 0})</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...s.ghostBtn, border: `1px solid ${c.border}`, color: c.muted }} onClick={() => copyGroupAddresses(groups["Unlabelled"]||[], "unlab")}>
                      {copiedGroup === "unlab" ? "✓ Copied" : "⎘ Copy Addresses"}
                    </button>
                    <button style={{ ...s.ghostBtn, border: `1px solid ${c.border}`, color: c.muted }} onClick={() => exportRows(groups["Unlabelled"]||[], "unlabelled.csv")}>
                      ↓ Export CSV
                    </button>
                  </div>
                </div>
                <div style={{ ...s.tableWrap, background: c.card, border: `1px solid ${c.border}` }}>
                  <table style={s.table}>
                    <thead><tr>
                      <th style={{ ...s.th, color: c.muted, borderBottom: `1px solid ${c.border}`, width: 32 }}></th>
                      <th style={{ ...s.th, color: c.muted, borderBottom: `1px solid ${c.border}` }}>Address</th>
                    </tr></thead>
                    <tbody>
                      {(groups["Unlabelled"]||[]).map(r => (
                        <tr key={r.address} style={{ borderBottom: `1px solid ${c.bg}`, background: selected.has(r.address) ? "rgba(240,192,64,0.06)" : "transparent" }}>
                          <td style={{ ...s.td, width: 32 }}>
                            <input type="checkbox" checked={selected.has(r.address)} onChange={() => toggleSelect(r.address)}
                              style={{ accentColor: "#5A6A8A", cursor: "pointer" }} />
                          </td>
                          <td style={{ ...s.td, color: "#3DD6C8" }}>
                            {truncate(r.address)}
                            <button style={s.copyBtn} onClick={() => copyText(r.address, r.address)}>{copied === r.address ? " ✓" : " ⎘"}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Export all */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <button style={{ ...s.ghostBtn, border: `1px solid ${c.border}`, color: c.muted }} onClick={() => exportRows(allResults, "wallet-intel-all.csv")}>
                ↓ Export All CSV
              </button>
            </div>
          </div>
        )}

        <footer style={{ ...s.footer, borderTop: `1px solid ${c.border}`, color: c.muted }}>
          Built by{" "}
          <a href="https://dune.com/modestus_eth" target="_blank" rel="noreferrer" style={{ color: c.accent }}>@modestus_eth</a>
          {" "}· Data from Arkham Intelligence
        </footer>
      </div>
    </>
  );
}

// ─── Result Table ─────────────────────────────────────────────────────────────

function ResultTable({ rows, selected, onSelect, copied, onCopy, c, accentCol }) {
  return (
    <div style={{ ...s.tableWrap, background: c.card, border: `1px solid ${c.border}` }}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, color: c.muted, borderBottom: `1px solid ${c.border}`, width: 32 }}></th>
            {["Address","Entity","Entity Type","Label","Label Type"].map(h => (
              <th key={h} style={{ ...s.th, color: c.muted, borderBottom: `1px solid ${c.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.address} style={{ borderBottom: `1px solid ${c.bg}`, background: selected.has(r.address) ? "rgba(240,192,64,0.06)" : "transparent" }}>
              <td style={{ ...s.td, width: 32 }}>
                <input type="checkbox" checked={selected.has(r.address)} onChange={() => onSelect(r.address)}
                  style={{ accentColor: accentCol, cursor: "pointer" }} />
              </td>
              <td style={{ ...s.td, color: "#3DD6C8" }}>
                {truncate(r.address)}
                <button style={s.copyBtn} onClick={() => onCopy(r.address)}>{copied === r.address ? " ✓" : " ⎘"}</button>
              </td>
              <td style={s.td}>{r.entity ? <span style={{ color: "#F0C040", fontWeight: 700 }}>{r.entity}</span> : <span style={{ color: c.muted }}>—</span>}</td>
              <td style={s.td}>{r.entityType ? <span style={{ background: "rgba(240,192,64,0.1)", borderRadius: 3, color: "#F0C040", fontSize: 11, padding: "2px 7px" }}>{r.entityType}</span> : <span style={{ color: c.muted }}>—</span>}</td>
              <td style={s.td}>{r.label ? <span style={{ color: c.text }}>{r.label}</span> : <span style={{ color: c.muted }}>—</span>}</td>
              <td style={s.td}>{r.labelType ? <span style={{ background: "rgba(240,192,64,0.1)", borderRadius: 3, color: "#F0C040", fontSize: 11, padding: "2px 7px" }}>{r.labelType}</span> : <span style={{ color: c.muted }}>—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const dark  = { bg: "#080C18", card: "#0F1526", border: "#1E2A45", text: "#D8E0F0", muted: "#5A6A8A", accent: "#F0C040" };
const light = { bg: "#F4F6FA", card: "#FFFFFF",  border: "#DDE3EF", text: "#1A2035", muted: "#8492A6", accent: "#C49A00" };

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page:      { maxWidth: 960, margin: "0 auto", padding: "48px 24px 80px", transition: "background 0.2s" },
  header:    { marginBottom: 32 },
  logoRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  logoDot:   { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#F0C040", boxShadow: "0 0 12px #F0C040" },
  logoText:  { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "0.18em" },
  tagline:   { fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: "0.04em" },
  ghostBtn:  { borderRadius: 4, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 600, padding: "6px 12px", background: "transparent" },
  historyBar:{ borderRadius: 6, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 20, padding: "10px 14px" },
  tabs:      { display: "flex", gap: 4, marginBottom: 16 },
  tab:       { borderRadius: 4, cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, padding: "8px 18px", transition: "all 0.15s", border: "1px solid" },
  card:      { borderRadius: 8, padding: 24, marginBottom: 32 },
  inputRow:  { display: "flex", gap: 10 },
  input:     { borderRadius: 4, flex: 1, fontFamily: "'Space Mono',monospace", fontSize: 13, outline: "none", padding: "10px 14px", border: "1px solid" },
  textarea:  { borderRadius: 4, fontFamily: "'Space Mono',monospace", fontSize: 12, outline: "none", padding: "12px 14px", resize: "vertical", width: "100%", boxSizing: "border-box", lineHeight: 1.7, border: "1px solid" },
  btn:       { border: "none", borderRadius: 4, color: "#080C18", cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "10px 22px", whiteSpace: "nowrap" },
  dropzone:  { alignItems: "center", borderRadius: 6, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, padding: "40px 24px", textAlign: "center" },
  hint:      { fontFamily: "'Space Mono',monospace", fontSize: 11, marginBottom: 8 },
  error:     { background: "rgba(255,95,87,0.1)", border: "1px solid rgba(255,95,87,0.3)", borderRadius: 4, color: "#FF5F57", fontFamily: "'Space Mono',monospace", fontSize: 12, marginTop: 14, padding: "10px 14px" },
  tableWrap: { borderRadius: 8, overflowX: "auto" },
  table:     { borderCollapse: "collapse", fontSize: 13, width: "100%" },
  th:        { fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", padding: "12px 16px", textAlign: "left", textTransform: "uppercase" },
  td:        { fontFamily: "'Space Mono',monospace", fontSize: 12, padding: "11px 16px", verticalAlign: "middle" },
  copyBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 },
  footer:    { fontFamily: "'Space Mono',monospace", fontSize: 11, marginTop: 48, paddingTop: 24, textAlign: "center" },
};