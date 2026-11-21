import React, { useState, useEffect } from 'react';
import { History, Activity, Calendar } from 'lucide-react';
import { activityAPI } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityAPI.getFeed(50)
      .then((res) => setActivities(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Activity History</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Complete audit trail of group events, expense creations, and settlements
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-600 text-xs">Loading activity feed...</div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-600">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900">{act.description}</p>
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                  {act.groupName && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-100/70 text-emerald-800 text-[10px] font-bold rounded-md">
                      {act.groupName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
