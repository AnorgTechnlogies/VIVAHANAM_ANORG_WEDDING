// SubscriptionPlans.jsx  — /subscription-plans  (user-facing)
// Redesigned: admin-controlled plans, core services + vendor picker per slot
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SquarePaymentForm from "../components/SquarePaymentForm";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/* ─── tiny helpers ─── */
const authHeaders = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
const apiFetch = (path, opts = {}) => fetch(`${API_URL}/${path}`, opts).then(r => r.json());

// Detect which auth token is present
const getActiveToken = () =>
  localStorage.getItem("userToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("weddingToken") ||
  null;

/* ─── colour palette maps ─── */
const THEME_COLORS = {
  "from-rose-400 to-pink-600": { from: "#FB7185", to: "#DB2777", accent: "#E11D48", light: "#FFE4EE" },
  "from-amber-500 to-orange-600": { from: "#F59E0B", to: "#EA580C", accent: "#D97706", light: "#FEF3C7" },
  "from-violet-500 to-purple-700": { from: "#8B5CF6", to: "#7C3AED", accent: "#7C3AED", light: "#EDE9FE" },
  "from-sky-500 to-blue-700": { from: "#0EA5E9", to: "#1D4ED8", accent: "#0284C7", light: "#E0F2FE" },
  "from-emerald-500 to-teal-700": { from: "#10B981", to: "#0F766E", accent: "#059669", light: "#D1FAE5" },
  "from-slate-500 to-slate-700": { from: "#64748B", to: "#334155", accent: "#475569", light: "#F1F5F9" },
};

const getTheme = (gradient) => THEME_COLORS[gradient] || THEME_COLORS["from-violet-500 to-purple-700"];

/* ====================================================================
   STEP 1 — Plan Cards
   ==================================================================== */
const PlanCard = ({ plan, onSelect, isSelected }) => {
  const theme = getTheme(plan.theme?.gradient);
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => onSelect(plan)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: isSelected ? `linear-gradient(135deg, ${theme.light}, #fff)` : "#fff",
        border: isSelected ? `2.5px solid ${theme.accent}` : hover ? `2px solid ${theme.accent}55` : "2px solid #f1e8e8",
        borderRadius: 24,
        padding: 28,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        transform: hover || isSelected ? "translateY(-6px)" : "translateY(0)",
        boxShadow: isSelected
          ? `0 16px 48px -8px ${theme.accent}40`
          : hover ? "0 12px 36px -8px rgba(0,0,0,0.12)" : "0 4px 16px -4px rgba(0,0,0,0.06)",
        minWidth: 280,
        maxWidth: 340,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Gradient stripe at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
        borderRadius: "24px 24px 0 0",
      }} />

      {/* Badges */}
      {plan.popular && !isSelected && (
        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <span style={{ background: theme.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99, boxShadow: `0 4px 12px ${theme.accent}50` }}>
            ⭐ Most Popular
          </span>
        </div>
      )}
      {plan.bestValue && !isSelected && !plan.popular && (
        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <span style={{ background: theme.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99, boxShadow: `0 4px 12px ${theme.accent}50` }}>
            💎 Best Value
          </span>
        </div>
      )}
      {isSelected && (
        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <span style={{ background: theme.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99 }}>
            ✓ Selected
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, background: `linear-gradient(135deg, ${theme.from}22, ${theme.to}22)`,
          border: `1px solid ${theme.accent}30`,
        }}>
          {plan.theme?.icon || "💍"}
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2 }}>
            {plan.planName}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {plan.planType === "custom" ? "🎨 Customisable" : "📦 Fixed Bundle"}
          </div>
        </div>
      </div>

      {/* Tagline */}
      {plan.tagline && (
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}>{plan.tagline}</p>
      )}

      {/* Price */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 2, lineHeight: 1 }}>
          <span style={{ fontSize: 18, color: "#9ca3af", marginTop: 8, fontWeight: 600 }}>$</span>
          <span style={{ fontSize: 52, fontWeight: 800, color: "#111827", fontFamily: "'Outfit', sans-serif", letterSpacing: "-2px" }}>
            {plan.basePrice}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
          base price · {plan.validityDays}d validity
          {plan.planType === "vendor" ? " · vendor prices added" : ""}
        </p>
      </div>

      {/* Highlights */}
      <ul style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {(plan.highlights || []).slice(0, 5).map((h, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", background: `${theme.accent}18`, color: theme.accent,
              fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
            }}>✓</span>
            {h}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        style={{
          width: "100%", padding: "14px 24px", borderRadius: 14, fontSize: 14, fontWeight: 700,
          border: "none", cursor: "pointer", transition: "all 0.2s",
          background: isSelected ? theme.accent : `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
          color: "#fff",
          boxShadow: `0 6px 20px ${theme.accent}40`,
        }}
      >
        {isSelected ? "✓ Selected" : "Choose Plan →"}
      </button>
    </div>
  );
};

/* ====================================================================
   STEP 2 — Service Customizer
   ==================================================================== */
const ServiceCustomizer = ({ plan, selectedServices, onServicesChange }) => {
  const [vendorSearch, setVendorSearch] = useState({}); // serviceCode → query
  const [vendorResults, setVendorResults] = useState({}); // serviceCode → vendors[]
  const [loadingVendors, setLoadingVendors] = useState({});
  const [chosenVendors, setChosenVendors] = useState({}); // serviceCode → vendor object
  const debounceRef = useRef({});

  const theme = getTheme(plan.theme?.gradient);
  const isCustom = plan.planType === "custom";

  // For fixed plans: services are pre-determined (includedServices)
  // For custom: user can toggle services from allowedServices (required ones auto-included)
  const mandatoryServices = (plan.includedServices || []).filter(s => s.isRequired);
  const optionalIncluded = (plan.includedServices || []).filter(s => !s.isRequired);
  const poolServices = isCustom ? (plan.allowedServices || []) : optionalIncluded;

  const [customSelected, setCustomSelected] = useState(() => {
    // Pre-select required services
    const req = {};
    mandatoryServices.forEach(s => { req[s.serviceCode] = true; });
    optionalIncluded.forEach(s => { req[s.serviceCode] = true; });
    return req;
  });

  const fetchVendors = async (svc, q) => {
    setLoadingVendors(prev => ({ ...prev, [svc.serviceCode]: true }));
    try {
      const params = new URLSearchParams({ category: svc.vendorCategory || "", q: q || "" });
      const data = await apiFetch(`wedding-subscriptions/vendors/search?${params}`);
      setVendorResults(prev => ({ ...prev, [svc.serviceCode]: data.data?.vendors || [] }));
    } catch (e) {
      console.error("vendor search error", e);
    } finally {
      setLoadingVendors(prev => ({ ...prev, [svc.serviceCode]: false }));
    }
  };

  const handleVendorSearch = (svc, q) => {
    setVendorSearch(prev => ({ ...prev, [svc.serviceCode]: q }));
    clearTimeout(debounceRef.current[svc.serviceCode]);
    debounceRef.current[svc.serviceCode] = setTimeout(() => fetchVendors(svc, q), 400);
  };

  const selectVendor = (svc, vendor) => {
    setChosenVendors(prev => ({ ...prev, [svc.serviceCode]: vendor }));
    setVendorResults(prev => ({ ...prev, [svc.serviceCode]: [] }));
    setVendorSearch(prev => ({ ...prev, [svc.serviceCode]: vendor.businessName || vendor.name || "" }));
  };

  const toggleCustomService = (svc) => {
    if (mandatoryServices.some(s => s.serviceCode === svc.serviceCode)) return; // can't untick mandatory
    setCustomSelected(prev => ({ ...prev, [svc.serviceCode]: !prev[svc.serviceCode] }));
  };

  // Build the selectedServices array for parent whenever state changes
  useEffect(() => {
    const allSlots = isCustom
      ? [...mandatoryServices, ...poolServices.filter(s => customSelected[s.serviceCode])]
      : [...mandatoryServices, ...optionalIncluded];

    const built = allSlots.map(svc => {
      const vendor = chosenVendors[svc.serviceCode] || null;
      return {
        serviceId: svc.serviceId,
        serviceCode: svc.serviceCode,
        serviceName: svc.serviceName,
        serviceType: svc.serviceType,
        chosenVendorId: vendor?._id || null,
        chosenVendorName: vendor?.businessName || vendor?.name || "",
        vendorPrice: vendor?.startingPrice || 0,
        slotPrice: svc.serviceType === "core" ? (svc.overridePrice ?? 0) : (vendor?.startingPrice || 0),
      };
    });
    onServicesChange(built);
  }, [customSelected, chosenVendors]);

  const VendorSlot = ({ svc }) => {
    const isOpen = vendorResults[svc.serviceCode]?.length > 0;
    const chosen = chosenVendors[svc.serviceCode];
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder={`Search ${svc.vendorCategory || "vendor"}s…`}
            value={vendorSearch[svc.serviceCode] || ""}
            onChange={e => handleVendorSearch(svc, e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
              border: chosen ? `1.5px solid ${theme.accent}` : "1.5px solid #e5e7eb",
              outline: "none", boxSizing: "border-box",
              background: chosen ? `${theme.accent}08` : "#fafafa",
            }}
          />
          {loadingVendors[svc.serviceCode] && (
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
        </div>

        {/* Vendor Dropdown */}
        {isOpen && (
          <div style={{
            border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4, maxHeight: 220, overflowY: "auto",
          }}>
            {vendorResults[svc.serviceCode].map(v => (
              <div key={v._id} onClick={() => selectVendor(svc, v)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.accent}10`}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                {v.profileImage && (
                  <img src={v.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #f3e8ff" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", truncate: true }}>{v.businessName || v.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{v.city} · {v.category}</div>
                </div>
                {v.startingPrice && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, whiteSpace: "nowrap" }}>
                    from ${v.startingPrice}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {chosen && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "8px 12px", background: `${theme.accent}10`, borderRadius: 10, border: `1px solid ${theme.accent}30` }}>
            <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600 }}>
              ✓ {chosen.businessName || chosen.name} · {chosen.city}
              {chosen.startingPrice && <span style={{ color: "#6b7280", fontWeight: 400 }}> · from ${chosen.startingPrice}</span>}
            </div>
            <button
              onClick={() => { setChosenVendors(p => { const n = { ...p }; delete n[svc.serviceCode]; return n; }); setVendorSearch(p => ({ ...p, [svc.serviceCode]: "" })); }}
              style={{ fontSize: 11, color: "#9ca3af", cursor: "pointer", border: "none", background: "none" }}
            >✕</button>
          </div>
        )}
      </div>
    );
  };

  const renderServiceSlot = (svc, isMandatory, isSelected) => {
    const theme = getTheme(plan.theme?.gradient);
    return (
      <div key={svc.serviceCode}
        style={{
          border: isMandatory ? `1.5px solid ${theme.accent}40` : isSelected ? `1.5px solid ${theme.accent}60` : "1.5px solid #e5e7eb",
          borderRadius: 16, padding: 16, background: isMandatory ? `${theme.accent}06` : "#fff",
          transition: "all 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isCustom && !isMandatory && (
            <input
              type="checkbox"
              checked={!!customSelected[svc.serviceCode]}
              onChange={() => toggleCustomService(svc)}
              style={{ width: 18, height: 18, accentColor: theme.accent, cursor: "pointer", flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, display: "flex", items: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: `${theme.accent}15`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                {svc.serviceType === "core" ? "⚡" : "🏪"}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{svc.serviceName}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                  {isMandatory && <span style={{ background: `${theme.accent}18`, color: theme.accent, padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>Included</span>}
                  <span style={{ background: svc.serviceType === "core" ? "#EDE9FE" : "#FEF3C7", color: svc.serviceType === "core" ? "#7C3AED" : "#D97706", padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                    {svc.serviceType === "core" ? "Vivahanam" : `Vendor · ${svc.vendorCategory || "Third-party"}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {svc.serviceType === "core" && svc.overridePrice != null ? (
            <span style={{ fontWeight: 700, color: theme.accent, fontSize: 14, whiteSpace: "nowrap" }}>${svc.overridePrice}</span>
          ) : svc.serviceType === "vendor" ? (
            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>Vendor-priced</span>
          ) : null}
        </div>

        {/* Vendor picker for vendor-type services */}
        {svc.serviceType === "vendor" && (isCustom ? !!customSelected[svc.serviceCode] : true) && (
          <VendorSlot svc={svc} />
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>
        Configure Your Services
      </h3>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        {isCustom
          ? "Choose the services you want — required ones are pre-selected. For vendor services, search and pick your preferred vendor."
          : "Your plan includes these services. For vendor slots, search and select your preferred vendor."}
      </p>

      {/* Mandatory / always-included */}
      {mandatoryServices.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            ✦ Always Included
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mandatoryServices.map(svc => renderServiceSlot(svc, true, true))}
          </div>
        </div>
      )}

      {/* Pool services */}
      {poolServices.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            {isCustom ? "✦ Add to Your Plan" : "✦ Included Services"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {poolServices.map(svc => renderServiceSlot(svc, false, !!customSelected[svc.serviceCode]))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ====================================================================
   STEP 3 — Checkout / Review
   ==================================================================== */
const CheckoutPanel = ({ plan, selectedServices, couponCode, setCouponCode, appliedCoupon, setAppliedCoupon, onPay, onFree, processingPayment }) => {
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const theme = getTheme(plan.theme?.gradient);

  const basePrice = plan.basePrice || 0;
  const vendorTotal = selectedServices.reduce((a, s) => a + (s.vendorPrice || 0), 0);
  const subtotal = basePrice + vendorTotal;
  const discount = appliedCoupon?.discountAmount || 0;
  const finalAmount = Math.max(0, subtotal - discount);
  const isFree = finalAmount <= 0;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Enter a coupon code");
    setApplyingCoupon(true);
    try {
      // Re-use existing coupon endpoint
      const data = await apiFetch(`coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, planId: plan._id, amount: subtotal }),
      });
      if (data.success) {
        setAppliedCoupon(data);
        toast.success("Coupon applied!");
      } else {
        toast.error(data.message || "Invalid coupon");
      }
    } catch (e) {
      toast.error(e.message || "Coupon check failed");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const vendorServices = selectedServices.filter(s => s.serviceType === "vendor");
  const coreServices = selectedServices.filter(s => s.serviceType === "core");

  return (
    <div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 20 }}>
        Review & Pay
      </h3>

      {/* Order Summary */}
      <div style={{ border: "1.5px solid #f1e8e8", borderRadius: 18, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>{plan.theme?.icon || "💍"}</span>
          <div>
            <div style={{ fontWeight: 700, color: "#111827" }}>{plan.planName}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{plan.validityDays}d · {plan.billingCycle}</div>
          </div>
        </div>

        {/* Services */}
        {selectedServices.length > 0 && (
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
            {coreServices.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", marginBottom: 6 }}>
                <span>⚡ {s.serviceName}</span>
                <span style={{ fontWeight: 600 }}>{s.slotPrice > 0 ? `$${s.slotPrice}` : "Included"}</span>
              </div>
            ))}
            {vendorServices.map((s, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151" }}>
                  <span>🏪 {s.serviceName}</span>
                  <span style={{ fontWeight: 600 }}>{s.vendorPrice > 0 ? `$${s.vendorPrice}` : "To be quoted"}</span>
                </div>
                {s.chosenVendorName && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, paddingLeft: 14 }}>
                    → {s.chosenVendorName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pricing breakdown */}
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12, marginTop: 4, space: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
            <span>Plan Base Price</span><span>${basePrice}</span>
          </div>
          {vendorTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
              <span>Vendor Subtotal</span><span>${vendorTotal}</span>
            </div>
          )}
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#10b981", marginBottom: 6 }}>
              <span>Discount</span><span>-${discount}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, color: "#111827", borderTop: "1px solid #f3f4f6", paddingTop: 10, marginTop: 6 }}>
            <span>Total</span>
            <span style={{ color: theme.accent }}>${finalAmount}</span>
          </div>
        </div>
      </div>

      {/* Coupon */}
      {!appliedCoupon ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", fontFamily: "monospace", fontWeight: 700 }}
          />
          <button onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}
            style={{ padding: "11px 18px", borderRadius: 12, background: "#111827", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: applyingCoupon || !couponCode.trim() ? 0.6 : 1 }}>
            {applyingCoupon ? "..." : "Apply"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#d1fae5", borderRadius: 12, marginBottom: 20, border: "1px solid #6ee7b7" }}>
          <div style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>✅ Coupon applied: {appliedCoupon.offerDetails?.code || couponCode}</div>
          <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
        </div>
      )}

      {/* Payment */}
      {isFree ? (
        <button onClick={() => onFree(finalAmount, selectedServices)} disabled={processingPayment}
          style={{
            width: "100%", padding: "15px 24px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
            fontWeight: 700, fontSize: 15, boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {processingPayment ? <><Spinner /> Processing…</> : "🎉 Activate for Free"}
        </button>
      ) : (
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          {processingPayment ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20, gap: 8, color: "#6b7280", fontSize: 14 }}>
              <Spinner /> Processing payment…
            </div>
          ) : (
            <SquarePaymentForm
              amount={finalAmount}
              onTokenGenerated={(token) => onPay(token, finalAmount, selectedServices)}
              onError={(err) => toast.error(err)}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <span style={{ width: 18, height: 18, border: "2.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
);

/* ====================================================================
   SUCCESS SCREEN
   ==================================================================== */
const SuccessScreen = ({ details, onGoHome }) => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
    <div style={{
      background: "#fff", borderRadius: 32, padding: 48, maxWidth: 560, width: "100%", textAlign: "center",
      boxShadow: "0 24px 64px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6",
    }}>
      <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>
        ✅
      </div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
        Plan Activated!
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 15 }}>
        Your <strong style={{ color: "#111827" }}>{details.planName}</strong> is now active.
      </p>

      <div style={{ background: "#f9fafb", borderRadius: 16, padding: 20, textAlign: "left", marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          ["Transaction ID", details.transactionId],
          ["Amount Paid", `$${details.amount}`],
          ["Validity", `${details.validityDays} days`],
          ["Expires", details.endDate ? new Date(details.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>{label}</span>
            <span style={{ fontWeight: 700, color: "#111827" }}>{val}</span>
          </div>
        ))}
      </div>

      <button onClick={onGoHome}
        style={{ background: "#111827", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Go to Home →
      </button>
    </div>
  </div>
);

/* ====================================================================
   MAIN PAGE
   ==================================================================== */
const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const [step, setStep] = useState(1); // 1=choose plan, 2=configure services, 3=checkout
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("wedding-subscriptions/plans");
        if (res.success) setPlans(res.data || []);
      } catch (e) {
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 80);
      }
    })();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedServices([]);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFreeActivation = async (amount, services) => {
    setProcessingPayment(true);
    try {
      const data = await apiFetch("wedding-subscriptions/orders", {
        method: "POST",
        headers: authHeaders(getActiveToken()),
        body: JSON.stringify({
          planId: selectedPlan._id,
          selectedServices: services,
          couponCode: appliedCoupon?.offerDetails?.code || couponCode,
          paymentMethod: "FREE",
        }),
      });
      if (!data.success) throw new Error(data.message);
      setSuccessDetails({
        planName: selectedPlan.planName,
        transactionId: data.data?.transactionId || `FREE_${Date.now()}`,
        amount: 0,
        validityDays: selectedPlan.validityDays,
        endDate: data.data?.activation?.end,
      });
    } catch (e) {
      toast.error(e.message || "Activation failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSquarePayment = async (squareToken, amount, services) => {
    setProcessingPayment(true);
    try {
      // Create order first
      const orderData = await apiFetch("wedding-subscriptions/orders", {
        method: "POST",
        headers: authHeaders(getActiveToken()),
        body: JSON.stringify({
          planId: selectedPlan._id,
          selectedServices: services,
          couponCode: appliedCoupon?.offerDetails?.code || couponCode,
          paymentMethod: "SQUARE",
        }),
      });
      if (!orderData.success) throw new Error(orderData.message);
      const orderId = orderData.data?.orderId;

      // Confirm payment (Square token already obtained from SquarePaymentForm)
      const confirmData = await apiFetch(`wedding-subscriptions/orders/${orderId}/confirm-payment`, {
        method: "PATCH",
        headers: authHeaders(getActiveToken()),
        body: JSON.stringify({ squarePaymentId: squareToken, transactionId: squareToken }),
      });
      if (!confirmData.success) throw new Error(confirmData.message);

      setSuccessDetails({
        planName: selectedPlan.planName,
        transactionId: confirmData.data?.transactionId || squareToken,
        amount,
        validityDays: selectedPlan.validityDays,
        endDate: confirmData.data?.activation?.end,
      });
      toast.success("Plan activated successfully!");
    } catch (e) {
      toast.error(e.message || "Payment failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  /* ── Step navigation bar ── */
  const StepBar = () => {
    const steps = ["Choose Plan", "Configure Services", "Review & Pay"];
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const isActive = step === n;
          const isDone = step > n;
          return (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: isDone ? 0.6 : isActive ? 1 : 0.4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: isDone ? "#10b981" : isActive ? "#111827" : "#e5e7eb",
                  color: isDone || isActive ? "#fff" : "#9ca3af",
                }}>
                  {isDone ? "✓" : n}
                </div>
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#111827" : "#9ca3af", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 36, height: 1, background: step > n + 1 ? "#10b981" : "#e5e7eb", margin: "0 6px" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /* ─── Success ─── */
  if (successDetails) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdf7f3 0%, #fce8f0 100%)", padding: "40px 16px" }}>
        <SuccessScreen details={successDetails} onGoHome={() => navigate("/")} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdf7f3 0%, #fce8f0 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #f9e8ee", borderTopColor: "#D4426A", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading plans…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fdf7f3 0%, #fde8ef 35%, #f3e8ff 70%, #e8f4ff 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "fixed", top: -120, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,66,106,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "48px 24px",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s ease-out",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2, marginBottom: 12 }}>
              Wedding Subscription Plans
            </div>
            <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
              Choose a plan tailored to your dream wedding — from curated bundles to fully custom packages.
            </p>
          </div>

          {/* Step bar (only show when plan selected) */}
          {selectedPlan && <StepBar />}

          {/* ── STEP 1: Plan Grid ── */}
          {step === 1 && (
            <>
              {plans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <p>No plans available at the moment. Please check back soon.</p>
                </div>
              ) : (
                <div style={{
                  display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 28,
                  marginTop: 8, paddingTop: 20,
                }}>
                  {plans.map((plan, idx) => (
                    <div key={plan._id} style={{ animation: `slideUp 0.5s cubic-bezier(.22,1,.36,1) ${idx * 100}ms both` }}>
                      <PlanCard plan={plan} onSelect={handlePlanSelect} isSelected={selectedPlan?._id === plan._id} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Service Configurator ── */}
          {step === 2 && selectedPlan && (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ background: "#fff", borderRadius: 28, padding: 32, boxShadow: "0 12px 48px rgba(0,0,0,0.08)", border: "1.5px solid #f3f4f6" }}>
                {/* Back */}
                <button onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", marginBottom: 20, fontWeight: 600 }}>
                  ← Back to plans
                </button>

                <ServiceCustomizer
                  plan={selectedPlan}
                  selectedServices={selectedServices}
                  onServicesChange={setSelectedServices}
                />

                <button
                  onClick={() => setStep(3)}
                  style={{
                    marginTop: 28, width: "100%", padding: "15px 24px", borderRadius: 16, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${getTheme(selectedPlan.theme?.gradient).from}, ${getTheme(selectedPlan.theme?.gradient).to})`,
                    color: "#fff", fontWeight: 700, fontSize: 15,
                    boxShadow: `0 8px 24px ${getTheme(selectedPlan.theme?.gradient).accent}40`,
                  }}
                >
                  Continue to Checkout →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Checkout ── */}
          {step === 3 && selectedPlan && (
            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <div style={{ background: "#fff", borderRadius: 28, padding: 32, boxShadow: "0 12px 48px rgba(0,0,0,0.08)", border: "1.5px solid #f3f4f6" }}>
                <button onClick={() => setStep(2)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", marginBottom: 20, fontWeight: 600 }}>
                  ← Back to services
                </button>
                <CheckoutPanel
                  plan={selectedPlan}
                  selectedServices={selectedServices}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  appliedCoupon={appliedCoupon}
                  setAppliedCoupon={setAppliedCoupon}
                  processingPayment={processingPayment}
                  onFree={handleFreeActivation}
                  onPay={handleSquarePayment}
                />
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(32px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
};

export default SubscriptionPlans;
