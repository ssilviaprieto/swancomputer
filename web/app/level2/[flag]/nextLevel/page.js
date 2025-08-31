import { redirect } from 'next/navigation';
import Image from 'next/image';
import catImg from '../../cat.jpg';

export default async function Level2FlagPage({ params }) {
  const { flag } = await params;

  if (String(flag).toLowerCase() === 'true') {
    redirect('/level3');
  }

  return (
    <main
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#000',
        color: '#ddd',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <Image
            src={catImg}
            alt="Cat hint"
            priority
            style={{
              maxWidth: 'min(80vw, 480px)',
              height: 'auto',
              borderRadius: 8,
              boxShadow: '0 0 24px rgba(60,255,60,0.25)',
            }}
          />
        </div>
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 700, color: '#3cff3c' }}>
          Be more positive
        </div>
      </div>
    </main>
  );
}
