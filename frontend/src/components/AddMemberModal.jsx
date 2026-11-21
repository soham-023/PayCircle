import React, { useState } from 'react';
import { X, UserPlus, Search, AlertCircle, Check } from 'lucide-react';
import { groupAPI, userAPI } from '../services/api';

export default function AddMemberModal({ isOpen, onClose, groupId, groupName, onMemberAdded }) {
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await userAPI.searchUsers(query.trim());
      setSearchResults(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleAddPhone = async (phoneToAdd) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await groupAPI.addMember(groupId, { phone: phoneToAdd.trim() });
      setSuccess(`User with phone ${phoneToAdd} added successfully!`);
      setTimeout(() => {
        if (onMemberAdded) onMemberAdded();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Add Member</h3>
              <p className="text-emerald-100 text-xs">Invite using registered phone number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Search Users by Phone or Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Registered Users
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="text"
                placeholder="Search by name or phone (e.g. Rahul, 9876)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-36 overflow-y-auto bg-white shadow-sm">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleAddPhone(u.phone)}
                    className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{u.phone}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                      + Add
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-600 text-[10px] uppercase font-bold">Or enter phone</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+919876543212"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !phone.trim()}
              onClick={() => handleAddPhone(phone)}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-md text-xs transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
