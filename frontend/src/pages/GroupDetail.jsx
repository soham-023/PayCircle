import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Receipt,
  Scale,
  PieChart,
  Repeat,
  History,
  UserPlus,
  Plus,
  QrCode,
  Sparkles,
  AlertTriangle,
  Play
} from 'lucide-react';
import { groupAPI, expenseAPI, settlementAPI, budgetAPI, recurringAPI, activityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getCategoryBadge, getGroupCategoryIcon } from '../utils/formatters';
import QRModal from '../components/QRModal';
import RecordSettlementModal from '../components/RecordSettlementModal';
import AddMemberModal from '../components/AddMemberModal';

export default function GroupDetail({ groupId, onBack, onOpenAddExpense }) {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('balances');
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDetails, setQrDetails] = useState(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const [gRes, expRes, balRes, budRes, recRes, actRes] = await Promise.all([
        groupAPI.getGroupById(groupId),
        expenseAPI.getGroupExpenses(groupId),
        settlementAPI.getGroupBalances(groupId),
        budgetAPI.getGroupBudgets(groupId),
        recurringAPI.getGroupRecurring(groupId),
        activityAPI.getGroupActivity(groupId),
      ]);
      setGroup(gRes.data);
      setExpenses(expRes.data || []);
      setBalanceData(balRes.data);
      setBudgets(budRes.data || []);
      setRecurring(recRes.data || []);
      setActivities(actRes.data || []);
    } catch (e) {
      console.error('Error fetching group details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) loadGroupDetails();
  }, [groupId]);

  const handlePaySuggestion = (suggestion) => {
    setQrDetails({
      payeeUpiId: suggestion.toUser.upiId || 'payee@upi',
      payeeName: suggestion.toUser.name,
      amount: suggestion.amount,
      transactionNote: `${group?.name} settlement to ${suggestion.toUser.name}`,
      upiUri: suggestion.upiDeepLink,
    });
    setQrModalOpen(true);
  };

  const handleToggleRecurring = async (recId) => {
    try {
      await recurringAPI.toggleStatus(recId);
      loadGroupDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerRecurring = async (recId) => {
    try {
      await recurringAPI.triggerExpense(recId);
      loadGroupDetails();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !group) {
    return (
      <div className="py-16 text-center text-slate-600 text-sm">
        Loading group workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </button>

      {/* Group Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-3xl flex items-center justify-center border border-emerald-100 shadow-inner shrink-0">
            {getGroupCategoryIcon(group.category)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{group.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {group.category}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {group.description || 'Shared expense circle'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
              <span>{group.members?.length || 0} Members</span>
              <span>•</span>
              <span>Total Spending: <strong className="text-slate-900 font-bold">{formatCurrency(group.totalExpenses)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
          <button
            onClick={() => setSettlementModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 shadow-sm transition flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4" /> Settle Up
          </button>
          <button
            onClick={() => onOpenAddExpense(group.id)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'balances', label: 'Balances & Simplification', icon: Scale },
          { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
          { id: 'budgets', label: `Budgets (${budgets.length})`, icon: PieChart },
          { id: 'recurring', label: `Subscriptions (${recurring.length})`, icon: Repeat },
          { id: 'activity', label: 'Activity Log', icon: History },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Balances & Min-Cash-Flow Simplification */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Min Cash Flow Suggestions */}
          {balanceData?.suggestedSettlements && balanceData.suggestedSettlements.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/40 p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Optimal Debt Simplification Suggestions
                  </h3>
                  <p className="text-xs text-slate-600">
                    Min-Cash-Flow algorithm simplified all member debts into just {balanceData.suggestedSettlements.length} direct transfers!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {balanceData.suggestedSettlements.map((s, idx) => {
                  const isDebtor = s.fromUser.id === user?.id;
                  const isCreditor = s.toUser.id === user?.id;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs text-slate-800 font-semibold">
                          <span className="font-bold text-slate-900">{isDebtor ? 'You' : s.fromUser.name}</span>
                          {' '}owes{' '}
                          <span className="font-bold text-slate-900">{isCreditor ? 'You' : s.toUser.name}</span>
                        </p>
                        <p className="text-lg font-black text-emerald-800 mt-1">
                          {formatCurrency(s.amount)}
                        </p>
                      </div>

                      {isDebtor ? (
                        <button
                          onClick={() => handlePaySuggestion(s)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1 shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pay UPI
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0">
                          To receive
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member Balance Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Individual Member Balances</h3>
            <div className="divide-y divide-slate-100">
              {balanceData?.balances?.map((b) => {
                const isZero = Math.abs(b.netBalance) < 0.01;
                const isPos = b.netBalance > 0;

                return (
                  <div key={b.user.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center">
                        {b.user.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {b.user.name} {b.user.id === user?.id ? '(You)' : ''}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Paid: {formatCurrency(b.totalPaid)} • Share: {formatCurrency(b.totalShare)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-black ${isZero ? 'text-slate-600' : isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isZero ? 'Settled' : `${isPos ? '+' : ''}${formatCurrency(b.netBalance)}`}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {isZero ? 'No debt' : isPos ? 'gets back' : 'owes'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Group Expense History</h3>
            <button
              onClick={() => onOpenAddExpense(group.id)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              + Add Expense
            </button>
          </div>

          <div className="space-y-3">
            {expenses.length === 0 ? (
              <p className="py-8 text-center text-slate-600 text-xs">No expenses added yet in this group.</p>
            ) : (
              expenses.map((exp) => {
                const badge = getCategoryBadge(exp.category);
                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-2xl border border-slate-200/90 hover:bg-slate-50 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{exp.title}</h4>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(exp.amount)}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{exp.paidBy?.name} paid on {formatDate(exp.expenseDate)}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {exp.splitType} Split
                      </span>
                    </div>

                    {/* Member Split Chips */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {exp.splits?.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium"
                        >
                          {s.user?.name}: <strong>{formatCurrency(s.amount)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Budgets */}
      {activeTab === 'budgets' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Group Budgets</h3>
              <p className="text-xs text-slate-600">Track and limit spending for current month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.length === 0 ? (
              <p className="col-span-2 py-8 text-center text-slate-600 text-xs">No active budgets for this group.</p>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {b.category ? b.category.replace('_', ' ') : 'Total Group Spending'}
                      </h4>
                      <p className="text-[11px] text-slate-600">Budget: {formatCurrency(b.limitAmount)}</p>
                    </div>
                    {b.isExceeded ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Exceeded!
                      </span>
                    ) : b.isWarning ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                        Warning (80%+)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        On Track
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${b.isExceeded ? 'bg-rose-500' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, b.percentageUsed || 0)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                    <span>Spent: <strong>{formatCurrency(b.spentAmount)}</strong></span>
                    <span>Remaining: <strong>{formatCurrency(b.remainingAmount)}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Recurring Subscriptions */}
      {activeTab === 'recurring' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recurring Group Expenses</h3>
              <p className="text-xs text-slate-600">Subscriptions like Netflix, WiFi, maid, or monthly flat rent</p>
            </div>
          </div>

          <div className="space-y-3">
            {recurring.length === 0 ? (
              <p className="py-8 text-center text-slate-600 text-xs">No recurring expenses set up.</p>
            ) : (
              recurring.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {formatCurrency(r.amount)} • {r.frequency} • Paid by {r.paidBy?.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Next Due Date: {formatDate(r.nextDueDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerRecurring(r.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3" /> Auto-post Now
                    </button>
                    <button
                      onClick={() => handleToggleRecurring(r.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        r.isActive
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {r.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Group Audit Trail</h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-slate-600 text-xs">No activity logged yet.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{a.description}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        details={qrDetails}
        onPaymentConfirmed={loadGroupDetails}
      />
      <RecordSettlementModal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        group={group}
        onSettlementRecorded={loadGroupDetails}
      />
      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
        onMemberAdded={loadGroupDetails}
      />
    </div>
  );
}
