import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Factory, BarChart3, Table2 } from 'lucide-react';

const DATASET_COLUMNS = ['Plant', 'Month_Year', 'Total_Qty_KG', 'Total_Amount_INR', 'Records'];

const formatInr = (value) =>
  `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatKg = (value) =>
  `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })} KG`;

const buildForecastSeries = (plant) => {
  const historical = plant.labels.map((label, index) => ({
    name: label,
    Actual: plant.historical_qty[index],
    Forecast: null,
  }));
  const forecast = plant.forecast_labels.map((label, index) => ({
    name: label,
    Actual: null,
    Forecast: plant.forecast_qty[index],
  }));
  return [...historical, ...forecast];
};

const PlantStats = ({ code, plant }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <Factory className={`w-5 h-5 ${code === 'M001' ? 'text-blue-600' : 'text-orange-500'}`} />
      <h3 className="text-lg font-semibold text-gray-800">
        {code} — {plant.name}
      </h3>
      <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
        ARIMA {plant.arima_order}
      </span>
    </div>
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <StatItem label="Total months" value={plant.statistics.total_months} />
      <StatItem label="Total qty (KG)" value={formatKg(plant.statistics.total_qty_kg)} />
      <StatItem label="Total amount" value={formatInr(plant.statistics.total_amount_inr)} />
      <StatItem label="Avg monthly qty" value={formatKg(plant.statistics.avg_monthly_qty_kg)} />
      <StatItem label="Max monthly qty" value={formatKg(plant.statistics.max_monthly_qty_kg)} />
      <StatItem label="Min monthly qty" value={formatKg(plant.statistics.min_monthly_qty_kg)} />
      <StatItem label="Avg price / KG" value={formatInr(plant.avg_price_per_kg)} />
      <StatItem label="6-mo budget" value={formatInr(plant.total_budget)} highlight />
    </dl>
  </div>
);

const StatItem = ({ label, value, highlight }) => (
  <div>
    <dt className="text-gray-500">{label}</dt>
    <dd className={`font-semibold mt-0.5 ${highlight ? 'text-nlcBlue' : 'text-gray-800'}`}>{value}</dd>
  </div>
);

const MonthlyBarChart = ({ plant, color, dataKey, values, title, formatValue }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={plant.labels.map((name, index) => ({
            name,
            [dataKey]: values[index],
          }))}
          margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            angle={-40}
            textAnchor="end"
            height={70}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <RechartsTooltip
            formatter={(value) => formatValue(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DatasetTable = ({ rows, filterPlant, onFilterChange }) => {
  const filtered =
    filterPlant === 'ALL' ? rows : rows.filter((r) => r.Plant === filterPlant);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-nlcBlue" />
          NLC monthly dataset
        </h3>
        <div className="flex gap-2">
          {['ALL', 'M001', 'M002'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onFilterChange(code)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterPlant === code
                  ? 'bg-nlcBlue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {code === 'ALL' ? 'All plants' : code}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm text-left min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wide">
            {DATASET_COLUMNS.map((col) => (
              <th key={col} className="py-3 pr-4">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, idx) => (
            <tr
              key={`${row.Plant}-${row.Month_Year}-${idx}`}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              {DATASET_COLUMNS.map((col) => (
                <td key={col} className="py-2.5 pr-4 text-gray-800">
                  {col === 'Total_Amount_INR'
                    ? formatInr(row[col])
                    : col === 'Total_Qty_KG'
                      ? row[col].toLocaleString('en-IN')
                      : row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">{filtered.length} row(s) shown</p>
    </div>
  );
};

const ArimaChart = ({ plant, strokeActual, strokeForecast, title }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={buildForecastSeries(plant)} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <RechartsTooltip
            formatter={(value) => (value != null ? formatKg(value) : '—')}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          <Line
            type="monotone"
            dataKey="Actual"
            stroke={strokeActual}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="Forecast"
            stroke={strokeForecast}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const Dashboard = ({ data }) => {
  const [tableFilter, setTableFilter] = useState('ALL');

  if (!data?.plants) return null;

  const { plants, monthly_results, summary, dataset_table = [] } = data;
  const m001 = plants.M001;
  const m002 = plants.M002;
  const dataSource = summary.data_source;

  const combinedBudgetChart = monthly_results.map((row) => ({
    name: row.month,
    M001: row.m001_budget_inr,
    M002: row.m002_budget_inr,
    Combined: row.combined_budget_inr,
  }));

  return (
    <div className="w-full flex flex-col gap-6">
      {dataSource?.format === 'pdf' && (
        <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-lg px-4 py-3">
          {dataSource.message ||
            (dataSource.parse_mode === 'movement_log'
              ? `PDF parsed: ${dataSource.transactions_parsed} movements → ${dataSource.monthly_rows} monthly records.`
              : `PDF summary table loaded (${dataSource.rows} rows).`)}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Grand total budget"
          value={formatInr(summary.grand_total_budget)}
          icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
          subtitle={`${summary.forecast_horizon_months}-month forecast`}
        />
        <SummaryCard
          title="M001 budget (Mine I)"
          value={formatInr(summary.m001_total_budget)}
          icon={<Factory className="w-6 h-6 text-blue-500" />}
        />
        <SummaryCard
          title="M002 budget (Mine II)"
          value={formatInr(summary.m002_total_budget)}
          icon={<Factory className="w-6 h-6 text-orange-500" />}
        />
        <SummaryCard
          title="Forecast model"
          value="ARIMA"
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
          subtitle={`M001 ${m001.arima_order} · M002 ${m002.arima_order}`}
        />
      </div>

      {dataset_table.length > 0 && (
        <DatasetTable
          rows={dataset_table}
          filterPlant={tableFilter}
          onFilterChange={setTableFilter}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlantStats code="M001" plant={m001} />
        <PlantStats code="M002" plant={m002} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyBarChart
          plant={m001}
          color="#4682B4"
          dataKey="Total_Qty_KG"
          values={m001.historical_qty}
          title="M001 — Total_Qty_KG by Month_Year"
          formatValue={formatKg}
        />
        <MonthlyBarChart
          plant={m002}
          color="#F97316"
          dataKey="Total_Qty_KG"
          values={m002.historical_qty}
          title="M002 — Total_Qty_KG by Month_Year"
          formatValue={formatKg}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyBarChart
          plant={m001}
          color="#1D4ED8"
          dataKey="Total_Amount_INR"
          values={m001.historical_amount}
          title="M001 — Total_Amount_INR by Month_Year"
          formatValue={formatInr}
        />
        <MonthlyBarChart
          plant={m002}
          color="#C2410C"
          dataKey="Total_Amount_INR"
          values={m002.historical_amount}
          title="M002 — Total_Amount_INR by Month_Year"
          formatValue={formatInr}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArimaChart
          plant={m001}
          strokeActual="#2563EB"
          strokeForecast="#DC2626"
          title="M001 — ARIMA demand forecast"
        />
        <ArimaChart
          plant={m002}
          strokeActual="#EA580C"
          strokeForecast="#16A34A"
          title="M002 — ARIMA demand forecast"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-nlcGold" />
          6-month budget forecast (combined)
        </h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedBudgetChart} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <RechartsTooltip formatter={(value) => formatInr(value)} />
              <Legend />
              <Bar dataKey="M001" stackId="budget" fill="#4682B4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="M002" stackId="budget" fill="#F97316" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Combined" stroke="#0F4C81" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Final results (next 6 months)</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wide">
              <th className="py-3 pr-4">Month</th>
              <th className="py-3 pr-4">M001 forecast (KG)</th>
              <th className="py-3 pr-4">M001 budget (INR)</th>
              <th className="py-3 pr-4">M002 forecast (KG)</th>
              <th className="py-3 pr-4">M002 budget (INR)</th>
              <th className="py-3">Combined budget (INR)</th>
            </tr>
          </thead>
          <tbody>
            {monthly_results.map((row) => (
              <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-800">{row.month}</td>
                <td className="py-3 pr-4">{row.m001_forecast_kg.toLocaleString('en-IN')}</td>
                <td className="py-3 pr-4">{formatInr(row.m001_budget_inr)}</td>
                <td className="py-3 pr-4">{row.m002_forecast_kg.toLocaleString('en-IN')}</td>
                <td className="py-3 pr-4">{formatInr(row.m002_budget_inr)}</td>
                <td className="py-3 font-semibold text-nlcBlue">{formatInr(row.combined_budget_inr)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-gray-800">
              <td className="py-3 pr-4">Total</td>
              <td className="py-3 pr-4">—</td>
              <td className="py-3 pr-4">{formatInr(summary.m001_total_budget)}</td>
              <td className="py-3 pr-4">—</td>
              <td className="py-3 pr-4">{formatInr(summary.m002_total_budget)}</td>
              <td className="py-3">{formatInr(summary.grand_total_budget)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800 mt-1">{value}</h4>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default Dashboard;
