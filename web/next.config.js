/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => ([
    {
      source: '/(.*)\.(png|jpg|jpeg|gif|webp|glb)$',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
    }
  ])
}

module.exports = nextConfig
