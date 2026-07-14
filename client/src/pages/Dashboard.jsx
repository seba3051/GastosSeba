import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../api/client.js';
import { money, firstOfMonthISO, todayISO, monthKey, MONTH_NAMES } from '../lib/format.js';
import { seriesColor, INCOME_COLOR, EXPENSE_COLOR, chartTheme } from '../lib/colors.js';
import { Card, Spinner, Empty } from '../components/ui.jsx';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [byCat, setByCat] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const from = firstOfMonthISO();
    const to = todayISO();
    const year = String(new Date().getFullYear());
    Promise.all([
      api.summary({ from, to }),
      api.byCategory({ type: 'expense', from, to }),
      api.monthly(year),
      api.budgets(monthKey()),
    ])
      .then(([s, c, m, b]) => {
        setSummary(s);
        setByCat(c);
        setMonthly(m.months.map((x) => ({ ...x, label: MONTH_NAMES[Number(x.month) - 1] })));
        setBudgets(b.filter((x) => x.budget != null));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Panel — {monthTitle()}</h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Ingresos" value={summary.income} tone="income" />
        <StatTile label="Gastos" value={summary.expense} tone="expense" />
        <StatTile label="Balance" value={summary.balance} tone="balance" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut gastos por categoría */}
        <Card title="Gastos por categoría (este mes)">
          {byCat.length === 0 ? (
            <Empty>Sin gastos este mes.</Empty>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byCat}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {byCat.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color || seriesColor(i)}
                        stroke={chartTheme.surface}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} {...chartTheme.tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="w-full space-y-1 text-sm">
                {byCat.slice(0, 6).map((c, i) => (
                  <li key={c.category_id ?? i} className="flex items-center justify-between gap-2 text-slate-200">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ background: c.color || seriesColor(i) }}
                      />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-slate-400">
                      {money(c.total)} · {c.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Evolución mensual */}
        <Card title={`Evolución mensual ${new Date().getFullYear()}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={50} />
              <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(148,163,184,0.1)' }} {...chartTheme.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Ingresos" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Presupuestos */}
      <Card title="Presupuestos del mes">
        {budgets.length === 0 ? (
          <Empty>Definí presupuestos en la sección Categorías.</Empty>
        ) : (
          <ul className="space-y-3">
            {budgets.map((b) => {
              const pct = Math.min(b.percent ?? 0, 100);
              const over = (b.percent ?? 0) > 100;
              return (
                <li key={b.category_id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{b.name}</span>
                    <span className="tabular-nums text-slate-400">
                      {money(b.spent)} / {money(b.budget)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: over ? '#d03b3b' : b.color || '#2a78d6',
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const tones = {
    income: 'text-green-400',
    expense: 'text-red-400',
    balance: value >= 0 ? 'text-brand-400' : 'text-red-400',
  };
  return (
    <div className="rounded-xl bg-slate-800 p-4 shadow-sm ring-1 ring-slate-700">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tones[tone]}`}>{money(value)}</p>
    </div>
  );
}

function monthTitle() {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
