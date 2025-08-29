export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing OPENROUTER_API_KEY' }), { status: 500 })
  }

  const { message, systemPrompt, model = 'google/gemini-2.0-flash-thinking-exp:free' } = await req.json()
  if (!message || !systemPrompt) {
    return new Response(JSON.stringify({ error: 'Missing message or systemPrompt' }), { status: 400 })
  }

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        'X-Title': 'Swan Computer'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    })

    if (!orRes.ok) {
      const details = await orRes.text()
      return new Response(JSON.stringify({ error: 'OpenRouter error', details }), { status: orRes.status })
    }
    const data = await orRes.json()
    const content = data?.choices?.[0]?.message?.content || ''
    return new Response(JSON.stringify({ content }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500 })
  }
}

