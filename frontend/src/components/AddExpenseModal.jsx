import React, { useState, useEffect } from 'react';
import { X, Receipt, Check, AlertCircle, Users } from 'lucide-react';
import { expenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const CATEGORIES = [
  { id: 'FOOD_AND_DRINK', label: 'Food & Drink', icon: '🍔' },
  { id: 'HOUSING_AND_RENT', label: 'Rent & Housing', icon: '🏠' },
  { id: 'TRANSPORTATION', label: 'Transportation', icon: '🚗' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
  { id: 'UTILITIES', label: 'Utilities & Bills', icon: '💡' },
  { id: 'SHOPPING', label: 'Shopping', icon: '🛍️' },
  { id: 'TRAVEL', label: 'Travel & Trips', icon: '✈️' },
  { id: 'GROCERIES', label: 'Groceries', icon: '🛒' },
  { id: 'HEALTH', label: 'Health & Medical', icon: '💊' },
  { id: 'OTHER', label: 'General / Other', icon: '📝' },
];

export default function AddExpenseModal({ isOpen, onClose, groups, defaultGroupId, onExpenseAdded }) {
  const { user } = useAuth();

  const [groupId, setGroupId] = useState(defaultGroupId || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD_AND_DRINK');
  const [splitType, setSplitType] = useState('EQUAL');
  const [paidById, setPaidById] = useState(user?.id || '');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Selected members for split
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberSplits, setMemberSplits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultGroupId) {
      setGroupId(defaultGroupId);
    } else if (groups && groups.length > 0 && !groupId) {
      setGroupId(groups[0].id);
    }
  }, [defaultGroupId, groups]);

  useEffect(() => {
    if (groups && groupId) {
      const g = groups.find((grp) => String(grp.id) === String(groupId));
      setSelectedGroup(g);
      if (g && g.members) {
        // Initialize splits for all group members
        setMemberSplits(
          g.members.map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            phone: m.user.phone,
            included: true,
            exactAmount: '',
            percentage: '',
            shares: 1,
          }))
        );
      }
    }
  }, [groupId, groups]);

  if (!isOpen) return null;

  const totalNum = parseFloat(amount) || 0;
  const includedCount = memberSplits.filter((m) => m.included).length;

  const handleToggleMember = (userId) => {
    setMemberSplits((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, included: !m.included } : m))
    );
  };

  const handleSplitValueChange = (userId, field, val) => {
    setMemberSplits((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, [field]: val } : m))
    );
  };

  // Validation helper
  const getValidationInfo = () => {
    if (totalNum <= 0) return { valid: false, message: 'Please enter a valid amount' };
    if (includedCount === 0) return { valid: false, message: 'Select at least one member' };

    if (splitType === 'EXACT') {
      const sumExact = memberSplits
        .filter((m) => m.included)
        .reduce((sum, m) => sum + (parseFloat(m.exactAmount) || 0), 0);
      const diff = Math.abs(sumExact - totalNum);
      if (diff > 0.05) {
        return {
          valid: false,
          message: `Sum of exact splits (${formatCurrency(sumExact)}) must equal total (${formatCurrency(totalNum)})`,
        };
      }
    } else if (splitType === 'PERCENTAGE') {
      const sumPct = memberSplits
        .filter((m) => m.included)
        .reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.1) {
        return {
          valid: false,
          message: `Total percentage must equal 100% (currently ${sumPct}%)`,
        };
      }
    }

    return { valid: true };
  };

  const validation = getValidationInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const splitsPayload = memberSplits
        .filter((m) => m.included)
        .map((m) => {
          const item = { userId: m.userId };
          if (splitType === 'EXACT') item.amount = parseFloat(m.exactAmount) || 0;
          if (splitType === 'PERCENTAGE') item.percentage = parseFloat(m.percentage) || 0;
          if (splitType === 'SHARES') item.shares = parseInt(m.shares, 10) || 1;
          return item;
        });

      await expenseAPI.createExpense({
        groupId: groupId ? parseInt(groupId, 10) : null,
        title: title.trim(),
        description: description.trim(),
        amount: totalNum,
        category,
        splitType,
        paidById: paidById ? parseInt(paidById, 10) : user?.id,
        expenseDate,
        splits: splitsPayload,
      });

      if (onExpenseAdded) onExpenseAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Add New Expense</h3>
              <p className="text-emerald-100 text-xs">Split bills equally, by exact amount, %, or shares</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group and Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                required
              >
                {groups && groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Title
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner, Villa, Groceries"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Amount, Category, Paid By, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Paid By
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {selectedGroup?.members?.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} {m.user.id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Split Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Split Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'EQUAL', label: '= Equal' },
                { id: 'EXACT', label: '₹ Exact' },
                { id: 'PERCENTAGE', label: '% Percent' },
                { id: 'SHARES', label: '÷ Shares' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSplitType(st.id)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    splitType === st.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Details Table */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
              <span>Split Participants ({includedCount})</span>
              <span>
                {splitType === 'EQUAL' && includedCount > 0 && totalNum > 0 && (
                  <span className="text-emerald-700">
                    Each owes: {formatCurrency(totalNum / includedCount)}
                  </span>
                )}
                {splitType === 'EXACT' && (
                  <span className={validation.valid ? 'text-emerald-700' : 'text-rose-600'}>
                    Sum: {formatCurrency(memberSplits.filter(m => m.included).reduce((s, m) => s + (parseFloat(m.exactAmount) || 0), 0))} / {formatCurrency(totalNum)}
                  </span>
                )}
                {splitType === 'PERCENTAGE' && (
                  <span className={validation.valid ? 'text-emerald-700' : 'text-rose-600'}>
                    Total: {memberSplits.filter(m => m.included).reduce((s, m) => s + (parseFloat(m.percentage) || 0), 0)}% / 100%
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {memberSplits.map((m) => (
                <div
                  key={m.userId}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    m.included ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200/60 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.included}
                      onChange={() => handleToggleMember(m.userId)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      {m.name} {m.userId === user?.id ? '(You)' : ''}
                    </span>
                  </label>

                  {m.included && (
                    <div className="w-36">
                      {splitType === 'EQUAL' && (
                        <span className="text-xs font-bold text-slate-700 text-right block">
                          {formatCurrency(totalNum > 0 && includedCount > 0 ? totalNum / includedCount : 0)}
                        </span>
                      )}
                      {splitType === 'EXACT' && (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-600">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={m.exactAmount}
                            onChange={(e) => handleSplitValueChange(m.userId, 'exactAmount', e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                      {splitType === 'PERCENTAGE' && (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={m.percentage}
                            onChange={(e) => handleSplitValueChange(m.userId, 'percentage', e.target.value)}
                            className="w-full pr-6 pl-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-600">%</span>
                        </div>
                      )}
                      {splitType === 'SHARES' && (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="1"
                            value={m.shares}
                            onChange={(e) => handleSplitValueChange(m.userId, 'shares', e.target.value)}
                            className="w-16 px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-center focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] text-slate-600">share(s)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !validation.valid}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition disabled:opacity-50"
            >
              {loading ? 'Adding Expense...' : 'Save & Split Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
