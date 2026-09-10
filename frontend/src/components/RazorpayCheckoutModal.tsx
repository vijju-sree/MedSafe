import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  QrCode,
  Building,
  Lock,
  ArrowRight,
  ExternalLink,
  Shield
} from 'lucide-react';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    amount: number; // in paise
    amountInRupees: number;
    currency: string;
    keyId: string;
  } | null;
  description: string;
  type: 'SUBSCRIPTION' | 'FAMILY_SUBSCRIPTION' | 'BILL' | 'ORGANIZATION_LICENSE' | 'ORGANIZATION_USAGE';
  referenceId: string;
  billingCycle?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  isLiveMode?: boolean;
  onSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  onFailure?: (errorMsg: string) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  order,
  description,
  type,
  referenceId,
  billingCycle,
  patientName = 'Patient',
  patientEmail = 'patient@medsafe.local',
  patientPhone = '9876543210',
  isLiveMode = false,
  onSuccess,
  onFailure
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState<string>('patient@okaxis');
  const [cardNumber, setCardNumber] = useState<string>('4315 2890 1234 5678');
  const [cardExpiry, setCardExpiry] = useState<string>('08/29');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRazorpayScript, setHasRazorpayScript] = useState<boolean>(false);

  useEffect(() => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      setHasRazorpayScript(true);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // Launch Official Razorpay Standard Checkout Popup (REAL payment flow in Live Mode or official test popup in Test Mode)
  const handleLaunchOfficialRazorpay = () => {
    if (typeof (window as any).Razorpay === 'undefined') {
      if (isLiveMode) {
        setError('Razorpay SDK failed to load. Please check your internet connection.');
        return;
      }
    } else {
      try {
        const options = {
          key: order.keyId,
          amount: order.amount, // in paise
          currency: order.currency || 'INR',
          name: 'MedSafe Healthcare',
          description: description,
          order_id: order.orderId,
          prefill: {
            name: patientName,
            email: patientEmail,
            contact: patientPhone
          },
          theme: {
            color: '#0284c7'
          },
          handler: async function (response: any) {
            try {
              setProcessing(true);
              await onSuccess({
                razorpay_order_id: response.razorpay_order_id || order.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              onClose();
            } catch (err: any) {
              setError(err.message || 'Payment verification failed on server.');
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              onClose();
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          const errMsg = response.error?.description || 'Payment declined by issuer or cancelled.';
          setError(errMsg);
          if (onFailure) {
            onFailure(errMsg);
          }
        });
        rzp.open();
        return;
      } catch (err: any) {
        console.error('Error opening Razorpay checkout:', err);
        if (isLiveMode) {
          setError('Failed to initialize official Razorpay Checkout.');
          return;
        }
      }
    }
  };

  // Test Mode Simulation fallback (STRICTLY DISALLOWED IN LIVE MODE)
  const handleTestSimulatePay = async (simulateFailure: boolean = false) => {
    if (isLiveMode) {
      setError('Simulated payment is strictly disallowed in LIVE production mode.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (simulateFailure) {
        if (onFailure) {
          onFailure('Simulated Payment Failure: Transaction declined by bank.');
        }
        onClose();
        return;
      }

      // Generate simulation payment ID
      const paymentId = `pay_sim_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;

      // Obtain cryptographic signature from test endpoint
      const testSigRes = await fetch('/api/payments/razorpay/test-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('medsafe_token') || ''}`
        },
        body: JSON.stringify({ orderId: order.orderId, paymentId })
      }).catch(() => null);

      let signature = '';
      if (testSigRes && testSigRes.ok) {
        const sigJson = await testSigRes.json();
        signature = sigJson.signature;
      } else {
        signature = `sig_${Date.now()}`;
      }

      await onSuccess({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Razorpay Brand Header */}
        <div className={`p-5 text-white ${
          isLiveMode
            ? 'bg-gradient-to-r from-emerald-800 via-teal-700 to-indigo-800'
            : 'bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-white text-sky-700 flex items-center justify-center font-black text-sm shadow">
                ₹
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center space-x-1.5">
                  <span>Razorpay Checkout</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isLiveMode ? 'bg-emerald-400 text-slate-900' : 'bg-amber-400 text-slate-900'
                  }`}>
                    {isLiveMode ? 'Live Production' : 'Test Mode'}
                  </span>
                </h3>
                <p className="text-[11px] text-sky-100 font-medium">MedSafe Healthcare Payment Gateway</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-sky-100 font-semibold">{description}</p>
              <p className="text-[10px] font-mono text-sky-200">Order ID: {order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">₹{order.amountInRupees}</p>
              <p className="text-[10px] text-sky-100">Server-Validated Price</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PRIMARY ACTION: Official Razorpay Standard Checkout */}
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Official Razorpay Standard Modal</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                {isLiveMode ? 'REAL PAYMENT' : 'TEST CARDS / UPI'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {isLiveMode
                ? 'Opens the official Razorpay popup for real UPI, Credit/Debit card, or NetBanking payment.'
                : 'Launches the official Razorpay popup supporting test cards and simulated UPI authorizations.'}
            </p>

            <button
              type="button"
              disabled={processing}
              onClick={handleLaunchOfficialRazorpay}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Official Razorpay Popup (₹{order.amountInRupees})</span>
            </button>
          </div>

          {/* TEST MODE ONLY: Offline simulator */}
          {!isLiveMode && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Or use Test Mode Offline Simulator:</span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'NETBANKING', label: 'Net Banking', icon: Building }
                ].map(m => {
                  const Icon = m.icon;
                  const isSel = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                        isSel
                          ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Simulator Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleTestSimulatePay(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Simulate Successful Test Payment (₹{order.amountInRupees})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleTestSimulatePay(true)}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[10px] font-bold transition-all border border-slate-200 hover:border-rose-200"
                >
                  Simulate Failed Payment (Test Failure Alert)
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PCI-DSS Level 1 Compliant • Server-side HMAC Verification Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
