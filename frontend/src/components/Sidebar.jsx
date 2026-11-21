import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Scale,
  Send,
  PieChart,
  BarChart3,
  History,
  User,
  PlusCircle
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, onOpenAddExpense, onOpenCreateGroup }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'settlements', label: 'Settlements', icon: Scale },
    { id: 'requests', label: 'Phone Requests', icon: Send },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Activity Log', icon: History },
    { id: 'profile', label: 'Profile & UPI', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-65px)]">
      <div>
        {/* Quick Action Button */}
        <div className="space-y-2 mb-6">
          <button
            onClick={onOpenAddExpense}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition group text-sm"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Add Expense
          </button>
          <button
            onClick={onOpenCreateGroup}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-2xl border border-emerald-200/80 transition"
          >
            + Create New Group
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-600'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tagline Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-100/80 mt-6">
        <p className="text-[11px] font-bold text-emerald-900">PayCircle Engine</p>
        <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
          Powered by Min-Cash-Flow optimal debt simplification and instant UPI deeplinking.
        </p>
      </div>
    </aside>
  );
}
