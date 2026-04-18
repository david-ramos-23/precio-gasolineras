'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Snapshot { price: number; capturedAt: string }
interface Props { data: Snapshot[]; fuel: string }

export default function PriceChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-24 flex items-center justify-center text-slate-600 text-xs">Sin historial disponible</div>
  );

  const chartData = data.map(s => ({
    date: new Date(s.capturedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    price: s.price,
  }));

  const prices = data.map(s => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.15 || 0.05;

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          domain={[min - pad, max + pad]}
          tick={{ fontSize: 9, fill: '#475569', fontFamily: 'var(--font-fira-code)' }}
          tickLine={false} axisLine={false}
          tickFormatter={v => v.toFixed(2)}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px', fontFamily: 'var(--font-fira-code)' }}
          labelStyle={{ color: '#64748b', marginBottom: '2px' }}
          itemStyle={{ color: '#22c55e' }}
          formatter={(v) => [`${Number(v).toFixed(3)}€`, '']}
        />
        <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
