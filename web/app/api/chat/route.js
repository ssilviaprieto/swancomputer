export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), { status: 500 })
  }

  const { message, systemPrompt, model = 'moonshotai/kimi-k2-instruct', temperature = 0.6 } = await req.json()
  if (!message || !systemPrompt) {
    return new Response(JSON.stringify({ error: 'Missing message or systemPrompt' }), { status: 400 })
  }

  try {
    const grRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        top_p: 1,
        max_completion_tokens: 4096,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    })

    if (!grRes.ok) {
      const details = await grRes.text()
      return new Response(JSON.stringify({ error: 'Groq error', details }), { status: grRes.status })
    }
    const data = await grRes.json()
    const content = data?.choices?.[0]?.message?.content || ''
    return new Response(JSON.stringify({ content }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500 })
  }
}
