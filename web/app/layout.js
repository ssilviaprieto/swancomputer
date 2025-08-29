export const metadata = {
  title: 'Swan Computer',
  description: 'Treasure hunt of riddles on Base Sepolia',
}

import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

