import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { planService } from "../services/planService";
import { toast } from "react-toastify";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const planIcons = ["🚀", "💎", "🏆"];

const initialOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
  currency: "USD",
  intent: "capture",
};

const Plans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccessDetails, setPaymentSuccessDetails] = useState(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Vendor auth + subscription guard for plans page
  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (!token) return;

    (async () => {
      try {
        const r = await fetch(`${API_URL}/vendor-billing/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success && d.subscription && d.subscription.status === "ACTIVE") {
          const endDate = new Date(d.subscription.currentPeriodEnd);
          if (endDate > new Date()) {
            toast.info("You already have an active plan. Redirecting to dashboard.");
            navigate("/vendor/dashboard", { replace: true });
          }
        }
      } catch (e) {
        console.error("Could not check subscription status", e);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await planService.getAllPlans();
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        toast.error("Failed to fetch subscription plans");
        console.error(error);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (planId) => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      toast.info("Please login as a vendor first to purchase a plan.");
      navigate("/vendor-auth");
      return;
    }
    setSelectedPlan(planId);
    setCouponCode("");
    setAppliedCoupon(null);
    setShowPaymentModal(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Please enter a coupon code");
    setApplyingCoupon(true);
    try {
      const res = await planService.applyOffer(selectedPlan, couponCode);
      if (res.success) {
        setAppliedCoupon(res);
        toast.success("Coupon applied successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Invalid or expired coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  const handleFreePayment = async () => {
    setProcessingPayment(true);
    try {
      const response = await planService.createVendorOrder(selectedPlan, appliedCoupon?.offerDetails?.code);
      if (response.isFree) {
        setProcessingPayment(false);
        setShowPaymentModal(false);
        const plan = plans.find(p => p._id === selectedPlan);
        setPaymentSuccessDetails({
          planName: plan?.planName,
          transactionId: response.transactionId || "FREE_ACTIVATION",
          amount: 0,
          startDate: response.subscription?.start,
          endDate: response.subscription?.end,
        });
        toast.success("Plan activated for free!");
      }
    } catch (error) {
      setProcessingPayment(false);
      toast.error(error.message || "Failed to process free subscription");
    }
  };

  const createPayPalOrder = async (data, actions) => {
    try {
      const response = await planService.createVendorOrder(selectedPlan, appliedCoupon?.offerDetails?.code);
      if (response.isFree) {
        toast.info("This plan is free, please click Activate for Free");
        return null;
      }
      return response.orderId;
    } catch (error) {
      toast.error(error.message || "Failed to create order");
      throw error;
    }
  };

  const handlePayPalApprove = async (data, actions) => {
    try {
      const response = await planService.captureVendorOrder(data.orderID);
      if (response.success) {
        setShowPaymentModal(false);
        const plan = plans.find(p => p._id === selectedPlan);
        setPaymentSuccessDetails({
          planName: plan?.planName,
          transactionId: response.transaction?.gatewayCaptureId || data.orderID,
          amount: response.transaction?.amount,
          startDate: response.subscription?.start,
          endDate: response.subscription?.end,
        });
        toast.success("Payment successful! Plan activated.");
      }
    } catch (error) {
      toast.error(error.message || "Payment capture failed. Please try again.");
    }
  };

  if (paymentSuccessDetails) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-8">
            Thank you for subscribing to the{" "}
            <strong className="text-gray-800">{paymentSuccessDetails.planName}</strong> plan.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-semibold text-gray-900 text-sm">{paymentSuccessDetails.transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-900 text-sm">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-semibold text-gray-900 text-sm">${paymentSuccessDetails.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-semibold text-gray-900 text-sm">
                {paymentSuccessDetails.amount === 0 ? "100% Discount / Free" : "PayPal"}
              </span>
            </div>
            {paymentSuccessDetails.startDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Plan Start</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {new Date(paymentSuccessDetails.startDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
            {paymentSuccessDetails.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Plan Expiry</span>
                <span className="font-semibold text-red-600 text-sm">
                  {new Date(paymentSuccessDetails.endDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/vendor/dashboard")}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Fetching plans…</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="min-h-screen bg-[#f7f6f3] relative overflow-hidden">

        {/* Soft background orbs */}
        <div className="pointer-events-none fixed top-[-120px] right-[-100px] w-[500px] h-[500px] rounded-full bg-red-300 opacity-20 blur-[80px]" />
        <div className="pointer-events-none fixed bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-yellow-300 opacity-20 blur-[80px]" />

        {/* Page wrapper */}
        <div
          className={`relative z-10 max-w-6xl mx-auto px-6 py-10 transition-all duration-500 ease-out  ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              Choose the perfect plan
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              A small investment to grow your wedding business.
            </p>
          </div>

          {/* Cards */}
          {plans.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg">No plans available at the moment.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center items-start gap-15">
              {plans.map((plan, index) => {
                const isMonthly = plan.billingCycle === "monthly";
                const isYearly = plan.billingCycle === "yearly" || plan.billingCycle === "annual";
                const isPopular = isMonthly;
                const isBestValue = isYearly;
                const isSelected = selectedPlan === plan._id;

                return (
                  <div
                    key={plan._id}
                    style={{
                      animationDelay: `${index * 120}ms`,
                      animationFillMode: "both",
                      animation: `slideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 120}ms both`,
                    }}
                    className={`
                      relative flex flex-col
                      w-full max-w-[300px] flex-1 min-w-[240px]
                      bg-white rounded-2xl p-8
                      transition-all duration-300 ease-out
                      ${isSelected
                        ? "border-2 border-green-500 shadow-[0_8px_30px_-6px_rgba(22,163,74,0.25)]"
                        : isPopular
                          ? "border-2 border-red-500 shadow-[0_8px_30px_-6px_rgba(220,38,38,0.2)] scale-105 z-10"
                          : isBestValue
                            ? "border-2 border-amber-400 shadow-[0_8px_30px_-6px_rgba(245,158,11,0.2)] scale-105 z-10"
                            : "border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5"
                      }
                    `}
                  >
                    {/* Most Popular badge — monthly only */}
                    {isPopular && !isSelected && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="bg-red-600 text-white text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full shadow-md">
                          ⭐ Most Popular
                        </span>
                      </div>
                    )}

                    {/* Best Value badge — yearly only */}
                    {isBestValue && !isSelected && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="bg-amber-500 text-white text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full shadow-md">
                          💎 Best Value
                        </span>
                      </div>
                    )}

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="bg-green-500 text-white text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full shadow-md">
                          ✓ Selected
                        </span>
                      </div>
                    )}

                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                          isPopular
                            ? "bg-red-100"
                            : isBestValue
                              ? "bg-amber-50"
                              : "bg-gray-100"
                        }`}
                      >
                        {planIcons[index] ?? "📦"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{plan.planName}</h3>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                          isMonthly ? "text-red-400" : isYearly ? "text-amber-500" : "text-gray-400"
                        }`}>
                          {plan.billingCycle}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-start leading-none gap-0.5">
                        <span className="text-xl font-semibold text-gray-400 mt-2">$</span>
                        <span className="text-5xl font-bold text-gray-900 tracking-tight">{plan.price}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        per {plan.billingCycle === "monthly" ? "month" : "year"}
                      </p>
                    </div>

                    {/* Divider */}
                    <div
                      className={`h-px mb-5 ${
                        isPopular
                          ? "bg-gradient-to-r from-transparent via-red-300 to-transparent"
                          : isBestValue
                            ? "bg-gradient-to-r from-transparent via-amber-300 to-transparent"
                            : "bg-gray-100"
                      }`}
                    />

                    {/* Features */}
                    <ul className="flex-1 flex flex-col gap-3 mb-7">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                              isPopular
                                ? "bg-red-100 text-red-600"
                                : isBestValue
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-green-100 text-green-600"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="text-sm text-gray-500 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan._id)}
                      className={`
                        w-full py-3.5 px-5 rounded-xl text-sm font-semibold
                        flex items-center justify-center gap-2
                        transition-all duration-200 active:scale-95
                        ${isSelected
                          ? "bg-green-500 text-white shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
                          : isPopular
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_14px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5"
                            : isBestValue
                              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
                              : "bg-red-50 text-red-600 hover:bg-red-100 hover:-translate-y-0.5"
                        }
                      `}
                    >
                      <span>{isSelected ? "Selected ✓" : "Get Started"}</span>
                      {!isSelected && <span>→</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (() => {
          const plan = plans.find(p => p._id === selectedPlan);
          const originalPrice = plan?.price || 0;
          const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : originalPrice;
          const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
          const isFree = finalPrice <= 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
                <p className="text-gray-500 mb-6">
                  You are about to subscribe to the{" "}
                  <strong className="text-gray-800">{plan?.planName}</strong> plan.
                </p>

                {/* Coupon Section */}
                <div className="mb-6">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none uppercase text-sm font-medium"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-green-700 font-bold text-sm flex items-center gap-1.5">
                          <span className="text-lg leading-none">✅</span> Coupon Applied
                        </div>
                        <div className="text-green-600 text-xs mt-0.5">
                          Code: <strong>{appliedCoupon.offerDetails.code}</strong>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-gray-400 hover:text-red-500 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-gray-600 text-sm">
                    <span>Plan Price</span>
                    <span className="font-medium">${originalPrice}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-green-600 text-sm">
                      <span>Discount</span>
                      <span className="font-medium">-${discountAmount}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-bold">Total Amount</span>
                    <span className="text-3xl font-extrabold text-gray-900">${finalPrice}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowPaymentModal(false); handleRemoveCoupon(); }}
                    disabled={processingPayment}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {isFree ? (
                    <button
                      onClick={handleFreePayment}
                      disabled={processingPayment}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Activate for Free"
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 z-0 relative min-h-[48px]">
                      <PayPalButtons
                        forceReRender={[finalPrice, appliedCoupon, selectedPlan]}
                        style={{ layout: "horizontal", height: 48, color: "gold", shape: "rect", label: "paypal" }}
                        createOrder={createPayPalOrder}
                        onApprove={handlePayPalApprove}
                        onError={() => toast.error("PayPal encountered an error. Please try again.")}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(28px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </PayPalScriptProvider>
  );
};

export default Plans;