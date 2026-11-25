import { useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table2, LineChart } from 'lucide-react';
import type { Point } from '../lib/types';
import { Card } from './ui';

// Single-series trend in Safety Orange (brand graphics colour; dataviz validator: all checks pass on white).
// Grid = Line, axis labels = Steel (handzi-brand tokens).
const LINE = '#EA580C';
const GRID = '#E2DED6';
const AXIS = '#5B6068';

const shortDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

type Props = { title: string; points: Point[]; format: (n: number) => string; total: string; fetching?: boolean };

function ChartTooltip({ active, payload, format }: { active?: boolean; payload?: { payload: Point }[]; format: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-hz-line bg-white px-3 py-2 shadow-card">
      <p className="font-display text-body text-hz-charcoal">{format(p.value)}</p>
      <p className="text-xs text-hz-steel">{shortDate(p.date)}</p>
    </div>
  );
}

/** Area trend with a crosshair tooltip and a table view (for screen readers and exact values). */
export function TrendChart({ title, points, format, total, fetching }: Props) {
  const [table, setTable] = useState(false);
  const gradient = useId();
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-small font-medium text-hz-steel">{title}</h2>
          <p className="mt-1 font-display text-h2 text-hz-charcoal">{total}</p>
        </div>
        <button
          onClick={() => setTable((t) => !t)}
          className="rounded-md p-2 text-hz-steel transition-colors hover:bg-hz-chalk hover:text-hz-charcoal"
          aria-label={table ? `Show ${title} as a chart` : `Show ${title} as a table`}
          title={table ? 'Chart view' : 'Table view'}
        >
          {table ? <LineChart className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
        </button>
      </div>
      <div className={`transition-opacity duration-200 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
        {table ? (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{title} by day</caption>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-hz-steel">
                  <th className="py-1.5 font-semibold">Day</th>
                  <th className="py-1.5 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.date} className="border-t border-hz-line">
                    <td className="py-1.5 text-hz-steel">{shortDate(p.date)}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{format(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-56" role="img" aria-label={`${title}: ${total}. Use the table view for daily values.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LINE} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                <YAxis tickFormatter={(v) => format(v)} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={64} allowDecimals={false} />
                <Tooltip content={<ChartTooltip format={format} />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke={LINE} strokeWidth={2} fill={`url(#${gradient})`} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
