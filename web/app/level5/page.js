"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Terminal from '../components/Terminal';

export default function Level5() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const bufferRef = useRef('');

  useEffect(() => {
    const onKey = (e) => {
      if (!e.key || e.key.length !== 1) return;
      const ch = e.key.toLowerCase();
      if (!/[a-z]/.test(ch)) return;
      bufferRef.current = (bufferRef.current + ch).slice(-4);
      if (bufferRef.current === 'swan') {
        setOpen(true);
        bufferRef.current = '';
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#000',
        color: '#3cff3c',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div>
        <div style={{ opacity: 0.95 }}>
          Seek counsel: speak with SWAN.
        </div>
        <img
          src="/images/swannobackground.png"
          alt="Swan"
          style={{
            display: 'block',
            margin: '16px auto 0',
            maxWidth: 'min(70vw, 520px)',
            width: '100%',
            height: 'auto',
            filter: 'drop-shadow(0 0 18px rgba(60,255,60,0.2))',
          }}
        />
      </div>

      <Terminal
        open={open}
        onClose={() => setOpen(false)}
        mode="level5"
        onComplete={() => router.push('/level6')}
      />
    </main>
  )
}
