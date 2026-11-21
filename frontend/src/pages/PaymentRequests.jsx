import React, { useState, useEffect } from 'react';
import { Send, Smartphone, ArrowDownLeft, ArrowUpRight, Check, X, QrCode, AlertCircle } from 'lucide-react';
import { paymentRequestAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import QRModal from '../components/QRModal';

export default function PaymentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDetails, setQrDetails] = useState(null);
  const [activePayingReqId, setActivePayingReqId] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await paymentRequestAPI.getRequests();
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await paymentRequestAPI.createRequest({
        recipientPhone: recipientPhone.trim(),
        amount: amt,
        note: note.trim() || undefined,
      });

      setSuccess(`Payment request of ${formatCurrency(amt)} sent to ${recipientPhone}!`);
      setRecipientPhone('');
      setAmount('');
      setNote('');
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request. Ensure user is registered with this phone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPay = (req) => {
    setActivePayingReqId(req.id);
    setQrDetails({
      payeeUpiId: req.upiId || 'payee@upi',
      payeeName: req.sender.name,
      amount: req.amount,
      transactionNote: req.note || `PayCircle Request #${req.id}`,
      upiUri: req.upiDeepLink,
    });
    setQrModalOpen(true);
  };

  const handlePaymentConfirmed = async () => {
    if (!activePayingReqId) return;
    try {
      await paymentRequestAPI.respondRequest(activePayingReqId, 'ACCEPT', `UPI-CONFIRMED-${Date.now()}`);
      loadRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      await paymentRequestAPI.respondRequest(id, action);
      loadRequests();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update request');
    }
  };

  const incomingRequests = requests.filter((r) => r.recipient?.id === user?.id);
  const outgoingRequests = requests.filter((r) => r.sender?.id === user?.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Phone-Number Settlements</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Request money directly from any friend using their registered phone number
        </p>
      </div>

      {/* Send Request Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Send New Payment Request</h2>
            <p className="text-xs text-slate-600">Enter recipient's registered mobile number</p>
          </div>
        </div>

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

        <form onSubmit={handleSendRequest} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Friend's Phone Number
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-slate-600" />
              <input
                type="text"
                placeholder="+919876543211"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. WiFi bill or dinner share"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 h-9"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>

      {/* Two Columns: Incoming vs Outgoing Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Incoming Requests ({incomingRequests.length})
            </h3>
          </div>

          <div className="space-y-3">
            {incomingRequests.length === 0 ? (
              <p className="py-8 text-center text-slate-600 text-xs">No pending requests received.</p>
            ) : (
              incomingRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{r.sender?.name} requested</p>
                      <p className="text-[10px] text-slate-600">{r.note || 'No note specified'}</p>
                    </div>
                    <p className="text-base font-black text-rose-600">{formatCurrency(r.amount)}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>{formatDateTime(r.createdAt)}</span>
                    <span className="font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {r.status}
                    </span>
                  </div>

                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenPay(r)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Pay via UPI QR
                      </button>
                      <button
                        onClick={() => handleRespond(r.id, 'REJECT')}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outgoing Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Sent Requests ({outgoingRequests.length})
            </h3>
          </div>

          <div className="space-y-3">
            {outgoingRequests.length === 0 ? (
              <p className="py-8 text-center text-slate-600 text-xs">No payment requests sent yet.</p>
            ) : (
              outgoingRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Sent to {r.recipient?.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{r.recipient?.phone}</p>
                    </div>
                    <p className="text-base font-black text-emerald-700">{formatCurrency(r.amount)}</p>
                  </div>

                  {r.note && <p className="text-xs text-slate-600 italic">"{r.note}"</p>}

                  <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>{formatDateTime(r.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        r.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleRespond(r.id, 'CANCEL')}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Modal for UPI Settlements */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        details={qrDetails}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
