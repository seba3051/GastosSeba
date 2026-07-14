import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import { api } from '../api/client.js';
import { money, MONTH_NAMES, firstOfMonthISO, todayISO } from '../lib/format.js';
import { seriesColor, INCOME_COLOR, EXPENSE_COLOR, BALANCE_COLOR, chartTheme } from '../lib/colors.js';
import { Card, Select, Input, Button, Spinner, Empty } from '../components/ui.jsx';

const TABS = [
  ['category', 'Por categoría'],
  ['monthly', 'Evolución mensual'],
  ['compare', 'Comparativa'],
];

export default function Reports() {
  const [tab, setTab] = useState('category');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Reportes</h1>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-900 p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-slate-700 text-brand-300 shadow-sm' : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'category' && <ByCategory />}
      {tab === 'monthly' && <Monthly />}
      {tab === 'compare' && <Compare />}
    </div>
  );
}

/* ---------- Por categoría ---------- */
function ByCategory() {
  const [type, setType] = useState('expense');
  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.byCategory({ type, from, to }).then(setData).finally(() => setLoading(false));
  }, [type, from, to]);

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="space-y-4">
      <RangeBar from={from} to={to} setFrom={setFrom} setTo={setTo}>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </Select>
      </RangeBar>

      <Card title={`${type === 'expense' ? 'Gastos' : 'Ingresos'} — total ${money(total)}`}>
        {loading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <Empty>Sin datos en este rango.</Empty>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <ResponsiveContainer width="100%" height={260} className="lg:!w-1/2">
              <PieChart>
                <Pie data={data} dataKey="total" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color || seriesColor(i)} stroke={chartTheme.surface} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} {...chartTheme.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full overflow-x-auto lg:w-1/2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                    <th className="py-2">Categoría</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={d.category_id ?? i} className="border-b border-slate-800 text-slate-200">
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: d.color || seriesColor(i) }} />
                          {d.name}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{money(d.total)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-400">{d.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Evolución mensual ---------- */
function Monthly() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .monthly(year)
      .then((r) => setMonths(r.months.map((m) => ({ ...m, label: MONTH_NAMES[Number(m.month) - 1] }))))
      .finally(() => setLoading(false));
  }, [year]);

  const totals = months.reduce(
    (a, m) => ({ income: a.income + m.income, expense: a.expense + m.expense }),
    { income: 0, expense: 0 }
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Año</span>
          <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-32">
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title={`Ingresos vs gastos ${year} — balance ${money(totals.income - totals.expense)}`}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={months} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={55} />
                <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(148,163,184,0.1)' }} {...chartTheme.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Ingresos" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={months} margin={{ left: -10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={55} />
                <Tooltip formatter={(v) => money(v)} {...chartTheme.tooltip} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke={BALANCE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------- Comparativa de periodos ---------- */
function Compare() {
  const [type, setType] = useState('expense');
  const [a, setA] = useState({ from: '', to: '' });
  const [b, setB] = useState({ from: firstOfMonthISO(), to: todayISO() });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Periodo A por defecto: mes anterior.
  useEffect(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(
      last.getDate()
    ).padStart(2, '0')}`;
    setA({ from, to });
  }, []);

  useEffect(() => {
    if (!a.from || !b.from) return;
    setLoading(true);
    api
      .compare({ type, aFrom: a.from, aTo: a.to, bFrom: b.from, bTo: b.to })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [type, a, b]);

  return (
    <div className="space-y-4">
      <Card title="Periodos a comparar">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Periodo A</p>
            <div className="flex gap-2">
              <Input type="date" value={a.from} onChange={(e) => setA({ ...a, from: e.target.value })} />
              <Input type="date" value={a.to} onChange={(e) => setA({ ...a, to: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Periodo B</p>
            <div className="flex gap-2">
              <Input type="date" value={b.from} onChange={(e) => setB({ ...b, from: e.target.value })} />
              <Input type="date" value={b.to} onChange={(e) => setB({ ...b, to: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40">
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </Select>
        </div>
      </Card>

      {loading || !result ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Periodo A" value={result.totalA} />
            <MiniStat label="Periodo B" value={result.totalB} />
            <MiniStat label="Diferencia" value={result.diff} delta />
          </div>

          <Card title="Por categoría">
            {result.categories.length === 0 ? (
              <Empty>Sin datos.</Empty>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={result.categories} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} width={55} />
                    <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(148,163,184,0.1)' }} {...chartTheme.tooltip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="periodA" name="Periodo A" fill={seriesColor(0)} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="periodB" name="Periodo B" fill={seriesColor(1)} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                        <th className="py-2">Categoría</th>
                        <th className="py-2 text-right">A</th>
                        <th className="py-2 text-right">B</th>
                        <th className="py-2 text-right">Cambio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.categories.map((c) => (
                        <tr key={c.name} className="border-b border-slate-800 text-slate-200">
                          <td className="py-2">{c.name}</td>
                          <td className="py-2 text-right tabular-nums">{money(c.periodA)}</td>
                          <td className="py-2 text-right tabular-nums">{money(c.periodB)}</td>
                          <td
                            className={`py-2 text-right tabular-nums ${
                              c.diff > 0 ? 'text-red-400' : c.diff < 0 ? 'text-green-400' : 'text-slate-400'
                            }`}
                          >
                            {c.diff > 0 ? '+' : ''}
                            {money(c.diff)} ({c.pctChange > 0 ? '+' : ''}
                            {c.pctChange}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- Auxiliares ---------- */
function RangeBar({ from, to, setFrom, setTo, children }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Desde</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Hasta</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
        {children}
      </div>
    </Card>
  );
}

function MiniStat({ label, value, delta }) {
  const tone = delta
    ? value > 0
      ? 'text-red-400'
      : value < 0
        ? 'text-green-400'
        : 'text-slate-400'
    : 'text-slate-100';
  return (
    <div className="rounded-xl bg-slate-800 p-4 text-center shadow-sm ring-1 ring-slate-700">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tone}`}>
        {delta && value > 0 ? '+' : ''}
        {money(value)}
      </p>
    </div>
  );
}
