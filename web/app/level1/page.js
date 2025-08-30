"use client";
import { useEffect } from 'react';

export default function Level1() {
  // Insert a DOM comment so it appears in DevTools (not a console log)
  useEffect(() => {
    let promoComment;
    try {
      promoComment = document.createComment(
        ' Promotion is manual. THe way up is in the address '
      );
      const root = document.documentElement || document.body;
      if (root && root.firstChild) {
        root.insertBefore(promoComment, root.firstChild);
      } else if (root) {
        root.appendChild(promoComment);
      }
    } catch {}
    return () => {
      try {
        promoComment?.remove?.();
      } catch {}
    };
  }, []);
  const count = 240;
  const arrows = new Array(count).fill(0);

  const fract = (x) => x - Math.floor(x);
  const jitter = (i) => fract(Math.sin(i * 78.233) * 10000) * 4 - 2; // -2..2%
  const delay = (i) => fract(Math.sin(i * 12.9898) * 43758.5453) * 5.5; // 0..5.5s
  const dur = (i) => 2.5 + fract(Math.sin(i * 2.123) * 1000) * 2.7; // 2.5..5.2s

  return (
    <main
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#000',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {arrows.map((_, i) => {
          const base = (i / count) * 100;
          const left = Math.max(0, Math.min(100, base + jitter(i)));
          return (
            <div
              key={i}
              className="arrow"
              style={{
                left: `${left}%`,
                ['--delay']: `${delay(i)}s`,
                ['--dur']: `${dur(i)}s`,
              }}
            >
              ↑
            </div>
          );
        })}
      </div>

      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div
          style={{
            color: '#3cff3c',
            fontSize: 'min(10vw, 72px)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textShadow: '0 0 10px rgba(60,255,60,0.6)',
          }}
        >
          Look up
        </div>
      </div>

      {/* Bottom-left hint */}
      <div
        style={{
          position: 'fixed',
          left: 12,
          bottom: 12,
          color: '#cfcfcf',
          opacity: 0.85,
          fontSize: 14,
          zIndex: 2,
          userSelect: 'none',
        }}
      >
        Remember to open the console for helpful clues
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(160vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-120vh); opacity: 0; }
        }
        .arrow {
          position: absolute;
          bottom: -30vh;
          width: 0;
          color: #3cff3c;
          text-shadow: 0 0 8px rgba(60, 255, 60, 0.65);
          font-size: min(4.5vw, 28px);
          font-weight: 900;
          animation: floatUp var(--dur) linear infinite;
          animation-delay: var(--delay);
          filter: drop-shadow(0 0 6px rgba(60,255,60,0.45));
        }
      `}</style>
    </main>
  );
}
