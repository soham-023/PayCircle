import React, { useState, useEffect } from 'react';
import { PieChart, Plus, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { budgetAPI, groupAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [groupId, setGroupId] = useState('');
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [alertThresholdPercent, setAlertThresholdPercent] = useState(80);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, gRes] = await Promise.all([
        budgetAPI.getUserBudgets(),
        groupAPI.getGroups(),
      ]);
      setBudgets(bRes.data || []);
      setGroups(gRes.data || []);
      if (gRes.data?.length > 0 && !groupId) {
        setGroupId(gRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    const limit = parseFloat(limitAmount);
    if (!limit || limit <= 0) {
      setError('Please enter a valid limit amount');
      return;
    }

    try {
      await budgetAPI.createBudget({
        groupId: groupId ? parseInt(groupId, 10) : null,
        category: category || null,
        limitAmount: limit,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        alertThresholdPercent: parseInt(alertThresholdPercent, 10),
      });

      setShowAddModal(false);
      setLimitAmount('');
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Monthly Spending Budgets</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Set and track spending thresholds to prevent overspending in groups & personal categories
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Set New Budget
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-600 text-xs">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <PieChart className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">No active budgets</h3>
          <p className="text-xs text-slate-600">Set a budget limit to monitor group or category spending.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {b.category ? b.category.replace('_', ' ') : b.groupName || 'Overall Budget'}
                  </h3>
                  <p className="text-[11px] text-slate-600">Month: {b.month}/{b.year}</p>
                </div>

                {b.isExceeded ? (
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Exceeded!
                  </span>
                ) : b.isWarning ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Warning
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Safe
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Spent: <strong className="text-slate-900">{formatCurrency(b.spentAmount)}</strong></span>
                  <span>Limit: <strong className="text-slate-900">{formatCurrency(b.limitAmount)}</strong></span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isExceeded ? 'bg-rose-500' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentageUsed || 0)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 font-medium">
                  <span>{b.percentageUsed}% used</span>
                  <span>
                    Remaining: <strong className={b.remainingAmount < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {formatCurrency(b.remainingAmount)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Set Monthly Budget</h3>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Group (Optional)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="">Personal Budget (Across all groups)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Budget Limit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="5000.00"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
