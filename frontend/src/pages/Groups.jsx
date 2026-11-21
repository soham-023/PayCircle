import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { groupAPI } from '../services/api';
import { formatCurrency, getGroupCategoryIcon } from '../utils/formatters';

export default function Groups({ onSelectGroup, onOpenCreateGroup }) {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await groupAPI.getGroups();
      setGroups(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Expense Groups</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage trips, roommates, family, and college project expense circles
          </p>
        </div>
        <button
          onClick={onOpenCreateGroup}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'TRIP', 'HOME', 'COLLEGE', 'FAMILY', 'PROJECT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-600 text-xs">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="font-bold text-slate-800 text-sm">No groups found</h3>
          <p className="text-xs text-slate-600">Start by creating a group for a trip or roommates.</p>
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            Create New Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-emerald-300 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-2xl flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                    {getGroupCategoryIcon(g.category)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {g.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition">
                    {g.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {g.description || 'Shared expense circle'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Total Spent</p>
                  <p className="text-sm font-black text-slate-900">{formatCurrency(g.totalExpenses)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>{g.memberCount} members</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
