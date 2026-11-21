import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../utils/formatters';

export default function QRModal({ isOpen, onClose, details, onPaymentConfirmed }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!isOpen || !details) return null;

  const upiUri = details.upiUri || `upi://pay?pa=${details.payeeUpiId}&pn=${encodeURIComponent(details.payeeName || 'Payee')}&am=${details.amount}&tn=${encodeURIComponent(details.transactionNote || 'PayCircle Payment')}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(details.payeeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirm = () => {
    setConfirming(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setConfirming(false);
      if (onPaymentConfirmed) onPaymentConfirmed();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md mb-2">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold">UPI Settlement QR</h3>
          <p className="text-emerald-100 text-sm mt-0.5">Scan to pay with any UPI Application</p>
        </div>

        {/* QR & Details Body */}
        <div className="p-6 text-center space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
            <img
              src={qrImageUrl}
              alt="UPI Payment QR Code"
              className="w-52 h-52 mx-auto rounded-xl shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x250/png?text=Scan+UPI+App';
              }}
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Scan using Google Pay, PhonePe, Paytm, or BHIM
            </p>
          </div>

          {/* Amount Badge */}
          <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Settlement Amount</p>
            <p className="text-3xl font-extrabold text-emerald-900 mt-0.5">
              {formatCurrency(details.amount)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Payee: <span className="font-semibold text-slate-800">{details.payeeName}</span>
            </p>
          </div>

          {/* UPI ID Copy Field */}
          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
            <div className="text-left">
              <p className="text-[10px] uppercase font-semibold text-slate-600">Payee UPI ID</p>
              <p className="text-sm font-bold text-slate-800 font-mono">{details.payeeUpiId}</p>
            </div>
            <button
              onClick={copyUpiId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm hover:bg-emerald-50 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* UPI Intent Deep Links for Mobile */}
          <div className="pt-1">
            <p className="text-xs text-slate-600 mb-2 font-medium">Or open directly on mobile app:</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={details.gpayUri || upiUri}
                className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-1 transition"
              >
                GPay <ExternalLink className="w-3 h-3 text-slate-600" />
              </a>
              <a
                href={details.phonepeUri || upiUri}
                className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-1 transition"
              >
                PhonePe <ExternalLink className="w-3 h-3 text-slate-600" />
              </a>
              <a
                href={details.paytmUri || upiUri}
                className="py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-1 transition"
              >
                Paytm <ExternalLink className="w-3 h-3 text-slate-600" />
              </a>
            </div>
          </div>

          {/* Confirmation Action */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? 'Recording Settlement...' : 'I Have Paid — Confirm Settlement'}
          </button>
        </div>
      </div>
    </div>
  );
}
