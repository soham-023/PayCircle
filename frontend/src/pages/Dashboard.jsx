import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Receipt,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ChevronRight,
  Send,
  Plus
} from 'lucide-react';
import { settlementAPI, groupAPI, expenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getCategoryBadge, getGroupCategoryIcon } from '../utils/formatters';
import QRModal from '../components/QRModal';

export default function Dashboard({ onNavigate, onOpenAddExpense, onOpenCreateGroup, onOpenPaymentRequest }) {
  const { user } = useAuth();
  const [overallBalances, setOverallBalances] = useState(null);
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balancesRes, groupsRes, expensesRes] = await Promise.all([
        settlementAPI.getOverallBalances(),
        groupAPI.getGroups(),
        expenseAPI.getUserExpenses(),
      ]);
      setOverallBalances(balancesRes.data);
      setGroups(groupsRes.data || []);
      setRecentExpenses((expensesRes.data || []).slice(0, 5));
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePaySuggestion = (suggestion) => {
    setSelectedSettlement({
      payeeUpiId: suggestion.toUser.upiId || 'payee@upi',
      payeeName: suggestion.toUser.name,
      amount: suggestion.amount,
      transactionNote: `PayCircle settlement to ${suggestion.toUser.name}`,
      upiUri: suggestion.upiDeepLink,
    });
    setQrModalOpen(true);
  };

  const netBal = overallBalances?.netBalance || 0;
  const isNetPositive = netBal > 0;
  const isNetZero = Math.abs(netBal) < 0.01;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
        <div>
          <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-[11px] font-bold rounded-full text-emerald-100 uppercase tracking-wider">
            Split Smart. Pay Fair.
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Hey, {user?.name?.split(' ')[0] || 'Friend'}! 👋
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Track expenses, simplify debts, and settle seamlessly via phone number & UPI.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button
            onClick={onOpenPaymentRequest}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Request Money
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Balance</span>
            <div className={`p-2 rounded-xl ${isNetZero ? 'bg-slate-100 text-slate-600' : isNetPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-black ${isNetZero ? 'text-slate-800' : isNetPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(Math.abs(netBal))}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {isNetZero ? 'You are all settled up!' : isNetPositive ? 'You are owed in total' : 'You owe in total'}
            </p>
          </div>
        </div>

        {/* You Are Owed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">You are owed</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(overallBalances?.totalYouAreOwed || 0)}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              From friends & groups
            </p>
          </div>
        </div>

        {/* You Owe */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">You owe</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-600">
              {formatCurrency(overallBalances?.totalYouOwe || 0)}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Pending to be settled
            </p>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Groups</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{groups.length}</p>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Trips, flatmates & circles
            </p>
          </div>
        </div>
      </div>

      {/* Optimal Debt Simplification Engine Banner */}
      {overallBalances?.suggestedSettlements && overallBalances.suggestedSettlements.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Smart Settlement Engine (Min-Cash-Flow)
                </h3>
                <p className="text-xs text-slate-600">
                  Optimized to clear all circular debts in the fewest possible transactions!
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settlements')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              View Hub <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {overallBalances.suggestedSettlements.map((s, idx) => {
              const isCurrentUserDebtor = s.fromUser.id === user?.id;
              const isCurrentUserCreditor = s.toUser.id === user?.id;

              return (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-emerald-100/90 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 font-semibold truncate">
                      <span className="font-bold text-slate-900">
                        {isCurrentUserDebtor ? 'You' : s.fromUser.name}
                      </span>{' '}
                      pays{' '}
                      <span className="font-bold text-slate-900">
                        {isCurrentUserCreditor ? 'You' : s.toUser.name}
                      </span>
                    </p>
                    <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                      {formatCurrency(s.amount)}
                    </p>
                  </div>

                  {isCurrentUserDebtor ? (
                    <button
                      onClick={() => handlePaySuggestion(s)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1 shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Pay UPI
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0">
                      You receive
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column Section: Active Groups & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Groups Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Your Groups</h3>
              <p className="text-xs text-slate-600">Expense circles you are part of</p>
            </div>
            <button
              onClick={() => onNavigate('groups')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-600">You haven't joined any groups yet.</p>
                <button
                  onClick={onOpenCreateGroup}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              groups.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  onClick={() => onNavigate('groups', g.id)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-xl flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                      {getGroupCategoryIcon(g.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {g.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {g.memberCount} members · Total: {formatCurrency(g.totalExpenses)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Shared Expenses</h3>
              <p className="text-xs text-slate-600">Latest transactions in your circles</p>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-600">No expenses recorded yet.</p>
                <button
                  onClick={onOpenAddExpense}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              recentExpenses.map((exp) => {
                const badge = getCategoryBadge(exp.category);
                const isPaidByMe = exp.paidBy?.id === user?.id;

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-slate-600">{formatDate(exp.expenseDate)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{exp.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {isPaidByMe ? 'You paid' : `${exp.paidBy?.name} paid`} {formatCurrency(exp.amount)}
                        {exp.groupName ? ` in ${exp.groupName}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-slate-900">
                        {formatCurrency(exp.amount)}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {exp.splitType}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* QR Modal for UPI Settlements */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        details={selectedSettlement}
        onPaymentConfirmed={loadData}
      />
    </div>
  );
}
