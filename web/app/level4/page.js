"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Terminal from '../components/Terminal';

export default function Level4() {
  const txUrl = 'https://sepolia.basescan.org/tx/0x63049a18c4e8e1c1c5849881bc70887e43e0580cf9682fe2dfb28ca59e780d22';
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

  useEffect(() => {
    // Insert an HTML comment in the DOM (visible in Elements, not console logs)
    let hintComment;
    try {
      hintComment = document.createComment(' Input data may hold a secret ');
      const root = document.documentElement || document.body;
      if (root && root.firstChild) {
        root.insertBefore(hintComment, root.firstChild);
      } else if (root) {
        root.appendChild(hintComment);
      }
    } catch {}
    return () => {
      try { hintComment?.remove?.() } catch {}
    };
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
      }}
    >
      <a
        href={txUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#3cff3c',
          fontSize: 'min(5vw, 24px)',
          textDecoration: 'underline',
          textUnderlineOffset: 4,
        }}
      >
        {txUrl}
      </a>

      <Terminal
        open={open}
        onClose={() => setOpen(false)}
        mode="level4"
        onComplete={() => router.push('/level5')}
      />
    </main>
  );
}
