import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { formatCurrency, getCategoryBadge } from '../utils/formatters';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getPersonalAnalytics()
      .then((res) => setData(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-16 text-center text-slate-600 text-xs">Loading analytics...</div>
    );
  }

  const categoryEntries = Object.entries(data.categorySpending || {});
  const totalCategorySpending = categoryEntries.reduce((sum, [, val]) => sum + val, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Spending Analytics</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Visual insights into your shared expenses and spending categories
        </p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Amount You Paid</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(data.totalPaid)}</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Across all purchases and bills</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Actual Share</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(data.totalShare)}</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Your personal consumption</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Net Position</p>
          <p className={`text-2xl font-black mt-1 ${data.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {data.netBalance >= 0 ? '+' : ''}{formatCurrency(data.netBalance)}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {data.netBalance >= 0 ? 'You are owed overall' : 'You owe overall'}
          </p>
        </div>
      </div>

      {/* Category Spending Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">Spending by Category</h3>
        </div>

        {categoryEntries.length === 0 ? (
          <p className="py-8 text-center text-slate-600 text-xs">No category expenses yet.</p>
        ) : (
          <div className="space-y-4">
            {categoryEntries.map(([cat, amount]) => {
              const badge = getCategoryBadge(cat);
              const percentage = totalCategorySpending > 0
                ? ((amount / totalCategorySpending) * 100).toFixed(1)
                : 0;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">{percentage}%</span>
                      <span className="font-black text-slate-900">{formatCurrency(amount)}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Spending Trend */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">Monthly Spending Trend</h3>
        </div>

        {Object.keys(data.monthlyTrend || {}).length === 0 ? (
          <p className="py-6 text-center text-slate-600 text-xs">No monthly data available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data.monthlyTrend).map(([month, amt]) => (
              <div key={month} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                <p className="text-xs font-semibold text-slate-600">{month}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(amt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
