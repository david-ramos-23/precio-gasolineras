export interface InsightInput {
  avgG95: number | null;
  avgG95Prev: number | null;
  avgDiesel: number | null;
  avgDieselPrev: number | null;
  province: string;
  favoriteChanges: Array<{ label: string; price: number; prevPrice: number | null }>;
  isSummary: boolean;
}

export function buildInsightPrompt(input: InsightInput): string {
  const g95Delta = input.avgG95 !== null && input.avgG95Prev !== null
    ? ((input.avgG95 - input.avgG95Prev) * 100).toFixed(1) + ' céntimos'
    : 'sin datos previos';

  const dieselDelta = input.avgDiesel !== null && input.avgDieselPrev !== null
    ? ((input.avgDiesel - input.avgDieselPrev) * 100).toFixed(1) + ' céntimos'
    : 'sin datos previos';

  const favLines = input.favoriteChanges.map(f => {
    const delta = f.prevPrice !== null ? ((f.price - f.prevPrice) * 100).toFixed(1) : 'nuevo';
    return `- ${f.label}: ${f.price.toFixed(3)}€ (${delta} céntimos)`;
  }).join('\n');

  return `Eres un asistente que informa sobre precios de combustible en España de forma concisa y útil.

Datos actuales en ${input.province}:
- Gasolina 95: ${input.avgG95?.toFixed(3) ?? 'N/A'}€ (cambio: ${g95Delta})
- Gasoil A: ${input.avgDiesel?.toFixed(3) ?? 'N/A'}€ (cambio: ${dieselDelta})
${favLines ? `\nGasolineras favoritas:\n${favLines}` : ''}

Genera un mensaje de Telegram breve (máx 3 párrafos) en español con:
1. Resumen del cambio de precio (usa emojis 🟢⬇️ o 🔴⬆️ según corresponda)
2. Situación de las favoritas (si las hay)
3. Un consejo práctico (¿merece la pena llenar ahora o esperar?)

Sé directo y útil. No incluyas saludos ni despedidas formales.`;
}

export async function generateInsight(input: InsightInput): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: buildInsightPrompt(input) }],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}
