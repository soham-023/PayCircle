import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Trash2, Calendar, User, Tag } from 'lucide-react';
import { expenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getCategoryBadge } from '../utils/formatters';

export default function Expenses({ onOpenAddExpense }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseAPI.getUserExpenses();
      setExpenses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete expense "${title}"?`)) return;
    try {
      await expenseAPI.deleteExpense(id);
      loadExpenses();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not delete expense');
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.groupName && e.groupName.toLowerCase().includes(search.toLowerCase())) ||
      (e.paidBy?.name && e.paidBy.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Expenses History</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            All shared bills, splits, and purchases across your groups
          </p>
        </div>
        <button
          onClick={() => onOpenAddExpense()}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search by title, group, or person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="FOOD_AND_DRINK">Food & Drink</option>
          <option value="HOUSING_AND_RENT">Housing & Rent</option>
          <option value="TRANSPORTATION">Transportation</option>
          <option value="ENTERTAINMENT">Entertainment</option>
          <option value="UTILITIES">Utilities</option>
          <option value="GROCERIES">Groceries</option>
          <option value="TRAVEL">Travel</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Expenses Feed */}
      {loading ? (
        <div className="py-16 text-center text-slate-600 text-xs">Loading expenses...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">No expenses found</h3>
          <p className="text-xs text-slate-600">Add an expense to start tracking splits.</p>
          <button
            onClick={() => onOpenAddExpense()}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            Add First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => {
            const badge = getCategoryBadge(exp.category);
            const isPayer = exp.paidBy?.id === user?.id;

            return (
              <div
                key={exp.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                      {badge.label}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{exp.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{formatCurrency(exp.amount)}</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {exp.splitType} Split
                      </span>
                    </div>

                    {isPayer && (
                      <button
                        onClick={() => handleDelete(exp.id, exp.title)}
                        className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    Paid by <strong className="text-slate-800">{isPayer ? 'You' : exp.paidBy?.name}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    {formatDate(exp.expenseDate)}
                  </span>
                  {exp.groupName && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                      {exp.groupName}
                    </span>
                  )}
                </div>

                {/* Split Participants */}
                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Split Details ({exp.splits?.length || 0} participants):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.splits?.map((s) => (
                      <span
                        key={s.id}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                          s.user?.id === user?.id
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {s.user?.id === user?.id ? 'Your share' : s.user?.name}:{' '}
                        <strong>{formatCurrency(s.amount)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
