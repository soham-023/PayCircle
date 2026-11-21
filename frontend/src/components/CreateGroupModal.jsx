import React, { useState } from 'react';
import { X, Users, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { groupAPI } from '../services/api';

const GROUP_CATEGORIES = [
  { id: 'TRIP', label: 'Trip / Vacation', icon: '✈️' },
  { id: 'HOME', label: 'Flat / Home / Roommates', icon: '🏠' },
  { id: 'COUPLE', label: 'Couple', icon: '❤️' },
  { id: 'COLLEGE', label: 'College / Friends', icon: '🎓' },
  { id: 'PROJECT', label: 'Project / Hackathon', icon: '💻' },
  { id: 'FAMILY', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'OTHER', label: 'Other', icon: '📁' },
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('TRIP');
  const [phoneInput, setPhoneInput] = useState('');
  const [memberPhones, setMemberPhones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddPhone = (e) => {
    e.preventDefault();
    const clean = phoneInput.trim();
    if (!clean) return;
    if (memberPhones.includes(clean)) {
      setError('Phone number already added');
      return;
    }
    setMemberPhones([...memberPhones, clean]);
    setPhoneInput('');
    setError('');
  };

  const handleRemovePhone = (phone) => {
    setMemberPhones(memberPhones.filter((p) => p !== phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await groupAPI.createGroup({
        name: name.trim(),
        description: description.trim(),
        category,
        initialMemberPhones: memberPhones,
      });

      if (onGroupCreated) onGroupCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Create New Group</h3>
              <p className="text-emerald-100 text-xs">For trips, flatmates, friends or projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Manali Trip 2026, Flat 301"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GROUP_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    category === c.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Add initial members by phone number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Add Members by Registered Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+919876543211"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPhone}
                className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {memberPhones.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {memberPhones.map((phone) => (
                  <span
                    key={phone}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono"
                  >
                    {phone}
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(phone)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-md text-xs transition disabled:opacity-50"
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
