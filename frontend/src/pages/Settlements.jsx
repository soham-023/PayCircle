import React, { useState, useEffect } from 'react';
import { Scale, Sparkles, QrCode, ArrowRight, CheckCircle2, History } from 'lucide-react';
import { settlementAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import QRModal from '../components/QRModal';
import RecordSettlementModal from '../components/RecordSettlementModal';

export default function Settlements() {
  const { user } = useAuth();
  const [overall, setOverall] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDetails, setQrDetails] = useState(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [defaultPayer, setDefaultPayer] = useState(null);
  const [defaultReceiver, setDefaultReceiver] = useState(null);
  const [defaultAmt, setDefaultAmt] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overRes, histRes] = await Promise.all([
        settlementAPI.getOverallBalances(),
        settlementAPI.getUserSettlements(),
      ]);
      setOverall(overRes.data);
      setHistory(histRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePaySuggestion = (s) => {
    setQrDetails({
      payeeUpiId: s.toUser.upiId || 'payee@upi',
      payeeName: s.toUser.name,
      amount: s.amount,
      transactionNote: `PayCircle settlement to ${s.toUser.name}`,
      upiUri: s.upiDeepLink,
    });
    setQrModalOpen(true);
  };

  const handleOpenRecord = (payerId, receiverId, amount) => {
    setDefaultPayer(payerId);
    setDefaultReceiver(receiverId);
    setDefaultAmt(amount);
    setRecordModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settlement Engine</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Min-Cash-Flow optimal debt simplification algorithm and settlement history
        </p>
      </div>

      {/* Debt Simplification Algorithm Showcase */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/40 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Optimal Debt Simplification Suggestions
            </h2>
            <p className="text-xs text-slate-600">
              Minimizes total number of transactions to settle all circular debts across your groups.
            </p>
          </div>
        </div>

        {overall?.suggestedSettlements && overall.suggestedSettlements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {overall.suggestedSettlements.map((s, idx) => {
              const isDebtor = s.fromUser.id === user?.id;
              const isCreditor = s.toUser.id === user?.id;

              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Suggested Settlement #{idx + 1}</p>
                      <p className="text-lg font-black text-emerald-800 mt-0.5">
                        {formatCurrency(s.amount)}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Scale className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-900 font-bold">{isDebtor ? 'You' : s.fromUser.name}</span>
                    {' '}pays{' '}
                    <span className="text-slate-900 font-bold">{isCreditor ? 'You' : s.toUser.name}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {isDebtor ? (
                      <button
                        onClick={() => handlePaySuggestion(s)}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Pay with UPI QR
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenRecord(s.fromUser.id, user?.id, s.amount)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                      >
                        Record as Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/80 p-6 rounded-2xl text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
            <p className="font-bold text-slate-800 text-sm">All clear! No pending debt simplifications.</p>
            <p className="text-xs text-slate-600">Everyone in your circles is currently settled up.</p>
          </div>
        )}
      </div>

      {/* Two Column: Friend Balances & Settlement History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Friend Balances */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Balances with Friends</h3>
          <div className="divide-y divide-slate-100">
            {overall?.friendBalances && overall.friendBalances.length > 0 ? (
              overall.friendBalances.map((fb) => {
                const isPos = fb.netBalance > 0;
                const isZero = Math.abs(fb.netBalance) < 0.01;

                return (
                  <div key={fb.user.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{fb.user.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{fb.user.phone}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-black ${isZero ? 'text-slate-600' : isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isZero ? 'Settled' : `${isPos ? '+' : ''}${formatCurrency(fb.netBalance)}`}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {isZero ? 'No pending debt' : isPos ? 'owes you' : 'you owe'}
                        </p>
                      </div>

                      {!isZero && (
                        <button
                          onClick={() => handleOpenRecord(
                            isPos ? fb.user.id : user?.id,
                            isPos ? user?.id : fb.user.id,
                            Math.abs(fb.netBalance)
                          )}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 transition"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-slate-600 text-xs">No active friend balances.</p>
            )}
          </div>
        </div>

        {/* Settlement History */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-base">Recorded Settlements History</h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="py-6 text-center text-slate-600 text-xs">No settlements recorded yet.</p>
            ) : (
              history.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {s.payer?.name} paid {s.receiver?.name}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      via {s.paymentMethod} {s.transactionReference ? `• Ref: ${s.transactionReference}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{formatDateTime(s.settledAt)}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-700">{formatCurrency(s.amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        details={qrDetails}
        onPaymentConfirmed={loadData}
      />

      {/* Record Settlement Modal */}
      <RecordSettlementModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        defaultPayerId={defaultPayer}
        defaultReceiverId={defaultReceiver}
        defaultAmount={defaultAmt}
        onSettlementRecorded={loadData}
      />
    </div>
  );
}
