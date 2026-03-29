import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/search', label: 'Search' },
  { href: '/llm-search', label: 'LLM Search' },
  { href: '/relationship-map', label: 'Relationship Map' },
];

export default function Layout({ children, title = 'Wallet Intel', description = 'On-chain label intelligence powered by Arkham' }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #070B12; color: #E2E8F0; font-family: 'Space Mono', monospace; }
          a { text-decoration: none; color: inherit; }
          ::selection { background: rgba(240,192,64,0.3); }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .fade-up { animation: fadeUp 0.6s ease forwards; }
          .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
          .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
          .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
          .fade-up-4 { animation: fadeUp 0.6s 0.4s ease both; }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#070B12' }}>
        {/* Navbar */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid rgba(240,192,64,0.1)',
          background: 'rgba(7,11,18,0.92)',
          backdropFilter: 'blur(12px)',
          padding: '0 24px',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F0C040', boxShadow: '0 0 12px #F0C040' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: '#F0C040', letterSpacing: '0.15em' }}>
                WALLET INTEL
              </span>
            </Link>

            {/* Desktop nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {NAV_LINKS.map(link => {
                const active = router.pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    letterSpacing: '0.05em',
                    color: active ? '#F0C040' : '#5A6A8A',
                    background: active ? 'rgba(240,192,64,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    {link.label}
                  </Link>
                );
              })}
              <Link href="/search" style={{
                marginLeft: 8,
                padding: '7px 16px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#070B12',
                background: '#F0C040',
                transition: 'opacity 0.15s',
              }}>
                LAUNCH APP
              </Link>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F0C040' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: '#F0C040', letterSpacing: '0.1em' }}>WALLET INTEL</span>
            </div>
            <span style={{ color: '#2A3A5A', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
              Built by{' '}
              <a href="https://twitter.com/modestus_eth" target="_blank" rel="noreferrer" style={{ color: '#4DA6FF' }}>@modestus_eth</a>
              {' '}· Data from Arkham Intelligence
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} style={{ color: '#2A3A5A', fontSize: 10, fontFamily: "'Space Mono', monospace" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}