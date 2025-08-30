export const metadata = {
  title: 'Ancient Artifact: Bouquet',
}

export default function BouquetArtifactPage() {
  const buyUrl = process.env.NEXT_PUBLIC_BOUQUET_NFT_URL || ''
  const hasBuyUrl = !!buyUrl
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0b0b0b',
      color: '#e6e6e6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        width: 'min(900px, 100%)',
        background: 'rgba(20,20,20,0.9)',
        border: '1px solid #222',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{marginTop: 0, marginBottom: 12, fontFamily: 'VT323, monospace', color: '#33ff33'}}>Ancient Artifact: Bouquet</h1>
        <p style={{opacity: .8, marginTop: 0}}>This bouquet will help you make the swans reveal their secrets to you with its enchanting smell. It may be used anytime.</p>
        <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start'}}>
          <img src="/images/bouquet.jpeg" alt="Bouquet artifact" style={{maxWidth: 420, width: '100%', borderRadius: 8, border: '1px solid #333'}} />
          <div style={{flex: 1, minWidth: 260}}>
            <div style={{border: '1px solid #333', borderRadius: 8, padding: 16, background: '#111'}}> 
              <h2 style={{marginTop: 0, fontFamily: 'VT323, monospace', color: '#33ff33'}}>Mint as NFT</h2>
              {hasBuyUrl ? (
                <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#1a5c1a',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  border: '1px solid #2a7c2a'
                }}>Buy on Marketplace</a>
              ) : (
                <div>
                  <p style={{marginTop: 0}}>Mint link not set.</p>
                  <p style={{marginBottom: 12}}>Set <code>NEXT_PUBLIC_BOUQUET_NFT_URL</code> in <code>web/.env.local</code> to your marketplace or mint page URL once deployed.</p>
                  <span style={{color: '#bbb'}}>Ask an admin for the mint link once deployed.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
