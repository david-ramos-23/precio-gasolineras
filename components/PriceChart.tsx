// components/PriceChart.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  price: number;
  capturedAt: string;
}

interface Props {
  data: DataPoint[];
  fuel: 'g95' | 'diesel';
}

export default function PriceChart({ data, fuel }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin datos históricos aún.</p>;
  }

  const formatted = data.map(d => ({
    price: d.price,
    date: new Date(d.capturedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
  }));

  const color = fuel === 'g95' ? '#22c55e' : '#f59e0b';

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          domain={['dataMin - 0.01', 'dataMax + 0.01']}
          tickFormatter={v => v.toFixed(3)}
        />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 6, fontSize: 12 }}
          formatter={(v) => [`${Number(v).toFixed(3)}€`, fuel === 'g95' ? 'G95' : 'Diesel']}
        />
        <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
